// packages/server/src/models/TerrainTelemetryCoordinator.ts
import { SovereignEngine } from './SovereignEngine';
import { Thread } from './Thread';

export interface SectorDifficultyState {
  difficultyMultiplier: number;
  dopamineRewardMultiplier: number;
  combatIntensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface TerrainTextureMeta {
  chunkId: number;
  blockId: number;
  texturePattern: string; // Non-repeating texture signature
  colorVibrancy: number;
}

export interface TerrainTelemetryPayload {
  sectorId: number;
  difficulty: SectorDifficultyState;
  textures: TerrainTextureMeta[];
  directionalFlow: string; // Path suggestion for player progression
}

export class TerrainTelemetryCoordinator {
  /**
   * Evaluates player's recent telemetry to balance difficulty and rewards,
   * while procedurally generating non-repetitive textures across the 9 chunks.
   */
  static getTerrainTelemetry(engine: SovereignEngine, threadId: string): TerrainTelemetryPayload | null {
    const thread = engine.threads.find(t => t.id === threadId);
    if (!thread) return null;

    const pos = thread.position;
    const activeChunkId = pos.meta !== null ? pos.meta : 0;

    // 1. Dopamine Difficulty Balancing (DDB)
    // We adjust difficulty based on player health ratio and level
    const hpRatio = thread.health / thread.maxHealth;
    let difficultyMultiplier = 1.0;
    let dopamineRewardMultiplier = 1.0;
    let combatIntensity: SectorDifficultyState['combatIntensity'] = 'MEDIUM';

    if (hpRatio < 0.3) {
      // Player is struggling: lower difficulty to prevent frustration, but lower rewards slightly
      difficultyMultiplier = 0.75;
      dopamineRewardMultiplier = 0.9;
      combatIntensity = 'LOW';
    } else if (hpRatio > 0.8 && thread.level >= 3) {
      // Player is dominating: raise difficulty to keep it challenging, and raise rewards to trigger dopamine loop
      difficultyMultiplier = 1.25 + (thread.level * 0.05);
      dopamineRewardMultiplier = 1.5;
      combatIntensity = 'HIGH';
    } else if (hpRatio <= 0.5) {
      difficultyMultiplier = 1.0;
      dopamineRewardMultiplier = 1.1;
      combatIntensity = 'MEDIUM';
    } else {
      // Adrenaline Surge threshold
      difficultyMultiplier = 1.1;
      dopamineRewardMultiplier = 1.25;
      combatIntensity = 'MEDIUM';
    }

    // 2. Procedural Non-Repetitive Texture Generation
    // We generate a list of texture metadata for the active chunk and neighboring chunks
    const textures: TerrainTextureMeta[] = [];
    const textureSignatures = ['glitch_grid_noise', 'crystal_vein_specular', 'moss_dense_bump', 'void_particle_noise'];

    // Generate patterns for all blocks in the current sector chunk
    const chunk = engine.map.chunks.find(c => c.id === activeChunkId);
    if (chunk) {
      chunk.blocks.forEach((block) => {
        // Pseudo-random but deterministic texture pattern distribution based on coordinates
        // to prevent immediate visual repetition (looping) on adjacent blocks
        const seed = (activeChunkId * 7 + block.id) % textureSignatures.length;
        const nextSeed = (activeChunkId * 7 + block.id + 1) % textureSignatures.length;
        
        // Ensure adjacent patterns do not match
        const pattern = seed === nextSeed 
          ? textureSignatures[(seed + 1) % textureSignatures.length] 
          : textureSignatures[seed];

        textures.push({
          chunkId: activeChunkId,
          blockId: block.id,
          texturePattern: pattern,
          colorVibrancy: Math.min(1.0, 0.4 + (block.hazardIndex * 0.6))
        });
      });
    }

    // 3. Directional Flow Suggestion (where should player move next based on biome and difficulty)
    let nextSuggestedChunk = (activeChunkId + 1) % 9;
    // Avoid Void sectors if player has low health
    if (hpRatio < 0.4) {
      const safeChunk = engine.map.chunks.find(c => {
        const avgHazard = c.blocks.reduce((acc, b) => acc + b.hazardIndex, 0) / c.blocks.length;
        return avgHazard < 0.3 && c.id !== activeChunkId;
      });
      if (safeChunk) {
        nextSuggestedChunk = safeChunk.id;
      }
    }

    const directionFlow = `Recommend moving to Sector Chunk ${nextSuggestedChunk} to balance telemetry load.`;

    return {
      sectorId: activeChunkId,
      difficulty: {
        difficultyMultiplier: Number(difficultyMultiplier.toFixed(2)),
        dopamineRewardMultiplier: Number(dopamineRewardMultiplier.toFixed(2)),
        combatIntensity
      },
      textures,
      directionalFlow: directionFlow
    };
  }
}
