package engine

import (
	"math"
)

type MLSynthesisResult struct {
	ColorSaturation      float64 `json:"colorSaturation"`
	TextureDensity       float64 `json:"textureDensity"`
	LightEmission        float64 `json:"lightEmission"`
	ContrastRatio        float64 `json:"contrastRatio"`
	ParticleRate         float64 `json:"particleRate"`
	Walkable             bool    `json:"walkable"`
	EnergyCostMultiplier float64 `json:"energyCostMultiplier"`
	RangeModifier        int     `json:"rangeModifier"`
	HazardIndex          float64 `json:"hazardIndex"`
	LootProbability      float64 `json:"lootProbability"`
}

var WAesthetic = map[string][5][5]float64{
	"GLACIER": {
		{0.8, -0.2, 0.1, 0.0, 0.5},
		{0.4, 0.6, 0.0, 0.1, 0.2},
		{0.9, -0.5, 0.2, 0.0, 0.1},
		{0.7, 0.3, -0.1, 0.1, 0.4},
		{0.8, 0.1, 0.3, 0.2, 0.6},
	},
	"TOXIC_SWAMP": {
		{0.9, 0.8, -0.2, 0.1, 0.7},
		{0.8, 0.9, 0.1, 0.0, 0.5},
		{0.7, 0.9, 0.0, -0.1, 0.8},
		{0.5, 0.5, 0.3, 0.2, 0.4},
		{0.9, 0.8, 0.4, 0.3, 0.9},
	},
	"LUSH_FOREST": {
		{0.6, 0.7, 0.1, 0.1, 0.3},
		{0.5, 0.8, 0.2, 0.1, 0.4},
		{0.2, 0.3, 0.0, 0.0, 0.1},
		{0.5, 0.5, 0.1, 0.1, 0.2},
		{0.4, 0.6, 0.2, 0.2, 0.3},
	},
	"DESERT": {
		{0.7, -0.5, 0.3, 0.2, 0.4},
		{0.3, -0.4, 0.1, 0.1, 0.2},
		{0.1, -0.2, 0.0, 0.0, 0.0},
		{0.6, -0.3, 0.2, 0.1, 0.3},
		{0.7, -0.1, 0.4, 0.4, 0.5},
	},
	"BARRENS": {
		{0.4, -0.6, 0.5, 0.3, 0.2},
		{0.7, -0.2, 0.3, 0.2, 0.6},
		{0.8, -0.4, 0.4, 0.4, 0.7},
		{0.9, -0.1, 0.2, 0.2, 0.5},
		{0.6, -0.3, 0.5, 0.5, 0.6},
	},
}

var WPractical = map[string][5][5]float64{
	"GLACIER": {
		{1.0, 0.0, 0.0, 0.0, 0.0},
		{-0.4, 0.2, 0.1, 0.1, 0.2},
		{0.1, -0.3, 0.0, 0.0, 0.2},
		{0.2, 0.1, 0.1, 0.0, 0.1},
		{0.4, 0.5, 0.2, 0.1, 0.5},
	},
	"TOXIC_SWAMP": {
		{0.8, -0.2, 0.0, 0.0, -0.1},
		{0.8, 0.9, 0.2, 0.2, 0.6},
		{-0.3, 0.4, -0.1, 0.0, -0.2},
		{0.9, 0.8, 0.3, 0.3, 0.7},
		{0.6, 0.7, 0.4, 0.2, 0.8},
	},
	"LUSH_FOREST": {
		{1.0, 0.0, 0.0, 0.0, 0.0},
		{0.0, 0.1, 0.0, 0.0, 0.1},
		{0.0, 0.0, 0.0, 0.0, 0.0},
		{0.0, 0.0, 0.0, 0.0, 0.0},
		{0.5, 0.6, 0.1, 0.1, 0.4},
	},
	"DESERT": {
		{1.0, 0.0, 0.0, 0.0, 0.0},
		{0.3, -0.1, 0.1, 0.1, 0.2},
		{0.0, -0.2, 0.1, 0.0, 0.1},
		{0.4, -0.2, 0.2, 0.1, 0.3},
		{0.3, 0.3, 0.2, 0.1, 0.3},
	},
	"BARRENS": {
		{0.9, 0.0, 0.0, 0.0, 0.0},
		{0.1, -0.3, 0.1, 0.1, 0.2},
		{0.2, -0.1, 0.0, 0.0, 0.1},
		{0.7, -0.4, 0.4, 0.3, 0.5},
		{0.4, 0.2, 0.3, 0.3, 0.6},
	},
}

var biasAesthetic = [5]float64{0.1, -0.1, 0.0, 0.2, -0.2}
var biasPractical = [5]float64{0.5, -0.2, 0.0, -0.3, 0.1}

func sigmoid(z float64) float64 {
	return 1.0 / (1.0 + math.Exp(-z))
}



func SynthesizeBlock(metaId, hexId int) MLSynthesisResult {
	coords := GetHexCoordinates(metaId, hexId)
	biomeDetails := GetBiomeForCoords(coords.Q, coords.R)

	T := biomeDetails.Temperature
	H := biomeDetails.Humidity
	qNorm := math.Abs(float64(coords.Q)) / 10.0
	rNorm := math.Abs(float64(coords.R)) / 10.0
	seed := float64((coords.Q*coords.R)%7) / 7.0

	input := [5]float64{T, H, qNorm, rNorm, seed}
	bName := biomeDetails.Biome

	Wa, ok := WAesthetic[bName]
	if !ok {
		Wa = WAesthetic["LUSH_FOREST"]
	}

	Wp, ok := WPractical[bName]
	if !ok {
		Wp = WPractical["LUSH_FOREST"]
	}

	var aesOutputs [5]float64
	for idx := 0; idx < 5; idx++ {
		dot := 0.0
		for i := 0; i < 5; i++ {
			dot += Wa[idx][i] * input[i]
		}
		aesOutputs[idx] = sigmoid(dot + biasAesthetic[idx])
	}

	var pracOutputs [5]float64
	for idx := 0; idx < 5; idx++ {
		dot := 0.0
		for i := 0; i < 5; i++ {
			dot += Wp[idx][i] * input[i]
		}
		pracOutputs[idx] = sigmoid(dot + biasPractical[idx])
	}

	walkable := pracOutputs[0] > 0.4
	energyCostMultiplier := 0.6 + pracOutputs[1]*1.9
	rangeModifier := int(math.Round((pracOutputs[2] - 0.5) * 2))
	hazardIndex := pracOutputs[3]
	lootProbability := pracOutputs[4]

	return MLSynthesisResult{
		ColorSaturation:      aesOutputs[0],
		TextureDensity:       aesOutputs[1],
		LightEmission:        aesOutputs[2],
		ContrastRatio:        aesOutputs[3],
		ParticleRate:         aesOutputs[4],
		Walkable:             walkable,
		EnergyCostMultiplier: energyCostMultiplier,
		RangeModifier:        rangeModifier,
		HazardIndex:          hazardIndex,
		LootProbability:      lootProbability,
	}
}
