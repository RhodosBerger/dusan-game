// packages/server/src/models/SovereignContentDistributor.ts
import { SovereignEngine } from './SovereignEngine';
import { Thread } from './Thread';
import { BiomeEngine, QuestTriggerManager } from '@dusan-game/shared';

export interface RegionalConfig {
  regionId: number;
  regionName: string;
  biomeType: string;
  allowedItems: string[];
  questTemplate: {
    id: string;
    title: string;
    description: string;
    objectiveType: 'REACH_BIOME' | 'HARVEST_MATERIAL' | 'DEFEAT_NPC' | 'REACH_LEVEL';
    targetValue: number;
    targetName: string;
    xpReward: number;
  };
  hazardRating: number;
}

export class SovereignContentDistributor {
  private static REGIONS: Record<number, RegionalConfig> = {
    1: {
      regionId: 1,
      regionName: 'Toxic Void Basin',
      biomeType: 'TOXIC_SWAMP',
      allowedItems: ['Spores', 'AcidCanister'],
      questTemplate: {
        id: 'q_toxic_basin_explore',
        title: 'Toxic Basin Exploration',
        description: 'Navigate to the deep toxic void basin to secure energy matrix elements.',
        objectiveType: 'REACH_BIOME',
        targetValue: 1,
        targetName: 'TOXIC_SWAMP',
        xpReward: 150
      },
      hazardRating: 0.75
    },
    7: {
      regionId: 7,
      regionName: 'Glacial Fracture',
      biomeType: 'GLACIER',
      allowedItems: ['CrystalShard', 'FrostCore'],
      questTemplate: {
        id: 'q_glacial_explore',
        title: 'Glacial Fracture Breach',
        description: 'Explore the high-friction ice shards region to extract crystal components.',
        objectiveType: 'REACH_BIOME',
        targetValue: 1,
        targetName: 'GLACIER',
        xpReward: 120
      },
      hazardRating: 0.5
    },
    3: {
      regionId: 3,
      regionName: 'Ancient Core Forest',
      biomeType: 'LUSH_FOREST',
      allowedItems: ['Spores', 'RootFiber'],
      questTemplate: {
        id: 'q_forest_explore',
        title: 'Ancient Core Pathfinding',
        description: 'Scan the deep forest vegetation path for aetheric traces.',
        objectiveType: 'REACH_BIOME',
        targetValue: 1,
        targetName: 'LUSH_FOREST',
        xpReward: 100
      },
      hazardRating: 0.25
    }
  };

  /**
   * Evaluates the player's position and dynamically triggers/distributes quests, chests, and hazards.
   */
  public static evaluateAndDistribute(
    engine: SovereignEngine,
    threadId: string,
    chunkId: number,
    hexId: number
  ): string {
    const thread = engine.threads.find(t => t.id === threadId);
    if (!thread) return 'No active player thread found.';

    const biomeDetails = BiomeEngine.getBiomeForHex(chunkId, hexId);
    const biomeType = biomeDetails ? biomeDetails.biome : 'LUSH_FOREST';

    // Find if we have a custom regional configuration for this chunk
    const region = this.REGIONS[chunkId];
    let logs = `[DISTRIBUTOR] Thread ${threadId} entered Chunk ${chunkId} (Biome: ${biomeType}).`;

    if (region) {
      // 1. Assign regional quest if not already assigned
      const hasQuest = QuestTriggerManager.hasQuest(thread, region.questTemplate.id);
      if (!hasQuest) {
        QuestTriggerManager.createAndAssignQuest(
          thread,
          region.questTemplate.id,
          region.questTemplate.title,
          region.questTemplate.description,
          region.questTemplate.objectiveType,
          region.questTemplate.targetValue,
          region.questTemplate.xpReward,
          region.questTemplate.targetName
        );
        logs += ` Assigned new regional quest: "${region.questTemplate.title}".`;
      }

      // 2. Spawn a regional loot chest if empty with probability based on progress / hazard rating
      const chunkObj = engine.map.chunks.find(c => c.id === chunkId);
      const blockObj = chunkObj?.blocks.find(b => b.id === hexId);
      
      if (blockObj && !blockObj.hasChest && !blockObj.hasTrap) {
        const spawnChance = 0.4 + (region.hazardRating * 0.3) + (thread.level * 0.05);
        if (Math.random() < spawnChance) {
          blockObj.hasChest = true;
          logs += ` Dynamic Spawner: Distributed regional chest containing ${region.allowedItems.join('/')}.`;
          engine.traceLog.push({
            type: 'Spawn',
            threadId: 'dynamic_chest',
            chunkId,
            blockId: hexId,
            timestamp: Date.now(),
            message: `Regional chest spawned at Chunk ${chunkId} Hex ${hexId}`
          } as any);
        }
      }

      // 3. Apply minor environment hazard warning if hazard rating is high
      if (region.hazardRating > 0.6 && Math.random() < 0.5) {
        thread.health = Math.max(1, thread.health - 2);
        logs += ` Environmental Hazard: Acid Rain / Eruption detected. Udelené 2 poškodenie (HP: ${thread.health}).`;
        engine.traceLog.push({
          type: 'Combat',
          attackerId: 'environment_hazard',
          targetId: threadId,
          damage: 2,
          armor: 0,
          timestamp: Date.now(),
          message: `Environmental hazard in ${region.regionName} dealt 2 damage to ${threadId}.`
        } as any);
      }
    } else {
      // Default fallback spawner
      const chunkObj = engine.map.chunks.find(c => c.id === chunkId);
      const blockObj = chunkObj?.blocks.find(b => b.id === hexId);
      if (blockObj && !blockObj.hasChest && Math.random() < 0.25) {
        blockObj.hasChest = true;
        logs += ` Default Spawner: Placed standard supply chest.`;
      }
    }

    // Dopamine balancing loop: Ensure at least one loot chest/opportunity exists in this chunk to drive progress
    const currentChunk = engine.map.chunks.find(c => c.id === chunkId);
    if (currentChunk) {
      const existingChests = currentChunk.blocks.filter(b => b.hasChest || b.hasOpportunity).length;
      if (existingChests === 0) {
        const freeBlock = currentChunk.blocks.find(b => 
          b.walkable !== false && 
          b.id !== hexId && 
          !engine.threads.some(t => t.position && t.position.meta === chunkId && t.position.hex === b.id)
        );
        if (freeBlock) {
          freeBlock.hasChest = true;
          logs += ` [DOPAMINE_LOOP] Forced spawn of a loot chest in Chunk ${chunkId} Hex ${freeBlock.id} to ensure gameplay progress.`;
          engine.traceLog.push({
            type: 'Spawn',
            threadId: 'dopamine_chest',
            chunkId,
            blockId: freeBlock.id,
            timestamp: Date.now(),
            message: `Dopamine loot chest spawned at Chunk ${chunkId} Hex ${freeBlock.id}`
          } as any);
        }
      }
    }

    // Trigger quest progress update for REACH_BIOME
    QuestTriggerManager.updateQuestProgress(
      thread,
      'REACH_BIOME',
      1,
      biomeType,
      (completedQuest) => {
        QuestTriggerManager.triggerInteractiveContent(engine, thread, completedQuest);
      }
    );

    return logs;
  }
}
