# 📐 Šablóny pre Inkrementálny Vývoj (Incremental Development Blueprints)

Tento dokument slúži ako technická príručka a súbor návrhových šablón pre ďalší inkrementálny vývoj hry **The Last Tribe**. Definuje štandardy pre triedenie prvkov na canvase, herné elementy, herné artefakty a správu hráčov/entít vrátane AI.

---

## 1. Triedenie a Vrstvenie Prvkov na Canvase (Canvas Layering & Z-Sorting Template)

Pri vykresľovaní zložitej 3D scény v Three.js / React Three Fiber (R3F) musíme striktne separovať prvky do logických renderovacích skupín (skupín s definovaným `renderOrder` alebo hierarchických React skupín) pre zabránenie prekrývaniu a vizuálnym chybám priesvitnosti (depth-sorting issues).

### Šablóna Vrstvenia Scény (Three.js Hierarchy & Render Order):
```typescript
export const CANVAS_LAYERS = {
  BACKGROUND: { order: 0, name: "Starfield & Portal Vortex" },
  GRID_TERRAIN: { order: 10, name: "Hexagon Nodes & Biome Meshes" },
  GRID_DECORATIONS: { order: 20, name: "Instanced Biome Props (Trees, Crystals)" },
  PATH_HIGHLIGHTS: { order: 30, name: "Range Highlights & Action Tiles" },
  MINIATURES: { order: 40, name: "Player & Enemy 3D Miniatures" },
  VFX_PARTICLES: { order: 50, name: "Biome Transitions & Combat Spell Particles" },
  INTERACTION_OVERLAYS: { order: 60, name: "Billboard Labels & Floating FloatingDice3D" }
};
```

### R3F Komponent Template pre Nový Canvas Element:
```jsx
import React, { useMemo } from 'react';
import { extend } from '@react-three/fiber';

/**
 * @template
 * Použite túto šablónu pre každý nový 3D prvok pridávaný na scénu.
 * Rešpektuje pravidlo kešovania geometrií a materiálov (WebGL Optimization).
 */
export function OptimizedOverlayElement({ position, color, renderOrder = 60 }) {
  // 1. Zdieľanie geometrií a materiálov cez useMemo mimo render slučky
  const { geometry, material } = useMemo(() => {
    return {
      geometry: new THREE.DodecahedronGeometry(0.3),
      material: new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8,
        depthWrite: false, // Dôležité pre transparentné 3D overlaye
      })
    };
  }, [color]);

  return (
    <mesh 
      position={position}
      geometry={geometry}
      material={material}
      renderOrder={renderOrder} // Určenie poradia vykreslenia
    />
  );
}
```

---

## 2. Herné Elementy, Kúzla a Fyzikálne Parametre (Game Elements & Physics Actions Template)

Každé kúzlo alebo akcia v hre prechádza výpočtovým jadrom Ohmovho zákona ($I = V / R$). Zavedenie nových stavových efektov a typov kariet musí rešpektovať štruktúru stavového automatu (State Machine ticks).

### Šablóna pre Akčnú Kartu (Physics Action Catalog DTO):
```typescript
export interface PhysicsAction {
  id: string;
  name: string;
  slovakName: string;
  categorization: 'attack' | 'defense' | 'magic' | 'movement';
  voltage: number;    // V: Útočná sila / intenzita
  resistance: number; // R: Obrana / tlmenie
  statusEffect?: {
    type: 'slowed' | 'silenced' | 'rooted' | 'disarmed';
    duration: number; // Počet ťahov
    cureAction: 'move' | 'spell' | 'attack'; // Aká akcia stav vylieči podľa pravidiel
  };
  entropyImpact?: number; // Vplyv na Void Walker mechaniku
}

// Príklad implementácie nového kúzla:
export const ROOT_TRAP_ACTION: PhysicsAction = {
  id: "rootTrap",
  name: "Root Trap",
  slovakName: "Koreňová Pasca",
  categorization: "magic",
  voltage: 2.0,
  resistance: 8.0,
  statusEffect: {
    type: "rooted",
    duration: 2,
    cureAction: "attack" // Rooted sa vylieči úspešným útokom
  },
  entropyImpact: 0.15
};
```

---

## 3. Herné Artefakty, Výbava a Suroviny (Game Artifacts & Crafting Schema Template)

Artefakty sú perzistentné predmety, ktoré si hráč kupuje za suroviny (`materials`) získané z truhiel. Suroviny aj artefakty sú ukladané v databáze a priamo modifikujú parametre hrdinu v 3D zápase.

### Schéma Artefaktov (SQLite Schema & DTO):
```sql
-- Tabuľka typov artefaktov
CREATE TABLE item_catalog (
    item_key TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT CHECK(category IN ('WEAPON', 'TOOL', 'HARVEST')),
    base_voltage_bonus REAL DEFAULT 0.0,
    base_resistance_bonus REAL DEFAULT 0.0,
    durability_max INTEGER DEFAULT 100
);

-- Tabuľka vlastnených predmetov hráča
CREATE TABLE player_items (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    item_key TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    durability INTEGER DEFAULT 100,
    FOREIGN KEY(player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY(item_key) REFERENCES item_catalog(item_key)
);
```

### Šablóna Receptu pre Crafting (Crafting Matrix Template):
```typescript
export interface CraftingRecipe {
  resultItemKey: string;
  requiredMaterials: {
    materialKey: 'CrystalShard' | 'ToxicSpore' | 'VoidCore';
    amount: number;
  }[];
  statModifiers: {
    voltageAdd?: number;
    resistanceAdd?: number;
  };
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    resultItemKey: "GRAVITY_HARVESTER",
    requiredMaterials: [
      { materialKey: "CrystalShard", amount: 10 },
      { materialKey: "VoidCore", amount: 3 }
    ],
    statModifiers: {
      voltageAdd: 0.5,
      resistanceAdd: 1.0
    }
  }
];
```

---

## 4. Hráči, AI Entity a Bezpečné Spawnovanie (Player Factions, AI States & Spawner Guards)

Každá entita na hracej ploche (či už Hráč, Faraday Sentinel alebo Void Monster) musí overovať bezpečnosť pohybu a bezkolízny zrod (`Spawner Guards`). Frakcie čerpajú energiu na základe svojho herného dizajnu (napr. Voltáž pre Hackerov vs. Entropia pre Void Walkerov).

### Šablóna Frakcie Hráča (Faction Blueprint Template):
```typescript
export interface FactionBlueprint {
  factionKey: string;
  heroName: string;
  startHealth: number;
  startArmor: number;
  energySource: 'voltage' | 'entropy'; // Určuje energetický model
  primaryBiome: 'LUSH_FOREST' | 'TOXIC_SWAMP' | 'GLACIER';
  passiveAbility: {
    name: string;
    description: string;
    onTick: (gameState: any, entityId: string) => void;
  };
}
```

### Šablóna Rozhodovacieho Stromu AI (AI Decision Loop Template):
```typescript
export interface AIBehaviorState {
  entityId: string;
  faction: 'MONSTER' | 'COMPANION';
  detectionRange: number;
  
  // Rozhodovacia slučka spúšťaná pri každom ticku ťahu AI
  decideAction: (grid: any, selfPosition: string, targets: any[]) => {
    actionType: 'move' | 'attack' | 'buff' | 'idle';
    targetHexId: string;
    cardId?: string;
  };
}
```

### Bezkolízny Spawner Guard (Collision-Free Spawner Guard Template):
```typescript
/**
 * Zaisťuje bezkolízny zrod entít/truhiel v hernom svete.
 * Rešpektuje sémantické kontroly: políčko musí byť priechodné a voľné.
 */
export function verifySpawnerSafety(block: any): boolean {
  const isWalkable = block.walkable === true;
  const isFreeOfEntities = block.threadId === null || block.threadId === undefined;
  const isFreeOfProps = block.propType === null || block.propType === undefined;

  return isWalkable && isFreeOfEntities && isFreeOfProps;
}
```
