# Repository Introspection & Core Knowledge Base

This document synthesizes the monorepo architecture, cataloging core systems, security sandboxes, visual rendering optimization, and the CI/CD DevOps matrix.

---

## 1. Monorepo Module Inventory

Our system is structured into four primary technology domains, communicating via type-safe API bridges and WebAssembly runtimes:

| Package Domain | Technology Stack | Key Responsibilities |
| :--- | :--- | :--- |
| **`packages/go-core`** | Go (1.21) | Main engine for pathfinding (A*), biome terrain generation, and combat algebra. |
| **`packages/shared`** | TypeScript (5.x) | Shared definitions, translation adapters (`GoCoreMediator`), and WASM execution bridges (`UniversalWasmBridge`). |
| **`packages/server`** | Node.js, Express, SQLite | Match session state machines, database persistence, quest telemetry, and analytical query engines (`TelemetryBigQueryService`). |
| **`packages/client`** | React, R3F, Vite | 3D canvas, visual droids, Oxygen/Elementor visual composer (`SovereignBoardComposer`), and Vercel proxy adapters (`VercelCMSHelper`). |

---

## 2. Pushing the Boundaries: Functional Pipelines Implemented

### A. Dynamic Mesh Animation & Zero-Allocation Caching
*   **Hierarchical 3D miniatures** replace flat sprite billboards inside `ThreadMiniature.jsx`.
*   Smooth joint rotations (`Walk`, `Jump`, `Attack`, `Stealth`) swinging in the `useFrame` loop are updated via refs, avoiding React rendering pipeline overhead (**Rule 1 & Rule 5**).

### B. Reversible Parsing & Fallback Resilience
*   The `GoCoreMediator` handles forward parsing (TS grid -> Go Core request shape) and reverse parsing (Go parameters -> TS HexNode properties) seamlessly.
*   If backend services are offline, the system automatically falls back to local deterministic TypeScript math libraries, keeping the game functional without network reliance.

### C. Self-Hosted Serverless Emulation
*   We simulate Vercel serverless edge routing locally using an Express proxy router (`self-hosted-router.js`), translating `vercel.json` path allocations into Docker container proxy bindings.

---

## 3. Future Scaling Tracks (DevOps & Technology Scaling)

To continue expanding the game codebase, we propose three modular integration paths:

### Track 1: WebAssembly (WASM) Client Execution
Compiling `go-core` into WebAssembly using:
```bash
GOOS=js GOARCH=wasm go build -o go_core.wasm packages/go-core/wasm/main.go
```
This enables zero-latency client-side calculations and absolute offline execution.

### Track 2: Multi-Language Serialization (Protobuf)
Replacing REST APIs with Protocol Buffers (`schema.proto`) to auto-generate serialization classes for C++ physics layers, Rust solvers, or Python AI agents.

### Track 3: Automated DevOps Verification
Enhancing the `Jenkinsfile` CI/CD pipeline to compile WASM, build Docker images with dependency caching, and deploy to Kubernetes or AWS ECS sequentially.
