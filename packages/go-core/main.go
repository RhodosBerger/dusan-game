package main

import (
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
	"dusan-game/go-core/engine"
)

// ── Synthesizer Request / Response Structures ────────────────────────────────
type SynthesizeRequest struct {
	MetaId int `json:"metaId"`
	HexId  int `json:"hexId"`
}

type BatchSynthesizeRequest struct {
	Blocks []SynthesizeRequest `json:"blocks"`
}

// ── Combat Telemetry Structures (GPS, Geolocation, Magnitude, Manner) ───────
type CombatEvent struct {
	ID         string    `json:"id"`
	MatchID    string    `json:"matchId"`
	PlayerID   string    `json:"playerId"`
	ActionType string    `json:"actionType"` // "attack", "defense", "spell"
	CardID     string    `json:"cardId"`
	Magnitude  float64   `json:"magnitude"`  // Voltage / Power load
	ChunkID    int       `json:"chunkId"`
	HexID      int       `json:"hexId"`
	GPSLat     float64   `json:"gpsLat"`
	GPSLng     float64   `json:"gpsLng"`
	Timestamp  time.Time `json:"timestamp"`
}

type CombatTelemetryStore struct {
	mu     sync.RWMutex
	Events []CombatEvent
}

var telemetryStore = &CombatTelemetryStore{
	Events: make([]CombatEvent, 0),
}

// ── Vision Telemetry Structures (OpenVINO PC Vision Pipeline) ────────────────
type VisionEvent struct {
	SessionID       string    `json:"session_id"`
	EventType       string    `json:"event_type"`
	TelemetryTheory string    `json:"telemetry_theory"`
	Timestamp       time.Time `json:"timestamp"`
}

type VisionTelemetryStore struct {
	mu     sync.RWMutex
	Events []VisionEvent
}

var visionStore = &VisionTelemetryStore{
	Events: make([]VisionEvent, 0),
}


// ── GPS Geolocation Helper ──────────────────────────────────────────────────
func calculateGPS(chunkId, hexId int) (float64, float64) {
	// Maps hex coordinates to mock GPS coordinates centered around regional coordinates
	lat := 48.1485 + float64(chunkId)*0.005 + float64(hexId)*0.0008
	lng := 17.1077 + float64(chunkId)*-0.003 + float64(hexId)*0.0012
	return lat, lng
}

// ── CORS Utility ─────────────────────────────────────────────────────────────
func setupCORS(w http.ResponseWriter, r *http.Request) bool {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return true
	}
	return false
}

// ── Endpoint Handlers ────────────────────────────────────────────────────────

func handleSynthesize(w http.ResponseWriter, r *http.Request) {
	if setupCORS(w, r) {
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST is supported", http.StatusMethodNotAllowed)
		return
	}

	var req SynthesizeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	result := engine.SynthesizeBlock(req.MetaId, req.HexId)
	biomeInfo := engine.GetBiomeForHex(req.MetaId, req.HexId)

	responsePayload := map[string]interface{}{
		"metaId":               req.MetaId,
		"hexId":                req.HexId,
		"biome":                biomeInfo.Biome,
		"temperature":          biomeInfo.Temperature,
		"humidity":             biomeInfo.Humidity,
		"color":                biomeInfo.Color,
		"friction":             biomeInfo.Friction,
		"conductivity":         biomeInfo.Conductivity,
		"colorSaturation":      result.ColorSaturation,
		"textureDensity":       result.TextureDensity,
		"lightEmission":        result.LightEmission,
		"contrastRatio":        result.ContrastRatio,
		"particleRate":         result.ParticleRate,
		"walkable":             result.Walkable,
		"energyCostMultiplier": result.EnergyCostMultiplier,
		"rangeModifier":        result.RangeModifier,
		"hazardIndex":          result.HazardIndex,
		"lootProbability":      result.LootProbability,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(responsePayload)
}

func handleSynthesizeBatch(w http.ResponseWriter, r *http.Request) {
	if setupCORS(w, r) {
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST is supported", http.StatusMethodNotAllowed)
		return
	}

	var req BatchSynthesizeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	results := make([]map[string]interface{}, 0, len(req.Blocks))
	for _, blockReq := range req.Blocks {
		result := engine.SynthesizeBlock(blockReq.MetaId, blockReq.HexId)
		biomeInfo := engine.GetBiomeForHex(blockReq.MetaId, blockReq.HexId)

		results = append(results, map[string]interface{}{
			"metaId":               blockReq.MetaId,
			"hexId":                blockReq.HexId,
			"biome":                biomeInfo.Biome,
			"temperature":          biomeInfo.Temperature,
			"humidity":             biomeInfo.Humidity,
			"color":                biomeInfo.Color,
			"friction":             biomeInfo.Friction,
			"conductivity":         biomeInfo.Conductivity,
			"colorSaturation":      result.ColorSaturation,
			"textureDensity":       result.TextureDensity,
			"lightEmission":        result.LightEmission,
			"contrastRatio":        result.ContrastRatio,
			"particleRate":         result.ParticleRate,
			"walkable":             result.Walkable,
			"energyCostMultiplier": result.EnergyCostMultiplier,
			"rangeModifier":        result.RangeModifier,
			"hazardIndex":          result.HazardIndex,
			"lootProbability":      result.LootProbability,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

// POST /api/telemetry/combat - Register a combat log event
func handlePostTelemetry(w http.ResponseWriter, r *http.Request) {
	if setupCORS(w, r) {
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST is supported", http.StatusMethodNotAllowed)
		return
	}

	var ev CombatEvent
	if err := json.NewDecoder(r.Body).Decode(&ev); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Calculate mock GPS values dynamically based on combat hex
	lat, lng := calculateGPS(ev.ChunkID, ev.HexID)
	ev.GPSLat = lat
	ev.GPSLng = lng
	ev.Timestamp = time.Now()
	if ev.ID == "" {
		ev.ID = fmt.Sprintf("tx_%d_%d", time.Now().UnixNano(), ev.ChunkID)
	}

	telemetryStore.mu.Lock()
	telemetryStore.Events = append(telemetryStore.Events, ev)
	telemetryStore.mu.Unlock()

	fmt.Printf("[TELEMETRY] Logged %s combat event at Lat: %.4f, Lng: %.4f (Mag: %.1f)\n", ev.ActionType, ev.GPSLat, ev.GPSLng, ev.Magnitude)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
		"event":  ev,
	})
}

// GET /api/telemetry/combat - Fetch raw telemetry list
func handleGetTelemetry(w http.ResponseWriter, r *http.Request) {
	if setupCORS(w, r) {
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "Only GET is supported", http.StatusMethodNotAllowed)
		return
	}

	telemetryStore.mu.RLock()
	defer telemetryStore.mu.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(telemetryStore.Events)
}

// GET /api/telemetry/analytics - Big Data aggregated stats
func handleGetAnalytics(w http.ResponseWriter, r *http.Request) {
	if setupCORS(w, r) {
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "Only GET is supported", http.StatusMethodNotAllowed)
		return
	}

	telemetryStore.mu.RLock()
	defer telemetryStore.mu.RUnlock()

	totalEvents := len(telemetryStore.Events)
	mannerCounts := map[string]int{
		"attack":  0,
		"defense": 0,
		"spell":   0,
	}
	chunkCounts := make(map[int]int)
	var sumMagnitude float64 = 0.0

	for _, ev := range telemetryStore.Events {
		mannerCounts[ev.ActionType]++
		chunkCounts[ev.ChunkID]++
		sumMagnitude += ev.Magnitude
	}

	avgMagnitude := 0.0
	if totalEvents > 0 {
		avgMagnitude = sumMagnitude / float64(totalEvents)
	}

	analyticsResponse := map[string]interface{}{
		"totalCombatEvents": totalEvents,
		"avgMagnitude":      avgMagnitude,
		"mannerDistribution": mannerCounts,
		"chunkDistribution":  chunkCounts,
		"analyzedAt":        time.Now(),
		"version":           "BigData-V1.0",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(analyticsResponse)
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	if setupCORS(w, r) {
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Go Core is running!"))
}

func handleRoot(w http.ResponseWriter, r *http.Request) {
	if setupCORS(w, r) {
		return
	}
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	response := map[string]string{
		"status":    "online",
		"service":   "The Last Tribe Go Core (Heavy Math, ML Biomes & Pathfinding)",
		"version":   "1.1.0",
		"endpoints": "/health, /api/synthesize, /api/synthesize/batch, /api/telemetry/combat, /api/telemetry/vision, /api/telemetry/analytics, /api/physics/solve, /api/tensor/infer-unknown",
	}
	json.NewEncoder(w).Encode(response)
}

func handleSolve(w http.ResponseWriter, r *http.Request) {
	if setupCORS(w, r) {
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST is supported", http.StatusMethodNotAllowed)
		return
	}

	var req engine.SolveRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	res, err := engine.SolveRuleOfThree(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func handleInfer(w http.ResponseWriter, r *http.Request) {
	if setupCORS(w, r) {
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST is supported", http.StatusMethodNotAllowed)
		return
	}

	var req engine.InferUnknownRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	res, err := engine.InferTensorUnknowns(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func handleVisionTelemetry(w http.ResponseWriter, r *http.Request) {
	if setupCORS(w, r) {
		return
	}
	if r.Method == http.MethodPost {
		var ev VisionEvent
		if err := json.NewDecoder(r.Body).Decode(&ev); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		ev.Timestamp = time.Now()
		visionStore.mu.Lock()
		visionStore.Events = append(visionStore.Events, ev)
		visionStore.mu.Unlock()

		fmt.Printf("[OPENVINO TELEMETRY] Logged vision event for session %s (Type: %s)\n", ev.SessionID, ev.EventType)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"status": "success"})
	} else if r.Method == http.MethodGet {
		visionStore.mu.RLock()
		defer visionStore.mu.RUnlock()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(visionStore.Events)
	} else {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

type PhysicsCostRequest struct {
	BaseCost float64 `json:"baseCost"`
	MetaId   int     `json:"metaId"`
	HexId    int     `json:"hexId"`
}

type PhysicsCostResponse struct {
	Cost           int     `json:"cost"`
	CostMultiplier float64 `json:"costMultiplier"`
}

func handlePhysicsCost(w http.ResponseWriter, r *http.Request) {
	if setupCORS(w, r) {
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST is supported", http.StatusMethodNotAllowed)
		return
	}

	var req PhysicsCostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	synth := engine.SynthesizeBlock(req.MetaId, req.HexId)
	costMultiplier := synth.EnergyCostMultiplier

	cost := int(math.Round(req.BaseCost * 15.0 * costMultiplier))

	resp := PhysicsCostResponse{
		Cost:           cost,
		CostMultiplier: costMultiplier,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

type CombatResolveRequest struct {
	Damage           float64 `json:"damage"`
	AttackerHeroId   string  `json:"attackerHeroId"`
	DefenderHeroId   string  `json:"defenderHeroId"`
	DefenderArmor    float64 `json:"defenderArmor"`
	ReactionsCount   int     `json:"reactionsCount"`
	IsSnakeOrStealth bool    `json:"isSnakeOrStealth"`
}

type CombatResolveResponse struct {
	FinalDamage int    `json:"finalDamage"`
	BaseArmor   float64 `json:"baseArmor"`
	Log         string `json:"log"`
}

func handleCombatResolve(w http.ResponseWriter, r *http.Request) {
	if setupCORS(w, r) {
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST is supported", http.StatusMethodNotAllowed)
		return
	}

	var req CombatResolveRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// 1. Calculate combo damage reduction
	k := 0.35
	reduction := 1.0 - math.Exp(-k*(req.DefenderArmor+float64(req.ReactionsCount)*0.5))
	comboFactor := 1.0 - reduction
	if comboFactor < 0.1 {
		comboFactor = 0.1
	}

	netDamage := req.Damage * comboFactor

	// 2. Dice Rolls (Attacker & Defender sides)
	attackerSides := 12
	if req.AttackerHeroId != "" && (contains(req.AttackerHeroId, "scout") || contains(req.AttackerHeroId, "harbinger") || contains(req.AttackerHeroId, "vanguard")) {
		attackerSides = 6
	}
	defenderSides := 12
	if req.DefenderHeroId != "" && (contains(req.DefenderHeroId, "scout") || contains(req.DefenderHeroId, "harbinger") || contains(req.DefenderHeroId, "vanguard")) {
		defenderSides = 6
	}

	attackerRoll := rand.Intn(attackerSides) + 1
	defenderRoll := rand.Intn(defenderSides) + 1

	// 3. Contested comparison
	condition := "MORE"
	if req.IsSnakeOrStealth {
		condition = "LESS"
	}

	success := false
	if condition == "MORE" {
		success = attackerRoll > defenderRoll
	} else {
		success = attackerRoll < defenderRoll
	}

	finalDmg := netDamage
	var rollLog string
	if success {
		finalDmg = math.Round(netDamage * 1.5)
		rollLog = fmt.Sprintf("Contested Roll Success! Attacker rolled %d vs Defender's %d (%s condition met). Damage amplified to %.0f (1.5x).", attackerRoll, defenderRoll, condition, finalDmg)
	} else {
		finalDmg = math.Round(netDamage * 0.5)
		if finalDmg < 1 {
			finalDmg = 1
		}
		rollLog = fmt.Sprintf("Contested Roll Failed! Attacker rolled %d vs Defender's %d (%s condition NOT met). Damage mitigated to %.0f (0.5x).", attackerRoll, defenderRoll, condition, finalDmg)
	}

	resp := CombatResolveResponse{
		FinalDamage: int(finalDmg),
		BaseArmor:   req.DefenderArmor,
		Log:         rollLog,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func contains(s, substr string) bool {
	sLower := toLower(s)
	subLower := toLower(substr)
	return len(sLower) >= len(subLower) && (indexOf(sLower, subLower) >= 0)
}

func toLower(s string) string {
	b := make([]byte, len(s))
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c >= 'A' && c <= 'Z' {
			b[i] = c + ('a' - 'A')
		} else {
			b[i] = c
		}
	}
	return string(b)
}

func indexOf(s, sub string) int {
	for i := 0; i <= len(s)-len(sub); i++ {
		if s[i:i+len(sub)] == sub {
			return i
		}
	}
	return -1
}

// ── Thread-Safe Coordinates Registry ───────────────────────────────────────
type CoordinateRegistry struct {
	mu        sync.RWMutex
	Allocated map[string]string // maps plain coords like "0x1A" to HTML5 entities like "&#48;&#120;&#49;&#65;"
}

var coordRegistry = &CoordinateRegistry{
	Allocated: make(map[string]string),
}

func convertToHTML5Entities(s string) string {
	var result string
	for _, char := range s {
		result += fmt.Sprintf("&#%d;", char)
	}
	return result
}

func handleHTMLEntities(w http.ResponseWriter, r *http.Request) {
	if setupCORS(w, r) {
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST is supported", http.StatusMethodNotAllowed)
		return
	}

	type RequestPayload struct {
		HexCoord string `json:"hexCoord"`
	}
	var req RequestPayload
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	coordRegistry.mu.Lock()
	defer coordRegistry.mu.Unlock()

	entities := convertToHTML5Entities(req.HexCoord)
	coordRegistry.Allocated[req.HexCoord] = entities

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":         true,
		"hexCoord":        req.HexCoord,
		"htmlEntity":      entities,
		"registeredCount": len(coordRegistry.Allocated),
	})
}

// ── Tag-Pair Simulation Structures ──────────────────────────────────────────
type GoLayerCritical struct {
	Width  float64 `json:"width"`
	Height float64 `json:"height"`
	Depth  float64 `json:"depth"`
}

type GoLayerStructural struct {
	Diameter     float64 `json:"diameter"`
	Height       float64 `json:"height"`
	Tessellation int     `json:"tessellation"`
}

type GoLayerCosmetic struct {
	Speed    float64 `json:"speed"`
	ColorHex string  `json:"colorHex"`
	Scale    float64 `json:"scale"`
}

type GoGeometryLayers struct {
	Critical   GoLayerCritical   `json:"critical"`
	Structural GoLayerStructural `json:"structural"`
	Cosmetic   GoLayerCosmetic   `json:"cosmetic"`
}

type GoSimulationResponse struct {
	Verb             string           `json:"verb"`
	Target           string           `json:"target"`
	HeightMultiplier float64          `json:"heightMultiplier"`
	BevelOffset      float64          `json:"bevelOffset"`
	Conductivity     float64          `json:"conductivity"`
	HazardIndex      float64          `json:"hazardIndex"`
	ColorHex         string           `json:"colorHex"`
	RotationSpeed    float64          `json:"rotationSpeed"`
	TeethCount       int              `json:"teethCount"`
	Layers           GoGeometryLayers `json:"layers"`
}

func goHashString(s string) int {
	hash := 0
	for i := 0; i < len(s); i++ {
		hash = (hash << 5) - hash + int(s[i])
		hash = hash | 0
	}
	if hash < 0 {
		return -hash
	}
	return hash
}

var goColorPalette = []string{
	"#06b6d4", // Cyan
	"#a855f7", // Purple
	"#10b981", // Emerald
	"#eab308", // Amber
	"#ef4444", // Rose
	"#3b82f6", // Blue
	"#ec4899", // Pink
}

func handleSimulation(w http.ResponseWriter, r *http.Request) {
	if setupCORS(w, r) {
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST is supported", http.StatusMethodNotAllowed)
		return
	}

	type SimulationRequest struct {
		Verb   string `json:"verb"`
		Target string `json:"target"`
	}

	var req SimulationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	verbUpper := strings.ToUpper(strings.TrimSpace(req.Verb))
	targetUpper := strings.ToUpper(strings.TrimSpace(req.Target))

	vHash := goHashString(verbUpper)
	tHash := goHashString(targetUpper)
	combinedHash := vHash ^ tHash
	if combinedHash < 0 {
		combinedHash = -combinedHash
	}

	heightMultiplier := 0.5 + (float64(combinedHash%200) / 100.0)
	bevelOffset := 0.05 + (float64(combinedHash%30) / 100.0)
	conductivity := 0.1 + (float64(combinedHash%81) / 100.0)
	hazardIndex := 0.0 + (float64(combinedHash%96) / 100.0)
	colorHex := goColorPalette[combinedHash%len(goColorPalette)]
	rotationSpeed := 0.01 + (float64(combinedHash%70) / 1000.0)
	teethCount := 6 + (combinedHash % 19)

	tess := 12
	if targetUpper == "HEX" {
		tess = 6
	} else if targetUpper == "GEAR" {
		tess = 8
	}

	layers := GoGeometryLayers{
		Critical: GoLayerCritical{
			Width:  0.8 + (float64(combinedHash%40) / 100.0),
			Height: heightMultiplier * 0.9,
			Depth:  0.8 + (float64(combinedHash%40) / 100.0),
		},
		Structural: GoLayerStructural{
			Diameter:     1.0 + (float64(combinedHash%50) / 100.0),
			Height:       heightMultiplier,
			Tessellation: tess,
		},
		Cosmetic: GoLayerCosmetic{
			Speed:    rotationSpeed,
			ColorHex: colorHex,
			Scale:    1.0 + bevelOffset,
		},
	}

	resp := GoSimulationResponse{
		Verb:             verbUpper,
		Target:           targetUpper,
		HeightMultiplier: heightMultiplier,
		BevelOffset:      bevelOffset,
		Conductivity:     conductivity,
		HazardIndex:      hazardIndex,
		ColorHex:         colorHex,
		RotationSpeed:    rotationSpeed,
		TeethCount:       teethCount,
		Layers:           layers,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func handleStateInit(w http.ResponseWriter, r *http.Request) {
	if setupCORS(w, r) {
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST is supported", http.StatusMethodNotAllowed)
		return
	}

	threads := []engine.Thread{
		{ID: "thread_king_ai", Name: "AI Overlord", Type: "PLAYER", Health: 30, MaxHealth: 30, Energy: 100},
		{ID: "thread_hacker_root", Name: "Root Hacker", Type: "AI", Health: 30, MaxHealth: 30, Energy: 100},
	}

	state := &engine.StateEngine{
		MatchID:        "match_simulation_01",
		TurnsElapsed:   1,
		ActivePhase:    "ACTION",
		ActivePlayerID: "thread_king_ai",
		SystemEnergy:   80,
		Threads:        threads,
		PlayedVoltage:  0.0,
		PlayedResist:   0.0,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(state)
}

func handleStateResolveAction(w http.ResponseWriter, r *http.Request) {
	if setupCORS(w, r) {
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST is supported", http.StatusMethodNotAllowed)
		return
	}

	type ActionRequest struct {
		State  engine.StateEngine  `json:"state"`
		Action engine.ActionPayload `json:"action"`
	}

	var req ActionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	resp, err := req.State.ResolveAction(req.Action)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func main() {
	http.HandleFunc("/", handleRoot)
	http.HandleFunc("/api/physics/energy-cost", handlePhysicsCost)
	http.HandleFunc("/api/combat/resolve", handleCombatResolve)
	http.HandleFunc("/api/physics/solve", handleSolve)
	http.HandleFunc("/api/tensor/infer-unknown", handleInfer)
	http.HandleFunc("/api/synthesize", handleSynthesize)
	http.HandleFunc("/api/synthesize/batch", handleSynthesizeBatch)
	http.HandleFunc("/api/telemetry/combat", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlePostTelemetry(w, r)
		} else {
			handleGetTelemetry(w, r)
		}
	})
	http.HandleFunc("/api/telemetry/vision", handleVisionTelemetry)
	http.HandleFunc("/api/telemetry/analytics", handleGetAnalytics)
	http.HandleFunc("/api/scenarios/html5-entities", handleHTMLEntities)
	http.HandleFunc("/api/simulation/geometry-nodes", handleSimulation)
	http.HandleFunc("/api/state/init", handleStateInit)
	http.HandleFunc("/api/state/resolve-action", handleStateResolveAction)
	http.HandleFunc("/api/pathfinding/search", handlePathfinding)
	http.HandleFunc("/api/health", handleHealth)
	http.HandleFunc("/health", handleHealth)

	port := 8081
	fmt.Printf("[GO_CORE] Spúšťam vysokovýkonné Go jadro na porte %d...\n", port)
	if err := http.ListenAndServe(":"+strconv.Itoa(port), nil); err != nil {
		fmt.Printf("[GO_CORE] Chyba servera: %v\n", err)
	}
}
