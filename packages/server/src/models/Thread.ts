import { Instruction } from './Instruction';
import { Quest, AethericDiceEngine, PROTAGONIST_CATEGORIES } from '@dusan-game/shared';

export class Thread {
  id: string;
  name: string;
  type: 'PLAYER' | 'HELPER' | 'NPC';
  ownerId: string | null;
  
  health: number;
  maxHealth: number;
  armor: number;
  attackReach: number;
  spellReach: number;
  movementBase: number;
  hasFreeClockCycle: boolean;
  axiomaticFlags: number;
  freeMovementUsed: boolean;
  
  get handLimit(): number {
    return (this.maxHandSize || 4) + this.axiomaticFlags;
  }
  
  altitudeTier: 'LOW_GROUND' | 'STANDARD_HEX' | 'HIGH_OVERCLOCK';
  unitType: 'HERO' | 'TOWER' | 'FLAG' | 'NPC' | 'MONSTER';
  isCollectible: boolean;
  collectedFlags: number;
  maxHandSize: number;
  baseResistance: number;
  memoryIntegrity: number;
  superpositionState: 'WAVE_FUNCTION' | 'ENTANGLED' | 'SCHRODINGER_SHIELD' | null;

  materials: Record<string, number>;
  quests: Quest[];
  items: { itemKey: string; category: string; quantity: number; durability: number }[];
  artifacts: { id: string; artifactKey: string; category: string; heroClass: string; spellReachBonus: number; damageBonus: number }[];

  // RPG Stat Progression
  level: number;
  xp: number;
  baseDamage: number;
  luck: number;

  isSlowed: boolean;
  isRooted: boolean;
  isDisarmed: boolean;
  isSilenced: boolean;
  isStealthed: boolean;

  position: { meta: number | null; hex: number | null };
  wounds: Record<string, number>;
  currentBuffer: Instruction[];
  drawPile: Instruction[];
  discardPile: Instruction[];

  constructor(id: string, type: 'PLAYER' | 'HELPER' | 'NPC', ownerId: string | null = null) {
    this.id = id;
    this.name = id;
    this.type = type;
    this.ownerId = ownerId;

    this.maxHealth = 15;
    this.health = this.maxHealth; 
    this.armor = 0;

    // Resolve protagonist category stats (Order, Chaos, Death, Destruction classes)
    const categoryKey = AethericDiceEngine.getCategoryByHero(id);
    const category = PROTAGONIST_CATEGORIES[categoryKey] || PROTAGONIST_CATEGORIES.SOVEREIGN_EXEMPLAR;
    
    this.attackReach = category.baseReach;
    this.spellReach = category.spellReach;
    this.movementBase = category.movementBase;

    this.hasFreeClockCycle = true;
    this.axiomaticFlags = 0;
    this.freeMovementUsed = false;
    
    // Progres
    this.level = 1;
    this.xp = 0;
    this.baseDamage = 5;
    this.luck = 0.5;

    // Priradenie surovín podľa ID
    this.materials = {
      CrystalShard: id.includes('king') ? 5 : 0,
      Spores: id.includes('hacker') ? 5 : 0,
      VoidCore: id.includes('weaver') ? 5 : 0
    };

    this.isSlowed = false;
    this.isRooted = false;
    this.isDisarmed = false;
    this.isSilenced = false;
    this.isStealthed = false;

    this.altitudeTier = 'STANDARD_HEX';
    this.unitType = type === 'PLAYER' ? 'HERO' : type === 'NPC' ? 'NPC' : 'TOWER';
    this.isCollectible = false;
    this.collectedFlags = 0;
    this.maxHandSize = 4;
    this.baseResistance = 1.0;
    this.memoryIntegrity = 15;
    this.superpositionState = null;

    this.position = { meta: null, hex: null };
    this.currentBuffer = [];
    this.drawPile = [];
    this.discardPile = [];
    this.quests = [];
    this.items = [];
    this.artifacts = [];
    this.wounds = { head: 0, chest: 0, left_arm: 0, right_arm: 0, left_leg: 0, right_leg: 0 };
  }

  loadProfile(profile: {
    level: number;
    xp: number;
    maxHealth: number;
    armor: number;
    luck: number;
    materials: Record<string, number>;
    quests: Quest[];
  }): void {
    this.level = profile.level ?? 1;
    this.xp = profile.xp ?? 0;
    this.maxHealth = profile.maxHealth ?? 15;
    this.health = this.maxHealth;
    this.armor = profile.armor ?? 0;
    this.luck = profile.luck ?? 0.5;
    this.materials = profile.materials ?? {};
    this.quests = profile.quests ?? [];
  }

  applySemanticErosion(amount: number): void {
    this.health -= amount;
    if (this.health < 0) {
      this.health = 0;
    }
  }

  isDeallocated(): boolean {
    return this.health <= 0;
  }

  onLevelUp?: (level: number) => void;

  gainXP(amount: number): void {
    if (this.isDeallocated()) return;
    this.xp += amount;
    console.log(`[XP] Vlákno ${this.id} získalo +${amount} XP (Aktuálne: ${this.xp}/${this.level * 100}).`);
    const nextLevelXP = this.level * 100;
    if (this.xp >= nextLevelXP) {
      this.levelUp();
    }
  }

  levelUp(): void {
    this.xp -= this.level * 100;
    this.level++;
    this.maxHealth += 5;
    this.health = this.maxHealth; // Plné liečenie pri level up
    this.armor += 1;
    this.baseDamage += 2;
    this.luck += 0.1;
    console.log(`[LEVEL_UP] Vlákno ${this.id} postúpilo na LEVEL ${this.level}! Štatistiky: MaxHP=${this.maxHealth}, Armor=${this.armor}, Damage=${this.baseDamage}, Luck=${this.luck.toFixed(1)}`);
    if (this.onLevelUp) {
      this.onLevelUp(this.level);
    }
  }

  addQuest(quest: Quest): void {
    this.quests.push(quest);
  }

  updateQuestProgress(type: Quest['objectiveType'], amount: number, name?: string): void {
    for (const quest of this.quests) {
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
          console.log(`[QUEST COMPLETED] Hrdina ${this.id} úspešne dokončil quest "${quest.title}"!`);
          this.gainXP(quest.xpReward);
          
          if (quest.materialReward) {
            const current = this.materials[quest.materialReward.type] || 0;
            this.materials[quest.materialReward.type] = current + quest.materialReward.amount;
            console.log(`[QUEST REWARD] Pripísané suroviny pre ${this.id}: +${quest.materialReward.amount} ${quest.materialReward.type}`);
          }
        }
      }
    }
  }

  getTowerHeightRanges(): { towerReach: number; midReach: number; groundReach: number } {
    return {
      towerReach: 3,
      midReach: 2,
      groundReach: 1
    };
  }

  toNetworkState(): any {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      ownerId: this.ownerId,
      health: this.health,
      maxHealth: this.maxHealth,
      armor: this.armor,
      attackReach: this.attackReach,
      spellReach: this.spellReach,
      movementBase: this.movementBase,
      hasFreeClockCycle: this.hasFreeClockCycle,
      axiomaticFlags: this.axiomaticFlags,
      handLimit: this.handLimit,
      materials: this.materials,
      quests: this.quests,
      level: this.level,
      xp: this.xp,
      baseDamage: this.baseDamage,
      luck: this.luck,
      isSlowed: this.isSlowed,
      isRooted: this.isRooted,
      isDisarmed: this.isDisarmed,
      isSilenced: this.isSilenced,
      isStealthed: this.isStealthed,
      freeMovementUsed: this.freeMovementUsed,
      position: this.position,
      currentBuffer: this.currentBuffer,
      drawPileCount: this.drawPile.length,
      discardPileCount: this.discardPile.length,
      items: this.items,
      wounds: this.wounds,
      towerHeightRanges: this.getTowerHeightRanges(),
      altitudeTier: this.altitudeTier,
      unitType: this.unitType,
      isCollectible: this.isCollectible,
      collectedFlags: this.collectedFlags,
      maxHandSize: this.maxHandSize,
      baseResistance: this.baseResistance,
      memoryIntegrity: this.memoryIntegrity,
      superpositionState: this.superpositionState
    };
  }
}
