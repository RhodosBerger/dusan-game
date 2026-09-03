package engine

import (
	"errors"
	"math"
)

// SolveRequest defines incoming solver payload parameters
type SolveRequest struct {
	Type string   `json:"type"` // "direct", "inverse", "ohm"
	A1   *float64 `json:"a1,omitempty"`
	B1   *float64 `json:"b1,omitempty"`
	A2   *float64 `json:"a2,omitempty"`
	B2   *float64 `json:"b2,omitempty"`
	V    *float64 `json:"v,omitempty"`
	R    *float64 `json:"r,omitempty"`
	I    *float64 `json:"i,omitempty"`
}

// SolveResponse defines solved outputs
type SolveResponse struct {
	Result float64 `json:"result,omitempty"`
	V      float64 `json:"v,omitempty"`
	R      float64 `json:"r,omitempty"`
	I      float64 `json:"i,omitempty"`
}

// SolveRuleOfThree computes direct/inverse proportions or Ohm's law unknowns
func SolveRuleOfThree(req SolveRequest) (SolveResponse, error) {
	if req.Type == "direct" {
		if req.A1 == nil || req.B1 == nil || *req.B1 == 0 {
			return SolveResponse{}, errors.New("a1 and b1 (non-zero) are required for direct proportion")
		}
		if req.A2 == nil && req.B2 == nil {
			return SolveResponse{}, errors.New("either a2 or b2 must be provided to solve")
		}
		if req.A2 == nil {
			// a1 / b1 = a2 / b2 => a2 = (a1 * b2) / b1
			res := (*req.A1 * *req.B2) / *req.B1
			return SolveResponse{Result: res}, nil
		}
		// a1 / b1 = a2 / b2 => b2 = (b1 * a2) / a1
		if *req.A1 == 0 {
			return SolveResponse{}, errors.New("a1 cannot be zero when solving for b2")
		}
		res := (*req.B1 * *req.A2) / *req.A1
		return SolveResponse{Result: res}, nil
	}

	if req.Type == "inverse" {
		if req.A1 == nil || req.B1 == nil {
			return SolveResponse{}, errors.New("a1 and b1 are required for inverse proportion")
		}
		if req.A2 == nil && req.B2 == nil {
			return SolveResponse{}, errors.New("either a2 or b2 must be provided to solve")
		}
		if req.A2 == nil {
			// a1 * b1 = a2 * b2 => a2 = (a1 * b1) / b2
			if *req.B2 == 0 {
				return SolveResponse{}, errors.New("b2 cannot be zero when solving for a2")
			}
			res := (*req.A1 * *req.B1) / *req.B2
			return SolveResponse{Result: res}, nil
		}
		// a1 * b1 = a2 * b2 => b2 = (a1 * b1) / a2
		if *req.A2 == 0 {
			return SolveResponse{}, errors.New("a2 cannot be zero when solving for b2")
		}
		res := (*req.A1 * *req.B1) / *req.A2
		return SolveResponse{Result: res}, nil
	}

	if req.Type == "ohm" {
		// I = V / R
		var v, r, i float64
		if req.V != nil {
			v = *req.V
		}
		if req.R != nil {
			r = *req.R
		}
		if req.I != nil {
			i = *req.I
		}

		if i == 0 && v != 0 && r != 0 {
			i = v / r
		} else if v == 0 && i != 0 && r != 0 {
			v = i * r
		} else if r == 0 && v != 0 && i != 0 {
			r = v / i
		} else {
			return SolveResponse{}, errors.New("provide exactly two non-zero variables to solve Ohm's law")
		}
		return SolveResponse{V: v, R: r, I: i}, nil
	}

	return SolveResponse{}, errors.New("unknown proportion solver type")
}

// InferUnknownRequest defines incoming payload to infer tensor parameters
type InferUnknownRequest struct {
	CardID       string   `json:"cardId"`
	Friction     *float64 `json:"friction,omitempty"`
	TargetDamage *float64 `json:"targetDamage,omitempty"`
	TargetEnergy *float64 `json:"targetEnergy,omitempty"`
}

// InferUnknownResponse returns resolved unknowns from inference
type InferUnknownResponse struct {
	RequiredLevel       int     `json:"requiredLevel"`
	RequiredHazardIndex float64 `json:"requiredHazardIndex"`
}

// InferTensorUnknowns solves for required player level and hazard index using Ohm's Law and direct proportions
func InferTensorUnknowns(req InferUnknownRequest) (InferUnknownResponse, error) {
	resp := InferUnknownResponse{}
	
	baseDamage := 1.0
	baseVoltage := 5.0
	baseResistance := 2.0

	// Set baseline based on cardId to match frontends
	if req.CardID != "" {
		if req.CardID == "crystal_laser" {
			baseDamage = 3.0
			baseVoltage = 4.5
			baseResistance = 1.5
		} else if req.CardID == "toxic_acid" || req.CardID == "acid_rain" {
			baseDamage = 3.0
			baseVoltage = 5.0
			baseResistance = 2.0
		} else if req.CardID == "druid_bear" || req.CardID == "bear_swipe" {
			baseDamage = 3.0
			baseVoltage = 5.5
			baseResistance = 1.0
		}
	}

	if req.TargetDamage != nil && baseDamage > 0 {
		multiplier := *req.TargetDamage / baseDamage
		requiredLevel := int(math.Round((multiplier-1)/0.1 + 1))
		if requiredLevel < 1 {
			requiredLevel = 1
		}
		resp.RequiredLevel = requiredLevel
	}

	if req.TargetEnergy != nil {
		targetPowerLoad := *req.TargetEnergy / 1.5
		frictionVal := 0.0
		if req.Friction != nil {
			frictionVal = *req.Friction
		}
		effectiveResistance := baseResistance + frictionVal*2.0
		targetVoltage := math.Sqrt(targetPowerLoad * effectiveResistance)
		requiredHazardIndex := (targetVoltage - baseVoltage) / 1.5
		resp.RequiredHazardIndex = math.Round(requiredHazardIndex*100) / 100
	}

	return resp, nil
}
