import type { HeroBase, CardBase } from "./types";

export const VOID_HERO_BASE: HeroBase = {
    id: "void",
    icon: "🌌",
    color: "#a855f7",
    imageExtension: "webp",
    imagePath: "/images/heroes/void_hero.png",
    iconPath: "/images/heroes/voidEmblemBg.jpg",
};

export const VOID_CARDS_BASE: CardBase[] = [
    { id: "voidBolt", heroId: "void", count: 5, isUnit: false, isUltimate: false, cardCategorization: "attack", specifications: [], cardTypes: [] },
    { id: "entropyShield", heroId: "void", count: 3, isUnit: false, isUltimate: false, cardCategorization: "magic", specifications: ["block"], cardTypes: [] },
    { id: "voidGate", heroId: "void", count: 2, isUnit: false, isUltimate: false, cardCategorization: "movement", specifications: [], cardTypes: [] },
    { id: "voidErosion", heroId: "void", count: 2, isUnit: false, isUltimate: true, cardCategorization: "attack", specifications: ["aoe"], cardTypes: [] },
    { id: "rootTrap", heroId: "void", count: 3, isUnit: true, isUltimate: false, cardCategorization: "magic", specifications: ["unit"], unitType: "trap", effect: "root", cardTypes: ["ground"] }
];
