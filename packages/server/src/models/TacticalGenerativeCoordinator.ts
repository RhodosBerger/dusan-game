// packages/server/src/models/TacticalGenerativeCoordinator.ts
import { SovereignEngine } from './SovereignEngine';
import { Thread } from './Thread';
declare var require: any;
declare var process: any;
declare var __dirname: string;
const { execSync } = require('child_process');
const path = require('path');

export interface TacticalSpawnPayload {
  actionType: string;
  coordinates: {
    meta: number;
    hex: number;
  };
  powerRating: number;
  description: string;
  success: boolean;
}

export class TacticalGenerativeCoordinator {
  static generateTacticalInstance(
    engine: SovereignEngine, 
    threadId: string, 
    tacticPrompt: string
  ): TacticalSpawnPayload {
    const thread = engine.threads.find(t => t.id === threadId);
    
    // Default values if thread is missing
    const playerLvl = thread ? thread.level : 1;
    const playerHp = thread ? thread.health : 15;
    const pos = thread ? thread.position : { meta: 0, hex: 1 };
    
    const chunk = engine.map.chunks.find(c => c.id === pos.meta);
    const block = chunk?.blocks.find(b => b.id === pos.hex);
    const biome = block ? block.biome : 'LUSH_FOREST';

    const venvPython = path.join(__dirname, '../../.venv/bin/python3');
    const spawnerScript = path.join(__dirname, '../ml/tactical_spawner.py');

    const safeExecSyncJson = (command: string): any => {
      const raw = execSync(command).toString().trim();
      const jsonStart = raw.indexOf('{');
      const jsonEnd = raw.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error(`No JSON object found in output: ${raw}`);
      }
      return JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    };

    try {
      const payload = JSON.stringify({
        tactic_prompt: tacticPrompt,
        player_level: playerLvl,
        player_health: playerHp,
        biome: biome
      });

      const cmd = `"${venvPython}" "${spawnerScript}" '${payload}'`;
      const output = safeExecSyncJson(cmd);

      if (output.status === 'SUCCESS') {
        // Register the spawned object in the actual engine game board map!
        if (thread) {
          const spawnChunk = engine.map.chunks.find(c => c.id === output.coordinates.meta);
          const spawnBlock = spawnChunk?.blocks.find(b => b.id === output.coordinates.hex);
          if (spawnBlock) {
            spawnBlock.hasChest = true; // Mark as containing a generated chest/trap item
          }
        }

        return {
          actionType: output.actionType,
          coordinates: output.coordinates,
          powerRating: output.powerRating,
          description: output.description,
          success: true
        };
      }
    } catch (e) {
      console.warn('[GENERATOR_WARN] Failed running tactical spawner script:', e);
    }

    // Fallback safe tactical spawn
    return {
      actionType: 'spawn_decoy',
      coordinates: { meta: 0, hex: 3 },
      powerRating: 1.0,
      description: 'Fallback tactical spawn generated due to pipeline latency.',
      success: false
    };
  }
}
