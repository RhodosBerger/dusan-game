/**
 * Shared grid constants — single source of truth for hex grid geometry.
 *
 * Used by server (SovereignEngine, AIOpponentDirector, server.ts)
 * and client (HexagonNode3D, CanvasRenderer3D) to avoid duplication.
 */

/** 3×3 metaposition grid coordinates (Manhattan distance). */
export const META_COORDS = [
  { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
  { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
  { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }
] as const;

/**
 * Manhattan distance between two metapositions (0–8).
 * Returns Infinity for out-of-range indices (safe for guard checks).
 */
export function metaDistance(metaA: number, metaB: number): number {
  const a = META_COORDS[metaA];
  const b = META_COORDS[metaB];
  if (!a || !b) return Infinity;
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/** Total number of metapositions in the 3×3 grid. */
export const META_COUNT = 9;

/** Total number of sub-hexes per metaposition (center + 6 ring). */
export const SUB_HEX_COUNT = 7;

/**
 * Well-known player thread IDs.
 * Avoids scattering string literals across the codebase.
 */
export const PLAYER_IDS = {
  CRYSTAL: 'thread_king_ai',
  TOXIC: 'thread_hacker_root',
} as const;

/** Material type names used in player profiles and loot drops. */
export const MATERIAL_TYPES = {
  CRYSTAL: 'CrystalShard',
  SPORES: 'Spores',
} as const;

/** Default hero configuration for new player profiles. */
export const HERO_DEFAULTS = {
  crystal: { maxHealth: 15, material: MATERIAL_TYPES.CRYSTAL },
  toxic: { maxHealth: 12, material: MATERIAL_TYPES.SPORES },
} as const;

/** Interrupt window duration in seconds. */
export const INTERRUPT_WINDOW_SECONDS = 3;

/** Maximum action logs retained in memory before eviction. */
export const MAX_LOG_ENTRIES = 500;
