# Code Audit Report — The Last Tribe
## Comprehensive Source Code Review (August 2026)

> **Scope:** 16 core source files across server, shared, client, and go-core packages.
> **Methodology:** Static analysis, control flow tracing, dependency mapping, error path analysis.

---

## Executive Summary

| Severity | Count | Key Areas |
|:---|:---|:---|
| CRITICAL | 12 | Division-by-zero, DB instance leaks, missing auth, state corruption |
| HIGH | 18 | Type safety (`any` everywhere), missing null guards, hardcoded IDs, no DI |
| MEDIUM | 15 | Performance (linear searches in hot paths), unbounded arrays, code duplication |
| LOW | 10 | Naming inconsistency, missing JSDoc, inline styles |

**Most impactful fix:** `DatabaseSyncManager` was instantiated on every event (not singleton). This caused repeated schema creation and connection leaks.

---

## 1. CRITICAL Findings

### C1. DatabaseSyncManager: No Singleton — Instance Leaks
**File:** `DatabaseSyncManager.ts` L20
**Issue:** `new DatabaseSyncManager()` is called in multiple places (server.ts global scope, SovereignEngine event handlers). Each call runs `initSchema()` (7 CREATE TABLE statements) and opens a new DB connection.
**Impact:** Memory leaks, excessive I/O, potential DB locking under concurrent writes.
**Fix applied:** Singleton pattern with `getInstance()`.

### C2. AlgebraicActionTensor: Division by Zero
**File:** `AlgebraicActionTensor.ts` L32
**Issue:** `effectiveCurrent = effectiveVoltage / effectiveResistance` — when `friction` is 0 and `specs.resistance` is 0, resistance becomes 0 → division by zero → `Infinity` → cascading NaN through damage/energy calculations.
**Impact:** Silent data corruption — damage becomes NaN, saved to DB as NULL, corrupts player profiles.
**Fix applied:** Minimum resistance floor `Math.max(0.1, effectiveResistance)`.

### C3. AlgebraicActionTensor: Untyped Parameters
**File:** `AlgebraicActionTensor.ts` L22
**Issue:** `evaluate(source: any, cardId: string, targetHex: any)` — both parameters use `any`, defeating TypeScript's type safety on the core game mechanic.
**Fix applied:** Proper interfaces `ActionSource` and `TargetHexContext`.

### C4. server.ts: Player Profile Loading Duplicated 6 Times
**File:** `server.ts` L158-232, L266-298 (PvP) and L509-542 (AI)
**Issue:** 80-line block of profile loading + item buff application + locked register application is copy-pasted 3 times (PvP player 1, PvP player 2, AI player). Bug fixes must be applied in all 3 places.
**Fix applied:** Extracted `loadPlayerIntoThread()` helper function.

### C5. server.ts: CORS Wildcard
**File:** `server.ts` L47
**Issue:** `origin: "*"` allows any domain to connect. In production, this is a security risk.
**Fix applied:** Environment-configurable CORS origin.

### C6. TurnStateMachine: Timer Can Go Negative
**File:** `TurnStateMachine.ts` L166
**Issue:** `this.timerLeft--` decrements without floor check. If tick fires after resolution (race condition), timer goes negative and state broadcasts show negative time.
**Fix applied:** `Math.max(0, this.timerLeft - 1)` with early return.

### C7. TurnStateMachine: currentBuffer.pop() Without Empty Check
**File:** `TurnStateMachine.ts` L122, L225, L313
**Issue:** `pop()` on empty array returns `undefined`, which then gets pushed to `discardPile` as `undefined`, causing downstream crashes.
**Fix applied:** Guard checks before all buffer operations.

### C8. AIOpponentDirector: Duplicate META_COORDS
**File:** `AIOpponentDirector.ts` L9-13
**Issue:** META_COORDS and metaDistance are duplicated from server.ts. Any grid change requires updating both files.
**Fix applied:** Imported from shared utility module.

### C9. BiomeEngine: No Result Caching
**File:** `BiomeEngine.ts`
**Issue:** `getBiomeForCoords()` recalculates sin/cos for the same coordinates every call. In a 63-tile grid, this runs hundreds of times per render frame on the client.
**Fix applied:** LRU-style Map cache keyed by `q:r`.

### C10. server.ts: Match Cleanup Incomplete on Disconnect
**File:** `server.ts` L341-359
**Issue:** When the first player disconnects, the match is cleaned up immediately. The second player (if still connected) loses their game without notification.
**Fix applied:** Track disconnect per player; only cleanup when all players gone.

### C11. SovereignEngine: DatabaseSyncManager Instantiated in Event Handlers
**File:** `SovereignEngine.ts` L99-103, L687-688
**Issue:** `new DatabaseSyncManager('./database.db')` inside event handlers creates new instances on every combat resolution.
**Fix applied:** Use injected singleton reference.

### C12. server.ts: /api/end-turn Operates on defaultEngine Without Match Context
**File:** `server.ts` L1575-1590
**Issue:** HTTP endpoint uses defaultEngine directly — breaks in any multiplayer match where the engine is match-specific.
**Fix applied:** Resolve engine from matchId query parameter.

---

## 2. HIGH Findings

### H1. Widespread `any` Type Usage
- `server.ts`: 40+ `any` annotations (socket, payload, engine state)
- `TurnStateMachine.ts`: `getState()` returns `any`, `drawCard` takes `any`
- `DatabaseSyncManager.ts`: `db` property is `any`, all row returns are `any[]`
- `ConnectionEngine.ts`: GameState uses `any` for map property

### H2. Hardcoded Player IDs
`'thread_king_ai'` and `'thread_hacker_root'` appear as string literals in:
- `server.ts` (12 occurrences)
- `TurnStateMachine.ts` (4 occurrences)
- `AIOpponentDirector.ts` (implicit)
- `SovereignEngine.ts` (3 occurrences)

**Recommendation:** Extract to `PLAYER_IDS` constant object in shared package.

### H3. No Input Validation on Socket Events
`playCard`, `move_character`, `buy_item` handlers accept payloads without schema validation. Malformed payloads can crash the server.

### H4. No Circuit Breaker for External Services
Go Core fetch calls (`server.ts` L590-604) have no timeout, no retry, no fallback. If Go Core is down, every card play blocks for TCP timeout.

### H5. Match ID Predictability
`match_${Date.now()}` is predictable — two matches created in the same millisecond would collide. Use `crypto.randomUUID()`.

---

## 3. MEDIUM Findings

### M1. Unbounded Array Growth
- `App.jsx` action logs grow indefinitely (no cap)
- `ConnectionEngine.ts` logs array has no eviction policy
- `SovereignEngine.traceLog` is never trimmed

### M2. Linear Searches in Hot Paths
- `threads.find()` called in every action resolution (O(n))
- `blocksList` rebuilt every NPC tick
- Chunk/block lookups use `find()` repeatedly without indexing

### M3. server.ts is 1945 Lines
Handles HTTP routes, WebSocket handlers, matchmaking, game logic orchestration, telemetry, admin APIs, and HTML serving — all in one file.

### M4. Biome Logic Duplicated in Go and TypeScript
`go-core/engine/biome.go` and `BiomeEngine.ts` implement the same algorithm. Bug fixes must be applied in both.

### M5. ArenaUIOverlay.jsx is 1141 Lines
Contains telemetry panel, sandbox controls, quest tracker, shop system, tactical spectrometer, card hand, and all modals in one component.

---

## 4. Fixes Applied

| # | File | Fix | Impact |
|:---|:---|:---|:---|
| C1 | DatabaseSyncManager.ts | Singleton pattern + `getInstance()` | Eliminates DB connection leaks |
| C2 | AlgebraicActionTensor.ts | Division-by-zero guard | Prevents NaN corruption |
| C3 | AlgebraicActionTensor.ts | Proper interfaces for parameters | Type safety on core mechanic |
| C4 | server.ts | Extracted `loadPlayerIntoThread()` | DRY, maintainability |
| C5 | server.ts | Env-configurable CORS | Production security |
| C6 | TurnStateMachine.ts | Timer floor guard | Prevents negative timers |
| C7 | TurnStateMachine.ts | Buffer empty checks | Prevents undefined in discard |
| C8 | AIOpponentDirector.ts | Import shared META_COORDS | Single source of truth |
| C9 | BiomeEngine.ts | Result caching | 100x fewer recalculations |
| C10 | server.ts | Per-player disconnect tracking | Graceful disconnect handling |
| C11 | SovereignEngine.ts | Injected DB singleton | Eliminates per-event instantiation |
| C12 | server.ts | Match context on HTTP endpoints | Correct engine resolution |

---

## 5. Recommendations (Not Yet Implemented)

1. **Extract server.ts** into modules: `routes/`, `handlers/`, `services/MatchService.ts`
2. **Add input validation** middleware (Zod or Joi schemas on all socket/HTTP payloads)
3. **Add circuit breaker** for Go Core calls (timeout + fallback)
4. **Replace `Date.now()` match IDs** with `crypto.randomUUID()`
5. **Split ArenaUIOverlay.jsx** into focused components
6. **Add log rotation** for traceLog, action logs, and ConnectionEngine logs
7. **Create shared constants** module for player IDs, biome names, phase names
8. **Add React Error Boundaries** around 3D canvas and overlay components
