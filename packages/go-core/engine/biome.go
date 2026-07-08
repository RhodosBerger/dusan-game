package engine

import (
	"math"
)

type Offset struct {
	Q, R int
}

type BiomeDetails struct {
	Biome        string  `json:"biome"`
	Temperature  float64 `json:"temperature"`
	Humidity     float64 `json:"humidity"`
	Color        string  `json:"color"`
	Friction     float64 `json:"friction"`
	Conductivity float64 `json:"conductivity"`
	Walkable     bool    `json:"walkable"`
}

func GetHexCoordinates(metaId, hexId int) Offset {
	macroCenters := []Offset{
		{0, 0},   {3, -1},  {6, -2},
		{-1, 3},  {2, 2},   {5, 1},
		{-2, 6},  {1, 5},   {4, 4},
	}

	subHexOffsets := []Offset{
		{0, 0},
		{1, 0},   {1, -1},  {0, -1},
		{-1, 0},  {-1, 1},  {0, 1},
	}

	var macro Offset
	if metaId >= 0 && metaId < len(macroCenters) {
		macro = macroCenters[metaId]
	}

	var offset Offset
	if hexId >= 0 && hexId < len(subHexOffsets) {
		offset = subHexOffsets[hexId]
	}

	return Offset{
		Q: macro.Q + offset.Q,
		R: macro.R + offset.R,
	}
}

func GetBiomeForCoords(q, r int) BiomeDetails {
	qF := float64(q)
	rF := float64(r)

	temperature := math.Sin(qF*0.5)*math.Cos(rF*0.5)*0.5 + 0.5
	humidity := math.Cos(qF*0.4+1.0)*math.Sin(rF*0.4-0.5)*0.5 + 0.5

	biome := "LUSH_FOREST"
	color := "#2e8b57"
	friction := 1.0
	conductivity := 0.8
	walkable := true

	if temperature < 0.35 {
		biome = "GLACIER"
		color = "#add8e6"
		friction = 0.8
		conductivity = 0.2
	} else if temperature > 0.65 {
		if humidity > 0.55 {
			biome = "TOXIC_SWAMP"
			color = "#4b0082"
			friction = 1.6
			conductivity = 0.9
		} else {
			biome = "DESERT"
			color = "#edc9af"
			friction = 1.2
			conductivity = 0.4
		}
	} else {
		if humidity < 0.35 {
			biome = "BARRENS"
			color = "#708090"
			friction = 1.0
			conductivity = 0.6
		}
	}

	return BiomeDetails{
		Biome:        biome,
		Temperature:  temperature,
		Humidity:     humidity,
		Color:        color,
		Friction:     friction,
		Conductivity: conductivity,
		Walkable:     walkable,
	}
}

func GetBiomeForHex(metaId, hexId int) BiomeDetails {
	coords := GetHexCoordinates(metaId, hexId)
	return GetBiomeForCoords(coords.Q, coords.R)
}
