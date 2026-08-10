# Custom GLSL Shaders

This directory contains custom GLSL shaders for advanced visual effects.

## Shader Files

### hexGlow.glsl
**Purpose:** Animated glowing borders for hex tiles  
**Used In:** `HexagonNode3D.jsx`  
**Uniforms:**
- `time` (float) - Animation time
- `glowColor` (vec3) - RGB color of glow
- `glowIntensity` (float) - Brightness multiplier
- `pulseSpeed` (float) - Pulse animation speed

**Features:**
- Edge detection glow
- Pulsing animation
- Secondary glow ring

---

### waterSurface.glsl
**Purpose:** Realistic water surface for Toxic Swamp biome  
**Used In:** Future `WaterPlane3D.jsx`  
**Uniforms:**
- `time` (float) - Animation time
- `waterColor` (vec3) - Base water color
- `foamColor` (vec3) - Foam highlight color
- `waveHeight` (float) - Vertical displacement
- `waveSpeed` (float) - Animation speed
- `transparency` (float) - Alpha value

**Features:**
- Layered simplex noise waves
- Fresnel rim lighting
- Animated foam patterns
- Vertex displacement

---

### heatDistortion.glsl (TODO)
**Purpose:** Heat shimmer effect for Desert biome  
**Status:** Planned

---

### iceRefraction.glsl (TODO)
**Purpose:** Ice crystal refraction for Glacier biome  
**Status:** Planned

---

## Usage in React Three Fiber

```jsx
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

const HexGlowMaterial = shaderMaterial(
  {
    time: 0,
    glowColor: new THREE.Color('#39ff14'),
    glowIntensity: 1.0,
    pulseSpeed: 2.0
  },
  // Vertex shader
  /* glsl */ `...`,
  // Fragment shader
  /* glsl */ `...`
);

// In your component
useFrame((state, delta) => {
  materialRef.current.time += delta;
});

<meshBasicMaterial ref={materialRef} />
```

## Performance Notes

- Keep uniform updates minimal (batch when possible)
- Use `dpr` scaling for high-DPI displays
- Consider fallback materials for low-end devices
- Profile shader complexity with Three.js inspector

## Testing

Test shaders in isolation using the shader playground:
```bash
npm run dev -- --shader-test hexGlow
```

## References

- [Three.js Shader Materials](https://threejs.org/docs/#api/en/materials/ShaderMaterial)
- [The Book of Shaders](https://thebookofshaders.com/)
- [GLSL Sandbox](http://glslsandbox.com/)
