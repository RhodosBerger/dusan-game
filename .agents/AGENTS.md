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
