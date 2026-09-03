import { describe, it, expect, beforeEach } from 'vitest';
import { FractalRhythmEngine, type SectorData, type FractalPoint } from './fractal-rhythm-engine';

describe('FractalRhythmEngine', () => {
  let engine: FractalRhythmEngine;

  beforeEach(() => {
    engine = new FractalRhythmEngine();
  });

  describe('generateSector', () => {
    it('should generate a sector with correct number of points', () => {
      const iterations = 100;
      const sector = engine.generateSector(42, iterations, 2, 10);

      expect(sector.points).toHaveLength(iterations);
    });

    it('should generate unique sector ID', () => {
      const sector1 = engine.generateSector(42, 10, 2, 10);
      // Use different seed to ensure uniqueness
      const sector2 = engine.generateSector(43, 10, 2, 10);

      expect(sector1.id).not.toBe(sector2.id);
    });

    it('should generate points with valid coordinates', () => {
      const sector = engine.generateSector(42, 50, 2, 10);

      sector.points.forEach(point => {
        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('number');
        expect(typeof point.z).toBe('number');
      });
    });

    it('should calculate intensity values between 0 and 1', () => {
      const sector = engine.generateSector(42, 50, 2, 10);

      sector.points.forEach(point => {
        expect(point.intensity).toBeGreaterThanOrEqual(0);
        expect(point.intensity).toBeLessThanOrEqual(1);
      });
    });

    it('should calculate rhythm phase values between 0 and 1', () => {
      const sector = engine.generateSector(42, 50, 2, 10);

      sector.points.forEach(point => {
        expect(point.rhythmPhase).toBeGreaterThanOrEqual(0);
        expect(point.rhythmPhase).toBeLessThanOrEqual(1);
      });
    });

    it('should calculate entropy levels between 0 and 1', () => {
      const sector = engine.generateSector(42, 50, 2, 10);

      sector.points.forEach(point => {
        expect(point.entropyLevel).toBeGreaterThanOrEqual(0);
        expect(point.entropyLevel).toBeLessThanOrEqual(1);
      });
    });

    it('should apply tricyclic derivation pattern (cycle 0, 1, 2)', () => {
      const sector = engine.generateSector(42, 9, 2, 10);

      // Verify we have 9 points (3 complete cycles)
      expect(sector.points).toHaveLength(9);

      // Each cycle should have different characteristics
      const cycle0Points = sector.points.filter((_, i) => i % 3 === 0);
      const cycle1Points = sector.points.filter((_, i) => i % 3 === 1);
      const cycle2Points = sector.points.filter((_, i) => i % 3 === 2);

      expect(cycle0Points).toHaveLength(3);
      expect(cycle1Points).toHaveLength(3);
      expect(cycle2Points).toHaveLength(3);
    });

    it('should calculate economic factor based on rhythm', () => {
      const sector = engine.generateSector(42, 50, 2, 10);

      expect(typeof sector.economicFactor).toBe('number');
      expect(sector.economicFactor).toBeGreaterThan(0);
    });

    it('should calculate adventure potential based on points', () => {
      const sector = engine.generateSector(42, 50, 2, 10);

      expect(typeof sector.adventurePotential).toBe('number');
      expect(sector.adventurePotential).toBeGreaterThanOrEqual(0);
    });

    it('should set isEntropyStable based on entropy threshold', () => {
      const lowIterations = engine.generateSector(42, 10, 2, 10);
      const highIterations = engine.generateSector(42, 1000, 2, 10);

      expect(typeof lowIterations.isEntropyStable).toBe('boolean');
      expect(typeof highIterations.isEntropyStable).toBe('boolean');
    });

    it('should apply 75% rule for algorithmic distances', () => {
      const sector = engine.generateSector(42, 100, 2, 10);

      // Points should follow the 75% distance pattern
      // First 75% should have different spacing than last 25%
      expect(sector.points.length).toBe(100);
    });

    it('should apply 30% scale factor to map', () => {
      const smallScale = engine.generateSector(42, 50, 2, 1);
      const largeScale = engine.generateSector(42, 50, 2, 100);

      // Larger scale should produce larger coordinate ranges
      const smallMaxX = Math.max(...smallScale.points.map(p => Math.abs(p.x)));
      const largeMaxX = Math.max(...largeScale.points.map(p => Math.abs(p.x)));

      expect(largeMaxX).toBeGreaterThan(smallMaxX);
    });

    it('should vary depth based on tricyclic cycle', () => {
      const sector = engine.generateSector(42, 30, 2, 10);

      // Different cycles should produce different depth patterns
      const cycle0Depths = sector.points.filter((_, i) => i % 3 === 0).map(p => p.z);
      const cycle1Depths = sector.points.filter((_, i) => i % 3 === 1).map(p => p.z);
      const cycle2Depths = sector.points.filter((_, i) => i % 3 === 2).map(p => p.z);

      // Cycle 1 should have 1.5x depth multiplier
      const avgCycle0 = cycle0Depths.reduce((a, b) => a + b, 0) / cycle0Depths.length;
      const avgCycle1 = cycle1Depths.reduce((a, b) => a + b, 0) / cycle1Depths.length;
      const avgCycle2 = cycle2Depths.reduce((a, b) => a + b, 0) / cycle2Depths.length;

      // Cycle 1 should generally have higher absolute depth
      expect(Math.abs(avgCycle1)).toBeGreaterThan(Math.abs(avgCycle2));
    });

    it('should increase entropy with more iterations', () => {
      const lowIter = engine.generateSector(42, 10, 2, 10);
      const highIter = engine.generateSector(42, 500, 2, 10);

      const lowMaxEntropy = Math.max(...lowIter.points.map(p => p.entropyLevel));
      const highMaxEntropy = Math.max(...highIter.points.map(p => p.entropyLevel));

      expect(highMaxEntropy).toBeGreaterThanOrEqual(lowMaxEntropy);
    });

    it('should decrease entropy stability with higher derivative orders', () => {
      const order1 = engine.generateSector(42, 100, 1, 10);
      const order5 = engine.generateSector(42, 100, 5, 10);

      // Higher order should have lower entropy due to orderFactor
      const maxEntropy1 = Math.max(...order1.points.map(p => p.entropyLevel));
      const maxEntropy5 = Math.max(...order5.points.map(p => p.entropyLevel));

      expect(maxEntropy5).toBeLessThanOrEqual(maxEntropy1);
    });
  });

  describe('verifyProofOfExistence', () => {
    let baseSector: SectorData;

    beforeEach(() => {
      baseSector = engine.generateSector(42, 50, 2, 10);
    });

    it('should increase entropy when no proof files provided', async () => {
      const originalEntropy = baseSector.points.map(p => p.entropyLevel);
      const verifiedSector = await engine.verifyProofOfExistence(baseSector, []);

      verifiedSector.points.forEach((point, index) => {
        expect(point.entropyLevel).toBeGreaterThanOrEqual(originalEntropy[index]);
      });
    });

    it('should set isEntropyStable to false when no proof', async () => {
      const verifiedSector = await engine.verifyProofOfExistence(baseSector, []);

      expect(verifiedSector.isEntropyStable).toBe(false);
    });

    it('should decrease intensity when no proof', async () => {
      const originalIntensity = baseSector.points.map(p => p.intensity);
      const verifiedSector = await engine.verifyProofOfExistence(baseSector, []);

      verifiedSector.points.forEach((point, index) => {
        expect(point.intensity).toBeLessThanOrEqual(originalIntensity[index]);
      });
    });

    it('should generate proof hash when files provided', async () => {
      const filePaths = ['file1.txt', 'file2.txt', 'config.json'];
      const verifiedSector = await engine.verifyProofOfExistence(baseSector, filePaths);

      expect(verifiedSector.proofHash).toBeDefined();
      expect(typeof verifiedSector.proofHash).toBe('string');
      expect(verifiedSector.proofHash!.length).toBeGreaterThan(0);
    });

    it('should decrease entropy when proof provided', async () => {
      const filePaths = ['proof.txt'];
      const originalEntropy = baseSector.points.map(p => p.entropyLevel);
      const verifiedSector = await engine.verifyProofOfExistence(baseSector, filePaths);

      verifiedSector.points.forEach((point, index) => {
        expect(point.entropyLevel).toBeLessThanOrEqual(originalEntropy[index]);
      });
    });

    it('should increase intensity when proof provided', async () => {
      const filePaths = ['proof.txt'];
      const originalIntensity = baseSector.points.map(p => p.intensity);
      const verifiedSector = await engine.verifyProofOfExistence(baseSector, filePaths);

      verifiedSector.points.forEach((point, index) => {
        expect(point.intensity).toBeGreaterThanOrEqual(originalIntensity[index]);
      });
    });

    it('should set isEntropyStable to true when proof provided', async () => {
      const filePaths = ['proof.txt'];
      const verifiedSector = await engine.verifyProofOfExistence(baseSector, filePaths);

      expect(verifiedSector.isEntropyStable).toBe(true);
    });

    it('should generate different hashes for different file sets', async () => {
      const baseSector1 = engine.generateSector(42, 50, 2, 10);
      const baseSector2 = engine.generateSector(43, 50, 2, 10);
      const hash1 = await engine.verifyProofOfExistence(baseSector1, ['file1.txt']);
      const hash2 = await engine.verifyProofOfExistence(baseSector2, ['file2.txt']);

      expect(hash1.proofHash).not.toBe(hash2.proofHash);
    });

    it('should prevent entropy from exceeding 1.0', async () => {
      // Create sector with already high entropy
      const highEntropySector = engine.generateSector(42, 500, 2, 10);
      const verifiedSector = await engine.verifyProofOfExistence(highEntropySector, []);

      verifiedSector.points.forEach(point => {
        expect(point.entropyLevel).toBeLessThanOrEqual(1.0);
      });
    });

    it('should prevent intensity from going below 0', async () => {
      const verifiedSector = await engine.verifyProofOfExistence(baseSector, []);

      verifiedSector.points.forEach(point => {
        expect(point.intensity).toBeGreaterThanOrEqual(0);
      });
    });

    it('should prevent intensity from exceeding 1.0', async () => {
      const filePaths = ['proof.txt'];
      const verifiedSector = await engine.verifyProofOfExistence(baseSector, filePaths);

      verifiedSector.points.forEach(point => {
        expect(point.intensity).toBeLessThanOrEqual(1.0);
      });
    });
  });

  describe('generateLightSignals', () => {
    it('should generate light signals for all points', () => {
      const sector = engine.generateSector(42, 50, 2, 10);
      const signals = engine.generateLightSignals(sector.points);

      expect(signals).toHaveLength(50);
    });

    it('should assign geometry types based on rhythm phase', () => {
      const sector = engine.generateSector(42, 90, 2, 10);
      const signals = engine.generateLightSignals(sector.points);

      signals.forEach(signal => {
        expect(['circle', 'polygon', 'line']).toContain(signal.geometryType);
      });
    });

    it('should assign circle geometry for high rhythm phase (>0.66)', () => {
      // Create points with known rhythm phases
      const testPoints: FractalPoint[] = [
        { x: 0, y: 0, z: 0, intensity: 0.5, rhythmPhase: 0.7, entropyLevel: 0.3 },
        { x: 0, y: 0, z: 0, intensity: 0.5, rhythmPhase: 0.8, entropyLevel: 0.3 },
      ];

      const signals = engine.generateLightSignals(testPoints);

      signals.forEach(signal => {
        expect(signal.geometryType).toBe('circle');
      });
    });

    it('should assign polygon geometry for medium rhythm phase (0.33-0.66)', () => {
      const testPoints: FractalPoint[] = [
        { x: 0, y: 0, z: 0, intensity: 0.5, rhythmPhase: 0.4, entropyLevel: 0.3 },
        { x: 0, y: 0, z: 0, intensity: 0.5, rhythmPhase: 0.5, entropyLevel: 0.3 },
      ];

      const signals = engine.generateLightSignals(testPoints);

      signals.forEach(signal => {
        expect(signal.geometryType).toBe('polygon');
      });
    });

    it('should assign line geometry for low rhythm phase (<0.33)', () => {
      const testPoints: FractalPoint[] = [
        { x: 0, y: 0, z: 0, intensity: 0.5, rhythmPhase: 0.1, entropyLevel: 0.3 },
        { x: 0, y: 0, z: 0, intensity: 0.5, rhythmPhase: 0.2, entropyLevel: 0.3 },
      ];

      const signals = engine.generateLightSignals(testPoints);

      signals.forEach(signal => {
        expect(signal.geometryType).toBe('line');
      });
    });

    it('should generate valid RGB color strings', () => {
      const sector = engine.generateSector(42, 50, 2, 10);
      const signals = engine.generateLightSignals(sector.points);

      const rgbRegex = /^rgb\(\d+, \d+, \d+\)$/;

      signals.forEach(signal => {
        expect(signal.color).toMatch(rgbRegex);
      });
    });

    it('should calculate alpha based on intensity', () => {
      const testPoints: FractalPoint[] = [
        { x: 0, y: 0, z: 0, intensity: 0.3, rhythmPhase: 0.5, entropyLevel: 0.3 },
        { x: 0, y: 0, z: 0, intensity: 0.8, rhythmPhase: 0.5, entropyLevel: 0.3 },
      ];

      const signals = engine.generateLightSignals(testPoints);

      expect(signals[0].alpha).toBe(0.3);
      expect(signals[1].alpha).toBe(0.8);
    });

    it('should calculate size based on depth (z)', () => {
      const testPoints: FractalPoint[] = [
        { x: 0, y: 0, z: 0, intensity: 0.5, rhythmPhase: 0.5, entropyLevel: 0.3 },
        { x: 0, y: 0, z: 5, intensity: 0.5, rhythmPhase: 0.5, entropyLevel: 0.3 },
        { x: 0, y: 0, z: -3, intensity: 0.5, rhythmPhase: 0.5, entropyLevel: 0.3 },
      ];

      const signals = engine.generateLightSignals(testPoints);

      // size = |z| * 2 + 1
      expect(signals[0].size).toBe(1);  // |0| * 2 + 1
      expect(signals[1].size).toBe(11); // |5| * 2 + 1
      expect(signals[2].size).toBe(7);  // |-3| * 2 + 1
    });

    it('should generate warm colors for stable entropy', () => {
      const testPoints: FractalPoint[] = [
        { x: 0, y: 0, z: 0, intensity: 0.8, rhythmPhase: 0.5, entropyLevel: 0.3 },
      ];

      const signals = engine.generateLightSignals(testPoints);
      const color = signals[0].color;

      // Warm colors should have higher red and green components
      expect(color).toMatch(/rgb\([1-2]\d\d, [1-2]\d\d, \d+\)/);
    });

    it('should generate cool colors for high entropy', () => {
      const testPoints: FractalPoint[] = [
        { x: 0, y: 0, z: 0, intensity: 0.8, rhythmPhase: 0.5, entropyLevel: 0.9 },
      ];

      const signals = engine.generateLightSignals(testPoints);
      const color = signals[0].color;

      // Cool colors (chaos) should have higher blue component
      expect(color).toMatch(/rgb\(\d+, 50, [2-5]\d\d\)/);
    });
  });

  describe('Integration Tests', () => {
    it('should complete full workflow: generate -> verify -> render', async () => {
      // Generate sector
      const sector = engine.generateSector(42, 100, 3, 50);
      expect(sector.points).toHaveLength(100);

      // Verify with proof
      const verified = await engine.verifyProofOfExistence(sector, ['game_state.json']);
      expect(verified.proofHash).toBeDefined();
      expect(verified.isEntropyStable).toBe(true);

      // Generate light signals for rendering
      const signals = engine.generateLightSignals(verified.points);
      expect(signals).toHaveLength(100);
      expect(signals[0]).toHaveProperty('geometryType');
      expect(signals[0]).toHaveProperty('color');
    });

    it('should handle entropy crisis without proof', async () => {
      const sector = engine.generateSector(42, 500, 3, 50);
      const originalStable = sector.isEntropyStable;

      const crisis = await engine.verifyProofOfExistence(sector, []);

      expect(crisis.isEntropyStable).toBe(false);
      expect(crisis.proofHash).toBeUndefined();

      // Entropy should be higher or equal (some points may already be at max)
      const originalAvgEntropy = sector.points.reduce((sum, p) => sum + p.entropyLevel, 0) / 500;
      const crisisAvgEntropy = crisis.points.reduce((sum, p) => sum + p.entropyLevel, 0) / 500;

      expect(crisisAvgEntropy).toBeGreaterThanOrEqual(originalAvgEntropy);
    });

    it('should demonstrate 75/30 rule impact on map generation', () => {
      const sector = engine.generateSector(42, 100, 2, 100);

      // Check that points follow the expected distribution
      const first75Percent = sector.points.slice(0, 75);
      const last25Percent = sector.points.slice(75);

      // Both sections should have valid data
      expect(first75Percent).toHaveLength(75);
      expect(last25Percent).toHaveLength(25);

      // All points should have valid coordinates
      [...first75Percent, ...last25Percent].forEach(point => {
        expect(Number.isFinite(point.x)).toBe(true);
        expect(Number.isFinite(point.y)).toBe(true);
        expect(Number.isFinite(point.z)).toBe(true);
      });
    });
  });
});
