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

declare var process: any;
const GO_CORE_URL = (typeof process !== 'undefined' && process.env && process.env.GO_CORE_URL) || 'http://localhost:8081';

export class SovereignTelemetrySpawner {
  private static activeEvents: TelemetrySpawnEvent[] = [];

  /**
   * Bezkolízny spawner guard. Zaisťuje, že dlaždica je priechodná, 
   * neobsahuje inú entitu ani existujúcu prekážku/pascu.
   */
  public static verifySpawnerSafety(engine: SovereignEngine, meta: number, hex: number): boolean {
    const chunk = engine.map.chunks.find(c => c.id === meta);
    const block = chunk?.blocks.find(b => b.id === hex);
    if (!block) return false;

    const isWalkable = block.walkable === true;
    const isFreeOfEntities = !engine.threads.some(t => t.position && t.position.meta === meta && t.position.hex === hex);
    const isFreeOfTraps = !block.hasTrap;
    const isFreeOfChests = !block.hasOpportunity && !block.hasChest;

    return isWalkable && isFreeOfEntities && isFreeOfTraps && isFreeOfChests;
  }

  /**
   * Evaluates the averaged SQLite statistics and dynamically spawns events and entities in the game engine.
   */
  public static async evaluateAndSpawn(engine: SovereignEngine): Promise<TelemetrySpawnEvent[]> {
    const stats = SovereignStatisticsReporter.generateStatisticsReport();
    
    // Clear old telemetry-driven events to recalculate fresh compromise states
    this.activeEvents = [];

    const getSafeHexInChunk = (meta: number, defaultHex: number): number => {
      if (this.verifySpawnerSafety(engine, meta, defaultHex)) return defaultHex;
      for (let h = 0; h < 7; h++) {
        if (this.verifySpawnerSafety(engine, meta, h)) return h;
      }
      return defaultHex;
    };

    const getScheduledTurn = (type: 'ELITE_NPC' | 'DATA_HAZARD_TRAP' | 'TELEMETRY_LOOT_CHEST'): number => {
      const activePlayer = engine.threads.find(t => t.id === engine.activePlayerId);
      const hpRatio = activePlayer ? (activePlayer.health / activePlayer.maxHealth) : 1.0;
      
      if (type === 'TELEMETRY_LOOT_CHEST') {
        return engine.turnCount;
      } else {
        const delay = hpRatio < 0.4 ? 2 : hpRatio < 0.7 ? 1 : 0;
        return engine.turnCount + delay;
      }
    };

    // 0. Integration with OpenVINO Vision Telemetry (Edge Defect Detection)
    try {
      const visionRes = await fetch(`${GO_CORE_URL}/api/telemetry/vision`);
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
          
          // Max. jeden Vision Sentinel naraz
          const sentinelAlive = engine.threads.some(t => t.id.startsWith('vision_sentinel_') || t.name === 'OpenVINO Vision Sentinel');
          if (details.detected_defect_class === 1 && !sentinelAlive) {
            const safeHex = getSafeHexInChunk(0, 1);
            const scheduledTurn = getScheduledTurn('ELITE_NPC');
            const eventUuid = engine.spawningPlanner.scheduleSpawn({
              type: 'ELITE_NPC',
              name: 'OpenVINO Vision Sentinel',
              meta: 0,
              hex: safeHex,
              scheduledTurn,
              description: `OpenVINO Vision Sentinel spawned due to defect anomaly detected on production line camera feed.`
            });

            this.activeEvents.push({
              id: eventUuid,
              type: 'ELITE_NPC',
              name: 'OpenVINO Vision Sentinel',
              meta: 0,
              hex: safeHex,
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
      const safeHex = getSafeHexInChunk(0, 1);
      const scheduledTurn = getScheduledTurn('ELITE_NPC');
      const eventUuid = engine.spawningPlanner.scheduleSpawn({
        type: 'ELITE_NPC',
        name: 'Faraday Sentinel',
        meta: 0,
        hex: safeHex,
        scheduledTurn,
        description: 'Faraday Sentinel spawned to counteract BURST_DAMAGE player archetype.'
      });

      this.activeEvents.push({
        id: eventUuid,
        type: 'ELITE_NPC',
        name: 'Faraday Sentinel',
        meta: 0,
        hex: safeHex,
        description: 'Faraday Sentinel spawned to counteract BURST_DAMAGE player archetype.'
      });
    } else if (archetype === 'FAST_MOVER') {
      const safeHex = getSafeHexInChunk(0, 5);
      const scheduledTurn = getScheduledTurn('DATA_HAZARD_TRAP');
      const eventUuid = engine.spawningPlanner.scheduleSpawn({
        type: 'DATA_HAZARD_TRAP',
        name: 'Anti-Movement System Trap',
        meta: 0,
        hex: safeHex,
        scheduledTurn,
        description: 'System root trap spawned to counteract FAST_MOVER player archetype.'
      });

      this.activeEvents.push({
        id: eventUuid,
        type: 'DATA_HAZARD_TRAP',
        name: 'Anti-Movement System Trap',
        meta: 0,
        hex: safeHex,
        description: 'System root trap spawned to counteract FAST_MOVER player archetype.'
      });
    }

    // 1. Compromise between high player levels and NPC spawning (Difficulty Balance)
    if (stats.averagePlayerLevel >= 1.5) {
      const safeHex = getSafeHexInChunk(0, 4);
      const scheduledTurn = getScheduledTurn('ELITE_NPC');
      const eventUuid = engine.spawningPlanner.scheduleSpawn({
        type: 'ELITE_NPC',
        name: 'Telemetry-Scaled Void Stalker',
        meta: 0,
        hex: safeHex,
        scheduledTurn,
        description: `Difficulty scaled opponent spawned at Swamp due to average player level ${stats.averagePlayerLevel.toFixed(1)}.`
      });

      this.activeEvents.push({
        id: eventUuid,
        type: 'ELITE_NPC',
        name: 'Telemetry-Scaled Void Stalker',
        meta: 0,
        hex: safeHex,
        description: `Difficulty scaled opponent spawned at Swamp due to average player level ${stats.averagePlayerLevel.toFixed(1)}.`
      });
    }

    // 2. Compromise between memory dump registers and hazard triggers (Data Anomaly Spawns)
    if (stats.totalMemoryRegisters >= 0) {
      const safeHex = getSafeHexInChunk(0, 2);
      const scheduledTurn = getScheduledTurn('DATA_HAZARD_TRAP');
      const eventUuid = engine.spawningPlanner.scheduleSpawn({
        type: 'DATA_HAZARD_TRAP',
        name: 'Quantum Data Anomaly',
        meta: 0,
        hex: safeHex,
        scheduledTurn,
        description: `Dangerous data leak anomaly registered at Forest. Stepping here inflicts roots.`
      });

      this.activeEvents.push({
        id: eventUuid,
        type: 'DATA_HAZARD_TRAP',
        name: 'Quantum Data Anomaly',
        meta: 0,
        hex: safeHex,
        description: `Dangerous data leak anomaly registered at Forest. Stepping here inflicts roots.`
      });
    }

    // 3. Compromise between low player items and resource replenishment (Loot Spawns)
    if (stats.totalPlayerItems <= 2) {
      const safeHex = getSafeHexInChunk(0, 3);
      const scheduledTurn = getScheduledTurn('TELEMETRY_LOOT_CHEST');
      const eventUuid = engine.spawningPlanner.scheduleSpawn({
        type: 'TELEMETRY_LOOT_CHEST',
        name: 'Telemetry Loot Chest',
        meta: 0,
        hex: safeHex,
        scheduledTurn,
        description: `A replenishment supply chest materialized containing 5 CrystalShards.`
      });

      this.activeEvents.push({
        id: eventUuid,
        type: 'TELEMETRY_LOOT_CHEST',
        name: 'Telemetry Loot Chest',
        meta: 0,
        hex: safeHex,
        description: `A replenishment supply chest materialized containing 5 CrystalShards.`
      });
    }

    // Tick the spawning planner immediately for current-turn scheduled events
    engine.spawningPlanner.tick(engine);

    return this.activeEvents;
  }

  /**
   * Retrieves currently active spawns.
   */
  public static getActiveEvents(): TelemetrySpawnEvent[] {
    return this.activeEvents;
  }
}
