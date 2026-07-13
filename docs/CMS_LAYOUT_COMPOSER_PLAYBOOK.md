# Junior & Medior Playbook: CMS Layout Board Composer

This guide explains how junior and medior developers can extend, customize, and compose tactical grid plates and design templates using polymorphic component nodes in the UI.

---

## 1. Concept: Polymorphic Layout Composers

The **SovereignBoardComposer** allows designers and junior developers to prototype game layouts visually. 
*   Instead of coding coordinates manually in database migrations, developers select a layout template (e.g. `GLACIER_ARENA` or `SWAMP_CAGE`) and click to add or replace nodes.
*   **Polymorphic Variants**: Each slot on the board is a polymorphic design node. Clicking "Swap Polymorphic Variant" replaces the standard tile metadata with a specific variant preset (e.g., `VOID_RIFT`, `TOXIC_SLUDGE`, `TOWN_MARKET`) instantly changing the color, walkability, friction, and hazard values.

```
       [ Layout Board Component ] (SovereignBoardComposer.jsx)
                   │
                   ├─► Select: standard hex node ──► Swap: VOID_RIFT
                   │
                   └─► Result: Mesh changes color to purple, sets walkable = false
```

---

## 2. Dynamic Template Integration Path

When creating new layouts for customer staging boards:
1.  **Define Node Presets**: Modify `NODE_TEMPLATES` inside [SovereignBoardComposer.jsx](file:///home/rhoddos_berger/Documents/Github/dusan-game/packages/client/src/components/SovereignBoardComposer.jsx) to add new structures (e.g., `EMP_MIND_BOMB`, `NANO_HEALING_WELL`).
2.  **Add Preset Boards**: Add pre-configured layout arrays in `PRESET_BOARDS` to allow users to bootstrap custom scenes instantly.
3.  **UI Component Rendering**: The center canvas renders a mapping of elements. Select state is bound to the sidebar inspector to edit `Coord X`, `Coord Y`, and node identifiers.

---

## 3. Reference Walkthrough for Junior Developers

### Step A: Adding a new Custom Node
*   Click the **"+ Add Custom Node"** button in the left sidebar footer.
*   A new node is placed at coordinate `[0, 0]` with a standard grey color.
*   Select the newly created node on the grid canvas.

### Step B: Swapping Variants
*   With the node selected, click **"Toxic Sludge"** under *Swap Polymorphic Variant*.
*   The node immediately turns magenta, setting its friction to `1.5` and hazard stress to `0.8`.
*   Give it a custom label (e.g. "Acid pit gate") and adjust its coordinate values in the inspector.
