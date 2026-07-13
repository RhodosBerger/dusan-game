# Senior Engineering Guide: Integration Roadmap & Coding Standards

This specification details the roadmap and code standards to scale the tactical game engine. It outlines how to structure synchronous execution pipelines, manage high-performance render cycles, and ensure zero-allocation WebGL rendering.

---

## 1. Core Engineering Goals

*   **Zero Dynamic Allocation in Render Loop**: Geometries, materials, and vector structures must never be instantiated within `useFrame` or component render blocks.
*   **Synchronous State Draining**: Consolidate network packet updates, local animations, and physics calculations into a single deterministic sequence.
*   **TDP & CPU Safety**: Throttle shader uniform updates (10Hz max) and NPC pathfinding loops to prevent sudden CPU frequency spikes and thermal throttling.

---

## 2. Integration Roadmap & Milestones

```
[ Milestone 1: Unified Director ] ──► [ Milestone 2: Priority Matrix ]
(Synchronize useFrame Lifecycle)       (Throttling and Event Coalescing)
                                                    │
                                                    ▼
[ Milestone 4: Go gRPC Bridge ]   ◄─── [ Milestone 3: Lens & Post-Proc ]
(Upgrade from REST to HTTP/2)          (Dynamic focal length & visual cue sync)
```

### Milestone 1: Unified Director Loop
*   **Objective**: Standardize the frame cycle around a central director class.
*   **Deliverables**: Restructure `CanvasRenderer3D` to run its lifecycle sequentially (network drain -> physics -> animations -> rendering).

### Milestone 2: Centralized Priority Matrix & Coalescing
*   **Objective**: Throttle inputs and resolve event overlaps.
*   **Deliverables**: Create the `StreamPriorityResolver` to queue and evaluate event priorities (e.g. preempting cursor hovers for combat animations).

### Milestone 3: Dynamic Camera Lens & Post-Processing Sync
*   **Objective**: Connect tactical focus changes to camera focal parameters and post-processing uniforms.
*   **Deliverables**: Implement smooth camera LERPing on hovered nodes and coordinate vignette/glitch shaders with active game realities.

### Milestone 4: Go Microservice Transition
*   **Objective**: Upgrade server communication from REST to binary gRPC over HTTP/2.
*   **Deliverables**: Implement Protobuf schemas for A* pathfinding and combat computations.

---

## 3. Senior Coding Standards & Reference Implementation

### Pattern A: Zero-Allocation Geometry & Material Caching
To adhere to **Rule 1 (Geometry & Material Caching)**, never use inline mesh geometry declarations. Define them at the top module or component level:

```javascript
// Good Practice: Pre-allocated and cached geometries and materials
const GEOMETRIES_CACHE = {
    joint: new THREE.SphereGeometry(0.06, 8, 8),
    limb: new THREE.CylinderGeometry(0.06, 0.05, 0.28, 5)
};

const MATERIALS_CACHE = {
    armor: new THREE.MeshStandardMaterial({
        color: '#ffd700',
        roughness: 0.5,
        metalness: 0.8
    })
};

export default function ThreadMiniature({ thread }) {
    // Re-use cached structures directly, avoiding garbage collection spikes
    return (
        <group>
            <mesh geometry={GEOMETRIES_CACHE.limb} material={MATERIALS_CACHE.armor} />
        </group>
    );
}
```

### Pattern B: Event-Driven Refs (Zero React Re-renders)
Avoid React state hooks (`useState`) for updates that execute multiple times per second (e.g., hover coordinates, animations, combat highlights). Use mutable refs and listen to window events:

```javascript
// Good Practice: Using refs to bypass React rendering tree update cycles
export function AnimatedCombatNode() {
    const attackProgressRef = useRef(1.0);

    useEffect(() => {
        const triggerAttack = () => {
            attackProgressRef.current = 0.0; // Start animation sequence
        };
        window.addEventListener('hero_attack_start', triggerAttack);
        return () => window.removeEventListener('hero_attack_start', triggerAttack);
    }, []);

    useFrame((state, delta) => {
        if (attackProgressRef.current < 1.0) {
            // Update values directly in the ref
            attackProgressRef.current = Math.min(1.0, attackProgressRef.current + delta * 1.25);
            // Manipulate mesh rotation/transform directly
        }
    });
}
```

### Pattern C: Throttled Shader Uniform Updates
Writing to GPU registers is an expensive operation. Throttling uniform updates protects lower-end machines from TDP power overloads:

```javascript
// Good Practice: Throttling GPU uniform updates
let lastUpdateTime = 0;
const UNIFORM_UPDATE_THRESHOLD = 0.1; // 10Hz limit

useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    if (elapsed - lastUpdateTime > UNIFORM_UPDATE_THRESHOLD) {
        // Perform expensive uniform assignment
        myShaderMaterial.uniforms.uRealityIntensity.value = state.clock.getElapsedTime();
        lastUpdateTime = elapsed;
    }
});
```
