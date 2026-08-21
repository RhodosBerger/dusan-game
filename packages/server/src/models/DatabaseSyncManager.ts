declare var require: any;
const { DatabaseSync } = require('node:sqlite');
import { Thread } from './Thread';

export interface DBPlayerProfile {
  id: string;
  username: string;
  level: number;
  xp: number;
  maxHealth: number;
  armor: number;
  luck: number;
  materials: string; // JSON
  quests: string; // JSON
}

export class DatabaseSyncManager {
  private static instance: DatabaseSyncManager | null = null;
  private db: any;

  private constructor(dbPath: string = './database.db') {
    this.db = new DatabaseSync(dbPath);
    this.initSchema();
  }

  /**
   * Singleton accessor — ensures only one DB connection exists per process.
   * Pass `dbPath` only on first call; subsequent calls reuse the existing instance.
   */
  public static getInstance(dbPath: string = './database.db'): DatabaseSyncManager {
    if (!DatabaseSyncManager.instance) {
      DatabaseSyncManager.instance = new DatabaseSyncManager(dbPath);
    }
    return DatabaseSyncManager.instance;
  }

  /**
   * Resets the singleton (for testing only).
   * Closes and re-creates the connection on next `getInstance()` call.
   */
  public static resetInstance(): void {
    if (DatabaseSyncManager.instance) {
      try {
        DatabaseSyncManager.instance.db.close();
      } catch {
        // close may already be called
      }
      DatabaseSyncManager.instance = null;
    }
  }

  private initSchema() {
    // 1. Tabulka hráčov
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        max_health INTEGER DEFAULT 15,
        armor INTEGER DEFAULT 0,
        luck REAL DEFAULT 0.5,
        materials TEXT NOT NULL DEFAULT '{}',
        quests TEXT NOT NULL DEFAULT '[]'
      )
    `);

    // 2. Tabulka telemetrie
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS game_events_telemetry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        telemetry_theory TEXT NOT NULL
      )
    `);

    // 3. Tabulka zakúpených itemov (zbraní, nástrojov)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS player_items (
        id TEXT PRIMARY KEY,
        player_username TEXT NOT NULL REFERENCES players(username) ON DELETE CASCADE,
        item_key TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        durability INTEGER DEFAULT 100,
        unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Tabulka hex logov (RAM / swap adresáre)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS system_memory_registers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        register_address TEXT NOT NULL,
        hex_dump TEXT NOT NULL,
        description TEXT NOT NULL
      )
    `);

    // 5. Tabulka kombinatorických akcií a templátov
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS combinatorial_action_registry (
        id TEXT PRIMARY KEY,
        combo_name TEXT UNIQUE NOT NULL,
        card_combination TEXT NOT NULL,
        base_success_rate REAL NOT NULL,
        power_rating INTEGER NOT NULL,
        effects_json TEXT NOT NULL
      )
    `);

    // 6. Tabulka uzamknutých systémových registrov pre pasívne buffy
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS locked_system_registers (
        id TEXT PRIMARY KEY,
        player_username TEXT NOT NULL REFERENCES players(username) ON DELETE CASCADE,
        register_address TEXT NOT NULL UNIQUE,
        buff_type TEXT NOT NULL,
        buff_value REAL NOT NULL,
        locked_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. Tabulka procedurálnych kompozícií
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS procedural_compositions (
        id TEXT PRIMARY KEY,
        prompt TEXT NOT NULL,
        action_type TEXT NOT NULL,
        meta_id INTEGER NOT NULL,
        hex_id INTEGER NOT NULL,
        power_rating REAL NOT NULL,
        description TEXT,
        created_at INTEGER NOT NULL
      )
    `);
  }

  public saveComposition(inst: any): void {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO procedural_compositions (id, prompt, action_type, meta_id, hex_id, power_rating, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const id = inst.id || `comp_${Date.now()}`;
      stmt.run(
        id,
        inst.prompt || inst.tacticPrompt || 'stealth',
        inst.actionType,
        inst.coordinates?.meta ?? 0,
        inst.coordinates?.hex ?? 0,
        inst.powerRating ?? 1.0,
        inst.description || '',
        inst.timestamp || Date.now()
      );
    } catch (e) {
      console.error('[DB ERROR] Failed to save composition:', e);
    }
  }

  public getCompositions(): any[] {
    try {
      const stmt = this.db.prepare('SELECT * FROM procedural_compositions ORDER BY created_at DESC');
      const rows = stmt.all() as any[];
      return rows.map(r => ({
        id: r.id,
        prompt: r.prompt,
        actionType: r.action_type,
        coordinates: {
          meta: r.meta_id,
          hex: r.hex_id
        },
        powerRating: r.power_rating,
        description: r.description,
        timestamp: r.created_at
      }));
    } catch (e) {
      console.error('[DB ERROR] Failed to get compositions:', e);
      return [];
    }
  }

  public deleteComposition(id: string): void {
    try {
      const stmt = this.db.prepare('DELETE FROM procedural_compositions WHERE id = ?');
      stmt.run(id);
    } catch (e) {
      console.error('[DB ERROR] Failed to delete composition:', e);
    }
  }

  public getOrCreatePlayer(username: string, defaultHero: 'crystal' | 'toxic'): DBPlayerProfile {
    try {
      const selectStmt = this.db.prepare('SELECT * FROM players WHERE username = ?');
      const row = selectStmt.get(username) as any;

      if (row) {
        // DB stĺpce sú snake_case (max_health); profil používa camelCase.
        // Defaulty chránia pred historicky poškodenými riadkami (NULL hodnoty).
        return {
          id: row.id,
          username: row.username,
          level: row.level ?? 1,
          xp: row.xp ?? 0,
          maxHealth: row.max_health ?? 15,
          armor: row.armor ?? 0,
          luck: row.luck ?? 0.5,
          materials: row.materials ?? '{}',
          quests: row.quests ?? '[]'
        };
      }

      // Ak neexistuje, vytvoríme profil
      const id = `player_${username}_${Date.now()}`;
      const defaultMaterials = defaultHero === 'crystal' 
        ? JSON.stringify({ CrystalShard: 5, Spores: 0 })
        : JSON.stringify({ CrystalShard: 0, Spores: 5 });
        
      // Predvolené štartovacie questy pre uloženie
      const defaultQuests = JSON.stringify([
        {
          id: 'q_defeat_npcs',
          title: 'Lov na procesory',
          description: 'Poraz 2 NPC nepriateľské jednotky v Aréne.',
          objectiveType: 'DEFEAT_NPC',
          targetValue: 2,
          progress: 0,
          completed: false,
          xpReward: 120,
          materialReward: { type: defaultHero === 'crystal' ? 'CrystalShard' : 'Spores', amount: 5 }
        },
        {
          id: 'q_reach_swamp',
          title: 'Prieskum Toxických Hlbín',
          description: 'Vstúp na políčko Toxic Swamp na preskúmanie anomálie.',
          objectiveType: 'REACH_BIOME',
          targetValue: 1,
          targetName: 'TOXIC_SWAMP',
          progress: 0,
          completed: false,
          xpReward: 80,
          materialReward: { type: 'Spores', amount: 3 }
        }
      ]);

      const maxHealth = defaultHero === 'crystal' ? 15 : 12;

      const insertStmt = this.db.prepare(`
        INSERT INTO players (id, username, level, xp, max_health, armor, luck, materials, quests)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertStmt.run(id, username, 1, 0, maxHealth, 0, 0.5, defaultMaterials, defaultQuests);

      return {
        id,
        username,
        level: 1,
        xp: 0,
        maxHealth,
        armor: 0,
        luck: 0.5,
        materials: defaultMaterials,
        quests: defaultQuests
      };
    } catch (e) {
      console.error('[DB ERROR] getOrCreatePlayer failed:', e);
      // Return a safe fallback profile so the game doesn't crash
      return {
        id: `fallback_${username}`,
        username,
        level: 1,
        xp: 0,
        maxHealth: 15,
        armor: 0,
        luck: 0.5,
        materials: '{}',
        quests: '[]'
      };
    }
  }

  public savePlayerState(thread: Thread): boolean {
    if (thread.type !== 'PLAYER') return false;

    try {
      const updateStmt = this.db.prepare(`
        UPDATE players 
        SET level = ?, xp = ?, max_health = ?, armor = ?, luck = ?, materials = ?, quests = ?
        WHERE username = ?
      `);

      updateStmt.run(
        Number(thread.level) || 1,
        Number(thread.xp) || 0,
        Number(thread.maxHealth) || 15,
        Number(thread.armor) || 0,
        Number(thread.luck) || 0.5,
        JSON.stringify(thread.materials ?? {}),
        JSON.stringify(thread.quests ?? []),
        String(thread.name)
      );
      return true;
    } catch (e) {
      console.error(`[DB ERROR] Failed to save profile for ${thread.name}:`, e);
      return false;
    }
  }

  public logTelemetry(sessionId: string, eventType: string, theory: any): void {
    try {
      const insertStmt = this.db.prepare(`
        INSERT INTO game_events_telemetry (session_id, event_type, telemetry_theory)
        VALUES (?, ?, ?)
      `);
      // Cap serialized payload to 64KB to prevent runaway memory usage
      const serialized = JSON.stringify(theory);
      if (serialized.length > 65536) {
        console.warn(`[DB WARN] Telemetry payload truncated (${serialized.length} bytes) for session ${sessionId}`);
      }
      insertStmt.run(sessionId, eventType, serialized.slice(0, 65536));
    } catch (e) {
      console.error('[DB ERROR] Failed to log telemetry event:', e);
    }
  }

  public addPlayerItem(username: string, itemKey: string, category: string): void {
    try {
      const checkStmt = this.db.prepare('SELECT id, quantity FROM player_items WHERE player_username = ? AND item_key = ?');
      const existing = checkStmt.get(username, itemKey) as { id: string; quantity: number } | undefined;

      if (existing) {
        const updateStmt = this.db.prepare('UPDATE player_items SET quantity = quantity + 1 WHERE id = ?');
        updateStmt.run(existing.id);
      } else {
        const id = `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const insertStmt = this.db.prepare('INSERT INTO player_items (id, player_username, item_key, category) VALUES (?, ?, ?, ?)');
        insertStmt.run(id, username, itemKey, category);
      }
    } catch (e) {
      console.error('[DB ERROR] Failed to add player item:', e);
    }
  }

  public removePlayerItem(username: string, itemKey: string): boolean {
    try {
      const checkStmt = this.db.prepare('SELECT id, quantity FROM player_items WHERE player_username = ? AND item_key = ?');
      const existing = checkStmt.get(username, itemKey) as { id: string; quantity: number } | undefined;

      if (!existing) return false;

      if (existing.quantity > 1) {
        const updateStmt = this.db.prepare('UPDATE player_items SET quantity = quantity - 1 WHERE id = ?');
        updateStmt.run(existing.id);
      } else {
        const deleteStmt = this.db.prepare('DELETE FROM player_items WHERE id = ?');
        deleteStmt.run(existing.id);
      }
      return true;
    } catch (e) {
      console.error('[DB ERROR] Failed to remove player item:', e);
      return false;
    }
  }

  public getPlayerItems(username: string): { itemKey: string; category: string; quantity: number; durability: number }[] {
    try {
      const selectStmt = this.db.prepare('SELECT item_key as itemKey, category, quantity, durability FROM player_items WHERE player_username = ?');
      return selectStmt.all(username) as any[];
    } catch (e) {
      console.error('[DB ERROR] Failed to get player items:', e);
      return [];
    }
  }

  public saveMemoryRegister(address: string, hexDump: string, desc: string): void {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO system_memory_registers (timestamp, register_address, hex_dump, description)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(Date.now(), address, hexDump, desc);
    } catch (e) {
      console.error('[DB ERROR] Failed to save memory register:', e);
    }
  }

  public getMemoryRegisters(): { id: number; timestamp: number; register_address: string; hex_dump: string; description: string }[] {
    try {
      const stmt = this.db.prepare('SELECT * FROM system_memory_registers ORDER BY id DESC');
      return stmt.all() as any[];
    } catch (e) {
      console.error('[DB ERROR] Failed to get memory registers:', e);
      return [];
    }
  }

  public getAllPlayers(): any[] {
    try {
      const stmt = this.db.prepare('SELECT * FROM players ORDER BY created_at DESC');
      return stmt.all();
    } catch (e) {
      console.error('[DB ERROR] Failed to get all players:', e);
      return [];
    }
  }

  public lockRegister(username: string, address: string, buffType: string, buffValue: number): void {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO locked_system_registers (id, player_username, register_address, buff_type, buff_value)
        VALUES (?, ?, ?, ?, ?)
      `);
      const id = `lock_${Date.now()}`;
      stmt.run(id, username, address, buffType, buffValue);
    } catch (e) {
      console.error('[DB ERROR] Failed to lock register:', e);
    }
  }

  public getLockedRegisters(username: string): { register_address: string; buff_type: string; buff_value: number }[] {
    try {
      const stmt = this.db.prepare(`
        SELECT register_address, buff_type, buff_value 
        FROM locked_system_registers 
        WHERE player_username = ?
      `);
      return stmt.all(username) as any[];
    } catch (e) {
      console.error('[DB ERROR] Failed to get locked registers:', e);
      return [];
    }
  }
}
