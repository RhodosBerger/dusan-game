// Painted Realm — dizajn systém hexagonálneho sveta.
// Jediný zdroj pravdy pre farby, materiály a svetlo 3D sveta aj UI.
// Hodnoty vzorkované z worldImage.png (koreň repa) — pozri spec
// docs/superpowers/specs/2026-07-09-hex-world-design-system-design.md.
// CSS premenné v index.css musia zostať hodnotovo 1:1 s týmto súborom.

export const PALETTE = {
  space: {
    background: '#06070d',   // Hlbšie vesmírne pozadie pre dramatický kontrast
    starlight: '#ffffff',
    nebulaPurple: '#1a0a2e', // Pridané pre dramatický sky gradient
    nebulaCyan: '#0a1a3a',
  },
  rock: {
    underside: '#111521',
    undersideDeep: '#0a0c14', // Hlbšie tiene pre dramatickejší dojem
  },
  portal: {
    core: '#a7f4fa',
    mid: '#2dd3f1',
    outer: '#099bcb',
  },
  accent: {
    magic: '#2dd3f1',
  },
  path: {
    dirt: '#586162',
  },
};

// Kľúče zodpovedajú BiomeDetails['biome'] z packages/shared/src/core/BiomeEngine.ts.
export const BIOME_SPECS = {
  GLACIER: {
    base: '#ecf4f7',
    light: '#688dab',
    accent: '#24abc4',
    particleColor: '#ffffff',
    prop: 'CRYSTAL_SPIRE',
    // Dramatic material settings
    roughness: 0.15,        // Very glossy ice
    metalness: 0.4,          // Metallic sheen
    clearcoat: 0.9,         // High clearcoat for ice reflection
    clearcoatRoughness: 0.05,
    emissiveIntensity: 0.15,
    transmission: 0.3,      // Slight transparency for ice
    ior: 1.31,              // Ice-like refraction
  },
  BARRENS: {
    base: '#7f4d4f',
    light: '#6a5557',
    accent: '#382124',
    particleColor: '#a1837a',
    prop: 'ROCK_SPIKES',
    roughness: 0.95,
    metalness: 0.05,
    clearcoat: 0.1,
    clearcoatRoughness: 0.8,
    emissiveIntensity: 0.02,
    transmission: 0,
    ior: 1.0,
  },
  LUSH_FOREST: {
    base: '#466237',
    light: '#86872e',
    accent: '#c46884',
    particleColor: '#ffffaa',
    prop: 'BLOSSOM_TREE',
    roughness: 0.7,
    metalness: 0.1,
    clearcoat: 0.2,
    clearcoatRoughness: 0.5,
    emissiveIntensity: 0.05,
    transmission: 0,
    ior: 1.0,
  },
  TOXIC_SWAMP: {
    base: '#122027',
    light: '#51603f',
    accent: '#acf227',
    accentFlower: '#7b2e8d',
    particleColor: '#acf227',
    prop: 'ACID_POOL',
    roughness: 0.2,         // Wet, swampy surface
    metalness: 0.3,         // Slight metallic sheen for wet look
    clearcoat: 0.7,         // Wet glossy surface
    clearcoatRoughness: 0.1,
    emissiveIntensity: 0.25, // Toxic glow
    transmission: 0.15,     // Slight translucency for acid
    ior: 1.33,             // Water-like refraction
  },
  DESERT: {
    base: '#988653',
    light: '#67523c',
    accent: '#bfa37a',
    particleColor: '#bfa37a',
    prop: 'DESERT_STONES',
    roughness: 0.85,
    metalness: 0.05,
    clearcoat: 0.15,
    clearcoatRoughness: 0.7,
    emissiveIntensity: 0.03,
    transmission: 0,
    ior: 1.0,
  },
};

export const LIGHTING = {
  key:  { color: '#fff4e0', intensity: 1.5, position: [12, 20, 8] },
  fill: { color: '#688dab', intensity: 0.5, position: [-14, 10, -8] },
  ambient: { color: '#7a86a8', intensity: 0.3 },
  rim: { color: '#2dd3f1', intensity: 0.9, position: [0, 8, -15] },
  portalLight: { color: '#2dd3f1', intensity: 1.5, distance: 15 },
  // Faction accent lights
  factionCrystal: { color: '#00eeff', intensity: 0.6, position: [-15, 5, -15] },
  factionToxic: { color: '#39ff14', intensity: 0.6, position: [15, 5, 15] },
  factionDruid: { color: '#ffcc00', intensity: 0.4, position: [15, 5, -15] },
};

export const WORLD = {
  fog: { color: '#06070d', near: 30, far: 120 },  // Closer fog for more dramatic depth
  starCount: 300,       // More stars
  shardCount: 50,       // More floating shards
  tileRoughness: 0.6,  // Base roughness (biome-specific overrides)
  tileMetalness: 0.2,  // Base metalness
  tileClearcoat: 0.4,  // Base clearcoat
  tileClearcoatRoughness: 0.3,
  tileEnvMapIntensity: 1.5, // Stronger environment reflections
};
