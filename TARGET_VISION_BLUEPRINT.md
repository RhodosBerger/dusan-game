# Target Vision Blueprint: The Last Tribe

Tento dokument definuje cieľovú predstavu o finálnej verzii (Target Vision) hry The Last Tribe. Definuje 4 kľúčové smery rozvoja, ktoré premenia súčasné plne hrateľné MVP na škálovateľný AAA titul s hlbokou ekonómikou a analytikou.

---

## 1. Architektonické rozširujúce moduly (Vision Map)

```
┌──────────────────────────────────────────┐
│          FINÁLNA PRODUKČNÁ VERZIA        │
└────────────────────┬─────────────────────┘
                     │
┌────────────────────┴─────────────────────┬────────────────────────┐
▼                    ▼                     ▼                        ▼
┌──────────────────┐ ┌───────────────────┐ ┌──────────────────────┐ ┌──────────────────┐
│ Kinetická Odozva │ │ Perzistentná DB   │ │ ClickHouse Big Data  │ │ Globálny Lobby   │
│  & Audio Engine  │ │  & Meta-Prog      │ │ Telemetria           │ │ Orchestrátor     │
└──────────────────┘ └───────────────────┘ └──────────────────────┘ └──────────────────┘
```

---

## 2. Detailný rozpis budúcich integrácií

### A. Kinetický Zvukový a Vizuálny Engine (Audio & Particle Feedback)
Súčasná 3D aréna je vizuálne detailná, no chýba jej reaktívna audio zložka a fyzická odozva (juice):
*   **Biómový ambientný zvuk:** Lokálny syntetizátor zvukov (pomocou Web Audio API). Glacier bióm spúšťa studený poryv vetra, Toxic Swamp bublanie a nízkofrekvenčný šum.
*   **Reaktívny audio-feedback Ohmovho zákona:** Zvukové efekty zahrania kariet sa modulujú podľa prúdu ($I$).
    *   Ak $I < 1.0$ (zlyhanie), prehrá sa skratový elektrický zvuk (spark fizzle).
    *   Ak $I \ge 1.0$ (úspech), ozve sa hlboké basové dunenie. Pri Ultimate kartách zvuk graduje v závislosti od výšky napätia ($V$).
*   **Kinetická odozva kamery (Camera Shake):** Pri udelení poškodenia sa v CanvasRenderer3D.jsx spustí jemné zachvenie kamery. Amplitúda chvenia je priamo úmerná výslednému poškodeniu (sémantickej erózii), čím hráč okamžite cíti váhu svojho útoku.

### B. Perzistentná Ekonómika, Databáza a Crafting (Meta-Progression)
Prechod z jednorazových lokálnych zápasov na pretrvávajúci hráčsky profil:
*   **Hybridná PostgreSQL / SQLite schéma:**
    *   Relácie pre tabuľku players (ID, meno, XP, Level, MMR).
    *   GIN indexované JSONB stĺpce pre inventories (uloženie skinov, vyhratých rámov avatarov a nazbieraných surovín).
*   **Integrácia Crafting Simulátora (CraftingSimulator.ts):**
    *   Prepojenie nazbieraných surovín (Crystal Shards, Spores) s výrobou vlastných balíčkov kariet.
    *   Hráči môžu taviť nadbytočné karty na esenciu a syntetizovať z nej vzácne moduly (karty) s upravenými hodnotami odporu a napätia.
*   **Quest synchronizátor:** Priebežné ukladanie questov priamo do databázy, čím sa zabráni strate progresu pri odpojení hráča.

### C. Big Data Telemetria & Automatický ML Balans (Auto-Balancing)
Zber gigabajtov dát z tisícok zápasov na odladenie hrateľnosti:
*   **ClickHouse / BigQuery telemetry stream:** Priamy dávkový zápis (batching) všetkých trace udalostí. Každý krok zápasu vygeneruje štruktúrovanú správu o napätí, odpore a stave hrdinov.
*   **Unsupervised ML Clustering (K-Means):**
    *   Pravidelne spúšťaný Python script, ktorý načíta telemetrické dáta a zoskupí karty podľa ich výkonu (úspešnosť vs vygenerované teplo).
    *   Detekcia anomálií identifikuje "overpowered" karty, ktoré generujú príliš vysoký prúd pri nízkom odpore.
*   **Hot-Reload Rule Updating:** ML model vygeneruje odporúčané úpravy parametrov kariet, ktoré sa prostrednívom KnowledgeBaseService.ts za chodu (bez reštartu servera) načítajú do pamäte, čím sa dosiahne samo-vyvažujúci sa herný ekosystém.

### D. Globálny Lobby Orchestrátor & Kubernetes (Scaling)
Vytvorenie škálovateľného prostredia pre tisícky simultánnych hráčov:
*   **Redis-based Matchmaking:**
    *   Hráči v stave join_matchmaking sa neukladajú do lokálneho poľa, ale do Redis sorted setu na základe ich MMR.
    *   Rýchly matchmaking démon (worker) spáruje hráčov s podobným hodnotením do sekundy.
*   **Dynamické spúšťanie miestností (Pod Orchestration):**
    *   Pri štarte zápasu orchestrátor vyšle požiadavku na vytvorenie novej malej inštancie SovereignEngine v samostatnom micro-kontajneri (Kubernetes pod).
    *   Lokálny server slúži len ako API brána, čím sa dosiahne lineárne horizontálne škálovanie a absolútna izolácia chýb (pád jednoho zápasu neovplyvní ostatné).

---

## 3. Akčný plán (Implementation Roadmap)

| Fáza | Názov | Hlavný cieľ | Očakávaný dopad |
| :--- | :--- | :--- | :--- |
| **Fáza A** | Audio & Kinetic Update | Web Audio API ambient a efekty + otrasy kamery. | 80% zvýšenie hernej imersie. |
| **Fáza B** | Database & Account Link | PostgreSQL schéma, ukladanie inventárov a questov. | Udržateľnosť hráčov a registrácie. |
| **Fáza C** | Redis & Lobby Scale | Redis matchmaking fronta, prechod na dockerizované rooms. | Schopnosť zvládnuť 1000+ hráčov naraz. |
| **Fáza D** | Analytics Pipeline | Prepojenie telemetrie s ClickHouse a ML clusteringom. | Dokonalý herný balans riadený dátami. |
