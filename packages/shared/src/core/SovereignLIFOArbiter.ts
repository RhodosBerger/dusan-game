export interface ActionStackEntry {
  id: string;
  player: 'playerA' | 'playerB';
  type: 'attack' | 'dodge' | 'spell' | 'move';
  cardId: string;
  damage: number;
  hitZone?: 'head' | 'chest' | 'left_arm' | 'right_arm' | 'left_leg' | 'right_leg';
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
  woundsA: Record<string, number>;
  woundsB: Record<string, number>;
  statusEffectsAppliedA: string[];
  statusEffectsAppliedB: string[];
}

export class SovereignLIFOArbiter {
  /**
   * Resolves a LIFO stack of actions and reactions.
   * Processes the stack from top to bottom (last-in, first-out).
   * - Dodge (move) cards mitigate target attacks immediately below them in the stack.
   * - Hits can target head, chest, left_arm, right_arm, left_leg, or right_leg.
   * - Arms and legs capacity is 2 hits. Overloading them applies 'disarmed' or 'slowed' respectively.
   * - Head and chest capacity is 1 hit, causing critical bonus damage.
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

    const woundsA = { head: 0, chest: 0, left_arm: 0, right_arm: 0, left_leg: 0, right_leg: 0 };
    const woundsB = { head: 0, chest: 0, left_arm: 0, right_arm: 0, left_leg: 0, right_leg: 0 };
    const statusEffectsAppliedA: string[] = [];
    const statusEffectsAppliedB: string[] = [];

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
        const zone = entry.hitZone || 'chest';
        
        if (target === 'playerB') {
          if (dodgeActiveB) {
            resolutionLog.push(`[MITIGATED] Player B successfully dodged Player A's ${entry.cardId} attack!`);
            dodgeActiveB = false; // Consume dodge
          } else {
            // Apply zone damage and check capacity
            let finalDamage = entry.damage;
            woundsB[zone]++;

            if (zone === 'head') {
              finalDamage += 5; // +5 Headshot bonus
              resolutionLog.push(`[HEADSHOT CRITICAL] Player A scored a critical headshot on Player B! (+5 Bonus DMG)`);
            } else if (zone === 'chest') {
              finalDamage += 3; // +3 Torso bonus
            } else if (zone === 'left_arm' || zone === 'right_arm') {
              if (woundsB[zone] >= 2) {
                if (!statusEffectsAppliedB.includes('disarmed')) {
                  statusEffectsAppliedB.push('disarmed');
                  resolutionLog.push(`[SYSTEM ALARM] Player B's arm wounded twice! Applying 'disarmed' status effect.`);
                }
              }
            } else if (zone === 'left_leg' || zone === 'right_leg') {
              if (woundsB[zone] >= 2) {
                if (!statusEffectsAppliedB.includes('slowed')) {
                  statusEffectsAppliedB.push('slowed');
                  resolutionLog.push(`[SYSTEM ALARM] Player B's leg wounded twice! Applying 'slowed' status effect.`);
                }
              }
            }

            healthB -= finalDamage;
            screenShake = true;
            shakeMagnitude += finalDamage * 1.5;
            resolutionLog.push(`[DAMAGE] Player A hit Player B's ${zone} with ${entry.cardId} for ${finalDamage} HP poškodenia.`);
          }
        } else {
          if (dodgeActiveA) {
            resolutionLog.push(`[MITIGATED] Player A successfully dodged Player B's ${entry.cardId} attack!`);
            dodgeActiveA = false; // Consume dodge
          } else {
            // Apply zone damage and check capacity
            let finalDamage = entry.damage;
            woundsA[zone]++;

            if (zone === 'head') {
              finalDamage += 5;
              resolutionLog.push(`[HEADSHOT CRITICAL] Player B scored a critical headshot on Player A! (+5 Bonus DMG)`);
            } else if (zone === 'chest') {
              finalDamage += 3;
            } else if (zone === 'left_arm' || zone === 'right_arm') {
              if (woundsA[zone] >= 2) {
                if (!statusEffectsAppliedA.includes('disarmed')) {
                  statusEffectsAppliedA.push('disarmed');
                  resolutionLog.push(`[SYSTEM ALARM] Player A's arm wounded twice! Applying 'disarmed' status effect.`);
                }
              }
            } else if (zone === 'left_leg' || zone === 'right_leg') {
              if (woundsA[zone] >= 2) {
                if (!statusEffectsAppliedA.includes('slowed')) {
                  statusEffectsAppliedA.push('slowed');
                  resolutionLog.push(`[SYSTEM ALARM] Player A's leg wounded twice! Applying 'slowed' status effect.`);
                }
              }
            }

            healthA -= finalDamage;
            screenShake = true;
            shakeMagnitude += finalDamage * 1.5;
            resolutionLog.push(`[DAMAGE] Player B hit Player A's ${zone} with ${entry.cardId} for ${finalDamage} HP poškodenia.`);
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
      resolutionLog,
      woundsA,
      woundsB,
      statusEffectsAppliedA,
      statusEffectsAppliedB
    };
  }
}
