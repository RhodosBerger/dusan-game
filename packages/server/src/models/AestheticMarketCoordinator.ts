// packages/server/src/models/AestheticMarketCoordinator.ts
import { SovereignEngine } from './SovereignEngine';
import { BiomeEngine } from '@dusan-game/shared';

export interface MarketItem {
  id: string;
  name: string;
  basePrice: number;
  currentPrice: number;
  priceModifier: number; // Biome-specific supply/demand multiplier
}

export interface MarketPricingPayload {
  chunkId: number;
  biome: string;
  items: MarketItem[];
}

export class AestheticMarketCoordinator {
  /**
   * Calculates dynamic item prices based on the biome of the chunk the player is visiting.
   * - Crystal Shards are cheap in Crystal Forests, expensive in Toxic Swamps.
   * - Antidotes are cheap in towns, expensive in Toxic Swamps.
   * - Void Cores are rare and expensive everywhere, but cheapest in Void Rifts.
   */
  static getMarketPrices(engine: SovereignEngine, threadId: string): MarketPricingPayload | null {
    const thread = engine.threads.find(t => t.id === threadId);
    if (!thread) return null;

    const chunkId = thread.position.meta !== null ? thread.position.meta : 0;
    const biomeInfo = BiomeEngine.getBiomeForHex(chunkId, 3); // Center hex biome of the chunk
    const biome = biomeInfo.biome;

    const baseItems = [
      { id: 'crystal_shard', name: 'Crystal Shard', basePrice: 10 },
      { id: 'toxic_slime', name: 'Toxic Slime', basePrice: 8 },
      { id: 'void_core', name: 'Void Core', basePrice: 100 },
      { id: 'repair_kit', name: 'Repair Kit', basePrice: 25 }
    ];

    const items: MarketItem[] = baseItems.map((item) => {
      let priceModifier = 1.0;

      if (biome === 'LUSH_FOREST') {
        if (item.id === 'crystal_shard') priceModifier = 0.5; // High supply
        if (item.id === 'toxic_slime') priceModifier = 1.5;   // Rare
      } else if (biome === 'TOXIC_SWAMP') {
        if (item.id === 'toxic_slime') priceModifier = 0.4;   // Abundant
        if (item.id === 'crystal_shard') priceModifier = 2.0; // High demand
        if (item.id === 'repair_kit') priceModifier = 1.6;    // High hazard premium
      } else if (biome === 'DESERT') {
        if (item.id === 'void_core') priceModifier = 0.7;     // Abundant void residues
        if (item.id === 'repair_kit') priceModifier = 2.0;    // Dangerous territory markup
      } else if (biome === 'BARRENS') {
        if (item.id === 'repair_kit') priceModifier = 0.8;    // Trade hubs supply
      }

      return {
        id: item.id,
        name: item.name,
        basePrice: item.basePrice,
        currentPrice: Math.round(item.basePrice * priceModifier),
        priceModifier: Number(priceModifier.toFixed(2))
      };
    });

    return {
      chunkId,
      biome,
      items
    };
  }
}
