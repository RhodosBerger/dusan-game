/**
 * Augmented Reality Mesh Generator
 * 
 * Generuje AR bloky s loop pointami, ktoré spájajú horizonty a meshe do objektov.
 * Tieto bloky sa správajú podľa definovaných vzorov a interagujú s okolím.
 */

import { Vector3, Mesh, Geometry, Material } from 'three';
import { LLMProfile } from '../llm/LLMProfileGenerator';
import { CompiledVariation } from '../compiler/VariationCompilerEngine';

export interface ARMeshBlock {
  id: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  geometry: Geometry;
  material: Material;
  loopPoint: LoopPoint;
  interactionRules: InteractionRule[];
  profile: LLMProfile;
  variation?: CompiledVariation;
}

export interface LoopPoint {
  id: string;
  type: 'SCENARIO' | 'TRANSITION' | 'EVENT' | 'PUZZLE';
  triggerCondition: string;
  actions: LoopAction[];
  nextPoints: string[]; // ID ďalších loop pointov
  priority: number;
}

export interface LoopAction {
  type: 'SPAWN' | 'TRANSFORM' | 'DIALOGUE' | 'QUEST' | 'ENVIRONMENT_CHANGE';
  target?: string;
  parameters: Record<string, any>;
}

export interface InteractionRule {
  condition: string;
  response: string;
  priority: number;
}

export class ARMeshGenerator {
  private blocks: Map<string, ARMeshBlock> = new Map();
  private loopPoints: Map<string, LoopPoint> = new Map();
  private horizonConnections: Map<string, string[]> = new Map();

  /**
   * Vygeneruje AR mesh blok s loop pointom
   */
  generateBlock(
    id: string,
    position: Vector3,
    profile: LLMProfile,
    variation?: CompiledVariation
  ): ARMeshBlock {
    // Aplikácia variácií na profil
    const finalProfile = variation ? this.applyVariation(profile, variation) : profile;

    // Vytvorenie geometrie podľa archetype
    const geometry = this.createGeometryByArchetype(finalProfile.visualStyle.shapeArchetype);
    
    // Vytvorenie materiálu podľa farieb
    const material = this.createMaterialFromProfile(finalProfile);

    // Generovanie loop pointu
    const loopPoint = this.generateLoopPoint(id, finalProfile);

    // Generovanie interakčných pravidiel
    const interactionRules = this.generateInteractionRules(finalProfile);

    const block: ARMeshBlock = {
      id,
      position,
      rotation: new Vector3(0, variation?.modifications.rotation || 0, 0),
      scale: variation?.modifications.scale || new Vector3(1, 1, 1),
      geometry,
      material,
      loopPoint,
      interactionRules,
      profile: finalProfile,
      variation
    };

    // Uloženie
    this.blocks.set(id, block);
    this.loopPoints.set(loopPoint.id, loopPoint);

    return block;
  }

  /**
   * Spojí dva horizonty (bloky) dohromady
   */
  connectHorizons(blockId1: string, blockId2: string, connectionType: string): boolean {
    const block1 = this.blocks.get(blockId1);
    const block2 = this.blocks.get(blockId2);

    if (!block1 || !block2) {
      return false;
    }

    // Vytvorenie spojenia
    const existing = this.horizonConnections.get(blockId1) || [];
    if (!existing.includes(blockId2)) {
      existing.push(blockId2);
      this.horizonConnections.set(blockId1, existing);
    }

    // Opačné smerovanie
    const existingReverse = this.horizonConnections.get(blockId2) || [];
    if (!existingReverse.includes(blockId1)) {
      existingReverse.push(blockId1);
      this.horizonConnections.set(blockId2, existingReverse);
    }

    // Aktualizácia loop pointov
    this.linkLoopPoints(block1.loopPoint, block2.loopPoint, connectionType);

    return true;
  }

  /**
   * Spracuje interakciu hráča s blokom
   */
  handleInteraction(blockId: string, playerContext: {
    karma: number;
    inventory: string[];
    questState: Record<string, any>;
  }): LoopAction[] {
    const block = this.blocks.get(blockId);
    if (!block) return [];

    const triggeredActions: LoopAction[] = [];

    // Kontrola interakčných pravidiel
    for (const rule of block.interactionRules) {
      if (this.evaluateCondition(rule.condition, playerContext)) {
        // Našli sme matching pravidlo
        const action = this createActionFromResponse(rule.response, block);
        if (action) {
          triggeredActions.push(action);
        }
      }
    }

    // Kontrola loop point triggerov
    if (this.evaluateCondition(block.loopPoint.triggerCondition, playerContext)) {
      triggeredActions.push(...block.loopPoint.actions);
      
      // Aktivácia ďalších loop pointov
      for (const nextId of block.loopPoint.nextPoints) {
        const nextPoint = this.loopPoints.get(nextId);
        if (nextPoint) {
          triggeredActions.push(...nextPoint.actions);
        }
      }
    }

    return triggeredActions;
  }

  private createGeometryByArchetype(archetype: 'ORGANIC' | 'GEOMETRIC' | 'ABSTRACT' | 'HYBRID'): Geometry {
    // Simulácia - v reálnej implementácii by boli skutočné Three.js geometrie
    switch (archetype) {
      case 'ORGANIC':
        return { type: 'sphere', complexity: 'high' } as any;
      case 'GEOMETRIC':
        return { type: 'box', complexity: 'low' } as any;
      case 'ABSTRACT':
        return { type: 'torus', complexity: 'medium' } as any;
      case 'HYBRID':
        return { type: 'icosahedron', complexity: 'high' } as any;
    }
  }

  private createMaterialFromProfile(profile: LLMProfile): Material {
    // Simulácia materiálu
    return {
      color: profile.visualStyle.primaryColor,
      emissive: profile.visualStyle.secondaryColor,
      transparent: true,
      opacity: 0.9
    } as any;
  }

  private generateLoopPoint(blockId: string, profile: LLMProfile): LoopPoint {
    const types: LoopPoint['type'][] = ['SCENARIO', 'TRANSITION', 'EVENT', 'PUZZLE'];
    const type = types[Math.floor(Math.random() * types.length)];

    return {
      id: `lp_${blockId}_${Date.now()}`,
      type,
      triggerCondition: this.generateTriggerCondition(type, profile),
      actions: this.generateLoopActions(type, profile),
      nextPoints: [],
      priority: Math.floor(Math.random() * 10)
    };
  }

  private generateTriggerCondition(type: LoopPoint['type'], profile: LLMProfile): string {
    switch (type) {
      case 'SCENARIO':
        return 'player_distance < 5';
      case 'TRANSITION':
        return 'quest_complete == true';
      case 'EVENT':
        return 'time_of_day == "night" && karma > 50';
      case 'PUZZLE':
        return 'inventory_has("key") == true';
      default:
        return 'always';
    }
  }

  private generateLoopActions(type: LoopPoint['type'], profile: LLMProfile): LoopAction[] {
    const actions: LoopAction[] = [];

    switch (type) {
      case 'SCENARIO':
        actions.push({
          type: 'DIALOGUE',
          parameters: { text: `You encounter ${profile.name}`, speaker: profile.name }
        });
        break;
      case 'TRANSITION':
        actions.push({
          type: 'ENVIRONMENT_CHANGE',
          parameters: { lighting: 'dramatic', fog: 'dense' }
        });
        break;
      case 'EVENT':
        actions.push({
          type: 'SPAWN',
          target: 'enemy',
          parameters: { count: 3, type: profile.visualStyle.shapeArchetype }
        });
        break;
      case 'PUZZLE':
        actions.push({
          type: 'QUEST',
          parameters: { questId: `puzzle_${profile.name}`, objective: 'activate_crystals' }
        });
        break;
    }

    return actions;
  }

  private generateInteractionRules(profile: LLMProfile): InteractionRule[] {
    return [
      {
        condition: 'player_karma > 70',
        response: 'friendly_greeting',
        priority: 1
      },
      {
        condition: 'player_karma < 30',
        response: 'hostile_warning',
        priority: 1
      },
      {
        condition: 'has_item("artifact")',
        response: 'special_interaction',
        priority: 2
      }
    ];
  }

  private applyVariation(profile: LLMProfile, variation: CompiledVariation): LLMProfile {
    const modified = { ...profile };
    
    if (variation.modifications.colorShift) {
      // Aplikovať farebný posun (simulované)
      modified.visualStyle = { ...modified.visualStyle };
    }
    
    return modified;
  }

  private linkLoopPoints(lp1: LoopPoint, lp2: LoopPoint, connectionType: string) {
    lp1.nextPoints.push(lp2.id);
    // Obojsmerné pre určité typy
    if (connectionType === 'bidirectional') {
      lp2.nextPoints.push(lp1.id);
    }
  }

  private evaluateCondition(condition: string, context: any): boolean {
    // Jednoduchý evaluator podmienok
    // V produkcii by bol sofistikovanejší
    if (condition === 'always') return true;
    if (condition.startsWith('player_distance')) {
      return true; // Simulácia
    }
    if (condition.startsWith('karma')) {
      const parts = condition.split(/([<>])/);
      if (parts.length === 3) {
        const value = parseFloat(parts[2]);
        const op = parts[1];
        if (op === '>' && context.karma > value) return true;
        if (op === '<' && context.karma < value) return true;
      }
    }
    return false;
  }

  private createActionFromResponse(response: string, block: ARMeshBlock): LoopAction | null {
    switch (response) {
      case 'friendly_greeting':
        return {
          type: 'DIALOGUE',
          parameters: { text: 'Greetings, traveler!', mood: 'friendly' }
        };
      case 'hostile_warning':
        return {
          type: 'DIALOGUE',
          parameters: { text: 'You are not welcome here.', mood: 'hostile' }
        };
      case 'special_interaction':
        return {
          type: 'QUEST',
          parameters: { questId: `special_${block.id}`, reward: 'rare_item' }
        };
      default:
        return null;
    }
  }

  getBlock(id: string): ARMeshBlock | undefined {
    return this.blocks.get(id);
  }

  getAllBlocks(): ARMeshBlock[] {
    return Array.from(this.blocks.values());
  }

  getLoopPoint(id: string): LoopPoint | undefined {
    return this.loopPoints.get(id);
  }
}
