# Architectural Spec: Multi-Level Integrations & Content Distribution

This specification details our sandbox isolation strategy, monorepo dependency hierarchy, and continuous delivery (CD) pipeline to build, test, and distribute game modules and content configurations independently.

---

## 1. Monorepo Dependency Hierarchy

To support agile module development, packages are structured to prevent circular dependencies. Dependency resolution occurs sequentially:

```
[ packages/shared ]  (Foundation: Types, Interfaces, Fallback Math)
         ▲
         ├────────────────────────────────────────┐
         │                                        │
[ packages/client ] (Front-end)        [ packages/server ] (Back-end)
         │                                        │
         └──────────────────┬─────────────────────┘
                            ▼
                    [ packages/go-core ] (Decoupled Engine Core)
```

1.  **Shared Library (`@dusan-game/shared`)**: Serves as the foundation. Imported by both the client and server. Must not import any code from `packages/client` or `packages/server`.
2.  **Go Core Microservice (`packages/go-core`)**: Wholly independent. It compiles and exposes endpoints or WebAssembly binaries without loading any external Node/JS dependency.
3.  **App Client (`packages/client`)** & **CMS Server (`packages/server`)**: Import `@dusan-game/shared` to share coordinate grids, mediators, and validation helper methods.

---

## 2. Independent Sandbox Execution (Agile Module Design)

Each module can run as a standalone sandbox to isolate testing:

*   **Go Core Sandbox**: Run `go test ./...` inside `packages/go-core` to verify A* pathfinding and biome allocation without starting any typescript web server.
*   **Server Engine Sandbox**: Execute `npx ts-node packages/server/src/testEngine.ts` to run turn state resolution, SQLite CRUD template operations, and Big Data queries.
*   **Client Editor Sandbox**: Run `yarn workspace client dev` to launch the Vite dev server, allowing designers to prototype layouts visually using `SovereignBoardComposer` with mock data.

---

## 3. Dynamic Content Distribution (CD) Pipeline

To distribute new layouts, themes, and combat configurations dynamically to running clients without redeploying the entire codebase:

### Phase A: Schema Extraction
When a designer completes a layout board in `SovereignBoardComposer`, the configuration is exported as a serialized JSON theme configuration.

### Phase B: Serverless Ingestion
The JSON configuration is posted to our Vercel-routed database server:
*   `POST /api/v1/canvas/sync` (node middleware)
*   Saves the layout record in SQLite `reality_templates` table.

### Phase C: Edge Distribution
1.  **Vercel Edge Caching**: The newly registered templates are instantly served on `GET /api/v1/themes/active` routes.
2.  **Multi-Docker Sync**: In a self-hosted environment, the Client Edge Router proxies requests dynamically, distributing the updated grid configurations to all active playrooms instantly.
3.  **Local Storage Fallbacks**: If clients lose internet connectivity, the Vercel helper caches layout states locally and retries the sync when online.
