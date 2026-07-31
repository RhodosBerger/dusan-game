package engine

import (
	"errors"
	"fmt"
)

// Thread represents a player or AI unit in the game state
type Thread struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Type      string `json:"type"` // "PLAYER" | "AI"
	Health    int    `json:"health"`
	MaxHealth int    `json:"maxHealth"`
	Energy    int    `json:"energy"`
}

// StateEngine represents the Sovereign game state engine
type StateEngine struct {
	MatchID        string   `json:"matchId"`
	TurnsElapsed   int      `json:"turnsElapsed"`
	ActivePhase    string   `json:"activePhase"` // "MULLIGAN" | "ACTION" | "COMBAT" | "END"
	ActivePlayerID string   `json:"activePlayerId"`
	SystemEnergy   int      `json:"systemEnergy"`
	Threads        []Thread `json:"threads"`
	PlayedVoltage  float64  `json:"playedVoltage"`
	PlayedResist   float64  `json:"playedResist"`
}

// ActionPayload describes a gameplay move
type ActionPayload struct {
	AttackerID string  `json:"attackerId"`
	TargetID   string  `json:"targetId"`
	CardID     string  `json:"cardId"`
	Voltage    float64 `json:"voltage"`
	Resistance float64 `json:"resistance"`
	Damage     int     `json:"damage"`
}

// StateResolveResponse describes the result of resolving an action
type StateResolveResponse struct {
	Success      bool         `json:"success"`
	State        *StateEngine `json:"state"`
	ComboTrigger string       `json:"comboTrigger"` // "NONE" | "VOLTAGE_SURGE" | "SHORT_CIRCUIT"
	Logs         string       `json:"logs"`
}

// ResolveAction processes a card play / action, mutates health/energy, and checks combos
func (se *StateEngine) ResolveAction(action ActionPayload) (*StateResolveResponse, error) {
	if se.ActivePhase != "ACTION" {
		return nil, errors.New("actions can only be resolved during ACTION phase")
	}

	// 1. Locate attacker and defender
	var attacker *Thread
	var defender *Thread

	for i := range se.Threads {
		if se.Threads[i].ID == action.AttackerID {
			attacker = &se.Threads[i]
		}
		if se.Threads[i].ID == action.TargetID {
			defender = &se.Threads[i]
		}
	}

	if attacker == nil || defender == nil {
		return nil, errors.New("attacker or defender not found in thread registry")
	}

	// 2. Consume attacker energy and apply damage to defender
	attacker.Energy = int(MathMax(0, float64(attacker.Energy-20)))
	defender.Health = int(MathMax(0, float64(defender.Health-action.Damage)))

	// 3. Accumulate turn metrics
	se.PlayedVoltage += action.Voltage
	if se.PlayedResist == 0 {
		se.PlayedResist = action.Resistance
	} else {
		se.PlayedResist *= action.Resistance
	}

	// 4. Evaluate themed Combos (Rule 5 & Section 1)
	combo := "NONE"
	logs := fmt.Sprintf("Action resolved: Thread %s played %s on %s.", attacker.Name, action.CardID, defender.Name)

	if se.PlayedVoltage >= 8.0 {
		combo = "VOLTAGE_SURGE"
		defender.Health = int(MathMax(0, float64(defender.Health-2))) // +2 bonus damage
		logs += " [COMBO] Voltage Surge triggered! +2 bonus damage applied."
		se.PlayedVoltage = 0.0 // reset turn voltage accumulator
	} else if se.PlayedResist > 0.0 && se.PlayedResist <= 1.0 {
		combo = "SHORT_CIRCUIT"
		attacker.Energy = int(MathMax(0, float64(attacker.Energy-15))) // energy drain skratom
		logs += " [COMBO] Short Circuit triggered! Attacker suffered energy drain."
		se.PlayedResist = 0.0 // reset
	}

	return &StateResolveResponse{
		Success:      true,
		State:        se,
		ComboTrigger: combo,
		Logs:         logs,
	}, nil
}

// MathMax helper
func MathMax(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}
