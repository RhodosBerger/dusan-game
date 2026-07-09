# Hex World Design System („Painted Realm") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nahradiť CYBER_NEON vzhľad jedným maliarskym art štýlom podľa `worldImage.png` — jediný zdroj pravdy pre farby/materiály/svetlo v `design/worldDesign.js`, lietajúci ostrov s portálom a rekvizitami biómov, prefarbené UI.

**Architecture:** Nový modul `packages/client/src/design/worldDesign.js` exportuje všetky tokeny; `propPlacement.js` deterministicky umiestňuje rekvizity. Existujúce R3F komponenty (`HexagonNode3D`, `CanvasRenderer3D`, …) sa refaktorujú na čítanie tokenov, `aestheticTheme` systém sa kompletne odstráni. Nové vizuálne komponenty žijú v `packages/client/src/components/world/`.

**Tech Stack:** React 19 + @react-three/fiber 9 + three 0.185 + @react-three/postprocessing, Tailwind v4, vitest (nový, len pre čisté logické moduly), oxlint.

**Spec:** `docs/superpowers/specs/2026-07-09-hex-world-design-system-design.md` — paleta a pravidlá sú tam záväzné.

## Global Constraints

- Gameplay, fyzika a `packages/shared/src/core/BiomeEngine.ts` sa NEMENIA. Server sa NEMENÍ (jeho `theme` pass-through v `server.ts` klient jednoducho prestane čítať).
- Žiara (emissive) patrí len: portál, kryštál, kyselinové jazierka, magenta kvety, hviezdy. Dlaždice: `metalness: 0`, `roughness: 0.85`.
- Všetky farby VÝHRADNE z `worldDesign.js` (v JSX) alebo CSS premenných (v UI) — žiadne nové hex literály v komponentoch.
- Rekvizity: len R3F primitívy, žiadne externé modely. Deterministické rozloženie (žiadny `Math.random()` pre pozície rekvizít — `createSeededRandom`).
- Počty častíc sa nemenia (5–15 na hex, 200 ambient).
- Po každej úlohe musí `npm run lint --workspace=client` prejsť a hra musí byť spustiteľná.
- Commity: malé, po každej úlohe, správy v slovenčine ako doteraz (`git log`), s Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>.
- Ako hru spustiť: `./start-dev.sh` z koreňa repa (server :3001 + Vite klient, URL vypíše Vite). V prehliadači „Trénovať proti AI". Regresný test enginu: `npx ts-node packages/server/src/testEngine.ts` z koreňa repa (374 assertov).

---

### Task 1: Vitest + `worldDesign.js` (tokeny)

**Files:**
- Modify: `packages/client/package.json` (devDependency vitest + test script)
- Create: `packages/client/src/design/worldDesign.js`
- Test: `packages/client/src/design/__tests__/worldDesign.test.js`

**Interfaces:**
- Produces: `PALETTE` (objekt: `space.background`, `space.starlight`, `rock.underside`, `rock.undersideDeep`, `portal.core|mid|outer`, `accent.magic`, `path.dirt`), `BIOME_SPECS` (kľúče GLACIER/TOXIC_SWAMP/DESERT/BARRENS/LUSH_FOREST, každý `{ base, light, accent, particleColor, prop }`, TOXIC_SWAMP navyše `accentFlower`), `LIGHTING` (`key`, `fill`, `ambient`, `portalLight`), `WORLD` (`fog`, `starCount`, `shardCount`). Všetky nasledujúce úlohy importujú odtiaľto.

- [ ] **Step 1: Nainštaluj vitest a pridaj test script**

```bash
cd /Users/tomasjanecka/WebstormProjects/dusanGame
npm install -D vitest -w client
```

V `packages/client/package.json` pridaj do `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 2: Napíš zlyhávajúci test**

`packages/client/src/design/__tests__/worldDesign.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { PALETTE, BIOME_SPECS, LIGHTING, WORLD } from '../worldDesign';

const HEX = /^#[0-9a-f]{6}$/;
const BIOMES = ['GLACIER', 'TOXIC_SWAMP', 'DESERT', 'BARRENS', 'LUSH_FOREST'];

describe('PALETTE', () => {
  it('má všetky globálne tokeny vo formáte #rrggbb', () => {
    for (const val of [
      PALETTE.space.background, PALETTE.space.starlight,
      PALETTE.rock.underside, PALETTE.rock.undersideDeep,
      PALETTE.portal.core, PALETTE.portal.mid, PALETTE.portal.outer,
      PALETTE.accent.magic, PALETTE.path.dirt,
    ]) {
      expect(val).toMatch(HEX);
    }
  });
});

describe('BIOME_SPECS', () => {
  it('obsahuje presne 5 biómov z BiomeEngine', () => {
    expect(Object.keys(BIOME_SPECS).sort()).toEqual([...BIOMES].sort());
  });

  it('každý bióm má base/light/accent/particleColor ako hex a prop ako string', () => {
    for (const biome of BIOMES) {
      const spec = BIOME_SPECS[biome];
      expect(spec.base).toMatch(HEX);
      expect(spec.light).toMatch(HEX);
      expect(spec.accent).toMatch(HEX);
      expect(spec.particleColor).toMatch(HEX);
      expect(typeof spec.prop).toBe('string');
    }
  });

  it('TOXIC_SWAMP má accentFlower (magenta kvety)', () => {
    expect(BIOME_SPECS.TOXIC_SWAMP.accentFlower).toMatch(HEX);
  });
});

describe('LIGHTING a WORLD', () => {
  it('svetlá majú farbu a intenzitu', () => {
    for (const light of [LIGHTING.key, LIGHTING.fill, LIGHTING.ambient, LIGHTING.portalLight]) {
      expect(light.color).toMatch(HEX);
      expect(light.intensity).toBeGreaterThan(0);
    }
  });

  it('WORLD má hmlu a počty', () => {
    expect(WORLD.fog.color).toMatch(HEX);
    expect(WORLD.fog.near).toBeLessThan(WORLD.fog.far);
    expect(WORLD.starCount).toBeGreaterThan(0);
    expect(WORLD.shardCount).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Over, že test zlyhá**

Run: `npm run test --workspace=client`
Expected: FAIL — `Cannot find module '../worldDesign'` (alebo ekvivalent).

- [ ] **Step 4: Implementuj `worldDesign.js`**

`packages/client/src/design/worldDesign.js` — hodnoty sú navzorkované z `worldImage.png`, NEUPRAVUJ ich od oka:

```js
// Painted Realm — dizajn systém hexagonálneho sveta.
// Jediný zdroj pravdy pre farby, materiály a svetlo 3D sveta aj UI.
// Hodnoty vzorkované z worldImage.png (koreň repa) — pozri spec
// docs/superpowers/specs/2026-07-09-hex-world-design-system-design.md.
// CSS premenné v index.css musia zostať hodnotovo 1:1 s týmto súborom.

export const PALETTE = {
  space: {
    background: '#08090e', // vesmírne pozadie
    starlight: '#ffffff',  // hviezdy
  },
  rock: {
    underside: '#111521',     // kamenná podsada ostrova
    undersideDeep: '#0e121a', // podsada — hlbšie partie
  },
  portal: {
    core: '#a7f4fa',  // jadro víru
    mid: '#2dd3f1',   // stred víru
    outer: '#099bcb', // vonkajšie prstence
  },
  accent: {
    magic: '#2dd3f1', // univerzálny akcent: hover, výber, aktívne prvky
  },
  path: {
    dirt: '#586162', // cestičky, hranice metapozícií, prach kolapsu
  },
};

// Kľúče zodpovedajú BiomeDetails['biome'] z packages/shared/src/core/BiomeEngine.ts.
// prop = typ rekvizity pre propPlacement (max 1 na metapozíciu).
export const BIOME_SPECS = {
  GLACIER: {
    base: '#ecf4f7',          // sneh
    light: '#688dab',         // ľadový tieň
    accent: '#24abc4',        // tyrkysový kryštál (emisný)
    particleColor: '#ffffff', // sneženie
    prop: 'CRYSTAL_SPIRE',
  },
  BARRENS: {
    base: '#7f4d4f',          // terakotová skala
    light: '#6a5557',         // svetlá skala
    accent: '#382124',        // tieň skál
    particleColor: '#a1837a', // červený prach
    prop: 'ROCK_SPIKES',
  },
  LUSH_FOREST: {
    base: '#466237',          // tráva
    light: '#86872e',         // teplá lúka
    accent: '#c46884',        // ružová koruna stromu
    particleColor: '#ffffaa', // svätojánske mušky
    prop: 'BLOSSOM_TREE',
  },
  TOXIC_SWAMP: {
    base: '#122027',          // tmavá mokraďová skala
    light: '#51603f',         // mach
    accent: '#acf227',        // kyselinové jazierko (emisné)
    accentFlower: '#7b2e8d',  // magenta kvety (emisné)
    particleColor: '#acf227', // toxické výpary
    prop: 'ACID_POOL',
  },
  DESERT: {
    base: '#988653',          // suchá tráva
    light: '#67523c',         // hlina
    accent: '#bfa37a',        // prach (BEZ emisie)
    particleColor: '#bfa37a', // horúčavové častice
    prop: 'DESERT_STONES',
  },
};

export const LIGHTING = {
  key:  { color: '#fff4e0', intensity: 1.3, position: [12, 20, 8] },   // teplé slnko zhora-sprava
  fill: { color: '#688dab', intensity: 0.4, position: [-14, 10, -8] }, // studený modrý fill zľava
  ambient: { color: '#7a86a8', intensity: 0.35 },
  portalLight: { color: '#2dd3f1', intensity: 1.2, distance: 12 },
};

export const WORLD = {
  // far 160 > OrbitControls maxDistance 150 — ostrov nesmie zmiznúť pri max oddialení
  fog: { color: '#08090e', near: 35, far: 160 },
  starCount: 200,
  shardCount: 30,
  tileRoughness: 0.85,
  tileMetalness: 0,
};
```

- [ ] **Step 5: Over, že testy prechádzajú**

Run: `npm run test --workspace=client`
Expected: PASS (3 describe bloky, všetko zelené).

- [ ] **Step 6: Lint + commit**

```bash
npm run lint --workspace=client
git add packages/client/package.json package-lock.json packages/client/src/design/
git commit -m "Painted Realm: worldDesign.js — tokeny palety, biómov, svetla (vitest)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: `seededRandom.js` + `propPlacement.js` (deterministické rozloženie rekvizít)

**Files:**
- Create: `packages/client/src/design/seededRandom.js`
- Create: `packages/client/src/design/propPlacement.js`
- Test: `packages/client/src/design/__tests__/propPlacement.test.js`

**Interfaces:**
- Consumes: `BIOME_SPECS` z Task 1; `BiomeEngine.getBiomeForHex(metaId, hexId)` zo shared; `generate3DGrid()` z `packages/client/src/utils/HexMath3D.js` (uzly majú `id` v tvare `m4_s0`, `macroIndex`, `subIndex`, `q`, `r`, `position`).
- Produces: `createSeededRandom(seed) => () => number` (mulberry32, [0,1)); `computePropPlacements(gridData) => Map<nodeId, propType>` — presne 1 záznam na metapozíciu, nikdy `m4_s0` (portálový hex); `PORTAL_NODE_ID = 'm4_s0'`.

- [ ] **Step 1: Napíš zlyhávajúci test**

`packages/client/src/design/__tests__/propPlacement.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { generate3DGrid } from '../../utils/HexMath3D';
import { BiomeEngine } from '../../../../shared/src/index';
import { BIOME_SPECS } from '../worldDesign';
import { computePropPlacements, PORTAL_NODE_ID } from '../propPlacement';
import { createSeededRandom } from '../seededRandom';

describe('createSeededRandom', () => {
  it('rovnaký seed → rovnaká sekvencia', () => {
    const a = createSeededRandom(42);
    const b = createSeededRandom(42);
    for (let i = 0; i < 20; i++) expect(a()).toBe(b());
  });

  it('hodnoty v [0, 1)', () => {
    const rnd = createSeededRandom(7);
    for (let i = 0; i < 100; i++) {
      const v = rnd();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('computePropPlacements', () => {
  const grid = generate3DGrid();

  it('presne 1 rekvizita na metapozíciu (9 celkovo)', () => {
    const placements = computePropPlacements(grid);
    expect(placements.size).toBe(9);
    const macros = [...placements.keys()].map(id => Number(id.match(/^m(\d)_/)[1]));
    expect([...new Set(macros)].sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('je deterministické', () => {
    const a = computePropPlacements(grid);
    const b = computePropPlacements(generate3DGrid());
    expect([...a.entries()]).toEqual([...b.entries()]);
  });

  it('nikdy neobsadí portálový hex m4_s0', () => {
    expect(PORTAL_NODE_ID).toBe('m4_s0');
    expect(computePropPlacements(grid).has(PORTAL_NODE_ID)).toBe(false);
  });

  it('typ rekvizity zodpovedá biómu uzla', () => {
    const placements = computePropPlacements(grid);
    for (const [nodeId, propType] of placements) {
      const node = grid.find(n => n.id === nodeId);
      const biome = BiomeEngine.getBiomeForHex(node.macroIndex, node.subIndex).biome;
      expect(propType).toBe(BIOME_SPECS[biome].prop);
    }
  });
});
```

- [ ] **Step 2: Over, že test zlyhá**

Run: `npm run test --workspace=client`
Expected: FAIL — `Cannot find module '../propPlacement'`.

- [ ] **Step 3: Implementuj oba moduly**

`packages/client/src/design/seededRandom.js`:

```js
// Mulberry32 — deterministický PRNG pre vizuálne variácie rekvizít.
// Rovnaký seed vždy vráti rovnakú sekvenciu (stabilita medzi rendermi aj klientmi).
export function createSeededRandom(seed) {
  let s = (seed >>> 0) || 1;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

`packages/client/src/design/propPlacement.js`:

```js
import { BiomeEngine } from '../../../shared/src/index';
import { BIOME_SPECS } from './worldDesign';

// Portálový hex — stred stredovej metapozície; rekvizita by kolidovala s vírom.
export const PORTAL_NODE_ID = 'm4_s0';

const NEIGHBOR_DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

/**
 * Deterministicky vyberie „jadro biómu" v každej metapozícii: hex s najviac
 * susedmi rovnakého biómu (remíza → prvý v poradí gridu, t. j. najnižší subIndex).
 * Vracia Map<nodeId, propType> — presne 1 záznam na metapozíciu.
 */
export function computePropPlacements(gridData) {
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
Expected: PASS (worldDesign aj propPlacement).

- [ ] **Step 5: Lint + commit**

```bash
npm run lint --workspace=client
git add packages/client/src/design/
git commit -m "Painted Realm: deterministické rozloženie rekvizít (propPlacement + seededRandom)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Odstránenie `aestheticTheme` systému

**Files:**
- Modify: `packages/client/src/App.jsx` (riadky ~24, ~79–81, ~422, ~446–447)
- Modify: `packages/client/src/components/ArenaUIOverlay.jsx` (destructure ~83, select blok ~402–416)
- Modify: `packages/client/src/components/CanvasRenderer3D.jsx`
- Modify: `packages/client/src/components/HexagonNode3D.jsx`
- Modify: `packages/client/src/components/ArenaAmbientParticles.jsx`

**Interfaces:**
- Consumes: `PALETTE`, `BIOME_SPECS` z Task 1.
- Produces: žiadny komponent už neprijíma `aestheticTheme`/`setAestheticTheme`. Vizuál po tejto úlohe = doterajší CYBER_NEON (theme ternáry nahradené ich CYBER_NEON hodnotami — definitívne prefarbenie prichádza v Task 4+). Server ďalej posiela `theme` v `match_started` payload — klient ho ignoruje (server sa nemení).

- [ ] **Step 1: App.jsx**

Zmaž:
- riadok `const [aestheticTheme, setAestheticTheme] = useState('CYBER_NEON');`
- blok v `handleMatchStarted`:
```jsx
      if (payload.theme) {
        setAestheticTheme(payload.theme);
      }
```
- prop `aestheticTheme={aestheticTheme}` pri `<CanvasRenderer3D ... />`
- propy `aestheticTheme={aestheticTheme}` a `setAestheticTheme={setAestheticTheme}` pri `<ArenaUIOverlay ... />`

- [ ] **Step 2: ArenaUIOverlay.jsx**

Z destructure props zmaž `aestheticTheme = 'CYBER_NEON',` a `setAestheticTheme,`. Zmaž celý blok prepínača tém (div s labelom `Estetická téma mapy:` a `<select>` so 4 options, riadky ~402–416).

- [ ] **Step 3: CanvasRenderer3D.jsx**

- Z props zmaž `aestheticTheme = 'CYBER_NEON',`.
- Zmaž celý themed pointLight (blok s ternárom `GHOSTLY_VOID ? '#8800ff' : ...`, riadky ~138–147).
- Z `<HexagonNode3D ... />` zmaž `aestheticTheme={aestheticTheme}`.
- `<ArenaAmbientParticles aestheticTheme={aestheticTheme} entropy={entropy} />` → `<ArenaAmbientParticles entropy={entropy} />`.

- [ ] **Step 4: HexagonNode3D.jsx — nahraď theme ternáry CYBER_NEON hodnotami**

- Z props zmaž `aestheticTheme = 'CYBER_NEON',`.
- `edgeColor` useMemo nahraď celý za:
```jsx
    const edgeColor = useMemo(() => {
        return isSelected ? '#00ffff' : isHovered ? '#00ffcc' : '#3a3a4a';
    }, [isSelected, isHovered]);
```
- Vo `flash` vetve `emissiveColor`: `const flashColor = '#00ffff';` (zmaž ternár).
- V `isHovered` vetve `emissiveColor`: vráť rovno `'#002233'` (zmaž theme vetvy).
- V `mlInfo.lightEmission > 0.4` vetve ponechaj len tri biome riadky (TOXIC_SWAMP/GLACIER/BARRENS), theme vetvy zmaž.
- V `baseTint`: `selectColor` → `'#00ffff'`, `hoverColor` → `'#a0d8f0'` (zmaž ternáry aj tri `if (aestheticTheme === ...)` bloky).
- Vo všetkých dependency arrays zmaž `aestheticTheme`.

- [ ] **Step 5: ArenaAmbientParticles.jsx — prefarbenie z palety**

Zmaž funkciu `getThemeColor` a prop `aestheticTheme`. Pridaj import a novú farebnú funkciu:

```jsx
import { PALETTE, BIOME_SPECS } from '../design/worldDesign';

// Manový prach: pokojná portálová cyan → pri vysokej entropii magenta nebezpečenstva.
function getDustColor(entropy) {
    const calm = new THREE.Color(PALETTE.portal.mid);
    const danger = new THREE.Color(BIOME_SPECS.TOXIC_SWAMP.accentFlower);
    return calm.lerp(danger, Math.min(1, Math.max(0, (entropy - 0.4) * 1.6)));
}
```

V `useFrame` aj pri `initialColor` nahraď volania `getThemeColor(aestheticTheme, entropy)` za `getDustColor(entropy)`. Z props zmaž `aestheticTheme = 'CYBER_NEON',`.

- [ ] **Step 6: Overenie**

```bash
grep -rn "aestheticTheme\|MONOCHROME_RETRO\|VIBRANT_BAROQUE\|GHOSTLY_VOID\|CYBER_NEON" packages/client/src
```
Expected: 0 výsledkov.

Run: `npm run lint --workspace=client` → PASS. Spusti `./start-dev.sh`, otvor hru, „Trénovať proti AI" → mapa sa vykreslí ako doteraz (neónový vzhľad zatiaľ zostáva), prepínač tém v pravom paneli je preč, hra reaguje na klik.

- [ ] **Step 7: Commit**

```bash
git add packages/client/src
git commit -m "Painted Realm: odstránenie aestheticTheme systému (4 témy → 1 art štýl)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: HexagonNode3D — maliarske materiály, hrany a stavy interakcie

**Files:**
- Modify: `packages/client/src/components/HexagonNode3D.jsx`

**Interfaces:**
- Consumes: `PALETTE`, `BIOME_SPECS`, `WORLD` z Task 1.
- Produces: dlaždica číta všetko z tokenov; tile mesh + edge sú zabalené v `<group ref={tileRef}>` (spawn/kolaps/hover-lift animuje group — Task 6 doň pridá podsadu). Stavy: hover = nadvihnutie + cyan hrana, selected = cyan tint + prstenec, collapse = stmavnutie do skaly, flash = `portal.core` pulz.

- [ ] **Step 1: Import tokenov**

```jsx
import { PALETTE, BIOME_SPECS, WORLD } from '../design/worldDesign';
```

- [ ] **Step 2: Prepíš farebnú logiku (edge/emissive/tint/materiál)**

Nahraď `edgeColor` useMemo:

```jsx
    const edgeColor = useMemo(() => {
        return (isSelected || isHovered) ? PALETTE.accent.magic : PALETTE.rock.undersideDeep;
    }, [isSelected, isHovered]);
```

Nahraď `emissiveColor` useMemo — žiara len tam, kde v obrázku svieti:

```jsx
    const emissiveColor = useMemo(() => {
        if (isCollapsing) return new THREE.Color(PALETTE.rock.undersideDeep);
        if (flash) return new THREE.Color(PALETTE.portal.core).multiplyScalar(3.0);
        if (isHovered) return new THREE.Color(PALETTE.accent.magic).multiplyScalar(0.12);
        if (mlInfo.lightEmission > 0.4) {
            if (biomeInfo.biome === 'TOXIC_SWAMP') {
                return new THREE.Color(BIOME_SPECS.TOXIC_SWAMP.accent).multiplyScalar(mlInfo.lightEmission * 0.15);
            }
            if (biomeInfo.biome === 'GLACIER') {
                return new THREE.Color(BIOME_SPECS.GLACIER.accent).multiplyScalar(mlInfo.lightEmission * 0.10);
            }
        }
        return new THREE.Color('#000000');
    }, [flash, isHovered, mlInfo.lightEmission, biomeInfo.biome, isCollapsing]);
```

Nahraď `baseTint` useMemo — textúra sa maliarsky tónuje k `base` farbe biómu:

```jsx
    const baseTint = useMemo(() => {
        if (isCollapsing) return new THREE.Color(PALETTE.rock.underside);
        if (isSelected) return new THREE.Color(PALETTE.accent.magic);
        if (isHovered) {
            return new THREE.Color('#ffffff').lerp(new THREE.Color(PALETTE.accent.magic), 0.25);
        }
        const spec = BIOME_SPECS[biomeInfo.biome];
        const base = new THREE.Color('#ffffff').lerp(new THREE.Color(spec.base), 0.45);
        if (mlInfo.colorSaturation < 0.5) {
            base.lerp(new THREE.Color('#888888'), 0.5 - mlInfo.colorSaturation);
        }
        return base;
    }, [isSelected, isHovered, mlInfo.colorSaturation, biomeInfo.biome, isCollapsing]);
```

Nahraď `materialProps` useMemo — matný povrch, telemetrické vzory zostávajú, ale v palete (wireframe glitch preč):

```jsx
    const materialProps = useMemo(() => {
        const defaultProps = {
            map: textures[biomeInfo.biome] || null,
            color: baseTint,
            roughness: WORLD.tileRoughness,
            metalness: WORLD.tileMetalness,
            emissive: emissiveColor,
        };

        if (!activeTelemetry) return defaultProps;

        const pattern = activeTelemetry.texturePattern;
        const vibrancy = activeTelemetry.colorVibrancy;

        if (pattern === 'glitch_grid_noise') {
            return {
                ...defaultProps,
                roughness: 0.5,
                color: baseTint.clone().lerp(new THREE.Color(PALETTE.accent.magic), 0.2 * vibrancy),
            };
        }
        if (pattern === 'crystal_vein_specular') {
            return {
                ...defaultProps,
                roughness: 0.4,
                color: baseTint.clone().lerp(new THREE.Color(BIOME_SPECS.GLACIER.accent), 0.25 * vibrancy),
            };
        }
        if (pattern === 'moss_dense_bump') {
            return {
                ...defaultProps,
                roughness: 1.0,
                color: baseTint.clone().lerp(new THREE.Color(BIOME_SPECS.LUSH_FOREST.base), 0.35 * vibrancy),
            };
        }
        if (pattern === 'void_particle_noise') {
            return {
                ...defaultProps,
                color: baseTint.clone().lerp(new THREE.Color(PALETTE.rock.undersideDeep), 0.35 * vibrancy),
            };
        }

        return defaultProps;
    }, [activeTelemetry, baseTint, emissiveColor, biomeInfo.biome]);
```

- [ ] **Step 3: Tile group + hover-lift**

Premenuj `meshRef` na `tileRef` (všade). V JSX zabaľ tile mesh aj edge do skupiny — ref sa presúva z meshu na group:

```jsx
            {/* Dlaždica + hrana + (Task 6: podsada) — animovaná ako celok */}
            <group ref={tileRef}>
                <mesh castShadow receiveShadow frustumCulled={false}>
                    <extrudeGeometry args={[hexShape, extrudeSettings]} />
                    <meshStandardMaterial {...materialProps} />
                </mesh>
                <lineSegments position={[0, 0, 0.41]}>
                    <edgesGeometry args={[new THREE.ConeGeometry(radius, 0, 6)]} />
                    <lineBasicMaterial color={edgeColor} transparent opacity={isSelected ? 1.0 : isHovered ? 0.9 : 0.45} />
                </lineSegments>
            </group>
```

(Pôvodný samostatný `<lineSegments>` mimo skupiny zmaž.)

V `useFrame` — spawn/kolaps logika zostáva, pridaj hover-lift na lokálnej osi Z (group je otočený `-Math.PI/2`, takže lokálne Z = svetová výška):

```jsx
    useFrame((state) => {
        if (!tileRef.current) return;
        const time = state.clock.elapsedTime;

        const targetLift = (isHovered || isSelected) && !isCollapsing ? 0.25 : 0;
        tileRef.current.position.z = THREE.MathUtils.lerp(tileRef.current.position.z, targetLift, 0.15);

        if (isCollapsing) {
            tileRef.current.position.y = THREE.MathUtils.lerp(tileRef.current.position.y, -4.5, 0.04);
        } else {
            if (time < spawnDelay) {
                tileRef.current.position.y = -5;
            } else {
                const entryProgress = Math.min(1.0, (time - spawnDelay) * 2.0);
                const baseHeight = THREE.MathUtils.lerp(-5, 0, entryProgress);
                const waveFreq = 2.0 + entropy * 1.5;
                const waveAmp = 0.02 + entropy * 0.06;
                const idleOffset = Math.sin(time * waveFreq + (node.position[0] + node.position[2]) * 0.45) * waveAmp;
                tileRef.current.position.y = baseHeight + idleOffset;
            }
        }
    });
```

- [ ] **Step 4: Akcenty gameplay markerov do palety**

V `LootChest3D`, `TownBuilding3D` a selected torus prstenci nahraď všetky `"#00ffff"` a `"#00ffcc"` za `{PALETTE.accent.magic}` (materiály aj pointLighty). `Trap3D` farby (`#fb923c`, `#ef4444`) NECHAJ — sú to gameplay signály. Vo `VoidCollapseParticles` zmeň `color="#a855f7"` na `color={PALETTE.path.dirt}` (kamenný prach namiesto fialového voidu).

- [ ] **Step 5: Vizuálne overenie**

`./start-dev.sh` → „Trénovať proti AI". Over: dlaždice sú matné (žiadny kovový lesk), tónované do farieb biómov; hrany tmavé, na hover dlaždica pláva hore + cyan hrana; selected má cyan prstenec; po zahraní karty cieľový hex blysne bledou cyan.

Run: `npm run lint --workspace=client` → PASS. `npm run test --workspace=client` → PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/components/HexagonNode3D.jsx
git commit -m "Painted Realm: maliarske materiály dlaždíc, tmavé hrany, hover-lift

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Extrakcia častíc do `world/BiomeParticles.jsx` + prefarbenie

**Files:**
- Create: `packages/client/src/components/world/BiomeParticles.jsx`
- Modify: `packages/client/src/components/HexagonNode3D.jsx`

**Interfaces:**
- Consumes: `BIOME_SPECS`, `PALETTE` z Task 1.
- Produces: named exporty `SnowParticles`, `SwampVapors`, `DesertHeatParticles`, `BarrensDustDevil`, `ForestFireflies`, `VoidCollapseParticles` — identické správanie ako doteraz, farby z tokenov.

- [ ] **Step 1: Presuň 6 časticových komponentov**

Vystrihni z `HexagonNode3D.jsx` komponenty `SnowParticles`, `SwampVapors`, `DesertHeatParticles`, `BarrensDustDevil`, `ForestFireflies`, `VoidCollapseParticles` (riadky ~6–303) do nového súboru `packages/client/src/components/world/BiomeParticles.jsx`. Hlavička nového súboru:

```jsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { BIOME_SPECS, PALETTE } from '../../design/worldDesign';
```

(Časticové komponenty používajú len named importy `useRef`/`useMemo` a `useFrame` — import `THREE` ani default `React` nepotrebujú.)

Každý komponent označ `export function ...`. Prefarbi `pointsMaterial`:

| Komponent | Pôvodná farba | Nová farba |
|---|---|---|
| SnowParticles | `#ffffff` | `{BIOME_SPECS.GLACIER.particleColor}` |
| SwampVapors | `#c77dff` | `{BIOME_SPECS.TOXIC_SWAMP.particleColor}` |
| DesertHeatParticles | `#ffaa44` | `{BIOME_SPECS.DESERT.particleColor}` |
| BarrensDustDevil | `#bfa37a` | `{BIOME_SPECS.BARRENS.particleColor}` |
| ForestFireflies | `#ffffaa` | `{BIOME_SPECS.LUSH_FOREST.particleColor}` |
| VoidCollapseParticles | `#a855f7` (po Task 4 `PALETTE.path.dirt`) | `{PALETTE.path.dirt}` |

Počty, rýchlosti a správanie NEMEŇ.

- [ ] **Step 2: Import v HexagonNode3D**

```jsx
import {
    SnowParticles, SwampVapors, DesertHeatParticles,
    BarrensDustDevil, ForestFireflies, VoidCollapseParticles,
} from './world/BiomeParticles';
```

JSX použitie zostáva bez zmeny.

- [ ] **Step 3: Overenie + commit**

Run: `npm run lint --workspace=client` → PASS. Vizuálne: sneh na glacieri, zelenkavé výpary na močiari (už nie fialové).

```bash
git add packages/client/src
git commit -m "Painted Realm: častice biómov extrahované do world/BiomeParticles, farby z tokenov

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Kamenná podsada ostrova (HexagonNode3D)

**Files:**
- Modify: `packages/client/src/components/HexagonNode3D.jsx`

**Interfaces:**
- Consumes: `PALETTE`, skupina `tileRef` z Task 4.
- Produces: každý hex má pod dlaždicou skalný „stalaktit"; hĺbka deterministická (vzdialenosť od stredu + jitter).

- [ ] **Step 1: Výpočet hĺbky podsady**

Do komponentu `HexagonNode3D` (pred `return`):

```jsx
    // Kamenná podsada: okrajové hexy visia hlbšie — dojem odlomeného ostrova.
    const undersideDepth = useMemo(() => {
        const dist = Math.hypot(node.position[0], node.position[2]) / 14; // 14 ≈ polomer arény
        const jitter = ((node.macroIndex * 7 + node.subIndex) % 5) * 0.15;
        return 1.6 + dist * 2.2 + jitter;
    }, [node.position, node.macroIndex, node.subIndex]);
```

- [ ] **Step 2: Mesh podsady do tileRef skupiny**

Do `<group ref={tileRef}>` (za lineSegments):

```jsx
                {/* Skalná podsada — 6-boký zužujúci sa "stalaktit" pod dlaždicou */}
                <mesh position={[0, 0, -undersideDepth / 2 + 0.02]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[radius * 0.92, 0.18, undersideDepth, 6, 1, false, Math.PI / 6]} />
                    <meshStandardMaterial
                        color={PALETTE.rock.underside}
                        roughness={1}
                        metalness={0}
                        flatShading
                    />
                </mesh>
```

(`thetaStart: Math.PI / 6` zarovnáva 6 stien valca s natočením hex dlaždice; rotácia `Math.PI / 2` okolo X mapuje os valca na lokálnu os Z skupiny.)

- [ ] **Step 3: Vizuálne overenie + commit**

`./start-dev.sh` → podíď kamerou nižšie (OrbitControls): pod každou dlaždicou visí tmavý skalný klin, okraje dosky hlbšie než stred; pri hover sa dvíha dlaždica AJ podsada spolu.

Run: `npm run lint --workspace=client` → PASS.

```bash
git add packages/client/src/components/HexagonNode3D.jsx
git commit -m "Painted Realm: kamenná podsada hexov — lietajúci ostrov

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Scéna — pozadie, hviezdy, hmla, nové osvetlenie, bloom

**Files:**
- Create: `packages/client/src/components/world/StarfieldBackground.jsx`
- Modify: `packages/client/src/components/CanvasRenderer3D.jsx`
- Modify: `packages/client/src/components/AestheticCompositor.jsx`

**Interfaces:**
- Consumes: `PALETTE`, `LIGHTING`, `WORLD` z Task 1; `createSeededRandom` z Task 2.
- Produces: `<StarfieldBackground />` (bez props); `AestheticCompositor` už neprijíma `terrainTelemetry` (len `entropy`).

- [ ] **Step 1: StarfieldBackground.jsx**

`packages/client/src/components/world/StarfieldBackground.jsx`:

```jsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { PALETTE, WORLD } from '../../design/worldDesign';
import { createSeededRandom } from '../../design/seededRandom';

const SPHERE_RADIUS = 250;

// Deterministicky rozhodí hviezdy po guli okolo scény.
function generateStars(count, seed) {
    const rnd = createSeededRandom(seed);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const theta = rnd() * Math.PI * 2;
        const phi = Math.acos(2 * rnd() - 1);
        positions[i * 3] = SPHERE_RADIUS * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = SPHERE_RADIUS * Math.cos(phi);
        positions[i * 3 + 2] = SPHERE_RADIUS * Math.sin(phi) * Math.sin(theta);
    }
    return positions;
}

export default function StarfieldBackground() {
    const dimRef = useRef();
    const brightRef = useRef();

    const dimStars = useMemo(() => generateStars(WORLD.starCount - 20, 11), []);
    const brightStars = useMemo(() => generateStars(20, 23), []);

    useFrame((state) => {
        const time = state.clock.elapsedTime;
        if (dimRef.current?.material) {
            dimRef.current.material.opacity = 0.55 + 0.15 * Math.sin(time * 0.8);
        }
        if (brightRef.current?.material) {
            brightRef.current.material.opacity = 0.8 + 0.2 * Math.sin(time * 1.3 + 1.7);
        }
    });

    return (
        <group>
            <points ref={dimRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[dimStars, 3]} />
                </bufferGeometry>
                {/* fog={false} — hviezdy sú za hmlou, nesmú ňou byť pohltené */}
                <pointsMaterial color={PALETTE.space.starlight} size={1.5} sizeAttenuation={false} transparent opacity={0.6} fog={false} depthWrite={false} />
            </points>
            <points ref={brightRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[brightStars, 3]} />
                </bufferGeometry>
                <pointsMaterial color={PALETTE.space.starlight} size={3} sizeAttenuation={false} transparent opacity={0.9} fog={false} depthWrite={false} />
            </points>
        </group>
    );
}
```

- [ ] **Step 2: CanvasRenderer3D — pozadie, hmla, svetlá**

Importy:

```jsx
import { PALETTE, LIGHTING, WORLD } from '../design/worldDesign';
import StarfieldBackground from './world/StarfieldBackground';
```

Vo vnútri `<Canvas shadows>` hneď za otvorením pridaj:

```jsx
                <color attach="background" args={[PALETTE.space.background]} />
                <fog attach="fog" args={[WORLD.fog.color, WORLD.fog.near, WORLD.fog.far]} />
                <StarfieldBackground />
```

Nahraď celý svetelný blok (ambientLight + directionalLight + zvyšné pointLighty — themed light zmizol v Task 3) za:

```jsx
                {/* Painted Realm osvetlenie: teplé slnko + studený fill (worldDesign.LIGHTING) */}
                <ambientLight intensity={LIGHTING.ambient.intensity} color={LIGHTING.ambient.color} />
                <directionalLight
                    castShadow
                    position={LIGHTING.key.position}
                    intensity={LIGHTING.key.intensity}
                    color={LIGHTING.key.color}
                    shadow-mapSize={[2048, 2048]}
                />
                <directionalLight
                    position={LIGHTING.fill.position}
                    intensity={LIGHTING.fill.intensity}
                    color={LIGHTING.fill.color}
                />
```

Vonkajší div: `bg-[#0a0a0f]` → `bg-[color:var(--space-bg)]` (CSS premenná pribudne v Task 12 — dovtedy je pozadie čierne z Canvas `<color attach>`, div pod ním nevidno; ak by lint/Tailwind hlásil problém, použi dočasne `bg-[#08090e]` a v Task 12 vymeň).

`<EffectComposer disableNormalPass>` volanie: `<AestheticCompositor entropy={entropy} terrainTelemetry={terrainTelemetry} />` → `<AestheticCompositor entropy={entropy} />`.

- [ ] **Step 3: AestheticCompositor — glitch preč, jemný bloom**

Nahraď celý súbor `packages/client/src/components/AestheticCompositor.jsx`:

```jsx
// Painted Realm post-processing: jemný bloom pre emisné prvky (portál, kryštál,
// jazierka) + vinetácia. Glitch/aberácia patrili k odstránenému cyber-neon štýlu.
import { Bloom, Vignette } from '@react-three/postprocessing';

export default function AestheticCompositor({ entropy = 0.4 }) {
    return (
        <>
            {/* Vysoký luminanceThreshold: žiaria len skutočne emisné materiály */}
            <Bloom
                intensity={0.35 + entropy * 0.25}
                luminanceThreshold={0.65}
                luminanceSmoothing={0.25}
                mipmapBlur
            />
            <Vignette eskil={false} offset={0.35} darkness={0.75} />
        </>
    );
}
```

- [ ] **Step 4: Vizuálne overenie + commit**

`./start-dev.sh`: pozadie je čierno-modré s blikajúcimi hviezdami, doska mäkko osvetlená teplým svetlom zhora-sprava so studenými modrými tieňmi, vzdialený okraj dosky sa jemne stráca v hmle pri oddialení kamery, žiadne glitch záblesky.

Run: `npm run lint --workspace=client` → PASS.

```bash
git add packages/client/src
git commit -m "Painted Realm: hviezdne pozadie, hmla, nové osvetlenie, jemný bloom

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: PortalVortex3D — centrálny vír

**Files:**
- Create: `packages/client/src/components/world/PortalVortex3D.jsx`
- Modify: `packages/client/src/components/CanvasRenderer3D.jsx`

**Interfaces:**
- Consumes: `PALETTE`, `LIGHTING` z Task 1; `PORTAL_NODE_ID` z Task 2; `gridData` (uzol `m4_s0` má `position: [x, y, z]`).
- Produces: `<PortalVortex3D position={[x, y, z]} />`.

- [ ] **Step 1: PortalVortex3D.jsx**

```jsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { PALETTE, LIGHTING } from '../../design/worldDesign';
import { createSeededRandom } from '../../design/seededRandom';

const PARTICLE_COUNT = 40;

// Špirálovito stúpajúce iskry nad vírom.
function PortalSwirl() {
    const pointsRef = useRef();
    const seeds = useMemo(() => {
        const rnd = createSeededRandom(4);
        return Array.from({ length: PARTICLE_COUNT }, () => ({
            phase: rnd() * Math.PI * 2,
            speed: 0.5 + rnd() * 0.8,
            yOffset: rnd() * 3,
        }));
    }, []);

    const positions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);

    useFrame((state) => {
        if (!pointsRef.current) return;
        const time = state.clock.elapsedTime;
        const posAttr = pointsRef.current.geometry.attributes.position;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const s = seeds[i];
            const y = ((time * s.speed * 0.4 + s.yOffset) % 3);
            const r = 1.6 - (y / 3) * 1.3;
            const angle = s.phase + time * 1.2;
            posAttr.setXYZ(i, r * Math.cos(angle), y, r * Math.sin(angle));
        }
        posAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            </bufferGeometry>
            <pointsMaterial color={PALETTE.portal.mid} size={0.09} transparent opacity={0.85} depthWrite={false} />
        </points>
    );
}

export default function PortalVortex3D({ position }) {
    const outerRef = useRef();
    const midRef = useRef();
    const coreRef = useRef();

    useFrame((_, delta) => {
        if (outerRef.current) outerRef.current.rotation.z += delta * 0.4;
        if (midRef.current) midRef.current.rotation.z -= delta * 0.7;
        if (coreRef.current) coreRef.current.rotation.z += delta * 1.1;
    });

    return (
        <group position={position}>
            <mesh ref={outerRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <circleGeometry args={[1.7, 48]} />
                <meshBasicMaterial color={PALETTE.portal.outer} transparent opacity={0.5} depthWrite={false} />
            </mesh>
            <mesh ref={midRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <circleGeometry args={[1.15, 48]} />
                <meshBasicMaterial color={PALETTE.portal.mid} transparent opacity={0.7} depthWrite={false} />
            </mesh>
            <mesh ref={coreRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
                <circleGeometry args={[0.55, 32]} />
                <meshBasicMaterial color={PALETTE.portal.core} transparent opacity={0.95} depthWrite={false} />
            </mesh>
            <pointLight
                color={LIGHTING.portalLight.color}
                intensity={LIGHTING.portalLight.intensity}
                distance={LIGHTING.portalLight.distance}
                position={[0, 1, 0]}
            />
            <PortalSwirl />
        </group>
    );
}
```

- [ ] **Step 2: Mount v CanvasRenderer3D**

Importy:

```jsx
import PortalVortex3D from './world/PortalVortex3D';
import { PORTAL_NODE_ID } from '../design/propPlacement';
```

V komponente:

```jsx
    const portalNode = useMemo(() => gridData.find(n => n.id === PORTAL_NODE_ID), [gridData]);
```

Do `<ArenaGroup>` (vedľa ArenaAmbientParticles):

```jsx
                    {/* Centrálny magický vír — srdce ostrova */}
                    {portalNode && (
                        <PortalVortex3D position={[portalNode.position[0], 0.55, portalNode.position[2]]} />
                    )}
```

- [ ] **Step 3: Vizuálne overenie + commit**

Na strede dosky rotuje modro-tyrkysový vír s bielym jadrom, iskry špirálujú nahor, okolité dlaždice osvetľuje cyan svetlo, bloom mu dáva žiaru.

Run: `npm run lint --workspace=client` → PASS.

```bash
git add packages/client/src
git commit -m "Painted Realm: centrálny portálový vír (PortalVortex3D)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Rekvizity biómov (5 komponentov)

**Files:**
- Create: `packages/client/src/components/world/CrystalSpire3D.jsx`
- Create: `packages/client/src/components/world/BlossomTree3D.jsx`
- Create: `packages/client/src/components/world/AcidPool3D.jsx`
- Create: `packages/client/src/components/world/RockSpikes3D.jsx`
- Create: `packages/client/src/components/world/DesertStones3D.jsx`

**Interfaces:**
- Consumes: `BIOME_SPECS`, `PALETTE` z Task 1; `createSeededRandom(seed)` z Task 2.
- Produces: každý default export `({ seed = 1 })`, vykresľuje sa vo svetových súradniciach (Y = hore), koreň na y=0 (vrch dlaždice). Task 10 ich mountne.

- [ ] **Step 1: CrystalSpire3D.jsx**

```jsx
import { useMemo } from 'react';
import { BIOME_SPECS } from '../../design/worldDesign';
import { createSeededRandom } from '../../design/seededRandom';

// Zhluk tyrkysových kryštálov — dominanta ľadovca (worldImage: štít s kryštálom).
export default function CrystalSpire3D({ seed = 1 }) {
    const crystals = useMemo(() => {
        const rnd = createSeededRandom(seed);
        return Array.from({ length: 5 }, (_, i) => ({
            angle: rnd() * Math.PI * 2,
            r: i === 0 ? 0 : 0.25 + rnd() * 0.45,
            h: i === 0 ? 1.5 : 0.5 + rnd() * 0.7,
            tiltX: (rnd() - 0.5) * 0.5,
            tiltZ: (rnd() - 0.5) * 0.5,
        }));
    }, [seed]);

    return (
        <group>
            {crystals.map((c, i) => (
                <group
                    key={i}
                    position={[Math.cos(c.angle) * c.r, 0, Math.sin(c.angle) * c.r]}
                    rotation={[c.tiltX, 0, c.tiltZ]}
                >
                    <mesh position={[0, c.h / 2, 0]} castShadow>
                        <coneGeometry args={[0.14 + c.h * 0.08, c.h, 5]} />
                        <meshStandardMaterial
                            color={BIOME_SPECS.GLACIER.accent}
                            emissive={BIOME_SPECS.GLACIER.accent}
                            emissiveIntensity={0.4}
                            roughness={0.15}
                            metalness={0}
                            flatShading
                        />
                    </mesh>
                </group>
            ))}
            <pointLight color={BIOME_SPECS.GLACIER.accent} intensity={0.6} distance={4} position={[0, 1, 0]} />
        </group>
    );
}
```

- [ ] **Step 2: BlossomTree3D.jsx**

```jsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { BIOME_SPECS } from '../../design/worldDesign';
import { createSeededRandom } from '../../design/seededRandom';

const TRUNK_COLOR = '#201d27'; // tmavý pokrútený kmeň z worldImage
const PETAL_COUNT = 8;

// Padajúce lupienky pod korunou.
function FallingPetals({ seed }) {
    const pointsRef = useRef();
    const seeds = useMemo(() => {
        const rnd = createSeededRandom(seed + 100);
        return Array.from({ length: PETAL_COUNT }, () => ({
            angle: rnd() * Math.PI * 2,
            r: 0.3 + rnd() * 0.6,
            phase: rnd() * Math.PI * 2,
            speed: 0.15 + rnd() * 0.2,
        }));
    }, [seed]);
    const positions = useMemo(() => new Float32Array(PETAL_COUNT * 3), []);

    useFrame((state) => {
        if (!pointsRef.current) return;
        const time = state.clock.elapsedTime;
        const posAttr = pointsRef.current.geometry.attributes.position;
        for (let i = 0; i < PETAL_COUNT; i++) {
            const s = seeds[i];
            const y = 1.6 - ((time * s.speed + s.phase) % 1.6);
            posAttr.setXYZ(
                i,
                Math.cos(s.angle) * s.r + Math.sin(time * 1.5 + s.phase) * 0.12,
                y,
                Math.sin(s.angle) * s.r,
            );
        }
        posAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            </bufferGeometry>
            <pointsMaterial color={BIOME_SPECS.LUSH_FOREST.accent} size={0.07} transparent opacity={0.9} depthWrite={false} />
        </points>
    );
}

// Ružový strom z lúky (worldImage vpravo).
export default function BlossomTree3D({ seed = 1 }) {
    const rnd = useMemo(() => createSeededRandom(seed), [seed]);
    const lean = useMemo(() => (rnd() - 0.5) * 0.35, [rnd]);

    return (
        <group rotation={[0, 0, lean]}>
            {/* Kmeň + konár */}
            <mesh position={[0, 0.55, 0]} castShadow>
                <cylinderGeometry args={[0.09, 0.15, 1.1, 6]} />
                <meshStandardMaterial color={TRUNK_COLOR} roughness={1} metalness={0} flatShading />
            </mesh>
            <mesh position={[0.28, 0.95, 0]} rotation={[0, 0, -0.7]} castShadow>
                <cylinderGeometry args={[0.05, 0.08, 0.6, 5]} />
                <meshStandardMaterial color={TRUNK_COLOR} roughness={1} metalness={0} flatShading />
            </mesh>
            {/* Koruna — 3 ružové gule */}
            <mesh position={[0, 1.35, 0]} castShadow>
                <sphereGeometry args={[0.55, 10, 8]} />
                <meshStandardMaterial color={BIOME_SPECS.LUSH_FOREST.accent} roughness={1} metalness={0} flatShading />
            </mesh>
            <mesh position={[0.5, 1.15, 0.1]} castShadow>
                <sphereGeometry args={[0.4, 9, 7]} />
                <meshStandardMaterial color={BIOME_SPECS.LUSH_FOREST.accent} roughness={1} metalness={0} flatShading />
            </mesh>
            <mesh position={[-0.35, 1.1, -0.15]} castShadow>
                <sphereGeometry args={[0.32, 9, 7]} />
                <meshStandardMaterial color={BIOME_SPECS.LUSH_FOREST.accent} roughness={1} metalness={0} flatShading />
            </mesh>
            <FallingPetals seed={seed} />
        </group>
    );
}
```

- [ ] **Step 3: AcidPool3D.jsx**

```jsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { BIOME_SPECS } from '../../design/worldDesign';
import { createSeededRandom } from '../../design/seededRandom';

// Kyselinové jazierko s magenta kvetmi (worldImage: močiar dole).
export default function AcidPool3D({ seed = 1 }) {
    const poolRef = useRef();

    const flowers = useMemo(() => {
        const rnd = createSeededRandom(seed);
        return Array.from({ length: 5 }, () => ({
            angle: rnd() * Math.PI * 2,
            r: 0.95 + rnd() * 0.35,
        }));
    }, [seed]);

    useFrame((state) => {
        if (poolRef.current?.material) {
            poolRef.current.material.emissiveIntensity = 0.75 + 0.2 * Math.sin(state.clock.elapsedTime * 1.8);
        }
    });

    return (
        <group>
            <mesh ref={poolRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
                <circleGeometry args={[0.9, 24]} />
                <meshStandardMaterial
                    color={BIOME_SPECS.TOXIC_SWAMP.accent}
                    emissive={BIOME_SPECS.TOXIC_SWAMP.accent}
                    emissiveIntensity={0.85}
                    roughness={0.4}
                    metalness={0}
                />
            </mesh>
            {flowers.map((f, i) => (
                <mesh key={i} position={[Math.cos(f.angle) * f.r, 0.05, Math.sin(f.angle) * f.r]}>
                    <sphereGeometry args={[0.055, 6, 5]} />
                    <meshStandardMaterial
                        color={BIOME_SPECS.TOXIC_SWAMP.accentFlower}
                        emissive={BIOME_SPECS.TOXIC_SWAMP.accentFlower}
                        emissiveIntensity={0.5}
                        roughness={0.6}
                        metalness={0}
                    />
                </mesh>
            ))}
            <pointLight color={BIOME_SPECS.TOXIC_SWAMP.accent} intensity={0.5} distance={3.5} position={[0, 0.5, 0]} />
        </group>
    );
}
```

- [ ] **Step 4: RockSpikes3D.jsx**

```jsx
import { useMemo } from 'react';
import { BIOME_SPECS } from '../../design/worldDesign';
import { createSeededRandom } from '../../design/seededRandom';

// Červené skalné ihly (worldImage: štíty vľavo). Žiadna emisia — len tvar a farba.
export default function RockSpikes3D({ seed = 1 }) {
    const spikes = useMemo(() => {
        const rnd = createSeededRandom(seed);
        return Array.from({ length: 4 }, (_, i) => ({
            angle: rnd() * Math.PI * 2,
            r: i === 0 ? 0 : 0.3 + rnd() * 0.5,
            h: i === 0 ? 1.2 : 0.6 + rnd() * 0.5,
            base: 0.18 + rnd() * 0.12,
            tiltX: (rnd() - 0.5) * 0.35,
            tiltZ: (rnd() - 0.5) * 0.35,
        }));
    }, [seed]);

    return (
        <group>
            {spikes.map((s, i) => (
                <group
                    key={i}
                    position={[Math.cos(s.angle) * s.r, 0, Math.sin(s.angle) * s.r]}
                    rotation={[s.tiltX, 0, s.tiltZ]}
                >
                    <mesh position={[0, s.h / 2, 0]} castShadow>
                        <coneGeometry args={[s.base, s.h, 5]} />
                        <meshStandardMaterial
                            color={i % 2 === 0 ? BIOME_SPECS.BARRENS.base : BIOME_SPECS.BARRENS.light}
                            roughness={1}
                            metalness={0}
                            flatShading
                        />
                    </mesh>
                </group>
            ))}
        </group>
    );
}
```

- [ ] **Step 5: DesertStones3D.jsx**

```jsx
import { useMemo } from 'react';
import { BIOME_SPECS } from '../../design/worldDesign';
import { createSeededRandom } from '../../design/seededRandom';

// Suché kamene púštneho okraja — najtichšia rekvizita, bez emisie.
export default function DesertStones3D({ seed = 1 }) {
    const stones = useMemo(() => {
        const rnd = createSeededRandom(seed);
        return Array.from({ length: 5 }, () => ({
            angle: rnd() * Math.PI * 2,
            r: 0.2 + rnd() * 0.7,
            s: 0.12 + rnd() * 0.1,
            rotY: rnd() * Math.PI,
            light: rnd() > 0.5,
        }));
    }, [seed]);

    return (
        <group>
            {stones.map((st, i) => (
                <mesh
                    key={i}
                    position={[Math.cos(st.angle) * st.r, st.s * 0.6, Math.sin(st.angle) * st.r]}
                    rotation={[0, st.rotY, 0]}
                    scale={st.s}
                    castShadow
                >
                    <dodecahedronGeometry args={[1, 0]} />
                    <meshStandardMaterial
                        color={st.light ? BIOME_SPECS.DESERT.base : BIOME_SPECS.DESERT.light}
                        roughness={1}
                        metalness={0}
                        flatShading
                    />
                </mesh>
            ))}
        </group>
    );
}
```

- [ ] **Step 6: Lint + commit**

Run: `npm run lint --workspace=client` → PASS (komponenty zatiaľ nikto nemountuje — to je Task 10).

```bash
git add packages/client/src/components/world/
git commit -m "Painted Realm: rekvizity biómov — kryštál, strom, jazierko, skaly, kamene

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: Mount rekvizít cez propPlacement

**Files:**
- Modify: `packages/client/src/components/CanvasRenderer3D.jsx`

**Interfaces:**
- Consumes: `computePropPlacements` z Task 2; 5 komponentov z Task 9 (`({ seed })`, koreň na y=0).
- Produces: rekvizity vo svetových súradniciach na vrchu dlaždíc (y=0.45), presne 9 kusov.

- [ ] **Step 1: Importy a výpočet**

```jsx
import { computePropPlacements } from '../design/propPlacement';
import CrystalSpire3D from './world/CrystalSpire3D';
import BlossomTree3D from './world/BlossomTree3D';
import AcidPool3D from './world/AcidPool3D';
import RockSpikes3D from './world/RockSpikes3D';
import DesertStones3D from './world/DesertStones3D';

const PROP_COMPONENTS = {
    CRYSTAL_SPIRE: CrystalSpire3D,
    BLOSSOM_TREE: BlossomTree3D,
    ACID_POOL: AcidPool3D,
    ROCK_SPIKES: RockSpikes3D,
    DESERT_STONES: DesertStones3D,
};
```

V komponente:

```jsx
    const propPlacements = useMemo(() => computePropPlacements(gridData), [gridData]);
```

- [ ] **Step 2: Render do ArenaGroup**

Za blok hexov (pred ArenaAmbientParticles):

```jsx
                    {/* Rekvizity biómov — deterministicky na "jadre" každého biómu */}
                    {gridData.filter(n => propPlacements.has(n.id)).map(n => {
                        const PropComponent = PROP_COMPONENTS[propPlacements.get(n.id)];
                        if (!PropComponent) return null;
                        return (
                            <group key={`prop_${n.id}`} position={[n.position[0], 0.45, n.position[2]]}>
                                <PropComponent seed={n.macroIndex * 7 + n.subIndex + 1} />
                            </group>
                        );
                    })}
```

(y=0.45 = hrúbka dlaždice 0.4 + bevel 0.05. Rekvizity úmyselne neinheritujú hover-lift dlaždice — sú to scenérie, nie súčasť dlaždice.)

- [ ] **Step 3: Vizuálne overenie + commit**

Na doske je 9 rekvizít (1 na metapozíciu), typ sedí s biómom pod ňou (kryštál na snehu, strom na tráve, jazierko na tmavej skale…), portálový hex je voľný.

Run: `npm run lint --workspace=client` → PASS. `npm run test --workspace=client` → PASS.

```bash
git add packages/client/src/components/CanvasRenderer3D.jsx
git commit -m "Painted Realm: mount rekvizít biómov cez deterministický propPlacement

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: FloatingShards3D — vznášajúce sa úlomky

**Files:**
- Create: `packages/client/src/components/world/FloatingShards3D.jsx`
- Modify: `packages/client/src/components/CanvasRenderer3D.jsx`

**Interfaces:**
- Consumes: `PALETTE`, `WORLD.shardCount` z Task 1; `createSeededRandom` z Task 2.
- Produces: `<FloatingShards3D />` (bez props) — mountuje sa MIMO `ArenaGroup` (nemá sa triasť pri shake).

- [ ] **Step 1: FloatingShards3D.jsx**

```jsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE, WORLD } from '../../design/worldDesign';
import { createSeededRandom } from '../../design/seededRandom';

// Odlomené skalné úlomky vznášajúce sa okolo ostrova (worldImage: kamene pod ostrovom).
export default function FloatingShards3D() {
    const groupRef = useRef();

    const shards = useMemo(() => {
        const rnd = createSeededRandom(97);
        return Array.from({ length: WORLD.shardCount }, () => ({
            angle: rnd() * Math.PI * 2,
            radius: 15 + rnd() * 10,
            y: -2 - rnd() * 6,
            scale: 0.15 + rnd() * 0.45,
            rotSpeed: 0.05 + rnd() * 0.15,
            bobPhase: rnd() * Math.PI * 2,
            bobAmp: 0.2 + rnd() * 0.3,
        }));
    }, []);

    const geometry = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);
    const material = useMemo(
        () => new THREE.MeshStandardMaterial({
            color: PALETTE.rock.underside,
            roughness: 1,
            metalness: 0,
            flatShading: true,
        }),
        [],
    );

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const time = state.clock.elapsedTime;
        groupRef.current.children.forEach((mesh, i) => {
            const s = shards[i];
            mesh.rotation.y += s.rotSpeed * delta;
            mesh.position.y = s.y + Math.sin(time * 0.4 + s.bobPhase) * s.bobAmp;
        });
    });

    return (
        <group ref={groupRef}>
            {shards.map((s, i) => (
                <mesh
                    key={i}
                    geometry={geometry}
                    material={material}
                    position={[Math.cos(s.angle) * s.radius, s.y, Math.sin(s.angle) * s.radius]}
                    scale={s.scale}
                />
            ))}
        </group>
    );
}
```

- [ ] **Step 2: Mount v CanvasRenderer3D**

```jsx
import FloatingShards3D from './world/FloatingShards3D';
```

Hneď za `<StarfieldBackground />` (mimo ArenaGroup):

```jsx
                <FloatingShards3D />
```

- [ ] **Step 3: Vizuálne overenie + commit**

Pri oddialení/naklonení kamery vidno okolo ostrova pomaly rotujúce a hojdajúce sa tmavé úlomky pod úrovňou dosky.

Run: `npm run lint --workspace=client` → PASS.

```bash
git add packages/client/src
git commit -m "Painted Realm: vznášajúce sa skalné úlomky okolo ostrova

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 12: MetapositionBorder3D + UI tokeny + prefarbenie ArenaUIOverlay

**Files:**
- Modify: `packages/client/src/components/MetapositionBorder3D.jsx`
- Modify: `packages/client/src/index.css`
- Modify: `packages/client/src/App.css` (3 neónové miesta: riadky ~5, ~79–80)
- Modify: `packages/client/src/components/ArenaUIOverlay.jsx`
- Modify: `packages/client/src/components/CanvasRenderer3D.jsx` (ak zostal dočasný `bg-[#08090e]` z Task 7, vymeň za `bg-[color:var(--space-bg)]`)

**Interfaces:**
- Consumes: `PALETTE` z Task 1.
- Produces: CSS premenné `--space-bg`, `--panel-bg`, `--panel-border`, `--accent-magic`, `--accent-enemy`, `--accent-danger`, `--accent-loot` dostupné globálne.

- [ ] **Step 1: MetapositionBorder3D — cestička namiesto neónu**

```jsx
import React from 'react';
import * as THREE from 'three';
import { PALETTE } from '../design/worldDesign';

export default function MetapositionBorder3D({ nodes, isHovered }) {
    // Nenápadná "cestičková" linka; hover zvýrazní sektor magickou cyan.
    const sectorColor = isHovered ? PALETTE.accent.magic : PALETTE.path.dirt;

    const centerNode = nodes.find(n => n.subIndex === 0);
    if (!centerNode) return null;

    return (
        <group position={[centerNode.position[0], 0.45, centerNode.position[2]]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[3.3, 3.4, 32]} />
                <meshBasicMaterial
                    color={sectorColor}
                    side={THREE.DoubleSide}
                    transparent
                    opacity={isHovered ? 0.7 : 0.25}
                />
            </mesh>
        </group>
    );
}
```

- [ ] **Step 2: CSS premenné do index.css**

Do `:root` bloku v `packages/client/src/index.css` pridaj (hodnoty MUSIA zostať 1:1 s `worldDesign.js`):

```css
  /* Painted Realm — tokeny zrkadlia packages/client/src/design/worldDesign.js */
  --space-bg: #08090e;
  --panel-bg: rgba(17, 21, 33, 0.85);      /* rock.underside + alpha */
  --panel-border: rgba(45, 211, 241, 0.25); /* accent.magic + alpha */
  --accent-magic: #2dd3f1;
  --accent-enemy: #c46884;
  --accent-danger: #7b2e8d;
  --accent-loot: #acf227;
```

- [ ] **Step 3: Prefarbenie ArenaUIOverlay**

Aplikuj tieto náhrady (Edit s `replace_all` na každý vzor; po každej over `grep`-om):

| Pôvodný vzor | Náhrada |
|---|---|
| `border-[#00ffff]/30` | `border-[color:var(--panel-border)]` |
| `text-[#00ffff]` | `text-[color:var(--accent-magic)]` |
| `text-cyan-400` | `text-[color:var(--accent-magic)]` |
| `text-cyan-500/80` | `text-[color:var(--accent-magic)]` |
| `text-cyan-500` | `text-[color:var(--accent-magic)]` |
| `bg-cyan-950` | `bg-[color:var(--panel-bg)]` |
| `accent-cyan-500` | `accent-[color:var(--accent-magic)]` |
| `from-cyan-500 to-purple-600` | `from-[color:var(--accent-magic)] to-[color:var(--accent-danger)]` |
| `focus:border-cyan-500` | `focus:border-[color:var(--accent-magic)]` |
| `bg-[#0e0e16]/80` | `bg-[color:var(--panel-bg)]` |

Potom prejdi zvyšok: `grep -n "cyan\|#00ff\|#0ff\|amber\|#d4af37\|#fbbf24\|#ffd700" packages/client/src/components/ArenaUIOverlay.jsx`
— každý ďalší nájdený cyan/neon vzor nahraď `var(--accent-magic)` ekvivalentom, zlaté (`amber-*`, `#d4af37`, `#fbbf24`, `#ffd700`) nahraď `var(--accent-loot)` ekvivalentom v rovnakom utility tvare. Červené/oranžové gameplay signály (`red-*`, `#ef4444`, `orange-*`, `#fb923c`) a HP zeleno→červenú škálu NEMEŇ.

- [ ] **Step 4: App.css — neóny na tokeny**

V `packages/client/src/App.css` nahraď všetky tri výskyty `#00ffcc` (riadky ~5 `color:`, ~79 `border-color:`, ~80 `box-shadow:`) za `var(--accent-magic)`.

- [ ] **Step 5: Overenie**

```bash
grep -c "cyan\|#00ff\|#0ff" packages/client/src/components/ArenaUIOverlay.jsx packages/client/src/App.css
```
Expected: 0 v oboch súboroch.

`./start-dev.sh`: panely sú tmavé s jemným cyan orámovaním, aktívne prvky svietia rovnakou cyan ako portál, žiadne tvrdé neóny; slider entropie, HP bary a log fungujú.

Run: `npm run lint --workspace=client` → PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/client/src
git commit -m "Painted Realm: UI tokeny (CSS premenné) + prefarbenie overlay a hraníc sektorov

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 13: Finálne overenie celku

**Files:**
- žiadne nové zmeny (len opravy, ak overenie zlyhá)

**Interfaces:**
- Consumes: všetko z Task 1–12.

- [ ] **Step 1: Statické kontroly**

```bash
npm run lint --workspace=client        # 0 chýb
npm run test --workspace=client        # worldDesign + propPlacement zelené
grep -rn "aestheticTheme" packages/client/src   # 0 výsledkov
# Neóny nesmú zostať v súboroch, ktoré plán upravoval (hero/spell VFX sú mimo scope):
grep -n "#00ffff\|#00ffcc" \
  packages/client/src/components/HexagonNode3D.jsx \
  packages/client/src/components/CanvasRenderer3D.jsx \
  packages/client/src/components/ArenaUIOverlay.jsx \
  packages/client/src/components/MetapositionBorder3D.jsx \
  packages/client/src/components/ArenaAmbientParticles.jsx \
  packages/client/src/components/AestheticCompositor.jsx \
  packages/client/src/App.css \
  packages/client/src/components/world/*.jsx   # 0 výsledkov
```

(Neóny v `ThreadMiniature`, `HeroImpactVFX`, `SpellProjectile3D`, `VolumetricFog3D`, `GameplayCompositorTemplate` sú hero/spell VFX mimo scope tohto spec-u — nechávajú sa.)

- [ ] **Step 2: Regres herného enginu (gameplay nedotknutý)**

```bash
npx ts-node packages/server/src/testEngine.ts
```
Expected: 374 assertov, 0 zlyhaní.

- [ ] **Step 3: Hrateľnosť + vizuál**

`./start-dev.sh`, otvor Vite URL, „Trénovať proti AI":
1. Ostrov sa vynorí na hviezdnom pozadí, dlaždice matné vo farbách biómov, podsady visia dole.
2. V strede rotuje portálový vír, 9 rekvizít sedí na svojich biómoch.
3. Hover dvíha dlaždicu, klik označí hex cyan prstencom, karta sa dá zahrať, flash je bledo-cyan.
4. Po pár ťahoch kolabujúce dlaždice stmavnú a odpadnú s prachom (nie fialový void).
5. UI panely ladia so scénou, HP bary čitateľné.
6. FPS od oka porovnateľné so stavom pred zmenami (žiadne viditeľné sekanie pri otáčaní kamery).

- [ ] **Step 4: Porovnanie s worldImage.png**

Sprav screenshot hry a polož si vedľa `worldImage.png`: sedí nálada (tmavý vesmír + žiariaci portál), paleta biómov a princíp „svieti len to, čo svieti v obrázku"? Ak niektorý bióm výrazne nesedí, dolaď JEDINE hodnoty vo `worldDesign.js` (nie v komponentoch) a over, že `npm run test --workspace=client` stále prechádza.

- [ ] **Step 5: Záverečný commit (ak boli doladenia)**

```bash
git add -A && git status   # skontroluj, že worldImage.png zostáva untracked!
git commit -m "Painted Realm: finálne doladenie tokenov po vizuálnom porovnaní

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

(worldImage.png sa NECOMMITUJE — rozhodnutie používateľa.)
