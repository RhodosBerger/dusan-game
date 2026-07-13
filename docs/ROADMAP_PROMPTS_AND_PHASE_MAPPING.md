# Actionable Prompts & Phase Integration Guide

This guide maps out the remaining implementation phases from the roadmap and provides ready-to-run prompts to guide subsequent coding sessions.

---

## Phase 1: Client-Side WebAssembly Math Integration (Q3 2026)

### 📌 Remaining Targets:
*   Compile Go Core algorithms (`packages/go-core/wasm/main.go`) to `wasm32`.
*   Establish Vite runtime loading configuration for `.wasm` files.
*   Bridge native methods to `UniversalWasmBridge.ts`.

### 💬 Execution Prompt:
```markdown
# Role & Task
Implement Phase 1 of the WASM integration roadmap:
1. Create packages/go-core/wasm/main.go declaring exported pathfinding (A*) and combat damage math resolvers.
2. Compile the Go core to wasm32: GOOS=js GOARCH=wasm go build -o packages/client/public/go_core.wasm packages/go-core/wasm/main.go.
3. Update packages/shared/src/core/UniversalWasmBridge.ts to load go_core.wasm dynamically via WebAssembly.instantiateStreaming.
4. Verify compiling wasm is fully integrated with vite.config.js asset handling.
```

---

## Phase 2: Self-Hosted Data Pools & ClickHouse Telemetry (Q4 2026)

### 📌 Remaining Targets:
*   Docker compose file exposing ClickHouse instance on port 8123.
*   Local database migrations and event routing from express server.
*   SQLite fallback client integration when ClickHouse is offline.

### 💬 Execution Prompt:
```markdown
# Role & Task
Implement Phase 2 of the data pools roadmap:
1. Create a root-level docker-compose.yml setting up ClickHouse (port 8123) and Adminer.
2. Create packages/server/src/models/ClickHouseTelemetryClient.ts connecting to localhost:8123.
3. Write database schema migrations for combat resolution and terrain stress events.
4. Set up an automatic SQLite database fallback if the ClickHouse instance is unreachable.
```

---

## Phase 3: Visual Logic Composer & CMS Extension (Q1 2027)

### 📌 Remaining Targets:
*   Draggable nodes/connectors inside the React `SovereignBoardComposer.jsx` dashboard.
*   Exporting dynamic schemas representing path scripts and triggers.

### 💬 Execution Prompt:
```markdown
# Role & Task
Implement Phase 3 of the CMS extension roadmap:
1. Introduce React-Draggable or standard HTML5 drag-and-drop handles inside packages/client/src/components/SovereignBoardComposer.jsx.
2. Allow designers to connect nodes and write triggers (e.g. "On Enter -> Deform Tile Height").
3. Export these layouts as JSON schemas matching the scenario database format.
```
