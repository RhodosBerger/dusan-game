package engine

import "errors"

// EnvironmentNode represents a grid tile for weather calculations
type EnvironmentNode struct {
	ChunkID      int     `json:"chunkId"`
	BlockID      int     `json:"blockId"`
	Friction     float64 `json:"friction"`
	Conductivity float64 `json:"conductivity"`
	HazardIndex  float64 `json:"hazardIndex"`
	Walkable     bool    `json:"walkable"`
}

// EnvironmentFluxRequest describes start weather and grid
type EnvironmentFluxRequest struct {
	Weather string            `json:"weather"`
	Grid    []EnvironmentNode `json:"grid"`
}

// EnvironmentFluxResponse returns mutated nodes
type EnvironmentFluxResponse struct {
	Success bool              `json:"success"`
	Grid    []EnvironmentNode `json:"grid"`
	Logs    string            `json:"logs"`
}

// CalculateFlux mutates nodes physics parameters based on active weather (Goal 9)
func CalculateFlux(req EnvironmentFluxRequest) (*EnvironmentFluxResponse, error) {
	if len(req.Grid) == 0 {
		return nil, errors.New("grid data cannot be empty")
	}

	mutatedGrid := make([]EnvironmentNode, len(req.Grid))
	copy(mutatedGrid, req.Grid)

	for i := range mutatedGrid {
		node := &mutatedGrid[i]
		if req.Weather == "TOXIC_STORM" {
			node.HazardIndex = 0.8
			node.Conductivity = 0.9
		} else if req.Weather == "BLIZZARD" {
			node.Friction = 2.0
			node.HazardIndex = 0.4
		} else {
			// CLEAR - Nominal reset
			node.Friction = 1.0
			node.HazardIndex = 0.0
			node.Conductivity = 0.5
		}
	}

	return &EnvironmentFluxResponse{
		Success: true,
		Grid:    mutatedGrid,
		Logs:    "Authoritative Go Core environment flux resolved.",
	}, nil
}
