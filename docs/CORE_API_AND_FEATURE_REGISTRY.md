# Core API & Monorepo Feature Registry

This document serves as the master API lookup index for all TypeScript, Node, Go, and WebAssembly functions within the Dušan Game monorepo. Use this registry to map functionality into new layout modules, combat controllers, or serverless adapters.

---

## 1. Shared Integration Layer (`packages/shared`)

### A. GoCoreMediator Class
*   **Location**: `packages/shared/src/core/GoCoreMediator.ts`
*   **Exports**:
    *   `serializeCanvasGrid(tsNodes: HexNode[]): GoBatchRequest`
        *   *Purpose*: Forward parses front-end R3F HexNode structures into Go-compatible batch request objects.
    *   `deserializeGoGrid(goBlocks: GoBlockResponse[], tsNodes: HexNode[]): HexNode[]`
        *   *Purpose*: Reverse parses compiled Go response matrices back into client-side state parameters.
    *   `solvePhysicsCost(baseCost: number, metaId: number, hexId: number, fallbackMultiplier?: number): Promise<GoPhysicsCostResponse>`
        *   *Purpose*: Resolves grid AP cost by querying the Go microservice `/api/physics/energy-cost` with local TS math fallback on network failures.
    *   `resolveCombatDamage(req: GoCombatRequest): Promise<GoCombatResponse>`
        *   *Purpose*: Queries `/api/combat/resolve` on the Go backend or evaluates the combat formula locally.
    *   `validateUIElementAvailability(node: HexNode, activeThreatsCount: number): { placeable: boolean; reason: string }`
        *   *Purpose*: Validates walkability and hazard thresholds before rendering actor placement options in the UI.

### B. UniversalWasmBridge Class
*   **Location**: `packages/shared/src/core/UniversalWasmBridge.ts`
*   **Exports**:
    *   `loadModule(wasmBinary: ArrayBuffer): Promise<WasmModuleExports>`
        *   *Purpose*: Instantiates raw Go, Rust, or C++ WebAssembly binaries inside client worker threads.
    *   `getTsFallbacks(): WasmModuleExports`
        *   *Purpose*: Returns local JavaScript equivalent methods to prevent execution halts if WASM load fails.

---

## 2. Server Analytics & Database Sync (`packages/server`)

### A. TelemetryBigQueryService Class
*   **Location**: `packages/server/src/services/TelemetryBigQueryService.ts`
*   **Exports**:
    *   `logEvent(sessionId: string, eventType: string, theoryData: Record<string, any>): void`
        *   *Purpose*: Logs custom telemetry payloads to the `game_events_telemetry` SQLite table.
    *   `getSummary(sessionId: string): TelemetrySummary`
        *   *Purpose*: Computes and returns event category frequencies for a specific session.
    *   `getHighStressSectors(sessionId: string): StressSectorsReport`
        *   *Purpose*: Filter blocks where hazard stress index exceeded `0.7`.

### B. DatabaseSyncManager Class
*   **Location**: `packages/server/src/models/DatabaseSyncManager.ts`
*   **Exposed Getter**:
    *   `getDbInstance(): any`
        *   *Purpose*: Returns the underlying `DatabaseSync` sqlite connection to execute raw query statements.

---

## 3. Client Serverless Connector (`packages/client`)

### A. VercelCMSHelper Utility
*   **Location**: `packages/client/src/utils/VercelCMSHelper.js`
*   **Exports**:
    *   `syncBoardState(sessionId, elapsedTurns, boardNodes): Promise<any>`
        *   *Purpose*: Posts visual board elements to `/api/canvas/sync` with automated `localStorage` cache retries during drops.
    *   `calculateGoPath(startCoords, endCoords): Promise<any>`
        *   *Purpose*: Invokes Go serverless pathfinding calculations over `/api/go/pathfind` with linear interpolation fallbacks.
