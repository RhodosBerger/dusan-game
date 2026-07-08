// path: packages/shared/src/core/OhmGridEvaluator.ts

export interface GridSectorState {
  sectorId: string;
  voltage: number;       // V
  resistance: number;    // R (in Ohms)
  systemEntropy: number; // Linked to OpenVINO fatigue/defect telemetry
  isShortCircuited: boolean;
}

export interface WaveCollapseMetrics {
  spawnDensity: number;
  dominantArchetype: 'BURST_DAMAGE' | 'DEFENSIVE_TURRET' | 'FAST_MOVER';
  triggerWave: boolean;
}

export class OhmGridEvaluator {
  private static readonly CRITICAL_CURRENT_THRESHOLD = 8.0; // 8.0 Amperes

  /**
   * Calculates current grid stress based on live electrical and telemetry states
   */
  public static evaluateSectorStress(sector: GridSectorState): { current: number; shortCircuitTriggered: boolean } {
    if (sector.resistance <= 0) return { current: 0, shortCircuitTriggered: false };

    // Ohm's Law: I = V / R
    let current = sector.voltage / sector.resistance;

    // OpenVINO fatigue or defect anomalies artificially scale up the systemic stress
    if (sector.systemEntropy > 0.7) {
      current *= (1 + (sector.systemEntropy - 0.7)); 
    }

    const shortCircuitTriggered = current > this.CRITICAL_CURRENT_THRESHOLD;

    return {
      current: parseFloat(current.toFixed(2)),
      shortCircuitTriggered: shortCircuitTriggered || sector.isShortCircuited
    };
  }

  /**
   * Translates real-time combat analytics (K-Means) into immediate wave spawning metrics
   */
  public static calculateWaveCollapse(
    entropy: number, 
    playerArchetype: 'BURST_DAMAGE' | 'DEFENSIVE_TURRET' | 'FAST_MOVER'
  ): WaveCollapseMetrics {
    const baseDensity = entropy * 1.5;
    
    return {
      spawnDensity: parseFloat(baseDensity.toFixed(2)),
      dominantArchetype: playerArchetype,
      triggerWave: baseDensity > 2.5
    };
  }
}
