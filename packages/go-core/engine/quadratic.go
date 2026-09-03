package engine

import (
	"math"
	"math/rand"
	"sync"
	"time"
)

// QuadraticSuperposition represents a layered probability state
type QuadraticSuperposition struct {
	ID          string
	Coefficients []float64
	Phase       float64
	Frequency   float64
	Amplitude   float64
	Active      bool
	CreatedAt   time.Time
}

// SuperpositionLayer represents a single layer in the quadratic system
type SuperpositionLayer struct {
	ID           string
	Name         string
	Depth        int
	Superpositions []*QuadraticSuperposition
	BlendMode    string // "additive", "multiplicative", "max", "min"
	Weight       float64
}

// QuadraticEngine manages superposition states for procedural generation
type QuadraticEngine struct {
	layers         map[string]*SuperpositionLayer
	mutex          sync.RWMutex
	timeOrigin     time.Time
	globalPhase    float64
	interferencePatterns map[string][]string
}

// NewQuadraticEngine creates a new quadratic superposition engine
func NewQuadraticEngine() *QuadraticEngine {
	return &QuadraticEngine{
		layers:             make(map[string]*SuperpositionLayer),
		timeOrigin:         time.Now(),
		globalPhase:        0,
		interferencePatterns: make(map[string][]string),
	}
}

// AddLayer adds a new superposition layer
func (qe *QuadraticEngine) AddLayer(id, name string, depth int, blendMode string, weight float64) {
	qe.mutex.Lock()
	defer qe.mutex.Unlock()

	qe.layers[id] = &SuperpositionLayer{
		ID:             id,
		Name:           name,
		Depth:          depth,
		Superpositions: make([]*QuadraticSuperposition, 0),
		BlendMode:      blendMode,
		Weight:         weight,
	}
}

// AddSuperposition adds a quadratic superposition to a layer
func (qe *QuadraticEngine) AddSuperposition(layerID, id string, coefficients []float64, frequency, amplitude float64) {
	qe.mutex.Lock()
	defer qe.mutex.Unlock()

	layer, exists := qe.layers[layerID]
	if !exists {
		return
	}

	superposition := &QuadraticSuperposition{
		ID:           id,
		Coefficients: coefficients,
		Phase:        rand.Float64() * 2 * math.Pi,
		Frequency:    frequency,
		Amplitude:    amplitude,
		Active:       true,
		CreatedAt:    time.Now(),
	}

	layer.Superpositions = append(layer.Superpositions, superposition)
}

// Evaluate calculates the combined value at a given time point
func (qe *QuadraticEngine) Evaluate(layerIDs []string, t float64) float64 {
	qe.mutex.RLock()
	defer qe.mutex.RUnlock()

	totalValue := 0.0
	totalWeight := 0.0

	for _, layerID := range layerIDs {
		layer, exists := qe.layers[layerID]
		if !exists {
			continue
		}

		layerValue := qe.evaluateLayer(layer, t)
		
		switch layer.BlendMode {
		case "additive":
			totalValue += layerValue * layer.Weight
		case "multiplicative":
			if totalValue != 0 {
				totalValue *= (1 + layerValue*layer.Weight)
			} else {
				totalValue = layerValue * layer.Weight
			}
		case "max":
			if layerValue*layer.Weight > totalValue {
				totalValue = layerValue * layer.Weight
			}
		case "min":
			if totalValue == 0 || layerValue*layer.Weight < totalValue {
				totalValue = layerValue * layer.Weight
			}
		default:
			totalValue += layerValue * layer.Weight
		}

		totalWeight += layer.Weight
	}

	if totalWeight > 0 {
		return totalValue / totalWeight
	}
	return 0
}

// evaluateLayer calculates the value for a single layer
func (qe *QuadraticEngine) evaluateLayer(layer *SuperpositionLayer, t float64) float64 {
	if len(layer.Superpositions) == 0 {
		return 0
	}

	total := 0.0
	elapsedTime := t - qe.timeOrigin.Seconds()

	for _, sp := range layer.Superpositions {
		if !sp.Active {
			continue
		}

		// Quadratic wave function: a*t² + b*t + c + amplitude*sin(2π*f*t + phase)
		value := sp.Coefficients[0]*elapsedTime*elapsedTime
		if len(sp.Coefficients) > 1 {
			value += sp.Coefficients[1]*elapsedTime
		}
		if len(sp.Coefficients) > 2 {
			value += sp.Coefficients[2]
		}

		// Add sinusoidal component
		value += sp.Amplitude * math.Sin(2*math.Pi*sp.Frequency*elapsedTime+sp.Phase)

		total += value
	}

	return total / float64(len(layer.Superpositions))
}

// CreateInterferencePattern links multiple superpositions to create interference
func (qe *QuadraticEngine) CreateInterferencePattern(id string, superpositionIDs []string) {
	qe.mutex.Lock()
	defer qe.mutex.Unlock()
	qe.interferencePatterns[id] = superpositionIDs
}

// EvaluateInterference calculates interference pattern value
func (qe *QuadraticEngine) EvaluateInterference(patternID string, t float64) float64 {
	qe.mutex.RLock()
	defer qe.mutex.RUnlock()

	superpositionIDs, exists := qe.interferencePatterns[patternID]
	if !exists {
		return 0
	}

	// Collect all superpositions in the pattern
	var values []float64
	elapsedTime := t - qe.timeOrigin.Seconds()

	for _, spID := range superpositionIDs {
		for _, layer := range qe.layers {
			for _, sp := range layer.Superpositions {
				if sp.ID == spID && sp.Active {
					value := sp.Amplitude * math.Sin(2*math.Pi*sp.Frequency*elapsedTime+sp.Phase)
					values = append(values, value)
				}
			}
		}
	}

	if len(values) < 2 {
		return 0
	}

	// Calculate interference (constructive/destructive)
	interference := 0.0
	for i := 0; i < len(values); i++ {
		for j := i + 1; j < len(values); j++ {
			// Wave interference formula
			interference += values[i] + values[j] + 2*math.Sqrt(math.Abs(values[i]*values[j]))*
				math.Cos((values[i]-values[j])*math.Pi)
		}
	}

	return interference / float64(len(values)*(len(values)-1)/2)
}

// GenerateProceduralContent uses superposition to generate content parameters
func (qe *QuadraticEngine) GenerateProceduralContent(layerIDs []string, t float64) map[string]interface{} {
	baseValue := qe.Evaluate(layerIDs, t)
	
	// Normalize to 0-1 range
	normalized := (math.Sin(baseValue) + 1) / 2

	content := map[string]interface{}{
		"terrain_roughness": normalized,
		"enemy_density":     normalized * 0.8,
		"loot_rarity":       1.0 - normalized*0.6,
		"ambient_intensity": normalized * 1.5,
		"color_shift":       baseValue * 10,
		"timestamp":         t,
	}

	// Add interference effects if any
	for patternID := range qe.interferencePatterns {
		interferenceValue := qe.EvaluateInterference(patternID, t)
		content["interference_"+patternID] = interferenceValue
	}

	return content
}

// UpdateGlobalPhase updates the global phase offset
func (qe *QuadraticEngine) UpdateGlobalPhase(phase float64) {
	qe.mutex.Lock()
	defer qe.mutex.Unlock()
	qe.globalPhase = phase
}

// GetLayerStats returns statistics about a layer
func (qe *QuadraticEngine) GetLayerStats(layerID string) map[string]interface{} {
	qe.mutex.RLock()
	defer qe.mutex.RUnlock()

	layer, exists := qe.layers[layerID]
	if !exists {
		return nil
	}

	activeCount := 0
	totalAmplitude := 0.0
	avgFrequency := 0.0

	for _, sp := range layer.Superpositions {
		if sp.Active {
			activeCount++
			totalAmplitude += sp.Amplitude
			avgFrequency += sp.Frequency
		}
	}

	if activeCount > 0 {
		avgFrequency /= float64(activeCount)
	}

	return map[string]interface{}{
		"layer_id":        layerID,
		"layer_name":      layer.Name,
		"total_superpositions": len(layer.Superpositions),
		"active_count":    activeCount,
		"total_amplitude": totalAmplitude,
		"avg_frequency":   avgFrequency,
		"blend_mode":      layer.BlendMode,
		"weight":          layer.Weight,
		"depth":           layer.Depth,
	}
}

// RemoveSuperposition deactivates a superposition
func (qe *QuadraticEngine) RemoveSuperposition(layerID, spID string) bool {
	qe.mutex.Lock()
	defer qe.mutex.Unlock()

	layer, exists := qe.layers[layerID]
	if !exists {
		return false
	}

	for _, sp := range layer.Superpositions {
		if sp.ID == spID {
			sp.Active = false
			return true
		}
	}

	return false
}

// GetAllLayers returns all layer IDs
func (qe *QuadraticEngine) GetAllLayers() []string {
	qe.mutex.RLock()
	defer qe.mutex.RUnlock()

	ids := make([]string, 0, len(qe.layers))
	for id := range qe.layers {
		ids = append(ids, id)
	}
	return ids
}
