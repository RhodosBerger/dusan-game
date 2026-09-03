package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
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

func main() {
	http.HandleFunc("/", handleRoot)
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
	http.HandleFunc("/health", handleHealth)

	port := 8081
	if envPort := os.Getenv("PORT"); envPort != "" {
		if parsedPort, err := strconv.Atoi(envPort); err == nil {
			port = parsedPort
		}
	}
	fmt.Printf("[GO_CORE] Spúšťam vysokovýkonné Go jadro na porte %d...\n", port)
	if err := http.ListenAndServe(":"+strconv.Itoa(port), nil); err != nil {
		fmt.Printf("[GO_CORE] Chyba servera: %v\n", err)
	}
}
