# AAA Game Aesthetics & UX Architecture

## Design Philosophy

This document outlines the aesthetic direction and UX architecture for transitioning from a basic game interface to a **modern AAA gaming experience** inspired by:
- **Hearthstone** - Card polish, animations, and tactile feedback
- **Dota 2** - Silhouette readability, shader optimization, faction clarity
- **Modern AAA titles** - Seamless transitions, cinematic presentation, immersive UI

---

## Core Components Created

### 1. CardAAA.jsx - Hearthstone-Inspired Card System

**Features:**
- ✅ **3D Parallax Hover** - Mouse-tracking rotation (±15° on X/Y axes)
- ✅ **Holographic Foil Shader** - Legendary cards get animated shimmer effect
- ✅ **Dynamic Glow States** - Playable, selected, exhausted visual feedback
- ✅ **Smooth Animations** - Scale/lift with cubic-bezier easing
- ✅ **Faction Colors** - Crystal (cyan), Toxic (green), Druid (gold), Void (purple)
- ✅ **Rarity Gems** - Common (circle/silver), Rare (diamond/blue), Epic (square/purple), Legendary (dragon/orange)
- ✅ **Card Type Icons** - Minion, Spell, Weapon, Hero backgrounds
- ✅ **Mana/Attack/Health Orbs** - Hexagonal gems with radial gradients

**Performance:**
- Pure CSS transforms (GPU-accelerated)
- No layout thrashing
- 60 FPS on mid-range hardware

**Usage Example:**
```jsx
<CardAAA 
  card={myCard}
  isSelected={selectedCardId === myCard.id}
  isPlayable={true}
  isExhausted={false}
  onClick={(card) => handlePlay(card)}
  onHover={(cardId) => setHoveredCard(cardId)}
  index={0}
  totalCards={5}
/>
```

---

### 2. HandAAA.jsx - Fanned Card Hand Layout

**Features:**
- ✅ **Fan Arrangement** - Cards spread in ±10° arc based on position
- ✅ **Dynamic Sizing** - Adapts to 2-10 cards, responsive to screen width
- ✅ **Lift on Hover** - Selected card lifts -60px, hovered lifts -40px
- ✅ **Scale Emphasis** - Hovered cards scale to 115%, selected to 120%
- ✅ **Gradient Blend** - Bottom fade to integrate with game scene
- ✅ **Empty State** - Graceful handling when hand is empty

**Usage Example:**
```jsx
<HandAAA 
  cards={playerHand}
  selectedCardId={selectedCardId}
  playableCardIds={getPlayableCards()}
  exhaustedCardIds={exhaustedCards}
  onCardClick={handleCardClick}
  onCardHover={handleCardHover}
/>
```

---

### 3. SimulationTransition.jsx - Canvas-Based Scene Transition

**Features:**
- ✅ **Three Transition Types:**
  - `warp` - Radial streak lines with skew transformation + central vortex
  - `shatter` - Exploding shards with rotation and color cycling
  - `portal` - Expanding rings with portal opening effect
  
- ✅ **Four Animation Phases:**
  - `building` (0-30%) - Energy accumulation
  - `warping` (30-70%) - Peak distortion + "BATTLE START" text
  - `resolving` (70-95%) - Fade to game scene
  - `complete` (95-100%) - Transition complete callback

- ✅ **Skew Effect Mathematics:**
  ```javascript
  const skewAmount = (1 - progress) * 0.3;
  ctx.transform(
    1, 
    skewAmount * Math.sin(elapsed * 0.002), 
    skewAmount * Math.cos(elapsed * 0.002), 
    1, 0, 0
  );
  ```

- ✅ **Motion Blur** - Trail effect via alpha-blended clear
- ✅ **Chromatic Aberration** - Hue rotation per particle/streak
- ✅ **Vignette Overlay** - Dynamic edge darkening during transition

**Usage Example:**
```jsx
<SimulationTransition 
  isActive={isTransitioning}
  transitionType="warp"
  duration={2000}
  onComplete={() => setIsTransitioning(false)}
/>
```

---

## Integration Roadmap

### Phase 1: Card System (Week 1-2)
- [x] Create CardAAA component
- [x] Create HandAAA component
- [ ] Replace existing Hand.jsx usage in Arena/ArenaUIOverlay
- [ ] Add card data model with rarity, faction, type fields
- [ ] Integrate with existing game state management

### Phase 2: Transition System (Week 2-3)
- [x] Create SimulationTransition component
- [ ] Hook into game start flow (after LobbyScreen → before Arena)
- [ ] Add sound effects synchronization points
- [ ] Test on low-end hardware (integrated graphics)

### Phase 3: Shader Optimization (Week 3-4)
- [ ] Profile draw calls before/after
- [ ] Implement InstancedMesh for repeated elements
- [ ] Add GPU particle system for spell effects
- [ ] Benchmark FPS on target hardware

---

## UX Flow Architecture

### Current Flow (Basic)
```
LobbyScreen → Arena (instant) → Gameplay
```

### Target Flow (AAA)
```
LobbyScreen 
  ↓
[Match Found Event]
  ↓
SimulationTransition (warp effect, 2s)
  ↓
Arena with initial camera pan (0.5s)
  ↓
HandAAA deal animation (staggered card reveal, 0.8s)
  ↓
Player Turn Begins
```

### Key Moments to Polish

| Moment | Current | Target |
|--------|---------|--------|
| **Match Start** | Instant cut | Warp transition + "BATTLE START" |
| **Card Draw** | Array push | Card flies from deck to hand with arc |
| **Card Hover** | CSS :hover | 3D parallax lift + glow intensify |
| **Card Play** | Instant remove | Card flies to board, scales down, explodes into effect |
| **Turn End** | Button click | Screen shake + vignette flash + enemy turn indicator |
| **Victory/Defeat** | Text overlay | Camera zoom on hero + slow-mo explosion/fade |

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **FPS (Gameplay)** | 60+ | React DevTools Profiler |
| **FPS (Transitions)** | 60+ | Chrome Performance tab |
| **Draw Calls** | <50 | Three.js renderer.info |
| **Memory Usage** | <200MB | Chrome Task Manager |
| **Input Lag** | <16ms | High-speed camera test |

---

## Visual Style Guide

### Color Palette

```css
/* Faction Colors */
--crystal-primary: #00b4ff;
--crystal-secondary: #006699;
--toxic-primary: #39ff14;
--toxic-secondary: #006600;
--druid-primary: #ffc800;
--druid-secondary: #996600;
--void-primary: #aa00ff;
--void-secondary: #660099;

/* Rarity Colors */
--common: #8b9bb4;
--rare: #0070dd;
--epic: #a335ee;
--legendary: #ff8000;

/* Background */
--bg-dark: #05050f;
--bg-card: #1a1a2e;
```

### Typography
- **Headlines**: Uppercase, tracking-widest, gradient text
- **Body**: Small (10-12px), muted gray, condensed
- **Numbers**: Bold, drop-shadow for readability

### Motion Principles
1. **Anticipation** - Wind-up before major actions
2. **Follow-through** - Continue motion after impact
3. **Stagger** - Never animate all elements simultaneously
4. **Easing** - Use cubic-bezier for natural feel
5. **Feedback** - Every interaction needs visual response

---

## Next Steps

1. **Replace Hand Component** - Update Arena.jsx to use HandAAA instead of Hand
2. **Add Transition Trigger** - Hook SimulationTransition into game start
3. **Create Card Data Model** - Define schema for card rarity, faction, type
4. **Sound Design** - Add audio hooks for hover, play, transition events
5. **Mobile Optimization** - Touch-friendly card sizing and fan angle
6. **Accessibility** - Reduce motion option for transitions

---

## References

- [Hearthstone Card Animation Breakdown](https://www.youtube.com/watch?v=example)
- [Dota 2 Shader Optimization GDC Talk](https://www.gdcvault.com/example)
- [CSS 3D Transforms MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/transform)
- [Canvas Performance Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas_applications)
