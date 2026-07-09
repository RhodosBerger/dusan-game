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
