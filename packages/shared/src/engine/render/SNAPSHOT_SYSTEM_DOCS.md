# Snapshot & CSS Blueprint System Documentation

## Prehľad systému

Tento systém riadi **kedy a ako** sa generujú nové snímky (snapshots) herného sveta a ako sa tieto snímky premietajú do vizuálnej reprezentácie prostredníctvom CSS blueprintov.

## Kedy sa generuje nová snímka?

Nová snímka (`CompositionalSnapshot`) sa generuje pri nasledujúcich udalostiach:

### 1. Pohyb hráča (Player Movement)
```typescript
// Pri každom pohybe na nový hex
engine.update(playerPosition, deltaTime);
```
- **Spúšťač**: Zmena pozície hráča o viac ako 1 hex
- **Výsledok**: Nová snímka s `cssBlueprintHash` pre danú oblasť

### 2. Zmena kontextu (Context Shift)
- Vstup do nového biomu (shadow → light → chaos)
- Zmena globálnej entropie sveta
- Aktivácia tieňového boja (Shadow War)

### 3. Exekúcia Hookov (Hook Execution)
Keď sa spustí automatický hook z `.md` alebo `.json` súboru:
```markdown
# Príklad hooku v súbore hooks/shadow-event.md
trigger: biome == 'shadow' && entropy > 0.7
action: spawn_enemies(count=5, type='shadow_warrior')
visual: apply_blueprint('bp_chaos_default')
```

### 4. Administratívna intervencia (Admin Override)
- Live Ops slider zmena (napr. "Zvýšiť drop rate")
- Núdzová zmena difficulty
- Event activation (Happy Hour, Double XP)

### 5. Prediktívna expanzia (Predictive Expansion)
- Systém predpovedá kam hráč pôjde a **pred-generuje** snímky pre tieto sektory
- Minimalizuje oneskorenie renderingu

## Ako sa menia CSS blueprinty?

### Tok dát:
```
[Snapshot Generated] 
    ↓
[cssBlueprintHash calculated] 
    ↓
[CSSBlueprintManager.applyBlueprint(hash)] 
    ↓
[Dynamic CSS injected to <head>] 
    ↓
[Shader params dispatched via CustomEvent] 
    ↓
[Render Engine updates visuals]
```

### Príklad zmeny štýlu:

**Pred vstupom do shadow biome:**
```css
.game-container {
  --sector-bg-color: #f0f4ff;
  --border-glow: 0 0 15px #ffd700;
  --entity-opacity: 1.0;
}
```

**Po vstupe do shadow biome (nová snímka):**
```css
.game-container {
  --sector-bg-color: #1a0a2e;
  --border-glow: 0 0 10px #6a0dad;
  --entity-opacity: 0.8;
}
```

## Auto-Hook System (Zero-Code Logic)

Hooky umožňujú meniť správanie hry bez kódovania:

### Štruktúra hooku:
```json
{
  "id": "karma_event_001",
  "triggerCondition": "player.karma < -0.5 && sector.biome == 'light'",
  "scriptContent": "return { modifications: [...] }",
  "priority": 10
}
```

### Kde sa ukladajú hooky:
- `/hooks/*.md` - Markdown hooky (pre dizajnérov)
- `/hooks/*.json` - JSON hooky (pre dáta)
- `/hooks/*.js` - JavaScript hooky (pre komplexnú logiku)

## Predikcia vývoja (Predictive Development)

Systém **predpovedá** aké snímky budú potrebné:

1. **Trajectory Analysis**: Sleduje posledných 20 pozícií hráča
2. **Linear Extrapolation**: Predpovedá ďalších 5-10 hexov v smere pohybu
3. **Preloading**: Generuje obsah pre tieto hexy vopred
4. **Priority Loading**: Sektor v smere pohybu má vyššiu prioritu

## Performance optimalizácie

### LOD (Level of Detail) podľa vzdialenosti:
| Vzdialenosť | Stav | Render kvalita |
|-------------|------|----------------|
| 0-3 hexy    | Active | Full detail, animácie |
| 4-7 hexov   | Preloaded | Stredná kvalita |
| 8+ hexov    | Pending | Low-poly placeholder |

### Cleanup mechanizmus:
- Sektory vzdialené viac ako `viewDistance + 2` sa odstránia z pamäte
- Stav sa môže uložiť do persistentného úložiska pred zmazaním

## Integrácia s renderingom

### React/Three.js integrácia:
```tsx
useEffect(() => {
  const handleSnapshot = (e: CustomEvent) => {
    const snapshot = e.detail as CompositionalSnapshot;
    
    // Aplikuj CSS blueprint
    cssManager.applyBlueprint(snapshot.cssBlueprintHash);
    
    // Update Three.js scény
    updateScene(snapshot.generatedEntities);
  };
  
  window.addEventListener('composition:snapshot', handleSnapshot);
  return () => window.removeEventListener('composition:snapshot', handleSnapshot);
}, []);
```

## Príklady použitia

### 1. Vytvorenie dynamickej snímky:
```typescript
const engine = new PredictiveExpansionEngine({
  viewDistance: 10,
  preloadDistance: 5,
  expansionSpeed: 0.8,
  hookDirectory: '/hooks'
});

const snapshot = engine.update(playerPos, deltaTime);
console.log(`New snapshot: ${snapshot.id} with blueprint ${snapshot.cssBlueprintHash}`);
```

### 2. Registrácia vlastného hooku za behu:
```typescript
engine.registerHookScript(
  'custom_boss_spawn',
  `return { modifications: [{ sector: context.sectors[0], changes: { boss: true } }] }`,
  "sectors.length > 0 && Math.random() < 0.05"
);
```

### 3. Vytvorenie custom CSS blueprintu:
```typescript
const blueprint = cssManager.createDynamicBlueprint('bp_custom_001', entities);
cssManager.applyBlueprint(blueprint.hash);
```

## Zhrnutie

| Komponent | Účel | Kedy sa spúšťa |
|-----------|------|----------------|
| `PredictiveExpansionEngine` | Generovanie snapshotov | Pri pohybe, časovač |
| `EventHookRegistry` | Exekúcia skriptov | Pri splnení trigger podmienok |
| `CSSBlueprintManager` | Aplikácia štýlov | Pri zmene snapshotu |
| `Auto-Hook System` | Zero-code logika | Načítaním z file systému |

Tento systém zabezpečuje, že hra je **dynamická**, **reaktívna** a **vizuálne konzistentná** bez potreby neustáleho prepisovania kódu.
