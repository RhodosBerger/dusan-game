# Future Integration Roadmap & Goals: Scaled Self-Hosting & WASM Ecosystem

This document outlines the strategic roadmap, dev effectiveness enhancements, and architecture for self-hosted data pools, client-side WebAssembly execution, and multi-tenant deployment.

---

## 1. Strategic Goals & Vision

To grow the Dušan Game into a community-driven, platform-agnostic gaming framework, our goals focus on:
1.  **Zero-Latency Client Math**: Shift CPU-bound computations (pathfinding, collision matrices, combat resolving) from centralized servers directly to the client's browser using WebAssembly.
2.  **Self-Hosted Analytics Pools**: Establish open-source big data telemetry adapters (e.g. SQLite + ClickHouse) that developers can run locally in Docker containers without cloud database dependencies.
3.  **Visual Logic Composition**: Expand the `SovereignBoardComposer` into a complete game constructor allowing non-technical designers to visually map triggers, quests, and combat interactions.

---

## 2. Dynamic Integration Roadmap

```
  [ Phase 1: Client Edge (WASM) ]
  ├── Compile Go-Core to wasm32
  └── Load dynamically via UniversalWasmBridge
                 │
                 ▼
  [ Phase 2: Self-Hosted Data Pools ]
  ├── Dockerize ClickHouse telemetry adapter
  └── Implement SQLite fallback migrations
                 │
                 ▼
  [ Phase 3: Visual Logic & CMS Extension ]
  ├── Visual Node Trigger editor in Board Composer
  └── Export unified JSON schemas to Vercel/Docker Edge
```

### Phase 1: Client-Side WebAssembly Math (Q3 2026)
*   **Target**: Move standard pathfinding computations to the client browser.
*   **Actions**:
    *   Map Go Core functions in `packages/go-core/wasm/main.go`.
    *   Configure Vite to load `go_core.wasm` asynchronously.
    *   Provide strict TypeScript fallback calculations if WASM loader fails.

### Phase 2: Open-Source Data Pools & Telemetry (Q4 2026)
*   **Target**: Decouple analytics logging from third-party APIs using containerized SQL databases.
*   **Actions**:
    *   Build a ClickHouse Docker configuration in `docker-compose.yml` to sink events logged by `TelemetryBigQueryService`.
    *   Integrate a SQLite database fallback if the telemetry analytics container is offline.

### Phase 3: Visual Logic Composer & CMS (Q1 2027)
*   **Target**: Allow junior developers and designers to build interactive game rulesets via the UI.
*   **Actions**:
    *   Introduce draggable logic nodes inside [SovereignBoardComposer.jsx](file:///home/rhoddos_berger/Documents/Github/dusan-game/packages/client/src/components/SovereignBoardComposer.jsx).
    *   Add validation schemas to check for invalid biome transitions or out-of-bounds entity placements.

---

## 3. Developer Effectiveness & Code Gen

To streamline open-source contributions:
*   **Protobuf Compilation Script**: A build target that generates Go structs and TypeScript interfaces from a single `.proto` file, guaranteeing API synchronization across modules.
*   **Visual Sandbox Environments**: Standardized npm start scripts to launch client, server, and Go core runtimes in watch mode, allowing developers to debug parts in isolation.
