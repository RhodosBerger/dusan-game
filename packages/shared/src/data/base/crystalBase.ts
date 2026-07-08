import type { HeroBase, CardBase } from "./types";

export const CRYSTAL_HERO_BASE: HeroBase = {
    id: "crystal",
    icon: "⚔️",
    color: "bg-hero-crystal",
    imageExtension: "webp",
    imagePath: "/images/heroes/crystalLamaKarta.webp",
    iconPath: "/images/heroes/crystalEmblemBg.jpg",
};

export const CRYSTAL_CARDS_BASE: CardBase[] = [
    { id: "snowball", heroId: "crystal", count: 5, specifications: [], isUltimate: false, isUnit: false, cardCategorization: "attack", effect: "slow", cardTypes: [] },
    { id: "iceMeteor", heroId: "crystal", count: 3, specifications: ["aoe"], isUltimate: false, isUnit: false, cardCategorization: "attack", cardTypes: [] },
    { id: "iceShards", heroId: "crystal", count: 1, specifications: ["aoe", "unit"], isUltimate: true, isUnit: false, cardCategorization: "attack", cardTypes: ["ground"] },
    { id: "magicOrLife", heroId: "crystal", count: 1, specifications: ["yourPosition", "noBlack"], isUltimate: false, isUnit: false, cardCategorization: "attack", cardTypes: [] },
    { id: "snowstorm", heroId: "crystal", count: 1, specifications: ["yourPosition", "noBlack"], isUltimate: true, isUnit: false, cardCategorization: "magic", effect: "slow", cardTypes: [] },
    { id: "snowGround", heroId: "crystal", count: 3, specifications: ["unit"], isUltimate: false, isUnit: true, cardCategorization: "magic", effect: "slow", cardTypes: ["ground"], unitType: "trap" },
    { id: "frost", heroId: "crystal", count: 1, specifications: ["unit"], isUltimate: true, isUnit: false, cardCategorization: "magic", effect: "slow", cardTypes: [] },
    { id: "iceCrystal", heroId: "crystal", count: 3, specifications: ["unit", "block"], isUltimate: false, isUnit: true, cardCategorization: "magic", cardTypes: ["crystal"], unitType: "tower" },
    { id: "slide", heroId: "crystal", count: 2, specifications: ["unit", "block"], isUltimate: true, isUnit: true, cardCategorization: "movement", cardTypes: ["crystal"], unitType: "tower" },
    { id: "moveUnit", heroId: "crystal", count: 3, specifications: ["unit"], isUltimate: false, isUnit: false, cardCategorization: "movement", cardTypes: [] },
    { id: "bonusAoe", heroId: "crystal", count: 2, specifications: ["aoe"], isUltimate: false, isUnit: false, cardCategorization: "enhancement", cardTypes: [] },
    { id: "bonusCastRange", heroId: "crystal", count: 2, specifications: ["rangeMagic"], isUltimate: false, isUnit: false, cardCategorization: "enhancement", cardTypes: [] },
    { id: "bonusAttackRange", heroId: "crystal", count: 1, specifications: ["rangeAttack"], isUltimate: false, isUnit: false, cardCategorization: "enhancement", cardTypes: [] },
    { id: "bonusMovement", heroId: "crystal", count: 1, specifications: [], isUltimate: false, isUnit: false, cardCategorization: "enhancement", cardTypes: [] },
    { id: "connectiveCrystal", heroId: "crystal", count: 2, specifications: ["unit"], isUltimate: true, isUnit: true, cardCategorization: "magic", cardTypes: ["crystal"], unitType: "watcher" },
    { id: "snowBomb", heroId: "crystal", count: 2, specifications: ["unit"], isUltimate: false, isUnit: true, cardCategorization: "magic", effect: "slow", cardTypes: ["crystal"], unitType: "bomb" },
    { id: "crystalBonus", heroId: "crystal", count: 1, specifications: ["unit", "range"], isUltimate: false, isUnit: true, cardCategorization: "magic", cardTypes: ["crystal"], unitType: "watcher" },
    { id: "crystalKing", heroId: "crystal", count: 1, specifications: ["unit", "block", "heal"], isUltimate: true, isUnit: true, cardCategorization: "magic", cardTypes: ["crystal"], unitType: "watcher" },
    { id: "crystalTower", heroId: "crystal", count: 2, specifications: ["unit"], isUltimate: false, isUnit: true, cardCategorization: "magic", effect: "slow", cardTypes: ["crystal"], unitType: "tower" },
    { id: "crystalAttack", heroId: "crystal", count: 4, specifications: ["unit"], isUltimate: false, isUnit: false, cardCategorization: "attack", cardTypes: ["crystal"] },
    { id: "allCrystalAttack", heroId: "crystal", count: 1, specifications: ["unit"], isUltimate: true, isUnit: false, cardCategorization: "attack", cardTypes: ["crystal"] },
];
