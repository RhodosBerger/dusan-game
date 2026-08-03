# Snapshot & CSS Blueprint Implementation Summary

## ✅ Dokončené komponenty

### 1. PredictiveExpansionEngine
**Súbor**: `/workspace/packages/shared/src/engine/composition/PredictiveExpansionEngine.ts`
- Generovanie snapshotov pri pohybe hráča
- Prediktívna expanzia na základe trajektórie
- Auto-hook integrácia pre zero-code logiku
- CSS blueprint hash generátor

### 2. EventHookRegistry  
**Súbor**: `/workspace/packages/shared/src/engine/hooks/auto-hook-system.ts`
- Registrácia a exekúcia skriptov (.md, .json)
- Filtrovanie hookov podľa kontextu (biome, entropia)
- Podpora dynamickej registrácie za behu
- Sandbox execution pre bezpečnosť

### 3. CSSBlueprintManager
**Súbor**: `/workspace/packages/shared/src/engine/render/css-blueprint-manager.ts`
- Správa CSS blueprintov s hash lookup
- Dynamické generovanie štýlov z herných dát
- Shader parameter dispatch cez CustomEvent
- Fallback mechanizmus pre neznáme blueprinty

### 4. HexGrid Core
**Súbor**: `/workspace/packages/shared/src/engine/geometry/hex-core.ts`
- Hexagonálna mriežka s koordinátmi (q, r)
- Distance calculation pre hex grid
- Sektor management (add, update, remove)

### 5. ProceduralGenerator
**Súbor**: `/workspace/packages/shared/src/engine/generation/procedural-engine.ts`
- Generovanie obsahu sektorov na základe seedu
- Biome selection podľa entropie
- Entity a terrain generation

## 📊 Test Coverage

**14 passing tests** v `/workspace/packages/shared/src/engine/__tests__/snapshot-system.test.ts`:

| Test Suite | Tests | Status |
|------------|-------|--------|
| PredictiveExpansionEngine | 3 | ✅ Pass |
| EventHookRegistry | 4 | ✅ Pass |
| CSSBlueprintManager | 6 | ✅ Pass |
| Integration Pipeline | 1 | ✅ Pass |

## 🎯 Kedy sa generujú nové snímky?

1. **Pohyb hráča** - Pri zmene pozície o viac ako 1 hex
2. **Zmena biomu** - Vstup do shadow/light/chaos oblasti
3. **Hook exekúcia** - Splnenie trigger podmienok z .md/.json súborov
4. **Admin intervencia** - Live Ops zmeny parametrov
5. **Prediktívna expanzia** - Automatické pre-loading sektorov v smere pohybu

## 🔄 Tok dát: Snapshot → CSS

```
Player Movement
    ↓
PredictiveExpansionEngine.update()
    ↓
CompositionalSnapshot { cssBlueprintHash, generatedEntities }
    ↓
CSSBlueprintManager.applyBlueprint(hash)
    ↓
Dynamic CSS injected to <head>
    ↓
Shader params dispatched via window.dispatchEvent('shader:update')
    ↓
Three.js/CSS Render Engine updates visuals
```

## 📝 Príklad použitia

```typescript
// Inicializácia
const engine = new PredictiveExpansionEngine({
  viewDistance: 10,
  preloadDistance: 5,
  expansionSpeed: 0.8,
  hookDirectory: '/hooks'
});

const cssManager = new CSSBlueprintManager();

// V game loope
function gameLoop(playerPos: HexCoord) {
  const snapshot = engine.update(playerPos, deltaTime);
  
  // Skús aplikovať existujúci blueprint
  let applied = cssManager.applyBlueprint(snapshot.cssBlueprintHash);
  
  // Ak neexistuje, vytvor nový dynamický
  if (!applied) {
    const blueprint = cssManager.createDynamicBlueprint(
      snapshot.cssBlueprintHash,
      snapshot.generatedEntities
    );
    cssManager.applyBlueprint(blueprint.hash);
  }
}
```

## 🔧 Zero-Code Hook Príklad

Vytvorte súbor `/hooks/shadow-event.md`:

```markdown
---
id: shadow_ambush
trigger: biome === 'shadow' && Math.random() < 0.3
priority: 10
---

return {
  modifications: context.sectors.map(s => ({
    sector: s,
    changes: { 
      enemyType: 'shadow_warrior',
      spawned: true,
      ambushChance: 0.8
    }
  }))
};
```

Tento hook sa automaticky načíta a spustí pri vstupe do shadow biome.

## 🚀 Performance Features

- **Trajectory Prediction**: Extrapolácia ďalších 5-10 hexov
- **Priority Loading**: Sektory v smere pohybu majú prioritu
- **Cleanup Mechanism**: Odstraňovanie vzdialených sektorov (> viewDistance + 2)
- **Safe Node Execution**: Funguje v browseri aj Node.js prostredí

## 📚 Dokumentácia

Kompletná dokumentácia: [`SNAPSHOT_SYSTEM_DOCS.md`](./render/SNAPSHOT_SYSTEM_DOCS.md)

## Ďalšie kroky

1. Integrovať s hlavným game loopom v `client-3d`
2. Pridať TypeScript typy pre externé hook súbory
3. Implementovať persistentné ukladanie stavu pred cleanupom
4. Rozšíriť shader parameter support pre Three.js materials
