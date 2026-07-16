---
name: modern-ux-design
description: Design manual for Hearthstone-style tactile cards and Dota 2-style multi-layered HUD dashboards.
---

# Hearthstone & Dota 2 Modern UX Design Manual

This manual provides strict guidelines for implementing tactical card layouts and HUD status dashboards to ensure a premium AAA aesthetic.

## 1. Hearthstone-Inspired Card Layout
All client-side playable cards must be structured using the following design tokens:
*   **Cost Badge (Top-Left)**: A prominent crystal/diamond-shaped badge (`hs-card-cost-badge`) styled with a glowing radial gradient blue crystal texture and a drop shadow.
*   **Oval Art Frame (Top-Center)**: A central oval-shaped artwork container (`hs-card-art-frame`) featuring a gold/bronze border and faction-specific pulsing energy shaders or SVG gradients.
*   **Name Banner (Center)**: A horizontal wood/stone textured ribbon/banner (`hs-card-name-banner`) centered across the card's middle axis with high-contrast text.
*   **Scroll Description Box (Bottom)**: A dark parchment-like text area (`hs-card-desc-box`) that displays the action specifications, using italicized serif fonts.
*   **Border-Overlapping Stat Badges (Bottom Corners)**: Attack/Voltage values on the bottom-left inside a red star badge, and Defense/Resistance values on the bottom-right inside a blue shield badge.

## 2. Dota 2-Inspired HUD Layout
Status and telemetry HUD elements must prioritize high-aesthetic visual depth:
*   **Multi-layered Status Dashboard**: HUD headers must feature dark stone/metallic textured containers with high specular reflections.
*   **Glowing Progress Bars**: Health, mana, and entropy progress gauges must use vibrant neon gradients (green/cyan/magenta) overlaid with absolute value text.
*   **Absolute Coordinates**: Telemetry widgets and console windows must be positioned absolutely around the viewport boundaries, separated into left status and right action panels to keep the central 3D canvas unobstructed.
*   **Springy Transitions**: Key interactive controls, buttons, and drawers must use custom cubic-bezier animations (`cubic-bezier(0.34, 1.56, 0.64, 1)`) for premium springy scaling on hover and click states.
