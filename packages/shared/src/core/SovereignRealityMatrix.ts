export interface PlayerSimulationState {
  health: number;
  armor: number;
  isConsecutiveTurn: boolean;
  activeStatuses: ('slowed' | 'rooted' | 'disarmed' | 'silenced')[];
  lastCardTypePlayed?: 'attack' | 'spell' | 'move' | 'accessory';
}

export interface RealityProjection {
  realityName: string;
  description: string;
  actionCostA: number;
  actionCostB: number;
  statusEffectA: string[];
  statusEffectB: string[];
  biomeSynergyA: string;
  biomeSynergyB: string;
  isGameOver: boolean;
  endStateDescription: string;
}

export class SovereignRealityMatrix {
  /**
   * Computes the action cost for a player based on their current status and turn patterns.
   * - Base cost: 10 AP.
   * - Consecutive turn fatigue penalty: +50% (+5 AP).
   * - Low HP catch-up discount (HP <= 4): -20% (-2 AP).
   */
  public static calculateActionCost(player: PlayerSimulationState): number {
    let cost = 10;

    // Apply low health catch-up discount
    if (player.health <= 4) {
      cost -= 2; // 20% discount
    }

    // Apply consecutive turn fatigue penalty
    if (player.isConsecutiveTurn) {
      cost += 5; // 50% fatigue penalty
    }

    return cost;
  }

  /**
   * Projects the state of the game under four distinct parallel realities.
   */
  public static projectRealities(
    playerA: PlayerSimulationState,
    playerB: PlayerSimulationState,
    activeBiome: 'LUSH_FOREST' | 'TOXIC_SWAMP' | 'GLACIER' | 'DESERT' | 'BARRENS'
  ): RealityProjection[] {
    const realities: RealityProjection[] = [];

    // --- REALITY 1: Timeline Alpha (Standard Rules) ---
    const costA_std = this.calculateActionCost(playerA);
    const costB_std = this.calculateActionCost(playerB);
    const isGameOver_std = playerA.health <= 0 || playerB.health <= 0;
    const endState_std = isGameOver_std 
      ? (playerA.health <= 0 && playerB.health <= 0 ? "Simultaneous Elimination (Draw)" : "Elimination Completed")
      : "Match in progress";

    realities.push({
      realityName: "Timeline Alpha",
      description: "Standard rulebook reality utilizing baseline action costs and status restrictions.",
      actionCostA: costA_std,
      actionCostB: costB_std,
      statusEffectA: [...playerA.activeStatuses],
      statusEffectB: [...playerB.activeStatuses],
      biomeSynergyA: activeBiome === 'LUSH_FOREST' ? "Healing Boost: +1 HP on blue spell cards." : "None",
      biomeSynergyB: activeBiome === 'LUSH_FOREST' ? "Healing Boost: +1 HP on blue spell cards." : "None",
      isGameOver: isGameOver_std,
      endStateDescription: endState_std
    });

    // --- REALITY 2: Glacial Fracture (Ice Overload) ---
    // Rule: Blue spells target enemy and immediately cause rooting (zakorenenie).
    const statusA_glac = [...playerA.activeStatuses];
    const statusB_glac = [...playerB.activeStatuses];
    if (playerA.lastCardTypePlayed === 'spell') {
      statusB_glac.push('rooted');
    }
    if (playerB.lastCardTypePlayed === 'spell') {
      statusA_glac.push('rooted');
    }

    realities.push({
      realityName: "Glacial Fracture",
      description: "Frost reality. Blue magic spells immediately apply ROOT (zakorenenie) to targets.",
      actionCostA: costA_std,
      actionCostB: costB_std,
      statusEffectA: statusA_glac,
      statusEffectB: statusB_glac,
      biomeSynergyA: "Glacial Freeze: Spells trigger root.",
      biomeSynergyB: "Glacial Freeze: Spells trigger root.",
      isGameOver: isGameOver_std,
      endStateDescription: endState_std
    });

    // --- REALITY 3: Toxic Contagion (Acid Surge) ---
    // Rule: Red cards deal +1 damage and apply slow (spomalenie).
    const statusA_tox = [...playerA.activeStatuses];
    const statusB_tox = [...playerB.activeStatuses];
    if (playerA.lastCardTypePlayed === 'attack') {
      statusB_tox.push('slowed');
    }
    if (playerB.lastCardTypePlayed === 'attack') {
      statusA_tox.push('slowed');
    }

    realities.push({
      realityName: "Toxic Contagion",
      description: "Corrosive reality. Red attack cards deal increased damage and apply SLOW (spomalenie).",
      actionCostA: costA_std,
      actionCostB: costB_std,
      statusEffectA: statusA_tox,
      statusEffectB: statusB_tox,
      biomeSynergyA: "Toxicity: Attacks apply slow.",
      biomeSynergyB: "Toxicity: Attacks apply slow.",
      isGameOver: isGameOver_std,
      endStateDescription: endState_std
    });

    // --- REALITY 4: Ohmic Overcharge (Grid Surge) ---
    // Rule: High voltage reduces costs.
    realities.push({
      realityName: "Ohmic Overcharge",
      description: "Surcharged grid reality. High voltage load reduces action cost by an additional -1 AP.",
      actionCostA: Math.max(1, costA_std - 1),
      actionCostB: Math.max(1, costB_std - 1),
      statusEffectA: [...playerA.activeStatuses],
      statusEffectB: [...playerB.activeStatuses],
      biomeSynergyA: "Overdrive: Action cost reduced.",
      biomeSynergyB: "Overdrive: Action cost reduced.",
      isGameOver: isGameOver_std,
      endStateDescription: endState_std
    });

    return realities;
  }
}
