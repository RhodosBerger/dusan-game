# 📊 Report: Kombinatorická Analýza Gameplay Synergií

Vygenerované dňa: 7/5/2026, 9:40:37 AM
Tento report demonštruje, ako sa herné kombinácie (skúsenosti z gameplayu) spájajú s kombinatorickými možnosťami matematického enginu a Ohmovho zákona.

## 1. Zoznam registrovaných šablón kombinácií (SQLite DB)

Nasledujúce kombinácie boli úspešne prečítané z perzistentnej databázy:

| Názov Kombinácie | Požadované Karty | Základná Úspešnosť | Ohmic Power Rating |
|:---|:---|:---|:---|
| **Aetheric Current Burst** | `charge, voltage_surge` | 95% | 15 W |
| **Earthen Wall Shield** | `grow, shield` | 90% | 10 W |
| **Glacial Drift Freeze** | `nature, shield` | 85% | 12 W |
| **Pyroclastic Rift** | `nature, voltage_surge` | 80% | 18 W |

## 2. Simulácia Gameplay Priebehu s vplyvom Skúseností (Hero Level)

Ukážeme si prepočet poškodenia pre kombináciu **Aetheric Current Burst** (`voltage_surge, charge`) pri rôznych leveloch hrdinu.
Základná sila kombinácie je upravená o level a exponenciálny útlm kombinatorického koeficientu.

### Detegovaná synergia: **Aetheric Current Burst**!
*   Základný power rating: `15 W`
*   Efekty šablóny: `{"damageBonus":4,"systemEnergyDelta":12,"status":"slowed","animation":"lightning_strike"}`

| Level Hrdinu (XP) | Multiplikátor Levelu | Zníženie poškodenia (Armor = 2) | Finálne Poškodenie Kombinácie |
|:---|:---|:---|:---|
| **Level 1** | 100% | 35.0% | **3 DMG** |
| **Level 3** | 120% | 35.0% | **3 DMG** |
| **Level 5** | 140% | 35.0% | **4 DMG** |

## 3. Výpočet Neznámych Parametrov pomocou Trojčlenky (Rule of Three Solver)

Pri komplexnej analýze potrebujeme vypočítať neznáme premenné. Používame Ohmov zákon a priamu úmeru:

*   **Prípad A (Ohmov zákon):** Máme Napätie $V = 12\text{ V}$, Prúd $I = 3\text{ A}$. Chýba nám Odpor $R$.
    *   Výsledok riešenia: Odpor $R = \mathbf{4\ \Omega}$

*   **Prípad B (Spätná inferencia):** Chceme dosiahnuť cieľové poškodenie `6 DMG` s kartou `crystal_laser` (základné poškodenie `4 DMG`).
    *   Systém spätne dopočítal potrebný level hrdinu pomocou tenzora: **Level 11**

## 4. Analýza Loot Drop Pravdepodobnosti podľa Sigmoid modelu

Počas gameplayu sa pravdepodobnosť získania lepšieho obsahu dynamicky prispôsobuje stavu entropie arény a šťastia hráča:

| Globálna Entropia arény | Hráčovo Šťastie (Luck) | Obtiažnosť biómu | Pravdepodobnosť vzácneho Dropu |
|:---|:---|:---|:---|
| 10% | 0.2 | 1.5 | **24.0%** |
| 50% | 0.5 | 1.0 | **56.2%** |
| 90% | 0.8 | 0.5 | **83.9%** |
