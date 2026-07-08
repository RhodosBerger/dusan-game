// packages/server/src/models/GameplayCompositorManager.ts
import { SovereignEngine } from './SovereignEngine';
import { RenderPriorityBalancer } from './RenderPriorityBalancer';

export interface CompositorTriggerResult {
  status: 'SUCCESS' | 'NO_OP';
  spawnedEntityType?: 'ROOT_TRAP' | 'EMP_MINE' | 'SURGE_NODE' | 'VOID_RIFT' | 'CHEST';
  meta?: number;
  hex?: number;
  message: string;
}

export class GameplayCompositorManager {
  /**
   * Scans player's telemetry and active quests, finds culled/low priority nodes
   * that are out of direct focus, and spawns new gameplay opportunities there.
   */
  static processCompositeTrigger(engine: SovereignEngine, threadId: string): CompositorTriggerResult {
    const thread = engine.threads.find(t => t.id === threadId);
    if (!thread) {
      return { status: 'NO_OP', message: `Thread ${threadId} not found.` };
    }

    // 1. Get render priorities to identify CULLED or LOW priority hexes (out of player direct viewport)
    const prioritiesPayload = RenderPriorityBalancer.getRenderPriorities(engine, threadId);
    if (!prioritiesPayload) {
      return { status: 'NO_OP', message: 'Failed to calculate render priorities.' };
    }

    // Filter nodes that are culled or low priority (priorityScore <= 0.3) and have no existing trap/chest/town
    const availableNodes = prioritiesPayload.priorities.filter(p => {
      const chunk = engine.map.chunks.find(c => c.id === p.meta);
      const block = chunk?.blocks.find(b => b.id === p.hex);
      if (!block) return false;
      return (
        p.priorityScore <= 0.3 && 
        !block.hasTrap && 
        !block.hasOpportunity && 
        !block.hasChest && 
        !block.isTown && 
        block.walkable
      );
    });

    if (availableNodes.length === 0) {
      return { status: 'NO_OP', message: 'No suitable out-of-focus nodes found for spawning.' };
    }

    // 2. Select a target node based on the telemetry (Dopamine Balancer)
    // If player health is low, we spawn a beneficial chest/opportunity; if high, we spawn a trap to increase challenge
    const hpRatio = thread.health / thread.maxHealth;
    let spawnType: 'ROOT_TRAP' | 'EMP_MINE' | 'SURGE_NODE' | 'VOID_RIFT' | 'CHEST' = 'CHEST';

    if (hpRatio < 0.4) {
      // Spawn beneficial chest
      spawnType = 'CHEST';
    } else if (hpRatio > 0.8) {
      // Spawn high challenge trap
      spawnType = Math.random() > 0.5 ? 'ROOT_TRAP' : 'VOID_RIFT';
    } else {
      // Spawn opportunity or mine
      spawnType = Math.random() > 0.5 ? 'SURGE_NODE' : 'EMP_MINE';
    }

    // Select the best node (preferring LOW priority over CULLED so it's not too far away)
    const sortedNodes = availableNodes.sort((a, b) => b.priorityScore - a.priorityScore);
    const targetNode = sortedNodes[0];

    const chunk = engine.map.chunks.find(c => c.id === targetNode.meta)!;
    const block = chunk.blocks.find(b => b.id === targetNode.hex)!;

    // Apply the spawn
    if (spawnType === 'CHEST') {
      block.hasChest = true;
    } else if (spawnType === 'ROOT_TRAP' || spawnType === 'EMP_MINE') {
      block.hasTrap = spawnType;
      block.trapOwnerId = 'SYSTEM';
    } else {
      block.hasOpportunity = spawnType;
    }

    // Push into the server's trace log
    engine.traceLog.push({
      type: 'Spawn',
      threadId: threadId,
      message: `Compositor spawned ${spawnType} at Chunk ${targetNode.meta} Hex ${targetNode.hex} based on player HP ratio ${(hpRatio * 100).toFixed(0)}%.`,
      timestamp: Date.now()
    } as any);

    return {
      status: 'SUCCESS',
      spawnedEntityType: spawnType,
      meta: targetNode.meta,
      hex: targetNode.hex,
      message: `Successfully spawned ${spawnType} at Chunk ${targetNode.meta} Hex ${targetNode.hex} (Priority: ${targetNode.priority}).`
    };
  }
}
