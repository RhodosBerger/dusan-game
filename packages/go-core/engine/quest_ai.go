package engine

import (
	"fmt"
	"math/rand"
	"time"
)

type TelemetryLog struct {
	PlayerID  string    `json:"playerId"`
	HexCoord  string    `json:"hexCoord"`
	HP        int       `json:"hp"`
	Level     int       `json:"level"`
	Timestamp time.Time `json:"timestamp"`
}

type QuestObjective struct {
	Type        string `json:"type"` // "REACH_TILE", "AVOID_TRAP", "COMBAT"
	Description string `json:"description"`
	TargetTile  string `json:"targetTile"`
	Value       int    `json:"value"`
}

type HostilePlan struct {
	TurnOffset int    `json:"turnOffset"`
	ActionType string `json:"actionType"` // "COLLAPSE", "AMBUSH", "SPAWN_HAZARD"
	TargetTile string `json:"targetTile"`
}

type AIQuestResponse struct {
	QuestID     string           `json:"questId"`
	Title       string           `json:"title"`
	Story       string           `json:"story"`
	Objectives  []QuestObjective `json:"objectives"`
	HostilePath []HostilePlan    `json:"hostilePath"`
	XPReward    int              `json:"xpReward"`
}

func GenerateProceduralQuest(log TelemetryLog, terrain string) AIQuestResponse {
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	targetIndex := rng.Intn(60)
	targetCoord := fmt.Sprintf("0x%02X", targetIndex)

	story := ""
	objectives := []QuestObjective{}
	hostilePath := []HostilePlan{}

	if terrain == "TOXIC" || terrain == "swamp" {
		story = fmt.Sprintf("AI Director: Pozícia %s vykazuje zvýšené nebezpečenstvo kyslých výparov. Ak chceš prežiť, musíš získať dekontaminačné spóry na políčku %s.", log.HexCoord, targetCoord)
		objectives = append(objectives, QuestObjective{
			Type:        "REACH_TILE",
			Description: fmt.Sprintf("Prejdi močiarmi k aether-spojeniu %s", targetCoord),
			TargetTile:  targetCoord,
			Value:       1,
		})
		hostilePath = append(hostilePath, HostilePlan{TurnOffset: 1, ActionType: "SPAWN_HAZARD", TargetTile: log.HexCoord})
		hostilePath = append(hostilePath, HostilePlan{TurnOffset: 2, ActionType: "AMBUSH", TargetTile: targetCoord})
	} else if terrain == "CRYSTAL" {
		story = fmt.Sprintf("AI Director: Zaznamenaná nestabilná kryštalická mriežka na pozícii %s. Preťaž rezonátor na %s skôr než utrpíš poškodenie.", log.HexCoord, targetCoord)
		objectives = append(objectives, QuestObjective{
			Type:        "REACH_TILE",
			Description: fmt.Sprintf("Preťaž uzol kryštálov %s", targetCoord),
			TargetTile:  targetCoord,
			Value:       1,
		})
		hostilePath = append(hostilePath, HostilePlan{TurnOffset: 1, ActionType: "COLLAPSE", TargetTile: targetCoord})
	} else {
		story = fmt.Sprintf("AI Director: Bezpečný uzol na %s. Založ prenosovú stanicu na políčku %s pre napojenie aether-siete.", log.HexCoord, targetCoord)
		objectives = append(objectives, QuestObjective{
			Type:        "REACH_TILE",
			Description: fmt.Sprintf("Aktivuj relé stanicu %s", targetCoord),
			TargetTile:  targetCoord,
			Value:       1,
		})
	}

	xp := 120 + (log.Level * 25)

	return AIQuestResponse{
		QuestID:     fmt.Sprintf("pq_%d", time.Now().UnixNano()),
		Title:       fmt.Sprintf("Procedurálny Protokol Lvl %d", log.Level),
		Story:       story,
		Objectives:  objectives,
		HostilePath: hostilePath,
		XPReward:    xp,
	}
}
