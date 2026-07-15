# Poslední Kmen - Interactive Demo Guide

Welcome to the interactive preview of **Poslední Kmen** (Sovereign Engine). This guide outlines how to launch the demo, navigate the lobby, play against the AI, and control the advanced graphics and backend systems.

---

## 🚀 1. How to Launch the Game

To launch the local development ecosystem, execute the following script in the repository root:
```bash
./start-dev.sh
```
This script starts three distinct microservices running locally:
1.  **Vite Client** (Frontend): `http://localhost:5173/`
2.  **Sovereign Node.js Server** (Orchestrator): `http://localhost:3001/`
3.  **Go Core Microservice** (Authoritative Math & Pathfinding): `http://localhost:8081/`

---

## 🎮 2. Interactive Lobby & Character Matrix

When you open `http://localhost:5173/`, you will be greeted by the **Cybernetic Lobby Screen**. Here you can configure your profile before entering the arena:

-   **Výber Hrdinu (Class Matrix)**: Select your faction archetype:
    -   **Crystal King**: High HP (20), custom armor, and Crystal Shard mastery.
    -   **Toxic Hacker**: Spore-affinity, speed boost on toxic swamps, and poison immunity.
    -   **Void Weaver**: Entropy spell manipulation (free spell cast at >0.70 entropy).
-   **Mashup Rules Selector**: Customize gameplay modifiers (e.g., standard rules vs. frost friction vs. toxic corrosion).
-   **Mazak Grid Preview**: View real-time sector weights representing topological difficulty.

---

## ⚔️ 3. Training Against the Sovereign AI

Click on **🤖 Trénovať proti AI** to start a match:
1.  **3D Hexagonal Viewport**: The top 70% of the screen displays the procedural 3D map featuring distinct biomes (Glacier, Toxic Swamp, Desert, Barrens, Lush Forest).
2.  **Weather Flux Rendering**: Watch how the environment changes color overlays and fog density during TOXIC_STORM or BLIZZARD states.
3.  **Pathfinding & Movement**: Click on your character node and click on a walkable tile to move. The path is calculated in real-time by the high-performance **Go Core A\*** pathfinder.
4.  **Card Casting**: Cast cards from your hand (bottom overlay) onto target tiles to activate abilities, trigger combos, or modify tile states.
5.  **AI Opposition**: The Sovereign AI Opponent Director executes action ticks every second during its turn, making combat active and challenging.

---

## 🔬 4. Advanced Showcase Dashboards

Use the floating panel buttons at the top of the screen to explore specific engine sub-systems:

### 🌌 WebGL Graphics Showcase
-   **Weather setup override**: Force transition states manually (`TOXIC HAZE`, `VOID ECLIPSE`, `AURORA STORM`).
-   **WebKit GPU Compositing**: Toggle hardware-accelerated composite layers (`will-change`, `translate3d`) to verify low-latency input rendering.

### 🧪 Sandbox Kombinatoriky (Combinatorics Sandbox)
-   Form card fusions and evaluate mathematical possibilities (e.g., combining Flame Spores + Nano Reconstructor) to output dynamic fused instructions.

### 📊 Telemetry & DB
-   Inspect real-time telemetry events, SQLite register logs, and ClickHouse data sync status directly from the backend.

### 👑 RPG Class Board
-   Upgrade hero statistics, track daily quests, and distribute collected biome materials.

### 💼 B2B Backoffice Portal
-   Modulate the procedural terrain difficulty matrix, apply custom CSS overrides, and review metrics dynamically.
