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
