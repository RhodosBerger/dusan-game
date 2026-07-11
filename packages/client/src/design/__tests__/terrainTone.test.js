import { describe, it, expect } from 'vitest';
import { terrainToneFactor } from '../terrainTone';

describe('terrainToneFactor', () => {
  it('je deterministické pre rovnaký hex', () => {
    expect(terrainToneFactor(3, 4)).toBe(terrainToneFactor(3, 4));
  });

  it('vracia hodnoty v [0,1)', () => {
    for (let m = 0; m < 9; m++) {
      for (let s = 0; s < 7; s++) {
        const v = terrainToneFactor(m, s);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    }
  });

  it('naprieč 63 hexmi dáva prevažne rôzne hodnoty', () => {
    const vals = [];
    for (let m = 0; m < 9; m++) for (let s = 0; s < 7; s++) vals.push(terrainToneFactor(m, s));
    const unique = new Set(vals.map(v => v.toFixed(6)));
    expect(unique.size).toBeGreaterThan(30);
  });
});
