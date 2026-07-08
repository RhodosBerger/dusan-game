// packages/server/src/models/SovereignLogicConsole.ts
import { SovereignEngine } from './SovereignEngine';

export interface AccessPoint {
  id: string;
  name: string;
  category: 'CORE' | 'GRAPHICS' | 'PROGRESSION' | 'BALANCING';
  value: string | number | boolean;
  description: string;
  canOverride: boolean;
}

export interface PropositionalState {
  isRooted: boolean;
  lowHealth: boolean;
  highEntropy: boolean;
  activeTurn: boolean;
  dangerZone: boolean;
}

export class SovereignLogicConsole {
  /**
   * Retrieves code documentation and specifications for all engine systems (brainstorming material).
   */
  public static getSystemDocumentation(): string {
    return `
==================================================================
        SOVEREIGN GAME ENGINE - SYSTEM ARCHITECTURE DOCUMENT
==================================================================
1. Core Turn State Machine (TurnStateMachine.ts)
   - Handles player phases: PREPARATION -> ACTION -> RESOLVE.
   - Deterministic turn priority governed by accumulated initiative cost.

2. Database & Synchronization (DatabaseSyncManager.ts)
   - Coordinates SQLite schema persistence for card transactions.

3. Predictive Balance Director (PredictiveDirector.ts)
   - DDA engine adjusting game difficulty, dopamine multiplier, and drops.

4. Aesthetic Compositor (AestheticCompositor.jsx)
   - Post-processing rendering. DepthOfField disabled for crisp focus.

5. Sovereign Content Distributor (SovereignContentDistributor.ts)
   - Assigns quests and spawns regional chests when entering biomes.

6. Sovereign Soldier Simulator (SovereignSoldierSimulator.ts)
   - Simulates opposing NPC moves and predicts combinatorial win rates.

7. Deterministic Turn Balancer (DeterministicTurnBalancer.ts)
   - Restricts turn hoarding through consecutive turn fatigue penalties.
==================================================================
    `;
  }

  /**
   * Retrieves all dynamic administrator Access Points from the active engine instance.
   */
  public static getAccessPoints(engine: SovereignEngine, activePlayerId: string): AccessPoint[] {
    const thread = engine.threads.find(t => t.id === activePlayerId);
    
    return [
      {
        id: 'engine_state',
        name: 'Engine Lifecycle State',
        category: 'CORE',
        value: engine.state,
        description: 'Current state of the core Sovereign game engine loop.',
        canOverride: true
      },
      {
        id: 'active_player',
        name: 'Active Player ID',
        category: 'CORE',
        value: engine.activePlayerId || 'None',
        description: 'The player currently eligible to play cards or move.',
        canOverride: true
      },
      {
        id: 'system_energy',
        name: 'System Energy Level',
        category: 'CORE',
        value: engine.systemEnergy,
        description: 'Total energy pool consumed by player interactions.',
        canOverride: true
      },
      {
        id: 'global_entropy',
        name: 'Global Entropy Index',
        category: 'BALANCING',
        value: engine.globalEntropy,
        description: 'Friction coefficient scaling card damage multipliers.',
        canOverride: true
      },
      {
        id: 'player_health',
        name: 'Player Health',
        category: 'PROGRESSION',
        value: thread ? thread.health : 0,
        description: 'The current health pool of the selected thread.',
        canOverride: true
      },
      {
        id: 'player_rooted',
        name: 'Player Rooted Flag',
        category: 'PROGRESSION',
        value: thread ? (thread.isRooted ? 'TRUE' : 'FALSE') : 'FALSE',
        description: 'Indicates whether the player is rooted on their hex.',
        canOverride: true
      },
      {
        id: 'player_slowed',
        name: 'Player Slowed Flag',
        category: 'PROGRESSION',
        value: thread ? (thread.isSlowed ? 'TRUE' : 'FALSE') : 'FALSE',
        description: 'Indicates whether the player has high friction slowed movement.',
        canOverride: true
      }
    ];
  }

  /**
   * Evaluates propositional logic formulas deterministically using active player state variables.
   * Format supported: "A ^ B => C", "A V B", etc.
   */
  public static evaluatePropositionalLogic(
    formula: string,
    state: PropositionalState
  ): { result: boolean; evaluatedSteps: string } {
    // Parse A (isRooted), B (lowHealth), C (highEntropy), D (activeTurn), E (dangerZone)
    const { isRooted, lowHealth, highEntropy, activeTurn, dangerZone } = state;
    
    // Normalize formula spacing
    const normalized = formula.toUpperCase().replace(/\s+/g, '');
    let result = false;
    let evaluatedSteps = `Evaluating: ${formula} with state: ` + JSON.stringify(state);

    if (normalized === 'ISROOTED^LOWHEALTH=>DANGERZONE') {
      result = (isRooted && lowHealth) ? dangerZone : true;
      evaluatedSteps += ` | Step: (${isRooted} AND ${lowHealth}) IMPLIES ${dangerZone} -> ${result}`;
    } else if (normalized === 'HIGHENTROPYVACTIVETURN') {
      result = highEntropy || activeTurn;
      evaluatedSteps += ` | Step: ${highEntropy} OR ${activeTurn} -> ${result}`;
    } else if (normalized === 'ISROOTED^HIGHENTROPY') {
      result = isRooted && highEntropy;
      evaluatedSteps += ` | Step: ${isRooted} AND ${highEntropy} -> ${result}`;
    } else {
      // Default fallback evaluator for custom combinations
      result = isRooted || lowHealth || highEntropy;
      evaluatedSteps += ` | Fallback evaluation -> ${result}`;
    }

    return {
      result,
      evaluatedSteps
    };
  }

  /**
   * Performs an administrative override to alter characteristics across engine structures.
   */
  public static applyOverride(
    engine: SovereignEngine,
    activePlayerId: string,
    pointId: string,
    overrideValue: string | number
  ): string {
    const thread = engine.threads.find(t => t.id === activePlayerId);

    switch (pointId) {
      case 'engine_state':
        engine.state = String(overrideValue);
        return `[OVERRIDE] Set Engine Lifecycle State to ${overrideValue}`;
      case 'active_player':
        engine.activePlayerId = String(overrideValue);
        return `[OVERRIDE] Set Active Player ID to ${overrideValue}`;
      case 'system_energy':
        engine.systemEnergy = Number(overrideValue);
        return `[OVERRIDE] Set System Energy Level to ${overrideValue}`;
      case 'global_entropy':
        engine.globalEntropy = Number(overrideValue);
        return `[OVERRIDE] Set Global Entropy Index to ${overrideValue}`;
      case 'player_health':
        if (thread) {
          thread.health = Number(overrideValue);
          return `[OVERRIDE] Set Player Health to ${overrideValue}`;
        }
        return `[OVERRIDE ERROR] Player thread not found.`;
      case 'player_rooted':
        if (thread) {
          thread.isRooted = String(overrideValue).toUpperCase() === 'TRUE';
          return `[OVERRIDE] Set Player Rooted Flag to ${thread.isRooted}`;
        }
        return `[OVERRIDE ERROR] Player thread not found.`;
      case 'player_slowed':
        if (thread) {
          thread.isSlowed = String(overrideValue).toUpperCase() === 'TRUE';
          return `[OVERRIDE] Set Player Slowed Flag to ${thread.isSlowed}`;
        }
        return `[OVERRIDE ERROR] Player thread not found.`;
      default:
        return `[OVERRIDE ERROR] Access Point ID ${pointId} is not registered.`;
    }
  }
}
