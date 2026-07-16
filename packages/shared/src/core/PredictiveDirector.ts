export type CharacterTraceInstance =
  | { type: 'Spawn'; threadId: string; chunkId: number; blockId: number; timestamp: number; message?: string }
  | { type: 'Move'; threadId: string; from: { meta: number; hex: number }; to: { meta: number; hex: number }; cost: number; timestamp: number; message?: string }
  | { type: 'Combat'; attackerId: string; targetId: string; damage: number; armor: number; timestamp: number; message?: string }
  | { type: 'LevelUp'; threadId: string; level: number; timestamp: number; message?: string }
  | { type: 'ChestClaim'; threadId: string; message: string; timestamp: number }
  | { type: 'Combo'; threadId: string; message: string; timestamp: number };

export interface Quest {
  id: string;
  title: string;
  description: string;
  objectiveType: 'DEFEAT_NPC' | 'HARVEST_MATERIAL' | 'REACH_BIOME' | 'REACH_LEVEL' | 'COLLECT_CHEST' | 'SPEND_ENERGY' | 'CAST_ULTIMATE' | 'DEAL_DAMAGE' | 'TRADE_CARDS';
  targetValue: number;
  targetName?: string;
  progress: number;
  completed: boolean;
  xpReward: number;
  materialReward?: { type: string; amount: number };
}

export interface BalancingBuffs {
  luckBonus: number;
  hazardDamageMultiplier: number;
  energyCostMultiplier: number;
}

export class PredictiveBalanceDirector {
  /**
   * Predikuje pravdepodobnosť výhry pre každé PLAYER vlákno.
   * Vzorec zohľadňuje pomer HP, Levelu a surovín.
   */
  public static predictWinProbability(
    threads: { id: string; type: string; health: number; maxHealth: number; level: number; materials: Record<string, number> }[]
  ): Map<string, number> {
    const probabilities = new Map<string, number>();
    const players = threads.filter(t => t.type === 'PLAYER');

    if (players.length < 2) {
      players.forEach(p => probabilities.set(p.id, 1.0));
      return probabilities;
    }

    const pA = players[0];
    const pB = players[1];

    // Výpočet hrubej sily (weight) pre každého hráča
    const getWeight = (p: typeof players[0]) => {
      const hpRatio = p.health / (p.maxHealth || 15);
      const levelFactor = p.level * 10;
      const resourceCount = Object.values(p.materials).reduce((acc, val) => acc + val, 0);
      return (hpRatio * 40) + levelFactor + (resourceCount * 2);
    };

    const wA = getWeight(pA);
    const wB = getWeight(pB);
    const total = wA + wB;

    if (total === 0) {
      probabilities.set(pA.id, 0.5);
      probabilities.set(pB.id, 0.5);
    } else {
      probabilities.set(pA.id, wA / total);
      probabilities.set(pB.id, wB / total);
    }

    return probabilities;
  }

  /**
   * Vypočíta a vráti úpravy vyváženia (buffov) pre hráčov na základe ich šancí na výhru.
   * Ak má niekto šancu na výhru pod 35%, dostane záchranné (catch-up) boosty.
   */
  public static calculateBalancingBuffs(
    playerId: string,
    winProbability: Map<string, number>
  ): BalancingBuffs {
    const prob = winProbability.get(playerId) ?? 0.5;

    // Predvolené balančné nastavenia (žiadny zásah)
    const buffs: BalancingBuffs = {
      luckBonus: 0.0,
      hazardDamageMultiplier: 1.0,
      energyCostMultiplier: 1.0
    };

    // Ak hráč výrazne prehráva (šanca < 35%), zaktivujeme DDA
    if (prob < 0.35) {
      const severity = (0.35 - prob) / 0.35; // pomer zaostávania (0.0 až 1.0)
      buffs.luckBonus = 0.25 * severity;       // záchranný boost pre luck
      buffs.hazardDamageMultiplier = 1.0 - (0.5 * severity); // zníženie hazard damage až o 50%
      buffs.energyCostMultiplier = 1.0 - (0.3 * severity);   // zníženie ceny energie pre uľahčenie pohybu
    }

    return buffs;
  }
}
