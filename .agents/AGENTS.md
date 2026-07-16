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
*   **Hardware-Adaptive Governor & Instance Culling**: The rendering environment must query `HardwareGovernor.updateProfile(deltaMs)` dynamically on frame updates to obtain active performance limits. On low-end systems, the renderer must enforce aggressive vertex and prop culling (clamping instanced props to 20 instead of 100), clamp solver complexity (KCL Gauss-Seidel iterations down to 16), throttle uniform writes to 5Hz, and disable volumetric fog passes to keep framerate above target levels without resetting the WebGL context.

## 6. Monorepo Architectural Cohesion & Layer Integrity
*   **Layer Boundary Isolation**:
    *   **Go Core boundaries**: All Go algorithms (`packages/go-core`) must remain decoupled from TypeScript runtime systems. Expose them solely via HTTP API endpoints (`/api/...`). Keep the TS fallbacks (`packages/shared` or `packages/server`) fully aligned and updated to ensure seamless operation when the Go server is offline.
    *   **Go Core Simulation Bridge**: Any simulation algorithm ported to the Go Core microservice must maintain exact mathematical parity (character hashing, XOR math) with the local TypeScript fallback classes, allowing seamless, identical outputs regardless of the failover gateway state.
    *   **Shared Logic separation**: Do NOT write platform-specific imports (e.g., Node `fs`, `path`, or browser DOM references) inside `packages/shared`. Shared code must compile cleanly for both web browser and Node environments.
    *   **State Separation**: Keep database-persistent client profile/upgrading economy actions strictly separate from active in-match gameplay state loops.
    *   **Decoupled Balancer & Evaluator Boundaries**: Core priority calculation utilities (like `RenderPriorityBalancer`) must reside in `packages/shared` and accept structural state parameters rather than direct imports of server/client specific classes. This ensures they compile cleanly in both web and Node runtimes without duplicate implementations or circular dependencies.

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
*   **Phase-Modulated Layering**: Viewport state rendering must adapt dynamically to active gameplay phases (MULLIGAN, ACTION, COMBAT, END). Instead of instantiating phase-specific assets, modulate the pre-cached geometric layers:
    - **Mulligan Phase**: Lower structural heights, dim neon outlines, and throttle cosmetic portal rotations.
    - **Combat Phase**: Introduce high-frequency structural height jitter/vibrations and double cosmetic rotation speeds.
    - **End Phase**: Sink structural and cosmetic meshes below the viewport fog line.
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

## 13. Monorepo Port Conflict & Dependency Debugging
*   **Docker Port Release**: Before starting local development servers via `./start-dev.sh` or `./start-babylon-dev.sh`, verify if docker containers are already bound to ports `3001` or `8081`. If they are, release them first using:
    ```bash
    docker-compose down
    ```
*   **React Hook Imports**: Always verify that all React hooks (`useRef`, `useMemo`, `useEffect`, `useState`) are explicitly imported from the `'react'` library in the file header. Unimported hooks cause silent runtime crashes in the browser.
*   **Fused Card Parity**: When defining or updating gameplay-specific objects (like card fusions or instructions), ensure that all properties (such as `cost`, `desc`, `parentTypes`, `helperStats`) are declared as optional on the base model class (`Instruction.ts`) to maintain TypeScript compatibility during runtime assignments.

## 14. SQLite Schema Synchronization & Decoupled Integrations
*   **Prisma SQLite Schema Sync**: For SQLite database model additions during development, avoid generating long migration histories if drift is detected. Use `npx prisma db push --accept-data-loss --schema=packages/server/prisma/schema.prisma` followed by `npx yarn workspace @dusan-game/server db:seed` to force-sync and populate test data.
*   **Decoupled Quest Sync Pattern**: Database quest updates must construct wrapper interfaces (like `ServerQuestIntegration`) to translate Prisma models into shared `Quest` objects. Call the pure logic `QuestTriggerManager.updateQuestProgress` in memory, then compare and write only the diffed progress/completed statuses back to the database.

## 15. High-Aesthetic WebGL & Procedural Mesh Code Structuring
*   **Smooth Frame-Delta Animations (In-Loop Lerping)**: NEVER update React component state variables inside a React Three Fiber `useFrame` loop to animate rotations, scale pulses, or float animations. Instead, use mutable refs (e.g. `ref.current.position.y += Math.sin(state.clock.elapsedTime) * delta`) or linear interpolations (`THREE.MathUtils.lerp`) directly on the underlying `THREE.Mesh` instance. This prevents unnecessary React reconciliation cycles and garbage collection spikes.
*   **Unified Lighting & Environmental Post-Processing**: Keep all scene lighting (ambient light, directional shadow-casting sun lights, volumetric fog nodes) contained in a single top-level environment container (e.g., `CanvasRenderer3D.jsx`) rather than instantiating local light objects inside individual tile components. This ensures a consistent lighting direction and color temperature across all game nodes.
*   **Draco GLTF Asset Loading Pattern**: For high-quality 3D character and structural models (GLB files loaded via `useGLTF`), always configure the loader to use the Draco decoder:
    ```ts
    useGLTF.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    ```
    Models should be pre-loaded at the Lobby/Matchmaking screen using `preloadAllHeroModels()` to eliminate in-match asset-loading stutters.
*   **Dynamic Visual Phase Modulations**: Modulate aesthetic properties (glow intensity, neon edge colors, structural heights) smoothly based on active game phases (`MULLIGAN`, `COMBAT`, `END`) using pre-cached geometric layers rather than reloading assets or meshes.

## 16. Authoritative Weather Action Tensors & Environmental Flux
*   **Server-Driven Weather Transitions**: Card plays containing semantic weather designations (e.g. `toxic`, `acid`, `void`, `collapse`, `crystal`, `laser`) must evaluate and trigger weather changes authoritatively on the server.
*   **Grid Parameter Modification**: Retrieve all active grid blocks, calculate new physical parameters (friction, conductivity, hazardIndex) using `GoCoreMediator.calculateEnvironmentFlux`, and update the database/memory grid state before broadcasting.
*   **Broadcast Event Pattern**: Emit a `weather_change` WebSocket event containing the new weather state to all connected clients in the match rather than having the client compute weather overrides independently.

## 17. Springy UI/UX Transitions & Micro-Delays
*   **Elastic Easing Curves**: All hover, selection, and translate transitions for cards and critical HUD buttons must use an elastic overshoot Bezier curve (`cubic-bezier(0.34, 1.56, 0.64, 1)`) to create a springy, premium feel.
*   **Tactile Cast Delays**: Card plays from drag-and-drop must trigger a client-side visual cast/dissolution animation (e.g. `card-cast-lift` flying animation) and delay the WebSocket event transmission to the server by exactly `300ms` using `setTimeout`. This allows the card to animate and float away before the server resolves action results.
*   **Interactive Button Scaling**: Key HUD buttons (e.g. `Town Shop`, `End Turn`, `Execute`) must scale up (`scale(1.06)`) and glow on hover, and scale down (`scale(0.95)`) on click/active states.

## 18. Full-Screen 3D Viewport & Overlay Coexistence
*   **Full-Screen 3D Viewport Layout**: The WebGL Canvas must occupy the absolute full screen (`absolute inset-0 w-full h-full z-0` or equivalent) rather than being split horizontally (e.g., `70vh`/`30vh` layouts) with solid background divs. All UI overlays, status dashboards, and hand cards must float transparently on top of this full-screen canvas.
*   **WebGL Overlay Label Suppression**: Any 3D spatial HTML overlays (such as `@react-three/drei`'s `<Html>` labels or 2D FlatBillboards displaying memory registers, target predictors, distance metrics, and vector trajectories) must be conditionally hidden (`!isOverlayActive` or similar props) whenever a full-screen overlay (like `MULLIGAN` phase selection or `GAME_OVER` screen) is active to prevent visual overlapping and glitches.
