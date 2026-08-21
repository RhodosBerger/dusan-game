// packages/server/src/models/SovereignBattleDirector.ts
import { SovereignEngine } from './SovereignEngine';
import { Thread } from './Thread';
import { DatabaseSyncManager } from './DatabaseSyncManager';
import { Pathfinder } from '@dusan-game/shared';

export interface BattleOutcome {
  winnerId: string;
  loserId: string;
  damageToPlayer: number;
  damageToNpc: number;
  telemetryId: number;
  xpAwarded: number;
}

export class SovereignBattleDirector {
  private static dbManager = DatabaseSyncManager.getInstance();

  /**
   * Performs mathematical and statistical battle calculations between a Player fighter and an NPC monster.
   * Logs telemetry to database and appends trace records to engine log.
   */
  public static evaluateBattleEncounter(
    engine: SovereignEngine,
    playerId: string,
    npcId: string
  ): BattleOutcome {
    const player = engine.threads.find(t => t.id === playerId);
    const npc = engine.threads.find(t => t.id === npcId);

    if (!player || !npc) {
      throw new Error(`[BATTLE ERROR] Player ${playerId} or NPC ${npcId} not found.`);
    }

    // Mathematical model calculations
    const pDmg = player.baseDamage || 5;
    const pArmor = player.armor || 0;
    const nDmg = npc.baseDamage || 3;
    const nArmor = npc.armor || 0;

    // Calculate statistical damage
    const damageToNpc = Math.max(1, pDmg - nArmor);
    const damageToPlayer = Math.max(1, nDmg - pArmor);

    // Apply HP changes
    npc.health = Math.max(0, npc.health - damageToNpc);
    player.health = Math.max(0, player.health - damageToPlayer);

    const isNpcDefeated = npc.health <= 0;
    const isPlayerDefeated = player.health <= 0;
    
    let winnerId = '';
    let loserId = '';
    let xpAwarded = 0;

    if (isNpcDefeated) {
      winnerId = playerId;
      loserId = npcId;
      xpAwarded = 80;
      player.xp = (player.xp || 0) + xpAwarded;

      // Remove NPC from engine threads list
      engine.threads = engine.threads.filter(t => t.id !== npcId);

      // Check RPG level up
      const nextLevelXp = (player.level || 1) * 100;
      if (player.xp >= nextLevelXp) {
        player.level = (player.level || 1) + 1;
        player.xp -= nextLevelXp;
        player.armor += 2;
        player.health = player.maxHealth || 15;
      }
    } else if (isPlayerDefeated) {
      winnerId = npcId;
      loserId = playerId;
    }

    // Telemetry generation
    const telemetryData = {
      timestamp: Date.now(),
      playerId,
      npcId,
      playerHp: player.health,
      npcHp: npc.health,
      damageToPlayer,
      damageToNpc,
      isNpcDefeated
    };

    // Save to database
    this.dbManager.logTelemetry('session_battle', 'BATTLE_ENGAGEMENT', telemetryData);

    // Push Trace animations (damage / combat triggers)
    engine.traceLog.push({
      type: 'Combat',
      attackerId: playerId,
      targetId: npcId,
      damage: damageToNpc,
      armor: nArmor,
      timestamp: Date.now(),
      message: `Combat Animation: Player ${player.name} struck NPC ${npc.name} dealing ${damageToNpc} DMG.`
    } as any);

    if (damageToPlayer > 0) {
      engine.traceLog.push({
        type: 'Combat',
        attackerId: npcId,
        targetId: playerId,
        damage: damageToPlayer,
        armor: pArmor,
        timestamp: Date.now(),
        message: `Damage Animation: NPC ${npc.name} retaliated dealing ${damageToPlayer} DMG to ${player.name}.`
      } as any);
    }

    return {
      winnerId,
      loserId,
      damageToPlayer,
      damageToNpc,
      telemetryId: Date.now(),
      xpAwarded
    };
  }

  /**
   * Adaptive difficulty balancing loop: Spawns a high-skill Elite Sentinel NPC
   * if player victory count is high.
   */
  public static scaleNPCOnVictories(engine: SovereignEngine): string {
    // Select all victory events from local telemetry log cache
    const victories = engine.traceLog.filter(log => log.type === 'Combat' && log.message?.includes('struck NPC'));
    
    if (victories.length >= 3) {
      // Spawn Elite NPC
      const eliteId = `elite_sentinel_${Date.now()}`;
      const eliteNpc = new Thread(eliteId, 'NPC');
      eliteNpc.name = 'Elite Void Sentinel';
      eliteNpc.health = 25;
      eliteNpc.maxHealth = 25;
      eliteNpc.baseDamage = 6;
      eliteNpc.armor = 2;
      engine.spawnThread(eliteNpc, 0, 1);

      engine.traceLog.push({
        type: 'Spawn',
        threadId: eliteId,
        chunkId: 0,
        blockId: 1,
        timestamp: Date.now(),
        message: `Adaptive difficulty scaled! Spawned ${eliteNpc.name} due to high player victories.`
      } as any);

      return `Adaptive Difficulty: Spawned ${eliteNpc.name} at Chunk 0 Hex 1.`;
    }

    return 'Difficulty balanced.';
  }

  /**
   * Navigation and guidance system: routes player step-by-step toward optimal encounters
   * that give maximum level/XP benefits.
   */
  public static getEncountersNavigationMap(
    engine: SovereignEngine,
    playerId: string
  ): { targetCoords: { meta: number; hex: number }[]; path: any[]; message: string } {
    const player = engine.threads.find(t => t.id === playerId);
    if (!player || !player.position) {
      return { targetCoords: [], path: [], message: 'Player has no valid coordinates.' };
    }

    // Find all NPCs with high XP value
    const npcs = engine.threads.filter(t => t.type === 'NPC' && t.position);
    if (npcs.length === 0) {
      return { targetCoords: [], path: [], message: 'No opposing NPCs available on battlefield.' };
    }

    // Pick closest NPC
    let closestNpc = npcs[0];
    let minDistance = Infinity;
    let optimalPath: any[] = [];

    const blocksList = engine.map.chunks.flatMap(c => 
      c.blocks.map(b => ({
        chunkId: c.id,
        blockId: b.id,
        walkable: true,
        energyCostMultiplier: 1.0,
        lootProbability: 0.1,
        hazardIndex: b.hazardIndex || 0.0
      }))
    );

    for (const npc of npcs) {
      const path = Pathfinder.findPath(
        player.position.meta!,
        player.position.hex!,
        npc.position!.meta!,
        npc.position!.hex!,
        blocksList
      );
      if (path && path.length < minDistance) {
        minDistance = path.length;
        closestNpc = npc;
        optimalPath = path;
      }
    }

    return {
      targetCoords: [{ meta: closestNpc.position!.meta!, hex: closestNpc.position!.hex! }],
      path: optimalPath,
      message: `Guidance System: Recommended path coordinates to intercept ${closestNpc.name} at Chunk ${closestNpc.position!.meta} Hex ${closestNpc.position!.hex}`
    };
  }
}
