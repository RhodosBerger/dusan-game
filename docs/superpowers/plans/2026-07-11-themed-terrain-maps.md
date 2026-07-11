# Územné (témové) mapy — Implementačný plán

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pridať 3 vizuálne „územné" mapy (❄️ ľadová, ☠️ toxická, 🌲 lesná) + ponechať 🌍 zmiešanú ako default; výber v lobby, celý svet vykreslený ako jeden bióm.

**Architecture:** Klientský render-override riadený z `worldDesign.TERRAIN_MAPS`. Lobby picker → `App.terrainMap` stav → `CanvasRenderer3D` → `HexagonNode3D` (override render biómu + tonálne variácie) a `computePropPlacements(gridData, terrainMap)` (hustejšie rekvizity). Čisto klient — server/shared/`BiomeEngine`/gameplay netknuté.

**Tech Stack:** React 19 + @react-three/fiber + three, Tailwind v4, vitest, oxlint.

**Spec:** `docs/superpowers/specs/2026-07-11-themed-terrain-maps-design.md`.

## Global Constraints

- LEN VIZUÁL, čisto klient. `packages/server`, `packages/shared` (vrátane `BiomeEngine`) a gameplay sa NEMENIA.
- Všetky farby z `worldDesign.js` tokenov (žiadne nové hex literály v komponentoch).
- Determinizmus: žiadny `Math.random()` pre rozloženie/tón/scale rekvizít — VŽDY `createSeededRandom`.
- Zmiešaná mapa (`MIXED`) = dnešné správanie, nezmenené (default parameter).
- Portál ostáva v strede na všetkých mapách (mountuje sa na `PORTAL_NODE_ID` nezávisle od biómu — bez zmeny).
- `TERRAIN_MAPS` id témových máp === kľúč v `BIOME_SPECS` (GLACIER, TOXIC_SWAMP, LUSH_FOREST).
- Po každej úlohe: `npm run lint --workspace=client` exit 0 (len pre-existujúce warningy) a `npm run test --workspace=client` zelené.
- **Commity PATHSPEC-scoped** (kvôli paralelnému behu subagentov): `git commit -m "..." -- <presné cesty>`. Nikdy bare `git commit` ani `git add -A`. Pri `.git/index.lock` počkaj ~3s a skús znova.
- Commit správy po slovensky, s `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Hru spustiť: `./start-dev.sh` z koreňa; „Trénovať proti AI". Engine regres (nemá byť ovplyvnený): `./node_modules/.bin/ts-node packages/server/src/testEngine.ts` (vyžaduje bežiaci server :3001; 374 assertov).

**Vlny paralelizácie:** A: Task 1 ∥ Task 2 · B: Task 3 ∥ Task 4 · C: Task 5 · D: Task 6.

---

### Task 1: `TERRAIN_MAPS` v worldDesign.js

**Files:**
- Modify: `packages/client/src/design/worldDesign.js` (append za `WORLD`, koniec súboru)
- Test: `packages/client/src/design/__tests__/worldDesign.test.js` (uprav import riadok + pridaj describe blok)

**Interfaces:**
- Produces: `TERRAIN_MAPS` = pole `{ id, label, icon, forcedBiome }` (4 položky); `DEFAULT_TERRAIN_MAP = 'MIXED'`. Konzumujú Task 3, 4, 5, 6.

- [ ] **Step 1: Uprav test — import + nový describe blok**

V `packages/client/src/design/__tests__/worldDesign.test.js` zmeň prvý import na:

```js
import { PALETTE, BIOME_SPECS, LIGHTING, WORLD, TERRAIN_MAPS, DEFAULT_TERRAIN_MAP } from '../worldDesign';
```

Na koniec súboru pridaj:

```js
describe('TERRAIN_MAPS', () => {
  it('má 4 mapy a MIXED default', () => {
    expect(TERRAIN_MAPS).toHaveLength(4);
    expect(DEFAULT_TERRAIN_MAP).toBe('MIXED');
    expect(TERRAIN_MAPS.map(m => m.id)).toContain('MIXED');
  });

  it('MIXED má forcedBiome null; témové majú platný biome kľúč (id === biome)', () => {
    for (const m of TERRAIN_MAPS) {
      expect(typeof m.label).toBe('string');
      expect(typeof m.icon).toBe('string');
      if (m.id === 'MIXED') {
        expect(m.forcedBiome).toBeNull();
      } else {
        expect(m.forcedBiome).toBe(m.id);
        expect(BIOME_SPECS[m.forcedBiome]).toBeDefined();
      }
    }
  });

  it('3 témové mapy = GLACIER, TOXIC_SWAMP, LUSH_FOREST', () => {
    const themed = TERRAIN_MAPS.filter(m => m.forcedBiome).map(m => m.id).sort();
    expect(themed).toEqual(['GLACIER', 'LUSH_FOREST', 'TOXIC_SWAMP']);
  });
});
```

- [ ] **Step 2: Over, že test zlyhá**

Run: `npm run test --workspace=client`
Expected: FAIL — `TERRAIN_MAPS` undefined (nové testy padnú, staré prejdú).

- [ ] **Step 3: Implementuj TERRAIN_MAPS**

Na koniec `packages/client/src/design/worldDesign.js` pridaj:

```js
// Územné mapy — voľba v lobby. forcedBiome=null → zmiešaná (BiomeEngine per hex).
// Témové id sa zhoduje s kľúčom v BIOME_SPECS.
export const TERRAIN_MAPS = [
  { id: 'MIXED',       label: 'Zmiešaná', icon: '🌍', forcedBiome: null },
  { id: 'GLACIER',     label: 'Ľadová',   icon: '❄️', forcedBiome: 'GLACIER' },
  { id: 'TOXIC_SWAMP', label: 'Toxická',  icon: '☠️', forcedBiome: 'TOXIC_SWAMP' },
  { id: 'LUSH_FOREST', label: 'Lesná',    icon: '🌲', forcedBiome: 'LUSH_FOREST' },
];

export const DEFAULT_TERRAIN_MAP = 'MIXED';
```

- [ ] **Step 4: Over, že testy prechádzajú**

Run: `npm run test --workspace=client`
Expected: PASS (worldDesign + propPlacement + terrainTone ak už existuje; minimálne worldDesign zelené).

- [ ] **Step 5: Lint + commit**

```bash
npm run lint --workspace=client
git commit -m "Územné mapy: TERRAIN_MAPS + DEFAULT_TERRAIN_MAP vo worldDesign

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>" -- packages/client/src/design/worldDesign.js packages/client/src/design/__tests__/worldDesign.test.js
```

---

### Task 2: `terrainTone.js` — deterministický tónový faktor

**Files:**
- Create: `packages/client/src/design/terrainTone.js`
- Test: `packages/client/src/design/__tests__/terrainTone.test.js`

**Interfaces:**
- Consumes: `createSeededRandom` z `./seededRandom`.
- Produces: `terrainToneFactor(macroIndex, subIndex) => number` v [0,1), deterministické per hex. Konzumuje Task 4.

- [ ] **Step 1: Napíš zlyhávajúci test**

`packages/client/src/design/__tests__/terrainTone.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { terrainToneFactor } from '../terrainTone';

describe('terrainToneFactor', () => {
  it('je deterministické pre rovnaký hex', () => {
    expect(terrainToneFactor(3, 4)).toBe(terrainToneFactor(3, 4));
  });

  it('vracia hodnoty v [0,1)', () => {
    for (let m = 0; m < 9; m++) {
      for (let s = 0; s < 7; s++) {
        const v = terrainToneFactor(m, s);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    }
  });

  it('naprieč 63 hexmi dáva prevažne rôzne hodnoty', () => {
    const vals = [];
    for (let m = 0; m < 9; m++) for (let s = 0; s < 7; s++) vals.push(terrainToneFactor(m, s));
    const unique = new Set(vals.map(v => v.toFixed(6)));
    expect(unique.size).toBeGreaterThan(30);
  });
});
```

- [ ] **Step 2: Over, že test zlyhá**

Run: `npm run test --workspace=client`
Expected: FAIL — `Cannot find module '../terrainTone'`.

- [ ] **Step 3: Implementuj terrainTone.js**

`packages/client/src/design/terrainTone.js`:

```js
import { createSeededRandom } from './seededRandom';

// Deterministický per-hex tónový faktor v [0,1) — jemné svetlé/tmavé fľaky
// v rámci jedného biómu, aby územná mapa nepôsobila ploche. Rovnaký hex →
// rovnaká hodnota (stabilné medzi rendermi aj klientmi).
export function terrainToneFactor(macroIndex, subIndex) {
  const rnd = createSeededRandom(macroIndex * 13 + subIndex * 7 + 1);
  return rnd();
}
```

- [ ] **Step 4: Over, že testy prechádzajú**

Run: `npm run test --workspace=client`
Expected: PASS.

- [ ] **Step 5: Lint + commit**

```bash
npm run lint --workspace=client
git commit -m "Územné mapy: terrainTone — deterministický tónový faktor dlaždíc

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>" -- packages/client/src/design/terrainTone.js packages/client/src/design/__tests__/terrainTone.test.js
```

---

### Task 3: `propPlacement.js` — hustejšie rozloženie pre témové mapy

**Files:**
- Modify: `packages/client/src/design/propPlacement.js`
- Test: `packages/client/src/design/__tests__/propPlacement.test.js` (pridaj nový describe blok)

**Interfaces:**
- Consumes: `TERRAIN_MAPS`, `BIOME_SPECS` z worldDesign (Task 1); `BiomeEngine` (shared, bez zmeny).
- Produces: `computePropPlacements(gridData, terrainMap = 'MIXED') => Map<nodeId, propType>`. MIXED → 9 (1/metapozícia, bez zmeny). Témová → 18 (2/metapozícia, subIndices 1 a 4), portál (`m4_s0`) vynechaný, všetky = `BIOME_SPECS[forcedBiome].prop`. `PORTAL_NODE_ID` export nezmenený. Konzumuje Task 5.

- [ ] **Step 1: Pridaj testy pre témové mapy**

Na koniec `packages/client/src/design/__tests__/propPlacement.test.js` pridaj:

```js
describe('computePropPlacements — témové mapy', () => {
  const grid = generate3DGrid();

  it('MIXED (aj bez argumentu) = 9 rekvizít', () => {
    expect(computePropPlacements(grid).size).toBe(9);
    expect(computePropPlacements(grid, 'MIXED').size).toBe(9);
  });

  it('každá témová mapa = 18 rekvizít, portál m4_s0 vynechaný', () => {
    for (const map of ['GLACIER', 'TOXIC_SWAMP', 'LUSH_FOREST']) {
      const p = computePropPlacements(grid, map);
      expect(p.size).toBe(18);
      expect(p.has('m4_s0')).toBe(false);
    }
  });

  it('témová mapa: všetky rekvizity = prop vynúteného biómu', () => {
    const p = computePropPlacements(grid, 'GLACIER');
    for (const propType of p.values()) {
      expect(propType).toBe(BIOME_SPECS.GLACIER.prop);
    }
  });

  it('témová mapa je deterministická', () => {
    const a = computePropPlacements(grid, 'LUSH_FOREST');
    const b = computePropPlacements(generate3DGrid(), 'LUSH_FOREST');
    expect([...a.entries()]).toEqual([...b.entries()]);
  });
});
```

(Pozn.: `generate3DGrid`, `computePropPlacements`, `BIOME_SPECS` sú už importované v tomto teste z Task 2 pôvodného plánu — over hlavičku súboru; ak `BIOME_SPECS` chýba, doplň `import { BIOME_SPECS } from '../worldDesign';`.)

- [ ] **Step 2: Over, že test zlyhá**

Run: `npm run test --workspace=client`
Expected: FAIL — témová mapa vracia 9 namiesto 18 (parameter zatiaľ ignorovaný).

- [ ] **Step 3: Implementuj témovú vetvu**

Nahraď celý obsah `packages/client/src/design/propPlacement.js`:

```js
import { BiomeEngine } from '../../../shared/src/index';
import { BIOME_SPECS, TERRAIN_MAPS } from './worldDesign';

// Portálový hex — stred stredovej metapozície; rekvizita by kolidovala s vírom.
export const PORTAL_NODE_ID = 'm4_s0';

const NEIGHBOR_DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

// Sub-hexy, na ktoré témová mapa umiestni rekvizity (2 na metapozíciu ≈ 18).
const THEMED_SUBINDICES = [1, 4];

/**
 * Vracia Map<nodeId, propType>.
 * - MIXED: 1 rekvizita na "jadre" biómu / metapozícia (najviac susedov rovnakého
 *   biómu; remíza → prvý v poradí gridu). 9 spolu.
 * - Témová mapa (forcedBiome): 2 rekvizity na metapozíciu (subIndex 1 a 4),
 *   portál vynechaný, všetky = rekvizita vynúteného biómu. 18 spolu. Deterministické.
 */
export function computePropPlacements(gridData, terrainMap = 'MIXED') {
  const mapDef = TERRAIN_MAPS.find(m => m.id === terrainMap);
  const forcedBiome = mapDef ? mapDef.forcedBiome : null;

  if (forcedBiome) {
    const prop = BIOME_SPECS[forcedBiome].prop;
    const placements = new Map();
    for (const node of gridData) {
      if (node.id === PORTAL_NODE_ID) continue;
      if (THEMED_SUBINDICES.includes(node.subIndex)) {
        placements.set(node.id, prop);
      }
    }
    return placements;
  }

  const byCoord = new Map(gridData.map(n => [`${n.q},${n.r}`, n]));
  const biomeCache = new Map();
  const biomeOf = (n) => {
    if (!biomeCache.has(n.id)) {
      biomeCache.set(n.id, BiomeEngine.getBiomeForHex(n.macroIndex, n.subIndex).biome);
    }
    return biomeCache.get(n.id);
  };

  const placements = new Map();
  for (let macro = 0; macro < 9; macro++) {
    let best = null;
    let bestScore = -1;
    for (const node of gridData) {
      if (node.macroIndex !== macro || node.id === PORTAL_NODE_ID) continue;
      const biome = biomeOf(node);
      let score = 0;
      for (const [dq, dr] of NEIGHBOR_DIRS) {
        const nb = byCoord.get(`${node.q + dq},${node.r + dr}`);
        if (nb && biomeOf(nb) === biome) score++;
      }
      if (score > bestScore) {
        best = node;
        bestScore = score;
      }
    }
    if (best) placements.set(best.id, BIOME_SPECS[biomeOf(best)].prop);
  }
  return placements;
}
```

- [ ] **Step 4: Over, že testy prechádzajú**

Run: `npm run test --workspace=client`
Expected: PASS (staré propPlacement testy + nové témové).

- [ ] **Step 5: Lint + commit**

```bash
npm run lint --workspace=client
git commit -m "Územné mapy: hustejšie rozloženie rekvizít pre témové mapy (propPlacement)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>" -- packages/client/src/design/propPlacement.js packages/client/src/design/__tests__/propPlacement.test.js
```

---

### Task 4: HexagonNode3D — override biómu + tonálne variácie

**Files:**
- Modify: `packages/client/src/components/HexagonNode3D.jsx`

**Interfaces:**
- Consumes: `TERRAIN_MAPS` (Task 1), `terrainToneFactor` (Task 2), `PALETTE`/`BIOME_SPECS`/`WORLD` (existujúce).
- Produces: `HexagonNode3D` prijíma nový prop `terrainMap = 'MIXED'`; render bióm = `effectiveBiome`. Konzumuje Task 5 (posiela `terrainMap`).

- [ ] **Step 1: Importy**

V `packages/client/src/components/HexagonNode3D.jsx` zmeň import z worldDesign a pridaj terrainTone. Nájdi riadok:

```jsx
import { PALETTE, BIOME_SPECS, WORLD } from '../design/worldDesign';
```

Nahraď za:

```jsx
import { PALETTE, BIOME_SPECS, WORLD, TERRAIN_MAPS } from '../design/worldDesign';
import { terrainToneFactor } from '../design/terrainTone';
```

- [ ] **Step 2: Pridaj `terrainMap` prop + `effectiveBiome`**

Nájdi signatúru:

```jsx
export default function HexagonNode3D({ node, isHovered, isSelected, onHover, onClick, occupyingThread, isCollapsing = false, entropy = 0.4, hasChest = false, hasTrap = null, terrainTelemetry = null }) {
```

Nahraď za (pridané `terrainMap = 'MIXED'`):

```jsx
export default function HexagonNode3D({ node, isHovered, isSelected, onHover, onClick, occupyingThread, isCollapsing = false, entropy = 0.4, hasChest = false, hasTrap = null, terrainTelemetry = null, terrainMap = 'MIXED' }) {
```

Za `biomeInfo` useMemo (ktorý končí `}, [node.macroIndex, node.subIndex]);`) pridaj:

```jsx
    // Efektívny render bióm — témová mapa vynúti jeden bióm na celý svet.
    const effectiveBiome = useMemo(() => {
        const mapDef = TERRAIN_MAPS.find(m => m.id === terrainMap);
        return mapDef && mapDef.forcedBiome ? mapDef.forcedBiome : biomeInfo.biome;
    }, [terrainMap, biomeInfo.biome]);
```

- [ ] **Step 3: Použi `effectiveBiome` v emissiveColor**

Nájdi v `emissiveColor` useMemo dve porovnania a dependency pole. Zmeň:
- `if (biomeInfo.biome === 'TOXIC_SWAMP') {` → `if (effectiveBiome === 'TOXIC_SWAMP') {`
- `if (biomeInfo.biome === 'GLACIER') {` → `if (effectiveBiome === 'GLACIER') {`
- dep pole `}, [flash, isHovered, mlInfo.lightEmission, biomeInfo.biome, isCollapsing]);` → `}, [flash, isHovered, mlInfo.lightEmission, effectiveBiome, isCollapsing]);`

- [ ] **Step 4: Použi `effectiveBiome` + tón v baseTint**

Nahraď celý `baseTint` useMemo:

```jsx
    const baseTint = useMemo(() => {
        if (isCollapsing) return new THREE.Color(PALETTE.rock.underside);
        if (isSelected) return new THREE.Color(PALETTE.accent.magic);
        if (isHovered) {
            return new THREE.Color('#ffffff').lerp(new THREE.Color(PALETTE.accent.magic), 0.25);
        }
        const spec = BIOME_SPECS[effectiveBiome];
        const base = new THREE.Color('#ffffff').lerp(new THREE.Color(spec.base), 0.45);
        // Tonálne variácie: jemné svetlé/tmavé fľaky (base ↔ light) per hex.
        const tone = terrainToneFactor(node.macroIndex, node.subIndex);
        base.lerp(new THREE.Color(spec.light), tone * 0.35);
        if (mlInfo.colorSaturation < 0.5) {
            base.lerp(new THREE.Color('#888888'), 0.5 - mlInfo.colorSaturation);
        }
        return base;
    }, [isSelected, isHovered, mlInfo.colorSaturation, effectiveBiome, node.macroIndex, node.subIndex, isCollapsing]);
```

- [ ] **Step 5: Použi `effectiveBiome` v materialProps a časticiach**

V `materialProps` useMemo nájdi `map: textures[biomeInfo.biome] || null,` → `map: textures[effectiveBiome] || null,`. V jeho dep poli zmeň `biomeInfo.biome` → `effectiveBiome`.

V JSX (časticové efekty) nahraď 5 podmienok:
- `{biomeInfo.biome === 'GLACIER' && !isCollapsing && <SnowParticles />}` → `effectiveBiome`
- `{biomeInfo.biome === 'TOXIC_SWAMP' && !isCollapsing && <SwampVapors />}` → `effectiveBiome`
- `{biomeInfo.biome === 'DESERT' && !isCollapsing && <DesertHeatParticles />}` → `effectiveBiome`
- `{biomeInfo.biome === 'BARRENS' && !isCollapsing && <BarrensDustDevil />}` → `effectiveBiome`
- `{biomeInfo.biome === 'LUSH_FOREST' && !isCollapsing && entropy > 0.5 && <ForestFireflies />}` → `effectiveBiome`

- [ ] **Step 6: Overenie**

```bash
grep -n "biomeInfo.biome" packages/client/src/components/HexagonNode3D.jsx
```
Expected: PRESNE 1 výskyt — a to vo vnútri `effectiveBiome` useMemo (fallback pre zmiešanú mapu: `... : biomeInfo.biome`). Všetky ostatné použitia (emissiveColor, baseTint, materialProps, časticové podmienky) musia byť `effectiveBiome`. Ak grep vráti viac než 1, niektoré miesto ostalo nenahradené.

Run: `npm run lint --workspace=client` → PASS. `npm run test --workspace=client` → PASS.

- [ ] **Step 7: Commit**

```bash
git commit -m "Územné mapy: HexagonNode3D override biómu (effectiveBiome) + tonálne variácie

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>" -- packages/client/src/components/HexagonNode3D.jsx
```

---

### Task 5: CanvasRenderer3D — prepoj terrainMap + variované rekvizity

**Files:**
- Modify: `packages/client/src/components/CanvasRenderer3D.jsx`

**Interfaces:**
- Consumes: `computePropPlacements(gridData, terrainMap)` (Task 3), `HexagonNode3D` `terrainMap` prop (Task 4), `createSeededRandom` (existujúci modul).
- Produces: `CanvasRenderer3D` prijíma prop `terrainMap = 'MIXED'`, posiela ho do dlaždíc a do propPlacement; rekvizity dostanú seed-riadený scale + rotation-y. Konzumuje Task 6 (posiela `terrainMap`).

- [ ] **Step 1: Import createSeededRandom**

Nájdi import propPlacement:

```jsx
import { PORTAL_NODE_ID, computePropPlacements } from '../design/propPlacement';
```

Hneď pod neho pridaj:

```jsx
import { createSeededRandom } from '../design/seededRandom';
```

- [ ] **Step 2: Pridaj `terrainMap` prop**

Nájdi signatúru:

```jsx
export default function CanvasRenderer3D({ entropy = 0.4, selectedNode, onNodeClick, threads = [], shakeIntensity = 0, turnsElapsed = 1, map = [], terrainTelemetry = null, ultimateFlash = false }) {
```

Nahraď za (pridané `terrainMap = 'MIXED'`):

```jsx
export default function CanvasRenderer3D({ entropy = 0.4, selectedNode, onNodeClick, threads = [], shakeIntensity = 0, turnsElapsed = 1, map = [], terrainTelemetry = null, ultimateFlash = false, terrainMap = 'MIXED' }) {
```

- [ ] **Step 3: Odovzdaj terrainMap do propPlacement a dlaždíc**

Nájdi:

```jsx
    const propPlacements = useMemo(() => computePropPlacements(gridData), [gridData]);
```

Nahraď za:

```jsx
    const propPlacements = useMemo(() => computePropPlacements(gridData, terrainMap), [gridData, terrainMap]);
```

V `<HexagonNode3D ... />` (v `gridData.map`) pridaj prop `terrainMap={terrainMap}` (napr. za `terrainTelemetry={terrainTelemetry}`):

```jsx
                                terrainTelemetry={terrainTelemetry}
                                terrainMap={terrainMap}
```

- [ ] **Step 4: Variácia veľkosti/rotácie rekvizít**

Nahraď celý render blok rekvizít:

```jsx
                    {/* Rekvizity biómov — deterministicky umiestnené; kolabujúce dlaždice vyfiltruj.
                        Seed-riadený scale + rotácia, aby rekvizity neboli klony. */}
                    {gridData.filter(n => propPlacements.has(n.id) && !collapsingNodeIds.includes(n.id)).map(n => {
                        const PropComponent = PROP_COMPONENTS[propPlacements.get(n.id)];
                        if (!PropComponent) return null;
                        const seed = n.macroIndex * 7 + n.subIndex + 1;
                        const rnd = createSeededRandom(seed + 500);
                        const scale = 0.8 + rnd() * 0.4;
                        const rotationY = rnd() * Math.PI * 2;
                        return (
                            <group key={`prop_${n.id}`} position={[n.position[0], 0.45, n.position[2]]} scale={scale} rotation={[0, rotationY, 0]}>
                                <PropComponent seed={seed} />
                            </group>
                        );
                    })}
```

- [ ] **Step 5: Overenie**

Run: `npm run lint --workspace=client` → PASS. `npm run test --workspace=client` → PASS.

- [ ] **Step 6: Commit**

```bash
git commit -m "Územné mapy: CanvasRenderer3D prepája terrainMap + variované rekvizity

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>" -- packages/client/src/components/CanvasRenderer3D.jsx
```

---

### Task 6: Lobby picker + App stav

**Files:**
- Modify: `packages/client/src/App.jsx`
- Modify: `packages/client/src/components/LobbyScreen.jsx`

**Interfaces:**
- Consumes: `TERRAIN_MAPS`, `DEFAULT_TERRAIN_MAP` (Task 1); `CanvasRenderer3D` `terrainMap` prop (Task 5).
- Produces: hráč vyberie mapu v lobby → `App.terrainMap` → renderer. Server dostáva iba `{name, hero}` (bez terrainMap).

- [ ] **Step 1: LobbyScreen — import + stav**

V `packages/client/src/components/LobbyScreen.jsx` na začiatku (po `import React, { useState } from 'react';`) pridaj:

```jsx
import { TERRAIN_MAPS, DEFAULT_TERRAIN_MAP } from '../design/worldDesign';
```

Nájdi `const [selectedHero, setSelectedHero] = useState('thread_king_ai');` a hneď pod neho pridaj:

```jsx
    const [selectedMap, setSelectedMap] = useState(DEFAULT_TERRAIN_MAP);
```

- [ ] **Step 2: LobbyScreen — posli terrainMap v payloade**

Nájdi `handleSubmit` telo:

```jsx
        if (isAI) {
            onStartGame({ name: nickname, hero: selectedHero, vsAI: true });
        } else {
            onSearchMatch({ name: nickname, hero: selectedHero });
        }
```

Nahraď za:

```jsx
        if (isAI) {
            onStartGame({ name: nickname, hero: selectedHero, terrainMap: selectedMap, vsAI: true });
        } else {
            onSearchMatch({ name: nickname, hero: selectedHero, terrainMap: selectedMap });
        }
```

- [ ] **Step 3: LobbyScreen — picker UI**

Nájdi blok s menom hráča (končí `</div>` po `input`). Hneď za tento `</div>` (pred `{/* Akčné tlačidlá */}`) vlož:

```jsx
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-slate-400 uppercase">Bojové územie:</label>
                        <div className="grid grid-cols-2 gap-2">
                            {TERRAIN_MAPS.map(m => (
                                <div
                                    key={m.id}
                                    onClick={() => setSelectedMap(m.id)}
                                    className={`p-2 rounded-xl border cursor-pointer transition-all text-center ${selectedMap === m.id ? 'bg-cyan-950/40 border-cyan-500/80 shadow-[0_0_15px_rgba(0,255,255,0.15)]' : 'bg-slate-900/30 border-slate-800 hover:border-slate-700'}`}
                                >
                                    <div className="text-lg leading-none mb-1">{m.icon}</div>
                                    <div className="text-[9px] font-bold text-slate-300">{m.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
```

- [ ] **Step 4: App.jsx — import + stav**

V `packages/client/src/App.jsx` pridaj k importom:

```jsx
import { DEFAULT_TERRAIN_MAP } from './design/worldDesign';
```

Nájdi existujúci `useState` blok (kde sú deklarované ostatné stavy, napr. `entropy`, `selectedNode`) a pridaj:

```jsx
  const [terrainMap, setTerrainMap] = useState(DEFAULT_TERRAIN_MAP);
```

- [ ] **Step 5: App.jsx — handlery čítajú terrainMap**

Nahraď `handleSearchMatch` a `handleStartGame`:

```jsx
  const handleSearchMatch = ({ name, hero, terrainMap: tm }) => {
    setTerrainMap(tm || DEFAULT_TERRAIN_MAP);
    setIsSearching(true);
    setIsSandbox(false);
    socket.connect();
    setTimeout(() => {
      socket.emit('join_matchmaking', { name, hero });
    }, 500);
  };

  const handleStartGame = ({ name, hero, terrainMap: tm }) => {
    setTerrainMap(tm || DEFAULT_TERRAIN_MAP);
    setIsSandbox(false);
    socket.connect();
    setTimeout(() => {
      socket.emit('join_ai_match', { name, hero });
    }, 500);
  };
```

- [ ] **Step 6: App.jsx — odovzdaj terrainMap do renderera**

Nájdi `<CanvasRenderer3D ... />` a pridaj prop (napr. za `ultimateFlash={ultimateFlash}`):

```jsx
        ultimateFlash={ultimateFlash}
        terrainMap={terrainMap}
```

- [ ] **Step 7: Overenie**

Run: `npm run lint --workspace=client` → PASS. `npm run test --workspace=client` → PASS.
Manuálne (ak beží dev): v lobby sa zobrazí sekcia „Bojové územie" so 4 dlaždicami (🌍/❄️/☠️/🌲), default 🌍; po výbere a spustení AI zápasu sa svet vykreslí v danom bióme.

- [ ] **Step 8: Commit**

```bash
git commit -m "Územné mapy: lobby picker + App.terrainMap stav → renderer

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>" -- packages/client/src/App.jsx packages/client/src/components/LobbyScreen.jsx
```

---

### Task 7: Finálne overenie celku

**Files:** žiadne nové (len fixy ak overenie zlyhá).

- [ ] **Step 1: Statické kontroly**

```bash
npm run lint --workspace=client        # 0 chýb
npm run test --workspace=client        # worldDesign + terrainTone + propPlacement zelené
grep -rn "biomeInfo.biome" packages/client/src/components/HexagonNode3D.jsx   # 0
git diff --stat b69f1fc..HEAD -- packages/server packages/shared              # prázdne (netknuté)
```

- [ ] **Step 2: Browser — každá mapa**

`./start-dev.sh`, otvor Vite URL. Pre každú mapu (🌍/❄️/☠️/🌲): v lobby vyber územie → „Trénovať proti AI" → over:
1. Zmiešaná = ako doteraz (rôzne biómy).
2. Ľadová = celý svet sneh + tyrkysové kryštály, padá sneh.
3. Toxická = tmavá mokraď + žiariace zelené jazierka + magenta kvety, výpary.
4. Lesná = zelený koberec + ružové stromy + svätojánske mušky.
5. Na každej: portál v strede, ~18 rôzne veľkých/otočených rekvizít, tonálne fľaky, 0 chýb v konzole.
(Návrat do lobby medzi mapami: reset simulácie / reload.)

- [ ] **Step 3: Engine regres (nedotknutý)**

So spusteným serverom: `./node_modules/.bin/ts-node packages/server/src/testEngine.ts` → 374 PASS, 0 FAIL.

- [ ] **Step 4: Doladenie (ak treba)**

Ak niektorá mapa pôsobí príliš ploche/husto, lad JEDINE hodnoty: `tone * 0.35` (sila tónu) v HexagonNode3D, `THEMED_SUBINDICES` (hustota) v propPlacement, `scale` rozsah v CanvasRenderer3D. Po zmene over `npm run test --workspace=client`. Commit pathspec-scoped.
