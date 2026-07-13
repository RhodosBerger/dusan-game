# Architectural Specification: Schema-Driven Polymorphism & Skinning Engine

This specification defines the architecture to dynamically reinterpret gameplay rules, assets, and biomes under different visual themes (skins) using polymorphic JSON schemas.

---

## 1. Architectural Concept: Separation of Subject & Objective

To scale the engine without duplicating core logic:
*   **Subject (Gameplay Core)**: The state machine, math solvers, A* pathfinders, and SQLite schema. These remain 100% immutable and independent of the theme.
*   **Objective (Skin/Interpretation Layer)**: The 3D geometries, materials, color tokens, particle effects, ambient audio loops, and localized HUD copy.

```
                  ┌──► [ Sci-Fi Cyberpunk Schema ]  ──► Neon Visors / Synthwave Audio
[ GameState ] ────┼──► [ High Fantasy Schema ]      ──► Wood Pedestals / Orchestral Audio
                  └──► [ Void Dread Schema ]        ──► Obsidian Shaders / Dark Ambience
```

---

## 2. Polymorphic Theme JSON Schema

Every skin is defined by a JSON document complying with the unified `TacticalThemeSchema` structure:

```json
{
  "themeId": "void_dread_v1",
  "name": "Void Dread Realm",
  "colors": {
    "primaryGlow": "#8a2be2",
    "basePedestal": "#0d0514",
    "gridLine": "#4b0082",
    "hazardStress": "#ff007f"
  },
  "geometries": {
    "actorBase": {
      "type": "CylinderGeometry",
      "args": [0.5, 0.55, 0.1, 16]
    },
    "obstacle": {
      "type": "DodecahedronGeometry",
      "args": [0.35]
    }
  },
  "materials": {
    "actorStandard": {
      "roughness": 0.2,
      "metalness": 0.9,
      "emissiveIntensity": 1.8
    }
  },
  "audio": {
    "ambientLoop": "/audio/void_ambient.mp3",
    "attackFeedback": "/audio/void_strike.wav"
  },
  "localization": {
    "warningAPLimit": "UPOZORNENIE: Únik z prázdnoty vyžaduje kritické množstvo AP!"
  }
}
```

---

## 3. Reference Implementation: React Theme Adapter

We use a React Context Provider to make the active theme schema accessible to all Canvas meshes:

```javascript
import React, { createContext, useContext, useMemo } from 'react';
import * as THREE from 'three';

const ThemeContext = createContext(null);

export function ThemeProvider({ themeJson, children }) {
    // Compile materials and geometries dynamically based on the active JSON schema
    const compiledResources = useMemo(() => {
        const primaryColor = themeJson.colors.primaryGlow;
        const baseColor = themeJson.colors.basePedestal;
        
        return {
            actorBaseGeom: new THREE.CylinderGeometry(...themeJson.geometries.actorBase.args),
            standardMaterial: new THREE.MeshStandardMaterial({
                color: baseColor,
                roughness: themeJson.materials.actorStandard.roughness,
                metalness: themeJson.materials.actorStandard.metalness
            }),
            glowMaterial: new THREE.MeshStandardMaterial({
                color: primaryColor,
                emissive: primaryColor,
                emissiveIntensity: themeJson.materials.actorStandard.emissiveIntensity
            })
        };
    }, [themeJson]);

    return (
        <ThemeContext.Provider value={{ theme: themeJson, resources: compiledResources }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useGameTheme() {
    return useContext(ThemeContext);
}
```

### Applying in 3D Mesh Components (`ThreadMiniature.jsx`)
Instead of hardcoded meshes or colors, components query the active theme context:

```javascript
export function ThemedActorMesh() {
    const { resources, theme } = useGameTheme();

    return (
        <group>
            {/* Base Pedestal using themed geometry and material */}
            <mesh 
                geometry={resources.actorBaseGeom} 
                material={resources.standardMaterial} 
                castShadow 
            />
            {/* Glowing Accent */}
            <mesh 
                geometry={resources.actorBaseGeom} 
                material={resources.glowMaterial} 
                scale={[1.02, 0.2, 1.02]} 
            />
        </group>
    );
}
```

---

## 4. REST API Endpoint for Dynamic Skin Swapping

The server exposes an endpoint to pull theme schemas dynamically, allowing players or designers to change the game look without reloading the browser:

*   `GET /api/v1/themes/active` - Fetch the active theme configuration JSON.
*   `POST /api/v1/themes/swap` - Change the active theme by ID (`{ "themeId": "high_fantasy_v1" }`). This broadcasts a `theme_swapped` socket event to all clients.
