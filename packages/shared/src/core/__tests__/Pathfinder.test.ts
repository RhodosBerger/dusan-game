import { describe, it, expect } from 'vitest';
import { Pathfinder } from '../Pathfinder';

describe('Pathfinder', () => {
  describe('hexDistance', () => {
    it('returns 0 for same coordinates', () => {
      expect(Pathfinder.hexDistance(0, 0, 0, 0)).toBe(0);
      expect(Pathfinder.hexDistance(5, 3, 5, 3)).toBe(0);
    });

    it('returns 1 for adjacent hexes', () => {
      expect(Pathfinder.hexDistance(0, 0, 1, 0)).toBe(1);
      expect(Pathfinder.hexDistance(0, 0, 0, 1)).toBe(1);
    });

    it('calculates larger distances correctly', () => {
      expect(Pathfinder.hexDistance(0, 0, 2, 0)).toBe(2);
      expect(Pathfinder.hexDistance(-2, -2, 2, 2)).toBe(8);
    });

    it('is symmetric', () => {
      const d1 = Pathfinder.hexDistance(1, 2, 5, 7);
      const d2 = Pathfinder.hexDistance(5, 7, 1, 2);
      expect(d1).toBe(d2);
    });
  });
});
