// packages/server/src/models/TacticalGenerativeCoordinator.ts
import { SovereignEngine } from './SovereignEngine';
import { Thread } from './Thread';
declare var require: any;
declare var process: any;
declare var __dirname: string;
const { execFile } = require('child_process');
const fs = require('fs');
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
  static async generateTacticalInstance(
    engine: SovereignEngine, 
    threadId: string, 
    tacticPrompt: string
  ): Promise<TacticalSpawnPayload> {
    const thread = engine.threads.find(t => t.id === threadId);
    
    const playerLvl = thread ? thread.level : 1;
    const playerHp = thread ? thread.health : 15;
    const pos = thread ? thread.position : { meta: 0, hex: 1 };
    
    const chunk = engine.map.chunks.find(c => c.id === pos.meta);
    const block = chunk?.blocks.find(b => b.id === pos.hex);
    const biome = block ? block.biome : 'LUSH_FOREST';

    const venvUnix = path.join(__dirname, '../../.venv/bin/python3');
    const venvWin = path.join(__dirname, '../../.venv/Scripts/python.exe');
    const venvPython = fs.existsSync(venvWin) ? venvWin : (fs.existsSync(venvUnix) ? venvUnix : 'python');
    const spawnerScript = path.join(__dirname, '../ml/tactical_spawner.py');

    const runSpawnerAsync = (args: string[]): Promise<any> => {
      return new Promise((resolve, reject) => {
        execFile(venvPython, [spawnerScript, ...args], (error: any, stdout: string) => {
          if (error) {
            reject(error);
            return;
          }
          try {
            const raw = stdout.trim();
            const jsonStart = raw.indexOf('{');
            const jsonEnd = raw.lastIndexOf('}');
            if (jsonStart === -1 || jsonEnd === -1) {
              reject(new Error(`No JSON object found in output: ${raw}`));
              return;
            }
            resolve(JSON.parse(raw.slice(jsonStart, jsonEnd + 1)));
          } catch (e) {
            reject(e);
          }
        });
      });
    };

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), 2500);
    });

    try {
      const payload = JSON.stringify({
        tactic_prompt: tacticPrompt,
        player_level: playerLvl,
        player_health: playerHp,
        biome: biome
      });

      const output = await Promise.race([
        runSpawnerAsync([payload]),
        timeoutPromise
      ]);

      if (output.status === 'SUCCESS') {
        if (thread) {
          const spawnChunk = engine.map.chunks.find(c => c.id === output.coordinates.meta);
          const spawnBlock = spawnChunk?.blocks.find(b => b.id === output.coordinates.hex);
          if (spawnBlock) {
            spawnBlock.hasChest = true;
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

    return {
      actionType: 'spawn_decoy',
      coordinates: { meta: 0, hex: 3 },
      powerRating: 1.0,
      description: 'Fallback tactical spawn generated due to pipeline latency.',
      success: false
    };
  }
}
