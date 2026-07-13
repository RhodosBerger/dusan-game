import templatesData from '../data/scenarioTemplates.json';

export interface KeyframeEvent {
  time: number;
  event: string;
  targetChunk: number;
  targetHex: number;
  projectedHeat: number;
  projectedDamage: number;
  isThrottled: boolean;
}

export interface SimulationTimeline {
  scenarioId: string;
  totalTime: number;
  resolvedFrequencyHz: number;
  timelineFrames: KeyframeEvent[];
  powerUtilizationPercent: number;
}

/**
 * Evaluates game action timelines, limiting frequency to fit GPU/TDP thermal constraints.
 */
export class SovereignKeyframeInterpreter {
  /**
   * Compiles scenario keyframe events and adjusts output frequency based on allocated power spikes.
   */
  public static evaluateSimulationTimeline(
    scenarioId: string,
    powerBudgetWatts: number // Limit to prevent OS governor frequency spikes
  ): SimulationTimeline {
    const template = templatesData.scenarios.find(s => s.id === scenarioId);
    if (!template) {
      return {
        scenarioId,
        totalTime: 0,
        resolvedFrequencyHz: 10,
        timelineFrames: [],
        powerUtilizationPercent: 0
      };
    }

    const baseFrequency = 60.0;
    // Lower power budget forces dynamic frequency throttling to save CPU cycles
    const resolvedFrequencyHz = powerBudgetWatts < 30 ? 20.0 : baseFrequency;
    const isThrottled = resolvedFrequencyHz < baseFrequency;

    const timelineFrames: KeyframeEvent[] = [];
    let accumulatedHeat = 0.0;

    // Build timeline events based on the scenario difficulty and map nodes
    template.nodeMappings.forEach((mapping, idx) => {
      const time = (idx * 0.25) / (template.difficulty * 0.5 + 1.0);
      
      // Calculate heat using Ohm's Law approximation
      const localVoltage = 5.0;
      const localResistance = Math.max(0.1, 2.5 - template.difficulty * 0.2);
      const currentI = localVoltage / localResistance;
      
      const heatSpike = currentI < 1.0 ? (1.0 - currentI) * 50.0 : 0.0;
      accumulatedHeat += heatSpike;

      // Project combat damage based on biome hazard factors
      const projectedDamage = Math.round(mapping.health * template.hazardFactor * (1.0 + idx * 0.1));

      timelineFrames.push({
        time,
        event: mapping.buildType,
        targetChunk: mapping.coordinates[0],
        targetHex: mapping.coordinates[1],
        projectedHeat: accumulatedHeat,
        projectedDamage,
        isThrottled
      });
    });

    const powerUtilizationPercent = Math.min(100.0, (timelineFrames.length * 15.0 / Math.max(10, powerBudgetWatts)) * 100);

    return {
      scenarioId,
      totalTime: timelineFrames.length > 0 ? timelineFrames[timelineFrames.length - 1].time : 0.0,
      resolvedFrequencyHz,
      timelineFrames,
      powerUtilizationPercent
    };
  }
}
