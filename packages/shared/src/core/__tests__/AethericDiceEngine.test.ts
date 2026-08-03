import { describe, it, expect, beforeEach } from 'vitest';
import { AethericDiceEngine } from '../AethericDiceEngine';

describe('AethericDiceEngine', () => {
  beforeEach(() => {
    // Reset bypass mode before each test
    AethericDiceEngine.bypassDice = false;
  });

  describe('getCategoryByHero', () => {
    it('returns SOVEREIGN_EXEMPLAR for null heroId', () => {
      const category = AethericDiceEngine.getCategoryByHero(null);
      expect(category).toBe('SOVEREIGN_EXEMPLAR');
    });

    it('returns SOVEREIGN_EXEMPLAR for empty heroId', () => {
      const category = AethericDiceEngine.getCategoryByHero('');
      expect(category).toBe('SOVEREIGN_EXEMPLAR');
    });

    it('returns AETHER_SPELLWEAVER for wizard-related keywords', () => {
      expect(AethericDiceEngine.getCategoryByHero('wizard')).toBe('AETHER_SPELLWEAVER');
      expect(AethericDiceEngine.getCategoryByHero('hacker')).toBe('AETHER_SPELLWEAVER');
      expect(AethericDiceEngine.getCategoryByHero('spellweaver')).toBe('AETHER_SPELLWEAVER');
    });

    it('returns MYRMIDON_SENTINEL for defender-related keywords', () => {
      expect(AethericDiceEngine.getCategoryByHero('myrmidon')).toBe('MYRMIDON_SENTINEL');
      expect(AethericDiceEngine.getCategoryByHero('defender')).toBe('MYRMIDON_SENTINEL');
      expect(AethericDiceEngine.getCategoryByHero('sentinel')).toBe('MYRMIDON_SENTINEL');
    });

    it('returns GIGANTIC_BEHEMOTH for giant-related keywords', () => {
      expect(AethericDiceEngine.getCategoryByHero('behemoth')).toBe('GIGANTIC_BEHEMOTH');
      expect(AethericDiceEngine.getCategoryByHero('titan')).toBe('GIGANTIC_BEHEMOTH');
      expect(AethericDiceEngine.getCategoryByHero('colossus')).toBe('GIGANTIC_BEHEMOTH');
      expect(AethericDiceEngine.getCategoryByHero('king')).toBe('GIGANTIC_BEHEMOTH');
    });

    it('returns SWIFT_HARBINGER for scout-related keywords', () => {
      expect(AethericDiceEngine.getCategoryByHero('scout')).toBe('SWIFT_HARBINGER');
      expect(AethericDiceEngine.getCategoryByHero('harbinger')).toBe('SWIFT_HARBINGER');
      expect(AethericDiceEngine.getCategoryByHero('vanguard')).toBe('SWIFT_HARBINGER');
    });

    it('returns SOVEREIGN_EXEMPLAR as default for unknown hero', () => {
      const category = AethericDiceEngine.getCategoryByHero('unknown_hero');
      expect(category).toBe('SOVEREIGN_EXEMPLAR');
    });

    it('is case-insensitive', () => {
      expect(AethericDiceEngine.getCategoryByHero('WIZARD')).toBe('AETHER_SPELLWEAVER');
      expect(AethericDiceEngine.getCategoryByHero('MyRmIdOn')).toBe('MYRMIDON_SENTINEL');
    });
  });

  describe('rollDie', () => {
    it('returns value between 1 and 6 for D6', () => {
      for (let i = 0; i < 100; i++) {
        const roll = AethericDiceEngine.rollDie(6);
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(6);
      }
    });

    it('returns value between 1 and 12 for D12', () => {
      for (let i = 0; i < 100; i++) {
        const roll = AethericDiceEngine.rollDie(12);
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(12);
      }
    });
  });

  describe('applyDiceModification', () => {
    describe('AVERAGE modifier (SOVEREIGN_EXEMPLAR)', () => {
      it('averages original value with dice roll', () => {
        // With custom roll of 4: (10 + 4) / 2 = 7
        const result = AethericDiceEngine.applyDiceModification('SOVEREIGN_EXEMPLAR', 10, 4);
        expect(result.originalValue).toBe(10);
        expect(result.modifiedValue).toBe(7);
        expect(result.roll).toBe(4);
        expect(result.diceType).toBe('D6');
        expect(result.modifierType).toBe('AVERAGE');
      });

      it('rounds the average correctly', () => {
        // With custom roll of 3: (10 + 3) / 2 = 6.5 -> 7 (rounded)
        const result = AethericDiceEngine.applyDiceModification('SOVEREIGN_EXEMPLAR', 10, 3);
        expect(result.modifiedValue).toBe(7);
      });
    });

    describe('MULTIPLY modifier (AETHER_SPELLWEAVER)', () => {
      it('multiplies original value by roll ratio', () => {
        // With D12 roll of 6: multiplier = 1.0 + (6/12) = 1.5
        // modifiedValue = round(10 * 1.5) = 15
        const result = AethericDiceEngine.applyDiceModification('AETHER_SPELLWEAVER', 10, 6);
        expect(result.originalValue).toBe(10);
        expect(result.modifiedValue).toBe(15);
        expect(result.diceType).toBe('D12');
        expect(result.modifierType).toBe('MULTIPLY');
      });

      it('handles maximum roll correctly', () => {
        // With D12 roll of 12: multiplier = 1.0 + (12/12) = 2.0
        const result = AethericDiceEngine.applyDiceModification('AETHER_SPELLWEAVER', 10, 12);
        expect(result.modifiedValue).toBe(20);
      });
    });

    describe('DIVIDE modifier (GIGANTIC_BEHEMOTH)', () => {
      it('divides original value by entropy scale factor', () => {
        // With D12 roll of 12: factor = max(1.0, (13-12)*0.5) = 0.5 -> but max is 1.0
        // modifiedValue = max(1, round(10 / 1.0)) = 10
        const result = AethericDiceEngine.applyDiceModification('GIGANTIC_BEHEMOTH', 10, 12);
        expect(result.modifiedValue).toBe(10);
      });

      it('applies heavy penalty for low roll', () => {
        // With D12 roll of 1: factor = max(1.0, (13-1)*0.5) = 6.0
        // modifiedValue = max(1, round(10 / 6.0)) = 2
        const result = AethericDiceEngine.applyDiceModification('GIGANTIC_BEHEMOTH', 10, 1);
        expect(result.modifiedValue).toBe(2);
      });
    });

    describe('bypass mode', () => {
      it('returns original value unchanged when bypassDice is true', () => {
        AethericDiceEngine.bypassDice = true;
        const result = AethericDiceEngine.applyDiceModification('SOVEREIGN_EXEMPLAR', 10, 5);
        expect(result.modifiedValue).toBe(10);
        expect(result.roll).toBe(0);
        expect(result.formula).toBe('Bypassed (Deterministic Test Mode)');
      });
    });
  });

  describe('calculateContestedDamage', () => {
    describe('MORE condition (default)', () => {
      it('amplifies damage when attacker rolls higher', () => {
        const result = AethericDiceEngine.calculateContestedDamage(5, 3, 10, 'MORE');
        expect(result.success).toBe(true);
        expect(result.finalDamage).toBe(15); // 10 * 1.5
        expect(result.log).toContain('Success');
      });

      it('mitigates damage when attacker rolls lower', () => {
        const result = AethericDiceEngine.calculateContestedDamage(3, 5, 10, 'MORE');
        expect(result.success).toBe(false);
        expect(result.finalDamage).toBe(5); // 10 * 0.5
        expect(result.log).toContain('Failed');
      });

      it('mitigates damage when rolls are equal', () => {
        const result = AethericDiceEngine.calculateContestedDamage(4, 4, 10, 'MORE');
        expect(result.success).toBe(false);
        expect(result.finalDamage).toBe(5);
      });
    });

    describe('LESS condition', () => {
      it('amplifies damage when attacker rolls lower', () => {
        const result = AethericDiceEngine.calculateContestedDamage(3, 5, 10, 'LESS');
        expect(result.success).toBe(true);
        expect(result.finalDamage).toBe(15);
      });

      it('mitigates damage when attacker rolls higher', () => {
        const result = AethericDiceEngine.calculateContestedDamage(5, 3, 10, 'LESS');
        expect(result.success).toBe(false);
        expect(result.finalDamage).toBe(5);
      });
    });

    describe('edge cases', () => {
      it('ensures minimum damage of 1', () => {
        const result = AethericDiceEngine.calculateContestedDamage(3, 5, 1, 'MORE');
        expect(result.finalDamage).toBe(1); // Would be 0.5, but minimum is 1
      });

      it('handles zero base damage', () => {
        const result = AethericDiceEngine.calculateContestedDamage(5, 3, 0, 'MORE');
        expect(result.finalDamage).toBe(0);
      });
    });

    describe('bypass mode', () => {
      it('returns base damage unchanged when bypassDice is true', () => {
        AethericDiceEngine.bypassDice = true;
        const result = AethericDiceEngine.calculateContestedDamage(5, 3, 10, 'MORE');
        expect(result.finalDamage).toBe(10);
        expect(result.success).toBe(true);
        expect(result.log).toBe('Bypassed (Deterministic Test Mode)');
        AethericDiceEngine.bypassDice = false;
      });
    });
  });
});
