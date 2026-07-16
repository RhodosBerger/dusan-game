import { BiomeEngine, MLTerrainSynthesizer } from '@dusan-game/shared';
declare var require: any;
declare var process: any;
const fs = require('fs');
const path = require('path');

const GO_CORE_URL = (typeof process !== 'undefined' && process.env && process.env.GO_CORE_URL) || 'http://localhost:8081';

function getAdjustmentFactor(): number {
  try {
    const weightsPath = '/home/rhoddos_berger/.gemini/antigravity-ide/brain/5dc44846-71ce-4eba-b088-0fc0f765e6a8/scratch/optimized_weights.json';
    if (fs.existsSync(weightsPath)) {
      const data = JSON.parse(fs.readFileSync(weightsPath, 'utf8'));
      if (data.metadata && typeof data.metadata.adjustment_factor === 'number') {
        return data.metadata.adjustment_factor;
      }
    }
  } catch (e) {
    // Fallback
  }
  return 1.0;
}

export interface Block {
  id: number; // 0-6
  threadId: string | null;
  biome: string;
  temperature: number;
  humidity: number;
  color: string;
  friction: number;
  conductivity: number;
  
  // ML Synthesized properties
  colorSaturation: number;
  textureDensity: number;
  lightEmission: number;
  contrastRatio: number;
  particleRate: number;
  
  walkable: boolean;
  energyCostMultiplier: number;
  rangeModifier: number;
  hazardIndex: number;
  lootProbability: number;
  hasChest?: boolean;
  isTown?: boolean;
  hasTrap?: 'ROOT_TRAP' | 'EMP_MINE' | 'STATIC_CHARGE_TRAP' | null;
  trapOwnerId?: string | null;
  hasOpportunity?: 'SURGE_NODE' | 'VOID_RIFT' | 'REPAIR_KIT' | null;
  collapseInTurns?: number;
}

export interface Chunk {
  id: number; // 0-8 (macro chunks)
  blocks: Block[];
}

export class GameMap {
  chunks: Chunk[];

  constructor() {
    this.chunks = [];
    const factor = getAdjustmentFactor();
    for (let i = 0; i < 9; i++) {
      const blocks: Block[] = [];
      for (let j = 0; j < 7; j++) {
        const biomeInfo = BiomeEngine.getBiomeForHex(i, j);
        const mlInfo = MLTerrainSynthesizer.synthesizeBlock(i, j);
        blocks.push({
          id: j,
          threadId: null,
          biome: biomeInfo.biome,
          temperature: biomeInfo.temperature,
          humidity: biomeInfo.humidity,
          color: biomeInfo.color,
          friction: biomeInfo.physics.friction,
          conductivity: biomeInfo.physics.conductivity,
          
          colorSaturation: mlInfo.colorSaturation,
          textureDensity: mlInfo.textureDensity,
          lightEmission: mlInfo.lightEmission,
          contrastRatio: mlInfo.contrastRatio,
          particleRate: mlInfo.particleRate,
          
          walkable: true,
          energyCostMultiplier: mlInfo.energyCostMultiplier * factor,
          rangeModifier: mlInfo.rangeModifier,
          hazardIndex: (i === 0 && j === 0) ? 0 : mlInfo.hazardIndex * factor,
          lootProbability: mlInfo.lootProbability,
          hasChest: false,
          isTown: (i === 0 && j === 0),
          hasTrap: null,
          trapOwnerId: null,
          hasOpportunity: null
        });
      }
      this.chunks.push({ id: i, blocks });
    }
  }

  async initializeWithGoCore(): Promise<boolean> {
    try {
      const blocksToSynthesize = [];
      for (const chunk of this.chunks) {
        for (const block of chunk.blocks) {
          blocksToSynthesize.push({ metaId: chunk.id, hexId: block.id });
        }
      }

      const response = await fetch(`${GO_CORE_URL}/api/synthesize/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks: blocksToSynthesize })
      });

      if (response.ok) {
        const results = await response.json() as any[];
        const factor = getAdjustmentFactor();
        for (const data of results) {
          const chunk = this.chunks.find(c => c.id === data.metaId);
          const block = chunk?.blocks.find(b => b.id === data.hexId);
          if (block) {
            block.biome = data.biome;
            block.temperature = data.temperature;
            block.humidity = data.humidity;
            block.color = data.color;
            block.friction = data.friction;
            block.conductivity = data.conductivity;
            
            block.colorSaturation = data.colorSaturation;
            block.textureDensity = data.textureDensity;
            block.lightEmission = data.lightEmission;
            block.contrastRatio = data.contrastRatio;
            block.particleRate = data.particleRate;
            
            if (data.metaId === 0 && data.hexId === 0) {
              block.walkable = true;
              block.hazardIndex = 0;
            } else {
              block.walkable = true;
              block.hazardIndex = data.hazardIndex * factor;
            }
            block.energyCostMultiplier = data.energyCostMultiplier * factor;
            block.rangeModifier = data.rangeModifier;
            block.lootProbability = data.lootProbability;
          }
        }
        console.log("[GO_CORE] Úspešne inicializované arénové bloky cez Go Core BATCH API.");
        return true;
      }
      return false;
    } catch (e) {
      console.log("[GO_CORE_FALLBACK] Go Core mikroslužba nie je spustená (Go Core port 8081 nedostupný). Používam zabudovaný TS Biome/ML fallback.");
      return false;
    }
  }

  placeThread(threadId: string, chunkId: number, blockId: number): boolean {
    const chunk = this.chunks.find(c => c.id === chunkId);
    if (!chunk) return false;

    const block = chunk.blocks.find(b => b.id === blockId);
    if (!block || block.threadId !== null || !block.walkable) return false;

    this.removeThread(threadId);
    block.threadId = threadId;
    return true;
  }

  removeThread(threadId: string): void {
    for (const chunk of this.chunks) {
      for (const block of chunk.blocks) {
        if (block.threadId === threadId) {
          block.threadId = null;
        }
      }
    }
  }
}
