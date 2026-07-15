# Gemini Handover: Completed Priorities & Features

This sheet documents the completed gameplay features, rendering optimizations, and backend integrations implemented in **Poslední Kmen (Sovereign Engine)**.

---

## 1. High-Performance Go Core & Pathfinder Bridge (Goal 8 & 9)
*   **A* Pathfinder (`pathfinder.go`)**: High-efficiency pathfinding algorithm using axial coordinates on the hexagon grid. It determines neighbors based on Cartesian distance ($\le 3.5$) and evaluates tile walkability and NPC collision guards.
*   **Environmental weather flux (`environment_flux.go`)**: Weather flux calculation that dynamically shifts node properties based on the weather state:
    -   `TOXIC_STORM`: Sets node `hazardIndex = 0.8` and `conductivity = 0.9`.
    -   `BLIZZARD`: Sets node `friction = 2.0` (frozen plates) and `hazardIndex = 0.4`.
    -   `CLEAR`: Resets node properties to nominal values (`friction = 1.0`, `hazardIndex = 0.0`, `conductivity = 0.5`).
*   **Mediator Bridge (`GoCoreMediator.ts`)**: Synchronizes Go Core algorithms (HTTP `/api/...` endpoints) with the TypeScript server runtime, with complete local mathematical parity fallback in case the Go Core service is offline.

---

## 2. Advanced 3D Viewport & Rendering Rules (WebGL & Three.js)
*   **Phase-Modulated Layering**: Viewport state rendering shifts dynamically with game phases (MULLIGAN, ACTION, COMBAT, END) by modulating pre-cached geometric layers rather than instantiating new assets:
    -   `MULLIGAN`: Dim neon outlines, lowered plate heights, throttled portal ring rotations.
    -   `COMBAT`: High-frequency structural height jitter/vibrations and doubled cosmetic portal ring rotation.
    -   `END`: Sinks structural and cosmetic meshes below the viewport fog line, portal rings disabled.
*   **Instanced Rendering (Rule 1)**: Employs `<instancedMesh>` for environmental biome props (trees, stones, crystals) and particles. Avoids material/geometry instantiation in render loops by caching with `useMemo`.
*   **Locked 2.5D Camera Slants (Rule 8)**: PerspectiveCamera locked (`fov = 25`) with disabled rotational input. Panning translates target and position synchronously along the Ground Plane X/Z space. Camera pitch and yaw slant smoothly in-place on frame ticks based on the active/selected unit.

---

## 3. Sovereign Card Fusion & Physics-Topological Integration
*   **Topological Ripple Waves**: Cast cards trigger cartesian radial height ripples across the hex grid, propagating from the epicenter with delay offsets (`delay = distance * speed_coefficient`) using simple sine functions.
*   **Fused Card Parity**: Fuses multiple cards together, yielding custom instructions. Fused properties (`cost`, `desc`, `parentTypes`, `helperStats`) are declared as optional on the base model class (`Instruction.ts`) to maintain compatibility.

---

## 4. Telemetry, Database, and Cognitive Interfaces
*   **SQLite Debounced WAL**: Debounces WebGL CustomMaterial uniform updates driven by SQLite database writes to a maximum of 10Hz to prevent GPU register power spikes and TDP throttling.
*   **ClickHouse Telemetry**: Feeds big data gameplay metrics to ClickHouse for post-match analysis.
*   **OpenVINO Fatigue Gaze Tracking**: Integrates webcam-based fatigue index analytics. High fatigue indexes (>0.6) trigger an entropy stress penalty at turn end, elevating global entropy.
*   **Sovereign LIFO Arbiter**: Manages stack-based interrupt resolution window timing during action turns.
