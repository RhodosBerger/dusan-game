# Architectural Spec: Multi-Stream Priority Matrix & Camera Focus Pipeline

This specification defines the architectural integration of multiple asynchronous data streams (player hovers, socket server events, camera lenses, and post-processing states) resolved through centralized rules and axioms.

---

## 1. Centralized Priority Matrix (Rules & Axioms)

To prevent render loop congestion and OS scheduler spikes, all incoming data streams are resolved through a unified **Priority Matrix** before reaching the WebGL rendering loop.

```
[ Player Hover Stream ] ──► (100Hz Throttle) ──┐
                                               ├──► [ Centralized Priority Matrix ]
[ Server Event Stream ] ──► (Instant Push)  ───┤      - Resolves conflicts via Axioms
                                               ├──► [ Post-Processing Stream ]      - Triggers render updates
[ Camera Focus Stream ] ──► (Lerped Focus)  ───┘
```

### Stream Classification & Axioms:
1.  **Axiom 1 (Preemption)**: Server state events (e.g. Combat Resolution or Turn Phase change) immediately preempt cursor hover animations.
2.  **Axiom 2 (Coalescing)**: Hover coordinate events are throttled and coalesced to a maximum of 10Hz to prevent unnecessary vertex recalculations.
3.  **Axiom 3 (Deterministic Output)**: Post-processing variables (e.g. Glitch Pass intensity) must be calculated on the server-resolved state rather than volatile client-side calculations.

---

## 2. Server Event Mapping & Multi-Turn Positions

To support multi-turn replay, predictive paths, and combat backtracking, positions are structured as a temporal matrix:

$$\mathbf{M}(t) = \begin{bmatrix} 
x_{0} & y_{0} & z_{0} \\ 
x_{1} & y_{1} & z_{1} \\ 
\vdots & \vdots & \vdots \\ 
x_{n} & y_{n} & z_{n} 
\end{bmatrix}$$

Where $t$ represents the turn number. This enables the following capabilities:
*   **Predictive Path Overlay**: Renders the expected movement of NPC units over the next 3 turns using faint dashed lines on the hex grid.
*   **Combat Echoes (Post-VFX)**: Renders ghost silhouettes at the position vector of the previous turn $t-1$, which fade out slowly using additive blending.

---

## 3. Hover Coordinate Focus & Camera Lens Adjustments

Hovering over tactical hexes does not just highlight the tile; it directly updates the **Three.js PerspectiveCamera** focal parameters:

```javascript
// Pattern for Camera Lens Focus Adjustment
useFrame((state, delta) => {
    if (hoveredNodePosition) {
        // Calculate target camera lookAt vector
        const targetLookAt = new THREE.Vector3(
            hoveredNodePosition[0],
            hoveredNodePosition[1] + 0.5,
            hoveredNodePosition[2]
        );
        
        // Smoothly interpolate (LERP) camera focus point
        state.camera.lookAt(
            THREE.MathUtils.lerp(currentLookAt.x, targetLookAt.x, 0.05),
            THREE.MathUtils.lerp(currentLookAt.y, targetLookAt.y, 0.05),
            THREE.MathUtils.lerp(currentLookAt.z, targetLookAt.z, 0.05)
        );

        // Adjust focal length (simulate dynamic depth of field)
        if (postProcessingPasses.depthOfField) {
            postProcessingPasses.depthOfField.target = targetLookAt;
        }
    }
});
```

*   **Focal Zooming**: Hovering over high-hazard zones (e.g., Toxic Swamp or Void Rifts) triggers a minor lens zoom and increases post-processing vignette intensity to create strategic tension.
*   **Target Invalidation**: When the hover targets an invalid node, the camera smoothly returns to the active player's miniature position.

---

## 4. Asynchronous Phase Refresh API Endpoints

To synchronize the game loop across turns, the server provides endpoints to pull the resolved state asynchronously. This allows the client to fetch state transitions without blocking the rendering thread:

*   `GET /api/match/phase` - Pulls the current phase (`MULLIGAN`, `PREPARATION`, `ACTION`, `INTERRUPT`).
*   `POST /api/match/evaluate` - Triggers a dry-run evaluation of the action network to return potential damage/movement outcomes before executing them on-chain.
