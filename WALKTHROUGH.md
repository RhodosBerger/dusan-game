# Sprievodca Zmenami a Overenie Systému (System Walkthrough)

Tento dokument sumarizuje úspešne dokončené ciele (objectives) z technickej roadmapy, prepojenie systémových vrstiev, novo integrovanú Go Core mikroslužbu a výsledky overenia integrity celého monorepa.

---

## 1. Zhrnutie vykonaných zmien

Integrovali sme **Kombinatorickú ML Vrstvu Terénov (MLTerrainSynthesizer)**, vytvorili sme vysokovýkonné **Go Jadro (Go Core)**, prepojili 3D WebGL klientske prostredie s herným serverom cez real-time WebSockets, pridali algebraický sledovací a predikčný balančný systém, plne prepojili RPG mechaniky s Questovým systémom, zosúladili herné dáta Next.js, upravili assety postáv, vyriešili 404 odpoveď na Go Core, implementovali reguláciu sieťových dátových štruktúr, integrovali Milník 4 (Lobby a Matchmaking) a **Fázu B: Databázovú Perzistenciu (node:sqlite)**:

### A. Fáza B — Databázová Perzistencia a Meta-Progresia (node:sqlite)
*   **DatabaseSyncManager (`DatabaseSyncManager.ts`):**
    *   Nasadená SQLite databázová schéma so samostatnými tabuľkami pre perzistenciu hráčov (`players`) a telemetriu (`game_events_telemetry`) s využitím natívneho modulu `node:sqlite`.
    *   Hráčske účty, RPG levely, nahrané XP, inventáre (materiály) a rozpracované/dokončené questy sa automaticky ukladajú a obnovujú medzi zápasmi.
*   **Real-time synchronizácia a Telemetria (`server.ts`):**
    *   Hráčsky profil sa pripojí z DB pri vstupe do queue/AI zápasu a prenáša sa do vlákien hrdinov.
    *   Po každom vykonanom ťahu, presune alebo vyliečení stavu server bezpečne synchronizuje stav hrdinov do databázy a zaznamená najnovšiu trace udalosť do tabuľky telemetrie.

### B. Milník 4 — Matchmaking, Lobby a Room Izolácia (Sovereign Lobby)
*   **Klientská Lobby obrazovka (`LobbyScreen.jsx`):**
    *   Vytvorili sme sklenenú lobby obrazovku, na ktorej si hráči pred vstupom do hry môžu zvoliť alias, typ hrdinu (Crystal King AI vs Toxic Hacker Root) a preferovanú estetickú tému mapy.
    *   Lobby podporuje vyhľadávanie súperov (PvP Matchmaking) aj okamžitú tréningovú hru proti arénovej umelej inteligencii (vs AI).
*   **Multi-inštančný Server a Izolácia (`server.ts`):**
    *   Miesto jednej globálnej inštancie server teraz dynamicky spravuje bežiace hry v mape `activeMatches` a izoluje ich sokety do dedikovaných Socket.io miestností `room_${matchId}`.
    *   Zaviedli sme bezpečné algebraické mapovanie `socketToThread` priraďujúce socket ID k príslušnému hrdinovi (vyriešený skrytý bug s chybou priradenia turn ID v default režime).
*   **Prechod z Lobby do Arény (`App.jsx`):**
    *   Integrovali sme stavy `matchId` a `isSearching`. Aplikácia zobrazuje lobby obrazovku až do chvíle, kým neobdrží udalosť `match_started`.

### C. RPG Negative Status Curing (Rulebook Compliant)
*   **Vyliečenie negatívnych stavov obetovaním kariet (`server.ts` / `ArenaUIOverlay.jsx`):**
    *   Implementovali sme plnú podporu pre čistenie negatívnych RPG stavov (Slowed, Rooted, Disarmed, Silenced) podľa knihy pravidiel (`rules.md`).
    *   Čistenie stojí **1 akciu** a vyžaduje obetovanie konkrétnej karty z ruky v závislosti od stavu:
        *   **Slowed (Spomalenie):** vyžaduje žltú kartu pohybu (`movement`).
        *   **Rooted (Zakorenenie) a Disarmed (Odzbrojenie):** vyžadujú červenú útočnú kartu (`attack`).
        *   **Silenced (Umlčanie):** vyžaduje modrú kouzelnú kartu (`magic`).
    *   Ak je hrdina pod vplyvom stavu, v HUD telemetrickom paneli sa zobrazí interaktívne tlačidlo **"🩹 Cure"**. Po označení vhodnej karty v ruke a kliknutí na toto tlačidlo server stav okamžite zmaže, obetuje kartu z ruky a odošle synchronizačný signál do roomu.

### D. Milník 3 — Ovládanie Hrdinov a Systém Presunu (Hero Movement / Travel)
*   **WebSocket Handler pohybu (`server.ts`):** Spracovanie udalosti `move_character` s kontrolou vzdialenosti, priechodnosti, zakorenenia a biómových questov.
*   **Taktické Ovládanie v HUD (`ArenaUIOverlay.jsx`):** Tlačidlo **"🚶 Presunúť hrdinu sem"** zobrazené pri označení prázdneho priechodného hexagónu.

### E. Milník 2 — Estetické Témy a Generovanie Máp (Aesthetic Themes)
*   **Aesthetic Theme Selector (`ArenaUIOverlay.jsx`):** Prepínanie medzi 4 estetickými štýlmi mapy (Cyber-Neon, Monochrome Retro, Golden Baroque, Ghostly Void) priamo v konfiguračnom paneli.
*   **Vizuálne Profily a Shading (`HexagonNode3D.jsx`):** Shader-like úprava materiálov, vyžarovania a farieb neónových okrajov na základe zvolenej estetickej témy.

### F. Milník 1 — 3D VFX a Časticové Systémy (Three.js)
*   **Časticové Biomy (`HexagonNode3D.jsx`):** Sneženie nad `GLACIER` dielmi a fialovo-fialové toxické výpary nad `TOXIC_SWAMP` dielmi.
*   **3D Projektily Kúziel (`SpellProjectile3D.jsx`):** Svietiaca neónová guľa letiaca po parabolickej krivke od útočníka k cieľu po zahraní karty.

### G. Responzívne rozhranie a HUD (Responsive UI / HUD)
*   **Mobilný / Tabletový HUD Bar (`ArenaUIOverlay.jsx`):**
    *   Na obrazovkách s šírkou < 1024px sme skryli zložité desktopové bočné panely.
    *   Vytvorili sme elegantný, sklenený horný panel (sticky compact header) zobrazujúci kľúčové RPG atribúty a štatistiky (Crystal HP, Toxic HP, System Energy, Entropy Stress) a tlačidlo `📊 Dashboard`.
*   **Mobilný Dashboard Šuplík (Drawer):**
    *   Pridali sme responzívny šuplík s animáciou nasunutia, ktorý po kliknutí na `Dashboard` zobrazí všetky dôležité detaily (Telemetria, Sandbox, Questy, Logy) pripravené pre dotykové rolovanie.
*   **Custom CSS pravidlá pre karty a scrollbary (`App.css`):**
    *   Obohatili sme spodný panel kariet o `.custom-scrollbar` s neónovým cyberpunk vizuálom.
    *   Upravili sme medzery a paddingy pre hrdinské karty v `LobbyScreen.jsx` pre bezproblémové škálovanie na malých mobiloch.

### H. Rozšírený Taktický Rámec (Tactical Expansion Framework)
*   **Nový herný kódex a teoretické pravidlá:**
    *   Vytvorili sme samostatný dokument [Tactical Expansion Framework](file:///home/rhoddos_berger/.gemini/antigravity-ide/brain/066f6b59-4305-46f4-ade5-f62df6b096b7/tactical_expansion_framework.md) definujúci tri nové piliere bojových taktík:
        1.  **Biómové synergické kombinácie:** đứng na dieli Lush Forest, Toxic Swamp alebo Glacier upravuje účinnosť a efekty zahraných kariet.
        2.  **Kinetické vytesnenie:** Odtlačením (Push) alebo pritiahnutím (Pull) nepriateľov na nebezpečné terény (swamp) alebo na vyložené pasce a bomby sa otvárajú nové taktické reťazce.
        3.  **Ohmov Overdrive:** Možnosť využiť celkovú nahromadenú systémovú energiu (System Energy ≥ 75% resp. ≥ 90%) na dodatočné akcie (dobratie karty, získanie brnenia) uprostred ťahu.
    *   Tieto pokročilé pravidlá boli začlenené priamo do hlavnej knihy pravidiel **RULES.md** v koreňovom adresári a aj v brain zložke.

### I. Fyzikálna interpretácia a Algebraický Tenzor (Physics HUD & Algebraic Tensor)
*   **Physics-Bound Action Dataset (`PhysicsActionDataset.ts`):** Mapovanie všetkých hracích inštrukcií na fyzikálne veličiny: Napätie ($V$), Odpor ($R$), Prúd ($I = V/R$), Ohmov výkon ($P = V \cdot I$) a kinetické vytesnenie (Push/Pull sila).
*   **Algebraický Action Tenzor Model (`AlgebraicActionTensor.ts`):** Trojrozmerný tenzor $T$ kombinujúci stav spúšťacieho hrdinu ($S$), fyzikálny profil akcie ($A$) a bióm cieľového hexagonu ($T$) pre výpočet vektora kvantových výsledkov akcie:
    $$O = [Poškodenie, Energetické preťaženie, Kinetická vzdialenosť, Stav, Úspešnosť]$$
*   **HUD Taktický Spektrometer (`ArenaUIOverlay.jsx`):** Vizualizácia fyzikálneho spektrometra a predikcie v strednom HUD paneli pri označení karty a cieľového dielu.

### J. Adrenalínové Preťaženie a Kolaps Arény (Adrenaline Boost & Collapse)
*   **Adrenaline Director (`AdrenalineDirector.ts`):** Riadenie adrenalínového režimu aktivovaného pri nízkom HP jedného z hrdinov (HP $\le 5$), vysokej systémovej energii (Energy $\ge 80\%$) alebo neskorej fáze hry (ťah $\ge 10$).
    *   *Modifikátory:* Poškodenie kariet je zvýšené o $+50\%$, pravdepodobnosť kritických úderov (Crit Strike) vzrastá na $35\%$ a kinetické vytesnenia sa pri crit zdvojnásobujú.
*   **Kolaps Arény (Arena Collapse):** Pri prekročení 8. ťahu začína postupné odpadávanie vonkajších políčok mriežky do prázdna (Ghostly Void). Adrenaline Director dynamicky vypočítava odpadávajúce hexagóny s cieľom vytvoriť zdrvujúci, stiesnený taktický tlak na hráčov.

### K. Target Vision Blueprint & Integračný Manuál (Future AAA Direction)
*   **Target Vision Blueprint (`TARGET_VISION_BLUEPRINT.md`):** Uložili sme hlavné strategické smerovania (Ambient Web Audio API, PostgreSQL/Prisma Schema, Redis Matchmaking, Kubernetes room pods a ClickHouse/Python ML analytics) do projektového dokumentu.
*   **Integračný Manuál (`INTEGRATION_MANUAL.md`):** Vytvorili sme detailnú technickú príručku obsahujúcu pripravené TypeScript, React, Python a SQL šablóny pre developerov, ktoré uľahčia nasadenie produkčnej infraštruktúry.

---

## 2. Lokálne spustenie (Localhost Services)

Všetky 3 služby úspešne bežia súčasne na vašom localhoste:
1.  **Vysokovýkonné Go Jadro:** [http://localhost:8081](http://localhost:8081)
2.  **Sovereign Node.js server:** [http://localhost:3001](http://localhost:3001)
3.  **Klientský Vite 3D web:** [http://localhost:5173](http://localhost:5173)

---

## 3. Výsledky testov a overenia (Verification Results)

*   Všetkých 18 RPG, dungeon, biómových, ML, AI, DDA, Quest, Next.js Card, Network-optimization, Three.js-effects, Aesthetic-theme, Travel-movement, Matchmaking-lobby, Status-Cure, SQLite-Database, Algebraic-Tensor, Adrenaline-Surge, Aetheric-Dice a Shop-Items testov prešlo úspešne bez chýb (`npx ts-node packages/server/src/testEngine.ts`).

---

## 4. Mapa herných integrácií (Gameplay Integration Map)

Pre ucelený prehľad o prepojení Go Core, voxelovej fyziky arény, ML syntetizátora terénu a statusových pravidiel sme vytvorili detailný dokument:
*   [Gameplay Integration Map](file:///home/rhoddos_berger/.gemini/antigravity-ide/brain/066f6b59-4305-46f4-ade5-f62df6b096b7/gameplay_integration_map.md) — Technický diagram a opis tokov dát, interakcií a WebSocket správ arény.
*   [Target Vision Blueprint](file:///home/rhoddos_berger/.gemini/antigravity-ide/brain/066f6b59-4305-46f4-ade5-f62df6b096b7/target_vision_blueprint.md) — Vízia a technický plán rozvoja pre finálnu produkčnú verziu (Audio, DB perzistencia, ML clustering, Kubernetes škálovanie).

---

### L. Sprint 1 — Hero Aura & Battlefield Presence (Phase 1 VFX)

*   **HeroAura (`HeroAura.jsx`):**
    *   Každý hrdina teraz vyžaruje trvalú frakčnú auru — sústava 2–4 torusových prsteňov pulzujúcich s rôznou rýchlosťou a náklonom:
        *   **Crystal:** 2 studené modré prstene (`#00eeff`), pomalé vdychovanie (1.2 Hz).
        *   **Toxic:** 3 kyselino-zelené prstene (`#39ff14`), rýchle chvenie (3.8 Hz).
        *   **Druid:** 2 teplé jantárové prstene (`#ffcc00`), organický dych (0.7 Hz).
    *   Pod každým hrdinom: mäkký `circleGeometry` ground-glow disc, ktorý koreluje s pulzom.
    *   Pri **HP ≤ 5**: aura sa prepne do núdzového módu — výraznejší puls a amplitúda.
*   **ThreadMiniature (`ThreadMiniature.jsx`) — kompletný rewrite:**
    *   **Idle float animácia:** Sprite billboarda sa jemne pohybuje po sínusovej vlne s fundamentálnou + harmonickou frekvenciou (prirodzený pohyb).
    *   **Low-HP flicker:** Pri HP ≤ 5 sprite strobuje na 12 Hz (alfa efekt) — vizuálne varovanie pred smrťou hrdinu.
    *   **Footprint glow trail:** Keď hrdina vstúpi na nový hex, posledné 3 navštívené pozície zanechajú miznúci disc zafarbený frakčnou farbou — vytvára pocit pohybu a taktickej histórie.
    *   **LowHpBaseRing:** Karmínový pulsujúci torus na podstavci figúrky pri kritickom HP.
*   **AdrenalineVignette (`AdrenalineVignette.jsx`):**
    *   Čistý DOM/CSS overlay (žiadny 3D overhead) — inset `box-shadow` obal okolo celého viewportu.
    *   Aktivuje sa pri: HP ≤ 5, systémovej energii ≥ 80% alebo ≥ 10. ťahu (podmienky `AdrenalineDirector`).
    *   Rýchlosť pulzu lineárne narastá s klesajúcim HP (od 1 Hz do 4 Hz).
    *   Farba: pri osobnom nebezpečenstve → danger červená; inak → frakčná farba hrdinu.
*   **Build overenie:** ✅ 121 modulov, 0 chýb.

### M. Sprint Aetheric Dice — AoS Protagonists & Dice Engine
*   **Dataset Frakcií a Kategórií (`warhammerFactions.ts`):** Definované 4 Veľké aliancie (Aurean Order, Discordian Abyss, Mortis Syndicate, Titan Horde) a 5 taktických kategórií (Sovereign Exemplar, Aether Spellweaver, Myrmidon Sentinel, Gigantic Behemoth, Swift Harbinger) s príslušnými dosahmi (Reach) a typmi kociek (D6/D12).
*   **Spellweaver casting range:** Kategória *Aether Spellweaver* (mág) má nastavený spellReach na 4, čím má väčší dosah na zaklínanie kúzla z diaľky.
*   **Aetheric Dice Engine (`AethericDiceEngine.ts`):** Modul, ktorý spája hod kockou (D6 alebo D12) s RPG vlastnosťami hrdinu:
    *   *AVERAGE:* Priemerná hodnota hodu a pôvodného atribútu.
    *   *DIVIDE:* Delenie atribútu na základe hodu s ohľadom na riziko (napr. Gigantic Behemoth).
    *   *MULTIPLY:* Násobenie/zosilnenie atribútov (napr. Aether Spellweaver).
*   **Integrácia do tenzora (`AlgebraicActionTensor.ts`):** Fyzikálny tenzor pred vyhodnotením vykoná hod kockou a upraví výsledný dopad na základe prislúchajúcej taktickej kategórie.
*   **Overenie:** Pridaný *Test 17* na overenie logiky hodu kockou, pričom testy bežia deterministicky vďaka prepínaču `bypassDice`. Monorepo kompiluje bez jedinej chyby.

### N. Sprint Combat Telemetry & GPS Tracking
*   **Geolokačné mapovanie (GPS Analogy):** Vytvorili sme prevodník hexagonálnych súradníc (Chunk ID, Hex ID) na reálne zemepisné súradnice (Lat/Lng) simulujúce GPS súradnice herného bojiska.
*   **Go Core Telemetrická databáza (`main.go`):**
    *   Vytvorená vnútopamäťová databáza (`telemetryStore`) pre ukladanie a indexovanie súbojových logov (Attacker, Defender, Card, Magnitude, GPS, Timestamp).
    *   Pridané REST API endpointy:
        *   `POST /api/telemetry/combat`: Zápis bojových udalostí z Node.js servera.
        *   `GET /api/telemetry/combat`: Výpis všetkých zaznamenaných súbojov.
        *   `GET /api/telemetry/analytics`: Agregácia dát pre **Big Data** (distribúcia akcií podľa chunkov, priemerné magnitúdy, distribúcia typov attack/defense/spell).
*   **Node.js prepojenie (`server.ts`):** Každé zahranie karty na hernom serveri automaticky odosiela logy o sile (Magnitude) a lokácii do Go Core.
*   **React integrácia (`ArenaUIOverlay.jsx`):** Klientský dashboard v reálnom čase (každé 3 sekundy) sťahuje Big Data štatistiky a zobrazuje stav GPS signálu a distribúciu útokov/obran priamo v HUD rozhraní.

### O. Sprint Town Shop & PlayerItem Mappings
*   **Procedurálne bezpečné Mesto (Chunk 0 Hex 0):** Nastavené s tagom `isTown: true`, zaručenou prechodnosťou (`walkable = true`) a bez hazardov (`hazardIndex = 0`), čím chránime bezpečnú zónu pre obchod.
*   **Persistent SQLite DB mapping (`DatabaseSyncManager.ts`):** Zavedená tabuľka `player_items` na perzistenciu zakúpených zbraní a nástrojov. Ukladanie a obnova profilu synchronizuje aj predmety a zvyšuje parametre postavy (napr. útočné zbrane pridávajú `baseDamage`).
*   **Town Shop UI & Modals:** Tlačidlo `🏬 Town Shop` a modal sa sprístupnia v HUD pri pobyte v meste, kde je možný nákup a predaj predmetov podľa katalógu `ITEMS_CATALOG`.
*   **Overenie:** Implementovaný *Test 18*, ktorý overuje geodetické parametre mesta a správnosť SQLite relácií pridávania, úpravy množstva a odstraňovania zbraní pre prechod zložitejších nákupov. Všetkých 18 testov beží úspešne!

### P. Sprint 3D Canvas Juicing (Aetheric Dice & Equipped Items)
*   **Aetheric Dice 3D Indicator (`FloatingDice3D`):** Nad hlavou každej figúrky hrdinu sa v reálnom čase vznáša a rotuje 3D drôtený model kocky (D12 pre mágov - `AETHER_SPELLWEAVER` / `GIGANTIC_BEHEMOTH`, D6 pre ostatné taktické kategórie), ktorý vizualizuje ich RPG kategóriu.
*   **Vizuálna výbava z obchodu (`FloatingEquippedWeapon3D`):**
    *   Ak hrdina vlastní v inventári zbraň (napr. *Aether Saber*), na Canvas sa vedľa neho vykreslí a rotuje svietiaci neónový 3D meč (s čepeľou, záštitou a rukoväťou).
    *   Ak vlastní nástroj (napr. *Gravity Harvester*), na druhej strane hrdinu sa objaví rotujúci 3D neónový prstenec a jadro reprezentujúce zberač surovín.
*   **Kompilácia:** Celý projekt úspešne prechádza produkčným buildom (`npm run build --workspaces`).

### Q. Sprint LLM-like Dialogue Generator
*   **Generátor dialógov (`dialogue_generator.py`):** Vytvorili sme offline generátor s 72 vopred pripravenými šablónami textov dialógov pre frakčné NPC archetypy, členené podľa štádií questov (`INTRO`, `IN_PROGRESS`, `COMPLETED`).
*   **Overenie:** Overené v rámci backendového *Testu 26*.

### R. Sprint Database-driven Word Problem Quest Generator
*   **DB Quest Generator (`db_quest_generator.py`):** Skript priamo dopytuje SQLite databázu pre stav surovín a predmety testovacieho hráča a dynamicky počíta slovné zadanie questov, napríklad prepočítava chýbajúce Crystal Shardy na vylepšenie zbrane.
*   **Overenie:** Overené v rámci backendového *Testu 27*.

### S. Sprint Semantic Gameplay Coordinator
*   **Koordinátor (`SemanticGameplayCoordinator.ts`):** Zjednocuje mapovú polohu hráča, predikcie spawnov z ML modelu, slovnú úlohu z databázy a dialógy NPC do jedného Express API payloadu `/api/scenarios/semantic-sector/:threadId`.
*   **Overenie:** Overené v rámci backendového *Testu 28*.

### T. Sprint Terrain Telemetry & Dopamine Balancer
*   **Dopamine Balancer (`TerrainTelemetryCoordinator.ts`):** 
    *   Garantuje rozmanitosť textúr prostredia tak, aby susedné hexy nemali zhodné vzory (anti-repetitiveness loop).
    *   Dynamicky mení obtiažnosť a navyšuje XP/Loot odmeny až na **1.5** pri plnom zdraví hráča pre vyvolanie dopamínovej spätnej väzby.
*   **Overenie:** Overené v rámci backendového *Testu 29*.

### U. Sprint Render Priority & GPU Instancing Resolve Chain
*   **WebGL Render priority & Instancing (`RenderPriorityBalancer.ts`):**
    *   Vypočítava prioritné skóre pre prekresľovanie dielov (od `CRITICAL` v blízkosti hráča po `CULLED` v diaľke).
    *   Zoskupuje rovnaké entity (chesty, pasce) pre GPU inštancované vykreslenie a spúšťa ML variety príznak pre zmenu vzhľadu pri vysokej hustote rovnakých modelov.
*   **AestheticCompositor (`AestheticCompositor.jsx`):** Klientský WebGL shader post-processing kompozitor prispôsobuje filtre (Bloom, Chromatic Aberration, Glitch) podľa telemetrie prostredia.
*   **Overenie:** Overené v rámci backendového *Testu 30*. Všetkých **30 testov prebehlo úspešne na 100%**.

### V. Sprint Gameplay Compositor Manager & Spawner
*   **Compositor Spawner (`GameplayCompositorManager.ts`):** Skúma stavy databázy a pri nízkom HP hráča spawnuje výhodné príležitosti (ako chesty) do vzdialených/culled hexagónov mimo hlavný viewport.
*   **Overenie:** Overené v rámci backendového *Testu 31*.

### W. Sprint Algebraic Canvas Composition & Sequences
*   **Sequencer (`GameplayCompositionEngine.ts`):** Generuje hexadecimálne logy ciest (`0x04030303`) a mapuje stavy (napr. zakorenenie) na spomalenú chôdzu (`slow_walk`).
*   **Overenie:** Overené v rámci backendového *Testu 32*.

### X. Sprint Hero Graphics & Biome Market Prices
*   **Graphics & Market (`AestheticMarketCoordinator.ts` & `GameplayCompositorTemplate.jsx`):** 
    *   Definuje matné a emissívne 3D vlastnosti postáv a implementuje dynamické biómové ceny surovín.
    *   Pridáva interaktívny 3D visual preview panel do herného dashboardu pre priame testovanie.
*   **Overenie:** Overené v rámci backendového *Testu 33*. Všetkých **33 testov prebehlo úspešne na 100%**.

### Y. Sprint Cinematic Shaders & Generative ML Tactical Spawner
*   **WebGL Cinematic Post-Processing:**
    *   Pridaný trojrozmerný, pohybujúci sa `<VolumetricFog3D />` časticový opar nad arénou pre vytvorenie volumetrickej atmosféry.
    *   Pridané efekty `DepthOfField` (dynamické ostrenie) a `Vignette` (vinjeta) do `AestheticCompositor.jsx` pre dosiahnutie temného a kontrastného neónového štýlu v duchu *Watch Dogs*.
*   **Generative ML Tactical Coordinator (`TacticalGenerativeCoordinator.ts` & `tactical_spawner.py`):**
    *   Procedurálny pythonovský generátor analyzuje taktický dopyt (prompt) a na základe biómu a stavu hráča vygeneruje a umiestni na herný plán pascu, bariéru alebo chestu s prepočítanou silou (power rating).
    *   Pridaný nový Express REST API endpoint `POST /api/scenarios/generate-tactical-instance`.
*   **Overenie:** Overené v rámci backendového *Testu 34*. Všetkých **34 testov prebehlo úspešne na 100%**.

### Z. Sprint Game Logic, Combos, Traps & Advanced Stylings (Phase 5)
*   **Voltage Surge & Short Circuit Combos (`TurnStateMachine.ts`):**
    *   Implementovali sme prepojenie pre po sebe idúce ťahy jedného hráča (`lastPlayedSpecs`).
    *   Zahranie dvoch po sebe idúcich vysokonapäťových kariet (napr. `crystal_laser` + `acid_rain`) aktivuje combo bonus **Voltage Surge** s navýšením poškodenia o **+2 DMG** a zápisom do trace logu.
*   **Terrain Traps (`SovereignEngine.ts`):**
    *   Umiestnenie pasce `ROOT_TRAP` alebo `EMP_MINE` do arény. Vstúpenie nepriateľského hrdinu na pascu udelí čisté poškodenie upravené o brnenie, aplikuje negatívny stav (napr. zakorenenie `isRooted = true`) a spotrebuje pascu.
*   **Vizuálna Lebka pre Pasce & 3D Vzhľad Truhlíc (`HexagonNode3D.jsx`):**
    *   Preštylizovali sme pascu na 3D rotujúcu a vznášajúcu sa neónovú lebku.
    *   Prepracovali sme truhlicu s korisťou (`LootChest3D`) do komplexnej 3D štruktúry: tmavé metalické telo, neónový zlatý kryt s vyžarovaním (emissive) a vznášajúce sa svietiace aetherické jadro.
*   **Deaktivácia Bokeh & Rozostrenia (Graphics Optimization):**
    *   Na základe spätnej väzby a našej výskumnej štúdie sme vypli (zakomentovali) `DepthOfField` post-processing pass v `AestheticCompositor.jsx` pre dosiahnutie maximálne ostrej a čitateľnej grafiky bez výkonnostných prepadov.
*   **Overenie:** Overené v rámci backendových testov **Test 35** a **Test 36**. Všetkých **36 testov v backendovom testovacom jadre prebehlo úspešne na 100% zelenú!**

### AA. Sprint Sovereign Multi-Area Content & Quest Distribution Engine
*   **Modular Content Distributor (`SovereignContentDistributor.ts`):**
    *   Navrhli sme a implementovali celoplošný spúšťací a distribučný systém priradenia obsahu na základe dosiahnutia jednotlivých biomov/makro chunkov na hernej mape.
    *   Hráčovi sa pri presune automaticky priraďujú špecifické regionálne questy (napr. `q_glacial_explore` pre ľadovec alebo `q_toxic_basin_explore` pre toxický močiar).
    *   Skript adaptívne umiestňuje loot chesty a spúšťa nebezpečné environmentálne situácie (napr. toxické kyslé dažde udelujúce poškodenie) s pravdepodobnosťou naviazanou na postup v hre.
*   **Overenie:** Overené v rámci nového **Testu 37**. Všetkých **37 backendových integračných testov prebieha úspešne na 100% zeleno!**

### AB. Sprint Sovereign Soldier Simulator, Combinatorics & Out-of-Engine NPC turns
*   **Sovereign Soldier Simulator (`SovereignSoldierSimulator.ts`):**
    *   **Opposing NPC Spawner:** Vytvorili sme spúšťač a simuláciu nepriateľských jednotiek typu `NPC` na hracom pláne.
    *   **Kombinatorická Predikcia Výhry (Win Rate Combinatorics):** Implementovali sme matematický model, ktorý analyzuje kategórie pohybových (reach) a deštrukčných (combat) kariet v ruke a na ich základe počíta pravdepodobnosť porazenia nepriateľa.
    *   **Out-of-Engine Simulácia:** Sandboxový simulačný cyklus bežiaci mimo hlavného stroja ťahov, v ktorom sa nepriateľské NPC presúvajú k hrdinom po najkratšej A* ceste a automaticky na nich útočia.
*   **Overenie:** Overené v rámci nového **Testu 38**. Všetkých **38 backendových integračných testov prebieha úspešne na 100% zeleno!**

### AC. Sprint Strictly Deterministic Turn Balancer
*   **Deterministic Turn Balancer (`DeterministicTurnBalancer.ts`):**
    *   Navrhli sme a naimplementovali stopercentne deterministický systém vyhodnocovania a vyvažovania ťahov hráčov (bez akejkoľvek náhodnosti).
    *   **Rozhodovanie o poradí (Next Player Priority):** Poradie ťahov je riadené kumulatívnou cenou iniciatívy (time cost) zahraných kariet. Pri rovnosti cien (tie-break) balancer deterministicky uprednostní hráča s nižším stavom zdravia (catch-up balancing).
    *   **Deterministické modifikátory (Fatigue & Grace):**
        *   *Fatigue:* Hráč, ktorý drží ťah po sebe idúce kolá (consecutive turns >= 2), je penalizovaný zvýšením ceny nasledujúcej akcie o +50% (únava).
        *   *Grace:* Hráč v kritickom stave zdravia (< 40%) získa deterministic catch-up zľavu -20% na cenu iniciatívy.
*   **Overenie:** Overené v rámci nového **Testu 39**. Všetkých **39 backendových integračných testov prebieha úspešne na 100% zeleno!**

### AD. Sprint Sovereign Propositional Logic Console & Administrator Access Points
*   **Sovereign Logic Console (`SovereignLogicConsole.ts` & `GameplayCompositorTemplate.jsx`):**
    *   **Administrator Access Points:** Vytvorili sme deterministické prístupové body pre admina (napr. `engine_state`, `active_player`, `system_energy`, `player_rooted`, `player_slowed`), kde sa dajú všetky kľúčové premenné engine-u zobraziť a prepísať priamo z React GUI panelu.
    *   **Propositional Logic Evaluator:** Implementovali sme parser a vyhodnocovač formúl výrokovej logiky (napr. `isRooted ^ lowHealth => dangerZone`) nad stavovými premennými hráča s podrobným krokovým logovaním.
    *   **Code Documentation & Brainstorming (Operating Software):** Zostavili sme detailný prehľad a špecifikáciu modulov herného engine-u priamo v admine, ktorý slúži ako podklad pre rýchly vývoj ďalších featur a funkcií.
*   **Overenie:** Overené v rámci nového **Testu 40**. Všetkých **40 backendových integračných testov prebieha úspešne na 100% zeleno!**

### AE. Sprint Sovereign Battle Director, Adaptive Difficulty & Fighter Guidance
*   **Sovereign Battle Director (`SovereignBattleDirector.ts`):**
    *   **Encounter Combat Simulator:** Implementovali sme matematický a štatistický model na vyhodnocovanie stretnutí bojovníka s nepriateľskými NPC. Výpočet poškodenia zohľadňuje brnenie, priraďuje XP a generuje animácie úderov a odviet, ktoré zapisuje do trace logu.
    *   **Adaptive Difficulty Scaling:** Balančná slučka, ktorá na základe histórie telemetry dát z databázy vyhodnocuje úspešnosť hráča. Ak počet víťazstiev stúpne nad 3, automaticky splodí vysokokvalitné Elite NPC (*Elite Void Sentinel*), aby udržala herný zážitok férový a vyvážený.
    *   **Guidance Navigation System:** Navigačný asistent, ktorý podtahovo navádza a smeruje bojovníka k najbližšiemu a najvhodnejšiemu stretu s vysokým ziskom XP pomocou Pathfinder algoritmu.
    *   **SQLite Telemetry Logging:** Všetky informácie o stretoch a simuláciách sa plne ukladajú do perzistentnej databázy `database.db`.
*   **Overenie:** Overené v rámci nového **Testu 41**. Všetkých **41 backendových integračných testov prebieha úspešne na 100% zeleno!**

### AF. Sprint Sovereign System Hierarchy & Algebraic Superpositions
*   **Sovereign System Hierarchy (`SovereignSystemHierarchy.ts`):**
    *   Vystavali sme hierarchickú štruktúru komponentov a ich závislostí v engine, definujúcu vzťahy medzi jadrom hry (Turn State Machine, Battle Director, Content Distributor, atď.). Exponovali sme deterministický modul overovania integrity celého systému (`verifySystemIntegrity`).
*   **Sovereign Superposition Engine (`SovereignSuperpositionEngine.ts`):**
    *   Implementovali sme koncepty **algebraických superpozícií** (stavy `WAVE_FUNCTION`, `ENTANGLED`, `SCHRODINGER_SHIELD`), ktoré prinášajú moderné trendy z taktických rogue-like a kartových hier do nášho riešenia.
    *   **Deterministic Wave Collapse:** Hráč v superpozícii sa môže kedykoľvek rozhodnúť pre kolaps stavu do konkrétnej fyzikálnej reality:
        *   *DAMAGE:* Navýši základné poškodenie o $+4$ body.
        *   *SHIELD:* Zvýši brnenie (armor) o $+3$.
        *   *MOVEMENT:* Odstráni a vylieči všetky spomaľovacie a znehybňujúce efekty (slowed, rooted).
    *   **Outcome Tensor Transformation:** Superpozičné pole dokáže pretransformovať výsledok a úspešnosť akejkoľvek akcie lineárnymi transformáciami (napr. navýšiť poškodenie o $30\%$ pri `WAVE_FUNCTION`).
*   **Overenie:** Overené v rámci nového **Testu 42**. Všetkých **42 backendových integračných testov prebieha úspešne na 100% zeleno!**

### AG. Sprint Sovereign Game Specs Statistics Reporter
*   **Sovereign Game Specs Statistics Reporter (`SovereignStatisticsReporter.ts`):**
    *   Vytvorili sme modul, ktorý programovo číta a analyzuje perzistentné dáta z SQLite databázy. Poskytuje detailné štatistiky o počte hráčov, priemernom leveli, zakúpených itemoch a celkových telemetrických záznamoch.
    *   **Dynamic Markdown Compilation:** Reporter automaticky generuje a kompiluje prehľadný súbor [game_specs_statistics_report.md](file:///home/rhoddos_berger/.gemini/antigravity-ide/brain/066f6b59-4305-46f4-ade5-f62df6b096b7/game_specs_statistics_report.md) pri každom dotaze na server.
*   **Overenie:** Overené v rámci nového **Testu 43**. Všetkých **43 backendových integračných testov prebieha úspešne na 100% zeleno!**

### AH. Sprint Sovereign Telemetry Event & Entity Spawner Director
*   **Sovereign Telemetry Event & Entity Spawner Director (`SovereignTelemetrySpawner.ts`):**
    *   Vytvorili sme inteligentný spawnovací systém, ktorý na mape dynamicky spawnuje reprezentácie entít a eventov na základe priemerovaných hodnôt SQLite telemetrie (kompromis medzi hernými vlastnosťami a štatistikami):
        *   **Elite Void Stalker NPC:** Splodený priamo v Swamp oblasti (Chunk 0, Hex 4) v prípade, že priemerný level účtov prekročí $1.5$.
        *   **Quantum Data Anomaly Trap:** Nebezpečná dátová pasca umiestnená v lese (Chunk 0, Hex 2), ak systém zaznamená preťaženie pamäťových registrov.
        *   **Telemetry Loot Chest:** Truhlica s replenishment materiálmi spustená v Chunk 0, Hex 3, pokiaľ je celkový počet zakúpených itemov nízky.
*   **Overenie:** Overené v rámci nového **Testu 44**. Všetkých **44 backendových integračných testov prebieha úspešne na 100% zeleno!**

### AI. Sprint Sovereign Combinatorics Template Registry
*   **Sovereign Combinatorics Template Registry (`SovereignCombinatoricsRegistry.ts`):**
    *   Vytvorili sme persistentnú tabuľku `combinatorial_action_registry` v SQLite databáze na ukladanie a načítanie špecifických kombinácií kariet a ich efektov, síl a úspešností.
    *   **Baseline Combo Prepopulation:** Pri štarte databáza automaticky predvyplní tri základné vzorce:
        *   `Aetheric Current Burst` (Voltage Surge + Charge) -> $+4$ Damage Bonus, $+12$ Energy preťaženie a spomalenie.
        *   `Earthen Wall Shield` (Shield + Grow) -> $+5$ Armor, $+3$ Heal.
        *   `Glacial Drift Freeze` (Nature + Shield) -> $+2$ Damage, zakorenenie nepriateľa.
    *   **Order-Agnostic Matching Solver:** Systém rozpoznáva a vyhodnocuje zahrané kombinácie kariet nezávisle od poradia ich uloženia alebo vytiahnutia z ruky.
*   **Overenie:** Overené v rámci nového **Testu 45**. Všetkých **45 backendových integračných testov prebieha úspešne na 100% zeleno!**

### AJ. Docker & Docker Compose Integration (Yarn Orchestration)

Vytvorili sme kompletnú Docker konfiguráciu pre automatické spúšťanie a beh všetkých komponentov projektu:

*   **Dockerfile.go-core:** Viacstupňový build pre kompiláciu vysokovýkonnej Go Core mikroslužby na báze `golang:alpine`.
*   **Dockerfile.server:** Docker konfigurácia pre Express Node server, ktorá:
    *   Inštaluje Python 3 a virtualenv pre behovú prevádzku ML spawneru.
    *   Inštaluje monorepo závislosti cez **Yarn Workspaces**.
    *   Automaticky spúšťa Prisma migrácie (`npx prisma db push`) pred štartom servera.
*   **Dockerfile.client:** Docker konfigurácia pre klientsky React/Vite 3D web, ktorý beží s prepínačom `--host` pre správne bindovanie sieťových rozhraní.
*   **docker-compose.yml:** Definuje kompletné lokálne prostredie vrátane:
    *   PostgreSQL databázy (`db`) s perzistentným volume.
    *   Redis inštancie (`redis`) pre potreby Matchmaking Workera.
    *   Go Core a Express serverov s prepojenou konfiguráciou cez premennú `GO_CORE_URL`.

**Spustenie v Dockeri:**
```bash
docker-compose up --build
```
Po zbehnutí príkazu sú všetky služby prepojené a automaticky spustené.
