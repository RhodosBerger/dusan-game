// packages/server/src/models/SovereignNeuralMathResolver.ts

export interface NeuralMathResult {
  contested_multiplier: number;
  predicted_current_overload: number;
  dopamine_reward_scale: number;
  formula_current: number;
}

export class SovereignNeuralMathResolver {
  private static ML_URL = 'http://localhost:8000/api/ml/math/resolve';

  /**
   * Resolves complex gameplay mathematical outcomes using the Python Deep Learning service.
   * Gracefully falls back to exact formula calculations if the service is offline.
   */
  public static async resolveGameplayMath(
    voltage: number,
    current: number,
    resistance: number,
    entropy: number,
    playerHealth: number,
    npcHealth: number
  ): Promise<NeuralMathResult> {
    try {
      const response = await fetch(this.ML_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          voltage,
          current,
          resistance,
          entropy,
          player_health: playerHealth,
          npc_health: npcHealth
        })
      });

      if (response.ok) {
        const payload = (await response.json()) as any;
        if (payload && payload.status === 'SUCCESS' && payload.result) {
          return payload.result as NeuralMathResult;
        }
      }
    } catch (e: any) {
      console.warn('[NEURAL MATH FALLBACK] ML service unreachable, utilizing standard mathematical formula calculations.');
    }

    // Mathematical formula fallback calculations
    const formulaCurrent = voltage / Math.max(0.1, resistance);
    
    // Contested damage scaling factor based on health ratio delta
    const hpRatioDelta = (playerHealth / 15.0) - (npcHealth / 15.0);
    const contestedMultiplier = Math.max(0.1, Math.min(2.0, 1.0 + hpRatioDelta));

    // Current overload forecasting
    const predictedCurrentOverload = formulaCurrent * (1.0 + entropy);

    // Dopamine reward balance scale
    const dopamineRewardScale = Math.max(0.1, 1.5 - (playerHealth / 15.0));

    return {
      contested_multiplier: Number(contestedMultiplier.toFixed(3)),
      predicted_current_overload: Number(predictedCurrentOverload.toFixed(3)),
      dopamine_reward_scale: Number(dopamineRewardScale.toFixed(3)),
      formula_current: Number(formulaCurrent.toFixed(3))
    };
  }
}
