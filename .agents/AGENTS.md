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
