# Šablóna pre tvorbu nového kmeňa (Tribe Blueprint Template)

Táto šablóna charakterizuje celkovú štruktúru hry **Poslední kmen** (Dušan Game) a definuje záväznú štruktúru pre návrh a implementáciu nového kmeňa (frakcie), jeho hrdinu, kariet, prekladov a kombinácií.

---

## 1. Pravidlá a limity pre nový kmeň

Každý navrhnutý kmeň musí rešpektovať nasledujúce limity pre zachovanie hernej rovnováhy (balansu) a kompatibility so **Sovereign Engine V2**:

*   **Počet kariet v balíčku:** Presne **42 kariet**.
*   **Hrdina:** Frakcia musí obsahovať presne 1 Hrdinu s 1 pasívnou schopnosťou a 1 špeciálnou schopnosťou.
*   **Distribúcia kariet v balíčku:**
    *   **Útočné (Červené):** Odporúčaný počet **12 až 15 kariet** (vrátane útočných jednotiek).
    *   **Kouzelné (Modré):** Odporúčaný počet **10 až 14 kariet** (vrátane obranných bariér a kúziel).
    *   **Pohybové (Žluté):** Odporúčaný počet **8 až 10 kariet** (manévrovanie a úhyby).
    *   **Doplňkové (Černé):** Presne **4 až 6 kariet** (čierne vylepšenia).
*   **Jednotky (Pomocníci):** Balíček musí obsahovať aspoň 3 rôzne typy pomocníkov (Past, Věž, Bomba alebo Strážce).

---

## 2. Dokumentačná šablóna nového kmeňa (Markdown Blueprint)

Pri navrhovaní nového kmeňa na papieri/v dokumentácii použite nasledovný formát:

```markdown
# KMEŇ: [Názov Kmeňa]

> [Krátky popis herného štýlu, napr. "Defenzívna frakcia zameraná na pasce a kontrolu"]

*   **Farba frakcie (Tailwind CSS):** bg-hero-[id-kmena] (napr. bg-[#00ff00])
*   **Hlavná mechanika:** [Napr. "Manipulácia s tlakom potrubia / spomaľovanie"]

---

## Hrdina: [Meno Hrdinu]
*   **Titul:** [Napr. "Pán bleskov"]
*   **Pasívna schopnosť:** [Detailný popis pasívneho efektu]
*   **Špeciálna schopnosť:** [Popis aktívnej schopnosti]

---

## Zoznam kariet (Celkovo 42 kariet)

### 1. [Názov Karty 1] (Počet: X)
*   **Typ:** Útočná / Kouzelná / Pohybová / Doplňková
*   **Vlastnosti:** [Napr. Plošná, Jednotka, Úhyb]
*   **Herný efekt:** [Napr. "Spôsobí 2 poškodenia a spomalí cieľ"]
*   **Fyzikálne parametre (pre výpočtový engine):**
    *   Napätie (Voltage): [0-6]
    *   Odpor (Resistance): [0-4]
    *   Sémantická erózia (Damage): [0-3]

... [Opakovať pre všetkých 21-22 unikátnych kariet]
```

---

## 3. TypeScript šablóna pre kód (`packages/shared/src/data/base/`)

Vytvorte nový súbor `[idKmena]Base.ts` na definovanie dátovej štruktúry v zdieľanom balíčku.

*   **Názov súboru:** `/packages/shared/src/data/base/customTribeBase.ts`

```typescript
import type { HeroBase, CardBase } from "./types";

// 1. Definícia základných atribútov Hrdinu
export const CUSTOM_HERO_BASE: HeroBase = {
    id: "toxic", // Nahradiť vaším unikátnym HeroId ("crystal" | "druid" | "toxic" | "custom")
    icon: "🧪",
    color: "bg-hero-custom",
    imageExtension: "webp",
    imagePath: "/images/heroes/customHero.webp",
    iconPath: "/images/heroes/customEmblem.jpg",
};

// 2. Definícia balíčka kariet (súčet "count" musí byť presne 42)
export const CUSTOM_CARDS_BASE: CardBase[] = [
    { 
      id: "custom_attack_card", 
      heroId: "toxic", 
      count: 4, 
      specifications: ["attack"], 
      isUltimate: false, 
      isUnit: false, 
      cardCategorization: "attack", 
      cardTypes: [] 
    },
    { 
      id: "custom_magic_unit", 
      heroId: "toxic", 
      count: 2, 
      specifications: ["unit", "block"], 
      isUltimate: false, 
      isUnit: true, 
      cardCategorization: "magic", 
      cardTypes: ["plant"], 
      unitType: "tower" 
    },
    { 
      id: "custom_ultimate_spell", 
      heroId: "toxic", 
      count: 1, 
      specifications: ["aoe", "rangeMagic"], 
      isUltimate: true, 
      isUnit: false, 
      cardCategorization: "magic", 
      effect: "slow",
      cardTypes: [] 
    },
    // ... Doplňte ďalšie karty, aby celkový súčet count bol 42
];
```

---

## 4. Šablóna prekladov JSON (`packages/shared/src/translations/`)

Nový kmeň vyžaduje preklady kariet a hrdinov v českom (`cs`) aj slovenskom (`sk`) jazyku.

### A. Preklady Hrdinu (`heroes.json`)
Pridajte pod príslušný kľúč hrdinu do súborov:
*   `/packages/shared/src/translations/sk/heroes.json`
*   `/packages/shared/src/translations/cs/heroes.json`

```json
{
  "custom_tribe_id": {
    "name": "Názov Kmeňa",
    "description": "Základná charakteristika kmeňa a herného štýlu.",
    "title": "Titul Hrdinu",
    "specialAbility": "Názov a popis špeciálnej aktívnej schopnosti.",
    "passiveAbility": "Názov a popis pasívnej schopnosti.",
    "playstyle": ["štýl1", "štýl2"]
  }
}
```

### B. Preklady Kariet (`cards.json`)
Pridajte pod príslušný kľúč kariet do súborov:
*   `/packages/shared/src/translations/sk/cards.json`
*   `/packages/shared/src/translations/cs/cards.json`

```json
{
  "custom_tribe_id": {
    "custom_attack_card": { 
      "name": "Názov útočnej karty", 
      "description": "Text, ktorý sa zobrazí na karte v spodnom HUD (napr. spôsobí 2 poškodenia)." 
    },
    "custom_magic_unit": { 
      "name": "Názov jednotky", 
      "description": "Popis akcie stacionárneho pomocníka (napr. blokuje útoky)." 
    }
  }
}
```

---

## 5. Šablóna pre vyhodnotenie Ohmovho zákona (Kompilačné limity)

Pri tvorbe inštrukcií sa uistite, že vaše karty rešpektujú limity napätia ($V$) a odporu ($R$) pre stabilné spracovanie prúdu ($I$):

| Typ akcie | Rozsah Voltage ($V$) | Rozsah Resistance ($R$) | Rozsah Sémantickej erózie (Damage) |
| :--- | :--- | :--- | :--- |
| Štandardný útok | 3 | 0 | 2 |
| Ultimate útok | 5 - 6 | 0 | 3 |
| Štandardné kúzlo | 1 - 2 | 1 - 2 | 1 |
| Ultimate kúzlo | 3 - 4 | 2 - 3 | 2 |
| Defenzívny blok | 0 | 4 - 6 | 0 |
