// packages/server/src/models/SovereignSpawningPlanner.ts
import { randomUUID } from 'crypto';
import { SovereignEngine } from './SovereignEngine';
import { Thread } from './Thread';
import { SovereignTelemetrySpawner } from './SovereignTelemetrySpawner';

export interface PlannedSpawnEvent {
  uuid: string;
  type: 'ELITE_NPC' | 'DATA_HAZARD_TRAP' | 'TELEMETRY_LOOT_CHEST';
  name: string;
  meta: number;
  hex: number;
  scheduledTurn: number;
  description: string;
  triggerCondition?: (engine: SovereignEngine) => boolean;
}

export class SovereignSpawningPlanner {
  private plannedEvents: PlannedSpawnEvent[] = [];

  /**
   * Schedules a new event to be spawned gradually over future turns.
   * Generates a unique UUID for the event.
   */
  public scheduleSpawn(event: Omit<PlannedSpawnEvent, 'uuid'>): string {
    const uuid = randomUUID();
    const newEvent: PlannedSpawnEvent = {
      ...event,
      uuid
    };
    this.plannedEvents.push(newEvent);
    console.log(`[PLANNER] Scheduled gradual spawn: ${event.name} (${event.type}) with UUID ${uuid} for Turn ${event.scheduledTurn}`);
    return uuid;
  }

  /**
   * Retrieves all currently planned spawns.
   */
  public getPlannedEvents(): PlannedSpawnEvent[] {
    return [...this.plannedEvents];
  }

  /**
   * Clears the planned queue.
   */
  public clearPlanner(): void {
    this.plannedEvents = [];
  }

  /**
   * Ticks the planner, executing scheduled events when their turn arrives or trigger conditions are met.
   * Verifies spawner safety before materializing the entity.
   */
  public tick(engine: SovereignEngine): void {
    const currentTurn = engine.turnCount;
    const eventsToExecute: PlannedSpawnEvent[] = [];
    const remainingEvents: PlannedSpawnEvent[] = [];

    for (const event of this.plannedEvents) {
      const turnConditionMet = currentTurn >= event.scheduledTurn;
      const customConditionMet = event.triggerCondition ? event.triggerCondition(engine) : true;

      if (turnConditionMet && customConditionMet) {
        eventsToExecute.push(event);
      } else {
        remainingEvents.push(event);
      }
    }

    this.plannedEvents = remainingEvents;

    for (const event of eventsToExecute) {
      // Find safe hex dynamically around target
      let safeHex = event.hex;
      if (!SovereignTelemetrySpawner.verifySpawnerSafety(engine, event.meta, safeHex)) {
        let foundSafe = false;
        for (let h = 0; h < 7; h++) {
          if (SovereignTelemetrySpawner.verifySpawnerSafety(engine, event.meta, h)) {
            safeHex = h;
            foundSafe = true;
            break;
          }
        }
        if (!foundSafe) {
          console.warn(`[PLANNER] No safe block found in chunk ${event.meta} to materialize ${event.name}. Spawn aborted.`);
          continue;
        }
      }

      // Materialize on board
      const chunk = engine.map.chunks.find(c => c.id === event.meta);
      const block = chunk?.blocks.find(b => b.id === safeHex);

      if (event.type === 'ELITE_NPC') {
        const npc = new Thread(event.uuid, 'NPC');
        npc.name = event.name;
        npc.health = event.name.includes('Faraday') ? 20 : 15;
        npc.maxHealth = npc.health;
        npc.baseDamage = 4;
        npc.armor = 2;
        
        engine.spawnThread(npc, event.meta, safeHex);
      } else if (event.type === 'DATA_HAZARD_TRAP') {
        if (block) {
          block.hasTrap = 'ROOT_TRAP';
          engine.traceLog.push({
            type: 'Spawn',
            threadId: event.uuid,
            chunkId: event.meta,
            blockId: safeHex,
            timestamp: Date.now(),
            message: `[PLANNER] Materialized DATA_HAZARD_TRAP: ${event.name} via spawner guard.`
          } as any);
        }
      } else if (event.type === 'TELEMETRY_LOOT_CHEST') {
        if (block) {
          block.hasOpportunity = 'REPAIR_KIT';
          engine.traceLog.push({
            type: 'Spawn',
            threadId: event.uuid,
            chunkId: event.meta,
            blockId: safeHex,
            timestamp: Date.now(),
            message: `[PLANNER] Materialized TELEMETRY_LOOT_CHEST: ${event.name} via spawner guard.`
          } as any);
        }
      }

      console.log(`[PLANNER] Materialized event ${event.name} (${event.type}) at Chunk ${event.meta} Hex ${safeHex} (UUID: ${event.uuid})`);
    }
  }
}
