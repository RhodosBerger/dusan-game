export interface StatePayload {
  readonly action_type: "KINETIC_OVERRIDE";
  readonly actor_id: string;
  readonly target_id: string;
  readonly voltage_magnitude: number;
  readonly base_resistance: number;
  readonly target_lane: "A_BASE" | "A_AURA_RING" | "A_CENTER" | "A_OVERHEAD";
}

export interface EngineState {
  systemHeat: number;
  memoryIntegrity: number; // HP equivalent
  semanticErosion: number; // Damage equivalent
  memoryLeaks: number;     // Leaks / dot equivalent
}

export function executeKineticOverrideTransition(
  payload: StatePayload,
  state: EngineState
): EngineState {
  // Clamp resistance to prevent division by zero or infinite current spikes
  const clampedResistance = Math.max(0.1, payload.base_resistance);

  // Apply Ohm's Law: Current I = Voltage V / Resistance R
  const currentMagnitude = payload.voltage_magnitude / clampedResistance;

  let heatIncrement = 0;
  let semanticErosionApplied = 0;
  let targetZIndex = 0;

  // Resolve Z-Index Anchor mappings
  switch (payload.target_lane) {
    case "A_BASE":
      targetZIndex = 0;
      break;
    case "A_AURA_RING":
      targetZIndex = 5;
      break;
    case "A_CENTER":
      targetZIndex = 10;
      break;
    case "A_OVERHEAD":
      targetZIndex = 20;
      break;
  }

  // State Invariant Compliance Check
  if (currentMagnitude < 1.0) {
    // Current fail: direct conversion to systemHeat
    heatIncrement = (1.0 - currentMagnitude) * 50.0;
  } else {
    // Current success: target experiences Semantic Erosion proportional to current and target height coefficient
    semanticErosionApplied = currentMagnitude * (1.0 + targetZIndex * 0.1);
  }

  // Mutate state with saturation bounds
  const nextHeat = Math.min(200, state.systemHeat + heatIncrement);
  const nextSemanticErosion = state.semanticErosion + semanticErosionApplied;
  const nextMemoryIntegrity = Math.max(0.0, state.memoryIntegrity - semanticErosionApplied);

  // Check for Thermodynamic Purge condition
  const triggerPurge = nextHeat > 100;

  return {
    systemHeat: triggerPurge ? 0 : nextHeat, // Reset to zero on Thermodynamic Purge
    memoryIntegrity: triggerPurge ? Math.max(0, nextMemoryIntegrity - 25) : nextMemoryIntegrity, // Purge penalties
    semanticErosion: nextSemanticErosion,
    memoryLeaks: state.memoryLeaks + (triggerPurge ? 2 : 0) // Purging leaks registers
  };
}
