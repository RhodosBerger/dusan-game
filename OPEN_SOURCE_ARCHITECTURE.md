# Dušan Game Engine - Open Source Modular Architecture

## 🏗️ Architektúra Projektu

Tento projekt je navrhnutý ako **monorepo** s vysoko modulárnou architektúrou, ktorá umožňuje nezávislý vývoj, testovanie a nasadzovanie jednotlivých komponentov. Celý engine je open-source (MIT licencia) a podporuje komunitný príspevok.

### Štruktúra Adresárov

```
/workspace
├── packages/                 # Jadrové balíky (knihovny)
│   ├── core-axioms/          # Axiomatické jadro, pravidlá, sémantika
│   ├── geometry-engine/      # Generovanie geometrie, hex grid, boolean operácie
│   ├── render-pipeline/      # Adaptívny rendering, LOD, textúry, shadery
│   ├── ai-cognition/         # ML modely, predikcia, LLM integrácia, behavior
│   ├── network-sync/         # WebSocket, Go backend bridge, real-time sync
│   └── ui-system/            # React komponenty, HUD, admin dashboard
│
├── apps/                     # Aplikácie (spustiteľné celky)
│   ├── game-client/          # Hlavný herný klient (Three.js + React)
│   ├── game-server/          # Serverová logika (Node.js + Go bridge)
│   └── editor-tool/          # Editor levelov a axiómov (no-code tool)
│
├── tools/                    # Vývojárske nástroje
│   ├── cli/                  # CLI pre generovanie, build, deploy
│   └── docs/                 # Dokumentácia, storybook, API docs
│
├── assets/                   # Herné assety (textúry, modely, audio)
│   ├── procedural/           # Procedurálne generované assety
│   ├── community/            # Komunitné mody a príspevky
│   └── shared/               # Zdieľané assety medzi projektmi
│
├── scripts/                  # Automatizačné skripty
│   ├── generate-levels.ts    # Skript na generovanie levelov
│   ├── sync-axioms.sh        # Sync axiómov medzi balíkmi
│   └── build-all.sh          # Build celého projektu
│
└── docs/                     # Dokumentácia
    ├── ARCHITECTURE.md       # Technická architektúra
    ├── CONTRIBUTING.md       # Ako prispieť
    ├── AXIOM_REFERENCE.md    # Referencia axiómov
    └── API.md                # API dokumentácia
```

---

## 📦 Balíky (Packages)

### 1. `@dusan/core-axioms`
**Popis:** Jadrová knižnica definujúca axiómy, pravidlá a sémantiku sveta.
**Kľúčové moduly:**
- `AxiomLibraryResolver` - Načítava a validuje axiómy
- `SemanticContinuityValidator` - Kontroluje konzistenciu významov
- `CombinatorialUniquenessGuard` - Zabezpečuje jedinečnosť konfigurácií
- `EntropyFeedbackLoop` - Spravuje morálnu entropiu

**Dependency:** Žiadne (nezávislé jadro)

---

### 2. `@dusan/geometry-engine`
**Popis:** Engine pre generovanie procedurálnej geometrie a priestorových vzťahov.
**Kľúčové moduly:**
- `HexGridCore` - Hexagonálna mriežka s boolean operáciami
- `OctantConnectivitySolver` - Riešenie susedských vzťahov v 8 smeroch
- `ProceduralSectorGenerator` - Generovanie sektorov z axiómov
- `MeshStitcher` - Spájanie meshov do súvislých objektov

**Dependency:** `@dusan/core-axioms`, `three.js`

---

### 3. `@dusan/render-pipeline`
**Popis:** Adaptívny renderingový pipeline pre všetky platformy.
**Kľúčové moduly:**
- `AdaptiveRenderPipeline` - Detekcia hardvéru a nastavenie kvality
- `LODManager` - Dynamické úrovne detailu
- `TextureStreamingManager` - Inteligentné streamovanie textúr
- `CSSBlueprintManager` - Dynamické CSS a shader parametre
- `SnapshotSystem` - Správa stavových snímok

**Dependency:** `three.js`, `react-three-fiber`, `@dusan/geometry-engine`

---

### 4. `@dusan/ai-cognition`
**Popis:** AI a ML moduly pre predikciu, generovanie a správanie.
**Kľúčové moduly:**
- `PlayerTrajectoryForecaster` - Predikcia pohybu hráča
- `LLMProfileCompiler` - Generovanie profilov neznámych entít
- `PatternRecognitionEngine` - Detekcia anomálií a "fun factors"
- `BehaviorTreeExecutor` - Vykonávanie AI správania NPC
- `VariationCompilerEngine` - Kompilácia variácií obsahových blokov

**Dependency:** `onnxruntime-web`, `openvino`, `@dusan/core-axioms`

---

### 5. `@dusan/network-sync`
**Popis:** Sieťová synchronizácia a komunikácia medzi klientom a serverom.
**Kľúčové moduly:**
- `WebSocketBridge` - Real-time komunikácia
- `GoBackendConnector` - Binary protokol pre Go core
- `StateSynchronizer` - Synchronizácia stavov medzi klientmi
- `TelemetryStreamer` - Odosielanie telemetrie na analýzu

**Dependency:** `socket.io`, `ws`, `protobuf`

---

### 6. `@dusan/ui-system`
**Popis:** UI komponenty a dashboardy pre hráčov aj adminov.
**Kľúčové moduly:**
- `LiveOpsDashboard` - Admin panel pre live ops
- `KarmaCanvasRenderer` - Vizuálna spätná väzba karmy
- `QuestLogUI` - Dynamický quest log s prediktívnymi prvkami
- `InventoryManager` - Inventár s automatickým zvýrazňovaním

**Dependency:** `react`, `zustand`, `@dusan/core-axioms`

---

## 🎮 Aplikácie (Apps)

### 1. `game-client`
**Popis:** Hlavný herný klient bežiaci v prehliadači.
**Tech Stack:** React, Three.js, TypeScript, Vite
**Využíva balíky:** Všetky okrem `game-server`

---

### 2. `game-server`
**Popis:** Serverová logika s Go core bridge.
**Tech Stack:** Node.js, Express, Socket.io, Go (WASM)
**Využíva balíky:** `core-axioms`, `ai-cognition`, `network-sync`

---

### 3. `editor-tool`
**Popis:** No-code editor pre tvorbu levelov, axiómov a scenárov.
**Tech Stack:** React, Electron (voliteľné), TypeScript
**Využíva balíky:** `core-axioms`, `geometry-engine`, `ui-system`

---

## 🛠️ Nástroje (Tools)

### 1. `cli`
**Popis:** Príkazový riadok pre vývojárov.
**Príkazy:**
- `dusan generate-level --seed=12345` - Generovanie levelu
- `dusan build --target=web|mobile|desktop` - Build projektu
- `dusan sync-axioms` - Synchronizácia axiómov
- `dusan deploy --env=production` - Nasadenie

---

### 2. `docs`
**Popis:** Generátor dokumentácie.
**Funkcie:**
- Auto-generovanie API docs z TypeScript definícií
- Storybook pre UI komponenty
- Interaktívna dokumentácia axiómov

---

## 🔌 Modulárne Rozhrania

Každý balík exponuje jasné rozhrania:

```typescript
// Príklad: @dusan/core-axioms
export interface IAxiom {
  id: string;
  name: string;
  rules: IRule[];
  libraries: ILibraryElement[];
}

export interface IWorldGenerator {
  generate(seed: number, axioms: IAxiom[]): IWorldChunk;
  validate(chunk: IWorldChunk): boolean;
}

// Príklad: @dusan/render-pipeline
export interface IRenderPipeline {
  configure(settings: IRenderSettings): void;
  render(scene: IScene, camera: ICamera): void;
  takeSnapshot(): ISnapshot;
}
```

---

## 🤝 Open Source Princípy

### Licencie
- **Jadro (packages/*):** MIT License
- **Asety (assets/community):** CC-BY-SA 4.0
- **Dokumentácia:** CC-BY 4.0

### Ako Prispieť
1. Forkni repozitár
2. Vytvor branch (`feature/nova-mechanika`)
3. Implementuj zmenu s testami
4. Otvori Pull Request
5. Code review od maintainers
6. Merge do main

### Versioning
- Semantické versionovanie (SemVer)
- Každý balík má vlastnú verziu
- Monorepo používa `changesets` pre manažment verzií

---

## 🚀 Quick Start

```bash
# Inštalácia všetkých dependencií
npm install

# Spustenie vývojového servera
npm run dev

# Build celej aplikácie
npm run build

# Spustenie testov
npm test

# Generovanie nového levelu
npx dusan generate-level --seed=42 --axioms=CHAOS_TIER_3

# Spustenie editora
npm run editor
```

---

## 📊 Roadmap

- [x] Core Axioms & Geometry Engine
- [x] Adaptive Render Pipeline
- [x] AI Cognition & LLM Integration
- [x] Network Sync & Go Bridge
- [ ] Editor Tool (Beta)
- [ ] Mobile App (React Native)
- [ ] VR/AR Support
- [ ] Community Marketplace

---

## 📞 Kontakt & Podpora

- **Discord:** [odkaz]
- **GitHub Issues:** [odkaz]
- **Documentation:** https://dusan-game.dev/docs

---

*Tento projekt je vytvorený komunitou pre komunitu. Každý príspevok je vítaný!*
