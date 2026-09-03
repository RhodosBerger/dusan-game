import { describe, it, expect } from 'vitest';
import { BiomeEngine } from '../BiomeEngine';

describe('BiomeEngine', () => {
  describe('getHexCoordinates', () => {
    it('returns correct coordinates for center macro (metaId 0)', () => {
      const coords = BiomeEngine.getHexCoordinates(0, 0);
      expect(coords.q).toBe(0);
      expect(coords.r).toBe(0);
    });

    it('returns correct coordinates for macro at position 1', () => {
      const coords = BiomeEngine.getHexCoordinates(1, 0);
      expect(coords.q).toBe(3);
      expect(coords.r).toBe(-1);
    });

    it('returns correct sub-hex offset for hexId 1', () => {
      const coords = BiomeEngine.getHexCoordinates(0, 1);
      expect(coords.q).toBe(1);
      expect(coords.r).toBe(0);
    });

    it('handles invalid metaId by returning default', () => {
      const coords = BiomeEngine.getHexCoordinates(99, 0);
      expect(coords.q).toBe(0);
      expect(coords.r).toBe(0);
    });
  });

  describe('getBiomeForCoords', () => {
    it('returns LUSH_FOREST as default biome at origin', () => {
      const biome = BiomeEngine.getBiomeForCoords(0, 0);
      expect(biome.biome).toBe('LUSH_FOREST');
      expect(biome.color).toBe('#2e8b57');
    });

    it('returns temperature in range [0, 1]', () => {
      const biome = BiomeEngine.getBiomeForCoords(0, 0);
      expect(biome.temperature).toBeGreaterThanOrEqual(0);
      expect(biome.temperature).toBeLessThanOrEqual(1);
    });

    it('returns humidity in range [0, 1]', () => {
      const biome = BiomeEngine.getBiomeForCoords(0, 0);
      expect(biome.humidity).toBeGreaterThanOrEqual(0);
      expect(biome.humidity).toBeLessThanOrEqual(1);
    });

    it('includes physics properties for all biomes', () => {
      const biome = BiomeEngine.getBiomeForCoords(0, 0);
      expect(biome.physics).toHaveProperty('friction');
      expect(biome.physics).toHaveProperty('conductivity');
      expect(biome.physics).toHaveProperty('walkable');
    });
  });

  describe('getBiomeForHex', () => {
    it('returns biome details for valid macro and hex IDs', () => {
      const biome = BiomeEngine.getBiomeForHex(0, 0);
      expect(biome).toHaveProperty('biome');
      expect(biome).toHaveProperty('temperature');
      expect(biome).toHaveProperty('humidity');
      expect(biome).toHaveProperty('color');
      expect(biome).toHaveProperty('physics');
    });

    it('returns consistent results for same coordinates', () => {
      const biome1 = BiomeEngine.getBiomeForHex(4, 2);
      const biome2 = BiomeEngine.getBiomeForHex(4, 2);
      expect(biome1.biome).toBe(biome2.biome);
      expect(biome1.temperature).toBe(biome2.temperature);
      expect(biome1.humidity).toBe(biome2.humidity);
    });
  });
});
