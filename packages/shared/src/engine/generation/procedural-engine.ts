/**
 * Procedural Generator - Simplified for Snapshot System
 */

export interface GenerationContext {
  entropy: number;
  biome: string;
  difficulty: number;
}

export class ProceduralGenerator {
  generateSectorData(coord: any, context: GenerationContext): any {
    // Generovanie obsahu na základe seedu a kontextu
    const seed = coord.q * 1000 + coord.r;
    const random = this.seededRandom(seed);
    
    return {
      biome: context.biome || this.selectBiome(random, context.entropy),
      type: this.selectType(random),
      entropyLevel: context.entropy,
      difficulty: context.difficulty,
      entities: this.generateEntities(random, context),
      terrain: this.generateTerrain(random)
    };
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  private selectBiome(random: number, entropy: number): string {
    if (entropy > 0.7) return 'chaos';
    if (random < 0.3) return 'shadow';
    if (random < 0.6) return 'light';
    return 'default';
  }

  private selectType(random: number): string {
    if (random < 0.1) return 'boss';
    if (random < 0.3) return 'enemy';
    if (random < 0.5) return 'loot';
    if (random < 0.7) return 'quest';
    return 'terrain';
  }

  private generateEntities(random: number, context: GenerationContext): any[] {
    const count = Math.floor(random * 3);
    const entities = [];
    
    for (let i = 0; i < count; i++) {
      entities.push({
        id: `entity_${Date.now()}_${i}`,
        type: this.selectType(this.seededRandom(Date.now() + i)),
        stats: {
          health: 100 * context.difficulty,
          damage: 10 * context.difficulty
        }
      });
    }
    
    return entities;
  }

  private generateTerrain(random: number): any {
    return {
      elevation: random * 100,
      roughness: random,
      walkable: random > 0.2
    };
  }
}

export default ProceduralGenerator;
