import * as fs from 'fs';
import * as path from 'path';

export interface TelemetryTrainingPair {
    prompt: string;
    completion: string;
}

export class LLMTelemetryFineTuner {
    private static readonly OUTPUT_PATH = '/home/rhoddos_berger/.gemini/antigravity-ide/brain/5dc44846-71ce-4eba-b088-0fc0f765e6a8/scratch/fine_tuning_telemetry.jsonl';

    /**
     * Appends a telemetry state transition to the JSON-L fine-tuning dataset
     */
    public static async logStateTransition(
        state: any,
        action: any,
        comboTrigger: string
    ): Promise<void> {
        try {
            // 1. Build prompt string describing the gameplay context and played metrics
            const playedCards = action.cardId || 'UNKNOWN_CARD';
            const prompt = `System Telemetry context: entropy_ratio=${(state.systemEnergy / 100).toFixed(2)}, ` +
                `played_voltage=${action.voltage.toFixed(2)}, played_resistance=${action.resistance.toFixed(2)}, ` +
                `played_card=${playedCards}. Task: Predict next state anomalies and recommend balance modifications.`;

            // 2. Build the target metacognitive response reflecting victory/collapse rules
            let recommendation = `Triggered combo: ${comboTrigger}. `;
            if (comboTrigger === 'VOLTAGE_SURGE') {
                recommendation += `Recommendation: Increase Voltage Resistance threshold. Set target card ${playedCards} cost multiplier to 1.10.`;
            } else if (comboTrigger === 'SHORT_CIRCUIT') {
                recommendation += `Recommendation: Decrease hex tile conductivity. Increase energy cost of ${playedCards} by 10 points.`;
            } else {
                recommendation += `Recommendation: Keep active parameters. Balance is nominal.`;
            }

            const payload: TelemetryTrainingPair = {
                prompt,
                completion: recommendation
            };

            // 3. Ensure parent directories exist
            const dir = path.dirname(this.OUTPUT_PATH);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // 4. Append line to JSON-L dataset file
            fs.appendFileSync(this.OUTPUT_PATH, JSON.stringify(payload) + '\n', 'utf-8');
            console.log(`[LLM_TUNER] Telemetry transition logged to ${this.OUTPUT_PATH}`);
        } catch (e) {
            console.error('[LLM_TUNER] Failed to log telemetry data:', e);
        }
    }
}
