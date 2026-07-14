// packages/server/src/models/SovereignIslandSystem.ts
import { SovereignEngine } from './SovereignEngine';
import { Thread } from './Thread';

export class SovereignIslandSystem {
  // Island chunk groupings
  public static ISLANDS = [
    [0, 1, 2], // Island 1 (Sector Alpha)
    [3, 4, 5], // Island 2 (Sector Beta)
    [6, 7, 8]  // Island 3 (Sector Gamma)
  ];

  public activeIslandIndex: number = 0; // 0, 1, or 2
  public currentWave: number = 1;       // 1, 2, or 3
  public maxWaves: number = 3;

  constructor() {}

  /**
   * Initializes the map for the island system.
   * Lock (set walkable = false) all chunks belonging to Island 2 and Island 3.
   */
  public initializeIslands(engine: SovereignEngine): void {
    this.activeIslandIndex = 0;
    this.currentWave = 1;

    for (let islandIdx = 1; islandIdx < SovereignIslandSystem.ISLANDS.length; islandIdx++) {
      const chunks = SovereignIslandSystem.ISLANDS[islandIdx];
      for (const chunkId of chunks) {
        const chunk = engine.map.chunks.find(c => c.id === chunkId);
        if (chunk) {
          for (const block of chunk.blocks) {
            block.walkable = false; // Lock access and sink tiles
          }
        }
      }
    }
    
    // Spawn initial Wave 1 monsters
    this.spawnWaveMonsters(engine, 0);
    console.log(`[ISLAND_SYSTEM] Initialized Wave 1 on Island 1 (Chunks 0, 1, 2). Chunks 3-8 locked.`);
  }

  /**
   * Evaluates wave progression.
   * If all enemy NPCs on the currently active island are defeated, progresses to the next wave.
   */
  public evaluateWaveProgress(engine: SovereignEngine): void {
    if (engine.state === 'GAME_OVER') return;

    // Get all enemy NPC threads on the active island chunks
    const activeChunks = SovereignIslandSystem.ISLANDS[this.activeIslandIndex];
    const enemies = engine.threads.filter(t => 
      t.type === 'NPC' && 
      !t.isDeallocated() &&
      !t.name.includes('Sentinel') &&
      !t.name.includes('Companion') &&
      !t.id.includes('faraday') &&
      !t.id.includes('vision') &&
      t.position &&
      activeChunks.includes(t.position.meta!)
    );

    if (enemies.length === 0) {
      console.log(`[ISLAND_SYSTEM] Wave ${this.currentWave} cleared! All monsters on Island ${this.activeIslandIndex + 1} defeated.`);
      this.progressToNextWave(engine);
    }
  }

  /**
   * Unlocks the next island, triggers a transition, and spawns the next wave of monsters.
   */
  private progressToNextWave(engine: SovereignEngine): void {
    if (this.currentWave >= this.maxWaves) {
      // All waves cleared: Player wins the PvE match!
      engine.state = 'GAME_OVER';
      const winner = engine.threads.find(t => t.type === 'PLAYER' && !t.isDeallocated());
      
      engine.traceLog.push({
        type: 'ChestClaim',
        threadId: 'system',
        message: `🔥 Campaign Victory! All 3 waves cleared! Winner: ${winner ? winner.name : 'Player'}.`,
        timestamp: Date.now()
      } as any);
      
      console.log(`[ISLAND_SYSTEM] Campaign Victory! All waves cleared.`);
      return;
    }

    this.activeIslandIndex++;
    this.currentWave++;

    // 1. Unlock chunks on the next island
    const nextChunks = SovereignIslandSystem.ISLANDS[this.activeIslandIndex];
    for (const chunkId of nextChunks) {
      const chunk = engine.map.chunks.find(c => c.id === chunkId);
      if (chunk) {
        for (const block of chunk.blocks) {
          block.walkable = true; // Rise tiles and allow movement
        }
      }
    }

    // 2. Spawn the new wave of monsters
    this.spawnWaveMonsters(engine, this.activeIslandIndex);

    // 3. Teleport the player hrdina to the starting node of the new island
    const players = engine.threads.filter(t => t.type === 'PLAYER' && !t.isDeallocated());
    for (const p of players) {
      const startChunkId = nextChunks[0];
      
      // Find a safe walkable hex in startChunkId
      let startBlockId = 0;
      const startChunk = engine.map.chunks.find(c => c.id === startChunkId);
      if (startChunk) {
        const walkableBlock = startChunk.blocks.find(b => b.walkable && b.threadId === null);
        if (walkableBlock) {
          startBlockId = walkableBlock.id;
        }
      }

      engine.map.placeThread(p.id, startChunkId, startBlockId);
      p.position = { meta: startChunkId, hex: startBlockId };
      console.log(`[ISLAND_SYSTEM] Teleported player ${p.id} to new island starting point: Chunk ${startChunkId} Hex ${startBlockId}`);
    }

    // 4. Log the transition
    engine.traceLog.push({
      type: 'Spawn',
      threadId: 'system_island_transition',
      message: `🏝️ Sector Unlocked: Wave ${this.currentWave} has begun! Chunks ${nextChunks.join(', ')} arose from the void.`,
      timestamp: Date.now()
    } as any);

    console.log(`[ISLAND_SYSTEM] Progressed to Wave ${this.currentWave}. Island ${this.activeIslandIndex + 1} unlocked.`);
  }

  /**
   * Spawns monsters for the specific island wave.
   */
  private spawnWaveMonsters(engine: SovereignEngine, islandIdx: number): void {
    const chunks = SovereignIslandSystem.ISLANDS[islandIdx];
    
    if (islandIdx === 0) {
      // Wave 1: 2 basic monsters
      this.spawnMonster(engine, chunks[1], 3, 'Scavenger Void Monster', 10, 3);
      this.spawnMonster(engine, chunks[2], 4, 'Stalker Void Monster', 12, 4);
    } else if (islandIdx === 1) {
      // Wave 2: 3 tougher monsters
      this.spawnMonster(engine, chunks[0], 2, 'Void Charger', 15, 4);
      this.spawnMonster(engine, chunks[1], 3, 'Corrupted Golem', 18, 5);
      this.spawnMonster(engine, chunks[2], 4, 'Void Splitter', 14, 4);
    } else if (islandIdx === 2) {
      // Wave 3: Boss monster + sentinels
      this.spawnMonster(engine, chunks[1], 3, 'Faraday the Void Sovereign (BOSS)', 40, 7);
      this.spawnMonster(engine, chunks[0], 1, 'Void Sentinel', 15, 4);
      this.spawnMonster(engine, chunks[2], 5, 'Void Sentinel', 15, 4);
    }
  }

  private spawnMonster(
    engine: SovereignEngine, 
    chunkId: number, 
    hexId: number, 
    name: string, 
    hp: number, 
    dmg: number
  ): void {
    // Locate a safe walkable and unoccupied hex in the target chunk
    let safeHex = hexId;
    const chunk = engine.map.chunks.find(c => c.id === chunkId);
    if (chunk) {
      const block = chunk.blocks.find(b => b.id === safeHex);
      if (!block || !block.walkable || block.threadId !== null) {
        const walkableBlock = chunk.blocks.find(b => b.walkable && b.threadId === null);
        if (walkableBlock) {
          safeHex = walkableBlock.id;
        }
      }
    }

    const npcId = `npc_wave_${this.currentWave}_${name.replace(/\s+/g, '_')}_${Date.now()}_${Math.floor(Math.random() * 100)}`;
    const monster = new Thread(npcId, 'NPC');
    monster.name = name;
    monster.health = hp;
    monster.maxHealth = hp;
    monster.baseDamage = dmg;
    monster.armor = islandIdxToArmor(this.activeIslandIndex);
    
    engine.spawnThread(monster, chunkId, safeHex);
    console.log(`[ISLAND_SYSTEM] Spawned ${name} at Chunk ${chunkId} Hex ${safeHex} (requested Hex ${hexId}) with ${hp} HP`);
  }
}

function islandIdxToArmor(idx: number): number {
  if (idx === 0) return 1;
  if (idx === 1) return 2;
  return 4;
}
