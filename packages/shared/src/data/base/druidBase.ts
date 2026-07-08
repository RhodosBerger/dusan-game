import type { HeroBase, CardBase } from "./types";

export const DRUID_HERO_BASE: HeroBase = {
    id: "druid",
    icon: "🌿",
    color: "#4CAF50",
    imageExtension: "webp",
    imagePath: "/images/heroes/druidLamaKarta.webp",
    iconPath: "/images/heroes/druidEmblemBg.jpg",
};

export const DRUID_CARDS_BASE: CardBase[] = [
    { id: "unitReincarnation", heroId: "druid", count: 1, isUnit: false, isUltimate: true, cardCategorization: "magic", specifications: ["unit"], cardTypes: ["boar", "wolf"] },
    { id: "bear", heroId: "druid", count: 1, isUnit: true, isUltimate: true, cardCategorization: "attack", specifications: ["unit", "noBlack", "movement"], cardTypes: ["bear"], unitType: "watcher" },
    { id: "bearCleave", heroId: "druid", count: 1, isUnit: false, isUltimate: true, cardCategorization: "attack", specifications: ["unit", "aoe"], cardTypes: ["bear"] },
    { id: "furiousWolf", heroId: "druid", count: 1, isUnit: true, isUltimate: true, cardCategorization: "attack", specifications: ["unit"], cardTypes: ["wolf"], unitType: "watcher" },
    { id: "wolf", heroId: "druid", count: 2, isUnit: true, isUltimate: true, cardCategorization: "movement", specifications: ["unit"], cardTypes: ["wolf"], unitType: "watcher" },
    { id: "nightWolf", heroId: "druid", count: 1, isUnit: true, isUltimate: true, cardCategorization: "magic", specifications: ["unit"], cardTypes: ["wolf"], unitType: "watcher" },
    { id: "allUnitMove", heroId: "druid", count: 1, isUnit: false, isUltimate: true, cardCategorization: "movement", specifications: ["unit"] },
    { id: "attackTogether", heroId: "druid", count: 2, isUnit: false, isUltimate: false, cardCategorization: "attack", specifications: ["unit"] },
    { id: "attackUnit", heroId: "druid", count: 4, isUnit: false, isUltimate: false, cardCategorization: "attack", specifications: ["unit"] },
    { id: "silentTree", heroId: "druid", count: 2, isUnit: true, isUltimate: false, cardCategorization: "magic", specifications: [], effect: "silence", cardTypes: ["tree"], unitType: "tower" },
    { id: "battleGod", heroId: "druid", count: 2, isUnit: false, isUltimate: false, cardCategorization: "magic", specifications: ["heal"] },
    { id: "natureBlock", heroId: "druid", count: 1, isUnit: false, isUltimate: false, cardCategorization: "magic", specifications: ["block", "unit"] },
    { id: "natureGod", heroId: "druid", count: 2, isUnit: false, isUltimate: false, cardCategorization: "magic", specifications: ["unit"], cardTypes: ["tree"] },
    { id: "natureSpirit", heroId: "druid", count: 1, isUnit: false, isUltimate: false, cardCategorization: "magic", specifications: ["rangeMagic"] },
    { id: "unitHp", heroId: "druid", count: 3, isUnit: false, isUltimate: false, cardCategorization: "magic", specifications: ["heal", "unit"] },
    { id: "moveUnit", heroId: "druid", count: 2, isUnit: false, isUltimate: false, cardCategorization: "movement", specifications: ["unit"] },
    { id: "movement", heroId: "druid", count: 3, isUnit: false, isUltimate: false, cardCategorization: "movement", specifications: ["block"] },
    { id: "swap", heroId: "druid", count: 2, isUnit: false, isUltimate: false, cardCategorization: "movement", specifications: ["unit"] },
    { id: "teleportUnits", heroId: "druid", count: 1, isUnit: false, isUltimate: false, cardCategorization: "movement", specifications: ["unit"] },
    { id: "movementAttack", heroId: "druid", count: 3, isUnit: false, isUltimate: false, cardCategorization: "enhancement", specifications: ["attack"] },
    { id: "bonusAttackRange", heroId: "druid", count: 1, isUnit: false, isUltimate: false, cardCategorization: "enhancement", specifications: ["rangeAttack"] },
    { id: "bonusMovement", heroId: "druid", count: 1, isUnit: false, isUltimate: false, cardCategorization: "enhancement", specifications: ["movement"] },
    { id: "boar", heroId: "druid", count: 4, isUnit: true, isUltimate: false, cardCategorization: "magic", specifications: ["block"], cardTypes: ["boar"], unitType: "watcher" },
];
