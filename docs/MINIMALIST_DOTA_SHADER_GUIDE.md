# Minimalist Dota Aesthetic — Shader Optimization Guide

## 🎨 Design Philosophy

**"Less geometry, more impact"** — Inspired by Dota 2's visual clarity with abstract geometric minimalism.

### Core Principles

1. **Silhouette Readability**: Every ability/hero must be recognizable from shape alone
2. **Color-Coded Information**: Faction = color, status = emissive intensity
3. **GPU Over CPU**: Move animation logic to shaders, not JavaScript
4. **Strategic Abstraction**: Minimap and UI prioritize gameplay info over realism

---

## ⚡ Performance Targets

| Metric | Target | Current (Standard Materials) | With Custom Shaders |
|--------|--------|------------------------------|---------------------|
| Draw Calls | < 50 | ~180 | ~35 |
| Frame Time | < 2ms | 8-12ms | 1.2-1.8ms |
| FPS (Integrated GPU) | 60+ | 35-45 | 60+ |
| Memory (Textures) | < 256MB | ~512MB | ~180MB |

---

## 🔧 Shader Library Overview

### 1. HexTile Shader
**Replaces:** `MeshStandardMaterial` on all hexagon tiles

**Benefits:**
- Instanced rendering (90% fewer draw calls)
- Vertex-based hover/selection animation (no JavaScript updates)
- Built-in emissive rim lighting

**Usage Example:**
```jsx
import { createHexTileShader } from '../utils/shaderLibrary';
import { useFrame } from '@react-three/fiber';

function OptimizedHexTile({ position, biome, isSelected, isHovered }) {
    const shaderRef = useRef();
    
    useFrame((state) => {
        if (shaderRef.current) {
            shaderRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;
            shaderRef.current.material.uniforms.uSelected.value = isSelected ? 1.0 : 0.0;
            shaderRef.current.material.uniforms.uHoverIntensity.value = isHovered ? 0.8 : 0.0;
        }
    });
    
    return (
        <mesh ref={shaderRef} position={position}>
            <cylinderGeometry args={[1, 1, 0.2, 6]} />
            <primitive object={createHexTileShader()} attach="material" />
        </mesh>
    );
}
```

---

### 2. Hero Shield Shader
**Replaces:** Texture-based shield effects (Linken's, BKB, Blade Mail)

**Benefits:**
- Single quad billboard (vs 50+ particle sprites)
- Resolution-independent (no texture blur)
- Animated entirely in GPU

**Dota 2 Inspiration:**
- Linken's Sphere: 6 rotating segments, cyan glow
- Black King Bar: 8 segments, aggressive orange pulse
- Blade Mail: 12 sharp spikes, red rotation

**Usage Example:**
```jsx
import { createHeroShieldShader } from '../utils/shaderLibrary';

function HeroWithShield({ faction, hasLinken, hasBKB }) {
    return (
        <group>
            {/* Hero model */}
            <HeroModel3D faction={faction} />
            
            {/* Linken's Sphere */}
            {hasLinken && (
                <mesh position={[0, 0.5, 0]}>
                    <planeGeometry args={[1.2, 1.2]} />
                    <primitive 
                        object={createHeroShieldShader('LINKEN')} 
                        attach="material" 
                    />
                </mesh>
            )}
            
            {/* BKB */}
            {hasBKB && (
                <mesh position={[0, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[1.4, 1.4]} />
                    <primitive 
                        object={createHeroShieldShader('BKB')} 
                        attach="material" 
                    />
                </mesh>
            )}
        </group>
    );
}
```

---

### 3. Spell Trail Shader
**Replaces:** `CometTrail` component with CPU-updated particles

**Benefits:**
- No per-frame position array updates
- Smooth gradient without segment artifacts
- Automatic fade-out via UV coordinates

**Performance Comparison:**
| Feature | CometTrail (CPU) | SpellTrail (GPU) |
|---------|------------------|------------------|
| Updates/frame | 12-20 array ops | 0 |
| Draw calls | 12-20 | 1 |
| Memory | ~2KB per trail | ~200 bytes |

**Usage Example:**
```jsx
import { createSpellTrailShader } from '../utils/shaderLibrary';

function OptimizedSpellProjectile({ startPos, endPos, faction }) {
    const trailRef = useRef();
    
    // Create ribbon geometry (flat plane following path)
    const trailGeometry = useMemo(() => {
        const length = new THREE.Vector3()
            .subVectors(endPos, startPos)
            .length();
        
        // Create flat ribbon along trajectory
        const geo = new THREE.PlaneGeometry(length, 0.3, 20, 1);
        geo.rotateY(-Math.PI / 2);
        return geo;
    }, [startPos, endPos]);
    
    return (
        <mesh ref={trailRef} geometry={trailGeometry}>
            <primitive 
                object={createSpellTrailShader(faction)} 
                attach="material" 
            />
        </mesh>
    );
}
```

---

### 4. Ultimate Orb Shader
**Replaces:** Multi-mesh orb constructions with manual animations

**Benefits:**
- Charge visualization built into shader
- No JavaScript animation loop needed
- Fresnel-like glow for "power" feel

**Dota 2 Inspiration:**
- Bottom-to-top fill like Aghanim's Scepter upgrade
- Rotating energy bands for "charged" feeling
- Core glow intensifies at 100% charge

**Usage Example:**
```jsx
function UltimateIndicator({ chargePercent, color }) {
    const orbRef = useRef();
    
    useFrame(() => {
        if (orbRef.current) {
            orbRef.current.material.uniforms.uChargePercent.value = chargePercent;
            orbRef.current.material.uniforms.uColor.value = new THREE.Color(color);
        }
    });
    
    return (
        <mesh ref={orbRef}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <primitive 
                object={createUltimateOrbShader()} 
                attach="material" 
            />
        </mesh>
    );
}
```

---

### 5. Minimap Shader
**Replaces:** DOM-based minimap or Canvas2D rendering

**Benefits:**
- GPU-accelerated fog of war
- Biome colors match 3D world exactly
- Grid overlay without extra geometry

**Implementation Notes:**
```jsx
// Requires two textures:
// 1. Terrain texture (R channel = biome ID 0.0-1.0)
// 2. Fog of War texture (R channel = visibility 0.0-1.0)

function GameMinimap({ terrainTexture, fogTexture }) {
    return (
        <mesh position={[0, 0, -10]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[20, 20]} />
            <primitive 
                object={createMinimapShader()} 
                attach="material"
                uniforms={{
                    uTerrainData: { value: terrainTexture },
                    uFogOfWar: { value: fogTexture },
                }}
            />
        </mesh>
    );
}
```

---

## 📊 Integration Roadmap

### Phase 1: Core Tiles (Week 1)
- [ ] Replace `HexagonNode3D` materials with `createHexTileShader()`
- [ ] Implement instanced rendering for all 81 hex tiles
- [ ] Benchmark: target < 0.5ms frame time for tile rendering

### Phase 2: Hero Effects (Week 2)
- [ ] Add shield shaders to `HeroModel3D` component
- [ ] Replace particle-based auras with shader-driven effects
- [ ] Test with 10 heroes simultaneously

### Phase 3: Projectiles & Trails (Week 3)
- [ ] Migrate `SpellProjectile3D` to use trail shader
- [ ] Optimize projectile batching (same faction = same draw call)
- [ ] Stress test: 50 simultaneous projectiles

### Phase 4: UI & Minimap (Week 4)
- [ ] Implement minimap shader in `ArenaUIOverlay`
- [ ] Add ultimate charge indicators to hero portraits
- [ ] Final performance audit

---

## 🛠️ Debugging Tips

### Common Issues

**1. Shader not updating:**
```javascript
// ❌ Wrong: Creating new shader every frame
useFrame(() => {
    material = createHexTileShader();
});

// ✅ Correct: Update uniforms only
useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
});
```

**2. Transparency issues:**
```javascript
// Always set these for transparent shaders:
transparent: true,
depthWrite: false,
blending: THREE.AdditiveBlending,
```

**3. Performance regression:**
```bash
# Enable Three.js renderer stats
import { Stats } from '@react-three/drei';
<Stats showPanel={0} /> {/* 0=FPS, 1=Call count, 2=Memory */}
```

---

## 🎯 Dota 2 Visual References

| Element | Dota 2 Equivalent | Our Implementation |
|---------|-------------------|-------------------|
| Hex selection | Hero selection ring | Emissive rim + vertex pulse |
| Shields | Linken/BKB/Blade Mail | Rotating segmented barriers |
| Ultimates | Aghanim charge orb | Fill-level sphere with bands |
| Minimap | Strategic overview | Biome-colored fog-of-war map |
| Spell trails | Projectile effects | GPU ribbon with gradient fade |

---

## 📈 Expected Results

After full implementation:

- **60 FPS** on Intel Iris Xe (integrated graphics)
- **35 draw calls** (down from 180+)
- **< 100MB** VRAM usage
- **Clean silhouettes** readable at any zoom level
- **Strategic clarity** matching Dota 2's information density

---

## 🔗 Related Files

- `/packages/client/src/utils/shaderLibrary.js` — Main shader implementations
- `/packages/client/src/design/worldDesign.js` — Color palette & biome specs
- `/packages/client/src/components/HexagonNode3D.jsx` — Tile component to optimize
- `/packages/client/src/components/HeroModel3D.jsx` — Hero component for shields
- `/packages/client/src/components/SpellProjectile3D.jsx` — Trail optimization target
