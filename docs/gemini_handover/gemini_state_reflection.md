# Gemini Handover: Current State & Reflection

This sheet reflects the current state of the **Poslední Kmen** codebase, detailing recently resolved issues, directory organization, and active operational states.

---

## 1. Directory Structure & Key Files

The project is structured as a yarn monorepo:
*   `packages/go-core/`: Core Go logic.
    -   `main.go`: API router, startup config, combat/simulation math, and environmental flux API.
    -   `pathfinder.go`: Authoritative hex-grid pathfinding logic.
*   `packages/server/`: TypeScript gameplay and telemetry engine.
    -   `src/server.ts`: Node.js Express/Socket.io server. Handles matchmaking, AI turns, and telemetry dashboards.
    -   `src/models/Instruction.ts`: Holds the instruction template/card fusion model definitions.
    -   `src/models/SovereignEngine.ts`: Central simulation coordinator matching parity rules.
    -   `src/testEngine.ts`: Full integration test suite (contains all 95 tests).
*   `packages/client/`: React 19 / Vite client.
    -   `src/App.jsx`: Main UI container, handles layouts (LOBBY, PLAY, BUILDER, COMPOSER, B2B), socket communication, and game state.
    -   `src/components/CanvasRenderer3D.jsx` & `WebGLGraphicsShowcase.jsx`: WebGL canvas integrations.
*   `packages/babylon-sovereign/`: Alternate client viewport employing BabylonJS for 3D renderings.
    -   `src/client/components/BabylonCanvasRenderer.tsx`: Viewport renderer utilizing BabylonJS fog/glow shading dynamically mapping weather.

---

## 2. Reflection on Recent Key Fixes

### A. Client-Side Infinite Rendering Loop
- **Issue**: Vite client was crashing with a `Maximum update depth exceeded` error immediately after loading the game viewport.
- **Root Cause**: The client `App.jsx` component was storing audio and gameplay trackers (`lastActivePlayerId`, `lastHandCount`, `gameEnded`) in React component state (`useState`) and updating them inside a `useEffect` hook that also listened to changes in those same state properties. This triggered an infinite re-rendering cascade.
- **Fix**: Replaced these state trackers with React references (`useRef`):
  ```javascript
  const lastActivePlayerIdRef = useRef(null);
  const lastHandCountRef = useRef(0);
  const gameEndedRef = useRef(false);
  ```
  Updating their `.current` value inside `useEffect` no longer triggers components to re-render, fully resolving the infinite loop and restoring playability.

### B. Instruction Typings Compilation Crash
- **Issue**: The server was failing to build during card fusion due to missing properties on the `Instruction` class.
- **Fix**: Declared properties (`cost`, `desc`, `parentTypes`, `helperStats`) as optional on `Instruction.ts` to allow dynamic structural assignments during runtime.

### C. Go Core Compilation Execution
- **Issue**: Running the dev environment was throwing `undefined: handlePathfinding` because `start-dev.sh` ran `go run main.go` which omitted compiling `pathfinder.go`.
- **Fix**: Updated `start-dev.sh` and `start-go.sh` to compile both Go source files together:
  ```bash
  go run main.go pathfinder.go
  ```
