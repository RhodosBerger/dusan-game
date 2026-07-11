import { BiomeEngine } from '../../../shared/src/index';
import { BIOME_SPECS, TERRAIN_MAPS } from './worldDesign';

// Portálový hex — stred stredovej metapozície; rekvizita by kolidovala s vírom.
export const PORTAL_NODE_ID = 'm4_s0';

const NEIGHBOR_DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

// Sub-hexy, na ktoré témová mapa umiestni rekvizity (2 na metapozíciu ≈ 18).
const THEMED_SUBINDICES = [1, 4];

/**
 * Vracia Map<nodeId, propType>.
 * - MIXED: 1 rekvizita na "jadre" biómu / metapozícia (najviac susedov rovnakého
 *   biómu; remíza → prvý v poradí gridu). 9 spolu.
 * - Témová mapa (forcedBiome): 2 rekvizity na metapozíciu (subIndex 1 a 4),
 *   portál vynechaný, všetky = rekvizita vynúteného biómu. 18 spolu. Deterministické.
 */
export function computePropPlacements(gridData, terrainMap = 'MIXED') {
  const mapDef = TERRAIN_MAPS.find(m => m.id === terrainMap);
  const forcedBiome = mapDef ? mapDef.forcedBiome : null;

  if (forcedBiome) {
    const prop = BIOME_SPECS[forcedBiome].prop;
    const placements = new Map();
    for (const node of gridData) {
      if (node.id === PORTAL_NODE_ID) continue;
      if (THEMED_SUBINDICES.includes(node.subIndex)) {
        placements.set(node.id, prop);
      }
    }
    return placements;
  }

  const byCoord = new Map(gridData.map(n => [`${n.q},${n.r}`, n]));
  const biomeCache = new Map();
  const biomeOf = (n) => {
    if (!biomeCache.has(n.id)) {
      biomeCache.set(n.id, BiomeEngine.getBiomeForHex(n.macroIndex, n.subIndex).biome);
    }
    return biomeCache.get(n.id);
  };

  const placements = new Map();
  for (let macro = 0; macro < 9; macro++) {
    let best = null;
    let bestScore = -1;
    for (const node of gridData) {
      if (node.macroIndex !== macro || node.id === PORTAL_NODE_ID) continue;
      const biome = biomeOf(node);
      let score = 0;
      for (const [dq, dr] of NEIGHBOR_DIRS) {
        const nb = byCoord.get(`${node.q + dq},${node.r + dr}`);
        if (nb && biomeOf(nb) === biome) score++;
      }
      if (score > bestScore) {
        best = node;
        bestScore = score;
      }
    }
    if (best) placements.set(best.id, BIOME_SPECS[biomeOf(best)].prop);
  }
  return placements;
}
