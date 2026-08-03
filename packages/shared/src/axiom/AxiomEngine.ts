/**
 * Axiomatic World Generator (AWG) - Core Engine
 * 
 * Tento engine generuje celý herný svet dynamicky na základe súboru Axiómov.
 * Axiómy sú fundamentálne pravdy sveta (fyzika, mágia, ekonomika, morálka),
 * ktoré deterministicky ovplyvňujú generovanie terénu, NPC, questov a vizuálov.
 * 
 * Features:
 * - Dynamická inferencia pravidiel z axiómov
 * - Hierarchické dedenie vlastností (Global -> Region -> Node)
 * - Real-time recomposition pri zmene axiómov (Live Ops)
 * - Seed-based determinizmus pre konzistentné svety
 */

import { Vector3 } from 'three';
import { createNoise2D } from 'simplex-noise';

// -----------------------------------------------------------------------------
// TYPES & INTERFACES
// -----------------------------------------------------------------------------

export type AxiomCategory = 'PHYSICS' | 'MAGIC' | 'ECONOMY' | 'MORALITY' | 'AESTHETIC';

export interface Axiom {
  id: string;
  category: AxiomCategory;
  name: string;
  description: string;
  value: number; 
  weight: number;
  conditions?: Record<string, any>;
}

export interface AxiomSet {
  id: string;
  name: string;
  axioms: Record<string, Axiom>;
  seed: number;
}

export interface WorldNodeData {
  nodeId: string;
  position: Vector3;
  biomeType: string;
  elevation: number;
  moisture: number;
  properties: {
    gravity: number;
    magicDensity: number;
    resourceRichness: number;
    moralAlignment: number;
    visualStyle: string;
  };
  entities: string[];
  connections: string[];
}

export interface GenerationContext {
  globalAxioms: AxiomSet;
  localModifiers: Record<string, number>;
  time: number;
  playerKarma: number;
}

// -----------------------------------------------------------------------------
// CORE ENGINE
// -----------------------------------------------------------------------------

export class AxiomEngine {
  private currentAxiomSet: AxiomSet | null = null;
  private noiseGenerator: ReturnType<typeof createNoise2D>;
  private axiomCache: Map<string, any> = new Map();

  constructor() {
    this.noiseGenerator = createNoise2D();
  }

  public initialize(axiomSet: AxiomSet): void {
    this.currentAxiomSet = axiomSet;
    this.noiseGenerator = createNoise2D(() => axiomSet.seed);
    console.log(`[AxiomEngine] Svet inicializovaný: ${axiomSet.name} (Seed: ${axiomSet.seed})`);
  }

  public getAxiomValue(axiomId: string, context: GenerationContext): number {
    if (!this.currentAxiomSet) throw new Error("AxiomEngine not initialized");
    
    const axiom = this.currentAxiomSet.axioms[axiomId];
    if (!axiom) return 0;

    let finalValue = axiom.value;

    if (context.localModifiers[axiomId]) {
      finalValue *= context.localModifiers[axiomId];
    }

    if (axiom.conditions) {
      if (axiom.conditions.timeRange) {
        const [start, end] = axiom.conditions.timeRange;
        const currentTime = context.time % 24;
        if (currentTime < start || currentTime > end) {
          finalValue = 0;
        }
      }
    }

    return Math.max(0, Math.min(1, finalValue));
  }

  public deriveProperty(propertyFormula: Record<string, number>, context: GenerationContext): number {
    let result = 0;
    for (const [axiomId, weight] of Object.entries(propertyFormula)) {
      const value = this.getAxiomValue(axiomId, context);
      result += value * weight;
    }
    return result;
  }

  public getStateHash(context: GenerationContext): string {
    if (!this.currentAxiomSet) return "empty";
    
    const keyParts = [
      this.currentAxiomSet.id,
      context.time.toFixed(2),
      context.playerKarma.toFixed(2),
      Object.entries(context.localModifiers).sort().join('|')
    ];
    
    let hash = 0;
    const str = keyParts.join(':');
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

// -----------------------------------------------------------------------------
// WORLD NODE GENERATOR
// -----------------------------------------------------------------------------

export class WorldNodeGenerator {
  private axiomEngine: AxiomEngine;

  constructor(axiomEngine: AxiomEngine) {
    this.axiomEngine = axiomEngine;
  }

  public generateNode(x: number, y: number, z: number, context: GenerationContext): WorldNodeData {
    const position = new Vector3(x, y, z);
    
    const elevation = this.generateElevation(x, z, context);
    const moisture = this.generateMoisture(x, z, context);
    
    const gravity = this.axiomEngine.deriveProperty({
      'AXIOM_GRAVITY_STANDARD': 1.0,
      'AXIOM_VOID_PULL': -0.5
    }, context);

    const magicDensity = this.axiomEngine.deriveProperty({
      'AXIOM_MAGIC_AMBIENT': 0.8,
      'AXIOM_LEY_LINES': 0.5
    }, context);

    const moralAlignment = this.axiomEngine.deriveProperty({
      'AXIOM_DIVINE_LIGHT': 0.6,
      'AXIOM_SHADOW_CORRUPTION': -0.8
    }, context);

    const biomeType = this.determineBiome(elevation, moisture, magicDensity);
    const visualStyle = this.determineVisualStyle(biomeType, moralAlignment, context);

    return {
      nodeId: `node_${x}_${y}_${z}`,
      position,
      biomeType,
      elevation,
      moisture,
      properties: {
        gravity: 9.81 * (1 + gravity),
        magicDensity,
        resourceRichness: moisture * 0.5 + elevation * 0.2,
        moralAlignment,
        visualStyle
      },
      entities: [],
      connections: []
    };
  }

  private generateElevation(x: number, z: number, context: GenerationContext): number {
    const scale = 0.05 * (1 + this.axiomEngine.getAxiomValue('AXIOM_TERRAIN_ROUGHNESS', context));
    return Math.abs(this.axiomEngine['noiseGenerator'](x * scale, z * scale));
  }

  private generateMoisture(x: number, z: number, context: GenerationContext): number {
    const scale = 0.03;
    return Math.abs(this.axiomEngine['noiseGenerator'](x * scale + 1000, z * scale));
  }

  private determineBiome(elevation: number, moisture: number, magic: number): string {
    if (magic > 0.8) return 'ARCANE_WASTELAND';
    if (elevation > 0.8) return 'HIGH_PEAKS';
    if (moisture > 0.7) return 'LUSH_JUNGLE';
    if (moisture < 0.2) return 'DESERT';
    return 'TEMPERATE_PLAINS';
  }

  private determineVisualStyle(biome: string, morality: number, context: GenerationContext): string {
    const basePreset = biome.toLowerCase();
    if (morality < -0.5) return `${basePreset}_corrupted`;
    if (morality > 0.5) return `${basePreset}_blessed`;
    return basePreset;
  }
}

// -----------------------------------------------------------------------------
// AXIOMATIC QUEST GENERATOR
// -----------------------------------------------------------------------------

export class AxiomaticQuestGenerator {
  private axiomEngine: AxiomEngine;

  constructor(axiomEngine: AxiomEngine) {
    this.axiomEngine = axiomEngine;
  }

  public generateQuestsForNode(nodeData: WorldNodeData, context: GenerationContext): any[] {
    const quests = [];
    const { moralAlignment, magicDensity } = nodeData.properties;

    if (moralAlignment < -0.3) {
      quests.push({
        id: `quest_shadow_${nodeData.nodeId}`,
        title: "Tiene sa zahusťujú",
        description: "Temná energia v tejto oblasti narastá. Nájdite zdroj corruption.",
        type: "CLEANSE",
        difficulty: Math.abs(moralAlignment) * 10,
        reward: { karma: 0.5, xp: 100 }
      });
    }

    if (magicDensity > 0.7) {
      quests.push({
        id: `quest_magic_${nodeData.nodeId}`,
        title: "Divoká mágia",
        description: "Ley lines sú nestabilné. Stabilizujte kryštály.",
        type: "STABILIZE",
        difficulty: magicDensity * 8,
        reward: { mana: 50, xp: 150 }
      });
    }

    return quests;
  }
}

// -----------------------------------------------------------------------------
// VISUAL MANIFESTATION ENGINE
// -----------------------------------------------------------------------------

export class VisualManifestationEngine {
  public renderNodeStyles(nodeData: WorldNodeData): { cssClass: string; uniforms: Record<string, number> } {
    const stylePreset = nodeData.properties.visualStyle;
    
    const cssClass = `biome-${stylePreset} karma-${nodeData.properties.moralAlignment > 0 ? 'light' : 'dark'}`;

    const uniforms = {
      uColorPrimary: this.hexToRgb(this.getColorForBiome(nodeData.biomeType)),
      uColorSecondary: this.hexToRgb(nodeData.properties.moralAlignment > 0 ? '#FFFFFF' : '#220000'),
      uDistortion: nodeData.properties.magicDensity,
      uBrightness: 1.0 + (nodeData.properties.moralAlignment * 0.2),
      uFogDensity: 0.02 * (1.0 - nodeData.properties.elevation)
    };

    return { cssClass, uniforms };
  }

  private getColorForBiome(biome: string): string {
    const colors: Record<string, string> = {
      'ARCANE_WASTELAND': '#8A2BE2',
      'HIGH_PEAKS': '#FFFFFF',
      'LUSH_JUNGLE': '#228B22',
      'DESERT': '#EDC9AF',
      'TEMPERATE_PLAINS': '#9ACD32'
    };
    return colors[biome] || '#808080';
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    ] : [0, 0, 0];
  }
}

// Export singleton instances
export const axiomEngine = new AxiomEngine();
export const worldNodeGenerator = new WorldNodeGenerator(axiomEngine);
export const questGenerator = new AxiomaticQuestGenerator(axiomEngine);
export const visualEngine = new VisualManifestationEngine();
