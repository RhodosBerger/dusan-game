import { describe, it, expect } from 'vitest';
import { PALETTE, BIOME_SPECS, LIGHTING, WORLD, TERRAIN_MAPS, DEFAULT_TERRAIN_MAP } from '../worldDesign';

const HEX = /^#[0-9a-f]{6}$/;
const BIOMES = ['GLACIER', 'TOXIC_SWAMP', 'DESERT', 'BARRENS', 'LUSH_FOREST'];

describe('PALETTE', () => {
  it('má všetky globálne tokeny vo formáte #rrggbb', () => {
    for (const val of [
      PALETTE.space.background, PALETTE.space.starlight,
      PALETTE.rock.underside, PALETTE.rock.undersideDeep,
      PALETTE.portal.core, PALETTE.portal.mid, PALETTE.portal.outer,
      PALETTE.accent.magic, PALETTE.path.dirt,
    ]) {
      expect(val).toMatch(HEX);
    }
  });
});

describe('BIOME_SPECS', () => {
  it('obsahuje presne 5 biómov z BiomeEngine', () => {
    expect(Object.keys(BIOME_SPECS).sort()).toEqual([...BIOMES].sort());
  });

  it('každý bióm má base/light/accent/particleColor ako hex a prop ako string', () => {
    for (const biome of BIOMES) {
      const spec = BIOME_SPECS[biome];
      expect(spec.base).toMatch(HEX);
      expect(spec.light).toMatch(HEX);
      expect(spec.accent).toMatch(HEX);
      expect(spec.particleColor).toMatch(HEX);
      expect(typeof spec.prop).toBe('string');
    }
  });

  it('TOXIC_SWAMP má accentFlower (magenta kvety)', () => {
    expect(BIOME_SPECS.TOXIC_SWAMP.accentFlower).toMatch(HEX);
  });
});

describe('LIGHTING a WORLD', () => {
  it('svetlá majú farbu a intenzitu', () => {
    for (const light of [LIGHTING.key, LIGHTING.fill, LIGHTING.ambient, LIGHTING.portalLight]) {
      expect(light.color).toMatch(HEX);
      expect(light.intensity).toBeGreaterThan(0);
    }
  });

  it('WORLD má hmlu a počty', () => {
    expect(WORLD.fog.color).toMatch(HEX);
    expect(WORLD.fog.near).toBeLessThan(WORLD.fog.far);
    expect(WORLD.starCount).toBeGreaterThan(0);
    expect(WORLD.shardCount).toBeGreaterThan(0);
  });
});

describe('TERRAIN_MAPS', () => {
  it('má 4 mapy a MIXED default', () => {
    expect(TERRAIN_MAPS).toHaveLength(4);
    expect(DEFAULT_TERRAIN_MAP).toBe('MIXED');
    expect(TERRAIN_MAPS.map(m => m.id)).toContain('MIXED');
  });

  it('MIXED má forcedBiome null; témové majú platný biome kľúč (id === biome)', () => {
    for (const m of TERRAIN_MAPS) {
      expect(typeof m.label).toBe('string');
      expect(typeof m.icon).toBe('string');
      if (m.id === 'MIXED') {
        expect(m.forcedBiome).toBeNull();
      } else {
        expect(m.forcedBiome).toBe(m.id);
        expect(BIOME_SPECS[m.forcedBiome]).toBeDefined();
      }
    }
  });

  it('3 témové mapy = GLACIER, TOXIC_SWAMP, LUSH_FOREST', () => {
    const themed = TERRAIN_MAPS.filter(m => m.forcedBiome).map(m => m.id).sort();
    expect(themed).toEqual(['GLACIER', 'LUSH_FOREST', 'TOXIC_SWAMP']);
  });
});
