import { describe, it, expect } from 'vitest';
import { generate3DGrid } from '../../utils/HexMath3D';
import { BiomeEngine } from '../../../../shared/src/index';
import { BIOME_SPECS } from '../worldDesign';
import { computePropPlacements, PORTAL_NODE_ID } from '../propPlacement';
import { createSeededRandom } from '../seededRandom';

describe('createSeededRandom', () => {
  it('rovnaký seed → rovnaká sekvencia', () => {
    const a = createSeededRandom(42);
    const b = createSeededRandom(42);
    for (let i = 0; i < 20; i++) expect(a()).toBe(b());
  });

  it('hodnoty v [0, 1)', () => {
    const rnd = createSeededRandom(7);
    for (let i = 0; i < 100; i++) {
      const v = rnd();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('computePropPlacements', () => {
  const grid = generate3DGrid();

  it('presne 1 rekvizita na metapozíciu (9 celkovo)', () => {
    const placements = computePropPlacements(grid);
    expect(placements.size).toBe(9);
    const macros = [...placements.keys()].map(id => Number(id.match(/^m(\d)_/)[1]));
    expect([...new Set(macros)].sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('je deterministické', () => {
    const a = computePropPlacements(grid);
    const b = computePropPlacements(generate3DGrid());
    expect([...a.entries()]).toEqual([...b.entries()]);
  });

  it('nikdy neobsadí portálový hex m4_s0', () => {
    expect(PORTAL_NODE_ID).toBe('m4_s0');
    expect(computePropPlacements(grid).has(PORTAL_NODE_ID)).toBe(false);
  });

  it('typ rekvizity zodpovedá biómu uzla', () => {
    const placements = computePropPlacements(grid);
    for (const [nodeId, propType] of placements) {
      const node = grid.find(n => n.id === nodeId);
      const biome = BiomeEngine.getBiomeForHex(node.macroIndex, node.subIndex).biome;
      expect(propType).toBe(BIOME_SPECS[biome].prop);
    }
  });
});

describe('computePropPlacements — témové mapy', () => {
  const grid = generate3DGrid();

  it('MIXED (aj bez argumentu) = 9 rekvizít', () => {
    expect(computePropPlacements(grid).size).toBe(9);
    expect(computePropPlacements(grid, 'MIXED').size).toBe(9);
  });

  it('každá témová mapa = 18 rekvizít, portál m4_s0 vynechaný', () => {
    for (const map of ['GLACIER', 'TOXIC_SWAMP', 'LUSH_FOREST']) {
      const p = computePropPlacements(grid, map);
      expect(p.size).toBe(18);
      expect(p.has('m4_s0')).toBe(false);
    }
  });

  it('témová mapa: všetky rekvizity = prop vynúteného biómu', () => {
    const p = computePropPlacements(grid, 'GLACIER');
    for (const propType of p.values()) {
      expect(propType).toBe(BIOME_SPECS.GLACIER.prop);
    }
  });

  it('témová mapa je deterministická', () => {
    const a = computePropPlacements(grid, 'LUSH_FOREST');
    const b = computePropPlacements(generate3DGrid(), 'LUSH_FOREST');
    expect([...a.entries()]).toEqual([...b.entries()]);
  });
});
