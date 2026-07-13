# Architectural Blueprint: Unified Frame Loop & Go Core Scaling Spec

This blueprint defines the architecture to merge disparate execution loops into a single synchronous rendering and logic pipeline. It also specifies how the game engine scales when running multiple WebGL canvas instances, advanced post-processing, and a high-performance Go core.

---

## 1. The Loop Congestion Problem (Current State vs. Goal)

Currently, the game runs several independent asynchronous loops:
1.  **WebGL Render Loop**: Renders meshes and lights at 60-120fps (`requestAnimationFrame`).
2.  **Gameplay State Loop**: Runs turn calculations, cooldown ticks, and phase checks.
3.  **Network Socket Loop**: Receives state syncs (`state_resolved`) and dispatches commands.
4.  **Go Core Solver Loop**: Executes REST API calls for pathfinding and combat calculations.

### The Problem
*   **Race Conditions**: UI actions executing during render cycles cause visual stuttering or out-of-bounds entity reads.
*   **TDP & CPU Spikes**: Asynchronous pathfinding and physics queries cause sudden OS governor frequency spikes.
*   **Memory Bloat**: Repeated garbage collection (GC) pauses occur due to independent allocations per loop frame.

---

## 2. Proposed Cohabitation: The Synchronous Frame Pipeline

We propose unifying all gameplay updates, physics ticks, and network updates into a single synchronized lifecycle within the Three.js rendering frame.

```
       [ RequestAnimationFrame / useFrame Tick ]
                          │
                          ▼
             [ STAGE 1: Network Drain ]
         (Consume Socket queue, apply diffs)
                          │
                          ▼
             [ STAGE 2: Physics & Combos ]
       (Update velocities, detect collisions, 
        trigger local gravity well metrics)
                          │
                          ▼
         [ STAGE 3: Go Core Batch Solver Query ]
       (If action triggered, fetch batch pathfind/
        combat resolutions from Go core cache)
                          │
                          ▼
            [ STAGE 4: Geometry Update ]
        (Mutate pre-allocated node matrices, 
         update joint angles of 3D models)
                          │
                          ▼
             [ STAGE 5: Render & Post-Proc ]
       (Draw meshes, apply Bloom/Glitch passes)
```

### Implementing in React Three Fiber (`CanvasRenderer3D.jsx`)
We utilize a **Central Game Director** class that collects inputs, updates state, and renders in a single `useFrame` callback:

```javascript
// Example implementation pattern for the unified loop
useFrame((state, delta) => {
    // 1. Drain network commands
    networkQueue.drain(gameState);

    // 2. Resolve local physics and movement transitions
    physicsEngine.tick(gameState, delta);

    // 3. Update character joint angles and keyframe positions
    animationSystem.updateJoints(delta);

    // 4. Update GPU shader uniforms (throttled to 10Hz to prevent TDP spikes)
    if (state.clock.getElapsedTime() - lastUniformUpdateTime > 0.1) {
        updateShaderUniforms(state);
        lastUniformUpdateTime = state.clock.getElapsedTime();
    }
});
```

---

## 3. Scaling WebGL Multi-Instances & Post-Processing

### A. Sharing Resources across Multiple Canvas Views
When the application displays split-screens or separate dashboards (e.g. split combat view and real-time telemetry analytics):
*   **Shared WebGL Contexts**: Instead of instantiating multiple independent Canvas rendering contexts (which duplicates GPU memory and compiles shaders multiple times), we compile geometries and materials inside a root `WebGLProvider`.
*   **Portal Rendering**: Render multiple viewports inside a single Canvas context using Three's `.setViewport` and `.setScissor` bounds.

### B. High-Fidelity Post-Processing Passes
We structure the post-processing chain to compile into a single rendering pass:
1.  **SMAA (Subpixel Morphological Antialiasing)**: High-quality anti-aliasing with low GPU power consumption.
2.  **Selective Bloom (Neon Emissive Glow)**: Applies only to active grid overloads, short-circuit sparks, and character glow points.
3.  **Glitch Pass (Reality Distortion)**: Linked directly to the game's active reality phase. When a `GLITCH` reality occurs, the glitch pass magnitude is updated via the unified frame loop.

---

## 4. Go Core Microservice Scaling Path

As the codebase scales from sandbox to production:
*   **Upgrade from HTTP to gRPC over HTTP/2**: Replaces JSON serialization overheads with binary Protobuf encoding, reducing latency for batch pathfinding and combat resolution queries.
*   **WebAssembly (WASM) Compilation**: For single-player offline setups, the Go core can compile directly to WASM, running deterministically inside the browser thread without network latency.
*   **Asymmetric Threading**: Computations for NPC pathfinding are queued in Go and resolved in chunks, respecting the **2ms time-slice limit** specified by project rules.
