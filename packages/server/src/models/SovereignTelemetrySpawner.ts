// packages/server/src/models/SovereignTelemetrySpawner.ts
import { SovereignEngine } from './SovereignEngine';
import { Thread } from './Thread';
import { SovereignStatisticsReporter } from './SovereignStatisticsReporter';

export interface TelemetrySpawnEvent {
  id: string;
  type: 'ELITE_NPC' | 'DATA_HAZARD_TRAP' | 'TELEMETRY_LOOT_CHEST';
  name: string;
  meta: number;
  hex: number;
  description: string;
}

export class SovereignTelemetrySpawner {
  private static activeEvents: TelemetrySpawnEvent[] = [];

  /**
   * Evaluates the averaged SQLite statistics and dynamically spawns events and entities in the game engine.
   */
  public static async evaluateAndSpawn(engine: SovereignEngine): Promise<TelemetrySpawnEvent[]> {
    const stats = SovereignStatisticsReporter.generateStatisticsReport();
    
    // Clear old telemetry-driven events to recalculate fresh compromise states
    this.activeEvents = [];

    // 0. Integration with OpenVINO Vision Telemetry (Edge Defect Detection)
    try {
      const visionRes = await fetch('http://localhost:8081/api/telemetry/vision');
      if (visionRes.ok) {
        const visionEvents = (await visionRes.json()) as any[];
        if (visionEvents.length > 0) {
          const latest = visionEvents[visionEvents.length - 1];
          let details: any = {};
          if (typeof latest.telemetry_theory === 'string') {
             details = JSON.parse(latest.telemetry_theory);
          } else {
             details = latest.telemetry_theory || {};
          }
          
          // Max. jeden Vision Sentinel naraz — spawner beží po každom end_turn
          // a mock vision feed hlási defekt takmer vždy; bez limitu by NPC armáda
          // v priebehu pár kôl prevalcovala hrdinov.
          const sentinelAlive = engine.threads.some(t => t.id.startsWith('vision_sentinel_'));
          if (details.detected_defect_class === 1 && !sentinelAlive) {
            const sentinelId = `vision_sentinel_${Date.now()}`;
            const sentinel = new Thread(sentinelId, 'NPC');
            sentinel.name = 'OpenVINO Vision Sentinel';
            sentinel.health = 25;
            sentinel.maxHealth = 25;
            sentinel.baseDamage = 5;
            sentinel.armor = 2;
            sentinel.position = { meta: 0, hex: 1 }; // Glacier sector
            
            if (!engine.threads.some(t => t.id === sentinelId)) {
               engine.threads.push(sentinel);
            }

            engine.traceLog.push({
              type: 'Spawn',
              threadId: sentinelId,
              chunkId: 0,
              blockId: 1,
              timestamp: Date.now(),
              message: `OpenVINO PC Vision detected defect class 1 (Anomaly) on camera feed. Spawning a Vision Sentinel entity!`
            } as any);

            this.activeEvents.push({
              id: sentinelId,
              type: 'ELITE_NPC',
              name: sentinel.name,
              meta: 0,
              hex: 1,
              description: `OpenVINO Vision Sentinel spawned due to defect anomaly detected on production line camera feed.`
            });
          }
        }
      }
    } catch (e: any) {
      console.warn('[OPENVINO SPAWNER] Failed to query vision telemetry endpoint:', e.message);
    }

    // ML Archetype Counter Spawner Adaptation
    const archetype = (engine as any).activeArchetype;
    if (archetype === 'BURST_DAMAGE') {
      const sentinelId = `faraday_sentinel_${Date.now()}`;
      const sentinel = new Thread(sentinelId, 'NPC');
      sentinel.name = 'Faraday Sentinel';
      sentinel.health = 20;
      sentinel.maxHealth = 20;
      sentinel.baseDamage = 4;
      sentinel.armor = 3; // high armor/immunity
      sentinel.position = { meta: 0, hex: 1 };
      if (!engine.threads.some(t => t.id === sentinelId)) {
        engine.threads.push(sentinel);
      }
      this.activeEvents.push({
        id: sentinelId,
        type: 'ELITE_NPC',
        name: sentinel.name,
        meta: 0,
        hex: 1,
        description: 'Faraday Sentinel spawned to counteract BURST_DAMAGE player archetype.'
      });
    } else if (archetype === 'FAST_MOVER') {
      const trapId = `ml_root_trap_${Date.now()}`;
      this.activeEvents.push({
        id: trapId,
        type: 'DATA_HAZARD_TRAP',
        name: 'Anti-Movement System Trap',
        meta: 0,
        hex: 5,
        description: 'System root trap spawned to counteract FAST_MOVER player archetype.'
      });
    }

    // 1. Compromise between high player levels and NPC spawning (Difficulty Balance)
    if (stats.averagePlayerLevel >= 1.5) {
      const id = `telemetry_npc_${Date.now()}`;
      const npc = new Thread(id, 'NPC');
      npc.name = 'Telemetry-Scaled Void Stalker';
      npc.health = Math.round(15 + stats.averagePlayerLevel * 3);
      npc.maxHealth = npc.health;
      npc.baseDamage = Math.round(4 + stats.averagePlayerLevel);
      npc.armor = 1;
      npc.position = { meta: 0, hex: 4 }; // Swamp region
      
      // Add to engine threads if not already present
      if (!engine.threads.some(t => t.id === id)) {
        engine.threads.push(npc);
      }

      this.activeEvents.push({
        id,
        type: 'ELITE_NPC',
        name: npc.name,
        meta: 0,
        hex: 4,
        description: `Difficulty scaled opponent spawned at Swamp due to average player level ${stats.averagePlayerLevel.toFixed(1)}.`
      });
    }

    // 2. Compromise between memory dump registers and hazard triggers (Data Anomaly Spawns)
    if (stats.totalMemoryRegisters >= 0) {
      // Spawn a Data Anomaly root trap at Chunk 0 Hex 2
      const trapId = `data_anomaly_trap_${Date.now()}`;
      engine.traceLog.push({
        type: 'Spawn',
        threadId: trapId,
        chunkId: 0,
        blockId: 2,
        timestamp: Date.now(),
        message: `System register dump count (${stats.totalMemoryRegisters}) triggered a Data Anomaly root hazard.`
      } as any);

      this.activeEvents.push({
        id: trapId,
        type: 'DATA_HAZARD_TRAP',
        name: 'Quantum Data Anomaly',
        meta: 0,
        hex: 2,
        description: `Dangerous data leak anomaly registered at Forest. Stepping here inflicts roots.`
      });
    }

    // 3. Compromise between low player items and resource replenishment (Loot Spawns)
    if (stats.totalPlayerItems <= 2) {
      const chestId = `telemetry_chest_${Date.now()}`;
      
      engine.traceLog.push({
        type: 'Spawn',
        threadId: chestId,
        chunkId: 0,
        blockId: 3,
        timestamp: Date.now(),
        message: `Low player inventory items count (${stats.totalPlayerItems}) spawned a Telemetry Loot Chest.`
      } as any);

      this.activeEvents.push({
        id: chestId,
        type: 'TELEMETRY_LOOT_CHEST',
        name: 'Telemetry Loot Chest',
        meta: 0,
        hex: 3,
        description: `A replenishment supply chest materialized containing 5 CrystalShards.`
      });
    }

    // Write spawned elements back to map blocks so they sync to frontend clients:
    for (const event of this.activeEvents) {
      const chunk = engine.map.chunks.find(c => c.id === event.meta);
      const block = chunk?.blocks.find(b => b.id === event.hex);
      if (block) {
        if (event.type === 'DATA_HAZARD_TRAP') {
          block.hasTrap = 'ROOT_TRAP';
        } else if (event.type === 'TELEMETRY_LOOT_CHEST') {
          block.hasOpportunity = 'REPAIR_KIT';
        }
      }
    }

    return this.activeEvents;
  }

  /**
   * Retrieves currently active spawns.
   */
  public static getActiveEvents(): TelemetrySpawnEvent[] {
    return this.activeEvents;
  }
}
