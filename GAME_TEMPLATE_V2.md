# Šablóna pre tvorbu kmeňa V2 (Tribe Blueprint Template V2.0)

Táto šablóna charakterizuje celkovú rozšírenú štruktúru hry **The Last Tribe** pre verziu **2.0 (Sovereign Database & Tactical Overdrive Edition)**. Definuje schému pre návrh nových frakcií kompatibilných s prepojenou databázou SQLite a novými kinetickými/biómovými mechanikami.

---

## 1. Rozšírené parametre pre novú verziu (Sovereign V2)

Každý kmeň a hrdina vo verzii 2.0 musí rešpektovať nasledujúce parametre:

*   **Celková veľkosť balíčka:** Presne **42 akčných inštrukcií**.
*   **Perzistencia (Database Profiling):** Musí definovať štartovacie suroviny, XP a počiatočný quest pre ukladanie do SQLite databázy.
*   **Taktická biómová kompatibilita (Biome Synergy):** Každá frakcia musí mať aspoň 1 hrdinskú pasívnu schopnosť naviazanú na konkrétny bióm (`LUSH_FOREST`, `TOXIC_SWAMP` alebo `GLACIER`).
*   **Kinetická integrácia (Kinetic Push/Pull):** Aspoň 2 karty v balíčku musia disponovať kinetickými vlastnosťami (vytesnenie nepriateľa).

---

## 2. Dátový model pre databázu (SQLite DDL & JSON Schema)

Keď vytvárate nového hrdinu/hráča, databáza vyžaduje nasledujúcu štruktúru ukladania dát do profilu:

```json
{
  "username": "AliasHráča",
  "level": 1,
  "xp": 0,
  "maxHealth": 15,
  "armor": 1,
  "luck": 0.5,
  "materials": {
    "CrystalShard": 5,
    "Spores": 0,
    "VoidDust": 0
  },
  "quests": [
    {
      "id": "quest_prieskum",
      "title": "Prieskum Biómu",
      "description": "Presuňte sa na políčko Toxic Swamp",
      "type": "REACH_BIOME",
      "targetValue": 1,
      "progress": 0,
      "completed": false,
      "xpReward": 50,
      "materialReward": {
        "type": "Spores",
        "amount": 3
      }
    }
  ]
}
```

---

## 3. TypeScript šablóna pre V2 karty (`packages/shared/src/data/base/`)

Vo verzii 2.0 boli pridané nové atribúty:
*   `biomeSynergy?: { biome: string; bonusDamage?: number; bonusHeal?: number; bonusStatus?: string }`
*   `displacement?: { type: 'push' | 'pull'; range: number }`
*   `ohmicOverdriveCost?: number` (Ohmická spotreba energie pre preťaženie)

```typescript
import type { HeroBase, CardBase } from "./types";

export const MY_TRIBE_HERO: HeroBase = {
    id: "void_stalker", 
    icon: "🌌",
    color: "bg-hero-void",
    imageExtension: "webp",
    imagePath: "/images/heroes/voidStalker.webp",
};

export const MY_TRIBE_CARDS: CardBase[] = [
    // 1. Karta s Biómovou Synergiou (Swamp Buff)
    { 
      id: "void_toxic_strike", 
      heroId: "void_stalker", 
      count: 4, 
      specifications: ["attack"], 
      isUltimate: false, 
      isUnit: false, 
      cardCategorization: "attack", 
      cardTypes: [],
      biomeSynergy: {
          biome: "TOXIC_SWAMP",
          bonusDamage: 1,
          bonusStatus: "slow"
      }
    },
    // 2. Karta s Kinetickým Vytesnením (Push)
    { 
      id: "void_shockwave", 
      heroId: "void_stalker", 
      count: 3, 
      specifications: ["movement", "aoe"], 
      isUltimate: false, 
      isUnit: false, 
      cardCategorization: "movement", 
      cardTypes: [],
      displacement: {
          type: "push",
          range: 1
      }
    },
    // 3. Karta s Ohmickým Preťažením (Overdrive)
    { 
      id: "void_singularity", 
      heroId: "void_stalker", 
      count: 1, 
      specifications: ["aoe", "rangeMagic"], 
      isUltimate: true, 
      isUnit: false, 
      cardCategorization: "magic", 
      effect: "root",
      cardTypes: [],
      ohmicOverdriveCost: 20 // Spotrebuje 20% systémovej energie pre posilnený účinok
    }
];
```

---

## 4. Taktický sprievodca pre návrhárov (Game Design Checklist)

Pri navrhovaní nového balíčka zvážte:
1.  **Má môj kmeň spôsob, ako vyliečiť negatívne stavy?** Rešpektujte knihy pravidiel: pohyby liečia `slowed`, útoky liečia `rooted`/`disarmed` a kúzla liečia `silenced`.
2.  **Využíva hrdina kinetiku na hazard diely?** Skombinujte karty s odtláčaním (`push`) s dielmi Toxic Swamp na ploche.
3.  **Je kmeň vyvážený na napätie a odpor (Ohmov zákon)?**
    *   $V$ (Voltage) určuje útočnú silu (Damage).
    *   $R$ (Resistance) určuje obranné vlastnosti (Bariéry a Armor).
    *   $I$ (Current) je výsledný prúd, ktorý by mal byť ideálne okolo $\geq 1.0$ pre zásadné taktické zvraty.
