# Integration Goals — Final Production Roadmap
## The Last Tribe — Revision 2 (August 2026)

> **Status:** Post-MVP. Full AI match playable end-to-end (lobby → combat → victory screen). 45 backend integration tests pass (393 asserts + 19 AI). 3 services running: Go Core :8081, Express :3001, Vite :5173.
>
> **Revision 2 changes:** Reflects July 2026 critical bug fixes (identity mapping, HP undefined, player disappearing, Tailwind v4, camera/interaction). Incorporates Hex World Design System spec. Consolidates outdated `FUTURE_FEATURES_CHECKLIST.md` items (all 4 done). Adds missing open items from `ZMENY_2026-07-09.md`.

---

## Current State Summary (as of August 2026)

| Area | Status | Notes |
|:---|:---|:---|
| Hex 3D grid (63 tiles, 9 meta) | Done | `HexagonNode3D.jsx`, `HexMath3D.js` |
| Ohm's Law physics (V, R, I, P) | Done | `PhysicsActionDataset.ts` |
| Turn State Machine (5 phases) | Done | `TurnStateMachine.ts` |
| Algebraic Action Tensor | Done | `AlgebraicActionTensor.ts` |
| SQLite persistence + meta-progression | Done | `DatabaseSyncManager.ts` |
| Biome particles (snow, swamp vapor) | Done | `HexagonNode3D.jsx` |
| Adrenaline Collapse Director | Done | `AdrenalineDirector.ts` |
| Lobby + Socket.io matchmaking | Done | `LobbyScreen.jsx`, `server.ts` |
| Go Core telemetry (port 8081) | Done | `go-core/main.go` |
| Web Audio synthesizer | Done | `ArenaAudio.js` |
| Camera shake on impact | Done | `CanvasRenderer3D.jsx` |
| Hero impact VFX (burst + ring + orb) | Done | `HeroImpactVFX.jsx` |
| AAA spell projectile (comet + shards) | Done | `SpellProjectile3D.jsx` |
| Arena ambient particles (200 mana dust) | Done | `ArenaAmbientParticles.jsx` |
| Dynamic faction accent lighting | Done | `CanvasRenderer3D.jsx` |
| Hero Aura Ring + Idle Float | Done | `HeroAura.jsx`, `ThreadMiniature.jsx` |
| Footprint Hex Glow Trail | Done | `HexagonNode3D.jsx`, `App.jsx` |
| Adrenaline Mode Vignette | Done | `AdrenalineVignette.jsx` |
| 3D Dice + Weapon Indicators | Done | `ThreadMiniature.jsx` |
| AI Opponent Director | Done | `AIOpponentDirector.ts` |
| Combo Voltage Surge + Short Circuit | Done | `TurnStateMachine.ts` |
| Terrain Traps (ROOT_TRAP, EMP_MINE) | Done | `SovereignEngine.ts` |
| Loot Chest 3D + spawning | Done | `HexagonNode3D.jsx` |
| Town Shop + Item Mappings | Done | `DatabaseSyncManager.ts`, `itemsCatalog.ts` |
| Go Core GPS telemetry stream | Done | `main.go`, `server.ts` |
| Win-Rate & Play HUD Analytics | Done | `ArenaUIOverlay.jsx` |
| Docker + docker-compose | Done | `Dockerfile.*`, `docker-compose.yml` |
| 45 backend integration tests | Done | `testEngine.ts` (393 asserts), `testAIDirector.ts` (19 asserts) |

### Known Open Items (from ZMENY_2026-07-09.md)

- AI does not play reaction cards (only passes) or movement/enhancement cards
- Druid and Void factions are data-complete but not selectable from lobby
- Unused infrastructure: Prisma crafting, Redis matchmaking worker, JWT/rate-limit
- `FUTURE_FEATURES_CHECKLIST.md` is outdated — all 4 items already in code

---

## Milestone Map

```
M0  Stabilization & Bug Fixes ............ CURRENT  (immediate)
M1  Hex World Design System ("Painted Realm")
M2  Card Animation & Hand VFX Polish
M3  Biome Battleground Expansion
M4  AI Opponent Enhancement
M5  Void Walker Faction
M6  Multiplayer Scale & Spectator
M7  Meta-Progression & Economy Completion
M8  Big Data Analytics & Auto-Balancing
M9  Production Hardening & Launch
```

---

## M0 — STABILIZATION & BUG FIXES (Immediate)

**Goal:** Fix all known critical issues. Establish a clean, reliable baseline before visual and feature work begins.

### 0.1 Commit and Version Control Hygiene
- Commit all July 2026 working-tree changes (currently uncommitted per ZMENY doc)
- Tag as `v0.9.0-playable`
- Create `CHANGELOG.md` entry for the critical fix batch

### 0.2 Database Migration Safety
- Add migration scripts (SQLite `database.db` schema versioning)
- Guard against future snake_case/camelCase mismatches in `DatabaseSyncManager`
- Add integrity check: reject `NaN`/`null` HP on load with automatic repair

### 0.3 Test Infrastructure
- Integrate `testAIDirector.ts` into CI pipeline (Jenkinsfile + GitHub Actions)
- Add Playwright E2E test: full AI match (lobby → card play → movement → end screen)
- Add regression test for socket-to-thread identity mapping

### 0.4 Performance Baseline
- Profile client FPS with full VFX stack active
- Document minimum hardware requirements
- Verify `start-dev.sh` works on Windows (PowerShell compatibility)

---

## M1 — HEX WORLD DESIGN SYSTEM ("Painted Realm")

**Goal:** Replace the current CYBER_NEON aesthetic with the "Painted Realm" art style derived from `worldImage.png`. Single source of truth for all visual tokens.

**Spec reference:** `docs/superpowers/specs/2026-07-09-hex-world-design-system-design.md`

### 1.1 Design Token System
- Create `packages/client/src/design/worldDesign.js` — single source of truth: `PALETTE`, `BIOME_SPECS`, `LIGHTING`, `PORTAL`, `UI_TOKENS`
- Create `packages/client/src/design/propPlacement.js` — deterministic "biome core" rule
- Replace all hardcoded hex colors with token references
- Add CSS custom properties in `index.css` matching JS tokens 1:1

### 1.2 3D World Overhaul
- **Floating island substrate:** stone underside per hex (`rock.underside` → `rock.undersideDeep`), edge hexes deeper
- **Portal Vortex** (`PortalVortex3D.jsx`): 3 counter-rotating translucent discs, cyan point light, spiral particles — center hex of center meta
- **Floating Shards** (`FloatingShards3D.jsx`): ~30 slowly drifting dark polyhedra, shared material, decorative
- **Starfield Background** (`StarfieldBackground.jsx`): `space.background` color + ~200 stars in one `Points` buffer
- **New lighting rig:** Key directional `#fff4e0`, Fill `#688dab`, Ambient `#7a86a8` ~0.35, Portal point light

### 1.3 Biome Props (low-poly R3F primitives)
| Biome | Prop | File |
|---|---|---|
| GLACIER | CrystalSpire3D (turquoise crystals, mild emission) | `CrystalSpire3D.jsx` |
| BARRENS | RockSpikes3D (red stone needles) | `RockSpikes3D.jsx` |
| LUSH_FOREST | BlossomTree3D (dark trunk, pink crown) | `BlossomTree3D.jsx` |
| TOXIC_SWAMP | AcidPool3D (emissive disc + magenta flowers) | `AcidPool3D.jsx` |
| DESERT | DesertStones3D (dry stones, no emission) | `DesertStones3D.jsx` |

### 1.4 Material & Interaction State Updates
- Tile materials: `metalness: 0`, `roughness: 0.85`, tinted by `BIOME_SPECS.base`
- Replace neon wireframe hex edges with thin dark stone edges
- Replace neon meta-position borders with `path.dirt` color lines
- Hover: slight elevation + `accent.magic` edge glow
- Selected: stronger glow + floating ring in `accent.magic`
- Collapsing: darken to `rock.underside`, fall downward with debris (replaces purple void effect)

### 1.5 UI Overlay Reskin
- Dark glass panels tinted to `rock.underside` with subtle border (no neon)
- Remove all gold/`#00ffff`/`#00ffcc` from UI
- Accent mapping: player `#2dd3f1`, opponent `#c46884`, danger `#7b2e8d`, loot `#acf227`
- HP bars retain green→red gradient (readability over palette)

### 1.6 Cleanup
- Remove `aestheticTheme` prop chain and all branches (CYBER_NEON / MONOCHROME_RETRO / VIBRANT_BAROQUE / GHOSTLY_VOID)
- Remove theme switcher from UI
- Remove Glitch/ChromaticAberration effects tied to old themes
- Simplify `AestheticCompositor.jsx` to entropy-driven bloom only

**Effort:** ~5 days | **Impact:** Complete visual identity transformation

---

## M2 — CARD ANIMATION & HAND VFX POLISH

**Goal:** Every card interaction has visual weight. Playing a card feels like casting a real spell.

### 2.1 Card Cast Lift Animation
- On play: card rises 40px, scales to 1.15x, then vanishes with faction-colored flash
- Duration: 300ms ease-out
- **File:** `ArenaUIOverlay.jsx`, `App.css`

### 2.2 Faction Glow on Card Hover
- Crystal: cold blue shimmer border (`#00eeff`)
- Toxic: acid green pulse (`#39ff14`)
- Druid: warm gold wave (`#ffcc00`)
- **File:** `ArenaUIOverlay.jsx`

### 2.3 Physics Readout Count-Up
- Selected card + targeted hex → `V`, `R`, `I` numbers animate counting up (200ms)
- `I >= 1.0` → green glow confirmation; `I < 1.0` → red flash warning
- **File:** `ArenaUIOverlay.jsx`

### 2.4 Ultimate Card Distinction
- `isUltimate: true` cards get animated rainbow/gold border (CSS gradient rotation)
- On play: fullscreen 150ms white flash + ultimate orb particle profile
- **File:** `ArenaUIOverlay.jsx`, `SpellProjectile3D.jsx`

### 2.5 Reactive Interrupt Window UI
- During `INTERRUPT_WINDOW`: countdown ring UI + `[REACT]` badge on eligible reaction cards
- Timer visual: shrinking arc, 8-second default window
- **File:** `ArenaUIOverlay.jsx`

**Effort:** ~2 days | **Impact:** Major game-feel improvement

---

## M3 — BIOME BATTLEGROUND EXPANSION

**Goal:** Each of the 5 biomes has a unique visual fingerprint. Biome transitions feel cinematic.

### 3.1 Desert Heat Shimmer
- Rising heat haze particle points + Y-offset sine wave on `DESERT` tiles
- **File:** `DesertHeatParticles.jsx` (new)

### 3.2 Barrens Dust Devils
- Rotating mini whirlwind particle cluster on `BARRENS` tiles
- **File:** `BarrensDustDevil.jsx` (new)

### 3.3 Lush Forest Fireflies
- 4–6 bobbing warm `#ffffaa` point lights on `LUSH_FOREST` tiles at entropy > 0.5
- **File:** `ForestFireflies.jsx` (new)

### 3.4 Biome Transition VFX
- Hero moves between biomes → brief splash VFX matching destination biome color
- Duration: 400ms, additive blending
- **File:** `BiomeTransitionVFX.jsx` (new), `App.jsx`

### 3.5 Arena Collapse Void Spread
- Collapsing hexes: darken to `rock.underside` + ghostly particle debris falling downward
- Replace current fuchsia void effect with Painted Realm palette (per M1 spec)
- **File:** `HexagonNode3D.jsx`, `CanvasRenderer3D.jsx`, `App.jsx`

**Effort:** ~3 days | **Impact:** World depth and atmosphere

---

## M4 — AI OPPONENT ENHANCEMENT

**Goal:** AI is a credible training partner that uses the full card toolkit.

### 4.1 Reaction Card Usage
- AI evaluates interrupt window: if it holds a reaction card that would flip the outcome (`I < 1.0` for attacker), play it
- Decision threshold: play reaction only if it saves >= 2 HP or prevents lethal
- **File:** `AIOpponentDirector.ts`

### 4.2 Movement & Enhancement Cards
- AI plays movement cards to reposition tactically (away from traps, toward biome synergies)
- AI plays enhancement cards on self before attacking (armor buff, resistance boost)
- Priority order: Enhancement → Attack → Movement → End Turn
- **File:** `AIOpponentDirector.ts`

### 4.3 Trap Awareness
- AI avoids known trapped hexes (if it observed trap placement)
- AI places trap cards on high-traffic hexes near opponent
- **File:** `AIOpponentDirector.ts`

### 4.4 Difficulty Levels
- 3 AI levels: `NOVICE` (random suboptimal), `NORMAL` (current logic), `VETERAN` (optimal + combo chaining)
- Selectable from lobby screen before match start
- **File:** `AIOpponentDirector.ts`, `LobbyScreen.jsx`

**Effort:** ~3 days | **Impact:** Replayable single-player experience

---

## M5 — VOID WALKER FACTION

**Goal:** Fourth playable faction with unique entropy-based mechanics.

### 5.1 Card Data
- 42 Void Walker cards: consume entropy instead of voltage
- At entropy > 0.7 → Void cards become free to cast
- Palette: dark purple (`#7b2e8d`) / silver (`#c0c0c0`)
- **File:** new `voidBase.ts`, update `packages/shared/src/data/base/index.ts`

### 5.2 Faction Selection in Lobby
- Add Void Walker to hero selection in `LobbyScreen.jsx`
- Add Void Walker thread ID to server identity mapping
- **File:** `LobbyScreen.jsx`, `server.ts`

### 5.3 Physics Integration
- Add Void Walker cards to `PHYSICS_ACTION_DATASET` with entropy-cost field
- Modify `AlgebraicActionTensor` to handle entropy-consumption branch
- **File:** `PhysicsActionDataset.ts`, `AlgebraicActionTensor.ts`

### 5.4 Visual Identity
- Void-specific hero aura: dark purple pulsing ring with silver particle wisps
- Card back: void swirl pattern
- Spell projectile: dark orb with silver shards
- **File:** `HeroAura.jsx`, `SpellProjectile3D.jsx`

### 5.5 Druid Faction Activation
- Druid cards are data-complete; activate selection in lobby (same as Void)
- Verify all 42 Druid cards compile correctly through PhysicsActionDataset
- **File:** `LobbyScreen.jsx`, `server.ts`

**Effort:** ~4 days | **Impact:** 50% more playable content

---

## M6 — MULTIPLAYER SCALE & SPECTATOR

**Goal:** Support more than 2 players, add spectator mode, and prepare for online scale.

### 6.1 Redis MMR Matchmaking Queue
- Replace in-memory `waitingPlayers[]` with Redis sorted set keyed by MMR
- Worker daemon: poll every 500ms, pair within ±100 MMR
- **File:** `server.ts` (ioredis), new `MatchmakingWorker.ts`

### 6.2 2v2 Team Mode
- Two teams share a combined hand, alternate sub-turns
- Team voltage pooling: both players' `V` values sum for combo calculations
- **File:** `SovereignEngine.ts`, `server.ts`, `App.jsx`

### 6.3 Observer / Spectator Socket
- Third socket role: `spectator` — read-only `state_resolved` stream
- Read-only HUD with real-time physics readouts and game state
- **File:** `server.ts`, new `SpectatorOverlay.jsx`

### 6.4 Tournament Bracket Engine
- 8-player bracket: 3 rounds → 1 champion
- FSM: `TOURNAMENT_PENDING` → `ROUND_1` → `ROUND_2` → `FINAL`
- **File:** new `TournamentEngine.ts`

**Effort:** ~5 days | **Impact:** Online multiplayer viability

---

## M7 — META-PROGRESSION & ECONOMY COMPLETION

**Goal:** Session-to-session growth loop. Players have reasons to return.

### 7.1 Daily Quests System
- 3 rotating daily quests refreshed at UTC midnight
- Examples: "Win 2 as Crystal", "Deal 30 damage total", "Move 10 tiles in one match"
- Quest progress tracked via event listeners on `state_resolved`
- **File:** new `DailyQuestEngine.ts`, `DatabaseSyncManager.ts`

### 7.2 Card Rarity & Shard Crafting
- 4 tiers: Common / Rare / Epic / Legendary — border glow: grey / blue / purple / gold
- Crafting: smelt duplicate cards → essence → synthesize rare cards with modified V/R
- **File:** `DatabaseSyncManager.ts`, new `CraftingSimulator.ts`, `itemsCatalog.ts`

### 7.3 Player Title System
- Earned titles displayed in lobby and HUD: "Ohm's Apostle", "Void Weaver", "Arena Collapser"
- Stored as JSON array in `players.titles` column
- **File:** `DatabaseSyncManager.ts`, `LobbyScreen.jsx`

### 7.4 Season Pass Structure
- 30-tier seasonal XP-gated reward track: card backs, hero skins, avatar frames
- **File:** new `SeasonEngine.ts`, `DatabaseSyncManager.ts`

### 7.5 PostgreSQL Production Migration
- Migrate from SQLite to PostgreSQL for production deployment
- JSONB columns for inventory/quests with GIN indexes
- Prisma schema alignment and migration scripts
- **File:** Prisma schema, `DatabaseSyncManager.ts`

**Effort:** ~6 days | **Impact:** Player retention loop

---

## M8 — BIG DATA ANALYTICS & AUTO-BALANCING

**Goal:** Data drives game balance automatically. ML pipeline detects and corrects imbalances.

### 8.1 K-Means Auto-Balance Agent
- Clusters cards by `(avg_voltage, avg_resistance, win_rate)` → detects OP outliers
- Writes `rule_adjustments.json` with recommended parameter changes
- **File:** `analytics/balance_analyzer.py` (new)

### 8.2 Hot-Reload Rule Patches
- `server.ts` watches `rule_adjustments.json` via `fs.watch()` → reloads `PHYSICS_ACTION_DATASET` live
- No server restart required for balance updates
- **File:** `server.ts`, `PhysicsActionDataset.ts` (make dataset mutable)

### 8.3 ClickHouse Telemetry Ingestion
- Batch write all trace events to ClickHouse for deep analytics
- Structured message per action: voltage, resistance, current, hero state, hex coordinates
- **File:** `ClickHouseTelemetryClient.ts` (enhance), `server.ts`

### 8.4 Player Behavior Clustering
- Archetypes: Aggressor / Defender / Trickster / Chaos Agent
- Drives adaptive AI difficulty in vs AI mode
- **File:** `analytics/player_clusters.py` (new), `NPCScriptDirector.ts` (new)

### 8.5 Win-Rate Regression Dashboard
- Faction balance prediction via regression model
- Real-time imbalance alerts in admin dashboard
- **File:** `analytics/winrate_regression.py` (new), admin panel

**Effort:** ~5 days | **Impact:** Self-balancing game ecosystem

---

## M9 — PRODUCTION HARDENING & LAUNCH

**Goal:** Production-ready deployment with security, monitoring, and horizontal scaling.

### 9.1 Security
- JWT authentication for player sessions
- Rate limiting on all API endpoints (Redis-based)
- Input validation and sanitization on all WebSocket messages
- **File:** `server.ts`, new `auth/JWTManager.ts`

### 9.2 Kubernetes Orchestration
- Game rooms as isolated Kubernetes pods (SovereignEngine per match)
- API gateway routes to room pods via match ID
- Horizontal pod autoscaling based on active matches
- **File:** K8s manifests, `docker-compose.yml` (extend)

### 9.3 Monitoring & Alerting
- Health check endpoints for all services
- Prometheus metrics: match count, latency, error rate, DB connections
- Grafana dashboard templates
- **File:** monitoring configs

### 9.4 CDN & Asset Optimization
- Static assets (textures, fonts) via CDN
- Lazy loading for 3D models and particle systems
- Texture atlas optimization for hex tiles
- **File:** `CanvasRenderer3D.jsx`, Vite config

### 9.5 Localization
- Expand translations beyond Czech/Slovak: English, German, Polish
- Translation keys for all UI strings and card descriptions
- **File:** `packages/shared/src/data/translations/`

**Effort:** ~5 days | **Impact:** Production launch readiness

---

## Architecture Dependency Map

```
M0 Stabilization          → foundation (no deps)
M1 Painted Realm          → M0 clean baseline
M2 Card Animations        → M1 (consistent visual tokens)
M3 Biome Expansion        → M1 (biome specs + prop system)
M4 AI Enhancement         → M0 (stable engine)
M5 Void Walker            → M0 + M1 (faction visuals)
M6 Multiplayer Scale      → M5 (all factions balanced first)
M7 Economy Completion     → M6 (stable multiplayer DB)
M8 Auto-Balancing         → M7 (production DB + telemetry volume)
M9 Launch                 → M8 (balanced + monitored)
```

**Parallelizable:** M1+M4, M2+M3, M5+M6

---

## Sprint Schedule

| Sprint | Milestone | Effort | Priority | Key Deliverable |
|:---|:---|:---|:---|:---|
| Sprint 1 | M0 — Stabilization | 2 days | P0 | Clean commit, CI tests, performance baseline |
| Sprint 2 | M1 — Painted Realm | 5 days | P0 | Complete visual identity overhaul |
| Sprint 3 | M2 — Card Animations | 2 days | P1 | Game-feel leap on card plays |
| Sprint 4 | M3 — Biome VFX | 3 days | P1 | World atmosphere depth |
| Sprint 5 | M4 — AI Enhancement | 3 days | P1 | Credible training partner |
| Sprint 6 | M5 — Void Walker + Druid | 4 days | P1 | 2 new playable factions |
| Sprint 7 | M6 — Multiplayer Scale | 5 days | P2 | Redis matchmaking + spectator |
| Sprint 8 | M7 — Economy | 6 days | P2 | Retention loop + PostgreSQL |
| Sprint 9 | M8 — Analytics | 5 days | P2 | ML auto-balancing pipeline |
| Sprint 10 | M9 — Launch | 5 days | P3 | Production deployment |

**Total estimated effort:** ~40 days

---

## Recommended Next Action

> **Start Sprint 1 — M0 Stabilization.**
> Commit all July working-tree changes, tag `v0.9.0-playable`, integrate AI tests into CI, and add a Playwright E2E test for the full AI match flow. This creates a clean, verified baseline before any visual or feature work begins.
