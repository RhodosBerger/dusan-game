/**
 * The Last Tribe — Unified Design Tokens
 * 
 * Single source of truth for all visual tokens used across UI and 3D.
 * Mirrors worldDesign.js values and extends with semantic tokens.
 */

// ─── Color Palette ─────────────────────────────────────────────────────────────

export const colors = {
  // Core space/void colors
  space: {
    bg: '#08090e',
    bgDeep: '#050508',
    surface: '#111521',
    surfaceLight: '#1a1f2e',
  },

  // Primary accent (magic/cyan)
  primary: {
    50: '#e6fafe',
    100: '#b3f0fb',
    200: '#80e6f8',
    300: '#4ddcf5',
    400: '#2dd3f1',  // main
    500: '#1ab8d4',
    600: '#139bb5',
    700: '#0d7e94',
    800: '#086173',
    900: '#044452',
  },

  // Faction colors
  factions: {
    crystal: {
      primary: '#00eeff',
      secondary: '#688dab',
      glow: 'rgba(0, 238, 255, 0.4)',
      gradient: 'linear-gradient(135deg, #00eeff 0%, #688dab 100%)',
    },
    toxic: {
      primary: '#39ff14',
      secondary: '#acf227',
      glow: 'rgba(57, 255, 20, 0.4)',
      gradient: 'linear-gradient(135deg, #39ff14 0%, #acf227 100%)',
    },
    druid: {
      primary: '#ffcc00',
      secondary: '#c46884',
      glow: 'rgba(255, 204, 0, 0.4)',
      gradient: 'linear-gradient(135deg, #ffcc00 0%, #c46884 100%)',
    },
  },

  // Semantic colors
  semantic: {
    success: '#39ff14',
    warning: '#ffcc00',
    danger: '#ff3366',
    info: '#2dd3f1',
    enemy: '#c46884',
    loot: '#acf227',
    mana: '#cc00ff',
  },

  // Portal/vortex colors
  portal: {
    core: '#a7f4fa',
    mid: '#2dd3f1',
    outer: '#099bcb',
    glow: 'rgba(45, 211, 241, 0.3)',
  },

  // Text colors
  text: {
    primary: '#e8e6f0',
    secondary: '#9ca3af',
    muted: '#6b7280',
    disabled: '#4b5563',
    inverse: '#08090e',
  },
} as const;

// ─── Biome Specifications ────────────────────────────────────────────────────────

export const biomes = {
  GLACIER: {
    name: 'Glacier',
    base: '#ecf4f7',
    light: '#688dab',
    accent: '#24abc4',
    particle: '#ffffff',
    prop: 'CRYSTAL_SPIRE',
  },
  BARRENS: {
    name: 'Barrens',
    base: '#7f4d4f',
    light: '#6a5557',
    accent: '#382124',
    particle: '#a1837a',
    prop: 'ROCK_SPIKES',
  },
  LUSH_FOREST: {
    name: 'Lush Forest',
    base: '#466237',
    light: '#86872e',
    accent: '#c46884',
    particle: '#ffffaa',
    prop: 'BLOSSOM_TREE',
  },
  TOXIC_SWAMP: {
    name: 'Toxic Swamp',
    base: '#122027',
    light: '#51603f',
    accent: '#acf227',
    accentFlower: '#7b2e8d',
    particle: '#acf227',
    prop: 'ACID_POOL',
  },
  DESERT: {
    name: 'Desert',
    base: '#988653',
    light: '#67523c',
    accent: '#bfa37a',
    particle: '#bfa37a',
    prop: 'DESERT_STONES',
  },
} as const;

// ─── Spacing Scale (4px base) ────────────────────────────────────────────────────

export const spacing = {
  0: '0',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

// ─── Border Radius ───────────────────────────────────────────────────────────────

export const radii = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────────

export const shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px rgba(0, 0, 0, 0.4)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.6)',
  glow: {
    primary: '0 0 20px rgba(45, 211, 241, 0.4)',
    crystal: '0 0 20px rgba(0, 238, 255, 0.4)',
    toxic: '0 0 20px rgba(57, 255, 20, 0.4)',
    druid: '0 0 20px rgba(255, 204, 0, 0.4)',
    danger: '0 0 20px rgba(255, 51, 102, 0.4)',
  },
  inner: {
    glow: 'inset 0 0 20px rgba(45, 211, 241, 0.15)',
  },
} as const;

// ─── Typography ──────────────────────────────────────────────────────────────────

export const fonts = {
  mono: "'JetBrains Mono', ui-monospace, 'Cascadia Code', 'Fira Code', Consolas, monospace",
  sans: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  display: "'Orbitron', 'Rajdhani', var(--sans)",
} as const;

export const fontSizes = {
  xs: '11px',
  sm: '13px',
  base: '15px',
  md: '17px',
  lg: '20px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '40px',
  '4xl': '56px',
} as const;

export const fontWeights = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const lineHeights = {
  tight: 1.15,
  snug: 1.3,
  normal: 1.5,
  relaxed: 1.65,
} as const;

// ─── Motion / Animation ──────────────────────────────────────────────────────────

export const durations = {
  instant: '50ms',
  fast: '100ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
  slowest: '1000ms',
} as const;

export const easings = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

// ─── Glassmorphism ───────────────────────────────────────────────────────────────

export const glass = {
  panel: {
    bg: 'rgba(17, 21, 33, 0.85)',
    bgLight: 'rgba(26, 31, 46, 0.75)',
    border: 'rgba(45, 211, 241, 0.25)',
    blur: 'blur(12px)',
  },
  card: {
    bg: 'rgba(20, 24, 38, 0.9)',
    border: 'rgba(45, 211, 241, 0.3)',
    hoverBorder: 'rgba(45, 211, 241, 0.6)',
  },
  overlay: {
    bg: 'rgba(8, 9, 14, 0.7)',
    blur: 'blur(8px)',
  },
} as const;

// ─── Z-Index Scale ───────────────────────────────────────────────────────────────

export const zIndices = {
  base: 0,
  panels: 10,
  dropdown: 20,
  sticky: 30,
  overlay: 40,
  modal: 50,
  popover: 60,
  toast: 70,
  tooltip: 80,
} as const;

// ─── 3D Lighting ─────────────────────────────────────────────────────────────────

export const lighting = {
  key: { color: '#fff4e0', intensity: 1.3, position: [12, 20, 8] as const },
  fill: { color: '#688dab', intensity: 0.4, position: [-14, 10, -8] as const },
  ambient: { color: '#7a86a8', intensity: 0.35 },
  rim: { color: '#2dd3f1', intensity: 0.6, position: [0, 8, -15] as const },
  portal: { color: '#2dd3f1', intensity: 1.2, distance: 12 },
} as const;

// ─── World Settings ──────────────────────────────────────────────────────────────

export const world = {
  fog: { color: '#08090e', near: 35, far: 160 },
  starCount: 200,
  shardCount: 30,
  tileRoughness: 0.75,  // Reduced for more reflections
  tileMetalness: 0.15,  // Added for subtle metallic sheen
  tileClearcoat: 0.3,   // Clearcoat for glossy finish
} as const;

// ─── Legacy Exports (backward compat with worldDesign.js) ────────────────────────

export const PALETTE = {
  space: {
    background: colors.space.bg,
    starlight: '#ffffff',
  },
  rock: {
    underside: colors.space.surface,
    undersideDeep: colors.space.bgDeep,
  },
  portal: {
    core: colors.portal.core,
    mid: colors.portal.mid,
    outer: colors.portal.outer,
  },
  accent: {
    magic: colors.primary[400],
  },
  path: {
    dirt: '#586162',
  },
};

export const BIOME_SPECS = biomes;
export const LIGHTING = lighting;
export const WORLD = world;

// ─── Helper Functions ────────────────────────────────────────────────────────────

/**
 * Get faction colors by faction name
 */
export function getFactionColors(faction: 'crystal' | 'toxic' | 'druid') {
  return colors.factions[faction];
}

/**
 * Get biome spec by biome key
 */
export function getBiomeSpec(biome: keyof typeof biomes) {
  return biomes[biome];
}

/**
 * Create glassmorphism style object
 */
export function glassStyle(variant: 'panel' | 'card' | 'overlay' = 'panel') {
  const config = glass[variant];
  return {
    background: config.bg,
    backdropFilter: 'blur' in config ? config.blur : undefined,
    border: 'border' in config ? `1px solid ${config.border}` : undefined,
    borderRadius: radii.lg,
  };
}

export default {
  colors,
  biomes,
  spacing,
  radii,
  shadows,
  fonts,
  fontSizes,
  fontWeights,
  lineHeights,
  durations,
  easings,
  glass,
  zIndices,
  lighting,
  world,
  PALETTE,
  BIOME_SPECS,
  LIGHTING,
  WORLD,
  getFactionColors,
  getBiomeSpec,
  glassStyle,
};
