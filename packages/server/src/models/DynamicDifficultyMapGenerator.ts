import { GameMap, Block } from './Map';
import { Thread } from './Thread';

export interface FractalGeneratorStats {
  difficulty: number;
  totalWalkableBlocks: number;
  stealthCoverageRatio: number;
  migrationOpportunitiesPlaced: number;
  fractalNPCDensityPerZone: Record<number, number>;
  npcSpawns: Array<{ chunkId: number; blockId: number }>;
}

/**
 * Procedurálny generátor arény založený na obtiažnosti a Mazakovom modeli priestorových váh.
 * Používa fraktálnu distribúciu pre NPC spoločne s dynamickými bodmi migrácie a možnosťami úkrytov.
 */
export class DynamicDifficultyMapGenerator {
  /**
   * Vypočíta optimálnu váhu podľa Mazakovho modelu pre 3x3 mriežku a viac.
   * Centrum (4) má najvyššiu hustotu (1.0), rohy majú strednú (0.8), hrany nízku (0.5).
   * Pre väčšie arény škáluje váhu na základe Manhattan vzdialenosti od stredu.
   */
  public static getMazakWeight(chunkId: number, totalChunks: number = 9): number {
    if (totalChunks === 9) {
      const weights: Record<number, number> = {
        0: 0.8, 1: 0.5, 2: 0.8,
        3: 0.5, 4: 1.0, 5: 0.5,
        6: 0.8, 7: 0.5, 8: 0.8
      };
      return weights[chunkId] ?? 0.5;
    }
    
    // Väčšie mriežky (napr. 4x4, 5x5)
    const size = Math.sqrt(totalChunks);
    if (!Number.isInteger(size)) {
      return 0.6; // Fallback
    }
    const cx = (size - 1) / 2;
    const cy = (size - 1) / 2;
    const x = chunkId % size;
    const y = Math.floor(chunkId / size);
    const distance = Math.abs(x - cx) + Math.abs(y - cy);
    return Number((1.0 / (1.0 + distance)).toFixed(2));
  }

  /**
   * Upraví vygenerovanú mapu na základe zvolenej obtiažnosti (1 - 5) a váhového Mazakovho modelu
   */
  public static generateTacticalBoard(map: GameMap, difficulty: number): FractalGeneratorStats {
    let stealthBlocksCount = 0;
    let totalWalkable = 0;
    let opportunitiesPlaced = 0;
    const densityPerZone: Record<number, number> = {};
    const npcSpawns: Array<{ chunkId: number; blockId: number }> = [];

    // Inicializácia štatistík zón (chunks 0-8)
    for (let c = 0; c < 9; c++) {
      densityPerZone[c] = 0;
    }

    const totalChunks = map.chunks.length;

    // 1. Nastavenie vlastností blokov, prekážok a úkrytov na základe obtiažnosti a Mazak váhy
    map.chunks.forEach(chunk => {
      const mazakWeight = this.getMazakWeight(chunk.id, totalChunks);

      chunk.blocks.forEach(block => {
        totalWalkable++;
        
        // Walkable šanca sa prispôsobuje Mazakovej váhe sektora
        const baseWalkableChance = (0.95 - (difficulty * 0.04)) * (0.8 + (mazakWeight * 0.2));
        const isStartBase = (chunk.id === 0 && block.id === 0) || (chunk.id === 8 && block.id === 6) || (chunk.id === 5 && block.id === 3);
        
        if (chunk.id !== 0 && !isStartBase && Math.random() > baseWalkableChance) {
          block.walkable = false;
          block.color = '#1f2937'; // Kamenná stena
          totalWalkable--;
        }

        if (block.walkable) {
          let baseStealthChance = 0.15;
          if (block.biome === 'LUSH_FOREST') baseStealthChance = 0.65;
          if (block.biome === 'TOXIC_SWAMP') baseStealthChance = 0.45;
          
          const isStealthCover = Math.random() < (baseStealthChance + (difficulty * 0.05));
          if (isStealthCover) {
            stealthBlocksCount++;
            block.rangeModifier = 0.7;
            block.lootProbability = Math.min(1.0, block.lootProbability + 0.15);
            block.colorSaturation = Math.max(0.1, block.colorSaturation - 0.2); 
          }
        }
      });
    });

    // 2. Bodová migrácia (Migration Nodes / Opportunities) prispôsobená váham
    const numOpportunities = 2 + difficulty;
    for (let k = 0; k < numOpportunities; k++) {
      // Váhové losovanie chunkov: preferujeme chunky s vyššou Mazakovou váhou
      let chosenChunkId = 4; // default
      let maxRoll = -1;
      
      for (let c = 0; c < totalChunks; c++) {
        const weight = this.getMazakWeight(c, totalChunks);
        const roll = Math.random() * weight;
        if (roll > maxRoll) {
          maxRoll = roll;
          chosenChunkId = c;
        }
      }

      const targetBlockId = Math.floor(Math.random() * 7);
      const chunk = map.chunks.find(c => c.id === chosenChunkId);
      const block = chunk?.blocks.find(b => b.id === targetBlockId);
      
      if (block && block.walkable && block.hasOpportunity === null) {
        const options: Array<'SURGE_NODE' | 'VOID_RIFT' | 'REPAIR_KIT'> = ['SURGE_NODE', 'VOID_RIFT', 'REPAIR_KIT'];
        block.hasOpportunity = options[k % options.length];
        opportunitiesPlaced++;
      }
    }

    // 3. Fraktálna distribúcia NPC spawnov škálovaná Mazak modelom
    map.chunks.forEach(chunk => {
      if (chunk.id === 0) return; // Bezpečný start
      
      const mazakWeight = this.getMazakWeight(chunk.id, totalChunks);

      chunk.blocks.forEach(block => {
        if (!block.walkable || block.threadId !== null || block.hasOpportunity !== null) return;

        // Pravdepodobnosť spawnu NPC je priamo úmerná obtiažnosti a Mazakovej váhe sektora
        const spawnChance = (0.2 + (difficulty * 0.1)) * mazakWeight;
        
        if (Math.random() < spawnChance) {
          densityPerZone[chunk.id]++;
          npcSpawns.push({ chunkId: chunk.id, blockId: block.id });
        }
      });
    });

    return {
      difficulty,
      totalWalkableBlocks: totalWalkable,
      stealthCoverageRatio: stealthBlocksCount / (totalWalkable || 1),
      migrationOpportunitiesPlaced: opportunitiesPlaced,
      fractalNPCDensityPerZone: densityPerZone,
      npcSpawns
    };
  }
}
