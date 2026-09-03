# Dizajn systém hexagonálneho sveta („Painted Realm")

**Dátum:** 2026-07-09
**Referencia:** `worldImage.png` (koreň repozitára) — oficiálny art hry: maliarsky lietajúci ostrov s biómami okolo centrálneho portálu, na tmavom vesmírnom pozadí.
**Stav:** návrh schválený, čaká na implementačný plán

## Cieľ

Nahradiť súčasný CYBER_NEON vzhľad jedným konzistentným art štýlom odvodeným z worldImage.png. Vzniká skutočný design system — jediný zdroj pravdy pre farby, materiály, svetlo a VFX, ktorý konzumuje 3D svet aj UI overlay. Prepínateľné estetické témy (MONOCHROME_RETRO, VIBRANT_BAROQUE, GHOSTLY_VOID) sa odstraňujú.

**Rozsah:** 3D svet (Canvas) + UI overlay. Gameplay, fyzika a `BiomeEngine` logika sa nemenia.

## 1. Paleta (tokeny vzorkované z worldImage.png)

### Globálne tokeny

| Token | Hodnota | Pôvod v obrázku |
|---|---|---|
| `space.background` | `#08090e` | vesmírne pozadie |
| `space.starlight` | `#ffffff` | hviezdy |
| `rock.underside` | `#111521` | kamenná podsada ostrova (svetlejšia časť) |
| `rock.undersideDeep` | `#0e121a` | podsada — hlbšie partie |
| `portal.core` | `#a7f4fa` | jadro víru |
| `portal.mid` | `#2dd3f1` | stred víru |
| `portal.outer` | `#099bcb` | vonkajšie prstence |
| `accent.magic` | `#2dd3f1` | univerzálny akcent pre hover/výber |
| `path.dirt` | `#586162` | cestičky / hranice metapozícií |

### Biome spec (5 biómov)

Každý bióm má: `base`, `light`, `accent`, farbu častíc, rekvizitu.

| Bióm | base | light | accent | Rekvizita |
|---|---|---|---|---|
| GLACIER | `#ecf4f7` | `#688dab` | `#24abc4` | CrystalSpire3D (tyrkysové kryštály, mierna emisia) |
| BARRENS | `#7f4d4f` | `#6a5557` | `#382124` | RockSpikes3D (červené skalné ihly) |
| LUSH_FOREST | `#466237` | `#86872e` | `#c46884` | BlossomTree3D (tmavý kmeň `#201d27`, ružová koruna) |
| TOXIC_SWAMP | `#122027` | `#51603f` | `#acf227` + `#7b2e8d` | AcidPool3D (emisný disk + magenta kvety) |
| DESERT | `#988653` | `#67523c` | `#bfa37a` | DesertStones3D (suché kamene, bez emisie) |

DESERT nemá v obrázku vlastnú zónu — dostáva rolu „suchého okraja" (hlinené cestičky okolo portálu).

### Princíp emisie

Žiara (emissive/bloom) patrí **výhradne** prvkom, ktoré svietia v obrázku: portál, kryštál, kyselinové jazierka, magenta kvety, hviezdy. Všetko ostatné je matné (`metalness: 0`, `roughness: ~0.85`), maliarske, s mäkkým svetlom.

## 2. 3D svet

### Lietajúci ostrov
- Každý hex dostane kamennú podsadu — zúžený skalný „stalaktit" smerom dole (`rock.underside` → `rock.undersideDeep`). Okrajové hexy hlbšie, vnútorné plytšie.
- `FloatingShards3D`: pomaly sa vznášajúce tmavé mnohosteny okolo a pod doskou, čisto dekoratívne (~30 ks, jeden zdieľaný materiál).
- Hmla vo farbe `space.background`, aby sa okraje sveta strácali do vesmíru.

### Portál
Stredový hex stredovej metapozície (macroIndex 4, subIndex 0) nesie `PortalVortex3D`:
- 3 vrstvené, protichodne rotujúce priesvitné disky (`portal.outer` → `mid` → `core`),
- cyan point light — najsilnejší svetelný zdroj scény,
- špirálovito stúpajúce častice.
Čisto dekoratívny, bez gameplay významu.

### Rekvizity biómov
- Low-poly z R3F primitív, žiadne externé modely.
- Umiestnenie deterministické (`design/propPlacement.js`): rekvizita sa objaví na hexe, ktorý je „jadrom" súvislej plochy biómu (najviac susedov rovnakého biómu podľa `BiomeEngine`), maximálne 1 na metapozíciu. Deterministickosť = žiadna desynchronizácia medzi klientmi, žiadny stav na serveri.

### Materiály dlaždíc
- Existujúce textúry (`/textures/*_tile.png`) zostávajú, tintujú sa cez `BIOME_SPECS.base`.
- `metalness: 0`, `roughness: 0.85` — koniec kovového vzhľadu.
- Neónové drôtené hrany hexov nahradí tenká tmavá kamenná hrana.
- Hranice metapozícií: nenápadná linka vo farbe `path.dirt` namiesto neónu.
- Fallback: ak sa textúra nenačíta, dlaždica padá na `BIOME_SPECS.base` (plná farba).

### Osvetlenie (nová zostava)
| Svetlo | Farba | Poznámka |
|---|---|---|
| Key directional (zhora-sprava) | `#fff4e0` | teplé, vrhá tiene |
| Fill (zľava) | `#688dab` | studený modrý |
| Ambient | `#7a86a8`, intenzita ~0.35 | studený, mäkký |
| Portal point light | `portal.mid` | stred scény |

Faction/téma svetlá sa odstraňujú. Bloom zostáva (entropy-driven), Glitch a ChromaticAberration viazané na staré témy sa vyhadzujú.

### Pozadie
`StarfieldBackground`: farba scény `space.background` + ~200 hviezd v jednom `Points` bufferi, jemné blikanie, pár väčších jasnejších.

### Stavy interakcie
| Stav | Vizuál |
|---|---|
| Hover | dlaždica sa mierne nadvihne + hrana zažiari `accent.magic` |
| Selected | silnejšia žiara + vznášajúci sa prstenec v `accent.magic` |
| Collapsing | dlaždica stmavne do `rock.underside` a odpadne dole aj s úlomkami (nahrádza fialový void efekt) |
| Card-played flash | krátky bielo-cyan pulz |

### Častice biómov
Existujúce systémy (sneh, výpary, svätojánske mušky, prach, heat) zostávajú, len sa prefarbia podľa `BIOME_SPECS` a presunú do `world/BiomeParticles.jsx`. Počty častíc sa nemenia (5–15 na hex).

## 3. UI overlay

- UI tokeny ako CSS custom properties v `index.css` (`--panel-bg`, `--accent-magic`, `--biome-*`, ...), hodnotovo 1:1 s JS tokenmi v `worldDesign.js`.
- Panely: tmavé sklo tónované do `rock.underside` s jemným okrajom namiesto neónu.
- Akcentové mapovanie: výber/aktívne prvky a hráč `#2dd3f1`, súper `#c46884`, nebezpečenstvo/pasce `#7b2e8d`, loot/úspech `#acf227`. HP bary si ponechávajú zaužívanú zeleno→červenú škálu (čitateľnosť má prednosť pred paletou).
- Zlaté a neónové `#00ffff`/`#00ffcc` z UI miznú.
- Typografia a rozloženie panelov sa nemenia — iba farby, orámovania a žiary.

## 4. Architektúra kódu

```
packages/client/src/
├── design/
│   ├── worldDesign.js        # JEDINÝ zdroj pravdy: PALETTE, BIOME_SPECS,
│   │                         # LIGHTING, PORTAL, UI_TOKENS
│   └── propPlacement.js      # deterministické pravidlo „jadro biómu"
├── components/world/
│   ├── PortalVortex3D.jsx
│   ├── CrystalSpire3D.jsx
│   ├── BlossomTree3D.jsx
│   ├── AcidPool3D.jsx
│   ├── RockSpikes3D.jsx
│   ├── DesertStones3D.jsx
│   ├── FloatingShards3D.jsx
│   ├── StarfieldBackground.jsx
│   └── BiomeParticles.jsx    # presunuté z HexagonNode3D, prefarbené
```

### Zmeny existujúcich súborov
- **`HexagonNode3D.jsx`** — zoštíhlenie: častice von do `BiomeParticles.jsx`, všetka `aestheticTheme` logika preč, materiály z `BIOME_SPECS`, pribudne kamenná podsada.
- **`CanvasRenderer3D.jsx`** — nová svetelná zostava, hmla, `StarfieldBackground`, `PortalVortex3D`, `FloatingShards3D`; theme svetlá preč.
- **`AestheticCompositor.jsx`** — zjednodušenie na entropy-driven bloom.
- **`App.jsx`, `ArenaUIOverlay.jsx`, ostatné** — odstránenie `aestheticTheme` prop reťazca a prepínača tém; farby UI cez CSS premenné.
- **`index.css` / `App.css`** — CSS custom properties.
- **`BiomeEngine.ts` (shared)** — bez zmeny; jeho `color` pole sa na klientovi prestane používať v prospech `BIOME_SPECS`.

### Čo sa maže
- `aestheticTheme` prop a všetky jeho vetvy (CYBER_NEON / MONOCHROME_RETRO / VIBRANT_BAROQUE / GHOSTLY_VOID) naprieč komponentmi.
- Prepínač tém v UI.
- Glitch/ChromaticAberration efekty viazané na témy.

## 5. Overenie

1. `oxlint` prejde.
2. Hra sa spustí (`start-dev.sh`) a odohrá sa ťah proti AI — funkčnosť nedotknutá.
3. Playwright screenshot 3D sveta sa vizuálne porovná s worldImage.png (paleta, nálada, žiariace prvky).
4. Kontrola výkonu od oka: FPS porovnateľné so súčasným stavom (rekvizity sú low-poly, hviezdy jeden buffer, počty častíc nezmenené).

## 6. Riziká a rozhodnutia

- **Najväčší kus práce:** vyčistenie `ArenaUIOverlay.jsx` (76 KB) od neónových farieb — mechanické nahradenie cez tokeny.
- **Výkon:** žiadna zmena rozpočtu častíc; nové prvky sú lacné (primitívy, zdieľané materiály).
- **Prop placement úmyselne klientský a deterministický** — čisto vizuálna vec, server o rekvizitách nevie.
- **Textúry dlaždíc sa v tejto fáze nemenia** — iba tint. Ak by po vizuálnej kontrole nesedeli so štýlom, ich prekreslenie je samostatná budúca úloha mimo tohto spec-u.
