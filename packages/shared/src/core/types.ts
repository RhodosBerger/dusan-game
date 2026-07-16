export type HeroId = "crystal" | "druid" | "toxic" | "void";

export type CardCategorization = "attack" | "magic" | "movement" | "enhancement";
export type CardCategory = "action" | "unit";

export interface Hero {
    id: HeroId;
    name: string;
    icon: string;
    description: string;
    color: string;
    cards: readonly Card[];
    passiveAbility: string;
    playstyle: readonly string[];
    title: string;
    specialAbility: string;
    imageExtension: string;
    imagePath?: string;
}

export type UnitType = "trap" | "bomb" | "watcher" | "tower";

export type CardSpecification =
    | "rangeAttack"
    | "rangeMagic"
    | "range"
    | "noBlack"
    | "movement"
    | "rangeCast"
    | "aoe"
    | "block"
    | "card"
    | "cardStack"
    | "attack"
    | "heal"
    | "unit"
    | "yourPosition";

export type CardEffect = "slow" | "disarm" | "silence" | "root";

export type CardType =
    | "ground"
    | "crystal"
    | "snake"
    | "plant"
    | "tree"
    | "boar"
    | "wolf"
    | "bear"
    | "tower"
    | "bomb"
    | "trap"
    | "watcher";

export interface Card {
    id: string;
    name: string;
    description: string;
    heroId: HeroId;
    isUnit: boolean;
    isUltimate: boolean;
    count: number;
    cardCategorization: CardCategorization;
    specifications: CardSpecification[];
    effect?: CardEffect;
    cardTypes?: CardType[];
    unitType?: UnitType;
}

export interface HeroColors {
    primary: string;
    secondary: string;
    heroGradient: string;
}

export function hasSpecification(card: Card, spec: CardSpecification): boolean {
    return card.specifications.includes(spec);
}

export interface NetworkThreadState {
    id: string;
    name: string;
    type: 'PLAYER' | 'NPC' | 'HELPER';
    ownerId?: string | null;
    health: number;
    maxHealth: number;
    armor: number;
    attackReach: number;
    spellReach: number;
    movementBase: number;
    hasFreeClockCycle: boolean;
    axiomaticFlags: any;
    handLimit: number;
    materials: Record<string, number>;
    quests: any[];
    level: number;
    xp: number;
    baseDamage: number;
    luck: number;
    isSlowed: boolean;
    isRooted: boolean;
    isSilenced: boolean;
    isDisarmed: boolean;
    isStealthed?: boolean;
    freeMovementUsed: boolean;
    position: { meta: number | null; hex: number | null };
    currentBuffer: any[];
    discardPile: any[];
    deck: any[];
}

export interface NetworkTurnStateMachineState {
    activePlayerId: string | null;
    baseActivePlayerId: string | null;
    currentPhase: string;
    timerLeft: number;
    hasActiveChain: boolean;
    turnNumber: number;
}

export interface NetworkBlockState {
    id: number;
    threadId: string | null;
    biome: string;
    temperature: number;
    humidity: number;
    color: string;
    friction: number;
    conductivity: number;
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
    hasChest?: boolean;
    isTown?: boolean;
    hasTrap?: 'ROOT_TRAP' | 'EMP_MINE' | 'STATIC_CHARGE_TRAP' | null;
    trapOwnerId?: string | null;
    hasOpportunity?: 'SURGE_NODE' | 'VOID_RIFT' | 'REPAIR_KIT' | null;
    collapseInTurns?: number;
}

export interface NetworkChunkState {
    id: number;
    blocks: NetworkBlockState[];
}

export interface NetworkEngineState {
    state: string;
    systemEnergy: number;
    globalEntropy: number;
    turnsElapsed: number;
    threads: NetworkThreadState[];
    actionNetwork: any[];
    turnStateMachine: NetworkTurnStateMachineState;
    dungeonState: any;
    map: NetworkChunkState[];
    lastComboEvent: 'VOLTAGE_SURGE' | 'SHORT_CIRCUIT' | null;
    lastComboPlayerId?: string | null;
}
