// packages/shared/src/core/DusanAdaptedMassacreModel.ts
import { HexCoordinate, TelemetryData } from './types';

export interface SavedCheckpoint {
  checkpointId: string;
  flagNodeHex: string;
  savedHP: number;
  achievedGoals: string[];
}

/**
 * Dušanov prispôsobený masakov model (Dusan's Adapted Massacre Model).
 * Manages checkpoints, healing calculations, and custom 65% DDA win probability adjustments.
 */
export class DusanAdaptedMassacreModel {
  private lastSavedCheckpoint: SavedCheckpoint | null = null;
  private hasDiedSinceCheckpoint = false;

  public saveCheckpoint(id: string, flagHex: string, hp: number, goals: string[]): void {
    this.lastSavedCheckpoint = {
      checkpointId: id,
      flagNodeHex: flagHex,
      savedHP: hp,
      achievedGoals: [...goals]
    };
    this.hasDiedSinceCheckpoint = false;
    console.log(`[CHECKPOINT] Uložený stav na flagu ${flagHex}: HP=${hp}, Ciele=[${goals.join(', ')}]`);
  }

  public getLastCheckpoint(): SavedCheckpoint | null {
    return this.lastSavedCheckpoint;
  }

  /**
   * Vypočíta štatistiku zostávajúcich ťahov do plného vyliečenia (HP = 100).
   */
  public generateHealingStatistics(currentHP: number, healingRate = 10): {
    turnsToHeal: number;
    description: string;
  } {
    if (currentHP >= 100) {
      return {
        turnsToHeal: 0,
        description: "Dušanov prispôsobený masakov model: Postava je už plne vyliečená."
      };
    }
    const turns = Math.ceil((100 - currentHP) / healingRate);
    return {
      turnsToHeal: turns,
      description: `Dušanov prispôsobený masakov model: Do plného vyliečenia (100 HP) zostáva ${turns} ťahov pri tempe +${healingRate} HP/ťah.`
    };
  }

  /**
   * Spracuje úmrtie hráča. Vracia novú pozíciu a HP, prispôsobuje DDA na 65% šancu na úspech.
   */
  public handlePlayerDeath(playerId: string): {
    respawnHex: string;
    respawnHP: number;
    winChance: number;
  } {
    this.hasDiedSinceCheckpoint = true;
    const checkpoint = this.lastSavedCheckpoint;

    const respawnHex = checkpoint ? checkpoint.flagNodeHex : "0x00";
    const respawnHP = checkpoint ? checkpoint.savedHP : 80;
    const targetWinChance = 0.65; // 65% šanca na úspech

    console.log(`[DEATH] Postava zomrela. Zobúdza sa na checkpoint ${respawnHex} s HP ${respawnHP}.`);
    console.log(`[DDA] Balans pre ${playerId}: WinChance=65.0%, LuckBonus=+0.20, HazardMult=0.70 (Dušanov prispôsobený masakov model)`);

    return {
      respawnHex,
      respawnHP,
      winChance: targetWinChance
    };
  }
}
