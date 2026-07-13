export interface ActionStackEntry {
  id: string;
  player: 'playerA' | 'playerB';
  type: 'attack' | 'dodge' | 'spell' | 'move';
  cardId: string;
  damage: number;
}

export interface StackResolveResult {
  damageDealtA: number;
  damageDealtB: number;
  finalHealthA: number;
  finalHealthB: number;
  energyCostA: number;
  energyCostB: number;
  screenShake: boolean;
  shakeMagnitude: number;
  resolutionLog: string[];
}

export class SovereignLIFOArbiter {
  /**
   * Resolves a LIFO stack of actions and reactions.
   * Processes the stack from top to bottom (last-in, first-out).
   * - Dodge (move) cards mitigate target attacks immediately below them in the stack.
   */
  public static resolveStack(
    stack: ActionStackEntry[],
    initialHealthA: number = 15,
    initialHealthB: number = 15
  ): StackResolveResult {
    let healthA = initialHealthA;
    let healthB = initialHealthB;
    let energyCostA = 0;
    let energyCostB = 0;
    let screenShake = false;
    let shakeMagnitude = 0;
    const resolutionLog: string[] = [];

    // Process top-down (LIFO stack: last element in array is top)
    const reversedStack = [...stack].reverse();
    
    // Tracks active dodges for each player that can negate the next incoming attack
    let dodgeActiveA = false;
    let dodgeActiveB = false;

    resolutionLog.push(`[LIFO_ARBITER] Initializing stack resolution (size: ${stack.length}).`);

    for (const entry of reversedStack) {
      if (entry.type === 'dodge' || entry.type === 'move') {
        if (entry.player === 'playerA') {
          dodgeActiveA = true;
          energyCostA += 15; // Dodge cost
          resolutionLog.push(`[DODGE] Player A prepared dodge reaction. Energy cost: 15.`);
        } else {
          dodgeActiveB = true;
          energyCostB += 15;
          resolutionLog.push(`[DODGE] Player B prepared dodge reaction. Energy cost: 15.`);
        }
      } else if (entry.type === 'attack') {
        const attacker = entry.player;
        const target = attacker === 'playerA' ? 'playerB' : 'playerA';
        
        if (target === 'playerB') {
          if (dodgeActiveB) {
            resolutionLog.push(`[MITIGATED] Player B successfully dodged Player A's ${entry.cardId} attack!`);
            dodgeActiveB = false; // Consume dodge
          } else {
            healthB -= entry.damage;
            screenShake = true;
            shakeMagnitude += entry.damage * 1.5;
            resolutionLog.push(`[DAMAGE] Player A hit Player B with ${entry.cardId} for ${entry.damage} HP poškodenia.`);
          }
        } else {
          if (dodgeActiveA) {
            resolutionLog.push(`[MITIGATED] Player A successfully dodged Player B's ${entry.cardId} attack!`);
            dodgeActiveA = false; // Consume dodge
          } else {
            healthA -= entry.damage;
            screenShake = true;
            shakeMagnitude += entry.damage * 1.5;
            resolutionLog.push(`[DAMAGE] Player B hit Player A with ${entry.cardId} for ${entry.damage} HP poškodenia.`);
          }
        }
      } else {
        // spells or other accessory cards
        if (entry.player === 'playerA') {
          energyCostA += 10;
          resolutionLog.push(`[ACTION] Player A resolved spell/action ${entry.cardId}.`);
        } else {
          energyCostB += 10;
          resolutionLog.push(`[ACTION] Player B resolved spell/action ${entry.cardId}.`);
        }
      }
    }

    const damageDealtA = initialHealthB - healthB;
    const damageDealtB = initialHealthA - healthA;

    resolutionLog.push(`[LIFO_ARBITER] Resolution finished. Health A: ${healthA}, Health B: ${healthB}.`);

    return {
      damageDealtA,
      damageDealtB,
      finalHealthA: Math.max(0, healthA),
      finalHealthB: Math.max(0, healthB),
      energyCostA,
      energyCostB,
      screenShake,
      shakeMagnitude: Math.min(25, shakeMagnitude),
      resolutionLog
    };
  }
}
