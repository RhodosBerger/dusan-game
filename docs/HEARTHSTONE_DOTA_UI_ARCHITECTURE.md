# Hearthstone x Dota UI/UX Architecture

## Design Philosophy
**"Strategic Clarity Meets Cinematic Polish"**

Combine Hearthstone's intuitive card-based interactions with Dota 2's information-dense, competitive UI to create a AAA experience that feels both accessible and deep.

---

## Core UI Components

### 1. **Shop Navigation System** (`ShopNavigator.jsx`)

Inspired by: Dota 2 Shop + Hearthstone Card Shop

#### Features:
- **Tabbed Categories**: Weapons, Armor, Consumables, Upgrades
- **Dynamic Filtering**: By cost, rarity, faction, type
- **Preview Panel**: 3D model rotation on hover
- **Purchase Animation**: Coin burst + item fly-to-inventory
- **Stock Indicators**: Limited quantity badges
- **Gold Counter**: Animated coin tally in top-right

#### Layout:
```
┌─────────────────────────────────────────────┐
│  [Gold: 1,245]  ┌───────────────────────┐  │
│                 │  ITEM PREVIEW (3D)    │  │
│  TABS           │  - Rotate on drag     │  │
│  [All] [Wep]    │  - Stats overlay      │  │
│  [Arm] [Cons]   │  - Purchase button    │  │
│                 └───────────────────────┘  │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐                  │
│  │ 🗡️│ │ 🛡️│ │ 🧪│ │ ⬆️│  (Grid Items)   │
│  └───┘ └───┘ └───┘ └───┘                  │
│  [60g] [85g] [30g] [150g]                 │
└─────────────────────────────────────────────┘
```

---

### 2. **Hero Portrait & Status** (`HeroStatusHUD.jsx`)

Inspired by: Dota 2 Hero HUD + Hearthstone Hero Power

#### Features:
- **Portrait Frame**: Faction-colored border with rank gems
- **Health/Mana Bars**: Segmented with numeric overlay
- **Status Effects**: Icon carousel around portrait
- **Ultimate Indicator**: Pulsing orb when ready
- **Damage Numbers**: Floating combat text on hit
- **Level Progress**: XP bar beneath portrait

#### Visual States:
- **Normal**: Steady glow
- **Low Health**: Red pulse + heartbeat sound
- **Ultimate Ready**: Golden swirl animation
- **Stunned/Silenced**: Gray overlay + chain effect

---

### 3. **Minimap & Strategic Overlay** (`StrategicMinimap.jsx`)

Inspired by: Dota 2 Minimap + Hearthstone Board Zones

#### Features:
- **Fog of War**: Shader-based reveal system
- **Ping System**: 3-click tactical pings (Attack, Defend, Retreat)
- **Hero Icons**: Colored dots with direction indicators
- **Objective Markers**: Dragon/Roshan-style bosses
- **Timeline Scrubber**: Replay-style game time slider
- **Scoreboard Toggle**: KDA/Gold/XP comparison

#### Interaction:
- **Right-click**: Move camera
- **Ctrl+Click**: Alert ping
- **Shift+Click**: Path planning
- **Scroll**: Zoom levels (3 presets)

---

### 4. **Card Play Queue** (`SpellQueue.jsx`)

Inspired by: Dota 2 Spell Queue + Hearthstone Hand Management

#### Features:
- **Queued Spells**: Horizontal scroll list
- **Target Selectors**: Radial menu for AoE spells
- **Cancel Button**: X icon with refund animation
- **Cast Time Bar**: Countdown under each queued spell
- **Chain Combos**: Visual links between synergistic cards

---

### 5. **Inventory & Equipment** (`EquipmentRack.jsx`)

Inspired by: Dota 2 Backpack + Hearthstone Weapon Slot

#### Features:
- **6-Slot Grid**: Traditional MOBA inventory
- **Active Item Keys**: 1-6 hotkey overlays
- **Cooldown Overlays**: Radial sweep on used items
- **Stack Indicators**: Number badge for consumables
- **Drag-Drop**: Reorder with smooth animations
- **Auto-Cast Toggle**: Small switch icon per item

---

### 6. **Match Timeline** (`MatchTimeline.jsx`)

Inspired by: Dota 2 Recap + Hearthstone Turn Counter

#### Features:
- **Event Markers**: Kills, objectives, teamfights
- **Gold Graph**: Toggle between gold/XP/vision
- **Turn Counter**: Circular progress for current turn
- **Momentum Meter**: Visual swing indicator
- **Pause Menu Integration**: Click to view replay moment

---

### 7. **Chat & Ping Wheel** (`TacticalComms.jsx`)

Inspired by: Dota 2 Wheel + Hearthstone Emotes

#### Features:
- **Radial Menu**: 8 quick commands (Gather, Push, Ward, etc.)
- **Text Chat**: Collapsible panel with filters (All/Team/Party)
- **Voice Lines**: Hero-specific response wheel
- **Mute Controls**: Per-player toggle icons
- **Translation**: Auto-translate for international lobbies

---

## UX Flow Architecture

### Pre-Match Flow
```
Main Menu → Hero Select → Loadout → Shop (pre-game gold) → Match Start Transition
```

### In-Match Flow
```
Turn Start → Draw Phase → Mana Refresh → Card Play → Combat → End Turn
          ↓
    [Shop Access Between Rounds]
```

### Post-Match Flow
```
Victory/Defeat Screen → Stats Breakdown → XP/Gold Rewards → Return to Menu
```

---

## Animation Standards

### Transitions
| Type | Duration | Easing | Use Case |
|------|----------|--------|----------|
| **Snap** | 100ms | `cubic-bezier(0.4, 0.0, 0.6, 1.0)` | Button hovers, toggles |
| **Smooth** | 250ms | `cubic-bezier(0.25, 0.1, 0.25, 1.0)` | Panel slides, fades |
| **Cinematic** | 500ms+ | `cubic-bezier(0.19, 1.0, 0.22, 1.0)` | Scene transitions |
| **Impact** | 50ms | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | Damage numbers, hits |

### Color Palette
```css
/* Faction Colors */
--faction-crystal: #00d9ff;  /* Blue/Cyan */
--faction-toxic: #39ff14;    /* Neon Green */
--faction-druid: #ffd700;    /* Gold */
--faction-void: #9d00ff;     /* Purple */

/* Rarity Colors */
--rarity-common: #b0b0b0;
--rarity-rare: #00a8ff;
--rarity-epic: #a335ee;
--rarity-legendary: #ff8000;

/* UI Semantic Colors */
--ui-health: #ff3333;
--ui-mana: #3366ff;
--ui-energy: #ffcc00;
--ui-shield: #00ffff;
--ui-danger: #ff0000;
--ui-success: #00ff00;
```

---

## Performance Targets

| Metric | Target | Fallback |
|--------|--------|----------|
| **UI FPS** | 60 FPS | 30 FPS (mobile) |
| **Draw Calls** | < 50 per frame | < 100 |
| **Texture Memory** | < 256 MB | < 512 MB |
| **Input Latency** | < 16ms | < 33ms |
| **Load Time** | < 2s (cached) | < 5s |

---

## Accessibility Features

✅ **Colorblind Modes**: Deuteranopia, Protanopia, Tritanopia filters  
✅ **Scalable UI**: 75% - 150% size options  
✅ **Reduced Motion**: Disable parallax/particles  
✅ **High Contrast Mode**: Enhanced edge detection  
✅ **Screen Reader Support**: ARIA labels on all interactive elements  
✅ **Key Remapping**: Full keyboard customization  

---

## Component Checklist

### Built Components:
- [x] `ShopNavigator.jsx` - Tabbed shop with 3D preview ✅
- [x] `HeroStatusHUD.jsx` - Portrait + bars + buffs ✅
- [ ] `StrategicMinimap.jsx` - Fog of war + pings
- [ ] `SpellQueue.jsx` - Queued cast system
- [ ] `EquipmentRack.jsx` - 6-slot inventory
- [ ] `MatchTimeline.jsx` - Event graph + stats
- [ ] `TacticalComms.jsx` - Ping wheel + chat
- [ ] `PauseMenu.jsx` - Settings + surrender + recap
- [ ] `VictoryScreen.jsx` - MVP highlights + rewards
- [ ] `LoadingScreen.jsx` - Tips + progress bar + hero showcase

### Previously Created:
- [x] `CardAAA.jsx` - Premium card component with parallax
- [x] `HandAAA.jsx` - Fanned card layout
- [x] `SimulationTransition.jsx` - Cinematic transitions

### To Integrate:
- [ ] Replace existing `ArenaUIOverlay.jsx` with modular system
- [ ] Connect shop to economy backend
- [ ] Hook minimap to game state synchronization
- [ ] Add sound effects to all interactions
- [ ] Implement haptic feedback for mobile

---

## Inspiration Gallery

### Hearthstone Elements:
- Card hover magnification
- Rope timer tension
- Lethal highlighting
- Emote wheel charm
- Pack opening excitement

### Dota 2 Elements:
- Dense information hierarchy
- Quickbuy system
- Shard/Aghanim upgrades
- Courier delivery
- High-ground vision mechanics

### Modern AAA Touches:
- Parallax layering
- Dynamic lighting on UI
- Subtle particle accents
- Smooth camera choreography
- Contextual hint system

---

## Next Steps

1. **Week 1**: Build core HUD components (HeroStatus, Minimap, Equipment)
2. **Week 2**: Implement Shop Navigator with economy integration
3. **Week 3**: Add communication systems (Chat, Ping Wheel)
4. **Week 4**: Polish animations, add accessibility, performance profiling

## File Structure
```
/workspace/packages/client/src/components/ui/
├── ShopNavigator.jsx
├── HeroStatusHUD.jsx
├── StrategicMinimap.jsx
├── SpellQueue.jsx
├── EquipmentRack.jsx
├── MatchTimeline.jsx
├── TacticalComms.jsx
├── PauseMenu.jsx
├── VictoryScreen.jsx
└── LoadingScreen.jsx
```
