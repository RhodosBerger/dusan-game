import type { HeroBase, CardBase } from "./types";

export const TOXIC_HERO_BASE: HeroBase = {
    id: "toxic",
    icon: "🧪",
    color: "#8BC34A",
    imageExtension: "webp",
    imagePath: "/images/heroes/toxicLamaKarta.webp",
    iconPath: "/images/heroes/toxicEmblemBg.jpg",
};

export const TOXIC_CARDS_BASE: CardBase[] = [
    { id: "snakePit", heroId: "toxic", count: 1, isUnit: false, isUltimate: true, cardCategorization: "attack", specifications: ["yourPosition", "noBlack"] },
    { id: "bonusRangeTree", heroId: "toxic", count: 1, isUnit: true, isUltimate: true, cardCategorization: "magic", specifications: ["unit", "rangeAttack", "rangeMagic"], unitType: "tower", cardTypes: ["tree"] },
    { id: "snakeAttack", heroId: "toxic", count: 4, isUnit: false, isUltimate: false, cardCategorization: "attack", specifications: ["unit"], cardTypes: ["snake"] },
    { id: "disarm", heroId: "toxic", count: 1, isUnit: false, isUltimate: false, cardCategorization: "magic", specifications: [], effect: "disarm" },
    { id: "disarmBomb", heroId: "toxic", count: 1, isUnit: true, isUltimate: false, cardCategorization: "magic", specifications: ["unit"], unitType: "bomb", cardTypes: ["snake"], effect: "disarm" },
    { id: "block", heroId: "toxic", count: 2, isUnit: false, isUltimate: true, cardCategorization: "magic", specifications: ["heal", "block", "unit"] },
    { id: "plantReincarnation", heroId: "toxic", count: 2, isUnit: false, isUltimate: false, cardCategorization: "magic", specifications: ["unit"], cardTypes: ["plant", "tree"] },
    { id: "snakeMove", heroId: "toxic", count: 4, isUnit: false, isUltimate: false, cardCategorization: "movement", specifications: ["unit"], cardTypes: ["snake"] },
    { id: "snakeRoar", heroId: "toxic", count: 1, isUnit: false, isUltimate: true, cardCategorization: "movement", specifications: ["unit", "heal"], cardTypes: ["snake"] },
    { id: "allSnakesMove", heroId: "toxic", count: 1, isUnit: false, isUltimate: true, cardCategorization: "movement", specifications: ["unit"], cardTypes: ["snake"] },
    { id: "bonusAoe", heroId: "toxic", count: 2, isUnit: false, isUltimate: false, cardCategorization: "enhancement", specifications: ["aoe"] },
    { id: "bonusCastRange", heroId: "toxic", count: 2, isUnit: false, isUltimate: false, cardCategorization: "enhancement", specifications: ["rangeMagic"] },
    { id: "bonusAttackRange", heroId: "toxic", count: 1, isUnit: false, isUltimate: false, cardCategorization: "enhancement", specifications: ["rangeAttack"] },
    { id: "bonusMovement", heroId: "toxic", count: 1, isUnit: false, isUltimate: false, cardCategorization: "enhancement", specifications: [] },
    { id: "snakes", heroId: "toxic", count: 4, isUnit: true, isUltimate: false, cardCategorization: "attack", specifications: ["unit"], cardTypes: ["snake"], unitType: "trap" },
    { id: "snakesForward", heroId: "toxic", count: 2, isUnit: true, isUltimate: false, cardCategorization: "attack", specifications: ["unit"], cardTypes: ["snake"], unitType: "trap" },
    { id: "snakeBomb", heroId: "toxic", count: 1, isUnit: true, isUltimate: false, cardCategorization: "attack", specifications: ["unit"], cardTypes: ["snake"], unitType: "bomb" },
    { id: "doubleSnake", heroId: "toxic", count: 2, isUnit: true, isUltimate: false, cardCategorization: "attack", specifications: ["unit"], cardTypes: ["snake"], unitType: "watcher" },
    { id: "toxicPlant", heroId: "toxic", count: 4, isUnit: true, isUltimate: false, cardCategorization: "attack", specifications: ["unit"], cardTypes: ["plant"], unitType: "tower" },
    { id: "rootPlant", heroId: "toxic", count: 2, isUnit: true, isUltimate: false, cardCategorization: "magic", specifications: ["unit"], cardTypes: ["plant"], unitType: "tower", effect: "root" },
    { id: "snakeRespawnTree", heroId: "toxic", count: 1, isUnit: true, isUltimate: true, cardCategorization: "magic", specifications: ["unit"], cardTypes: ["snake", "tree"], unitType: "watcher" },
    { id: "movementTree", heroId: "toxic", count: 2, isUnit: true, isUltimate: true, cardCategorization: "movement", specifications: ["unit"], cardTypes: ["snake", "tree"], unitType: "watcher" },
];
