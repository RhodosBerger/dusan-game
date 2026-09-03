import { Pathfinder, PathNode } from './Pathfinder';

export interface NPCDecision {
  action: 'ATTACK' | 'MOVE' | 'HARVEST' | 'WAIT';
  targetChunkId?: number;
  targetBlockId?: number;
  targetThreadId?: string;
  log: string;
}

export class NPCScriptDirector {
  /**
   * Vyhodnotí správanie NPC na základe jeho taktického skriptu
   */
  public static evaluateAI(
    npc: { id: string; name: string; position: { meta: number; hex: number } | null },
    threads: { id: string; type: string; position: { meta: number; hex: number } | null }[],
    blocksList: { chunkId: number; blockId: number; walkable: boolean; energyCostMultiplier: number; lootProbability: number; hazardIndex: number }[]
  ): NPCDecision {
    if (!npc.position) {
      return { action: 'WAIT', log: `NPC ${npc.id} nemá pozíciu.` };
    }

    const npcCoords = Pathfinder.hexDistance(0, 0, 0, 0); // Len dummy volanie pre overenie prepojenia

    // 1. Vyhľadáme najbližšieho hrdinu (PLAYER)
    let closestPlayer: typeof threads[0] | null = null;
    let minDistance = Infinity;

    for (const thread of threads) {
      if (thread.type === 'PLAYER' && thread.position) {
        // Vzdialenosť
        const npcPos = npc.position!;
        const playerPos = thread.position!;
        const path = Pathfinder.findPath(npcPos.meta, npcPos.hex, playerPos.meta, playerPos.hex, blocksList);
        if (path) {
          const dist = path.length - 1;
          if (dist < minDistance) {
            minDistance = dist;
            closestPlayer = thread;
          }
        }
      }
    }

    // A. Rozvetvenie: SLAYER BEHAVIOR (Agresívne monštrá)
    if (npc.name.includes("Sentinel") || npc.name.includes("Monster") || npc.name.includes("Void")) {
      if (closestPlayer && closestPlayer.position) {
        // Ak je hráč hneď vedľa, zaútočíme
        if (minDistance === 1) {
          return {
            action: 'ATTACK',
            targetThreadId: closestPlayer.id,
            targetChunkId: closestPlayer.position.meta,
            targetBlockId: closestPlayer.position.hex,
            log: `Slayer NPC ${npc.id} útočí na hráča ${closestPlayer.id} na susednom bloku.`
          };
        }

        // Ak je hráč ďalej, posunieme sa po A* ceste smerom k nemu
        const path = Pathfinder.findPath(npc.position.meta, npc.position.hex, closestPlayer.position.meta, closestPlayer.position.hex, blocksList);
        if (path && path.length > 1) {
          const nextStep = path[1]; // Druhý uzol cesty (prvý krok)
          return {
            action: 'MOVE',
            targetChunkId: nextStep.chunkId,
            targetBlockId: nextStep.blockId,
            log: `Slayer NPC ${npc.id} kráča po A* ceste k hráčovi ${closestPlayer.id} na pozíciu C:${nextStep.chunkId} B:${nextStep.blockId}.`
          };
        }
      }
    }

    // B. Rozvetvenie: HARVESTER BEHAVIOR (Zberači)
    if (npc.name.includes("Gatherer") || npc.name.includes("Watcher") || npc.name.includes("Miner")) {
      // Vyhľadáme najbližší blok s vysokým lootProbability (> 0.5)
      let targetBlock: typeof blocksList[0] | null = null;
      let minLootDist = Infinity;

      for (const block of blocksList) {
        if (block.lootProbability > 0.5) {
          const path = Pathfinder.findPath(npc.position.meta, npc.position.hex, block.chunkId, block.blockId, blocksList);
          if (path) {
            const dist = path.length - 1;
            if (dist < minLootDist) {
              minLootDist = dist;
              targetBlock = block;
            }
          }
        }
      }

      if (targetBlock) {
        if (minLootDist === 0) {
          return {
            action: 'HARVEST',
            targetChunkId: targetBlock.chunkId,
            targetBlockId: targetBlock.blockId,
            log: `Harvester NPC ${npc.id} ťaží suroviny na bloku C:${targetBlock.chunkId} B:${targetBlock.blockId}.`
          };
        }

        // Posunieme sa k lootu
        const path = Pathfinder.findPath(npc.position.meta, npc.position.hex, targetBlock.chunkId, targetBlock.blockId, blocksList);
        if (path && path.length > 1) {
          const nextStep = path[1];
          return {
            action: 'MOVE',
            targetChunkId: nextStep.chunkId,
            targetBlockId: nextStep.blockId,
            log: `Harvester NPC ${npc.id} kráča k nálezisku lootu na C:${nextStep.chunkId} B:${nextStep.blockId}.`
          };
        }
      }
    }

    // C. Predvolené správanie (Stráženie / Čakanie)
    return {
      action: 'WAIT',
      log: `NPC ${npc.id} stráži okolie a čaká na podnety.`
    };
  }
}
