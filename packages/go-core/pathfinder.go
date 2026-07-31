package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"
	"sort"
)

// PathfinderBlock represents a node in the pathfinding grid
type PathfinderBlock struct {
	ChunkID     int     `json:"chunkId"`
	BlockID     int     `json:"blockId"`
	PosX        float64 `json:"posX"`
	PosZ        float64 `json:"posZ"`
	Walkable    bool    `json:"walkable"`
	HazardIndex float64 `json:"hazardIndex"`
}

// PathfinderRequest defines start, end and grid nodes
type PathfinderRequest struct {
	StartChunk int               `json:"startChunk"`
	StartBlock int               `json:"startBlock"`
	EndChunk   int               `json:"endChunk"`
	EndBlock   int               `json:"endBlock"`
	Grid       []PathfinderBlock `json:"grid"`
}

// PathfinderResponse returns coordinates list of path
type PathfinderResponse struct {
	Success bool              `json:"success"`
	Path    []PathfinderBlock `json:"path"`
	Cost    float64           `json:"cost"`
	Logs    string            `json:"logs"`
}

// AStarNode helper for priority queue
type AStarNode struct {
	Block  PathfinderBlock
	GScore float64
	FScore float64
	Parent *AStarNode
}

// GetDistance calculates Euclidean distance between blocks
func GetDistance(a, b PathfinderBlock) float64 {
	return math.Sqrt(math.Pow(a.PosX-b.PosX, 2) + math.Pow(a.PosZ-b.PosZ, 2))
}

// FindNeighbors finds walkable blocks within neighbor distance limit (3.5)
func FindNeighbors(current PathfinderBlock, grid []PathfinderBlock) []PathfinderBlock {
	var neighbors []PathfinderBlock
	for _, block := range grid {
		if !block.Walkable {
			continue
		}
		// Skip self
		if block.ChunkID == current.ChunkID && block.BlockID == current.BlockID {
			continue
		}
		dist := GetDistance(current, block)
		// Spacing between hex center and neighbors is typically ~2.4 to 3.0
		if dist > 0.1 && dist <= 3.5 {
			neighbors = append(neighbors, block)
		}
	}
	return neighbors
}

// SolveAStar resolves A* path on hex grid
func SolveAStar(req PathfinderRequest) ([]PathfinderBlock, float64, error) {
	var startBlock *PathfinderBlock
	var endBlock *PathfinderBlock

	// Locate start & end blocks in grid
	for i := range req.Grid {
		if req.Grid[i].ChunkID == req.StartChunk && req.Grid[i].BlockID == req.StartBlock {
			startBlock = &req.Grid[i]
		}
		if req.Grid[i].ChunkID == req.EndChunk && req.Grid[i].BlockID == req.EndBlock {
			endBlock = &req.Grid[i]
		}
	}

	if startBlock == nil || endBlock == nil {
		return nil, 0, errors.New("start or end block not found in grid data")
	}

	// Initialize A* lists
	openSet := []*AStarNode{
		{
			Block:  *startBlock,
			GScore: 0.0,
			FScore: GetDistance(*startBlock, *endBlock),
			Parent: nil,
		},
	}

	closedSet := make(map[string]bool)

	for len(openSet) > 0 {
		// Sort open set to get node with lowest FScore
		sort.Slice(openSet, func(i, j int) bool {
			return openSet[i].FScore < openSet[j].FScore
		})

		current := openSet[0]
		openSet = openSet[1:]

		// Key for coordinate node
		currKey := fmtKey(current.Block.ChunkID, current.Block.BlockID)
		closedSet[currKey] = true

		// Reached target
		if current.Block.ChunkID == endBlock.ChunkID && current.Block.BlockID == endBlock.BlockID {
			var path []PathfinderBlock
			currNode := current
			for currNode != nil {
				path = append([]PathfinderBlock{currNode.Block}, path...)
				currNode = currNode.Parent
			}
			return path, current.GScore, nil
		}

		// Check neighbors
		neighbors := FindNeighbors(current.Block, req.Grid)
		for _, neighbor := range neighbors {
			neighKey := fmtKey(neighbor.ChunkID, neighbor.BlockID)
			if closedSet[neighKey] {
				continue
			}

			tentativeGScore := current.GScore + GetDistance(current.Block, neighbor)

			// Check if neighbor already in openSet
			var existingNode *AStarNode
			for _, node := range openSet {
				if node.Block.ChunkID == neighbor.ChunkID && node.Block.BlockID == neighbor.BlockID {
					existingNode = node
					break
				}
			}

			if existingNode == nil {
				openSet = append(openSet, &AStarNode{
					Block:  neighbor,
					GScore: tentativeGScore,
					FScore: tentativeGScore + GetDistance(neighbor, *endBlock),
					Parent: current,
				})
			} else if tentativeGScore < existingNode.GScore {
				existingNode.GScore = tentativeGScore
				existingNode.FScore = tentativeGScore + GetDistance(neighbor, *endBlock)
				existingNode.Parent = current
			}
		}
	}

	return nil, 0, errors.New("no path found between start and end blocks")
}

func fmtKey(chunk, block int) string {
	return fmt.Sprintf("%d_%d", chunk, block)
}

// handlePathfinding resolves A* search requests
func handlePathfinding(w http.ResponseWriter, r *http.Request) {
	if setupCORS(w, r) {
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST is supported", http.StatusMethodNotAllowed)
		return
	}

	var req PathfinderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	path, cost, err := SolveAStar(req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(PathfinderResponse{
			Success: false,
			Path:    nil,
			Cost:    0.0,
			Logs:    err.Error(),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(PathfinderResponse{
		Success: true,
		Path:    path,
		Cost:    cost,
		Logs:    "Authoritative Go Core A* path resolved successfully.",
	})
}
