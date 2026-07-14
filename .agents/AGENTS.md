# Project Rules: Poslední Kmen & Sovereign Engine

## 1. WebGL & Three.js Rendering Optimization Rules
*   **Geometry & Material Caching**: NEVER instantiate new materials or geometries inside component render loops or sub-meshes. Always cache them using `useMemo` at the top component/Canvas level and share them across meshes to prevent GPU memory bloat and garbage collection spikes.
*   **Instanced Rendering**: For any repeated biome props (trees, stones, crystals, spikes, pools) or recurring environmental objects, utilize `<instancedMesh>` instead of manual loop rendering of single meshes. Set instance positions, scales, and rotations using transform matrices in a `useLayoutEffect` hook mapped to the grid data.

## 2. Procedural Gameplay-Graphics Integration (Ubisoft AAA Pillars)
*   **Pillar 1: Terrain Height Deformation**: Connect combat combo events (like Voltage Surge) to local height transforms. Elevate or sink hex tile positions (`position.z` inside rotated R3F groups) smoothly using lerp functions during active combo frames.
*   **Pillar 2: Material Distribution**: Apply scorched textures and emissive changes (such as red hot ember glows and dark charcoal base tints) dynamically when Short Circuits occur to visualize physical grid degradation.
*   **Pillar 3: Collision-Free Spawning**: All dynamically spawned objects (loot chests, traps, units) must verify spawner guards (`block.walkable === true && block.threadId === null`) and align their height offset exactly with the extruded tile's top face to prevent clipping.

## 3. Stateless Faction Mechanics
*   **Environmental Scaling**: Faction energy consumption rules (like Void Walker casting) must dynamically adapt based on environmental variables (such as `globalEntropy > 0.7` reducing card cost to `0`). Ensure these are resolved consistently in both `SovereignEngine.ts` and `server.ts`.

## 4. Pipeline & Monorepo Build Rules
*   **Dependency Cache Layering**: In all Dockerfiles, copy the top-level package config and sub-project `package.json` configurations prior to running package installation. Keep code copy instructions after package installs to preserve Docker cache layers.
*   **Monorepo Package Manager Consistency**: Always use `yarn` command line interfaces and workspace tasks (`yarn workspace <name> <cmd>`) to execute sub-project scripts. Do NOT execute `npm` commands inside monorepo packages to prevent lockfile conflicts.

## 5. GPU & TDP Power-Safety Rules (Axiomatic Performance Verification)
*   **TDP & Shader Execution Limits**: Native WebGL shaders must enforce a strict complexity ceiling. Fragment shaders must avoid dynamic loop branching and limit texture lookups to a maximum of 3 per pass. Dynamic uniforms representing grid overload states must be throttled or debounced (maximum frequency of 10Hz) to prevent excessive GPU register changes that trigger power spikes and thermal throttling (TDP exceeding bounds).
*   **Overload Calculation Optimization**: Any rendering component that displays grid overloads (e.g., glowing edges, short-circuit sparks) must use instanced particles with pre-calculated vertex offsets. Particle count is limited to a maximum of 128 active elements per chunk, preventing CPU-GPU bottlenecking during high entropy grid collapse states.
*   **Axiomatic Spawner Validation**: Any environmental or combat element spawned onto the canvas must pass a performance validation check (`block.hazardIndex < 0.9` and active threads in chunk < 6) before rendering high-fidelity meshes. Elements that fail these constraints must fallback to low-poly placeholder billboards to preserve framerate.
*   **Dynamic OS Governor Coexistence**: Avoid sudden execution peaks that trigger OS governor frequency spikes. Pathfinding requests and heavy physics loops must be throttled or distributed over consecutive frames (batching) when concurrent action queue density > 10. Frame pacing must be dynamically clamped to target balanced thermal profiles (65°C - 75°C) to coexist efficiently with CPU/GPU schedulers.
*   **Procedural Render Layering**: Procedural mesh generation must be split into Critical (colliders/walkability), Structural (base terrain), and Cosmetic (props/effects) layers, staggered over a 3-frame initialization cycle.
*   **Time-Sliced Pathfinder**: Pathfinding computations for concurrent NPC AI must be queued and limited to a 2ms time-slice budget per frame, deferring additional searches to subsequent frames to avoid CPU throttling.

## 6. Monorepo Architectural Cohesion & Layer Integrity
*   **Layer Boundary Isolation**:
    *   **Go Core boundaries**: All Go algorithms (`packages/go-core`) must remain decoupled from TypeScript runtime systems. Expose them solely via HTTP API endpoints (`/api/...`). Keep the TS fallbacks (`packages/shared` or `packages/server`) fully aligned and updated to ensure seamless operation when the Go server is offline.
    *   **Go Core Simulation Bridge**: Any simulation algorithm ported to the Go Core microservice must maintain exact mathematical parity (character hashing, XOR math) with the local TypeScript fallback classes, allowing seamless, identical outputs regardless of the failover gateway state.
    *   **Shared Logic separation**: Do NOT write platform-specific imports (e.g., Node `fs`, `path`, or browser DOM references) inside `packages/shared`. Shared code must compile cleanly for both web browser and Node environments.
    *   **State Separation**: Keep database-persistent client profile/upgrading economy actions strictly separate from active in-match gameplay state loops.

## 7. Dead Code Pruning & Clean Up Protocol
*   **Dead File Identification**: Before implementing new features or resolving issues, identify and prune legacy/unused debug scripts, disconnected telemetry files, or redundant simulator duplicates (e.g., old combinatorics, duplicate model schemas) to prevent codebase bloat.
*   **Disconnection Verification**: A file is only considered dead if:
    1. It has no import references in active modules of `packages/client`, `packages/server`, or `packages/shared`.
    2. It is not referenced in package scripts (`package.json`) or workflow pipelines (`Jenkinsfile`, `ci.yml`).
*   **Safe Pruning Steps**:
    1. Verify file references using global grep searches.
    2. Delete the disconnected file.
    3. Run monorepo compiler builds:
       ```bash
       npx yarn workspace client build
       npx yarn workspace @dusan-game/server build
       ```
    4. Run the full test suite (`packages/server/src/testEngine.ts`) to ensure 100% green compilation.

## 8. Advanced Isometric & Oblique Camera Guidelines (2.5D RTS Camera)
*   **Locked Perspective & View-Aligning Panning**: The 3D viewport must enforce a fixed 2.5D projection (using low field-of-view PerspectiveCamera `fov = 20-30` or OrthographicCamera) to maintain visual uniformity. Rotational user inputs must be disabled (`enableRotate={false}`). Map panning (mouse drag or WASD/Arrow keys) must translate both target and position coordinates synchronously along the ground plane X/Z rotated matching screen space projection.
*   **Contextual Slant & Zoom Profiles (Oblique Adaptation)**: Camera angles (pitch, yaw) and zoom levels (distance, FOV) must be computed dynamically as a function of the focused tile (selected, hovered, or active unit). Pitch (elevation slant) and yaw (heading deviation) must smoothly lerp on frame ticks in-place via direct control-constraint mutation rather than component re-renders to prevent GC spikes. Spacebar must always reset camera lock back to the active unit's coordinate anchor.

## 9. Advanced Topological Grid Animation & Shared Geometry Rules
*   **Radial Ripple Waves (Pillar 1 Extension)**: Card plays or high-energy actions must dispatch topological radial waves that deform the height map. Hexagon nodes must dynamically calculate their local elevation displacement using cartesian distance from the action epicentre, staggered by propagation delays (`delay = distance * speed_coefficient`) using simple sines for smooth rise-and-sink ripples.
*   **Decoupled Dual-Tiered Hex Structures**: Hexagon map tiles must render as double-layered structures (an outer extruded base and a nested inner tech-plate overlay) to maximize visual depth and cybernetic aesthetic. Base shapes, bevel outlines, and cylinder stalactites must be cached at the module level and shared across all 63 nodes via scale modifiers to avoid redundant object instantiation.

## 10. WebGL Viewport State Synchronization & 3D Backoffice Previews
*   **Continuous Rotation Refs**: Any 3D canvas previewer component in React must preserve intermediate rotation angles (e.g., `anglesRef = React.useRef({ x: 0, y: 0 })`) and restore them on hook recreation. This ensures continuous, smooth rotation when the user is editing JSON code in the textarea.
*   **Procedural Config Previews**: Selection of configuration files (e.g., in `configs/`) must render a procedurally generated 3D Gear mesh (connecting 24 front/back outer teeth vertices) on the preview canvas to visualize backend engine loops.
*   **Animated Trajectory Loops**: The backoffice CMS Keyframes panel must render a live 3D preview player (`KeyframePreview3D`) to animate the active walk formula and variant multiplier in a real-time looping preview.
*   **Throttled Database Telemetry**: WebGL CustomMaterial uniform updates driven by database sets (e.g., polling SQLite register address `0x4F` or `0x5A`) must be debounced to a maximum update frequency of 10Hz to prevent GPU register power spikes.
*   **Staggered Render Layers**: Procedural terrain generation must stagger map construction across a 3-frame cycle (`requestAnimationFrame` for Critical, Structural, and Cosmetic layers) to eliminate startup stutters.
*   **Spawner Guard Fallbacks**: Spawned objects must verify safety parameters (`block.hazardIndex < 0.9` and chunk threads count `< 6`) before rendering high-fidelity meshes; elements failing this check must fallback to low-poly 2D billboards.

## 11. TypeScript Strict Union Type Enforcement
*   **No Invalid Union Comparisons**: When comparing typed fields originating from `packages/shared/src/core/types.ts` (e.g., `CardEffect`, `BiomeType`, `CardColor`, `DamageType`), NEVER compare them against string literals that are NOT declared members of the union type. TypeScript will emit error `TS2367` ("This comparison appears to be unintentional because the types have no overlap"), causing `ts-node` (and therefore the `nodemon` server process) to crash immediately at startup — **making the game completely non-functional without any obvious client-side error**.
*   **Fallback Pattern for Card Abilities**: If a card mechanic (e.g., `stealth`, `blink`, `curse`) has no corresponding `CardEffect` enum value, detect it exclusively via the raw `cardId` string pattern matching:
    ```ts
    // CORRECT — safe string pattern, no type conflict
    if (baseCardId.toLowerCase().includes('stealth')) { ... }

    // WRONG — causes TS2367 crash if 'stealth' is not in the CardEffect union
    if (specs.effect === 'stealth') { ... }
    ```
*   **Diagnosis Reminder**: When the game appears to accept socket connections but never responds to `start_match` events, always check `babylon-server.log` for `TSError: ⨯ Unable to compile TypeScript` before investigating gameplay logic — a crashed server process is the most common root cause.

## 12. Geometric Compiler & Modifier Stack Design Pattern
*   **Non-Destructive Modifier Pipeline**: Any procedural mesh generation reacting to real-time developer/DevOps telemetry (LOC, compile time, test pass rates) must be implemented as a sequence of non-destructive modifiers (e.g., `ArrayModifier`, `HeightDeformModifier`, `GearTeethModifier`) acting on pre-cached base templates. Do NOT delete or re-instantiate meshes from scratch inside render loops; mutate parameters in-place or update custom shader uniforms.
*   **Combinatoric Shape Aggregation**: Spawning of complex mesh configurations must utilize a pre-allocated pool of assets assembled based on statistical/probabilistic weight trees (e.g., matching biome characteristics and hazard indices) rather than hardcoded conditional structures.
*   **Hardware Coexistence**: Telemetry updates modulating mesh modifiers must be throttled/debounced (maximum update frequency of 10Hz) to allow the OS dynamic frequency governor to settle, preventing TDP/VRAM power spikes.
*   **Semantic RAG Shape Library & Layer Coherence**: Any procedural mesh generated from semantic text descriptors (words/phrases) must resolve its geometry parameters (scale, vertex offsets, bevel) through a mapped shape dictionary (RAG library). The sampled geometries must be structured into independent but aligned rendering layers (Critical colliders, Structural base, Cosmetic overlays) sharing common top-face height bounds and snap-to offsets to ensure topological cohesion.
*   **Procedural Timeline Keyframing**: Actions and card plays mapped to RAG tag-pairs must translate their deterministic hashes into animation sequences (squash/stretch ratios, Bezier control tangents) played in-place without mesh re-instantiation, utilizing cached templates to maintain balanced thermal and TDP profiles.



