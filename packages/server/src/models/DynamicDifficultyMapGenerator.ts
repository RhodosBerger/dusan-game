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
 * Procedurálny generátor arény založený na obtiažnosti.
 * Používa fraktálnu distribúciu pre NPC spoločne s dynamickými bodmi migrácie a možnosťami úkrytov.
 */
export class DynamicDifficultyMapGenerator {
  /**
   * Upraví vygenerovanú mapu na základe zvolenej obtiažnosti (1 - 5)
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

    // 1. Nastavenie vlastností blokov, prekážok a úkrytov na základe obtiažnosti
    // Vyššia obtiažnosť zvyšuje počet pascí, hazard indexov a zväčšuje stealth krytie
    map.chunks.forEach(chunk => {
      chunk.blocks.forEach(block => {
        totalWalkable++;
        
        // Zvýšenie alebo zníženie priechodnosti na základe obtiažnosti
        const baseWalkableChance = 0.95 - (difficulty * 0.05); // 5% blokov nepriechodných za každý stupeň obtiažnosti
        const isStartBase = (chunk.id === 0 && block.id === 0) || (chunk.id === 8 && block.id === 6) || (chunk.id === 5 && block.id === 3);
        if (chunk.id !== 0 && !isStartBase && Math.random() > baseWalkableChance) {
          block.walkable = false;
          block.color = '#1f2937'; // Kamenná stena
          totalWalkable--;
        }

        if (block.walkable) {
          // Výpočet pravdepodobnosti schovania (stealth factor) na základe biómu a obtiažnosti
          let baseStealthChance = 0.15;
          if (block.biome === 'LUSH_FOREST') baseStealthChance = 0.65;
          if (block.biome === 'TOXIC_SWAMP') baseStealthChance = 0.45;
          
          // Vyššia obtiažnosť robí úkryty dôležitejšími
          const isStealthCover = Math.random() < (baseStealthChance + (difficulty * 0.05));
          if (isStealthCover) {
            stealthBlocksCount++;
            block.rangeModifier = 0.7; // Redukuje dosah súperov (krytie)
            block.lootProbability = Math.min(1.0, block.lootProbability + 0.15);
            // Vizuálny náznak na klientovi
            block.colorSaturation = Math.max(0.1, block.colorSaturation - 0.2); 
          }
        }
      });
    });

    // 2. Bodová migrácia (Migration Nodes / Opportunities)
    // Umiestnenie zdrojov, ktoré nútia hráčov/NPC migrovať a bojovať o ne
    const numOpportunities = 2 + difficulty; // Viac možností pre vyššie obtiažnosti
    for (let k = 0; k < numOpportunities; k++) {
      const targetChunkId = Math.floor(Math.random() * 9);
      const targetBlockId = Math.floor(Math.random() * 7);
      
      const chunk = map.chunks.find(c => c.id === targetChunkId);
      const block = chunk?.blocks.find(b => b.id === targetBlockId);
      
      if (block && block.walkable && block.hasOpportunity === null) {
        // Zoznam taktických cieľov
        const options: Array<'SURGE_NODE' | 'VOID_RIFT' | 'REPAIR_KIT'> = ['SURGE_NODE', 'VOID_RIFT', 'REPAIR_KIT'];
        block.hasOpportunity = options[k % options.length];
        opportunitiesPlaced++;
      }
    }

    // 3. Fraktálna distribúcia NPC spawnov (Cantor/Julia-inspired distribution)
    // NPC sa spawnuje vo vlnách na základe fraktálneho vzorca závislého od indexov
    // Vzorec: (chunkId * 7 + blockId) % (6 - difficulty) === 0
    map.chunks.forEach(chunk => {
      // Prvý chunk (0) je bezpečné sídlo hráča, tam sa NPC nesmú spawnovať
      if (chunk.id === 0) return;

      chunk.blocks.forEach(block => {
        if (!block.walkable || block.threadId !== null || block.hasOpportunity !== null) return;

        // Vzorec určuje, či sa na danom políčku zrodí NPC
        const divisor = Math.max(2, 7 - difficulty); // Vyššia obtiažnosť = menší divisor = viac nepriateľov
        const fractalCheck = (chunk.id * 7 + block.id) % divisor === 0;

        if (fractalCheck) {
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
