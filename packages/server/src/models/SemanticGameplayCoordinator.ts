// packages/server/src/models/SemanticGameplayCoordinator.ts
import { SovereignEngine } from './SovereignEngine';
import { Thread } from './Thread';
declare var require: any;
declare var process: any;
declare var __dirname: string;
const { execSync } = require('child_process');
const path = require('path');

export interface SemanticSectorPayload {
  player: {
    id: string;
    name: string;
    level: number;
  };
  block: {
    meta: number;
    hex: number;
    biome: string;
    temperature: number;
    humidity: number;
    hazardIndex: number;
    friction: number;
    conductivity: number;
  };
  spawnerPrediction: {
    predicted_hero_faction: string;
    confidence: number;
  };
  databaseQuest: {
    quest_id: string;
    title: string;
    prompt: string;
    target_material: string;
    required_amount: number;
    current_amount: number;
    remaining_amount: number;
  };
  dialogue: {
    archetype: string;
    quest_type: string;
    stage: string;
    generated_dialogue: string;
  };
}

export class SemanticGameplayCoordinator {
  static getSemanticSectorState(engine: SovereignEngine, threadId: string): SemanticSectorPayload | null {
    const thread = engine.threads.find(t => t.id === threadId);
    if (!thread) return null;

    const pos = thread.position;
    if (pos.meta === null || pos.hex === null) return null;

    const chunk = engine.map.chunks.find(c => c.id === pos.meta);
    const block = chunk?.blocks.find(b => b.id === pos.hex);
    if (!block) return null;

    const venvPython = path.join(__dirname, '../../.venv/bin/python3');

    const safeExecSyncJson = (command: string): any => {
      const raw = execSync(command).toString().trim();
      const jsonStart = raw.indexOf('{');
      const jsonEnd = raw.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error(`No JSON object found in output: ${raw}`);
      }
      return JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    };

    // 1. Get ML spawner prediction
    let spawnerPrediction = { predicted_hero_faction: 'crystal', confidence: 0.5 };
    try {
      const spawnerScript = path.join(__dirname, '../ml/hero_spawner_predictor.py');
      const spawnerPayload = JSON.stringify({
        meta: pos.meta,
        hex: pos.hex,
        perk_level: thread.level,
        temperature: block.temperature,
        humidity: block.humidity,
        hazardIndex: block.hazardIndex,
        friction: block.friction,
        conductivity: block.conductivity
      });
      const cmd = `"${venvPython}" "${spawnerScript}" '${spawnerPayload}'`;
      const output = safeExecSyncJson(cmd);
      if (output.status === 'SUCCESS') {
        spawnerPrediction = {
          predicted_hero_faction: output.predicted_hero_faction,
          confidence: output.confidence
        };
      }
    } catch (e) {
      console.warn('[COORDINATOR_WARN] Failed running spawner predictor script:', e);
    }

    // 2. Get DB quest prompt word problem
    let databaseQuest = {
      quest_id: 'q_crystal_forge',
      title: 'Aetheric Refinement',
      prompt: 'Solar Forge Master: Bring us Crystal Shards.',
      target_material: 'CrystalShard',
      required_amount: 10,
      current_amount: 0,
      remaining_amount: 10
    };
    try {
      const dbQuestScript = path.join(__dirname, '../ml/db_quest_generator.py');
      const category = spawnerPrediction.predicted_hero_faction === 'toxic' ? 'toxic' : 'crystal';
      const cmd = `"${venvPython}" "${dbQuestScript}" "${thread.name}" "${category}"`;
      const output = safeExecSyncJson(cmd);
      if (output.quest_id) {
        databaseQuest = {
          quest_id: output.quest_id,
          title: output.title,
          prompt: output.prompt,
          target_material: output.target_material,
          required_amount: output.required_amount,
          current_amount: output.current_amount,
          remaining_amount: output.remaining_amount
        };
      }
    } catch (e) {
      console.warn('[COORDINATOR_WARN] Failed running db quest generator script:', e);
    }

    // 3. Get LLM-like dialogue templates
    let dialogue = {
      archetype: 'AETHER_SPELLWEAVER',
      quest_type: 'FetchQuest',
      stage: 'INTRO',
      generated_dialogue: 'Greetings.'
    };
    try {
      const dialogueScript = path.join(__dirname, '../ml/dialogue_generator.py');
      
      let archetype = 'AETHER_SPELLWEAVER';
      if (spawnerPrediction.predicted_hero_faction === 'crystal') archetype = 'AETHER_SPELLWEAVER';
      else if (spawnerPrediction.predicted_hero_faction === 'toxic') archetype = 'VOID_WALKER';
      else if (spawnerPrediction.predicted_hero_faction === 'void') archetype = 'VOID_WALKER';
      else if (spawnerPrediction.predicted_hero_faction === 'druid') archetype = 'SWIFT_HARBINGER';

      const questType = 'FetchQuest';
      const stage = thread.quests.some(q => q.completed) ? 'COMPLETED' : 'INTRO';

      const cmd = `"${venvPython}" "${dialogueScript}" "${archetype}" "${questType}" "${stage}"`;
      const output = safeExecSyncJson(cmd);
      if (output.status === 'SUCCESS') {
        dialogue = {
          archetype,
          quest_type: questType,
          stage,
          generated_dialogue: output.generated_dialogue
        };
      }
    } catch (e) {
      console.warn('[COORDINATOR_WARN] Failed running dialogue generator script:', e);
    }

    return {
      player: {
        id: thread.id,
        name: thread.name,
        level: thread.level
      },
      block: {
        meta: pos.meta,
        hex: pos.hex,
        biome: block.biome,
        temperature: block.temperature,
        humidity: block.humidity,
        hazardIndex: block.hazardIndex,
        friction: block.friction,
        conductivity: block.conductivity
      },
      spawnerPrediction,
      databaseQuest,
      dialogue
    };
  }
}
