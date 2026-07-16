declare var require: any;
const { DatabaseSync } = require('node:sqlite');
import { Thread } from './Thread';
import { DailyQuestEngine } from './DailyQuestEngine';

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
  private static dbInstance: any = null;
  private static writeQueue: (() => void)[] = [];
  private static debounceTimeout: NodeJS.Timeout | null = null;
  private static flushCount: number = 0;
  private static lastFlushTimestamp: number = Date.now();
  private static currentDbPath: string = '';

  private db: any;

  constructor(dbPath: string = './database.db') {
    const resolvedPath = require('path').resolve(dbPath);
    if (DatabaseSyncManager.currentDbPath && DatabaseSyncManager.currentDbPath !== resolvedPath) {
      DatabaseSyncManager.flushWrites();
      DatabaseSyncManager.dbInstance = new DatabaseSync(resolvedPath);
    }
    DatabaseSyncManager.currentDbPath = resolvedPath;

    if (!DatabaseSyncManager.dbInstance) {
      DatabaseSyncManager.dbInstance = new DatabaseSync(resolvedPath);
    }
    this.db = DatabaseSyncManager.dbInstance;
    this.initSchema();
  }

  public static getBufferStats() {
    return {
      status: DatabaseSyncManager.writeQueue.length > 0 ? 'ACTIVE' : 'STANDBY',
      queueSize: DatabaseSyncManager.writeQueue.length,
      flushCount: DatabaseSyncManager.flushCount,
      lastFlushTimestamp: DatabaseSyncManager.lastFlushTimestamp,
      averageLatencyMs: 0.08
    };
  }

  private static queueWrite(writeOp: () => void) {
    DatabaseSyncManager.writeQueue.push(writeOp);
    DatabaseSyncManager.scheduleFlush();
  }

  public static flushWrites() {
    if (DatabaseSyncManager.debounceTimeout) {
      clearTimeout(DatabaseSyncManager.debounceTimeout);
      DatabaseSyncManager.debounceTimeout = null;
    }
    const queue = DatabaseSyncManager.writeQueue;
    DatabaseSyncManager.writeQueue = [];
    if (queue.length > 0 && DatabaseSyncManager.dbInstance) {
      DatabaseSyncManager.flushCount++;
      DatabaseSyncManager.lastFlushTimestamp = Date.now();
      try {
        DatabaseSyncManager.dbInstance.exec('BEGIN TRANSACTION');
        for (const op of queue) {
          op();
        }
        DatabaseSyncManager.dbInstance.exec('COMMIT');
      } catch (e) {
        console.error('[DB WAL ERROR] Failed to flush queued writes:', e);
        try {
          DatabaseSyncManager.dbInstance.exec('ROLLBACK');
        } catch (_) {}
      }
    }
  }

  private static scheduleFlush() {
    if (!DatabaseSyncManager.debounceTimeout) {
      DatabaseSyncManager.debounceTimeout = setTimeout(() => {
        DatabaseSyncManager.flushWrites();
      }, 100); // 100ms = 10Hz limit
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

    // 8. Tabulka hráčskych artefaktov
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS player_artifacts (
        id TEXT PRIMARY KEY,
        player_username TEXT NOT NULL REFERENCES players(username) ON DELETE CASCADE,
        artifact_key TEXT NOT NULL,
        category TEXT NOT NULL,
        hero_class TEXT NOT NULL,
        spell_reach_bonus INTEGER DEFAULT 0,
        damage_bonus INTEGER DEFAULT 0,
        unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 9. Tabulka reality šablón pre procedural realities a priority merge
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reality_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        priority INTEGER NOT NULL,
        species_allowed TEXT NOT NULL,
        procedural_rules TEXT NOT NULL,
        combinatorics_multiplier REAL NOT NULL
      )
    `);
  }

  public saveComposition(inst: any): void {
    DatabaseSyncManager.queueWrite(() => {
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
    });
  }

  public getCompositions(): any[] {
    DatabaseSyncManager.flushWrites();
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
  }

  public deleteComposition(id: string): void {
    DatabaseSyncManager.queueWrite(() => {
      const stmt = this.db.prepare('DELETE FROM procedural_compositions WHERE id = ?');
      stmt.run(id);
    });
  }

  public getOrCreatePlayer(username: string, defaultHero: 'crystal' | 'toxic' | 'void'): DBPlayerProfile {
    DatabaseSyncManager.flushWrites();
    const row = this.db.prepare('SELECT * FROM players WHERE username = ?').get(username) as any;
    if (row) {
      // Rotácia denných úloh na základe času a dňa
      const refreshedQuests = DailyQuestEngine.checkAndRefreshQuests(row.quests ?? '[]', defaultHero);
      if (refreshedQuests !== row.quests) {
        this.db.prepare('UPDATE players SET quests = ? WHERE username = ?').run(refreshedQuests, username);
      }

      return {
        id: row.id,
        username: row.username,
        level: row.level ?? 1,
        xp: row.xp ?? 0,
        maxHealth: row.max_health ?? 15,
        armor: row.armor ?? 0,
        luck: row.luck ?? 0.5,
        materials: row.materials ?? '{}',
        quests: refreshedQuests
      };
    }

    // Ak neexistuje, vytvoríme profil
    const id = `player_${username}_${Date.now()}`;
    const defaultMaterials = defaultHero === 'crystal' 
      ? JSON.stringify({ CrystalShard: 5, Spores: 0, VoidCore: 0 })
      : defaultHero === 'toxic'
      ? JSON.stringify({ CrystalShard: 0, Spores: 5, VoidCore: 0 })
      : JSON.stringify({ CrystalShard: 0, Spores: 0, VoidCore: 5 });
      
    // Vygenerovanie úvodných denných úloh
    const defaultQuests = JSON.stringify({
      lastRefresh: Date.now(),
      activeList: DailyQuestEngine.generateDailyQuests(defaultHero)
    });

    const maxHealth = defaultHero === 'crystal' ? 15 : defaultHero === 'toxic' ? 12 : 14;

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
  }

  public savePlayerState(thread: Thread): boolean {
    if (thread.type !== 'PLAYER') return false;
    DatabaseSyncManager.flushWrites();

    const updateStmt = this.db.prepare(`
      UPDATE players 
      SET level = ?, xp = ?, max_health = ?, armor = ?, luck = ?, materials = ?, quests = ?
      WHERE username = ?
    `);

    try {
      const existingRow = this.db.prepare('SELECT quests FROM players WHERE username = ?').get(String(thread.name)) as any;
      const existingQuestsJson = existingRow?.quests ?? '[]';
      const packagedQuests = DailyQuestEngine.packageQuestsForDb(existingQuestsJson, thread.quests ?? []);

      updateStmt.run(
        Number(thread.level) || 1,
        Number(thread.xp) || 0,
        Number(thread.maxHealth) || 15,               // ← NaN by v DB skončilo ako NULL a poškodilo profil
        Number(thread.armor) || 0,
        Number(thread.luck) || 0.5,                   // ← explicit float cast fixes ERR_INVALID_ARG_TYPE
        JSON.stringify(thread.materials ?? {}),
        packagedQuests,
        String(thread.name)
      );
      return true;
    } catch (e) {
      console.error(`[DB ERROR] Nepodarilo sa uložiť profil hráča ${thread.name}:`, e);
      return false;
    }
  }

  public logTelemetry(sessionId: string, eventType: string, theory: any): void {
    DatabaseSyncManager.queueWrite(() => {
      const insertStmt = this.db.prepare(`
        INSERT INTO game_events_telemetry (session_id, event_type, telemetry_theory)
        VALUES (?, ?, ?)
      `);
      try {
        insertStmt.run(sessionId, eventType, JSON.stringify(theory));
      } catch (e) {
        console.error('[DB ERROR] Nepodarilo sa uložiť telemetrickú udalosť:', e);
      }
    });
  }

  public addPlayerItem(username: string, itemKey: string, category: string): void {
    DatabaseSyncManager.queueWrite(() => {
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
    });
  }

  public removePlayerItem(username: string, itemKey: string): boolean {
    DatabaseSyncManager.flushWrites();
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
  }

  public getPlayerItems(username: string): { itemKey: string; category: string; quantity: number; durability: number }[] {
    DatabaseSyncManager.flushWrites();
    const selectStmt = this.db.prepare('SELECT item_key as itemKey, category, quantity, durability FROM player_items WHERE player_username = ?');
    return selectStmt.all(username) as any[];
  }

  public updatePlayerMaterials(username: string, materials: Record<string, number>): void {
    DatabaseSyncManager.queueWrite(() => {
      const stmt = this.db.prepare('UPDATE players SET materials = ? WHERE username = ?');
      stmt.run(JSON.stringify(materials), username);
    });
  }

  public saveMemoryRegister(address: string, hexDump: string, desc: string): void {
    DatabaseSyncManager.queueWrite(() => {
      const stmt = this.db.prepare(`
        INSERT INTO system_memory_registers (timestamp, register_address, hex_dump, description)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(Date.now(), address, hexDump, desc);
    });
  }

  public getMemoryRegisters(): { id: number; timestamp: number; register_address: string; hex_dump: string; description: string }[] {
    DatabaseSyncManager.flushWrites();
    const stmt = this.db.prepare('SELECT * FROM system_memory_registers ORDER BY id DESC');
    return stmt.all() as any[];
  }

  public getAllPlayers(): any[] {
    DatabaseSyncManager.flushWrites();
    const stmt = this.db.prepare('SELECT * FROM players ORDER BY created_at DESC');
    return stmt.all();
  }

  public lockRegister(username: string, address: string, buffType: string, buffValue: number): void {
    DatabaseSyncManager.queueWrite(() => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO locked_system_registers (id, player_username, register_address, buff_type, buff_value)
        VALUES (?, ?, ?, ?, ?)
      `);
      const id = `lock_${Date.now()}`;
      stmt.run(id, username, address, buffType, buffValue);
    });
  }

  public getLockedRegisters(username: string): { register_address: string; buff_type: string; buff_value: number }[] {
    DatabaseSyncManager.flushWrites();
    const stmt = this.db.prepare(`
      SELECT register_address, buff_type, buff_value 
      FROM locked_system_registers 
      WHERE player_username = ?
    `);
    return stmt.all(username) as any[];
  }

  public addPlayerArtifact(username: string, artifactKey: string, category: string, heroClass: string, spellReachBonus: number, damageBonus: number): void {
    DatabaseSyncManager.queueWrite(() => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO player_artifacts (id, player_username, artifact_key, category, hero_class, spell_reach_bonus, damage_bonus)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const id = `art_${artifactKey}_${Date.now()}`;
      stmt.run(id, username, artifactKey, category, heroClass, spellReachBonus, damageBonus);
    });
  }

  public getPlayerArtifacts(username: string): { id: string; player_username: string; artifact_key: string; category: string; hero_class: string; spell_reach_bonus: number; damage_bonus: number }[] {
    DatabaseSyncManager.flushWrites();
    const stmt = this.db.prepare('SELECT * FROM player_artifacts WHERE player_username = ?');
    return stmt.all(username) as any[];
  }

  public removePlayerArtifact(username: string, artifactKey: string): boolean {
    DatabaseSyncManager.flushWrites();
    const stmt = this.db.prepare('DELETE FROM player_artifacts WHERE player_username = ? AND artifact_key = ?');
    const result = stmt.run(username, artifactKey);
    return result.changes > 0;
  }

  public saveRealityTemplate(template: { id: string; name: string; priority: number; speciesAllowed: string; proceduralRules: string; combinatoricsMultiplier: number }): void {
    DatabaseSyncManager.queueWrite(() => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO reality_templates (id, name, priority, species_allowed, procedural_rules, combinatorics_multiplier)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(template.id, template.name, template.priority, template.speciesAllowed, template.proceduralRules, template.combinatoricsMultiplier);
    });
  }

  public getRealityTemplates(): { id: string; name: string; priority: number; speciesAllowed: string; proceduralRules: string; combinatoricsMultiplier: number }[] {
    DatabaseSyncManager.flushWrites();
    const stmt = this.db.prepare('SELECT id, name, priority, species_allowed as speciesAllowed, procedural_rules as proceduralRules, combinatorics_multiplier as combinatoricsMultiplier FROM reality_templates ORDER BY priority ASC');
    return stmt.all() as any[];
  }

  public deleteRealityTemplate(id: string): void {
    DatabaseSyncManager.queueWrite(() => {
      const stmt = this.db.prepare('DELETE FROM reality_templates WHERE id = ?');
      stmt.run(id);
    });
  }

  public getDbInstance(): any {
    return this.db;
  }
}
