import { BiomeEngine } from '../../../shared/src/index';
import { BIOME_SPECS } from './worldDesign';

// Portálový hex — stred stredovej metapozície; rekvizita by kolidovala s vírom.
export const PORTAL_NODE_ID = 'm4_s0';

const NEIGHBOR_DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

/**
 * Deterministicky vyberie „jadro biómu" v každej metapozícii: hex s najviac
 * susedmi rovnakého biómu (remíza → prvý v poradí gridu, t. j. najnižší subIndex).
 * Vracia Map<nodeId, propType> — presne 1 záznam na metapozíciu.
 */
export function computePropPlacements(gridData) {
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
