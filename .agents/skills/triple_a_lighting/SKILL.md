---
name: triple_a_lighting
description: Triple-A Cinematic Lighting, Dynamic Atmosphere, and Volumetric Light Rays (God Rays) implementation rules.
---

# Triple-A Cinematic Lighting & Dynamic Atmosphere Guidelines

This document details the architectural rules and implementation patterns for rendering high-fidelity, cinematic environmental lighting and rendering effects in the Sovereign engine.

## 1. Dynamic Background & Environment Lighting Phases
*   **Dynamic Cycle Modulations**: The background color and distant environment outside the active game grid must modulate dynamically based on game phases (e.g., Mulligan, Combat, Turn transitions) and current active turn telemetry.
*   **Volumetric Fog & Saturation**: Distant scene elements must merge with dense volumetric fog gradients using rich cinematic color palettes. Fog color must adjust automatically between deep cybernetic teals, purple eclipses, and bright radioactive greens.

## 2. Volumetric Light Rays (God Rays) Simulation
*   **Ray Casting Projection**: Volumetric light rays must be cast from the key directional light sources into empty spaces of the arena.
*   **Mesh-Based Light Shafts**: Because native WebGL shaders must prevent TDP spikes and run efficiently on dynamic governor-controlled devices, god rays must be implemented using pre-cached, transparent conical/cylindrical meshes featuring custom fading materials rather than heavy screen-space post-processing passes.
*   **Dynamic Rotation & Pulsing**: Light shafts must rotate and pulse in intensity over time to create a living, breathing cinematic atmosphere.

## 3. High-Contrast Saturation Rules
*   **Visual Hierarchy**: Maintain a sharp visual contrast between the lit game board (the hexagons) and the dark, atmospheric open space behind it.
*   **Saturation Balance**: Environment colors should feature high saturation in neon-glowing regions and dark, low-saturation tones in empty spatial regions to match modern cinematic color-grading profiles.

## 4. Soft Volumetric Blending (Vertex Fade Practices)
*   **Vertex Softening**: To prevent visible sharp edges/vertices on volumetric mesh shapes (like God Ray cylinders):
    *   Set `depthWrite: false` and `transparent: true` on the material.
    *   Utilize `blending: THREE.AdditiveBlending` to merge overlapping light volumes smoothly.
    *   Map a radial gradient texture (fading out towards the edges) to the cylinder material rather than using solid colors, or apply vertex color interpolation to fade the cylinder's top and bottom caps.
    *   Keep cylinder geometries open-ended (`openEnded: true` in CylinderGeometry) so the top/bottom caps do not render sharp, flat circular shapes.

## 5. Bioshock Infinite-Inspired Bokeh Atmospheric Shaders
*   **Bokeh Circle Texture**: Create soft circular particle maps with a dense bright core and a wide, out-of-focus blurred halo.
*   **Dreamy Floating Simulation**:
    *   Set blending mode to `AdditiveBlending` with a warm amber or pastel turquoise tint.
    *   Configure particles to rise with a non-linear velocity curve (using sinusoids to mimic floating thermal updrafts).
    *   Modulate size over time (pulsing scale) and opacity (shimmering) to simulate light refraction through atmospheric moisture.
