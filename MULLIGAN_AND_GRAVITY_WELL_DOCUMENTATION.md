# DOKUMENTÁCIA NOVÝCH FUNKCIÍ: VERZIA 1.000

Tento dokument sumarizuje implementáciu a technické detaily dvoch nových fáz a subsystémov integrovaných do hry **Poslední kmen / Sovereign Engine**.

---

## 1. TACTICAL GRAVITY WELL OVERDRIVE (Sub-space Reality Modifier)

Frakčný a priestorový modifikátor reality, ktorý simuluje gravitačné distortion efekty v Aréne.

### A. Pravidlá a Matematické prepočty (`SpatialGuidanceSystem.ts`)
*   **Vzorec pre výpočet energie (Watt - W)**:
    *   Ak sa Hrdina pohybuje **smerom do stredu** `(0,0,0)`, spotreba energie sa znižuje o **50%**.
    *   Ak sa Hrdina pohybuje **smerom von** (únik z gravitačnej studne), spotreba energie sa **násobí koeficientom $2.5 \times \text{friction}$**.
*   **Implementované v**: `SpatialGuidanceSystem.calculateGravityWellCost(...)`

### B. Vertex-Shader Deformácie (`HexagonNode3D.jsx`)
*   Dynamická deformácia mriežky na základe vzdialenosti k stredu. Vertikálne pozície (`transformed.z` pre rotovaný mesh) klesajú nadol na základe `smoothstep` krivky.
*   Riadené uniformnou premennou `uGravityPulse` priradenou v `useFrame` vykresľovacej slučke.
*   **Edgeline Glow**: Hrany hexagónov sa rozsvietia na fialovo/neon-purple (`#8a2be2`) pre trasy s amplifikovanou cenou pohybu.

### C. HUD Indikácia (`ArenaUIOverlay.jsx`)
*   Pridaný prepínač **Gravitačnej studne** v ovládacom paneli.
*   Aplikuje sa varovný tooltip v slovenčine, ak únikový pohyb prekročí limit 60 W:
    `"UPOZORNENIE: Únikový manéver vyžaduje kritické množstvo energie!"`

---

## 2. MULLIGAN PHASE SETUP (Počiatočná Výmena Kariet)

Strategická úvodná fáza umožňujúca výmenu nežiaducich kariet z ruky na začiatku každého zápasu.

### A. Herná Slučka a Prechody Fáz (`TurnStateMachine.ts`)
*   Pridaná fáza `'MULLIGAN'` do `TurnPhase` stavov.
*   Hra začína v stave `MULLIGAN` namiesto priameho štartu ťahu.
*   **executeMulligan**: Vrátené karty sú uložené na spodok balíčka, balíček je zamiešaný a hráč si doberie náhradné karty späť do limitu 4 kariet.
*   Akonáhle všetci pripojení hráči potvrdia Mulligan, stav hry prejde do `'PLAYER_TURN'` a aktívny ťah začína fázou `ACTION`.

### B. REST Rozhranie (`server.ts` & `SovereignEngine.ts`)
*   Pridaná trasa `POST /api/match/mulligan` pre zaslanie vymenených kariet.
*   Vysiela aktualizácie prostredníctvom socketového eventu `state_resolved`.

### C. Užívateľské Rozhranie (`ArenaUIOverlay.jsx`)
*   Rendruje celoobrazovkový sklenený (glassmorphism) overlay s vizuálnym výberom 4 kariet.
*   Zobrazuje stav pripravenosti oponenta v reálnom čase.

---

## 3. VALIDAČNÉ TESTY (`testEngine.ts`)

*   **Test 69**: Overuje správnosť matematických úľav a postihov v Gravitačnej studni.
*   **Test 70**: Simuluje prechod do Mulligan fázy, výmenu dvoch kariet pre Hráča A, výmenu jednej karty pre Hráča B a následný úspešný prechod do 1. herného ťahu.
*   *Stav testov*: **100% zelené (70 z 70 testov úspešných)**.
