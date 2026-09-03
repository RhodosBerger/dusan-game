import { describe, it, expect } from 'vitest';
import { RuleOfThreeSolver } from '../RuleOfThreeSolver';

describe('RuleOfThreeSolver', () => {
  describe('solveDirect', () => {
    it('calculates direct proportion when a2 is unknown', () => {
      const result = RuleOfThreeSolver.solveDirect(2, 4, null, 8);
      expect(result).toBe(4);
    });

    it('calculates direct proportion when b2 is unknown', () => {
      const result = RuleOfThreeSolver.solveDirect(3, 6, 5, null);
      expect(result).toBe(10);
    });

    it('throws error when b1 is zero', () => {
      expect(() => RuleOfThreeSolver.solveDirect(1, 0, null, 5)).toThrow();
    });

    it('throws error when both a2 and b2 are null', () => {
      expect(() => RuleOfThreeSolver.solveDirect(1, 2, null, null)).toThrow();
    });
  });

  describe('solveInverse', () => {
    it('calculates inverse proportion when a2 is unknown', () => {
      const result = RuleOfThreeSolver.solveInverse(4, 6, null, 3);
      expect(result).toBe(8);
    });

    it('calculates inverse proportion when b2 is unknown', () => {
      const result = RuleOfThreeSolver.solveInverse(5, 10, 25, null);
      expect(result).toBe(2);
    });

    it('throws error when both a2 and b2 are null', () => {
      expect(() => RuleOfThreeSolver.solveInverse(1, 2, null, null)).toThrow();
    });
  });

  describe('solveOhm', () => {
    it('calculates current when voltage and resistance are provided', () => {
      const result = RuleOfThreeSolver.solveOhm(12, 4, null);
      expect(result.current).toBe(3);
    });

    it('calculates voltage when current and resistance are provided', () => {
      const result = RuleOfThreeSolver.solveOhm(null, 5, 2);
      expect(result.voltage).toBe(10);
    });

    it('calculates resistance when voltage and current are provided', () => {
      const result = RuleOfThreeSolver.solveOhm(20, null, 4);
      expect(result.resistance).toBe(5);
    });
  });
});
