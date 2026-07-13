import { BiomeEngine } from './BiomeEngine';
import { MLTerrainSynthesizer } from './MLTerrainSynthesizer';
import { SovereignElementorRegistry, GameWidgetInstance } from './SovereignElementorRegistry';
import { SovereignEffectSequencer, RenderedFrameOutput } from './SovereignEffectSequencer';

export interface GeneratedNode {
  macroIndex: number;
  subIndex: number;
  biome: string;
  friction: number;
  hazardIndex: number;
  walkable: boolean;
}

export interface SelfGeneratedScenario {
  scenarioKey: string;
  terrainNodes: GeneratedNode[];
  widgets: GameWidgetInstance[];
  renders: RenderedFrameOutput[];
  htmlEntities: { [coord: string]: string };
}

/**
 * Orchestrator combining ML Synthesizers, Widget Registries, Effect Sequencers, and HTML Entity builders
 * into a single self-generating pipeline.
 */
export class SovereignGenerativeOrchestrator {
  /**
   * Automates the generation of a complete game scenario layout based on input coordinates.
   */
  public static generate(scenarioKey: string, coordinates: { meta: number; hex: number }[]): SelfGeneratedScenario {
    const terrainNodes: GeneratedNode[] = [];
    const widgets: GameWidgetInstance[] = [];
    const renders: RenderedFrameOutput[] = [];
    const htmlEntities: { [coord: string]: string } = {};

    for (const coord of coordinates) {
      // 1. Synthesize block using ML terrain models
      const biomeInfo = BiomeEngine.getBiomeForHex(coord.meta, coord.hex);
      const mlInfo = MLTerrainSynthesizer.synthesizeBlock(coord.meta, coord.hex);

      terrainNodes.push({
        macroIndex: coord.meta,
        subIndex: coord.hex,
        biome: biomeInfo.biome,
        friction: mlInfo.energyCostMultiplier || 0.5,
        hazardIndex: mlInfo.hazardIndex || 0.1,
        walkable: mlInfo.walkable
      });

      // 2. Select and instantiate Elementor widgets based on biome characteristics
      let widgetId = 'w_holo_card'; // Default card
      if (biomeInfo.biome === 'TOXIC_SWAMP') {
        widgetId = 'w_accordion_hex';
      } else if (biomeInfo.biome === 'GLACIER') {
        widgetId = 'w_alert_plate';
      } else if (mlInfo.hazardIndex > 0.5) {
        widgetId = 'w_shield_overload';
      }

      const coordStr = `0x${coord.meta.toString(16).toUpperCase()}${coord.hex.toString(16).toUpperCase()}`;
      const inst = SovereignElementorRegistry.instantiateWidget(widgetId, coordStr, {
        hazardIndex: mlInfo.hazardIndex,
        friction: mlInfo.energyCostMultiplier,
        walkable: mlInfo.walkable
      });
      widgets.push(inst);

      // 3. Process rendering filters (Bloom / Charcoal overlay)
      const filterId = mlInfo.hazardIndex > 0.6 ? 'f_charcoal_overlay' : 'f_cyber_glow';
      const renderedFrame = SovereignEffectSequencer.processFrame(
        widgetId === 'w_accordion_hex' ? 'v_hexagon_grid' : 'r_scorched_dirt',
        filterId,
        0.8
      );
      renders.push(renderedFrame);

      // 4. Translate coordinate string into safe HTML5 entities
      let entitiesStr = '';
      for (let i = 0; i < coordStr.length; i++) {
        entitiesStr += `&#${coordStr.charCodeAt(i)};`;
      }
      htmlEntities[coordStr] = entitiesStr;
    }

    return {
      scenarioKey,
      terrainNodes,
      widgets,
      renders,
      htmlEntities
    };
  }
}
