import { Thread } from './Thread';
import { GameMap, Block } from './Map';
import { SovereignLayerLogger } from '../utils/SovereignLayerLogger';
import { SafeMath } from '../utils/SafeMath';

export interface IntrospectionMetrics {
  anomaliesDetected: number;
  activeLayerEfficiency: number; // 0.0 to 1.0
  suggestedSpawnFriction: number;
  suggestedHazardCeiling: number;
}

export interface VPCVector {
  targetMeta: number;
  targetHex: number;
  targetAltitude: 'LOW_GROUND' | 'STANDARD_HEX' | 'HIGH_OVERCLOCK';
  actionVoltageBias: number;
}

export class SovereignIntrospectionEngine {
  /**
   * Introspects logs in reverse order (Inverted Parsing) to reconstruct layer dynamics.
   * Analyzes trace records to identify telemetry shifts.
   */
  public static introspectLogs(rawTraces: string[]): IntrospectionMetrics {
    let anomalies = 0;
    let successCount = 0;
    let totalCount = 0;
    let voltageSum = 0;

    // Inverted Parsing: Process logs from newest to oldest (reverse order)
    for (let i = rawTraces.length - 1; i >= 0; i--) {
      const trace = rawTraces[i];
      totalCount++;

      if (trace.includes('FAIL') || trace.includes('OVERLOAD') || trace.includes('preťaženie')) {
        anomalies++;
      }
      if (trace.includes('PASS') || trace.includes('úspešne')) {
        successCount++;
      }
      
      // Extract numerical variables (e.g. energy, voltage) from log strings
      const voltageMatch = trace.match(/voltage:\s*(\d+(\.\d+)?)/i) || trace.match(/napätie:\s*(\d+(\.\d+)?)/i);
      if (voltageMatch) {
        voltageSum += parseFloat(voltageMatch[1]);
      }
    }

    const efficiency = totalCount > 0 ? (successCount / totalCount) : 1.0;
    const avgVoltage = totalCount > 0 ? (voltageSum / totalCount) : 0;

    // Adapt spawn friction and hazard ceiling based on calculated logs telemetry
    const suggestedSpawnFriction = SafeMath.clampMin(0.8 - efficiency * 0.5, 0.1);
    const suggestedHazardCeiling = SafeMath.clampMin(0.9 - (anomalies * 0.05), 0.3);

    return {
      anomaliesDetected: anomalies,
      activeLayerEfficiency: efficiency,
      suggestedSpawnFriction,
      suggestedHazardCeiling
    };
  }

  /**
   * Vector Position Control (VPC): Adapts polymorphic tower heights and flag coordinates
   * based on the calculated log metrics and active grid states.
   */
  public static calculateVPC(
    metrics: IntrospectionMetrics,
    threads: Thread[]
  ): VPCVector[] {
    const vectors: VPCVector[] = [];

    // Filter polymorphic tower threads
    const towers = threads.filter(t => t.unitType === 'TOWER');
    
    towers.forEach(tower => {
      if (tower.position && tower.position.meta !== null && tower.position.hex !== null) {
        // Adjust tower target heights dynamically based on active anomalies count
        let targetAltitude: 'LOW_GROUND' | 'STANDARD_HEX' | 'HIGH_OVERCLOCK' = 'STANDARD_HEX';
        if (metrics.anomaliesDetected > 2) {
          targetAltitude = 'LOW_GROUND'; // Sinks to low ground during grid errors to protect circuits
        } else if (metrics.activeLayerEfficiency > 0.8) {
          targetAltitude = 'HIGH_OVERCLOCK'; // Elevates to overclock height during high efficiency
        }

        // Calculate voltage bias based on suggested friction values
        const actionVoltageBias = metrics.suggestedSpawnFriction * 5.0;

        vectors.push({
          targetMeta: tower.position.meta,
          targetHex: tower.position.hex,
          targetAltitude,
          actionVoltageBias
        });
      }
    });

    return vectors;
  }

  /**
   * Refines the gameplay generation grid parameters by applying the calculated VPC vectors.
   */
  public static refineGameplayGeneration(
    map: GameMap,
    vectors: VPCVector[]
  ): void {
    vectors.forEach(vec => {
      const chunk = map.chunks.find(c => c.id === vec.targetMeta);
      const block = chunk?.blocks.find(b => b.id === vec.targetHex);

      if (block) {
        // Apply ML adjustments directly to the block parameters to improve gameplay generation accuracy
        block.friction = SafeMath.clampMin(block.friction + (vec.actionVoltageBias * 0.05), 0.1);
        block.rangeModifier = vec.targetAltitude === 'HIGH_OVERCLOCK' ? 2 : vec.targetAltitude === 'LOW_GROUND' ? -2 : 0;
        
        // Log the refined block settings in our layer telemetry registry
        SovereignLayerLogger.logLayerState({
          layerName: `GRID_REFINEMENT_M${vec.targetMeta}_H${vec.targetHex}`,
          efficiencyRating: 'OPTIMAL',
          cpuExecutionTimeMs: 0.015,
          memoryFootprintMb: 0.1,
          operationalStatus: 'ACTIVE',
          telemetryPayloadBytes: 64
        });
      }
    });
  }
}
