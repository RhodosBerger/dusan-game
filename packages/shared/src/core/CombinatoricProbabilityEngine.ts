/**
 * Combinatoric Probability Engine
 * Štatistický a pravdepodobnostný model na riadenie balansu herných systémov, dropov a obranných komb.
 */
export class CombinatoricProbabilityEngine {
  /**
   * Vypočíta pravdepodobnosť nálezu vzácnej suroviny (Sigmoid model)
   * P = 1 / (1 + e^(-(entropy * 1.5 + luck - difficulty)))
   */
  public static calculateLootDropProbability(entropy: number, luck: number, difficulty: number): number {
    const exponent = -(entropy * 1.5 + luck - difficulty);
    return 1 / (1 + Math.exp(exponent));
  }

  /**
   * Zistí náhodným rollom, či surovina dropne na základe vypočítanej pravdepodobnosti
   */
  public static rollLootDrop(entropy: number, luck: number, difficulty: number): boolean {
    const prob = this.calculateLootDropProbability(entropy, luck, difficulty);
    return Math.random() < prob;
  }

  /**
   * Vypočíta koeficient prechodu poškodenia na základe brnenia a dĺžky combo reťazca (exponenciálny útlm)
   * Redukcia = 1 - e^(-0.35 * (armor + comboCount * 0.5))
   * Vráti koeficient (0.1 - 1.0), ktorým sa vynásobí prichádzajúce poškodenie
   */
  public static calculateComboDamageFactor(armor: number, comboCount: number): number {
    const k = 0.35;
    const reduction = 1 - Math.exp(-k * (armor + comboCount * 0.5));
    // Koeficient poškodenia = 1.0 - redukcia
    return Math.max(0.1, 1.0 - reduction); // Brnenie znižuje poškodenie až na minimum 10%
  }

  /**
   * Vypočíta energetické zaťaženie za pohyb na základe preťaženia systémovej energie
   * Cost = baseCost * (1 + systemEnergy / 100)
   */
  public static calculateMovementEnergyCost(baseCost: number, systemEnergy: number): number {
    return baseCost * (1 + systemEnergy / 100);
  }
}
