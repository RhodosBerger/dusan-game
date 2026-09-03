# The Last Tribe — Game Data & Types Export

> Konsolidovaný export všetkých herne-relevantných typov a dát z online portálu.
> Určené pre zdieľanie s kolegom pracujúcim na offline verzii hry.
>
> **Projekt:** The Last Tribe Portal
> **Dátum exportu:** 2026-04-24
> **Branch:** main
> **Stack:** TypeScript 5 (strict), Next.js 15

---

## 📑 Obsah

1. [Karty — Core typy](#1-karty--core-typy)
2. [Card/Hero Base schémy](#2-cardhero-base-schémy)
3. [Dáta kariet — Crystal](#3-dáta-kariet--crystal)
4. [Dáta kariet — Druid](#4-dáta-kariet--druid)
5. [Dáta kariet — Toxic](#5-dáta-kariet--toxic)
6. [Preklady kariet (CS)](#6-preklady-kariet-cs)
7. [Preklady kariet (SK)](#7-preklady-kariet-sk)
8. [Preklady hrdinov (CS + SK)](#8-preklady-hrdinov-cs--sk)
9. [Combo typy a štatistiky](#9-combo-typy-a-štatistiky)
10. [Combo dáta — Crystal](#10-combo-dáta--crystal)
11. [Combo dáta — Druid](#11-combo-dáta--druid)
12. [Combo dáta — Toxic](#12-combo-dáta--toxic)
13. [Hexagonálna mapa](#13-hexagonálna-mapa)
14. [Herný stav — DB schémy](#14-herný-stav--db-schémy)
15. [Personality, atribúty, inventár, combat](#15-personality-atribúty-inventár-combat)
16. [Svet — regióny a kmene](#16-svet--regióny-a-kmene)
17. [Konštanty](#17-konštanty)

---

## 1. Karty — Core typy

**Zdrojový súbor:** `lib/core/types.ts`

```typescript
export type HeroId = "crystal" | "druid" | "toxic";

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
```

---

## 2. Card/Hero Base schémy

**Zdrojový súbor:** `lib/data/base/types.ts`

Oddeľujú statickú mechaniku (base) od prekladov (translations).

```typescript
import type {
    CardCategorization,
    CardEffect,
    CardSpecification,
    CardType,
    HeroId,
    UnitType,
} from "@/lib/core/types";

export interface CardBase {
    id: string;
    heroId: HeroId;
    count: number;
    isUnit: boolean;
    isUltimate: boolean;
    cardCategorization: CardCategorization;
    specifications: CardSpecification[];
    effect?: CardEffect;
    cardTypes?: CardType[];
    unitType?: UnitType;
}

export interface HeroBase {
    id: HeroId;
    icon: string;
    color: string;
    imageExtension: string;
    imagePath?: string;
    iconPath?: string;
}

export interface LocalizedCard extends CardBase {
    name: string;
    description: string;
}

export interface LocalizedHero extends HeroBase {
    name: string;
    description: string;
    title: string;
    specialAbility: string;
    passiveAbility: string;
    playstyle: readonly string[];
}

export interface HeroTranslations {
    name: string;
    description: string;
    title: string;
    specialAbility: string;
    passiveAbility: string;
    playstyle: string[];
}

export interface CardTranslations {
    name: string;
    description: string;
}
```

---

## 3. Dáta kariet — Crystal

**Zdrojový súbor:** `lib/data/base/crystalBase.ts`
**Počet kariet:** 21

```typescript
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
```

---

## 4. Dáta kariet — Druid

**Zdrojový súbor:** `lib/data/base/druidBase.ts`
**Počet kariet:** 22

```typescript
export const DRUID_HERO_BASE: HeroBase = {
    id: "druid",
    icon: "🌿",
    color: "#4CAF50",
    imageExtension: "webp",
    imagePath: "/images/heroes/druidLamaKarta.webp",
    iconPath: "/images/heroes/druidEmblemBg.jpg",
};

export const DRUID_CARDS_BASE: CardBase[] = [
    // Ultimate karty
    { id: "unitReincarnation", heroId: "druid", count: 1, isUnit: false, isUltimate: true, cardCategorization: "magic", specifications: ["unit"], cardTypes: ["boar", "wolf"] },
    { id: "bear", heroId: "druid", count: 1, isUnit: true, isUltimate: true, cardCategorization: "attack", specifications: ["unit", "noBlack", "movement"], cardTypes: ["bear"], unitType: "watcher" },
    { id: "bearCleave", heroId: "druid", count: 1, isUnit: false, isUltimate: true, cardCategorization: "attack", specifications: ["unit", "aoe"], cardTypes: ["bear"] },
    { id: "furiousWolf", heroId: "druid", count: 1, isUnit: true, isUltimate: true, cardCategorization: "attack", specifications: ["unit"], cardTypes: ["wolf"], unitType: "watcher" },
    { id: "wolf", heroId: "druid", count: 2, isUnit: true, isUltimate: true, cardCategorization: "movement", specifications: ["unit"], cardTypes: ["wolf"], unitType: "watcher" },
    { id: "nightWolf", heroId: "druid", count: 1, isUnit: true, isUltimate: true, cardCategorization: "magic", specifications: ["unit"], cardTypes: ["wolf"], unitType: "watcher" },
    { id: "allUnitMove", heroId: "druid", count: 1, isUnit: false, isUltimate: true, cardCategorization: "movement", specifications: ["unit"] },

    // Útočné karty
    { id: "attackTogether", heroId: "druid", count: 2, isUnit: false, isUltimate: false, cardCategorization: "attack", specifications: ["unit"] },
    { id: "attackUnit", heroId: "druid", count: 4, isUnit: false, isUltimate: false, cardCategorization: "attack", specifications: ["unit"] },

    // Magické karty
    { id: "silentTree", heroId: "druid", count: 2, isUnit: true, isUltimate: false, cardCategorization: "magic", specifications: [], effect: "silence", cardTypes: ["tree"], unitType: "tower" },
    { id: "battleGod", heroId: "druid", count: 2, isUnit: false, isUltimate: false, cardCategorization: "magic", specifications: ["heal"] },
    { id: "natureBlock", heroId: "druid", count: 1, isUnit: false, isUltimate: false, cardCategorization: "magic", specifications: ["block", "unit"] },
    { id: "natureGod", heroId: "druid", count: 2, isUnit: false, isUltimate: false, cardCategorization: "magic", specifications: ["unit"], cardTypes: ["tree"] },
    { id: "natureSpirit", heroId: "druid", count: 1, isUnit: false, isUltimate: false, cardCategorization: "magic", specifications: ["rangeMagic"] },
    { id: "unitHp", heroId: "druid", count: 3, isUnit: false, isUltimate: false, cardCategorization: "magic", specifications: ["heal", "unit"] },

    // Pohybové karty
    { id: "moveUnit", heroId: "druid", count: 2, isUnit: false, isUltimate: false, cardCategorization: "movement", specifications: ["unit"] },
    { id: "movement", heroId: "druid", count: 3, isUnit: false, isUltimate: false, cardCategorization: "movement", specifications: ["block"] },
    { id: "swap", heroId: "druid", count: 2, isUnit: false, isUltimate: false, cardCategorization: "movement", specifications: ["unit"] },
    { id: "teleportUnits", heroId: "druid", count: 1, isUnit: false, isUltimate: false, cardCategorization: "movement", specifications: ["unit"] },

    // Enhancement karty
    { id: "movementAttack", heroId: "druid", count: 3, isUnit: false, isUltimate: false, cardCategorization: "enhancement", specifications: ["attack"] },
    { id: "bonusAttackRange", heroId: "druid", count: 1, isUnit: false, isUltimate: false, cardCategorization: "enhancement", specifications: ["rangeAttack"] },
    { id: "bonusMovement", heroId: "druid", count: 1, isUnit: false, isUltimate: false, cardCategorization: "enhancement", specifications: ["movement"] },

    // Jednotky
    { id: "boar", heroId: "druid", count: 4, isUnit: true, isUltimate: false, cardCategorization: "magic", specifications: ["block"], cardTypes: ["boar"], unitType: "watcher" },
];
```

---

## 5. Dáta kariet — Toxic

**Zdrojový súbor:** `lib/data/base/toxicBase.ts`
**Počet kariet:** 22

```typescript
export const TOXIC_HERO_BASE: HeroBase = {
    id: "toxic",
    icon: "🧪",
    color: "#8BC34A",
    imageExtension: "webp",
    imagePath: "/images/heroes/toxicLamaKarta.webp",
    iconPath: "/images/heroes/toxicEmblemBg.jpg",
};

export const TOXIC_CARDS_BASE: CardBase[] = [
    // Ultimate karty
    { id: "snakePit", heroId: "toxic", count: 1, isUnit: false, isUltimate: true, cardCategorization: "attack", specifications: ["yourPosition", "noBlack"] },
    { id: "bonusRangeTree", heroId: "toxic", count: 1, isUnit: true, isUltimate: true, cardCategorization: "magic", specifications: ["unit", "rangeAttack", "rangeMagic"], unitType: "tower", cardTypes: ["tree"] },

    // Útočné karty
    { id: "snakeAttack", heroId: "toxic", count: 4, isUnit: false, isUltimate: false, cardCategorization: "attack", specifications: ["unit"], cardTypes: ["snake"] },
    { id: "disarm", heroId: "toxic", count: 1, isUnit: false, isUltimate: false, cardCategorization: "magic", specifications: [], effect: "disarm" },
    { id: "disarmBomb", heroId: "toxic", count: 1, isUnit: true, isUltimate: false, cardCategorization: "magic", specifications: ["unit"], unitType: "bomb", cardTypes: ["snake"], effect: "disarm" },

    // Magické karty
    { id: "block", heroId: "toxic", count: 2, isUnit: false, isUltimate: true, cardCategorization: "magic", specifications: ["heal", "block", "unit"] },
    { id: "plantReincarnation", heroId: "toxic", count: 2, isUnit: false, isUltimate: false, cardCategorization: "magic", specifications: ["unit"], cardTypes: ["plant", "tree"] },

    // Pohybové karty
    { id: "snakeMove", heroId: "toxic", count: 4, isUnit: false, isUltimate: false, cardCategorization: "movement", specifications: ["unit"], cardTypes: ["snake"] },
    { id: "snakeRoar", heroId: "toxic", count: 1, isUnit: false, isUltimate: true, cardCategorization: "movement", specifications: ["unit", "heal"], cardTypes: ["snake"] },
    { id: "allSnakesMove", heroId: "toxic", count: 1, isUnit: false, isUltimate: true, cardCategorization: "movement", specifications: ["unit"], cardTypes: ["snake"] },

    // Enhancement karty
    { id: "bonusAoe", heroId: "toxic", count: 2, isUnit: false, isUltimate: false, cardCategorization: "enhancement", specifications: ["aoe"] },
    { id: "bonusCastRange", heroId: "toxic", count: 2, isUnit: false, isUltimate: false, cardCategorization: "enhancement", specifications: ["rangeMagic"] },
    { id: "bonusAttackRange", heroId: "toxic", count: 1, isUnit: false, isUltimate: false, cardCategorization: "enhancement", specifications: ["rangeAttack"] },
    { id: "bonusMovement", heroId: "toxic", count: 1, isUnit: false, isUltimate: false, cardCategorization: "enhancement", specifications: [] },

    // Jednotky
    { id: "snakes", heroId: "toxic", count: 4, isUnit: true, isUltimate: false, cardCategorization: "attack", specifications: ["unit"], cardTypes: ["snake"], unitType: "trap" },
    { id: "snakesForward", heroId: "toxic", count: 2, isUnit: true, isUltimate: false, cardCategorization: "attack", specifications: ["unit"], cardTypes: ["snake"], unitType: "trap" },
    { id: "snakeBomb", heroId: "toxic", count: 1, isUnit: true, isUltimate: false, cardCategorization: "attack", specifications: ["unit"], cardTypes: ["snake"], unitType: "bomb" },
    { id: "doubleSnake", heroId: "toxic", count: 2, isUnit: true, isUltimate: false, cardCategorization: "attack", specifications: ["unit"], cardTypes: ["snake"], unitType: "watcher" },
    { id: "toxicPlant", heroId: "toxic", count: 4, isUnit: true, isUltimate: false, cardCategorization: "attack", specifications: ["unit"], cardTypes: ["plant"], unitType: "tower" },
    { id: "rootPlant", heroId: "toxic", count: 2, isUnit: true, isUltimate: false, cardCategorization: "magic", specifications: ["unit"], cardTypes: ["plant"], unitType: "tower", effect: "root" },
    { id: "snakeRespawnTree", heroId: "toxic", count: 1, isUnit: true, isUltimate: true, cardCategorization: "magic", specifications: ["unit"], cardTypes: ["snake", "tree"], unitType: "watcher" },
    { id: "movementTree", heroId: "toxic", count: 2, isUnit: true, isUltimate: true, cardCategorization: "movement", specifications: ["unit"], cardTypes: ["snake", "tree"], unitType: "watcher" },
];
```

---

## 6. Preklady kariet (CS)

**Zdrojový súbor:** `lib/translations/cs/cards.json`

```json
{
    "crystal": {
        "snowball": { "name": "Ledová koule", "description": "Zaútoč na nepřítele, pokud je již zpomalen, zakořeníš ho" },
        "iceMeteor": { "name": "Ledový meteor", "description": "Zaútoč na 2 nepřátele na stejné pozici" },
        "iceShards": { "name": "Ledové střepy", "description": "Zasněženou zemí zaútoč na tři nepřátele" },
        "magicOrLife": { "name": "Kouzlo nebo život", "description": "Každý hráč na tvé pozici musí zahodit kartu kouzla, jinak přijde o život" },
        "snowstorm": { "name": "Sněžná bouře", "description": "Každý nepřátelský hrdina se musí pohnout pryč z tvé pozice, jinak bude zpomalen do konce tvého tahu" },
        "snowGround": { "name": "Zasněžená země", "description": "Zpomal hrdinu" },
        "frost": { "name": "Zmrazení", "description": "Aktivním krystalem zpomal nepřítele" },
        "iceCrystal": { "name": "Ledový krystal", "description": "Zablokuj útok" },
        "slide": { "name": "Sklouznutí", "description": "Pohni se o 1 a na předchozí pozici polož tuto kartu - zablokuj útok" },
        "moveUnit": { "name": "Pohyb s jednotkou", "description": "Posuň se o 1 s Hrdinou a můžeš vzít sebou 1 jednotku" },
        "bonusAoe": { "name": "Větší zásah", "description": "Zaútoč na jednoho dalšího nepřítele na stejné pozici (přilož k útočné kartě)" },
        "bonusCastRange": { "name": "Dosah kouzla", "description": "Získáš bonus k dosahu kouzla + 1 na přiloženou kartu (přilož ke kouzelné kartě)" },
        "bonusAttackRange": { "name": "Dosah útoku", "description": "Získáš bonus k dosahu útoku + 1 na přiloženou kartu (přilož k útočné kartě)" },
        "bonusMovement": { "name": "Bonus k pohybu", "description": "Posuň se o 1 dále (přilož k pohybové kartě)" },
        "connectiveCrystal": { "name": "Spojovací krystal", "description": "Každý krystal, který má dosah na tento krystal, může svou akci zahrát na sousední pozice jako Spojovací krystal" },
        "snowBomb": { "name": "Sněžná bomba", "description": "Zpomal nepřátelského Hrdinu" },
        "crystalBonus": { "name": "Bonusový krystal", "description": "Všechny věže na této pozici mají dosah + 1" },
        "crystalKing": { "name": "Královský krystal", "description": "Žádná jiná jednotka na této pozici nemůže zemřít. Po smrti tohoto krystalu získáš 1 život" },
        "crystalTower": { "name": "Krystalová věž", "description": "Když je aktivní, můžeš jí zpomalit nepřítele" },
        "crystalAttack": { "name": "Krystalový útok", "description": "Zaútoč s jednotkou typu Krystal" },
        "allCrystalAttack": { "name": "Krystalová smršť", "description": "Zaútoč s každou jednotkou typu Krystal" }
    },
    "druid": {
        "unitReincarnation": { "name": "Oživení jednotek", "description": "Znovu zroď Divočáky a Vlky, kteří se nacházejí v posledních 5 kartách odhazovacího balíčku, maximálně tři" },
        "bear": { "name": "Medvěd", "description": "Má 1 volný pohyb a útok na tvém tahu. Platí pro něho stejné stavy jako pro tvého Hrdinu" },
        "bearCleave": { "name": "Medvědí ničící útok", "description": "Zaútoč s medvědem na 3 jednotky. Nebo zaútoč na 1 jednotku a nepřítel nemůže reagovat" },
        "furiousWolf": { "name": "Zuřivý vlk", "description": "Pokud se na této pozici nachází jiná přátelská jednotka, zaútoč na nepřítele, maximálně jednou za tvůj tah" },
        "wolf": { "name": "Vlk", "description": "V momentě kdy využíváš svůj volný pohyb v tahu, přesuň Vlka i vybrané jednotky na jeho pozici o 1 vedle" },
        "nightWolf": { "name": "Noční vlk", "description": "Nepřítel nemůže útočit s jednotkou na Vlky, Stromy a Medvěda na této pozici" },
        "allUnitMove": { "name": "Pohyb všech", "description": "Přesuň Hrdinu a libovolné vybrané jednotky o 1" },
        "attackTogether": { "name": "Společný útok", "description": "Zaútoč na nepřítele, za každé 2 tvoje nebo spojenecké jednotky na tvé pozici získáš +1 k útoku" },
        "attackUnit": { "name": "Útok jednotkou", "description": "Zaútoč jakoukoliv jednotkou na nepřítele" },
        "silentTree": { "name": "Utišující strom", "description": "Umlč nepřítele" },
        "battleGod": { "name": "Bůh války", "description": "Na nejbližší 2 tahy získáš 1 život a na konci efektu si doplň 1 život" },
        "natureBlock": { "name": "Přírodní blok", "description": "Zablokuj útok na všechny na vybrané pozici" },
        "natureGod": { "name": "Přírodní Bůh", "description": "Na nejbližší 2 tahy platí: pokud se dostane Utišující strom do tvého odhazovacího balíčku, znovu ho zroď" },
        "natureSpirit": { "name": "Přírodní duchové", "description": "Na nejbližší 2 tahy získáš bonus k dosahu kouzla +1" },
        "unitHp": { "name": "Bonusový život", "description": "Přidej jednotce 1 život (polož tuto kartu pod vybranou jednotku)" },
        "moveUnit": { "name": "Pohyb jednotky", "description": "Přesuň přátelskou jednotku do vzdálenosti 2" },
        "movement": { "name": "Pohyb", "description": "Posuň se o 1 a zablokuj útok na pozici na kterou přicházíš" },
        "swap": { "name": "Výměna pozic", "description": "Vyměň si pozici s přátelskou jednotkou nebo Hrdinou" },
        "teleportUnits": { "name": "Teleport jednotek", "description": "Přesuň 2 přátelské jednotky na pozici tvého Hrdiny, které jsou do vzdálenosti 2 od něho" },
        "movementAttack": { "name": "Útok pohybem", "description": "Zaútoč na nepřítele na pozici, na kterou přicházíš (přilož k pohybové kartě)" },
        "bonusAttackRange": { "name": "Dosah útoku", "description": "Získáš bonus k dosahu útoku +1 na danou kartu (přilož k útočné kartě)" },
        "bonusMovement": { "name": "Bonus k pohybu", "description": "Posuň se o 1 dále (přilož k pohybové kartě)" },
        "boar": { "name": "Divočák", "description": "Nepřítel musí zaútočit nejdříve na Divočáka, až poté na jinou jednotku na této pozici" }
    },
    "toxic": {
        "snakePit": { "name": "Hadí jáma", "description": "Každý nepřátelský hrdina na tvé pozici musí zahodit kartu útoku jinak přijde o 1 život" },
        "bonusRangeTree": { "name": "Bonusový strom", "description": "Všechny věže na této pozici získávají +1 k dosahu akce" },
        "snakeAttack": { "name": "Hadí útok", "description": "Zaútoč s Hadem nebo Hrdinou na nepřítele" },
        "disarm": { "name": "Odzbrojení", "description": "Odzbroj nepřátelského Hrdinu" },
        "disarmBomb": { "name": "Hadí monstrum", "description": "Odzbroj nepřátelského Hrdinu" },
        "block": { "name": "Blok", "description": "Nejdříve zablokuj útok na jednotku a potom si doplň 1 život" },
        "plantReincarnation": { "name": "Oživení rostliny", "description": "Obnov rostlinu nebo strom z odhazovacího balíčku" },
        "snakeMove": { "name": "Hadí pohyb", "description": "Přesuň hada do vzdálenosti 2" },
        "snakeRoar": { "name": "Hadí řev", "description": "Přesuň všechny hady o 1 a si doplň 1 život" },
        "allSnakesMove": { "name": "Pohyb všech hadů", "description": "Přesuň všechny hady o 1" },
        "bonusAoe": { "name": "Větší zásah", "description": "Zaútoč na jednoho dalšího nepřítele na stejné pozici (přilož k útočné kartě)" },
        "bonusCastRange": { "name": "Dosah kouzla", "description": "Získáš bonus k dosahu kouzla + 1 na přiloženou kartu (přilož ke kouzelné kartě)" },
        "bonusAttackRange": { "name": "Dosah útoku", "description": "Získáš bonus k dosahu útoku + 1 na přiloženou kartu (přilož k útočné kartě)" },
        "bonusMovement": { "name": "Bonus k pohybu", "description": "Posuň se o 1 dále (přilož k pohybové kartě)" },
        "snakes": { "name": "Hadi", "description": "Základní hadí jednotky" },
        "snakesForward": { "name": "Útočiví hadi", "description": "Hadi zaměření na útok" },
        "snakeBomb": { "name": "Hadí bomba", "description": "Had který exploduje" },
        "doubleSnake": { "name": "Dvojitý had", "description": "Silnější hadí jednotka" },
        "toxicPlant": { "name": "Jedovatá rostlina", "description": "Rostlina která otravuje nepřátele" },
        "rootPlant": { "name": "Kořenová rostlina", "description": "Rostlina která zakoření nepřítele" },
        "snakeRespawnTree": { "name": "Hadí strom", "description": "Strom který rodí hady" },
        "movementTree": { "name": "Pohybový strom", "description": "Strom který umožňuje pohyb hadů" }
    }
}
```

---

## 7. Preklady kariet (SK)

**Zdrojový súbor:** `lib/translations/sk/cards.json`

```json
{
    "crystal": {
        "snowball": { "name": "Ľadová guľa", "description": "Zaútoč na nepriateľa, ak už je spomalený, zakoreníš ho" },
        "iceMeteor": { "name": "Ľadový meteor", "description": "Zaútoč na 2 nepriateľov na rovnakej pozícií" },
        "iceShards": { "name": "Ľadové ostne", "description": "Zasneženou zemou zaútoč na troch nepriateľov" },
        "magicOrLife": { "name": "Kúzlo alebo život", "description": "Každý hráč na tvojej pozícii musí zahodiť kartu kúzla inak príde o život" },
        "snowstorm": { "name": "Snežná búrka", "description": "Každý nepriateľský hrdina sa musí pohnúť preč z tvojej pozície, inak bude spomalený do konca tvojho ťahu" },
        "snowGround": { "name": "Zasnežená zem", "description": "Spomaľ hrdinu" },
        "frost": { "name": "Zamrznutie", "description": "Aktívnym kryštálom spomaľ nepriateľa" },
        "iceCrystal": { "name": "Ľadový kryštál", "description": "Zablokuj útok" },
        "slide": { "name": "Skĺznutie", "description": "Pohni sa o 1 a na predchádzajúcej pozícií polož túto kartu - zablokuj utok" },
        "moveUnit": { "name": "Pohyb s jednotkou", "description": "Posuň sa o 1 s Hrdinom a môžeš zobrať so sebou 1 jednotku" },
        "bonusAoe": { "name": "Väčšia trefa", "description": "Zaútoč na jedného ďalšieho nepriateľa na rovnakej pozícií (dolož k útočnej karte)" },
        "bonusCastRange": { "name": "Dosah kúzla", "description": "Získaš bonus k dosahu kúzla + 1 na priloženú kartu (dolož ku kúzelnej karte)" },
        "bonusAttackRange": { "name": "Dosah útoku", "description": "Získaš bonus k dosahu útoku + 1 na priloženú kartu (dolož k útočnej karte)" },
        "bonusMovement": { "name": "Bonus k pohybu", "description": "Posuň sa o 1 ďalej (dolož k pohybovej karte)" },
        "connectiveCrystal": { "name": "Spojovací kryštál", "description": "Každý kryštaľ, ktorý ma dosah na tento kryštál, môže svoju akciu zahrať na susedné pozície ako Spojovací kryštál" },
        "snowBomb": { "name": "Snehová bomba", "description": "Spomaľ nepriateľského Hrdinu" },
        "crystalBonus": { "name": "Bonusový kryštál", "description": "Všetky veže na tejto pozícií majú dosah + 1" },
        "crystalKing": { "name": "Královský kryštál", "description": "Žiadna iná jednotka na tejto pozícií nemôže zomrieť. Po smrti tohto kryštáľu získaš 1 život" },
        "crystalTower": { "name": "Kryštálová veža", "description": "Keď je aktívna, môžeš ňou spomaliť nepriateľa" },
        "crystalAttack": { "name": "Kryštálový útok", "description": "Zaútoč s jednotkou typu Kryštál" },
        "allCrystalAttack": { "name": "Kryštálová smršť", "description": "Zaútoč s každou jednotkou typu Kryštál" }
    },
    "druid": {
        "unitReincarnation": { "name": "Oživenie jednotiek", "description": "Znovuzroď Diviakov a Vlkov, ktorí sa nachádzajú v posledných 5 kartách odhadzovacieho balíčku, maximálne troch" },
        "bear": { "name": "Medveď", "description": "Má 1 voľný pohyb a útok na tvojom ťahu. Platia preňho rovnaké stavy ako pre tvojho Hrdinu" },
        "bearCleave": { "name": "Medvedí ničiaci útok", "description": "Zaútoč s medveďom na 3 jednotky. Alebo zaútoč na 1 jednotku a nepriateľ nemôže reagovať" },
        "furiousWolf": { "name": "Zurivý vlk", "description": "Ak sa na tejto pozícii nachádza iná priateľská jednotka, zaútoč na nepriateľa, maximálne raz za tvoj ťah" },
        "wolf": { "name": "Vlk", "description": "V momente keď využívaš svoj voľný pohyb v ťahu, presuň Vlka aj vybrané jednotky na jeho pozícií o 1 vedľa" },
        "nightWolf": { "name": "Nočný vlk", "description": "Nepriateľ nemôže útočiť s jednotkou na Vlky, Stromy a Medveďa na tejto pozícii" },
        "allUnitMove": { "name": "Pohyb všetkých", "description": "Presuň Hrdinu a ľubovoľné vybrané jednotky o 1" },
        "attackTogether": { "name": "Jednotný útok", "description": "Zaútoč na nepriateľa, za každé 2 tvoje alebo spojenecké jednotky na tvojej pozícii získaš +1 k útoku" },
        "attackUnit": { "name": "Útok jednotkou", "description": "Zaútoč akoukoľvek jednotkou na nepriateľa" },
        "silentTree": { "name": "Utíšujúci strom", "description": "Umlč nepriateľa" },
        "battleGod": { "name": "Boh vojny", "description": "Na najbližsie 2 ťahy získaš 1 život a na konci efektu si doplň 1 život" },
        "natureBlock": { "name": "Prírodný blok", "description": "Zablokuj útok na všetkých na vybranej pozícií" },
        "natureGod": { "name": "Prírodný Boh", "description": "Na najbližsie 2 ťahy platí: ak sa dostane Utišujúci strom do tvojho odhadzovacieho balíčku, znovuzroď ho" },
        "natureSpirit": { "name": "Prírodní duchovia", "description": "Na najbližsie 2 ťahy získaš bonus k dosahu kúzla +1" },
        "unitHp": { "name": "Bonusový život", "description": "Pridaj jednotke 1 život (polož túto kartu pod vybranú jednotku)" },
        "moveUnit": { "name": "Pohyb jednotky", "description": "Presuň priateľskú jednotku do vzdialenosti 2" },
        "movement": { "name": "Pohyb", "description": "Posuň sa o 1 a zablokuj útok na pozícií na ktorú prichádzaš" },
        "swap": { "name": "Výmena pozícií", "description": "Vymeň si pozíciu s priateľskou jednotkou alebo Hrdinom" },
        "teleportUnits": { "name": "Teleport jednotiek", "description": "Presuň 2 priateľské jednotky na pozíciu tvojho Hrdinu, ktoré sú do vzdialenosti 2 od neho" },
        "movementAttack": { "name": "Útok pohybom", "description": "Zaútoč na nepriateľa na pozícií, na ktorú prichádzaš (dolož k pohybovej karte)" },
        "bonusAttackRange": { "name": "Dosah útoku", "description": "Získaš bonus k dosahu útoku +1 na danú kartu (dolož k útočnej karte)" },
        "bonusMovement": { "name": "Bonus k pohybu", "description": "Posuň sa o 1 ďalej (dolož k pohybovej karte)" },
        "boar": { "name": "Diviak", "description": "Nepriateľ musí zaútočiť najskôr na Diviaka, až potom na inú jednotku na tejto pozícií" }
    },
    "toxic": {
        "snakePit": { "name": "Hadie plénum", "description": "Každý nepriateľský hrdina na tvojej pozícii musí zahodiť kartu útoku inak príde o 1 život" },
        "bonusRangeTree": { "name": "Bonusový strom", "description": "Všetky veže na tejto pozícii získavajú +1 k dosahu akcie" },
        "snakeAttack": { "name": "Hadí útok", "description": "Zaútoč s Hadom alebo Hrdinom na nepriateľa" },
        "disarm": { "name": "Odzbrojenie", "description": "Odzbroj nepriateľského Hrdinu" },
        "disarmBomb": { "name": "Hadie monštrum", "description": "Odzbroj nepriateľského Hrdinu" },
        "block": { "name": "Blok", "description": "Najskôr zablokuj útok na jednotku a potom si doplň 1 život" },
        "plantReincarnation": { "name": "Oživenie rastliny", "description": "Obnov rastlinu alebo strom z odhadzovacieho balíčku" },
        "snakeMove": { "name": "Hadí pohyb", "description": "Presuň hada do vzdialenosti 2" },
        "snakeRoar": { "name": "Hadí rev", "description": "Presuň všetkých hadov o 1 a si doplň 1 život" },
        "allSnakesMove": { "name": "Pohyb všetkých hadov", "description": "Presuň všetkých hadov o 1" },
        "bonusAoe": { "name": "Väčšia trefa", "description": "Zaútoč na jedného ďalšieho nepriateľa na rovnakej pozícií (dolož k útočnej karte)" },
        "bonusCastRange": { "name": "Dosah kúzla", "description": "Získaš bonus k dosahu kúzla + 1 na priloženú kartu (dolož ku kúzelnej karte)" },
        "bonusAttackRange": { "name": "Dosah útoku", "description": "Získaš bonus k dosahu útoku + 1 na priloženú kartu (dolož k útočnej karte)" },
        "bonusMovement": { "name": "Bonus k pohybu", "description": "Posuň sa o 1 ďalej (dolož k pohybovej karte)" },
        "snakes": { "name": "Hadi", "description": "Základné hadie jednotky" },
        "snakesForward": { "name": "Útočiví hadi", "description": "Hadi zamerané na útok" },
        "snakeBomb": { "name": "Hadí bomba", "description": "Had ktorý exploduje" },
        "doubleSnake": { "name": "Dvojitý had", "description": "Silnejšia hadí jednotka" },
        "toxicPlant": { "name": "Jedovatá rastlina", "description": "Rastlina ktorá otravuje nepriateľov" },
        "rootPlant": { "name": "Koreňová rastlina", "description": "Rastlina ktorá zakoreňuje nepriateľa" },
        "snakeRespawnTree": { "name": "Hadí strom", "description": "Strom ktorý rodí hadov" },
        "movementTree": { "name": "Pohybový strom", "description": "Strom ktorý umožňuje pohyb hadov" }
    }
}
```

---

## 8. Preklady hrdinov (CS + SK)

**Zdrojové súbory:** `lib/translations/cs/heroes.json`, `lib/translations/sk/heroes.json`

### CS

```json
{
    "crystal": {
        "name": "Crystal",
        "description": "Kontrolně orientovaný hrdina s mocnými efekty zpomalení a krystalovými synergiemi",
        "title": "Ledový mág",
        "specialAbility": "Manipulace s ledem a zpomalování nepřátel",
        "passiveAbility": "Ledový bonus k útoku - V případě že je nepřátelský Hrdina zpomalen, nejbližší útok který nepřítele zasáhne, způsobí 2 poškození a zpomalení se odstraní",
        "playstyle": ["ovládání", "obranný"]
    },
    "toxic": {
        "name": "Toxic",
        "description": "Agresivní hrdina zaměřený na jedování nepřátel a využívání hadích jednotek",
        "title": "Jedovatý alchymista",
        "specialAbility": "Vytváření jedovatých oblastí a ovládání hadích spojenců",
        "passiveAbility": "Jedovatý dotek - Každý útok má 30% šanci umlčet cíl na 1 tah",
        "playstyle": ["agresivní", "kontrolní"]
    },
    "druid": {
        "name": "Druid",
        "description": "Strážce přírody se zvířecími synergiemi, kontrolou pohybu a podporou jednotek",
        "title": "Strážce přírody",
        "specialAbility": "Společenstvo zvířat a léčení přírody",
        "passiveAbility": "Vize - 2 vrchní karty tvého tahacího balíčku si můžeš libovolně prohlížet. Na konci tahu si můžeš odložit až 3 karty na spodek tahacího balíčku",
        "playstyle": ["synergie", "škálování"]
    }
}
```

### SK

```json
{
    "crystal": {
        "name": "Crystal",
        "description": "Kontrolne orientovaný hrdina s mocnými efektmi spomalenia a kryštálovými synergámi",
        "title": "Ľadový mág",
        "specialAbility": "Manipulácia s ľadom a spomaľovanie nepriateľov",
        "passiveAbility": "Ľadový bonus k útoku - V prípade že je nepriateľský Hrdina spomalený, najbližší útok ktorý nepriateľa trafí, sposobí 2 poškodenia a spomalenie sa odstráni",
        "playstyle": ["kontrola", "obranný"]
    },
    "toxic": {
        "name": "Toxic",
        "description": "Agresívny hrdina zameraný na otravovanie nepriateľov a využívanie hadích jednotiek",
        "title": "Jedovatý alchymista",
        "specialAbility": "Vytváranie jedovatých oblastí a ovládanie hadích spojencov",
        "passiveAbility": "Jedovatý dotyk - Každý útok má 30% šancu umlčať cieľ na 1 ťah",
        "playstyle": ["agresívny", "kontrolný"]
    },
    "druid": {
        "name": "Druid",
        "description": "Strážca prírody so zvieracími synergámi, kontrolou pohybu a podporou jednotiek",
        "title": "Strážca prírody",
        "specialAbility": "Spoločenstvo zvierat a liečenie prírody",
        "passiveAbility": "Výzia - 2 vrchné karty tvojho ťahacieho balíčku si vieš ľubovoľne pozerať. Na konci ťahu si vieš odložiť až 3 karty na spodok ťahacieho balíčku",
        "playstyle": ["synergia", "škálovanie"]
    }
}
```

---

## 9. Combo typy a štatistiky

**Zdrojový súbor:** `lib/data/combos/types.ts`

```typescript
export interface ComboCard {
    id: string;
    name: string;
    /* occurrences of the combo in the CSV */
    count: number;
    /* Raw power values the author provided */
    soloPower: number;
    powerMinimal: number;
    power2Bonuses: number;
    power3Bonuses: number;
    power4Bonuses: number;
    /* Probability metadata */
    chancePercent: number;
    chanceXSoloPower: number;
    chanceXPowerMinimal: number;
    chanceXPower2: number;
    chanceXPower3: number;
    chanceXPower4: number;
    /* Custom derived metric */
    scalingRatio: number;
}

export interface HeroComboStats {
    totalCards: number;
    averageScaling: number;
    maxPower4: number;
}

export function calculateHeroComboStats(combos: readonly ComboCard[]): HeroComboStats {
    if (combos.length === 0) {
        return { totalCards: 0, averageScaling: 0, maxPower4: 0 };
    }
    const totalScaling = combos.reduce((acc, c) => acc + c.scalingRatio, 0);
    const maxPower4 = Math.max(...combos.map((c) => c.power4Bonuses));
    return {
        totalCards: combos.length,
        averageScaling: Number((totalScaling / combos.length).toFixed(2)),
        maxPower4,
    };
}
```

---

## 10. Combo dáta — Crystal

**Zdrojový súbor:** `lib/data/combos/crystalCombos.ts`
**Počet combos:** 21

```typescript
export const crystalCombos: readonly ComboCard[] = [
    { id: "snowball", name: "Ľadová guľa", count: 5, soloPower: 1, powerMinimal: 1, power2Bonuses: 2, power3Bonuses: 2, power4Bonuses: 2, chancePercent: 11.9, chanceXSoloPower: 11.9, chanceXPowerMinimal: 11.9, chanceXPower2: 23.81, chanceXPower3: 23.81, chanceXPower4: 23.81, scalingRatio: 2.0 },
    { id: "iceMeteor", name: "Ľadový meteor", count: 3, soloPower: 1, powerMinimal: 1, power2Bonuses: 2, power3Bonuses: 2, power4Bonuses: 2, chancePercent: 7.14, chanceXSoloPower: 7.14, chanceXPowerMinimal: 7.14, chanceXPower2: 14.29, chanceXPower3: 14.29, chanceXPower4: 14.29, scalingRatio: 2.0 },
    { id: "iceShards", name: "Ľadové ostne", count: 1, soloPower: 0, powerMinimal: 1, power2Bonuses: 2, power3Bonuses: 3, power4Bonuses: 3, chancePercent: 2.38, chanceXSoloPower: 0.0, chanceXPowerMinimal: 2.38, chanceXPower2: 4.76, chanceXPower3: 7.14, chanceXPower4: 7.14, scalingRatio: 3.0 },
    { id: "magicOrLife", name: "Kúzlo alebo život", count: 1, soloPower: 1, powerMinimal: 1, power2Bonuses: 1, power3Bonuses: 1, power4Bonuses: 1, chancePercent: 2.38, chanceXSoloPower: 2.38, chanceXPowerMinimal: 2.38, chanceXPower2: 2.38, chanceXPower3: 2.38, chanceXPower4: 2.38, scalingRatio: 1.0 },
    { id: "crystalAttack", name: "Kryštálový útok", count: 4, soloPower: 0, powerMinimal: 1, power2Bonuses: 2, power3Bonuses: 2, power4Bonuses: 2, chancePercent: 9.52, chanceXSoloPower: 0.0, chanceXPowerMinimal: 9.52, chanceXPower2: 19.05, chanceXPower3: 19.05, chanceXPower4: 19.05, scalingRatio: 2.0 },
    { id: "allCrystalAttack", name: "Kryštálová smršť", count: 1, soloPower: 0, powerMinimal: 1, power2Bonuses: 2, power3Bonuses: 3, power4Bonuses: 4, chancePercent: 2.38, chanceXSoloPower: 0.0, chanceXPowerMinimal: 2.38, chanceXPower2: 4.76, chanceXPower3: 7.14, chanceXPower4: 9.52, scalingRatio: 4.0 },
    { id: "snowstorm", name: "Snežná búrka", count: 1, soloPower: 0, powerMinimal: 1, power2Bonuses: 1, power3Bonuses: 1, power4Bonuses: 1, chancePercent: 2.38, chanceXSoloPower: 0.0, chanceXPowerMinimal: 2.38, chanceXPower2: 2.38, chanceXPower3: 2.38, chanceXPower4: 2.38, scalingRatio: 1.0 },
    { id: "snowGround", name: "Zasnežená zem", count: 3, soloPower: 1, powerMinimal: 1, power2Bonuses: 1, power3Bonuses: 1, power4Bonuses: 1, chancePercent: 7.14, chanceXSoloPower: 7.14, chanceXPowerMinimal: 7.14, chanceXPower2: 7.14, chanceXPower3: 7.14, chanceXPower4: 7.14, scalingRatio: 1.0 },
    { id: "frost", name: "Zamrznutie", count: 1, soloPower: 0, powerMinimal: 1, power2Bonuses: 1, power3Bonuses: 1, power4Bonuses: 1, chancePercent: 2.38, chanceXSoloPower: 0.0, chanceXPowerMinimal: 2.38, chanceXPower2: 2.38, chanceXPower3: 2.38, chanceXPower4: 2.38, scalingRatio: 1.0 },
    { id: "iceCrystal", name: "Ľadový kryštál", count: 3, soloPower: 1, powerMinimal: 1, power2Bonuses: 1, power3Bonuses: 1, power4Bonuses: 1, chancePercent: 7.14, chanceXSoloPower: 7.14, chanceXPowerMinimal: 7.14, chanceXPower2: 7.14, chanceXPower3: 7.14, chanceXPower4: 7.14, scalingRatio: 1.0 },
    { id: "connectiveCrystal", name: "Spojovací kryštál", count: 2, soloPower: 0, powerMinimal: 0.5, power2Bonuses: 1, power3Bonuses: 1.5, power4Bonuses: 2, chancePercent: 4.76, chanceXSoloPower: 0.0, chanceXPowerMinimal: 2.38, chanceXPower2: 4.76, chanceXPower3: 7.14, chanceXPower4: 9.52, scalingRatio: 2.0 },
    { id: "snowBomb", name: "Snehová bomba", count: 2, soloPower: 1, powerMinimal: 1, power2Bonuses: 1, power3Bonuses: 1, power4Bonuses: 1, chancePercent: 4.76, chanceXSoloPower: 4.76, chanceXPowerMinimal: 4.76, chanceXPower2: 4.76, chanceXPower3: 4.76, chanceXPower4: 4.76, scalingRatio: 1.0 },
    { id: "crystalKing", name: "Královský kryštál", count: 1, soloPower: 1, powerMinimal: 1, power2Bonuses: 2, power3Bonuses: 3, power4Bonuses: 4, chancePercent: 2.38, chanceXSoloPower: 2.38, chanceXPowerMinimal: 2.38, chanceXPower2: 4.76, chanceXPower3: 7.14, chanceXPower4: 9.52, scalingRatio: 4.0 },
    { id: "crystalTower", name: "Kryštálová veža", count: 2, soloPower: 1, powerMinimal: 1, power2Bonuses: 1, power3Bonuses: 1, power4Bonuses: 1, chancePercent: 4.76, chanceXSoloPower: 4.76, chanceXPowerMinimal: 4.76, chanceXPower2: 4.76, chanceXPower3: 4.76, chanceXPower4: 4.76, scalingRatio: 1.0 },
    { id: "crystalBonus", name: "Bonusový kryštál", count: 1, soloPower: 0, powerMinimal: 0.5, power2Bonuses: 1, power3Bonuses: 1.5, power4Bonuses: 2, chancePercent: 2.38, chanceXSoloPower: 0.0, chanceXPowerMinimal: 1.19, chanceXPower2: 2.38, chanceXPower3: 3.57, chanceXPower4: 4.76, scalingRatio: 2.0 },
    { id: "bonusAoe", name: "Väčšia trefa", count: 2, soloPower: 0, powerMinimal: 1, power2Bonuses: 1, power3Bonuses: 1, power4Bonuses: 1, chancePercent: 4.76, chanceXSoloPower: 0.0, chanceXPowerMinimal: 4.76, chanceXPower2: 4.76, chanceXPower3: 4.76, chanceXPower4: 4.76, scalingRatio: 1.0 },
    { id: "bonusCastRange", name: "Dosah kúzla", count: 2, soloPower: 0, powerMinimal: 0.5, power2Bonuses: 0.5, power3Bonuses: 0.5, power4Bonuses: 0.5, chancePercent: 4.76, chanceXSoloPower: 0.0, chanceXPowerMinimal: 2.38, chanceXPower2: 2.38, chanceXPower3: 2.38, chanceXPower4: 2.38, scalingRatio: 0.5 },
    { id: "bonusAttackRange", name: "Dosah útoku", count: 1, soloPower: 0, powerMinimal: 1, power2Bonuses: 1, power3Bonuses: 1, power4Bonuses: 1, chancePercent: 2.38, chanceXSoloPower: 0.0, chanceXPowerMinimal: 2.38, chanceXPower2: 2.38, chanceXPower3: 2.38, chanceXPower4: 2.38, scalingRatio: 1.0 },
    { id: "bonusMovement", name: "Bonus k pohybu", count: 1, soloPower: 0.5, powerMinimal: 0.5, power2Bonuses: 0.5, power3Bonuses: 0.5, power4Bonuses: 0.5, chancePercent: 2.38, chanceXSoloPower: 1.19, chanceXPowerMinimal: 1.19, chanceXPower2: 1.19, chanceXPower3: 1.19, chanceXPower4: 1.19, scalingRatio: 1.0 },
    { id: "slide", name: "Skĺznutie", count: 2, soloPower: 2, powerMinimal: 2, power2Bonuses: 2, power3Bonuses: 2, power4Bonuses: 2, chancePercent: 4.76, chanceXSoloPower: 9.52, chanceXPowerMinimal: 9.52, chanceXPower2: 9.52, chanceXPower3: 9.52, chanceXPower4: 9.52, scalingRatio: 1.0 },
    { id: "moveUnit", name: "Pohyb s jednotkou", count: 3, soloPower: 1, powerMinimal: 1, power2Bonuses: 2, power3Bonuses: 2, power4Bonuses: 2, chancePercent: 7.14, chanceXSoloPower: 7.14, chanceXPowerMinimal: 7.14, chanceXPower2: 14.29, chanceXPower3: 14.29, chanceXPower4: 14.29, scalingRatio: 2.0 },
];
```

---

## 11. Combo dáta — Druid

**Zdrojový súbor:** `lib/data/combos/druidCombos.ts`
**Počet combos:** 22

```typescript
export const druidCombos: readonly ComboCard[] = [
    { id: "attackTogether", name: "Útok spolu", count: 2, soloPower: 1, powerMinimal: 1, power2Bonuses: 2, power3Bonuses: 3, power4Bonuses: 3, chancePercent: 4.76, chanceXSoloPower: 4.76, chanceXPowerMinimal: 4.76, chanceXPower2: 9.52, chanceXPower3: 14.29, chanceXPower4: 14.29, scalingRatio: 3.0 },
    { id: "unitReincarnation", name: "Reinkarnácia jednotky", count: 1, soloPower: 0, powerMinimal: 1, power2Bonuses: 2, power3Bonuses: 3, power4Bonuses: 3, chancePercent: 2.38, chanceXSoloPower: 0.0, chanceXPowerMinimal: 2.38, chanceXPower2: 4.76, chanceXPower3: 7.14, chanceXPower4: 7.14, scalingRatio: 3.0 },
    { id: "attackUnit", name: "Útok na jednotku", count: 4, soloPower: 1, powerMinimal: 1, power2Bonuses: 1, power3Bonuses: 1, power4Bonuses: 1, chancePercent: 9.52, chanceXSoloPower: 9.52, chanceXPowerMinimal: 9.52, chanceXPower2: 9.52, chanceXPower3: 9.52, chanceXPower4: 9.52, scalingRatio: 1.0 },
    { id: "bear", name: "Medveď", count: 1, soloPower: 2, powerMinimal: 1, power2Bonuses: 3, power3Bonuses: 4, power4Bonuses: 5, chancePercent: 2.38, chanceXSoloPower: 4.76, chanceXPowerMinimal: 2.38, chanceXPower2: 7.14, chanceXPower3: 9.52, chanceXPower4: 11.9, scalingRatio: 5.0 },
    { id: "bearCleave", name: "Medvedí úder", count: 1, soloPower: 0, powerMinimal: 1, power2Bonuses: 2, power3Bonuses: 3, power4Bonuses: 3, chancePercent: 2.38, chanceXSoloPower: 0.0, chanceXPowerMinimal: 2.38, chanceXPower2: 4.76, chanceXPower3: 7.14, chanceXPower4: 7.14, scalingRatio: 3.0 },
    { id: "furiousWolf", name: "Zúrivý vlk", count: 1, soloPower: 0, powerMinimal: 1, power2Bonuses: 2, power3Bonuses: 3, power4Bonuses: 4, chancePercent: 2.38, chanceXSoloPower: 0.0, chanceXPowerMinimal: 2.38, chanceXPower2: 4.76, chanceXPower3: 7.14, chanceXPower4: 9.52, scalingRatio: 4.0 },
    { id: "boar", name: "Diviak", count: 4, soloPower: 1, powerMinimal: 1, power2Bonuses: 1, power3Bonuses: 1, power4Bonuses: 1, chancePercent: 9.52, chanceXSoloPower: 9.52, chanceXPowerMinimal: 9.52, chanceXPower2: 9.52, chanceXPower3: 9.52, chanceXPower4: 9.52, scalingRatio: 1.0 },
    { id: "silentTree", name: "Tichý strom", count: 2, soloPower: 1, powerMinimal: 1, power2Bonuses: 1, power3Bonuses: 1, power4Bonuses: 1, chancePercent: 4.76, chanceXSoloPower: 4.76, chanceXPowerMinimal: 4.76, chanceXPower2: 4.76, chanceXPower3: 4.76, chanceXPower4: 4.76, scalingRatio: 1.0 },
    { id: "battleGod", name: "Boh boja", count: 2, soloPower: 1, powerMinimal: 1, power2Bonuses: 2, power3Bonuses: 2, power4Bonuses: 2, chancePercent: 4.76, chanceXSoloPower: 4.76, chanceXPowerMinimal: 4.76, chanceXPower2: 9.52, chanceXPower3: 9.52, chanceXPower4: 9.52, scalingRatio: 2.0 },
    { id: "natureBlock", name: "Prírodný blok", count: 1, soloPower: 1, powerMinimal: 1, power2Bonuses: 2, power3Bonuses: 3, power4Bonuses: 4, chancePercent: 2.38, chanceXSoloPower: 2.38, chanceXPowerMinimal: 2.38, chanceXPower2: 4.76, chanceXPower3: 7.14, chanceXPower4: 9.52, scalingRatio: 4.0 },
    { id: "natureGod", name: "Boh prírody", count: 2, soloPower: 0, powerMinimal: 1, power2Bonuses: 2, power3Bonuses: 3, power4Bonuses: 4, chancePercent: 4.76, chanceXSoloPower: 0.0, chanceXPowerMinimal: 4.76, chanceXPower2: 9.52, chanceXPower3: 14.29, chanceXPower4: 19.05, scalingRatio: 4.0 },
    { id: "unitHp", name: "Život jednotky", count: 3, soloPower: 0, powerMinimal: 1, power2Bonuses: 1, power3Bonuses: 1, power4Bonuses: 1, chancePercent: 7.14, chanceXSoloPower: 0.0, chanceXPowerMinimal: 7.14, chanceXPower2: 7.14, chanceXPower3: 7.14, chanceXPower4: 7.14, scalingRatio: 1.0 },
    { id: "natureSpirit", name: "Duch prírody", count: 1, soloPower: 0, powerMinimal: 0.5, power2Bonuses: 1, power3Bonuses: 1.5, power4Bonuses: 2, chancePercent: 2.38, chanceXSoloPower: 0.0, chanceXPowerMinimal: 1.19, chanceXPower2: 2.38, chanceXPower3: 3.57, chanceXPower4: 4.76, scalingRatio: 2.0 },
    { id: "movementAttack", name: "Pohybový útok", count: 3, soloPower: 1, powerMinimal: 1, power2Bonuses: 2, power3Bonuses: 3, power4Bonuses: 4, chancePercent: 7.14, chanceXSoloPower: 7.14, chanceXPowerMinimal: 7.14, chanceXPower2: 14.29, chanceXPower3: 21.43, chanceXPower4: 28.57, scalingRatio: 4.0 },
    { id: "bonusAttackRange", name: "Dosah útoku", count: 1, soloPower: 0, powerMinimal: 1, power2Bonuses: 1, power3Bonuses: 1, power4Bonuses: 1, chancePercent: 2.38, chanceXSoloPower: 0.0, chanceXPowerMinimal: 2.38, chanceXPower2: 2.38, chanceXPower3: 2.38, chanceXPower4: 2.38, scalingRatio: 1.0 },
    { id: "bonusMovement", name: "Bonus k pohybu", count: 1, soloPower: 0.5, powerMinimal: 0.5, power2Bonuses: 0.5, power3Bonuses: 0.5, power4Bonuses: 0.5, chancePercent: 2.38, chanceXSoloPower: 1.19, chanceXPowerMinimal: 1.19, chanceXPower2: 1.19, chanceXPower3: 1.19, chanceXPower4: 1.19, scalingRatio: 1.0 },
    { id: "moveUnit", name: "Pohyb s jednotkou", count: 2, soloPower: 0, powerMinimal: 1, power2Bonuses: 1.5, power3Bonuses: 1.5, power4Bonuses: 1.5, chancePercent: 4.76, chanceXSoloPower: 0.0, chanceXPowerMinimal: 4.76, chanceXPower2: 7.14, chanceXPower3: 7.14, chanceXPower4: 7.14, scalingRatio: 1.5 },
    { id: "movement", name: "Pohyb", count: 3, soloPower: 1, powerMinimal: 1, power2Bonuses: 1, power3Bonuses: 1, power4Bonuses: 1, chancePercent: 7.14, chanceXSoloPower: 7.14, chanceXPowerMinimal: 7.14, chanceXPower2: 7.14, chanceXPower3: 7.14, chanceXPower4: 7.14, scalingRatio: 1.0 },
    { id: "swap", name: "Výmena", count: 2, soloPower: 1, powerMinimal: 1, power2Bonuses: 2, power3Bonuses: 2, power4Bonuses: 2, chancePercent: 4.76, chanceXSoloPower: 4.76, chanceXPowerMinimal: 4.76, chanceXPower2: 9.52, chanceXPower3: 9.52, chanceXPower4: 9.52, scalingRatio: 2.0 },
    { id: "teleportUnits", name: "Teleport jednotiek", count: 1, soloPower: 0, powerMinimal: 1, power2Bonuses: 2, power3Bonuses: 2, power4Bonuses: 2, chancePercent: 2.38, chanceXSoloPower: 0.0, chanceXPowerMinimal: 2.38, chanceXPower2: 4.76, chanceXPower3: 4.76, chanceXPower4: 4.76, scalingRatio: 2.0 },
    { id: "wolf", name: "Vlk", count: 2, soloPower: 0.5, powerMinimal: 0.5, power2Bonuses: 1, power3Bonuses: 1.5, power4Bonuses: 2, chancePercent: 4.76, chanceXSoloPower: 2.38, chanceXPowerMinimal: 2.38, chanceXPower2: 4.76, chanceXPower3: 7.14, chanceXPower4: 9.52, scalingRatio: 2.0 },
    { id: "nightWolf", name: "Nočný vlk", count: 1, soloPower: 0, powerMinimal: 0.5, power2Bonuses: 0.5, power3Bonuses: 0.5, power4Bonuses: 0.5, chancePercent: 2.38, chanceXSoloPower: 0.0, chanceXPowerMinimal: 1.19, chanceXPower2: 1.19, chanceXPower3: 1.19, chanceXPower4: 1.19, scalingRatio: 0.5 },
    { id: "allUnitMove", name: "Pohyb všetkých jednotiek", count: 1, soloPower: 1, powerMinimal: 1, power2Bonuses: 1.5, power3Bonuses: 2, power4Bonuses: 2.5, chancePercent: 2.38, chanceXSoloPower: 2.38, chanceXPowerMinimal: 2.38, chanceXPower2: 3.57, chanceXPower3: 4.76, chanceXPower4: 5.95, scalingRatio: 2.5 },
];
```

---

## 12. Combo dáta — Toxic

**Zdrojový súbor:** `lib/data/combos/toxicCombos.ts`
**Počet combos:** 22

```typescript
export const toxicCombos: readonly ComboCard[] = [
    { id: "toxicPlant", name: "Toxická rastlina", count: 4, soloPower: 1, powerMinimal: 1, power2Bonuses: 1.5, power3Bonuses: 1.5, power4Bonuses: 1.5, chancePercent: 9.52, chanceXSoloPower: 9.52, chanceXPowerMinimal: 9.52, chanceXPower2: 14.29, chanceXPower3: 14.29, chanceXPower4: 14.29, scalingRatio: 1.5 },
    { id: "snakeAttack", name: "Hadí útok", count: 4, soloPower: 1, powerMinimal: 1, power2Bonuses: 1.5, power3Bonuses: 1.5, power4Bonuses: 1.5, chancePercent: 9.52, chanceXSoloPower: 9.52, chanceXPowerMinimal: 9.52, chanceXPower2: 14.29, chanceXPower3: 14.29, chanceXPower4: 14.29, scalingRatio: 1.5 },
    { id: "snakeMove", name: "Hadí pohyb", count: 4, soloPower: 1, powerMinimal: 1, power2Bonuses: 1, power3Bonuses: 1, power4Bonuses: 1, chancePercent: 9.52, chanceXSoloPower: 9.52, chanceXPowerMinimal: 9.52, chanceXPower2: 9.52, chanceXPower3: 9.52, chanceXPower4: 9.52, scalingRatio: 1.0 },
    { id: "allSnakesMove", name: "Pohyb všetkých hadov", count: 2, soloPower: 1, powerMinimal: 1, power2Bonuses: 2, power3Bonuses: 3, power4Bonuses: 4, chancePercent: 4.76, chanceXSoloPower: 4.76, chanceXPowerMinimal: 4.76, chanceXPower2: 9.52, chanceXPower3: 14.29, chanceXPower4: 19.05, scalingRatio: 4.0 },
    { id: "snakesForward", name: "Hady vpred", count: 2, soloPower: 1.5, powerMinimal: 1.5, power2Bonuses: 1.5, power3Bonuses: 1.5, power4Bonuses: 1.5, chancePercent: 4.76, chanceXSoloPower: 7.14, chanceXPowerMinimal: 7.14, chanceXPower2: 7.14, chanceXPower3: 7.14, chanceXPower4: 7.14, scalingRatio: 1.0 },
    { id: "snakeRoar", name: "Hadí rev", count: 1, soloPower: 1, powerMinimal: 1.5, power2Bonuses: 2, power3Bonuses: 3, power4Bonuses: 4, chancePercent: 2.38, chanceXSoloPower: 2.38, chanceXPowerMinimal: 3.57, chanceXPower2: 4.76, chanceXPower3: 7.14, chanceXPower4: 9.52, scalingRatio: 4.0 },
    { id: "snakeBomb", name: "Hadia bomba", count: 1, soloPower: 1, powerMinimal: 1, power2Bonuses: 1, power3Bonuses: 1, power4Bonuses: 1, chancePercent: 2.38, chanceXSoloPower: 2.38, chanceXPowerMinimal: 2.38, chanceXPower2: 2.38, chanceXPower3: 2.38, chanceXPower4: 2.38, scalingRatio: 1.0 },
    { id: "disarmBomb", name: "Odzbrojujúca bomba", count: 1, soloPower: 1, powerMinimal: 1, power2Bonuses: 1, power3Bonuses: 1, power4Bonuses: 1, chancePercent: 2.38, chanceXSoloPower: 2.38, chanceXPowerMinimal: 2.38, chanceXPower2: 2.38, chanceXPower3: 2.38, chanceXPower4: 2.38, scalingRatio: 1.0 },
    { id: "disarm", name: "Odzbrojenie", count: 1, soloPower: 1, powerMinimal: 1, power2Bonuses: 1, power3Bonuses: 1, power4Bonuses: 1, chancePercent: 2.38, chanceXSoloPower: 2.38, chanceXPowerMinimal: 2.38, chanceXPower2: 2.38, chanceXPower3: 2.38, chanceXPower4: 2.38, scalingRatio: 1.0 },
    { id: "block", name: "Blok", count: 2, soloPower: 0, powerMinimal: 2, power2Bonuses: 2, power3Bonuses: 2, power4Bonuses: 2, chancePercent: 4.76, chanceXSoloPower: 0.0, chanceXPowerMinimal: 9.52, chanceXPower2: 9.52, chanceXPower3: 9.52, chanceXPower4: 9.52, scalingRatio: 2.0 },
    { id: "snakePit", name: "Hadia jama", count: 1, soloPower: 1, powerMinimal: 1, power2Bonuses: 1, power3Bonuses: 1, power4Bonuses: 1, chancePercent: 2.38, chanceXSoloPower: 2.38, chanceXPowerMinimal: 2.38, chanceXPower2: 2.38, chanceXPower3: 2.38, chanceXPower4: 2.38, scalingRatio: 1.0 },
    { id: "snakes", name: "Hady", count: 4, soloPower: 1, powerMinimal: 1, power2Bonuses: 1, power3Bonuses: 1, power4Bonuses: 1, chancePercent: 9.52, chanceXSoloPower: 9.52, chanceXPowerMinimal: 9.52, chanceXPower2: 9.52, chanceXPower3: 9.52, chanceXPower4: 9.52, scalingRatio: 1.0 },
    { id: "doubleSnake", name: "Dvojitý had", count: 2, soloPower: 0, powerMinimal: 1, power2Bonuses: 2, power3Bonuses: 3, power4Bonuses: 4, chancePercent: 4.76, chanceXSoloPower: 0.0, chanceXPowerMinimal: 4.76, chanceXPower2: 9.52, chanceXPower3: 14.29, chanceXPower4: 19.05, scalingRatio: 4.0 },
    { id: "rootPlant", name: "Koreňová rastlina", count: 2, soloPower: 1, powerMinimal: 1, power2Bonuses: 1, power3Bonuses: 1, power4Bonuses: 1, chancePercent: 4.76, chanceXSoloPower: 4.76, chanceXPowerMinimal: 4.76, chanceXPower2: 4.76, chanceXPower3: 4.76, chanceXPower4: 4.76, scalingRatio: 1.0 },
    { id: "plantReincarnation", name: "Rastlinná reinkarnácia", count: 2, soloPower: 0, powerMinimal: 1, power2Bonuses: 1, power3Bonuses: 1, power4Bonuses: 1, chancePercent: 4.76, chanceXSoloPower: 0.0, chanceXPowerMinimal: 4.76, chanceXPower2: 4.76, chanceXPower3: 4.76, chanceXPower4: 4.76, scalingRatio: 1.0 },
    { id: "snakeRespawnTree", name: "Hadí respawn strom", count: 1, soloPower: 1, powerMinimal: 1, power2Bonuses: 2, power3Bonuses: 3, power4Bonuses: 4, chancePercent: 2.38, chanceXSoloPower: 2.38, chanceXPowerMinimal: 2.38, chanceXPower2: 4.76, chanceXPower3: 7.14, chanceXPower4: 9.52, scalingRatio: 4.0 },
    { id: "movementTree", name: "Pohybový strom", count: 2, soloPower: 1, powerMinimal: 1.5, power2Bonuses: 2, power3Bonuses: 2.5, power4Bonuses: 3, chancePercent: 4.76, chanceXSoloPower: 4.76, chanceXPowerMinimal: 7.14, chanceXPower2: 9.52, chanceXPower3: 11.9, chanceXPower4: 14.29, scalingRatio: 3.0 },
    { id: "bonusRangeTree", name: "Bonusový dosah strom", count: 1, soloPower: 1, powerMinimal: 1.5, power2Bonuses: 2.5, power3Bonuses: 3, power4Bonuses: 3, chancePercent: 2.38, chanceXSoloPower: 2.38, chanceXPowerMinimal: 3.57, chanceXPower2: 5.95, chanceXPower3: 7.14, chanceXPower4: 7.14, scalingRatio: 3.0 },
    { id: "bonusAoe", name: "Väčšia trefa", count: 2, soloPower: 0, powerMinimal: 1, power2Bonuses: 1, power3Bonuses: 1, power4Bonuses: 1, chancePercent: 4.76, chanceXSoloPower: 0.0, chanceXPowerMinimal: 4.76, chanceXPower2: 4.76, chanceXPower3: 4.76, chanceXPower4: 4.76, scalingRatio: 1.0 },
    { id: "bonusCastRange", name: "Dosah kúzla", count: 2, soloPower: 0, powerMinimal: 0.5, power2Bonuses: 0.5, power3Bonuses: 0.5, power4Bonuses: 0.5, chancePercent: 4.76, chanceXSoloPower: 0.0, chanceXPowerMinimal: 2.38, chanceXPower2: 2.38, chanceXPower3: 2.38, chanceXPower4: 2.38, scalingRatio: 0.5 },
    { id: "bonusAttackRange", name: "Dosah útoku", count: 1, soloPower: 0, powerMinimal: 1, power2Bonuses: 1, power3Bonuses: 1, power4Bonuses: 1, chancePercent: 2.38, chanceXSoloPower: 0.0, chanceXPowerMinimal: 2.38, chanceXPower2: 2.38, chanceXPower3: 2.38, chanceXPower4: 2.38, scalingRatio: 1.0 },
    { id: "bonusMovement", name: "Bonus k pohybu", count: 1, soloPower: 0.5, powerMinimal: 0.5, power2Bonuses: 0.5, power3Bonuses: 0.5, power4Bonuses: 0.5, chancePercent: 2.38, chanceXSoloPower: 1.19, chanceXPowerMinimal: 1.19, chanceXPower2: 1.19, chanceXPower3: 1.19, chanceXPower4: 1.19, scalingRatio: 1.0 },
];
```

---

## 13. Hexagonálna mapa

**Zdrojový súbor:** `lib/heroes-world/hex-grid.ts`

Axial coordinate system (q, r) pre flat-top hexagóny.

```typescript
export class HexCoordinate {
    constructor(
        public q: number,
        public r: number,
    ) {}

    /** S-coordinate: s = -q - r */
    get s(): number {
        return -this.q - this.r;
    }

    /** Manhattan distance v hexagonal space */
    distanceTo(other: HexCoordinate): number {
        return (
            Math.abs(this.q - other.q) +
            Math.abs(this.q + this.r - other.q - other.r) +
            Math.abs(this.r - other.r)
        ) / 2;
    }

    /** 6 susedných smerov pre flat-top: NE, E, SE, SW, W, NW */
    neighbors(): HexCoordinate[] {
        const directions = [
            [1, -1], [1, 0], [0, 1],   // NE, E, SE
            [-1, 1], [-1, 0], [0, -1], // SW, W, NW
        ];
        return directions.map(([dq, dr]) => new HexCoordinate(this.q + dq, this.r + dr));
    }

    /** Pixel pozícia pre Canvas (flat-top) */
    toPixel(hexSize: number = 60): [number, number] {
        const x = hexSize * ((3 / 2) * this.q);
        const y = hexSize * ((Math.sqrt(3) / 2) * this.q + Math.sqrt(3) * this.r);
        return [x, y];
    }

    /** Pixel → hex */
    static fromPixel(x: number, y: number, hexSize: number = 30): HexCoordinate {
        const q = ((2 / 3) * x) / hexSize;
        const r = ((-1 / 3) * x + (Math.sqrt(3) / 3) * y) / hexSize;
        return HexCoordinate.roundHex(q, r);
    }

    /** Rounding pre fractional koordináty */
    static roundHex(q: number, r: number): HexCoordinate {
        const s = -q - r;
        let rq = Math.round(q);
        let rr = Math.round(r);
        const rs = Math.round(s);
        const qDiff = Math.abs(rq - q);
        const rDiff = Math.abs(rr - r);
        const sDiff = Math.abs(rs - s);
        if (qDiff > rDiff && qDiff > sDiff) rq = -rr - rs;
        else if (rDiff > sDiff) rr = -rq - rs;
        return new HexCoordinate(rq, rr);
    }

    toString(): string {
        return `${this.q},${this.r}`;
    }

    equals(other: HexCoordinate): boolean {
        return this.q === other.q && this.r === other.r;
    }

    clone(): HexCoordinate {
        return new HexCoordinate(this.q, this.r);
    }
}

export interface HexTile {
    coordinate: HexCoordinate;
    terrainType: TerrainType;
    elevation: number;
    resources?: HexResourceType[];
    structure?: StructureType;
    owner?: string; // tribe ID
    visibility: VisibilityState;
}

export enum TerrainType {
    CRYSTAL = "crystal",
    DRUID = "druid",
    TOXIC = "toxic",
    PORTAL = "portal",
    HILLS = "hills",
}

export enum HexResourceType {
    SOULS = "souls",
    RESOURCES = "resources",
}

export enum StructureType {
    VILLAGE = "village",
    FORTRESS = "fortress",
    MINE = "mine",
    TEMPLE = "temple",
}

export enum VisibilityState {
    HIDDEN = "hidden",
    EXPLORED = "explored",
    VISIBLE = "visible",
}

export class HexGrid {
    private tiles: Map<string, HexTile> = new Map();
    private readonly radius: number;

    constructor(radius: number = 10) { /* ... */ }

    getTile(coord: HexCoordinate): HexTile | undefined;
    setTile(tile: HexTile): void;
    getAllTiles(): HexTile[];
    getNeighbors(coord: HexCoordinate): HexTile[];
    getTilesInRange(center: HexCoordinate, range: number): HexTile[];
    findPath(start: HexCoordinate, end: HexCoordinate): HexCoordinate[]; // BFS
    getBounds(): { minQ: number; maxQ: number; minR: number; maxR: number };
}
```

---

## 14. Herný stav — DB schémy

**Zdrojové súbory:** `lib/types/game.ts`, `lib/types/game-state.ts`

```typescript
import type { TerrainFunctionType } from "./personality";

export type WorldStatus = "active" | "archived";

export interface World {
    id: string;
    name: string;
    description: string | null;
    map_radius: number;
    map_seed: string | null;
    password_id: string | null;
    status: WorldStatus;
    archived: boolean;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export type MatchStatus = "waiting" | "in_progress" | "finished" | "cancelled";

export interface Match {
    id: string;
    world_id: string;
    tile_id: string | null;
    name: string;
    status: MatchStatus;
    max_players: number;
    winner_id: string | null;
    started_at: string | null;
    finished_at: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export type TribeType = "crystal" | "druid" | "toxic";
export type RoleType = "attacker" | "defender" | "mage" | "explorer" | "strategist";

export interface Tile {
    id: string;
    world_id: string;
    name: string | null;
    coordinate_x: number;
    coordinate_y: number;
    tribe_id: string | null;
    terrain_function: TerrainFunctionType;
    created_at: string;
    updated_at: string;
}

export interface Tribe {
    id: string;
    world_id: string;
    name: TribeType;
    main_tile_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface WorldPlayer {
    id: string;
    world_id: string;
    player_id: string;
    tribe_id: string | null;
    joined_at: string;
    updated_at: string;
}

export interface MatchPlayer {
    id: string;
    match_id: string;
    player_id: string;
    tribe_id: string | null;
    role: RoleType | null;
    player_order: number;
    joined_at: string;
}

// Extended types with relations
export interface MatchWithPlayers extends Match {
    players: MatchPlayer[];
    world?: World;
    tile?: Tile;
}

export interface MatchPlayerWithProfile extends MatchPlayer {
    profile?: { id: string; email: string; name: string | null; avatar_url: string | null; };
    tribe?: Tribe;
}

export interface TribeWithPlayers extends Tribe {
    players: WorldPlayer[];
    main_tile?: Tile;
}

export interface WorldWithTribes extends World {
    tribes: Tribe[];
}

export interface CreateMatchRequest {
    world_id: string;
    tile_id?: string | null;
    name: string;
    max_players: 2 | 3;
    players?: Array<{ player_id: string; tribe_id: string | null }>;
    winner_id?: string | null;
    status?: "waiting" | "in_progress" | "finished";
}

export interface CreateWorldRequest {
    name: string;
    description?: string;
    map_radius?: number;
    map_seed?: string;
    password_id?: string;
}

// --- lib/types/game-state.ts ---
export interface ExtendedTileData {
    dbId?: string;
    name?: string;
    tribe?: { id: string; name: string; };
    tribe_id?: string;
    coordinate: HexCoordinate;
    terrainType: string;
    elevation: number;
    visibility: "visible" | "explored" | "hidden";
    resources?: string[];
    structure?: string;
    owner?: string;
}

export interface TileRecord {
    id: string;
    coordinate_x: number;
    coordinate_y: number;
    name?: string;
    tribe_id?: string;
    tribe?: { id: string; name: string; };
    current_owner?: { name: string; id: string; };
    terrain_function?: "base" | "resources" | "altar" | "wasteland" | "border";
}

export interface WorldPlayerRecord {
    id: string;
    profile?: { nickname?: string; name?: string; email?: string; };
    tribe?: { id: string; name: string; };
}
```

---

## 15. Personality, atribúty, inventár, combat

**Zdrojový súbor:** `lib/types/personality.ts`

### Personality Types

```typescript
/** 6 osobností – Solo vs Team orientácia */
export type PersonalityType =
    | "conqueror"  // Dobyvateľ - Solo - +20% XP from attacks
    | "guardian"   // Strážca - Team - +1 defense for teammates
    | "merchant"   // Obchodník - Team - Can donate cards without XP loss
    | "scout"      // Prieskumník - Solo - +5 inventory slots, can't borrow
    | "worshipper" // Uctievač - Team - Crafted cards +1 level for tribe
    | "thief";     // Zlodej - Solo - 20% steal chance on exploration

export type PersonalityOrientation = "solo" | "team";

export interface PersonalityBonus {
    type: PersonalityType;
    orientation: PersonalityOrientation;
    description: string;
    bonusKey: string;
    bonusValue: number | string | boolean;
}

export const PERSONALITY_CONFIG: Record<PersonalityType, PersonalityBonus> = {
    conqueror: { type: "conqueror", orientation: "solo", description: "Získava o 20% viac XP z úspešných útokov", bonusKey: "attack_xp_multiplier", bonusValue: 1.2 },
    guardian: { type: "guardian", orientation: "team", description: "Zvyšuje obranu spoluhráčov na rovnakom políčku o +1", bonusKey: "team_defense_bonus", bonusValue: 1 },
    merchant: { type: "merchant", orientation: "team", description: "Môže darovať karty bez straty XP", bonusKey: "donate_without_xp_loss", bonusValue: true },
    scout: { type: "scout", orientation: "solo", description: "+5 slotov v batohu, nemôže si požičiavať z kmeňového", bonusKey: "extra_inventory_slots", bonusValue: 5 },
    worshipper: { type: "worshipper", orientation: "team", description: "Vycraftené karty pre kmeň sú o 1 level silnejšie", bonusKey: "craft_level_bonus", bonusValue: 1 },
    thief: { type: "thief", orientation: "solo", description: "20% šanca ukradnúť surovinu pri prieskume", bonusKey: "steal_chance", bonusValue: 0.2 },
};

export const VALID_PERSONALITY_TYPES: PersonalityType[] = ["conqueror", "guardian", "merchant", "scout", "worshipper", "thief"];
```

### Player Attributes

```typescript
/** 4 atribúty, každý 0-10 */
export interface PlayerAttributes {
    attack: number;    // Útok
    defense: number;   // Obrana
    explorer: number;  // Dobrodruh
    gatherer: number;  // Zberač
}

export const MAX_ATTRIBUTE_LEVEL = 10;
export const MAX_TOTAL_LEVEL = 40; // 4 attributes × 10
```

### Terrain Functions

```typescript
export type TerrainFunctionType =
    | "base"       // Základňa - crafting, healing, sacrifice
    | "resources"  // Nálezisko surovín - gather bonus
    | "altar"      // Šamanský oltár - craft rarity boost
    | "wasteland"  // Pustina - high random drops
    | "border";    // Hraničné pásmo - conflict zone

export interface TerrainFunctionConfig {
    type: TerrainFunctionType;
    valueMultiplier: number;   // XP/combat multiplier
    cardCapacity: number;      // Max cards in combat
    specialFunction: string[];
}

export const TERRAIN_FUNCTION_CONFIG: Record<TerrainFunctionType, TerrainFunctionConfig> = {
    base:      { type: "base",      valueMultiplier: 5.0, cardCapacity: 40, specialFunction: ["crafting", "healing", "sacrifice"] },
    resources: { type: "resources", valueMultiplier: 2.0, cardCapacity: 25, specialFunction: ["gather_bonus_1.5"] },
    altar:     { type: "altar",     valueMultiplier: 3.0, cardCapacity: 20, specialFunction: ["craft_rarity_boost"] },
    wasteland: { type: "wasteland", valueMultiplier: 1.0, cardCapacity: 15, specialFunction: ["high_random_drop"] },
    border:    { type: "border",    valueMultiplier: 2.5, cardCapacity: 30, specialFunction: ["conflict_zone"] },
};

export const VALID_TERRAIN_FUNCTIONS: TerrainFunctionType[] = ["base", "resources", "altar", "wasteland", "border"];
```

### Player Character

```typescript
export interface PlayerCharacter {
    id: string;
    player_id: string;   // FK to profiles
    world_id: string;    // FK to worlds
    personality_type: PersonalityType;

    // Attributes (0-10 each)
    attr_attack: number;
    attr_defense: number;
    attr_explorer: number;
    attr_gatherer: number;

    // XP and Level
    current_xp: number;   // Total XP earned (statistics)
    free_xp: number;      // Unallocated XP, spent on attributes
    total_level: number;  // Computed: sum of attributes

    // Position and State
    current_tile_id: string | null;
    is_captured: boolean;
    captured_by: string | null;

    // V47: Resources
    essence: number;      // Collected by Gatherer on own territory

    // V47: Movement tracking
    last_move_at: string | null;

    created_at: string;
    updated_at: string;
}
```

### Inventory

```typescript
export interface InventoryItem {
    id: string;
    owner_type: "personal" | "clan";
    owner_id: string;       // player_character_id or tribe_id
    world_id: string;
    card_id: string;        // Reference to card from lib/data/base
    card_level: number;     // 1-10 card power level
    is_equipped: boolean;
    created_at: string;
    updated_at: string;
    // Enriched from static card data (added by API)
    card_name?: string;
    card_description?: string;
    hero_id?: string;
}
```

### Combat & Daily Activity

```typescript
export interface CombatLog {
    id: string;
    world_id: string;
    tile_id: string;
    attacker_id: string;  // player_character_id
    defender_id: string;  // player_character_id
    combat_type: "online" | "physical";
    attacker_roll: number | null;
    defender_roll: number | null;
    winner_id: string | null;
    xp_gained: number;
    xp_lost: number;
    capture_occurred: boolean;
    resolved_at: string | null;
    created_at: string;
}

export type TerritoryType = "own" | "enemy" | "neutral";
export type ActivityType = "combat" | "exploration" | "gathering";
export const VALID_ACTIVITY_TYPES: ActivityType[] = ["combat", "exploration", "gathering"];

export interface DailyActivityLog {
    id: string;
    world_id: string;
    character_id: string;
    tile_id: string;
    activity_type: ActivityType;
    essence_gained: number;
    card_found: string | null;
    card_level: number | null;
    combat_log_id: string | null;
    evaluated_at: string;
    created_at: string;
}

export type EvaluationInterval = "1min" | "10min" | "1hour" | "midnight";

export interface EvaluationIntervalConfig {
    value: EvaluationInterval;
    label: string;
    description: string;
    cronMinutes: number;
}

export const EVALUATION_INTERVAL_CONFIG: Record<EvaluationInterval, EvaluationIntervalConfig> = {
    "1min":    { value: "1min",    label: "Každú minútu",    description: "Boje sa vyhodnocujú každú minútu (pre testovanie)", cronMinutes: 1 },
    "10min":   { value: "10min",   label: "Každých 10 minút", description: "Boje sa vyhodnocujú každých 10 minút",             cronMinutes: 10 },
    "1hour":   { value: "1hour",   label: "Každú hodinu",    description: "Boje sa vyhodnocujú každú celú hodinu",             cronMinutes: 60 },
    midnight:  { value: "midnight", label: "O polnoci",       description: "Boje sa vyhodnocujú raz denne o polnoci",          cronMinutes: 0 },
};

export const VALID_EVALUATION_INTERVALS: EvaluationInterval[] = ["1min", "10min", "1hour", "midnight"];
```

### Gameplay Konfigurácie

```typescript
/** Exploration – card discovery chances */
export const EXPLORATION_CONFIG = {
    BASE_CARD_CHANCE: 0.05,           // 5% base chance to find a card
    EXPLORER_BONUS_PER_LEVEL: 0.02,   // +2% per explorer level
    MAX_CARD_CHANCE: 0.35,            // Cap at 35% chance
} as const;

/** Gathering – essence collection */
export const GATHERING_CONFIG = {
    BASE_ESSENCE_PER_LEVEL: 5,
    TERRAIN_MULTIPLIERS: {
        base: 2.0,
        resources: 1.5,
        altar: 1.0,
        wasteland: 0.5,
        border: 0.75,
    } as Record<TerrainFunctionType, number>,
} as const;

/**
 * XP Configuration
 * Formula: base + (level_difference_bonus if winner was weaker)
 * Level diff bonus = (loser_level - winner_level) * LEVEL_DIFF_MULTIPLIER
 */
export const XP_CONFIG = {
    BASE_XP_PER_WIN: 1,
    LEVEL_DIFF_MULTIPLIER: 1,
    MAX_BONUS_XP: 5,
} as const;
```

---

## 16. Svet — regióny a kmene

**Zdrojový súbor:** `lib/core/world-types.ts`

```typescript
import type { HeroId } from "./types";

export interface TribeInfo {
    id: HeroId;
    name: string;
    description: string;
    region: string;
    specialties: string[];
    lore: string;
}

export interface MapRegionInfo {
    id: string;
    name: string;
    description: string;
    type: "geographic" | "structure" | "landmark";
    lore: string;
    features?: string[];
}

export interface ClickableArea {
    id: string;
    shape: "circle" | "polygon" | "ellipse";
    coordinates: number[] | string;
    label: string;
    type: "tribe" | "region";
}

/** Tribe areas (playable heroes) */
export const TRIBE_AREAS: Record<HeroId, ClickableArea> = {
    crystal: { id: "crystal", type: "tribe", shape: "circle",  coordinates: "50% 30% 10%", label: "Northern Crystal Peaks" },
    druid:   { id: "druid",   type: "tribe", shape: "ellipse", coordinates: "70% 48% 10%", label: "Eastern Ancient Forests" },
    toxic:   { id: "toxic",   type: "tribe", shape: "circle",  coordinates: "44% 60% 10%", label: "South Poison Swamps" },
} as const;

/** Map regions (non-playable areas) */
export const MAP_REGIONS: Record<string, ClickableArea> = {
    mountains: { id: "mountains", type: "region", shape: "circle", coordinates: "25% 42% 10%", label: "Western Mountain Range" },
    portal:    { id: "portal",    type: "region", shape: "circle", coordinates: "50% 45% 8%",  label: "Ancient Portal" },
} as const;

export const ALL_CLICKABLE_AREAS = { ...TRIBE_AREAS, ...MAP_REGIONS } as const;

export function isTribeArea(id: string): id is HeroId { return id in TRIBE_AREAS; }
export function isMapRegion(id: string): boolean { return id in MAP_REGIONS; }
export function getClickableArea(id: string): ClickableArea | undefined {
    return ALL_CLICKABLE_AREAS[id as keyof typeof ALL_CLICKABLE_AREAS];
}
```

---

## 17. Konštanty

**Zdrojový súbor:** `lib/core/constants.ts`

```typescript
export const APP_NAME = "The Last Tribe Portal" as const;
export const DEFAULT_LOCALE = "sk" as const;

export const HERO_IDS = ["crystal", "toxic", "druid"] as const;

// Cache settings
export const CACHE_TTL_MS = 1000 * 60 * 5;   // 5 minút
export const MAX_CACHE_SIZE = 100;

// Image settings
export const IMAGE_CACHE_SIZE = 50;
export const IMAGE_PRELOAD_DELAY = 100;

// Analytics
export const ANALYTICS_BATCH_SIZE = 10;
export const ANALYTICS_FLUSH_INTERVAL = 30000; // 30 sekúnd
```

### Hero farby (z `lib/core/utils.ts`)

```typescript
// Crystal: primary #00BCD4 (Cyan), secondary #2196F3 (Blue)
// Druid:   primary #4CAF50 (Green), secondary #795548 (Brown)
// Toxic:   primary #e0b815 (Yellow), secondary #8BC34A (Light Green)
```

---

## 📊 Zhrnutie

| Kategória        | Počet položiek |
|------------------|----------------|
| Hrdinovia        | 3 (crystal, druid, toxic) |
| Karty Crystal    | 21 |
| Karty Druid      | 22 |
| Karty Toxic      | 22 |
| **Total kariet** | **65** |
| Combos Crystal   | 21 |
| Combos Druid     | 22 |
| Combos Toxic     | 22 |
| Osobnosti        | 6 |
| Role             | 5 |
| Atribúty         | 4 (attack, defense, explorer, gatherer) |
| Typy terénu      | 5 (base, resources, altar, wasteland, border) |
| Jazyky           | 2 (CS, SK) |

## 🔗 Mapovanie súborov

Ak chceš kamarátovi poslať originálne súbory (namiesto tohto markdownu):

```
lib/core/types.ts                        — Card, Hero, enumy
lib/core/constants.ts                    — Global konštanty
lib/core/world-types.ts                  — TribeInfo, MapRegionInfo
lib/core/utils.ts                        — getHeroColors
lib/data/base/types.ts                   — CardBase, HeroBase
lib/data/base/crystalBase.ts             — Crystal karty
lib/data/base/druidBase.ts               — Druid karty
lib/data/base/toxicBase.ts               — Toxic karty
lib/data/combos/types.ts                 — ComboCard, HeroComboStats
lib/data/combos/crystalCombos.ts         — Crystal combos
lib/data/combos/druidCombos.ts           — Druid combos
lib/data/combos/toxicCombos.ts           — Toxic combos
lib/data/localized/index.ts              — Assembly base + translations
lib/translations/cs/cards.json           — CS preklady kariet
lib/translations/cs/heroes.json          — CS preklady hrdinov
lib/translations/sk/cards.json           — SK preklady kariet
lib/translations/sk/heroes.json          — SK preklady hrdinov
lib/types/game.ts                        — World, Match, Tile, Tribe, MatchPlayer
lib/types/game-state.ts                  — ExtendedTileData, TileRecord
lib/types/personality.ts                 — PersonalityType, PlayerCharacter, combat
lib/heroes-world/hex-grid.ts             — HexCoordinate, HexGrid, TerrainType
lib/heroes-world/tribes.ts               — Tribe triedy (ResourceType, TribeStats)
lib/heroes-world/roles.ts                — Role triedy (Player, RoleAction)
```