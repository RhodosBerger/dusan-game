import { Quest } from '@dusan-game/shared';

export interface DailyQuestData {
  lastRefresh: number; // UTC timestamp of last generation
  activeList: Quest[];
}

const POSSIBLE_DAILY_QUESTS: Array<Omit<Quest, 'progress' | 'completed'>> = [
  {
    id: 'daily_defeat_npcs',
    title: 'Lov na procesory',
    description: 'Poraz 2 NPC nepriateľské jednotky v Aréne.',
    objectiveType: 'DEFEAT_NPC',
    targetValue: 2,
    xpReward: 100,
    materialReward: { type: 'CrystalShard', amount: 3 }
  },
  {
    id: 'daily_reach_swamp',
    title: 'Prieskum Toxických Hlbín',
    description: 'Vstúp na políčko Toxic Swamp na preskúmanie anomálie.',
    objectiveType: 'REACH_BIOME',
    targetValue: 1,
    targetName: 'TOXIC_SWAMP',
    xpReward: 80,
    materialReward: { type: 'Spores', amount: 3 }
  },
  {
    id: 'daily_collect_chests',
    title: 'Hľadač pokladov',
    description: 'Nazbieraj 2 Loot truhlice v Aréne.',
    objectiveType: 'COLLECT_CHEST',
    targetValue: 2,
    xpReward: 120,
    materialReward: { type: 'CrystalShard', amount: 4 }
  },
  {
    id: 'daily_spend_energy',
    title: 'Preťaženie siete',
    description: 'Spotrebuj aspoň 50 jednotiek systémovej energie.',
    objectiveType: 'SPEND_ENERGY',
    targetValue: 50,
    xpReward: 90,
    materialReward: { type: 'Spores', amount: 4 }
  },
  {
    id: 'daily_cast_ultimate',
    title: 'Maximálna kapacita',
    description: 'Zahraj 3 Ultimate karty z ruky.',
    objectiveType: 'CAST_ULTIMATE',
    targetValue: 3,
    xpReward: 150,
    materialReward: { type: 'CrystalShard', amount: 5 }
  },
  {
    id: 'daily_deal_damage',
    title: 'Sémantická erózia',
    description: 'Udeľ nepriateľom aspoň 15 bodov poškodenia.',
    objectiveType: 'DEAL_DAMAGE',
    targetValue: 15,
    xpReward: 110,
    materialReward: { type: 'Spores', amount: 5 }
  }
];

export class DailyQuestEngine {
  /**
   * Vygeneruje 3 náhodné denné úlohy
   */
  public static generateDailyQuests(heroType: 'crystal' | 'toxic' | 'void'): Quest[] {
    const shuffled = [...POSSIBLE_DAILY_QUESTS].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    
    return selected.map(q => ({
      ...q,
      progress: 0,
      completed: false,
      materialReward: q.materialReward 
        ? { type: heroType === 'crystal' ? 'CrystalShard' : heroType === 'toxic' ? 'Spores' : 'VoidCore', amount: q.materialReward.amount }
        : undefined
    }));
  }

  /**
   * Skontroluje, či prešiel kalendárny deň (od posledného refreshu) a podľa toho zrotuje úlohy.
   */
  public static checkAndRefreshQuests(questsJson: string, heroType: 'crystal' | 'toxic' | 'void'): string {
    const now = Date.now();
    try {
      const data = JSON.parse(questsJson);
      
      // Ak ide o starý formát (len pole), alebo chýba lastRefresh
      if (Array.isArray(data) || !data.lastRefresh) {
        const initialData: DailyQuestData = {
          lastRefresh: now,
          activeList: this.generateDailyQuests(heroType)
        };
        return JSON.stringify(initialData);
      }

      const lastDate = new Date(data.lastRefresh);
      const nowDate = new Date(now);

      // Zmena dňa: ak je iný rok, mesiac, alebo deň v mesiaci
      const isNewDay = 
        lastDate.getUTCFullYear() !== nowDate.getUTCFullYear() ||
        lastDate.getUTCMonth() !== nowDate.getUTCMonth() ||
        lastDate.getUTCDate() !== nowDate.getUTCDate();

      if (isNewDay) {
        console.log(`[DAILY_QUEST_ENGINE] Nový deň zaznamenaný. Rotujem denné úlohy...`);
        const freshData: DailyQuestData = {
          lastRefresh: now,
          activeList: this.generateDailyQuests(heroType)
        };
        return JSON.stringify(freshData);
      }

      return questsJson;
    } catch (e) {
      // Fallback pri poškodenom JSON
      const fallbackData: DailyQuestData = {
        lastRefresh: now,
        activeList: this.generateDailyQuests(heroType)
      };
      return JSON.stringify(fallbackData);
    }
  }

  /**
   * Pomocná metóda na preklad formátu z DB na pole pre Thread profil
   */
  public static parseQuestsForThread(questsJson: string): Quest[] {
    try {
      const data = JSON.parse(questsJson);
      if (Array.isArray(data)) {
        return data;
      }
      return data.activeList || [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Pomocná metóda na zabalenie poľa úloh späť pre uloženie do DB
   */
  public static packageQuestsForDb(questsJson: string, activeQuests: Quest[]): string {
    try {
      const data = JSON.parse(questsJson);
      if (Array.isArray(data) || !data.lastRefresh) {
        return JSON.stringify({
          lastRefresh: Date.now(),
          activeList: activeQuests
        });
      }
      data.activeList = activeQuests;
      return JSON.stringify(data);
    } catch (e) {
      return JSON.stringify({
        lastRefresh: Date.now(),
        activeList: activeQuests
      });
    }
  }
}
