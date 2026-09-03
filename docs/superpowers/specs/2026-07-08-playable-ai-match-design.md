# Design: Hrateľný zápas proti AI (základ)

Dátum: 2026-07-08 · Stav: schválené používateľom

## Problém

Hra je dnes nehrateľná v oboch režimoch (AI aj PvP):

1. **Identita hráčov**: `join_ai_match` a PvP matchmaking ukladajú do `engine.playerIds`
   socket ID, ale `playCard`/`move_character` porovnávajú `activePlayerId` s ID hrdinu
   (`thread_king_ai`/`thread_hacker_root`). Každá karta aj pohyb sa potichu zahodí.
2. **Klient nevie, kto je na ťahu**: `SovereignEngine.getState()` neposiela `activePlayerId`
   na vrchnej úrovni, klient (`App.jsx`, `ArenaUIOverlay.jsx`) ho tam očakáva.
3. **`engine.activePlayerId` sa nikdy neaktualizuje** po `startGame()` — `TurnStateMachine`
   si vedie vlastný, engine ho nesleduje.
4. **AI hrdina neexistuje**: `sovereign_ai` je fiktívne ID bez akejkoľvek logiky ťahov.
5. Drobnosti: TelemetryDashboard volá port 3000 (server beží na 3001); modálne panely
   (obchod, dashboard) pretekajú mimo viewport bez skrolovania; pád `baseTint.clone`
   (opravený skôr — `HexagonNode3D.jsx:588`).

## Riešenie

### 1. Identita hráčov (server.ts, SovereignEngine.ts)
- `join_ai_match`: `playerIds.push(chosenHero)` a `playerIds.push(aiHero)` (reálne thread ID).
- PvP: `push('thread_king_ai')` / `push('thread_hacker_root')` namiesto socket ID.
- Default sandbox: `addPlayer(<thread id z socketToThread>)`.
- `SovereignEngine.activePlayerId` sa zmení na getter delegujúci na
  `turnStateMachine.activePlayerId` (fallback `playerIds[0]`), takže všetky existujúce
  čítania zostanú správne počas celej hry.
- `getState()` doplní top-level `activePlayerId`.

### 2. AI protivník (nový súbor packages/server/src/models/AIOpponentDirector.ts)
Stavový driver volaný z existujúceho 1 s intervalu AI zápasu; max. 1 akcia za tik
(prirodzené tempo). Rozhodovanie vo fáze ACTION, keď je AI na ťahu:

1. Ak je súper v dosahu útoku a AI má útočnú kartu (damage > 0, nie HELPER)
   a nie je odzbrojená → zahraj ju (rovnaký tok ako `playCard`: buffer → discard,
   `ActionNode`, `registerAction`). Max. 1 útok za ťah.
2. Inak, ak ešte nevyužila voľný pohyb a nie je zakorenená → posuň sa o 1 metapozíciu
   smerom k súperovi (voľný, priechodný hex; rešpektuje obsadenosť; spúšťa
   trap/opportunity check ako `move_character`).
3. Inak → `endTurn()`.

Vo fáze INTERRUPT_WINDOW, keď má AI reagovať na hráčov útok → `pass()` (základná AI
nereaguje, nech hra odsýpa). Guard na `engine.state === 'GAME_OVER'` → nič.

Server po každej AI akcii emitne `state_resolved`. `end_turn` od hráča sa ignoruje,
keď je na ťahu AI (inak by hráč preskočil AI ťah).

### 3. Klientske opravy
- `TelemetryDashboard.jsx`: port 3000 → 3001.
- Panely obchodu a dashboardov: `max-h-[85vh] overflow-y-auto`.

## Testy a verifikácia
- Test skript v štýle repa (`packages/server/src/testAIDirector.ts`, spúšťaný ts-node):
  AI zaútočí keď je v dosahu, pohne sa keď nie je, ukončí ťah, pasuje v interrupt okne.
- E2E: Playwright — odohrať kolo proti AI (karta, pohyb, koniec ťahu, AI viditeľne koná),
  HUD ukazuje HP oboch hráčov.

## Mimo rozsahu
Reakčné karty AI, hranie jednotiek/pascí AI, Druid/Void frakcie, PvP UX.
