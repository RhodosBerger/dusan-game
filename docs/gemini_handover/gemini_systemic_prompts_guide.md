# Gemini Handover: Systemic Prompts & Agent Delegation Guide

This sheet is designed to onboard the next Gemini/LLM instance, establishing systemic rules and execution patterns to guide future code delegation.

---

## 1. Architectural Boundaries (Rule 6)
*   **Go Core Isolation**: Expose Go Core algorithms solely via HTTP endpoints (e.g., `/api/pathfinder`, `/api/environment/flux`). TypeScript backend code MUST maintain local parity fallbacks in case the Go Core microservice goes offline.
*   **Decoupled Shared Package**: Do NOT write platform-specific imports (Node `fs`, `path`, or browser DOM/window variables) inside `packages/shared`. Shared code must compile cleanly for both environments.
*   **State Separation**: Keep database-persistent profiles/upgrading economies separate from active gameplay/match loop states.

---

## 2. WebGL Rendering & TDP Safety constraints (Rule 1 & 5)
*   **Geometry/Material Caching**: Do NOT instantiate materials/geometries in render loops. Cache them using `useMemo` at the top level and share them across meshes to prevent GPU bloat.
*   **Instanced Rendering**: Utilize `<instancedMesh>` instead of loops for repeated environmental props.
*   **OS Governor & GPU Coexistence**: Limit texture lookups to 3 per pass in shaders. Debounce SQLite register and telemetry uniform updates to a maximum frequency of 10Hz.
*   **Staggered Initialization**: Terrain generation must stagger construction across a 3-frame cycle (`requestAnimationFrame` for Critical, Structural, and Cosmetic layers) to eliminate startup stutters.
*   **Pathfinder Time-Slicing**: Pathfinding computations for NPCs must be batched and limited to a strict 2ms time-slice budget per frame.

---

## 3. Systemic Prompt Checklists for Future Modifications

When delegated tasks by the user, the agent MUST run through the following checklists:

### A. TypeScript Strict Union Type Enforcement (Rule 11)
*   **No Invalid Union Comparisons**: When comparing typed fields from `packages/shared/src/core/types.ts`, NEVER compare them against string literals that are not declared members of the union type (emits compiler error `TS2367`).
*   **Ability Fallbacks**: Detect card mechanics without direct enum matches using string pattern matching on the `cardId` (e.g., `cardId.toLowerCase().includes('stealth')`).

### B. Clean-Up Protocol & Dead Code Pruning (Rule 7)
*   Before implementing new features, run global grep searches to identify and delete disconnected debug files, duplicate model schemas, or redundant simulator scripts.
*   After pruning, run monorepo compiler builds to confirm clean compilation:
    ```bash
    yarn workspace client build
    yarn workspace @dusan-game/server build
    ```
*   Run the integration tests to confirm 100% green status:
    ```bash
    npx ts-node packages/server/src/testEngine.ts
    ```

### C. Development Mode Launch Instructions
*   Always check if background docker containers are running (`docker ps`). If ports 3001 or 8081 are occupied, release them with:
    ```bash
    docker-compose down
    ```
*   Launch development servers using:
    ```bash
    ./start-dev.sh
    ```
*   If editing Go files, always ensure that both `main.go` and `pathfinder.go` are executed together.
