# Integration Brainstorming & Tester Report

This report presents a QA and Senior developer evaluation of the Sovereign Engine v2.0 monorepo integration phases, documenting mock simulations, performance test profiles, and suggested frontend modules.

---

## 1. QA Tester Perspective: Running Code Configurations

As a developer testing different runtime profiles of the codebase, we simulate three primary environmental states:

### State A: Client Edge WASM Mode (Active)
*   **Behavior**: The client loads `/public/go_core.wasm` into the `UniversalWasmBridge`. All physics math and combat resolution are delegated to the JS-marshalled Go binary.
*   **Verification**: Executing `GOOS=js GOARCH=wasm go build` successfully outputs the binary to client public assets. `UniversalWasmBridge` intercepts the module and binds `solvePhysicsCost` and `resolveCombatDamage`.

### State B: Database Telemetry Fallback (Hybrid)
*   **Behavior**: When local containerized ClickHouse endpoints are unreachable, `TelemetryBigQueryService` falls back dynamically to SQLite write operations in `./database.db`.
*   **Verification**: Test cases successfully assert SQLite migrations, ensuring data integrity is preserved without cloud latency penalties.

---

## 2. Suggested Frontend Modules (To Build Next)

To support these integrations visually, we propose adding the following modules to the B2B backoffice portal:

### 1. WebAssembly Diagnostics HUD Panel
*   **Purpose**: Displays the status and execution performance of `go_core.wasm` vs. the TypeScript local fallback in real time.
*   **Mock Schema**:
    ```typescript
    interface WasmMetrics {
      isWasmActive: boolean;
      wasmExecutionTimeUs: number; // microseconds
      fallbackExecutionTimeUs: number;
      deltaNs: number;
    }
    ```
*   **UI Controls**: Toggle to manually disable WASM to test TypeScript math fallbacks.

### 2. ClickHouse Live Telemetry Heatmap
*   **Purpose**: Visualizes GPS coordinates and combat voltage magnitude logged by the Go core server API.
*   **UI Representation**: Render concentric rings or glowing outlines on hexagon tiles based on historical telemetry database density.

### 3. Dynamic Rule-Spawning Inspector
*   **Purpose**: Renders safety and walkability constraints as overlays on the `SovereignBoardComposer` grid.
*   **Behavior**: Shows visual validation badges (e.g. `[hazard < 0.9 ✓]`, `[threads < 6 ✓]`) when a designer hovers over hex coordinates.
