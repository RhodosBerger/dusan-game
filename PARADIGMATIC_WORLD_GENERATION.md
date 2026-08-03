# Paradigmatic World Generation System

## Prehľad

Tento systém predstavuje kompletný pipeline pre generovanie sveta založený na axiómoch, LLM profiloch a procedurálnych vzorcoch.

## Architektúra

```
[AXIOMS] → [CONCENTRATION ENGINE] → [LLM PROFILES] → [VARIATION COMPILER] → [AR MESH GENERATOR] → [RENDER]
```

## Komponenty

### 1. ParadigmaticConcentrationEngine.ts
- **Účel**: Generuje koncentrácie objektov podľa matematických vzorcov
- **Patterny**: CLUSTER, SPIRAL, GRID_DENSE, GRID_SPARSE, RING, FLOW_LINE, NOISE_FIELD
- **Features**:
  - 8-smerová kontrola susedstva (Octant Connectivity)
  - Gaussovské rozdelenie pre prirodzené zhluky
  - Dynamický výber typov podľa pozície

### 2. OctantConnectivityGrid.ts
- **Účel**: Spravuje pravidlá susedstva medzi objektmi
- **Pravidlá**:
  - Povolené/zakázané smery
  - Maximálny počet susedov rovnakého typu
  - Podpora pre FOREST, WATER, MOUNTAIN, URBAN biomy

### 3. LLMProfileGenerator.ts
- **Účel**: Generuje profily pre neznáme entity pomocou AI
- **Vstup**: Názov entity + kontext (axiom, biome, karma)
- **Výstup**: Komplexný profil s vizuálom, behaviorom a štatistikami
- **Cache**: Automatické ukladanie generovaných profilov

### 4. VariationCompilerEngine.ts
- **Účel**: Vytvára maticu všetkých možných variácií
- **Typy variácií**:
  - Farebné (color shift)
  - Štrukturálne (scale, rotation)
  - Behaviorálne (aggressive, passive, etc.)
  - Textúrové (texture variants)
- **Kompatibilita**: Graf kompatibilných kombinácií

### 5. ARMeshGenerator.ts
- **Účel**: Generuje AR bloky s loop pointami
- **Loop Point Typy**: SCENARIO, TRANSITION, EVENT, PUZZLE
- **Interakcie**: Podmienkové reakcie na hráča (karma, inventory)
- **Spojenia**: Horizontálne prepojenie blokov do siete

## Príklad použitia

```typescript
import { ParadigmaticConcentrationEngine } from './world/ParadigmaticConcentrationEngine';
import { AxiomLibrary } from './axioms/AxiomLibrary';
import { LLMProfileGenerator } from './llm/LLMProfileGenerator';
import { VariationCompilerEngine } from './compiler/VariationCompilerEngine';
import { ARMeshGenerator } from './augmented/ARMeshGenerator';

// 1. Inicializácia
const axiomLib = new AxiomLibrary();
const concentrationEngine = new ParadigmaticConcentrationEngine(axiomLib);
const llmGen = new LLMProfileGenerator({ endpoint: '...', model: 'gpt-4' });
const variationCompiler = new VariationCompilerEngine();
const meshGen = new ARMeshGenerator();

// 2. Generovanie koncentrácie
const concentration = concentrationEngine.generateConcentration(
  new Vector3(0, 0, 0),
  {
    pattern: 'CLUSTER',
    density: 0.7,
    spread: 0.8,
    rotation: Math.PI / 4,
    seed: 12345,
    axiomSource: 'FOREST_TIER_2'
  },
  50 // area size
);

// 3. Pre každý generovaný objekt
for (let i = 0; i < concentration.positions.length; i++) {
  const pos = concentration.positions[i];
  const type = concentration.types[i];
  
  // 4. Ak je typ neznámy, vygenerovať LLM profil
  let profile = axiomLib.getProfile(type);
  if (!profile) {
    profile = await llmGen.generateProfile(type, {
      axiomSource: 'FOREST_TIER_2',
      biomeType: 'temperate',
      nearbyEntities: concentration.types
    });
  }
  
  // 5. Skompilovať variácie
  const compilation = variationCompiler.compileVariations(type, profile);
  const selectedVariation = variationCompiler.selectBestVariation(compilation.matrix!, {
    timeOfDay: 'day',
    playerKarma: 65,
    nearbyEntities: []
  });
  
  // 6. Vygenerovať AR mesh blok
  const block = meshGen.generateBlock(
    `block_${i}`,
    pos,
    profile,
    selectedVariation || undefined
  );
  
  // 7. Pripojiť k susedným blokom
  if (i > 0) {
    meshGen.connectHorizons(`block_${i-1}`, `block_${i}`, 'bidirectional');
  }
}

// 8. Spracovanie interakcií
const actions = meshGen.handleInteraction('block_5', {
  karma: 75,
  inventory: ['sword', 'key'],
  questState: { active: true }
});
```

## Dátový tok

1. **Snapshot Trigger** → Pohyb hráča alebo zmena kontextu
2. **Axiom Lookup** → Získanie pravidiel z Axiom Library
3. **Concentration Generation** → Vytvorenie patternu objektov
4. **LLM Profile Gen** → Doplnenie neznámych entít
5. **Variation Compilation** → Vytvorenie matice možností
6. **AR Mesh Creation** → Finálne bloky s loop pointami
7. **Render Pipeline** → Vizualizácia cez Three.js

## Performance

- **Cache**: LLM profily a variácie sa cachujú
- **Lazy Loading**: Generovanie iba pre viditeľné sektory
- **LOD**: Vzdialené objekty majú menej variácií
- **Batching**: Podobné objekty sa renderujú spolu

## Rozšírenie

### Pridanie nového patternu
```typescript
// V ParadigmaticConcentrationEngine.ts
case 'NEW_PATTERN':
  return {
    x: /* vaša logika */,
    y: /* vaša logika */
  };
```

### Pridanie nového typu entity
```typescript
// V OctantConnectivityGrid.ts
this.registerRule({
  axiomType: 'NEW_TYPE',
  allowedNeighbors: ['N', 'E', 'S', 'W'],
  forbiddenNeighbors: [],
  maxAdjacentSameType: 5
});
```

### Custom LLM endpoint
```typescript
const llmGen = new LLMProfileGenerator({
  endpoint: 'https://your-api.com/generate',
  model: 'custom-model',
  apiKey: 'your-key',
  maxTokens: 500,
  temperature: 0.8
});
```

## Integrácia s existujúcim systémom

Tento systém je navrhnutý tak, aby pracoval s:
- **AxiomLibrary** z existujúceho core
- **AdaptiveRenderPipeline** pre optimalizáciu výkonu
- **SnapshotSystem** pre triggerovanie generovania
- **CSSBlueprintManager** pre vizuálne štýly

## Testovanie

```bash
npm test -- src/engine/world/ParadigmaticConcentrationEngine.test.ts
npm test -- src/engine/compiler/VariationCompilerEngine.test.ts
npm test -- src/engine/augmented/ARMeshGenerator.test.ts
```

## Budúce vylepšenia

- [ ] OpenVINO integrácia pre lokálne ML inference
- [ ] WebGL shader pre procedurálne textúry
- [ ] Multi-threading pre paralelné generovanie
- [ ] Persistentný storage pre uložené svety
- [ ] Editor pre manuálne upravovanie axiómov
