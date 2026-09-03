import { BiomeEngine } from './BiomeEngine';

export interface MLSynthesisResult {
  colorSaturation: number;
  textureDensity: number;
  lightEmission: number;
  contrastRatio: number;
  particleRate: number;
  
  walkable: boolean;
  energyCostMultiplier: number;
  rangeModifier: number;
  hazardIndex: number;
  lootProbability: number;
}

/**
 * Kombinatorický ML Syntetizátor Terénov
 * Samostatná ML-like vrstva využívajúca dopredný neurónový model pre generovanie detailných vlastností blokov.
 */
export class MLTerrainSynthesizer {
  // Váhová matica pre estetické vlastnosti (5x5): vstupy [T, H, |q|/10, |r|/10, seed] -> výstupy [sat, density, light, contrast, particles]
  private static W_aesthetic: Record<string, number[][]> = {
    GLACIER: [
      [0.8, -0.2, 0.1, 0.0, 0.5], // colorSaturation
      [0.4, 0.6, 0.0, 0.1, 0.2],  // textureDensity
      [0.9, -0.5, 0.2, 0.0, 0.1], // lightEmission (King AI žiara)
      [0.7, 0.3, -0.1, 0.1, 0.4], // contrastRatio
      [0.8, 0.1, 0.3, 0.2, 0.6]   // particleRate (snehové vločky)
    ],
    TOXIC_SWAMP: [
      [0.9, 0.8, -0.2, 0.1, 0.7],  // colorSaturation
      [0.8, 0.9, 0.1, 0.0, 0.5],   // textureDensity
      [0.7, 0.9, 0.0, -0.1, 0.8],  // lightEmission (acid glow)
      [0.5, 0.5, 0.3, 0.2, 0.4],   // contrastRatio
      [0.9, 0.8, 0.4, 0.3, 0.9]    // particleRate (bubliny)
    ],
    LUSH_FOREST: [
      [0.6, 0.7, 0.1, 0.1, 0.3],
      [0.5, 0.8, 0.2, 0.1, 0.4],
      [0.2, 0.3, 0.0, 0.0, 0.1],
      [0.5, 0.5, 0.1, 0.1, 0.2],
      [0.4, 0.6, 0.2, 0.2, 0.3]
    ],
    DESERT: [
      [0.7, -0.5, 0.3, 0.2, 0.4],
      [0.3, -0.4, 0.1, 0.1, 0.2],
      [0.1, -0.2, 0.0, 0.0, 0.0],
      [0.6, -0.3, 0.2, 0.1, 0.3],
      [0.7, -0.1, 0.4, 0.4, 0.5]
    ],
    BARRENS: [
      [0.4, -0.6, 0.5, 0.3, 0.2],
      [0.7, -0.2, 0.3, 0.2, 0.6],
      [0.8, -0.4, 0.4, 0.4, 0.7], // magma žiara
      [0.9, -0.1, 0.2, 0.2, 0.5],
      [0.6, -0.3, 0.5, 0.5, 0.6]
    ]
  };

  // Váhová matica pre praktické/fyzikálne vlastnosti (5x5): vstupy [T, H, |q|/10, |r|/10, seed] -> výstupy [walkable, energyCost, rangeMod, hazard, loot]
  private static W_practical: Record<string, number[][]> = {
    GLACIER: [
      [1.0, 0.0, 0.0, 0.0, 0.0],   // walkable
      [-0.4, 0.2, 0.1, 0.1, 0.2],  // energyCost (nízke trenie = rýchlejší sklze)
      [0.1, -0.3, 0.0, 0.0, 0.2],  // rangeMod
      [0.2, 0.1, 0.1, 0.0, 0.1],   // hazard
      [0.4, 0.5, 0.2, 0.1, 0.5]    // loot
    ],
    TOXIC_SWAMP: [
      [0.8, -0.2, 0.0, 0.0, -0.1], // walkable
      [0.8, 0.9, 0.2, 0.2, 0.6],   // energyCost (vysoké trenie)
      [-0.3, 0.4, -0.1, 0.0, -0.2], // rangeMod
      [0.9, 0.8, 0.3, 0.3, 0.7],   // hazard (acid damage)
      [0.6, 0.7, 0.4, 0.2, 0.8]    // loot
    ],
    LUSH_FOREST: [
      [1.0, 0.0, 0.0, 0.0, 0.0],
      [0.0, 0.1, 0.0, 0.0, 0.1],
      [0.0, 0.0, 0.0, 0.0, 0.0],
      [0.0, 0.0, 0.0, 0.0, 0.0],
      [0.5, 0.6, 0.1, 0.1, 0.4]
    ],
    DESERT: [
      [1.0, 0.0, 0.0, 0.0, 0.0],
      [0.3, -0.1, 0.1, 0.1, 0.2],
      [0.0, -0.2, 0.1, 0.0, 0.1],
      [0.4, -0.2, 0.2, 0.1, 0.3],
      [0.3, 0.3, 0.2, 0.1, 0.3]
    ],
    BARRENS: [
      [0.9, 0.0, 0.0, 0.0, 0.0],
      [0.1, -0.3, 0.1, 0.1, 0.2],
      [0.2, -0.1, 0.0, 0.0, 0.1],
      [0.7, -0.4, 0.4, 0.3, 0.5], // lava hazard
      [0.4, 0.2, 0.3, 0.3, 0.6]
    ]
  };

  private static bias_aesthetic = [0.1, -0.1, 0.0, 0.2, -0.2];
  private static bias_practical = [0.5, -0.2, 0.0, -0.3, 0.1];

  private static sigmoid(z: number): number {
    return 1.0 / (1.0 + Math.exp(-z));
  }

  /**
   * Vykoná neurónový dopredný výpočet pre daný blok
   */
  public static synthesizeBlock(metaId: number, hexId: number): MLSynthesisResult {
    const coords = BiomeEngine.getHexCoordinates(metaId, hexId);
    const biomeDetails = BiomeEngine.getBiomeForCoords(coords.q, coords.r);
    
    const T = biomeDetails.temperature;
    const H = biomeDetails.humidity;
    const qNorm = Math.abs(coords.q) / 10.0;
    const rNorm = Math.abs(coords.r) / 10.0;
    const seed = ((coords.q * coords.r) % 7) / 7.0;

    const input = [T, H, qNorm, rNorm, seed];
    const bName = biomeDetails.biome;

    const W_a = this.W_aesthetic[bName] || this.W_aesthetic.LUSH_FOREST;
    const W_p = this.W_practical[bName] || this.W_practical.LUSH_FOREST;

    // 1. Estetické výstupy
    const aesOutputs = W_a.map((row, idx) => {
      const dot = row.reduce((sum, w, i) => sum + w * input[i], 0);
      return this.sigmoid(dot + this.bias_aesthetic[idx]);
    });

    // 2. Praktické výstupy
    const pracOutputs = W_p.map((row, idx) => {
      const dot = row.reduce((sum, w, i) => sum + w * input[i], 0);
      return this.sigmoid(dot + this.bias_practical[idx]);
    });

    // Mapovanie hodnôt do praktických rozsahov
    const walkable = pracOutputs[0] > 0.4;
    
    // energyCostMultiplier škálujeme od 0.6 do 2.5
    const energyCostMultiplier = 0.6 + pracOutputs[1] * 1.9;

    // rangeModifier škálujeme od -1 do +1, zaokrúhlené na celé číslo
    const rangeModifier = Math.round((pracOutputs[2] - 0.5) * 2);

    const hazardIndex = pracOutputs[3];
    const lootProbability = pracOutputs[4];

    return {
      colorSaturation: aesOutputs[0],
      textureDensity: aesOutputs[1],
      lightEmission: aesOutputs[2],
      contrastRatio: aesOutputs[3],
      particleRate: aesOutputs[4],
      
      walkable,
      energyCostMultiplier,
      rangeModifier,
      hazardIndex,
      lootProbability
    };
  }
}
