// packages/shared/src/core/QuestTriggerManager.ts
import { Quest } from './PredictiveDirector';

declare var require: any;
declare var process: any;

export interface PlayerWithQuests {
  id: string;
  quests: Quest[];
  materials: { [key: string]: number };
  gainXP(xp: number): void;
}

export class QuestTriggerManager {
  // --- CRUD: Create ---
  static createAndAssignQuest(
    player: PlayerWithQuests,
    id: string,
    title: string,
    description: string,
    objectiveType: Quest['objectiveType'],
    targetValue: number,
    xpReward: number,
    targetName?: string,
    materialReward?: { type: string; amount: number }
  ): Quest {
    const newQuest: Quest = {
      id,
      title,
      description,
      objectiveType,
      targetValue,
      progress: 0,
      completed: false,
      xpReward,
      targetName,
      materialReward
    };
    player.quests.push(newQuest);
    console.log(`[QUEST_CRUD] Assigned quest "${title}" to player ${player.id}.`);
    return newQuest;
  }

  // --- CRUD: Read ---
  static getActiveQuests(player: PlayerWithQuests): Quest[] {
    return player.quests.filter(q => !q.completed);
  }

  static getCompletedQuests(player: PlayerWithQuests): Quest[] {
    return player.quests.filter(q => q.completed);
  }

  // --- CRUD: Update ---
  static updateQuestProgress(
    player: PlayerWithQuests,
    type: Quest['objectiveType'],
    amount: number,
    name?: string,
    onQuestCompleted?: (quest: Quest) => void
  ): void {
    for (const quest of player.quests) {
      if (quest.completed) continue;
      if (quest.objectiveType === type) {
        if (name && quest.targetName && quest.targetName !== name) continue;

        if (type === 'REACH_LEVEL') {
          quest.progress = amount;
        } else {
          quest.progress += amount;
        }

        if (quest.progress >= quest.targetValue) {
          quest.progress = quest.targetValue;
          quest.completed = true;
          console.log(`[QUEST COMPLETED] Hrdina ${player.id} úspešne dokončil quest "${quest.title}"!`);
          player.gainXP(quest.xpReward);

          if (quest.materialReward) {
            const current = player.materials[quest.materialReward.type] || 0;
            player.materials[quest.materialReward.type] = current + quest.materialReward.amount;
            console.log(`[QUEST REWARD] Pripísané suroviny pre ${player.id}: +${quest.materialReward.amount} ${quest.materialReward.type}`);
          }

          if (onQuestCompleted) {
            onQuestCompleted(quest);
          }
        }
      }
    }
  }

  // --- CRUD: Delete ---
  static abandonQuest(player: PlayerWithQuests, questId: string): boolean {
    const idx = player.quests.findIndex(q => q.id === questId);
    if (idx !== -1) {
      const removed = player.quests.splice(idx, 1)[0];
      console.log(`[QUEST_CRUD] Abandoned quest "${removed.title}" for player ${player.id}.`);
      return true;
    }
    return false;
  }

  // --- Boolean Evaluators ---
  static hasQuest(player: PlayerWithQuests, questId: string): boolean {
    return player.quests.some(q => q.id === questId);
  }

  static isQuestCompleted(player: PlayerWithQuests, questId: string): boolean {
    const quest = player.quests.find(q => q.id === questId);
    return quest ? quest.completed : false;
  }

  static hasCompletedAllQuests(player: PlayerWithQuests): boolean {
    if (player.quests.length === 0) return false;
    return player.quests.every(q => q.completed);
  }

  // --- Interactive Trigger Routing ---
  static triggerInteractiveContent(engine: any, player: PlayerWithQuests, quest: Quest): void {
    console.log(`[QUEST_TRIGGER] Running interactive trigger for completed quest "${quest.title}"...`);

    if (quest.id === 'q_defeat_npcs') {
      try {
        const path = require('path');
        const DatabaseSyncManager = require(path.join(process.cwd(), 'packages/server/src/models/DatabaseSyncManager')).DatabaseSyncManager;
        const dbManager = new DatabaseSyncManager();
        
        const username = player.id === 'thread_king_ai' ? 'king_player' : 'hacker_player';
        dbManager.addPlayerItem(username, 'aether_saber', 'WEAPON');
        console.log(`[QUEST_TRIGGER] Interactive Reward: Added Aether Saber to database inventory for ${username}.`);
        
        engine.traceLog.push({
          type: 'ChestClaim',
          threadId: player.id,
          message: `Interactive Quest Reward: Added Aether Saber to database inventory for ${username}!`,
          timestamp: Date.now()
        } as any);
      } catch (e) {
        console.log(`[QUEST_TRIGGER_WARN] Failed to insert DB item (non-db context): ${e}`);
      }
    } else if (quest.id === 'q_reach_swamp') {
      const targetChunk = engine.map.chunks.find((c: any) => c.id === 5);
      const targetBlock = targetChunk?.blocks.find((b: any) => b.id === 3);
      if (targetBlock) {
        targetBlock.hasOpportunity = 'SURGE_NODE';
        console.log(`[QUEST_TRIGGER] Interactive Spawner: Spawned SURGE_NODE at Chunk 5 Hex 3 due to quest completion.`);
        
        engine.traceLog.push({
          type: 'Spawn',
          threadId: 'opp_surge_node',
          chunkId: 5,
          blockId: 3,
          timestamp: Date.now()
        });
      }
    }
  }
}
