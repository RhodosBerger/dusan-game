// Painted Realm — Dota 2 Daytime Tactical Board Design System.
// Jasné denné osvetlenie zhora nadol, čitateľné matné prírodné a kamenné materiály.

export const PALETTE = {
  space: {
    background: '#78a8cf',   // Jasná denná obloha
    starlight: '#ffffff',
    nebulaPurple: '#9ec5e3',
    nebulaCyan: '#b8d8f0',
  },
  rock: {
    underside: '#5c6673',     // Denný vápenec / žula pod útesmi (namiesto čiernej noci)
    undersideDeep: '#424a54',
  },
  portal: {
    core: '#38bdf8',
    mid: '#0284c7',
    outer: '#0369a1',
  },
  accent: {
    magic: '#0284c7',
  },
  path: {
    dirt: '#8c7d6b',
  },
};

export const BIOME_SPECS = {
  GLACIER: {
    base: '#8db8d1',
    light: '#b5d6e8',
    accent: '#0284c7',
    particleColor: '#ffffff',
    prop: 'CRYSTAL_SPIRE',
    roughness: 0.72,
    metalness: 0.08,
    clearcoat: 0,
    clearcoatRoughness: 0.8,
    emissiveIntensity: 0,
    transmission: 0,
    ior: 1.0,
  },
  BARRENS: {
    base: '#8c655c',
    light: '#ab837a',
    accent: '#d97706',
    particleColor: '#d6bfb8',
    prop: 'ROCK_SPIKES',
    roughness: 0.88,
    metalness: 0.05,
    clearcoat: 0,
    clearcoatRoughness: 0.9,
    emissiveIntensity: 0,
    transmission: 0,
    ior: 1.0,
  },
  LUSH_FOREST: {
    base: '#5c8a42',
    light: '#7eb05d',
    accent: '#65a30d',
    particleColor: '#ecfccb',
    prop: 'BLOSSOM_TREE',
    roughness: 0.84,
    metalness: 0.04,
    clearcoat: 0,
    clearcoatRoughness: 0.85,
    emissiveIntensity: 0,
    transmission: 0,
    ior: 1.0,
  },
  TOXIC_SWAMP: {
    base: '#4b7563',
    light: '#6c9c87',
    accent: '#16a34a',
    accentFlower: '#9333ea',
    particleColor: '#bbf7d0',
    prop: 'ACID_POOL',
    roughness: 0.78,
    metalness: 0.06,
    clearcoat: 0,
    clearcoatRoughness: 0.75,
    emissiveIntensity: 0,
    transmission: 0,
    ior: 1.0,
  },
  DESERT: {
    base: '#bfa074',
    light: '#d9be96',
    accent: '#d97706',
    particleColor: '#fef3c7',
    prop: 'DESERT_STONES',
    roughness: 0.85,
    metalness: 0.04,
    clearcoat: 0,
    clearcoatRoughness: 0.85,
    emissiveIntensity: 0,
    transmission: 0,
    ior: 1.0,
  },
};

export const LIGHTING = {
  key:  { color: '#fff8e7', intensity: 2.5, position: [10, 52, 14] },
  fill: { color: '#d4e8ff', intensity: 1.3, position: [-16, 40, -12] },
  ambient: { color: '#f0f5fa', intensity: 1.35 },
  rim: { color: '#ffffff', intensity: 0.9, position: [0, 38, -20] },
  portalLight: { color: '#38bdf8', intensity: 0.5, distance: 12 },
  factionCrystal: { color: '#38bdf8', intensity: 0.5, position: [-15, 36, -15] },
  factionToxic: { color: '#4ade80', intensity: 0.5, position: [15, 36, 15] },
  factionDruid: { color: '#fbbf24', intensity: 0.5, position: [0, 44, 0] },
};

export const WORLD = {
  fog: { color: '#8ab4d6', near: 65, far: 210 },
  starCount: 60,
  shardCount: 18,
  tileRoughness: 0.82,
  tileMetalness: 0.05,
  tileClearcoat: 0.0,
  tileClearcoatRoughness: 0.85,
  tileEnvMapIntensity: 0.85,
};
