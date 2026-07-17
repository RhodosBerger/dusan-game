# Cross-Component Logging Nomenclature & Matrix

This document defines the standard format and visibility matrix for logging and cross-component communication in the **Poslední Kmen (Sovereign Engine)** monorepo. Conformity to this standard ensures that logs can be automatically parsed as structured strings to diagnose and resolve framework, state-sync, and telemetry issues.

---

## 1. The Standard Log String Pattern

All log statements describing cross-component actions or state updates must match the following pattern exactly:

```text
[<SourceComponent> -> <TargetComponent>] [<LogCategory>] <ActionString> | <Key1>=<Value1> | <Key2>=<Value2> ...
```

### Components Matrix

| Component ID | Description | Technology Stack |
| :--- | :--- | :--- |
| `GO_CORE` | Core Go simulation engine microservice | Go |
| `SERVER` | TS Node.js Express/Socket.io backend | TypeScript |
| `CLIENT_R3F` | React Three Fiber WebGL viewport | React / Three.js |
| `CLIENT_BABYLON` | Alternate BabylonJS viewport | TypeScript / BabylonJS |

### Log Categories

*   `TELEMETRY`: Raw metrics, coordinates, state values, or performance timings.
*   `STATE_SYNC`: Turn changes, thread state mutations, or tile walkability updates.
*   `PHYSICS`: Voltage changes, combo triggers, or structural terrain collapses.
*   `ML_INFERENCE`: Spawner predictions, fatigue ratings, or player gaze tracking telemetry.
*   `FRAMEWORK_ERR`: Compiler issues, DB drift, schema anomalies, or connection drops.

---

## 2. Component Visibility and Communication Matrix

The matrix below shows which components are permitted to log state interactions:

| Source \ Target | `GO_CORE` | `SERVER` | `CLIENT_R3F` | `CLIENT_BABYLON` |
| :--- | :--- | :--- | :--- | :--- |
| **`GO_CORE`** | Direct (Internal) | HTTP Response | N/A | N/A |
| **`SERVER`** | HTTP API Request | Direct (Internal) | WebSocket Emit | WebSocket Emit |
| **`CLIENT_R3F`** | N/A | WebSocket Event | Direct (Internal) | N/A |
| **`CLIENT_BABYLON`** | N/A | WebSocket Event | N/A | Direct (Internal) |

---

## 3. Example Log Formats by Vector

### A. Go Core to TypeScript Server (`GO_CORE` -> `SERVER`)
Used when Go Core responds to pathfinding or environmental flux calculations.
*   **Format**: `[GO_CORE -> SERVER] [PHYSICS] Calculated environmental flux | biome=TOXIC_SWAMP | hazardIndex=0.80 | conductivity=0.90`
*   **Format**: `[GO_CORE -> SERVER] [STATE_SYNC] A* Pathfinder solved steps | start=0x00 | end=0x2B | stepsCount=3`

### B. TypeScript Server to React Client (`SERVER` -> `CLIENT_R3F`)
Used when turn steps change, or when tiles sink authoritatively.
*   **Format**: `[SERVER -> CLIENT_R3F] [STATE_SYNC] Tile collapsed authoritatively | chunkId=0 | blockId=1 | isSunk=true`
*   **Format**: `[SERVER -> CLIENT_R3F] [TELEMETRY] Daily quest completed | playerId=player_id | questKey=DEAL_DAMAGE | rewardXp=50`

### C. TypeScript Server to BabylonJS Client (`SERVER` -> `CLIENT_BABYLON`)
Used to propagate weather transitions to BabylonJS fog controls.
*   **Format**: `[SERVER -> CLIENT_BABYLON] [PHYSICS] Weather transitioned | oldWeather=CLEAR | newWeather=BLIZZARD`

### E. Client to Server WebSocket Updates (`CLIENT_R3F` -> `SERVER` / `CLIENT_BABYLON` -> `SERVER`)
Used when a user plays a card or initiates movement.
*   **Format**: `[CLIENT_R3F -> SERVER] [PHYSICS] Played card cast | cardId=voltage_surge | cost=3 | targetChunk=2`
*   **Format**: `[CLIENT_BABYLON -> SERVER] [STATE_SYNC] Movement triggered | threadId=thread_king_ai | fromChunk=0 | toChunk=1`

---

## 4. Framework Diagnostic Resolutions

When parsing these logs to resolve framework anomalies, telemetry scripts must verify:
1. **Coordinate Drift**: Coordinate values (e.g. `start=0x00`) must match hexadecimal notation or axial `M<Chunk>_S<Hex>` format.
2. **Phase Invariant**: Log events occurring under `STATE_SYNC` must align with the active game phase (e.g. Mulligan log sequences should not contain combat outcomes).
3. **Latency Peaks**: Telemetry performance times (`cpuMs=0.45`) exceeding `2.0ms` on Go Core solvers trigger performance governor scaling events.
