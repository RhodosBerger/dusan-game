// packages/server/src/models/SovereignSoldierSimulator.ts
import { SovereignEngine } from './SovereignEngine';
import { Thread } from './Thread';
import { BiomeEngine, Pathfinder } from '@dusan-game/shared';

export interface SoldierUnit {
  id: string;
  ownerId: string;
  health: number;
  maxHealth: number;
  attackPower: number;
  position: { meta: number; hex: number };
}

export class SovereignSoldierSimulator {
  /**
   * Spawns an opposing monster NPC on the board.
   */
  public static spawnOpposingNpc(engine: SovereignEngine, chunkId: number, hexId: number): Thread {
    const npcId = `npc_monster_${Date.now()}_${Math.floor(Math.random() * 100)}`;
    const monsterNpc = new Thread(npcId, 'NPC');
    monsterNpc.name = 'Void Monster';
    monsterNpc.health = 10;
    monsterNpc.maxHealth = 10;
    monsterNpc.baseDamage = 3;
    
    engine.spawnThread(monsterNpc, chunkId, hexId);
    engine.traceLog.push({
      type: 'Spawn',
      threadId: npcId,
      chunkId,
      blockId: hexId,
      timestamp: Date.now(),
      message: `Opposing Void Monster NPC spawned at Chunk ${chunkId} Hex ${hexId}.`
    } as any);

    return monsterNpc;
  }

  /**
   * Computes the combinatorial win probability for a Soldier encounter based on the player's card hand.
   */
  public static predictCombinatorialWinRate(
    playerHandCardIds: string[],
    targetNpcHp: number
  ): number {
    // Categorize card capabilities
    const movementCards = playerHandCardIds.filter(id => 
      id.toLowerCase().includes('move') || 
      id.toLowerCase().includes('slide') || 
      id.toLowerCase().includes('teleport')
    ).length;

    const destructionCards = playerHandCardIds.filter(id => 
      id.toLowerCase().includes('attack') || 
      id.toLowerCase().includes('laser') || 
      id.toLowerCase().includes('swipe') || 
      id.toLowerCase().includes('venom')
    ).length;

    // Baseline win probability if player lacks coordinates reach (movement) or destruction (attack)
    if (movementCards === 0 || destructionCards === 0) {
      return 0.15; // Low fallback probability
    }

    // Combinatorics: Calculate interaction coefficient
    // P = (Movements * Attacks) / Target HP
    const interactionCoefficient = (movementCards * 1.5 + destructionCards * 2.5);
    const winRate = Math.min(0.98, interactionCoefficient / (targetNpcHp || 10));

    return parseFloat(winRate.toFixed(3));
  }

  /**
   * Simulates active NPC turns and movements outside the core state machine (lightweight sandbox loop).
   */
  public static simulateOutofEngineTurns(engine: SovereignEngine): string[] {
    const actionLogs: string[] = [];
    const npcThreads = engine.threads.filter(t => t.type === 'NPC');
    const playerThreads = engine.threads.filter(t => t.type === 'PLAYER');

    const blocksList = engine.map.chunks.flatMap(c => 
      c.blocks.map(b => ({
        chunkId: c.id,
        blockId: b.id,
        walkable: b.walkable !== false,
        energyCostMultiplier: b.energyCostMultiplier ?? 1.0,
        lootProbability: b.lootProbability ?? 0.1,
        hazardIndex: b.hazardIndex ?? 0.0
      }))
    );

    for (const npc of npcThreads) {
      if (!npc.position || npc.position.meta === null || npc.position.hex === null) continue;

      const isFriendly = npc.name.includes('Sentinel') || npc.name.includes('Companion') || npc.id.includes('faraday') || npc.id.includes('vision');

      if (isFriendly) {
        // Friendly companion logic: find closest enemy NPC to attack or move towards
        const enemyNpcs = engine.threads.filter(t => 
          t.type === 'NPC' && 
          t.id !== npc.id && 
          !t.name.includes('Sentinel') && 
          !t.name.includes('Companion') && 
          !t.id.includes('faraday') && 
          !t.id.includes('vision')
        );
        let closestEnemy: Thread | null = null;
        let minDistance = Infinity;

        for (const enemy of enemyNpcs) {
          if (!enemy.position || enemy.position.meta === null || enemy.position.hex === null) continue;

          const path = Pathfinder.findPath(
            npc.position.meta!,
            npc.position.hex!,
            enemy.position.meta!,
            enemy.position.hex!,
            blocksList
          );

          if (path) {
            const dist = path.length - 1;
            if (dist < minDistance) {
              minDistance = dist;
              closestEnemy = enemy;
            }
          }
        }

        if (closestEnemy && closestEnemy.position) {
          if (minDistance === 1) {
            // Attack enemy
            const damageDealt = Math.max(1, (npc.baseDamage || 4) - (closestEnemy.armor || 0));
            closestEnemy.health = Math.max(0, closestEnemy.health - damageDealt);
            actionLogs.push(`[SIMULATION_FRIENDLY] Friendly ${npc.name} (${npc.id}) attacked enemy ${closestEnemy.name} dealing ${damageDealt} damage.`);
            
            engine.traceLog.push({
              type: 'Combat',
              attackerId: npc.id,
              targetId: closestEnemy.id,
              damage: damageDealt,
              armor: closestEnemy.armor,
              timestamp: Date.now(),
              message: `Friendly ${npc.name} attacked enemy ${closestEnemy.name} dealing ${damageDealt} DMG.`
            } as any);
          } else {
            // Move closer to enemy
            const path = Pathfinder.findPath(
              npc.position.meta!,
              npc.position.hex!,
              closestEnemy.position.meta!,
              closestEnemy.position.hex!,
              blocksList
            );
            if (path && path.length > 2) {
              const nextNode = path[1];
              npc.position = { meta: nextNode.chunkId, hex: nextNode.blockId };
              actionLogs.push(`[SIMULATION_FRIENDLY] Friendly ${npc.name} moved closer to enemy at M${nextNode.chunkId}_S${nextNode.blockId}.`);
            }
          }
        } else {
          // No enemies on board: follow the player to defend them!
          let closestPlayer: Thread | null = null;
          let playerMinDist = Infinity;

          for (const player of playerThreads) {
            if (!player.position || player.position.meta === null || player.position.hex === null) continue;

            const path = Pathfinder.findPath(
              npc.position.meta!,
              npc.position.hex!,
              player.position.meta!,
              player.position.hex!,
              blocksList
            );

            if (path) {
              const dist = path.length - 1;
              if (dist < playerMinDist) {
                playerMinDist = dist;
                closestPlayer = player;
              }
            }
          }

          if (closestPlayer && closestPlayer.position && playerMinDist > 1) {
            // Move closer to player
            const path = Pathfinder.findPath(
              npc.position.meta!,
              npc.position.hex!,
              closestPlayer.position.meta!,
              closestPlayer.position.hex!,
              blocksList
            );
            if (path && path.length > 2) {
              const nextNode = path[1];
              npc.position = { meta: nextNode.chunkId, hex: nextNode.blockId };
              actionLogs.push(`[SIMULATION_FRIENDLY] Companion ${npc.name} followed player to M${nextNode.chunkId}_S${nextNode.blockId}.`);
            }
          }
        }
      } else {
        // Enemy monster logic
        let closestPlayer: Thread | null = null;
        let minDistance = Infinity;

        for (const player of playerThreads) {
          if (!player.position || player.position.meta === null || player.position.hex === null) continue;
          if (player.isStealthed) continue;
          
          const path = Pathfinder.findPath(
            npc.position.meta!,
            npc.position.hex!,
            player.position.meta!,
            player.position.hex!,
            blocksList
          );

          if (path) {
            const dist = path.length - 1;
            if (dist < minDistance) {
              minDistance = dist;
              closestPlayer = player;
            }
          }
        }

        if (closestPlayer && closestPlayer.position) {
          if (minDistance === 1) {
            // Attack close player
            const damageDealt = Math.max(1, (npc.baseDamage || 3) - (closestPlayer.armor || 0));
            closestPlayer.health = Math.max(0, closestPlayer.health - damageDealt);
            actionLogs.push(`[SIMULATION] NPC ${npc.id} attacked ${closestPlayer.id} dealing ${damageDealt} damage.`);
            
            engine.traceLog.push({
              type: 'Combat',
              attackerId: npc.id,
              targetId: closestPlayer.id,
              damage: damageDealt,
              armor: closestPlayer.armor,
              timestamp: Date.now(),
              message: `Opponent NPC ${npc.name} attacked player ${closestPlayer.name} dealing ${damageDealt} DMG.`
            } as any);
          } else {
            // Move closer to player
            const path = Pathfinder.findPath(
              npc.position.meta!,
              npc.position.hex!,
              closestPlayer.position.meta!,
              closestPlayer.position.hex!,
              blocksList
            );
            if (path && path.length > 2) {
              const nextNode = path[1];
              npc.position = { meta: nextNode.chunkId, hex: nextNode.blockId };
              actionLogs.push(`[SIMULATION] NPC ${npc.id} moved closer to player to M${nextNode.chunkId}_S${nextNode.blockId}.`);
            }
          }
        }
      }
    }

    return actionLogs;
  }
}
