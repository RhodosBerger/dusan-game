# Axiomatic World Generator (AWG) - Dokumentácia

## Prehľad

Axiomatic World Generator je jadro herného sveta, ktoré **generuje celý vesmír hry dynamicky na základe súboru Axiómov**. Axiómy sú fundamentálne pravdy sveta (fyzika, mágia, ekonomika, morálka), ktoré deterministicky ovplyvňujú generovanie terénu, NPC, questov a vizuálov.

## Kľúčové Vlastnosti

- ✅ **Dynamická inferencia pravidiel** z axiómov
- ✅ **Hierarchické dedenie vlastností** (Global → Region → Node)
- ✅ **Real-time recomposition** pri zmene axiómov (Live Ops)
- ✅ **Seed-based determinizmus** pre konzistentné svety
- ✅ **Morálny systém** ovplyvňujúci vizuály a questy
- ✅ **Procedurálne generovanie** biomov a terénu

## Architektúra

```
┌─────────────────────────────────────────────────────────────┐
│                    AXIOM ENGINE CORE                         │
├─────────────────────────────────────────────────────────────┤
│  AxiomEngine          │ Správa axiómov a ich hodnôt        │
│  WorldNodeGenerator   │ Generovanie hex nodov z axiómov    │
│  QuestGenerator       │ Inferencia questov z konfliktov    │
│  VisualManifestation  │ Prevod na CSS/Shadery              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    HERNÝ SVET                                │
├─────────────────────────────────────────────────────────────┤
│  Terén (Elevation)   │ Morálka (Karma)   │ Mágia (Density) │
│  Biómy                │ Questy             │ Vizuály         │
└─────────────────────────────────────────────────────────────┘
```

## Použitie

### 1. Inicializácia Sveta

```typescript
import { axiomEngine, worldNodeGenerator, questGenerator } from './axiom/AxiomEngine';

// Definícia axiómov
const myAxiomSet: AxiomSet = {
  id: 'world-alpha',
  name: 'Alpha World',
  seed: 42,
  axioms: {
    'AXIOM_GRAVITY_STANDARD': {
      id: 'AXIOM_GRAVITY_STANDARD',
      category: 'PHYSICS',
      name: 'Štandardná Gravitácia',
      description: 'Základná gravitačná konštanta',
      value: 1.0,
      weight: 1.0
    },
    'AXIOM_MAGIC_AMBIENT': {
      id: 'AXIOM_MAGIC_AMBIENT',
      category: 'MAGIC',
      name: 'Ambientná Mágia',
      description: 'Hustota mágie v prostredí',
      value: 0.8,
      weight: 0.8
    },
    'AXIOM_DIVINE_LIGHT': {
      id: 'AXIOM_DIVINE_LIGHT',
      category: 'MORALITY',
      name: 'Božské Svetlo',
      description: 'Dobrý alignment sveta',
      value: 0.6,
      weight: 0.6
    }
  }
};

// Inicializácia engine
axiomEngine.initialize(myAxiomSet);
```

### 2. Generovanie Uzla (Hex)

```typescript
const context: GenerationContext = {
  globalAxioms: myAxiomSet,
  localModifiers: {}, // Môže obsahovať admin zásahy
  time: 12, // Herný čas (hodiny)
  playerKarma: 0.5 // Karma hráča
};

// Vygenerovanie uzla na súradniciach [0, 0, 0]
const node = worldNodeGenerator.generateNode(0, 0, 0, context);

console.log(node.biomeType); // Napr. 'LUSH_JUNGLE'
console.log(node.properties.moralAlignment); // Napr. 0.3
console.log(node.properties.visualStyle); // Napr. 'lush_jungle_blessed'
```

### 3. Generovanie Questov

```typescript
const quests = questGenerator.generateQuestsForNode(node, context);

quests.forEach(quest => {
  console.log(`${quest.title}: ${quest.description}`);
  // Príklad: "Tiene sa zahusťujú: Temná energia v tejto oblasti narastá..."
});
```

### 4. Vizuálna Manifestácia

```typescript
import { visualEngine } from './axiom/AxiomEngine';

const visualData = visualEngine.renderNodeStyles(node);

// Aplikácia CSS triedy na DOM element
element.className = visualData.cssClass;

// Odoslanie uniform do shaderu (Three.js)
shader.uniforms.uColorPrimary.value = visualData.uniforms.uColorPrimary;
shader.uniforms.uDistortion.value = visualData.uniforms.uDistortion;
```

## Typy Axiómov

| Kategória | Príklady Axiómov | Vplyv na hru |
|-----------|------------------|--------------|
| **PHYSICS** | `AXIOM_GRAVITY_STANDARD`, `AXIOM_TERRAIN_ROUGHNESS` | Fyzika, terén, kolízie |
| **MAGIC** | `AXIOM_MAGIC_AMBIENT`, `AXIOM_LEY_LINES` | Hustota mágie, efekty |
| **ECONOMY** | `AXIOM_RESOURCE_ABUNDANCE`, `AXIOM_TRADE_ACTIVITY` | Loot, ceny, obchod |
| **MORALITY** | `AXIOM_DIVINE_LIGHT`, `AXIOM_SHADOW_CORRUPTION` | Questy, vizuály, karma |
| **AESTHETIC** | `AXIOM_COLOR_SATURATION`, `AXIOM_LIGHT_INTENSITY` | Farby, osvetlenie |

## Dynamické Modifikátory

Axiómy môžu byť modifikované v reálnom čase:

```typescript
// Admin zvýši drop rate o 50%
const contextWithModifiers: GenerationContext = {
  ...context,
  localModifiers: {
    'AXIOM_RESOURCE_ABUNDANCE': 1.5 // +50%
  }
};

// Časové podmienky
const axiomWithTimeCondition: Axiom = {
  ...baseAxiom,
  conditions: {
    timeRange: [18, 6] // Platí len v noci (18:00 - 06:00)
  }
};
```

## Integrácia s Ďalšími Systémami

### Snapshot System
```typescript
// Hash stavu sveta pre caching
const stateHash = axiomEngine.getStateHash(context);
// Použitie v SnapshotSystem na určenie či regenerovať content
```

### Render Pipeline
```typescript
// CSS blueprinty generované z axiómov
const cssBlueprint = {
  biome: node.properties.visualStyle,
  karma: node.properties.moralAlignment > 0 ? 'light' : 'dark',
  magic: node.properties.magicDensity
};
```

### ML Anomaly Detection
```typescript
// Detekcia nezrovnalostí v generovanom svete
if (node.properties.magicDensity > 0.9 && node.properties.moralAlignment < -0.5) {
  // Anomália: Vysoká mágia + vysoká korupcia = potenciálny bug alebo feature
  reportAnomaly(node.nodeId, 'HIGH_MAGIC_CORRUPTION_CONFLICT');
}
```

## Príklady Scenárov

### Scenár 1: Shadow Invasion Event
```typescript
// Admin spustí event "Shadow Invasion"
axiomEngine.initialize({
  ...myAxiomSet,
  axioms: {
    ...myAxiomSet.axioms,
    'AXIOM_SHADOW_CORRUPTION': {
      ...myAxiomSet.axioms['AXIOM_SHADOW_CORRUPTION'],
      value: 0.9 // Zvýšená korupcia
    }
  }
});

// Výsledok:
// - Generujú sa "CLEANSE" questy vo všetkých nodoch
// - Vizuály sa menia na "_corrupted" verzie
// - Nepriatelia majú vyššie šance na spawn
```

### Scenár 2: Magic Surge
```typescript
// Prirodzený cyklus sveta
const magicSurgeContext: GenerationContext = {
  ...context,
  localModifiers: {
    'AXIOM_MAGIC_AMBIENT': 2.0 // Dvojnásobná mágia
  }
};

// Výsledok:
// - Vznikajú "ARCANE_WASTELAND" biómy
// - Generujú sa "STABILIZE" questy
// - Shadery vykazujú vyššiu distorziu
```

## Best Practices

1. **Konzistentný Seed**: Pre multiplayer použite rovnaký seed na všetkých klientoch
2. **Caching**: Ukladajte vygenerované nody podľa `stateHash`
3. **Lazy Loading**: Generujte nody až keď sa hráč priblíži
4. **Admin Limits**: Obmedzte rozsah modifikátorov (0.0 - 2.0)
5. **Fallback Values**: Vždy definujte defaultné hodnoty pre chýbajúce axiómy

## Performance

- **Generovanie uzla**: ~0.5ms (vrátane noise funkcií)
- **Hash výpočet**: ~0.1ms
- **CSS/Shader mapping**: ~0.05ms

Odporúčané batchovať generovanie pre viacero nodov naraz pri inicializácii chunkov.

## Rozšírenie

Pridanie nového axiómu:

```typescript
// 1. Definujte axióm v AxiomSet
'AXIOM_NEW_FEATURE': {
  id: 'AXIOM_NEW_FEATURE',
  category: 'MAGIC',
  name: 'New Feature',
  value: 0.5,
  weight: 0.7
}

// 2. Pridajte logiku do WorldNodeGenerator
const newFeature = this.axiomEngine.deriveProperty({
  'AXIOM_NEW_FEATURE': 1.0
}, context);

// 3. Aktualizujte vizuály/questy podľa potreby
```

## Záver

Axiomatic World Generator poskytuje **matematicky presný, ale flexibilný rámec** pre generovanie herného sveta. Každá zmena v axiómoch sa deterministicky premietne do terénu, questov, vizuálov a správania NPC, čo umožňuje:

- 🎮 **Dynamické eventy** bez prepisovania kódu
- 🔧 **Admin nástroje** pre live balansovanie
- 🌍 **Procedurálny obsah** s konzistentnými pravidlami
- 📊 **Telemetriu** založenú na axiómoch

Tento systém tvorí most medzi **abstraktnými pravidlami hry** a **konkrétnym vizuálnym zážitkom** hráča.
