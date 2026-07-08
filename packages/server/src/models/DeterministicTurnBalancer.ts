// packages/server/src/models/DeterministicTurnBalancer.ts
export interface PlayerTurnState {
  playerId: string;
  accumulatedCost: number; // Deterministic initiative/time cost spent
  consecutiveTurns: number; // Number of consecutive turns taken
}

export class DeterministicTurnBalancer {
  private playerStates: Map<string, PlayerTurnState> = new Map();

  constructor(playerIds: string[]) {
    // Deterministic sorting of IDs initially to avoid any insertion order bias
    const sortedIds = [...playerIds].sort();
    for (const id of sortedIds) {
      this.playerStates.set(id, {
        playerId: id,
        accumulatedCost: 0,
        consecutiveTurns: 0
      });
    }
  }

  /**
   * Deterministically decides the next player eligible for a turn.
   * Prefers the player with the lowest accumulated time cost.
   * Breaks ties by favoring the player with lower health (deterministic balancing).
   */
  public getNextPlayerId(playerHealths: Record<string, number>): string {
    let nextPlayerId = '';
    let minCost = Infinity;

    for (const [id, state] of this.playerStates.entries()) {
      if (state.accumulatedCost < minCost) {
        minCost = state.accumulatedCost;
        nextPlayerId = id;
      } else if (state.accumulatedCost === minCost) {
        if (!nextPlayerId) {
          nextPlayerId = id;
          continue;
        }

        const currentNextHealth = playerHealths[nextPlayerId] ?? 15;
        const candidateHealth = playerHealths[id] ?? 15;

        // Balance check: player with lower HP gets priority on ties
        if (candidateHealth < currentNextHealth) {
          nextPlayerId = id;
        } else if (candidateHealth === currentNextHealth) {
          // Alphabetical tie-break
          if (id < nextPlayerId) {
            nextPlayerId = id;
          }
        }
      }
    }

    return nextPlayerId;
  }

  /**
   * Registers card cost into the active player's initiative pool.
   * Applies deterministic modifiers:
   *  - Consecutive Turn Fatigue: +50% cost if taking >= 2 turns in a row.
   *  - Catch-up Grace: -20% cost if player is at low health (< 40%).
   */
  public registerActionCost(
    playerId: string,
    baseCost: number,
    isLowHealth: boolean
  ): { finalCost: number; fatigueApplied: boolean; catchUpApplied: boolean } {
    const state = this.playerStates.get(playerId);
    if (!state) {
      return { finalCost: baseCost, fatigueApplied: false, catchUpApplied: false };
    }

    // Reset consecutive turns count for all other players
    for (const [id, otherState] of this.playerStates.entries()) {
      if (id !== playerId) {
        otherState.consecutiveTurns = 0;
      }
    }
    state.consecutiveTurns++;

    let finalCost = baseCost;
    let fatigueApplied = false;
    let catchUpApplied = false;

    // Fatigue modifier
    if (state.consecutiveTurns >= 2) {
      finalCost = Math.round(finalCost * 1.5);
      fatigueApplied = true;
    }

    // Catch-up modifier
    if (isLowHealth) {
      finalCost = Math.round(finalCost * 0.8);
      catchUpApplied = true;
    }

    state.accumulatedCost += finalCost;

    return {
      finalCost,
      fatigueApplied,
      catchUpApplied
    };
  }

  /**
   * Directly updates or resets a player's cost (useful for integration syncing).
   */
  public setPlayerCost(playerId: string, cost: number): void {
    const state = this.playerStates.get(playerId);
    if (state) {
      state.accumulatedCost = cost;
    }
  }

  /**
   * Retrieves the turn stats for a player.
   */
  public getPlayerState(playerId: string): PlayerTurnState | undefined {
    return this.playerStates.get(playerId);
  }
}
