import { createSeededRandom } from './seededRandom';

// Deterministický per-hex tónový faktor v [0,1) — jemné svetlé/tmavé fľaky
// v rámci jedného biómu, aby územná mapa nepôsobila ploche. Rovnaký hex →
// rovnaká hodnota (stabilné medzi rendermi aj klientmi).
export function terrainToneFactor(macroIndex, subIndex) {
  const rnd = createSeededRandom(macroIndex * 13 + subIndex * 7 + 1);
  return rnd();
}
