// packages/server/src/models/SovereignSuperpositionEngine.ts
import { Thread } from './Thread';
import { OutcomeVector } from '@dusan-game/shared';

export interface SuperpositionBuff {
  type: 'WAVE_FUNCTION' | 'ENTANGLED' | 'SCHRODINGER_SHIELD';
  strength: number;
}

export class SovereignSuperpositionEngine {
  private static playerBuffs: Map<string, SuperpositionBuff> = new Map();

  /**
   * Applies an algebraic superposition state to a player/hero thread.
   */
  public static applySuperposition(
    thread: Thread,
    type: 'WAVE_FUNCTION' | 'ENTANGLED' | 'SCHRODINGER_SHIELD',
    strength: number = 1.0
  ): string {
    this.playerBuffs.set(thread.id, { type, strength });
    return `[SUPERPOSITION] Thread ${thread.id} entered ${type} superposition state (strength: ${strength}).`;
  }

  /**
   * Deterministically collapses a player's superposition state into a single physical reality choice.
   */
  public static collapseState(
    thread: Thread,
    choice: 'DAMAGE' | 'SHIELD' | 'MOVEMENT'
  ): { log: string; healthDelta: number; armorDelta: number; statusDelta: string } {
    const buff = this.playerBuffs.get(thread.id);
    if (!buff) {
      return { log: 'No active superposition detected.', healthDelta: 0, armorDelta: 0, statusDelta: 'none' };
    }

    let log = `[COLLAPSE] Wave function collapsed for ${thread.id} into ${choice} state.`;
    let healthDelta = 0;
    let armorDelta = 0;
    let statusDelta = 'none';

    if (choice === 'DAMAGE') {
      thread.baseDamage = (thread.baseDamage || 5) + 4;
      log += ` Deterministic bonus: +4 base damage.`;
    } else if (choice === 'SHIELD') {
      thread.armor = (thread.armor || 0) + 3;
      armorDelta = 3;
      log += ` Deterministic bonus: +3 armor.`;
    } else if (choice === 'MOVEMENT') {
      thread.isSlowed = false;
      thread.isRooted = false;
      statusDelta = 'cured';
      log += ` Deterministic bonus: Cured slowed and rooted status.`;
    }

    // Consume superposition state
    this.playerBuffs.delete(thread.id);

    return {
      log,
      healthDelta,
      armorDelta,
      statusDelta
    };
  }

  /**
   * Applies algebraic linear transformations to an action OutcomeVector based on superposition.
   */
  public static projectSuperpositionTensor(
    baseOutcome: OutcomeVector,
    type: 'WAVE_FUNCTION' | 'ENTANGLED' | 'SCHRODINGER_SHIELD'
  ): OutcomeVector {
    const modified = { ...baseOutcome };

    switch (type) {
      case 'WAVE_FUNCTION':
        // Wave function: amplifies success probability and increases damage slightly
        modified.successProbability = Math.min(100.0, modified.successProbability * 1.25);
        modified.damageApplied = Math.round(modified.damageApplied * 1.3);
        break;
      case 'ENTANGLED':
        // Entangled state: increases kinetic force but doubles energy cost
        modified.displacementDistance = Math.round(modified.displacementDistance * 1.5);
        modified.energyDelta = Math.round(modified.energyDelta * 2.0);
        break;
      case 'SCHRODINGER_SHIELD':
        // Schrodinger shield: dampens displacement and applies slowed status
        modified.damageApplied = Math.max(1, Math.round(modified.damageApplied * 0.5));
        modified.statusApplied = 'slowed';
        break;
    }

    return modified;
  }

  /**
   * Checks if thread has an active superposition.
   */
  public static getActiveBuff(threadId: string): SuperpositionBuff | undefined {
    return this.playerBuffs.get(threadId);
  }
}
