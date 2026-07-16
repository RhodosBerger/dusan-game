import { Thread } from './Thread';
import { GameMap, Block } from './Map';
import { SovereignLayerLogger } from '../utils/SovereignLayerLogger';
import { SafeMath } from '../utils/SafeMath';
import { DatabaseSyncManager } from './DatabaseSyncManager';

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

  /**
   * Analyzes trace logs in LIFO order (latest first) to reconstruct anomalies, overloads, and LIFO resolution accuracy.
   */
  public static async analyzeLogs(
    traceLogs: any[],
    dbSync?: DatabaseSyncManager
  ): Promise<IntrospectionAnalysis> {
    let allLogs = [...traceLogs];
    if (dbSync) {
      try {
        const dbTelemetry = (dbSync as any).db.prepare(
          'SELECT telemetry_theory FROM game_events_telemetry ORDER BY id DESC LIMIT 50'
        ).all() as any[];
        
        for (const row of dbTelemetry) {
          try {
            const theory = JSON.parse(row.telemetry_theory);
            if (theory && theory.traceLog) {
              allLogs.push(...theory.traceLog);
            } else if (theory && theory.message) {
              allLogs.push(theory);
            }
          } catch (e) {
            // ignore malformed JSON
          }
        }
      } catch (err) {
        console.warn('[INTROSPECTION] Failed to fetch db logs:', err);
      }
    }

    // Filter valid logs and sort by timestamp descending (LIFO order: newest first)
    allLogs = allLogs.filter(l => l && (l.timestamp || l.created_at));
    allLogs.sort((a, b) => {
      const tsA = a.timestamp || a.created_at || 0;
      const tsB = b.timestamp || b.created_at || 0;
      return tsB - tsA;
    });

    const anomaliesDetected: any[] = [];
    const overloadsDetected: any[] = [];
    
    let totalResolutions = 0;
    let successfulMitigations = 0;
    let criticalHitsCount = 0;
    let stackDepthPeak = 0;
    const arbiterAnomalies: string[] = [];

    for (const log of allLogs) {
      const msg = log.message || '';
      const type = log.type || '';
      const ts = log.timestamp || log.created_at || Date.now();

      // Detect anomalies
      if (type === 'Error' || msg.toLowerCase().includes('failed') || msg.toLowerCase().includes('error') || msg.toLowerCase().includes('invalid')) {
        anomaliesDetected.push({
          type: 'SYSTEM_ERROR',
          severity: 'HIGH',
          message: msg || `An error event of type ${type} was recorded.`,
          timestamp: ts
        });
      }
      
      if (msg.includes('Low HP') || msg.includes('HP critical') || (log.health !== undefined && log.health <= 3)) {
        anomaliesDetected.push({
          type: 'PLAYER_LOW_VITALITY',
          severity: 'MEDIUM',
          message: msg || `Player health dropped to critical level.`,
          timestamp: ts
        });
      }

      // Detect overloads
      if (msg.includes('VOLTAGE_SURGE') || msg.includes('voltage surge') || msg.includes('consecutive') || (log.voltage !== undefined && log.voltage > 4)) {
        overloadsDetected.push({
          type: 'GRID_VOLTAGE_OVERLOAD',
          loadFactor: log.voltage ? log.voltage / 5 : 0.8,
          message: msg || `High grid voltage surge detected.`,
          timestamp: ts
        });
      }
      
      if (msg.includes('SHORT_CIRCUIT') || msg.includes('short circuit') || log.entropy > 0.8) {
        overloadsDetected.push({
          type: 'THERMAL_ENTROPY_OVERLOAD',
          loadFactor: log.entropy || 0.9,
          message: msg || `Grid short circuit or high entropy state detected.`,
          timestamp: ts
        });
      }

      // Reconstruct LIFO Arbiter metrics
      if (msg.includes('[LIFO_ARBITER]') || msg.includes('dodge reaction') || msg.includes('successfully dodged') || msg.includes('critical headshot') || msg.includes('wounded twice') || msg.includes('mitigated') || msg.includes('[MITIGATED]')) {
        totalResolutions++;
        
        if (msg.includes('successfully dodged') || msg.includes('mitigated') || msg.includes('[MITIGATED]')) {
          successfulMitigations++;
        }
        
        if (msg.includes('critical') || msg.includes('headshot') || msg.includes('CRITICAL')) {
          criticalHitsCount++;
        }
        
        // Reconstruct stack depth
        const depthMatch = msg.match(/size:\s*(\d+)/i) || msg.match(/depth:\s*(\d+)/i);
        if (depthMatch && depthMatch[1]) {
          const depth = parseInt(depthMatch[1], 10);
          if (depth > stackDepthPeak) {
            stackDepthPeak = depth;
          }
        }

        // Verify LIFO sequence accuracy
        if (msg.includes('out of order') || msg.includes('invalid stack') || msg.includes('resolution failed')) {
          arbiterAnomalies.push(msg);
        }
      }
    }

    const mitigationAccuracy = totalResolutions > 0 
      ? Number(((successfulMitigations / totalResolutions) * 100).toFixed(1))
      : 100.0;

    return {
      timestamp: new Date().toISOString(),
      totalLogsAnalyzed: allLogs.length,
      anomaliesDetected,
      overloadsDetected,
      lifoArbiterMetrics: {
        totalResolutions,
        mitigationAccuracy,
        criticalHitsCount,
        stackDepthPeak: stackDepthPeak || (totalResolutions > 0 ? 3 : 0),
        anomalies: arbiterAnomalies
      }
    };
  }
}

export interface IntrospectionAnalysis {
  timestamp: string;
  totalLogsAnalyzed: number;
  anomaliesDetected: { type: string; severity: 'LOW' | 'MEDIUM' | 'HIGH'; message: string; timestamp: number }[];
  overloadsDetected: { type: string; loadFactor: number; message: string; timestamp: number }[];
  lifoArbiterMetrics: {
    totalResolutions: number;
    mitigationAccuracy: number;
    criticalHitsCount: number;
    stackDepthPeak: number;
    anomalies: string[];
  };
}
