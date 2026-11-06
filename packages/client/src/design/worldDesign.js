// Painted Realm — Dota 2 Dark-Fantasy MOBA Tactical Board Design System.
// Vyvážené matné kamenisté a prírodné materiály (Radiant Moss, Dire Obsidian, River Slate).

export const PALETTE = {
  space: {
    background: '#090c12',
    starlight: '#dce6f2',
    nebulaPurple: '#151224',
    nebulaCyan: '#0e1d2b',
  },
  rock: {
    underside: '#1e222b',
    undersideDeep: '#12151c',
  },
  portal: {
    core: '#64dfdf',
    mid: '#2ec4b6',
    outer: '#155e63',
  },
  accent: {
    magic: '#2ec4b6',
  },
  path: {
    dirt: '#5c5549',
  },
};

export const BIOME_SPECS = {
  GLACIER: {
    base: '#4a6274',
    light: '#688dab',
    accent: '#48cae4',
    particleColor: '#caf0f8',
    prop: 'CRYSTAL_SPIRE',
    roughness: 0.76,
    metalness: 0.14,
    clearcoat: 0,
    clearcoatRoughness: 0.8,
    emissiveIntensity: 0.04,
    transmission: 0,
    ior: 1.0,
  },
  BARRENS: {
    base: '#3b2d30',
    light: '#594246',
    accent: '#c85a32',
    particleColor: '#9e7b66',
    prop: 'ROCK_SPIKES',
    roughness: 0.92,
    metalness: 0.08,
    clearcoat: 0,
    clearcoatRoughness: 0.9,
    emissiveIntensity: 0.02,
    transmission: 0,
    ior: 1.0,
  },
  LUSH_FOREST: {
    base: '#385233',
    light: '#587246',
    accent: '#8cb369',
    particleColor: '#d9ed92',
    prop: 'BLOSSOM_TREE',
    roughness: 0.86,
    metalness: 0.05,
    clearcoat: 0,
    clearcoatRoughness: 0.85,
    emissiveIntensity: 0.02,
    transmission: 0,
    ior: 1.0,
  },
  TOXIC_SWAMP: {
    base: '#1f2d2a',
    light: '#394f49',
    accent: '#70e000',
    accentFlower: '#7b2e8d',
    particleColor: '#9ef01a',
    prop: 'ACID_POOL',
    roughness: 0.78,
    metalness: 0.12,
    clearcoat: 0,
    clearcoatRoughness: 0.75,
    emissiveIntensity: 0.06,
    transmission: 0,
    ior: 1.0,
  },
  DESERT: {
    base: '#6c584c',
    light: '#8a7161',
    accent: '#c89b3c',
    particleColor: '#ddbea9',
    prop: 'DESERT_STONES',
    roughness: 0.88,
    metalness: 0.06,
    clearcoat: 0,
    clearcoatRoughness: 0.85,
    emissiveIntensity: 0.02,
    transmission: 0,
    ior: 1.0,
  },
};

export const LIGHTING = {
  key:  { color: '#f2dfbe', intensity: 1.05, position: [14, 24, 12] },
  fill: { color: '#546e87', intensity: 0.48, position: [-16, 14, -10] },
  ambient: { color: '#6b7c96', intensity: 0.42 },
  rim: { color: '#2ec4b6', intensity: 0.45, position: [0, 10, -18] },
  portalLight: { color: '#2ec4b6', intensity: 0.55, distance: 10 },
  factionCrystal: { color: '#2ec4b6', intensity: 0.35, position: [-15, 6, -15] },
  factionToxic: { color: '#70e000', intensity: 0.35, position: [15, 6, 15] },
  factionDruid: { color: '#c89b3c', intensity: 0.28, position: [15, 6, -15] },
};

export const WORLD = {
  fog: { color: '#090c12', near: 36, far: 135 },
  starCount: 600,
  shardCount: 28,
  tileRoughness: 0.84,
  tileMetalness: 0.08,
  tileClearcoat: 0.0,
  tileClearcoatRoughness: 0.85,
  tileEnvMapIntensity: 0.65,
};
