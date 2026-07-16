// WebGL Volumetric World and Dynamic Lighting Profiles
// Defines the environmental states and lighting systems for the arena.

export const WORLD_PROFILES = {
  DEFAULT: {
    name: 'Clear Painted Realm',
    ambient: { color: '#7a86a8', intensity: 0.35 },
    key: { color: '#fff4e0', intensity: 1.3, position: [12, 20, 8] },
    fill: { color: '#688dab', intensity: 0.4, position: [-14, 10, -8] },
    fog: { color: '#08090e', near: 35, far: 160 },
    particleSpeed: 0.05,
    starGlow: 0.2
  },
  TOXIC_HAZE: {
    name: 'Murky Toxic Haze',
    ambient: { color: '#222a15', intensity: 0.3 },
    key: { color: '#d1f2a5', intensity: 0.9, position: [8, 18, 12] },
    fill: { color: '#9fdb3b', intensity: 0.55, position: [-12, 8, -6] },
    fog: { color: '#070d05', near: 20, far: 100 },
    particleSpeed: 0.12,
    starGlow: 0.4
  },
  VOID_ECLIPSE: {
    name: 'Void Collapse Eclipse',
    ambient: { color: '#120c1f', intensity: 0.15 },
    key: { color: '#2d0a4e', intensity: 0.5, position: [15, 25, 5] },
    fill: { color: '#00f0ff', intensity: 0.25, position: [-10, 15, -12] },
    fog: { color: '#020204', near: 15, far: 70 },
    particleSpeed: 0.03,
    starGlow: 0.1
  },
  AURORA_STORM: {
    name: 'Cosmic Aurora Storm',
    ambient: { color: '#1d0d2b', intensity: 0.5 },
    key: { color: '#39ff14', intensity: 1.1, position: [10, 22, 10] },
    fill: { color: '#00ffff', intensity: 0.7, position: [-15, 12, -10] },
    fog: { color: '#040a0f', near: 30, far: 140 },
    particleSpeed: 0.08,
    starGlow: 0.6
  },
  DAYLIGHT: {
    name: 'Vibrant Medieval Daylights',
    ambient: { color: '#eab308', intensity: 0.65 },
    key: { color: '#fef08a', intensity: 2.0, position: [15, 25, 10] },
    fill: { color: '#38bdf8', intensity: 0.55, position: [-15, 15, -10] },
    fog: { color: '#082f49', near: 45, far: 220 },
    particleSpeed: 0.04,
    starGlow: 0.1
  }
};

/**
 * Resolves the target environment profile based on the active biome and entropy.
 */
export function getActiveProfile(biome, entropy) {
  if (biome === 'TOXIC_SWAMP') {
    return WORLD_PROFILES.TOXIC_HAZE;
  }
  
  if (entropy >= 0.6) {
    return WORLD_PROFILES.VOID_ECLIPSE;
  }
  
  if (entropy >= 0.3) {
    return WORLD_PROFILES.AURORA_STORM;
  }
  
  return WORLD_PROFILES.DEFAULT;
}
