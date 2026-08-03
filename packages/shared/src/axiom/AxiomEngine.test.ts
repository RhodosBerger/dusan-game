/**
 * Unit tests for AxiomEngine and related components
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  AxiomEngine, 
  WorldNodeGenerator, 
  AxiomaticQuestGenerator, 
  VisualManifestationEngine,
  type AxiomSet
} from './AxiomEngine';

describe('AxiomEngine', () => {
  let engine: AxiomEngine;
  
  const mockAxiomSet: AxiomSet = {
    id: 'test-world-1',
    name: 'Test World',
    seed: 12345,
    axioms: {
      'AXIOM_GRAVITY_STANDARD': {
        id: 'AXIOM_GRAVITY_STANDARD',
        category: 'PHYSICS',
        name: 'Standard Gravity',
        description: 'Base gravity constant',
        value: 1.0,
        weight: 1.0
      },
      'AXIOM_MAGIC_AMBIENT': {
        id: 'AXIOM_MAGIC_AMBIENT',
        category: 'MAGIC',
        name: 'Ambient Magic',
        description: 'Background magic density',
        value: 0.8,
        weight: 0.8
      },
      'AXIOM_DIVINE_LIGHT': {
        id: 'AXIOM_DIVINE_LIGHT',
        category: 'MORALITY',
        name: 'Divine Light',
        description: 'Goodness alignment',
        value: 0.6,
        weight: 0.6
      },
      'AXIOM_SHADOW_CORRUPTION': {
        id: 'AXIOM_SHADOW_CORRUPTION',
        category: 'MORALITY',
        name: 'Shadow Corruption',
        description: 'Evil alignment',
        value: 0.3,
        weight: 0.8
      }
    }
  };

  beforeEach(() => {
    engine = new AxiomEngine();
  });

  it('should initialize with axiom set', () => {
    engine.initialize(mockAxiomSet);
    expect(engine.getStateHash({ 
      globalAxioms: mockAxiomSet, 
      localModifiers: {}, 
      time: 0, 
      playerKarma: 0 
    })).toBeDefined();
  });

  it('should return correct axiom value', () => {
    engine.initialize(mockAxiomSet);
    const context = {
      globalAxioms: mockAxiomSet,
      localModifiers: {},
      time: 12,
      playerKarma: 0
    };
    
    const value = engine.getAxiomValue('AXIOM_MAGIC_AMBIENT', context);
    expect(value).toBe(0.8);
  });

  it('should apply local modifiers to axiom value', () => {
    engine.initialize(mockAxiomSet);
    const context = {
      globalAxioms: mockAxiomSet,
      localModifiers: { 'AXIOM_MAGIC_AMBIENT': 1.5 },
      time: 12,
      playerKarma: 0
    };
    
    const value = engine.getAxiomValue('AXIOM_MAGIC_AMBIENT', context);
    expect(value).toBe(1.0); // Clamped to max 1.0
  });

  it('should derive property from multiple axioms', () => {
    engine.initialize(mockAxiomSet);
    const context = {
      globalAxioms: mockAxiomSet,
      localModifiers: {},
      time: 12,
      playerKarma: 0
    };
    
    const moralAlignment = engine.deriveProperty({
      'AXIOM_DIVINE_LIGHT': 0.6,
      'AXIOM_SHADOW_CORRUPTION': -0.8
    }, context);
    
    expect(moralAlignment).toBeCloseTo((0.6 * 0.6) + (0.3 * -0.8), 2);
  });

  it('should generate consistent state hash', () => {
    engine.initialize(mockAxiomSet);
    const context1 = {
      globalAxioms: mockAxiomSet,
      localModifiers: {},
      time: 10,
      playerKarma: 0.5
    };
    const context2 = {
      globalAxioms: mockAxiomSet,
      localModifiers: {},
      time: 10,
      playerKarma: 0.5
    };
    
    expect(engine.getStateHash(context1)).toBe(engine.getStateHash(context2));
  });

  it('should generate different hash for different contexts', () => {
    engine.initialize(mockAxiomSet);
    const context1 = {
      globalAxioms: mockAxiomSet,
      localModifiers: {},
      time: 10,
      playerKarma: 0.5
    };
    const context2 = {
      globalAxioms: mockAxiomSet,
      localModifiers: {},
      time: 12,
      playerKarma: 0.5
    };
    
    expect(engine.getStateHash(context1)).not.toBe(engine.getStateHash(context2));
  });
});

describe('WorldNodeGenerator', () => {
  let engine: AxiomEngine;
  let generator: WorldNodeGenerator;
  
  const mockAxiomSet: AxiomSet = {
    id: 'test-world-1',
    name: 'Test World',
    seed: 12345,
    axioms: {
      'AXIOM_GRAVITY_STANDARD': {
        id: 'AXIOM_GRAVITY_STANDARD',
        category: 'PHYSICS',
        name: 'Standard Gravity',
        description: 'Base gravity constant',
        value: 1.0,
        weight: 1.0
      },
      'AXIOM_TERRAIN_ROUGHNESS': {
        id: 'AXIOM_TERRAIN_ROUGHNESS',
        category: 'PHYSICS',
        name: 'Terrain Roughness',
        description: 'How rough the terrain is',
        value: 0.5,
        weight: 0.5
      },
      'AXIOM_MAGIC_AMBIENT': {
        id: 'AXIOM_MAGIC_AMBIENT',
        category: 'MAGIC',
        name: 'Ambient Magic',
        description: 'Background magic density',
        value: 0.8,
        weight: 0.8
      },
      'AXIOM_DIVINE_LIGHT': {
        id: 'AXIOM_DIVINE_LIGHT',
        category: 'MORALITY',
        name: 'Divine Light',
        description: 'Goodness alignment',
        value: 0.6,
        weight: 0.6
      },
      'AXIOM_SHADOW_CORRUPTION': {
        id: 'AXIOM_SHADOW_CORRUPTION',
        category: 'MORALITY',
        name: 'Shadow Corruption',
        description: 'Evil alignment',
        value: 0.3,
        weight: 0.8
      }
    }
  };

  beforeEach(() => {
    engine = new AxiomEngine();
    engine.initialize(mockAxiomSet);
    generator = new WorldNodeGenerator(engine);
  });

  it('should generate node with valid properties', () => {
    const context = {
      globalAxioms: mockAxiomSet,
      localModifiers: {},
      time: 12,
      playerKarma: 0
    };
    
    const node = generator.generateNode(0, 0, 0, context);
    
    expect(node.nodeId).toBe('node_0_0_0');
    expect(node.position).toBeDefined();
    expect(node.biomeType).toBeDefined();
    expect(node.elevation).toBeGreaterThanOrEqual(0);
    expect(node.elevation).toBeLessThanOrEqual(1);
    expect(node.moisture).toBeGreaterThanOrEqual(0);
    expect(node.moisture).toBeLessThanOrEqual(1);
    expect(node.properties.gravity).toBeGreaterThan(0);
    expect(node.properties.moralAlignment).toBeDefined();
    expect(node.properties.visualStyle).toBeDefined();
  });

  it('should generate different nodes for different coordinates', () => {
    const context = {
      globalAxioms: mockAxiomSet,
      localModifiers: {},
      time: 12,
      playerKarma: 0
    };
    
    const node1 = generator.generateNode(0, 0, 0, context);
    const node2 = generator.generateNode(10, 0, 10, context);
    
    expect(node1.nodeId).not.toBe(node2.nodeId);
    expect(node1.elevation).not.toBe(node2.elevation);
  });

  it('should determine biomes correctly', () => {
    const context = {
      globalAxioms: mockAxiomSet,
      localModifiers: { 'AXIOM_MAGIC_AMBIENT': 1.5 }, // Force high magic
      time: 12,
      playerKarma: 0
    };
    
    const node = generator.generateNode(0, 0, 0, context);
    
    // With high magic, should potentially be ARCANE_WASTELAND
    expect(['ARCANE_WASTELAND', 'HIGH_PEAKS', 'LUSH_JUNGLE', 'DESERT', 'TEMPERATE_PLAINS'])
      .toContain(node.biomeType);
  });
});

describe('AxiomaticQuestGenerator', () => {
  let engine: AxiomEngine;
  let questGenerator: AxiomaticQuestGenerator;
  
  const mockAxiomSet: AxiomSet = {
    id: 'test-world-1',
    name: 'Test World',
    seed: 12345,
    axioms: {
      'AXIOM_DIVINE_LIGHT': {
        id: 'AXIOM_DIVINE_LIGHT',
        category: 'MORALITY',
        name: 'Divine Light',
        description: 'Goodness alignment',
        value: 0.2, // Low divine light
        weight: 0.6
      },
      'AXIOM_SHADOW_CORRUPTION': {
        id: 'AXIOM_SHADOW_CORRUPTION',
        category: 'MORALITY',
        name: 'Shadow Corruption',
        description: 'Evil alignment',
        value: 0.9, // High corruption
        weight: 0.8
      },
      'AXIOM_MAGIC_AMBIENT': {
        id: 'AXIOM_MAGIC_AMBIENT',
        category: 'MAGIC',
        name: 'Ambient Magic',
        description: 'Background magic density',
        value: 0.9, // High magic
        weight: 0.8
      }
    }
  };

  beforeEach(() => {
    engine = new AxiomEngine();
    engine.initialize(mockAxiomSet);
    questGenerator = new AxiomaticQuestGenerator(engine);
  });

  it('should generate shadow quests for low moral alignment', () => {
    const nodeData = {
      nodeId: 'test-node-1',
      position: { x: 0, y: 0, z: 0 },
      biomeType: 'TEMPERATE_PLAINS',
      elevation: 0.5,
      moisture: 0.5,
      properties: {
        gravity: 9.81,
        magicDensity: 0.5,
        resourceRichness: 0.5,
        moralAlignment: -0.5, // Evil
        visualStyle: 'temperate_plains_corrupted'
      },
      entities: [],
      connections: []
    };
    
    const context = {
      globalAxioms: mockAxiomSet,
      localModifiers: {},
      time: 12,
      playerKarma: 0
    };
    
    const quests = questGenerator.generateQuestsForNode(nodeData as any, context);
    
    expect(quests.length).toBeGreaterThan(0);
    expect(quests.some(q => q.type === 'CLEANSE')).toBe(true);
  });

  it('should generate magic quests for high magic density', () => {
    const nodeData = {
      nodeId: 'test-node-2',
      position: { x: 0, y: 0, z: 0 },
      biomeType: 'ARCANE_WASTELAND',
      elevation: 0.5,
      moisture: 0.5,
      properties: {
        gravity: 9.81,
        magicDensity: 0.8, // High magic
        resourceRichness: 0.5,
        moralAlignment: 0,
        visualStyle: 'arcane_wasteland'
      },
      entities: [],
      connections: []
    };
    
    const context = {
      globalAxioms: mockAxiomSet,
      localModifiers: {},
      time: 12,
      playerKarma: 0
    };
    
    const quests = questGenerator.generateQuestsForNode(nodeData as any, context);
    
    expect(quests.some(q => q.type === 'STABILIZE')).toBe(true);
  });
});

describe('VisualManifestationEngine', () => {
  let visualEngine: VisualManifestationEngine;

  beforeEach(() => {
    visualEngine = new VisualManifestationEngine();
  });

  it('should generate CSS class and uniforms for node', () => {
    const nodeData = {
      nodeId: 'test-node-1',
      position: { x: 0, y: 0, z: 0 },
      biomeType: 'LUSH_JUNGLE',
      elevation: 0.5,
      moisture: 0.7,
      properties: {
        gravity: 9.81,
        magicDensity: 0.6,
        resourceRichness: 0.5,
        moralAlignment: 0.7, // Good
        visualStyle: 'lush_jungle_blessed'
      },
      entities: [],
      connections: []
    };
    
    const result = visualEngine.renderNodeStyles(nodeData as any);
    
    expect(result.cssClass).toContain('biome-lush_jungle_blessed');
    expect(result.cssClass).toContain('karma-light');
    expect(result.uniforms).toBeDefined();
    expect(result.uniforms.uColorPrimary).toBeDefined();
    expect(result.uniforms.uBrightness).toBeGreaterThan(1.0);
  });

  it('should generate dark karma class for evil alignment', () => {
    const nodeData = {
      nodeId: 'test-node-2',
      position: { x: 0, y: 0, z: 0 },
      biomeType: 'DESERT',
      elevation: 0.3,
      moisture: 0.1,
      properties: {
        gravity: 9.81,
        magicDensity: 0.2,
        resourceRichness: 0.3,
        moralAlignment: -0.6, // Evil
        visualStyle: 'desert_corrupted'
      },
      entities: [],
      connections: []
    };
    
    const result = visualEngine.renderNodeStyles(nodeData as any);
    
    expect(result.cssClass).toContain('karma-dark');
  });

  it('should convert hex colors to RGB correctly', () => {
    const nodeData = {
      nodeId: 'test-node-3',
      position: { x: 0, y: 0, z: 0 },
      biomeType: 'HIGH_PEAKS',
      elevation: 0.9,
      moisture: 0.2,
      properties: {
        gravity: 9.81,
        magicDensity: 0.1,
        resourceRichness: 0.2,
        moralAlignment: 0,
        visualStyle: 'high_peaks'
      },
      entities: [],
      connections: []
    };
    
    const result = visualEngine.renderNodeStyles(nodeData as any);
    
    // HIGH_PEAKS should be white (#FFFFFF)
    expect(result.uniforms.uColorPrimary[0]).toBeCloseTo(1.0, 1);
    expect(result.uniforms.uColorPrimary[1]).toBeCloseTo(1.0, 1);
    expect(result.uniforms.uColorPrimary[2]).toBeCloseTo(1.0, 1);
  });
});
