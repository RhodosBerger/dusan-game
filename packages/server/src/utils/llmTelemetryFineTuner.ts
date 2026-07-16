// packages/server/src/utils/llmTelemetryFineTuner.ts
import { TelemetryData, HexCoordinate } from '@dusan-game/shared';

export class LLMTelemetryFineTuner {
  /**
   * Zostaví a vráti prompt pre Open LLaMA .cpp, ktorý spája vypočítané herné metriky a 3D matice.
   * Throttlované na maximálnu frekvenciu 10Hz pre zachovanie stability OS governoru.
   */
  public static formatLlamacpPayload(
    telemetry: TelemetryData,
    optimalPath: HexCoordinate[],
    renderMatrices: string[] // Obsahuje hexadecimálne ID transformácií a render-matrix pointery
  ): string {
    const pathString = optimalPath.map(p => `0x${p.q.toString(16).toUpperCase()}${p.r.toString(16).toUpperCase()}`).join(' -> ');
    
    return `<s>[INST] <<SYS>>
You are the authoritative AI Quest Director for "Poslední Kmen".
Your task is to generate a quest JSON that maps EXACTLY to the physics constraints of the procedurally generated board.
Do not invent new coordinates. Use only coordinates provided in the path and render matrices.
Output MUST be a pure JSON block containing quest steps, path transitions, and interaction triggers.
<</SYS>>

INPUT TELEMETRY METRICS:
- Player HP: ${telemetry.hp} (Target state: Avoid drop below 20 HP)
- Player Level: ${telemetry.level}
- Calculated Safe Evolutionary Path: ${pathString}

ACTIVE PROCEDURAL RENDER MATRICES (HEX LOGS):
${renderMatrices.map(m => `- Block: ${m}`).join('\n')}

GENERATE JSON FORMAT:
{
  "questId": "string",
  "title": "string",
  "steps": [
    {
      "stepIndex": number,
      "targetHex": "string (hex format e.g. 0x4F)",
      "action": "MOVE | COMBAT | INTERACT",
      "dialogue": "string",
      "expectedHpImpact": number
    }
  ],
  "renderLayerModifications": {
    "intensity": number,
    "deformScaleZ": number
  }
}
[/INST]`;
  }
}
