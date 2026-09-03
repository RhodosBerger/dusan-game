export interface BiomeDetails {
  biome: 'GLACIER' | 'TOXIC_SWAMP' | 'DESERT' | 'BARRENS' | 'LUSH_FOREST';
  temperature: number;
  humidity: number;
  color: string;
  physics: {
    friction: number;
    conductivity: number;
    walkable: boolean;
  };
}

/**
 * Biome Engine
 * Počíta teplotu a vlhkosť pre jednotlivé hexagonálne koordináty a určuje ich biómy.
 */
export class BiomeEngine {
  /**
   * Získa axiálne súradnice (q, r) pre danú makro-pozíciu a sub-hexagon
   */
  public static getHexCoordinates(metaId: number, hexId: number): { q: number; r: number } {
    const macroCenters = [
      { q: 0, r: 0 },   { q: 3, r: -1 },  { q: 6, r: -2 },
      { q: -1, r: 3 },  { q: 2, r: 2 },   { q: 5, r: 1 },
      { q: -2, r: 6 },  { q: 1, r: 5 },   { q: 4, r: 4 }
    ];

    const subHexOffsets = [
      { q: 0, r: 0 },  // Stred
      { q: 1, r: 0 },  { q: 1, r: -1 }, { q: 0, r: -1 },
      { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
    ];

    const macro = macroCenters[metaId] || { q: 0, r: 0 };
    const offset = subHexOffsets[hexId] || { q: 0, r: 0 };

    return {
      q: macro.q + offset.q,
      r: macro.r + offset.r
    };
  }

  /**
   * Určí bióm na základe teploto-vlhkostnej sigmoidnej/goniometrickej mapy (Minecraft štýl)
   */
  public static getBiomeForCoords(q: number, r: number): BiomeDetails {
    // Fourier-sine-cosine šumový simulátor pre teplotu a vlhkosť
    const temperature = Math.sin(q * 0.5) * Math.cos(r * 0.5) * 0.5 + 0.5;
    const humidity = Math.cos(q * 0.4 + 1.0) * Math.sin(r * 0.4 - 0.5) * 0.5 + 0.5;

    let biome: BiomeDetails['biome'] = 'LUSH_FOREST';
    let color = '#2e8b57'; // Moss green
    let physics = { friction: 1.0, conductivity: 0.8, walkable: true };

    if (temperature < 0.35) {
      biome = 'GLACIER';
      color = '#add8e6'; // Ice-Blue (King AI)
      physics = { friction: 0.8, conductivity: 0.2, walkable: true };
    } else if (temperature > 0.65) {
      if (humidity > 0.55) {
        biome = 'TOXIC_SWAMP';
        color = '#4b0082'; // Acidic Purple/Dark Green (Hacker Root)
        physics = { friction: 1.6, conductivity: 0.9, walkable: true };
      } else {
        biome = 'DESERT';
        color = '#edc9af'; // Sand Orange
        physics = { friction: 1.2, conductivity: 0.4, walkable: true };
      }
    } else {
      if (humidity < 0.35) {
        biome = 'BARRENS';
        color = '#708090'; // Slate Gray
        physics = { friction: 1.0, conductivity: 0.6, walkable: true };
      }
    }

    return { biome, temperature, humidity, color, physics };
  }

  /**
   * Získa kompletné informácie o bióme pre dané ID makro a sub hexu
   */
  public static getBiomeForHex(metaId: number, hexId: number): BiomeDetails {
    const coords = this.getHexCoordinates(metaId, hexId);
    return this.getBiomeForCoords(coords.q, coords.r);
  }
}
