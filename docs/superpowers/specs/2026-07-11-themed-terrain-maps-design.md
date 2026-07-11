# Územné (témové) mapy — dizajn

**Dátum:** 2026-07-11
**Nadväzuje na:** Painted Realm dizajn systém (`docs/superpowers/specs/2026-07-09-hex-world-design-system-design.md`)
**Stav:** návrh schválený, čaká na implementačný plán

## Cieľ

Pridať tri „územné" mapy postavené na Painted Realm systéme, kde je celý svet jeden bióm — akoby sa bojovalo na konkrétnom území:
- ❄️ **Ľadová** (GLACIER)
- ☠️ **Toxická** (TOXIC_SWAMP)
- 🌲 **Lesná** (LUSH_FOREST)

Súčasná zmiešaná mapa (🌍 default Painted Realm ostrov s viacerými biómami) zostáva ako štvrtá voľba.

**Rozsah:** LEN VIZUÁL, čisto klient. `packages/server`, `packages/shared` (vrátane `BiomeEngine`) a gameplay logika sa NEMENIA. Fyzika biómu (trenie, vodivosť, hazard) ostáva riadená autoritatívnou zmiešanou mapou zo servera; témová mapa mení iba to, ako svet vyzerá. Vedomý kompromis „len vizuál pre teraz" — fyzika/iné veci sa dajú doplniť neskôr.

## 1. Dátový model máp

Do `packages/client/src/design/worldDesign.js` (jediný zdroj pravdy):

```js
export const TERRAIN_MAPS = [
  { id: 'MIXED',        label: 'Zmiešaná',  icon: '🌍', forcedBiome: null },
  { id: 'GLACIER',      label: 'Ľadová',    icon: '❄️', forcedBiome: 'GLACIER' },
  { id: 'TOXIC_SWAMP',  label: 'Toxická',   icon: '☠️', forcedBiome: 'TOXIC_SWAMP' },
  { id: 'LUSH_FOREST',  label: 'Lesná',     icon: '🌲', forcedBiome: 'LUSH_FOREST' },
];
export const DEFAULT_TERRAIN_MAP = 'MIXED';
```

Každý `forcedBiome` (okrem MIXED) musí byť kľúč v `BIOME_SPECS`.

## 2. Override biómu pri renderi

`HexagonNode3D` dnes počíta `biomeInfo = BiomeEngine.getBiomeForHex(macroIndex, subIndex)`. Pribudne prop `terrainMap` (id mapy). Efektívny render bióm:
- `terrainMap === 'MIXED'` alebo neznáme → `BiomeEngine.getBiomeForHex(...)` (dnešné správanie, bez zmeny).
- inak → `forcedBiome` z `TERRAIN_MAPS` pre všetky hexy.

Prepisuje sa **len bióm použitý na vizuál** (textúra, tint, emisia, častice, výber rekvizity). `mlInfo` (`MLTerrainSynthesizer.synthesizeBlock`) sa naďalej počíta podľa (macroIndex, subIndex), takže aj témová mapa má prirodzenú jemnú per-hex variáciu (colorSaturation, lightEmission…). `BiomeEngine` sa nemení.

Emisné častice a žiara sa naviažu na override bióm: ľadová mapa → sneh + tyrkysové kryštály na celom svete; toxická → výpary + žiariace kyselinové jazierka + magenta kvety; lesná → svätojánske mušky + ružové stromy.

## 3. Vizuálna bohatosť

### Tonálne variácie dlaždíc
Nový čistý pomocník `packages/client/src/design/terrainTone.js`:

```js
export function terrainToneFactor(macroIndex, subIndex) { /* deterministic seededRandom → [0,1] */ }
```

V `HexagonNode3D.baseTint` sa base farba biómu premieša k `light` variante podľa tohto faktora so silou ~0.35 → svetlé/tmavé fľaky. Platí pre všetky mapy (na zmiešanej neškodí). Deterministické, testovateľné.

### Hustejšie rekvizity
`computePropPlacements(gridData, terrainMap)` dostane parameter mapy:
- **MIXED** → dnešné správanie: 1 rekvizita na metapozíciu (9 spolu), na „jadre" biómu, portál (`m4_s0`) vynechaný.
- **Témová** → hustejšie: ~2 rekvizity na metapozíciu (≈18 spolu), deterministicky vybrané hexy, portál vždy vynechaný, typ = rekvizita `forcedBiome`.

Interface ostáva `Map<nodeId, propType>`. Determinizmus zachovaný (bez `Math.random`).

### Variácia veľkosti/rotácie
Render slučka rekvizít v `CanvasRenderer3D` pridá na obalový `<group>` seed-riadený `scale` (≈0,8–1,2) a `rotation-y` z per-hex seedu (`createSeededRandom`). Rekvizity tak nie sú klony.

## 4. Lobby a tok dát

`LobbyScreen` dostane picker máp — riadok 4 volieb z `TERRAIN_MAPS` (ikona + label), rovnaký štýl ako existujúci výber hrdinu. Stav `selectedMap` (default `'MIXED'`) sa posunie hore cez `onStartGame`/`onSearchMatch` payload ako `terrainMap`.

```
LobbyScreen (selectedMap)
  → App.jsx: setTerrainMap(payload.terrainMap || 'MIXED')   // len klient, do socketu sa neposiela
    → CanvasRenderer3D terrainMap={terrainMap}
        → HexagonNode3D terrainMap                 (override biómu + tón)
        → computePropPlacements(gridData, terrainMap)  (hustota)
```

Server ostáva netknutý (rovnako ako pri zrušenej estetickej téme). Portál sa mountuje na `PORTAL_NODE_ID` nezávisle od biómu → ostáva v strede na všetkých mapách bez zmeny.

## 5. Súbory

```
packages/client/src/design/worldDesign.js          (+ TERRAIN_MAPS, DEFAULT_TERRAIN_MAP)
packages/client/src/design/terrainTone.js            (nový — terrainToneFactor)
packages/client/src/design/propPlacement.js           (+ terrainMap param, hustejšie témové rozloženie)
packages/client/src/components/HexagonNode3D.jsx        (+ terrainMap prop → effectiveBiome + tón)
packages/client/src/components/CanvasRenderer3D.jsx      (+ terrainMap → pass down, témový propPlacement, seed scale/rot rekvizít)
packages/client/src/App.jsx                              (+ terrainMap stav z lobby → renderer)
packages/client/src/components/LobbyScreen.jsx            (+ picker máp)
packages/client/src/design/__tests__/                     (+ testy TERRAIN_MAPS, terrainTone, rozšírený propPlacement)
```

## 6. Overenie

1. `npm run test --workspace=client` (vitest):
   - `TERRAIN_MAPS`: 4 mapy; MIXED → `forcedBiome === null`; 3 témové id ∈ `BIOME_SPECS`, každé s non-null `forcedBiome`.
   - `terrainToneFactor`: deterministické (rovnaký hex → rovnaká hodnota), rozsah [0,1].
   - `computePropPlacements`: témová mapa → hustejšie (>9, ≈18), portál (`m4_s0`) vynechaný, deterministické, každý prop = `forcedBiome` rekvizita; MIXED → nezmenené (9, 1/metapozícia).
2. `npm run lint --workspace=client` → 0 chýb (len pre-existujúce warningy).
3. Engine regresný test nedotknutý (klient-only zmena).
4. Browser: z lobby spustiť ❄️/☠️/🌲 + 🌍, screenshot každej; overiť jednotný bióm cez celý svet, portál v strede, hustejšie variované rekvizity, 0 chýb v konzole.

## 7. Riziká a rozhodnutia

- **„Len vizuál" nesúlad:** hex môže vyzerať ľadovo, ale mať gameplay fyziku zo zmiešanej serverovej mapy. Vedome akceptované pre túto fázu.
- **Lobby paleta:** lobby je stále v starej cyan/purple palete (odložený follow-up z Painted Realm). Picker máp sa naštylizuje konzistentne s existujúcimi lobby kartami; prefarbenie celého lobby nie je súčasťou tejto úlohy.
- **Výkon:** témová mapa má viac časticových emitorov než zmiešaná (napr. sneh na všetkých 63 hexoch), ale ide o lacné `Points` buffery s nezmenenými počtami na hex a low-poly rekvizity; rozpočet porovnateľný. Prípadné doladenie počtu cez tokeny.
- **`BiomeEngine`/server netknuté** — konzistentné s Painted Realm; feature je čisto v render vrstve klienta.
