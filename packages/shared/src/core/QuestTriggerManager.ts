// packages/shared/src/core/QuestTriggerManager.ts
import { Quest } from './PredictiveDirector';

export interface PlayerWithQuests {
  id: string;
  quests: Quest[];
  materials: { [key: string]: number };
  gainXP(xp: number): void;
}

export class QuestTriggerManager {
  // Delegátor pre serverovo-špecifické spracovanie interaktívneho obsahu (Rule 6)
  static onInteractiveTrigger: ((engine: any, player: PlayerWithQuests, quest: Quest) => void) | null = null;

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

    if (QuestTriggerManager.onInteractiveTrigger) {
      QuestTriggerManager.onInteractiveTrigger(engine, player, quest);
      return;
    }

    // Základný fallback pre klientské prostredie (bez platformovo špecifického require)
    if (quest.id === 'q_reach_swamp') {
      const targetChunk = engine.map?.chunks?.find((c: any) => c.id === 5);
      const targetBlock = targetChunk?.blocks?.find((b: any) => b.id === 3);
      if (targetBlock) {
        targetBlock.hasOpportunity = 'SURGE_NODE';
        console.log(`[QUEST_TRIGGER] Interactive Spawner: Spawned SURGE_NODE at Chunk 5 Hex 3 due to quest completion.`);
      }
    }
  }
}
