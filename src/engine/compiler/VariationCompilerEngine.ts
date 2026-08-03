/**
 * Variation Compiler Engine
 * 
 * Kompiluje všetky možné variácie generovaného obsahu.
 * Pre každý neznámy prvok vytvorí maticu možných stavov a prepojení.
 * Funguje ako filter medzi LLM generátorom a finálnym renderom.
 */

import { LLMProfile } from './LLMProfileGenerator';
import { Vector3 } from 'three';

export interface VariationMatrix {
  entityId: string;
  baseProfile: LLMProfile;
  variations: CompiledVariation[];
  compatibilityGraph: Map<string, string[]>; // Ktoré variácie sú kompatibilné
}

export interface CompiledVariation {
  id: string;
  modifications: {
    scale?: Vector3;
    rotation?: number;
    colorShift?: { r: number; g: number; b: number };
    textureVariant?: string;
    behaviorModifier?: string;
  };
  probability: number;
  conditions: string[]; // Za akých podmienok sa táto variácia použije
}

export interface CompilationResult {
  success: boolean;
  matrix: VariationMatrix | null;
  rejectedCount: number;
  warnings: string[];
}

export class VariationCompilerEngine {
  private maxVariationsPerEntity: number = 16;
  private compatibilityRules: Map<string, string[]> = new Map();

  /**
   * Skompiluje všetky možné variácie pre daný profil
   */
  compileVariations(entityId: string, baseProfile: LLMProfile): CompilationResult {
    const warnings: string[] = [];
    const variations: CompiledVariation[] = [];
    let rejectedCount = 0;

    // Generovanie variácií podľa archetype
    const archetype = baseProfile.visualStyle.shapeArchetype;
    
    // 1. Farebné variácie
    const colorVars = this.generateColorVariations(baseProfile, 4);
    variations.push(...colorVars);

    // 2. Štrukturálne variácie (scale/rotation)
    const structVars = this.generateStructuralVariations(baseProfile, 4);
    variations.push(...structVars);

    // 3. Behaviorálne variácie
    const behaviorVars = this.generateBehaviorVariations(baseProfile, 4);
    variations.push(...behaviorVars);

    // 4. Textúrové variácie
    const textureVars = this.generateTextureVariations(baseProfile, 4);
    variations.push(...textureVars);

    // Orezať na maximálny počet
    if (variations.length > this.maxVariationsPerEntity) {
      rejectedCount = variations.length - this.maxVariationsPerEntity;
      variations.splice(this.maxVariationsPerEntity);
      warnings.push(`Trimmed ${rejectedCount} variations for ${entityId}`);
    }

    // Normalizácia pravdepodobností
    this.normalizeProbabilities(variations);

    // Vytvorenie grafu kompatibility
    const compatibilityGraph = this.buildCompatibilityGraph(variations, baseProfile);

    return {
      success: variations.length > 0,
      matrix: {
        entityId,
        baseProfile,
        variations,
        compatibilityGraph
      },
      rejectedCount,
      warnings
    };
  }

  private generateColorVariations(profile: LLMProfile, count: number): CompiledVariation[] {
    const variations: CompiledVariation[] = [];
    
    for (let i = 0; i < count; i++) {
      const shiftAmount = (i / count) * 0.3 - 0.15; // -15% až +15%
      
      variations.push({
        id: `${profile.name}_color_${i}`,
        modifications: {
          colorShift: {
            r: shiftAmount,
            g: shiftAmount * 0.8,
            b: shiftAmount * 1.2
          }
        },
        probability: 1 / count,
        conditions: []
      });
    }
    
    return variations;
  }

  private generateStructuralVariations(profile: LLMProfile, count: number): CompiledVariation[] {
    const variations: CompiledVariation[] = [];
    
    for (let i = 0; i < count; i++) {
      const scaleVar = 0.8 + (i / count) * 0.4; // 0.8x až 1.2x
      const rotationVar = (i / count) * Math.PI * 2;
      
      variations.push({
        id: `${profile.name}_struct_${i}`,
        modifications: {
          scale: new Vector3(scaleVar, scaleVar, scaleVar),
          rotation: rotationVar
        },
        probability: 1 / count,
        conditions: []
      });
    }
    
    return variations;
  }

  private generateBehaviorVariations(profile: LLMProfile, count: number): CompiledVariation[] {
    const variations: CompiledVariation[] = [];
    const behaviors = [
      'aggressive',
      'passive',
      'territorial',
      'migratory',
      'nocturnal',
      'social',
      'solitary',
      'predatory'
    ];
    
    for (let i = 0; i < Math.min(count, behaviors.length); i++) {
      variations.push({
        id: `${profile.name}_behavior_${i}`,
        modifications: {
          behaviorModifier: behaviors[i]
        },
        probability: 1 / count,
        conditions: [`time_of_day:${i % 2 === 0 ? 'day' : 'night'}`]
      });
    }
    
    return variations;
  }

  private generateTextureVariations(profile: LLMProfile, count: number): CompiledVariation[] {
    const variations: CompiledVariation[] = [];
    const hints = profile.visualStyle.textureHints;
    
    for (let i = 0; i < count; i++) {
      const hintIndex = i % hints.length;
      const variant = `${hints[hintIndex]}_v${i}`;
      
      variations.push({
        id: `${profile.name}_texture_${i}`,
        modifications: {
          textureVariant: variant
        },
        probability: 1 / count,
        conditions: []
      });
    }
    
    return variations;
  }

  private normalizeProbabilities(variations: CompiledVariation[]) {
    const total = variations.reduce((sum, v) => sum + v.probability, 0);
    for (const v of variations) {
      v.probability = v.probability / total;
    }
  }

  private buildCompatibilityGraph(
    variations: CompiledVariation[],
    profile: LLMProfile
  ): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    // Jednoduchá heuristika: farebné a štrukturálne variácie sú kompatibilné
    // behaviorálne môžu byť v konflikte
    const colorIds = variations.filter(v => v.id.includes('_color_')).map(v => v.id);
    const structIds = variations.filter(v => v.id.includes('_struct_')).map(v => v.id);
    const behaviorIds = variations.filter(v => v.id.includes('_behavior_')).map(v => v.id);
    
    for (const colorId of colorIds) {
      graph.set(colorId, [...structIds]);
    }
    
    for (const structId of structIds) {
      const compatible = [...colorIds];
      // Pridať behaviorálne okrem konfliktných
      const conflictingBehaviors = this.getConflictingBehaviors(behaviorIds);
      const safeBehaviors = behaviorIds.filter(b => !conflictingBehaviors.includes(b));
      graph.set(structId, [...compatible, ...safeBehaviors]);
    }
    
    return graph;
  }

  private getConflictingBehaviors(behaviorIds: string[]): string[] {
    // Príklad: 'aggressive' a 'passive' sú v konflikte
    return []; // Implementovať podľa potreby
  }

  /**
   * Vyberie najlepšiu variáciu na základe podmienok
   */
  selectBestVariation(
    matrix: VariationMatrix,
    context: {
      timeOfDay: 'day' | 'night';
      playerKarma: number;
      nearbyEntities: string[];
    }
  ): CompiledVariation | null {
    const validVariations = matrix.variations.filter(v => {
      return v.conditions.every(condition => {
        if (condition.startsWith('time_of_day:')) {
          const requiredTime = condition.split(':')[1];
          return requiredTime === context.timeOfDay;
        }
        // Pridať ďalšie podmienky podľa potreby
        return true;
      });
    });

    if (validVariations.length === 0) {
      return matrix.variations[0] || null;
    }

    // Výber podľa pravdepodobnosti
    const rand = Math.random();
    let cumulative = 0;
    
    for (const v of validVariations) {
      cumulative += v.probability;
      if (rand <= cumulative) {
        return v;
      }
    }
    
    return validVariations[validVariations.length - 1];
  }
}
