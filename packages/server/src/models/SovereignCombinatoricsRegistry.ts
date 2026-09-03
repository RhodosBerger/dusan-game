// packages/server/src/models/SovereignCombinatoricsRegistry.ts
declare var require: any;
const { DatabaseSync } = require('node:sqlite');

export interface CombinatorialCombo {
  id: string;
  combo_name: string;
  card_combination: string[]; // parsed from JSON
  base_success_rate: number;
  power_rating: number;
  effects: any; // parsed from JSON
}

export class SovereignCombinatoricsRegistry {
  private static db: any;

  private static initDb() {
    if (!this.db) {
      this.db = new DatabaseSync('./database.db');
      this.prepopulateBaselineCombos();
    }
  }

  private static prepopulateBaselineCombos() {
    this.registerCombo(
      'Aetheric Current Burst',
      ['voltage_surge', 'charge'],
      0.95,
      15,
      { damageBonus: 4, systemEnergyDelta: 12.0, status: 'slowed', animation: 'lightning_strike' }
    );
    this.registerCombo(
      'Earthen Wall Shield',
      ['shield', 'grow'],
      0.90,
      10,
      { armorBonus: 5, status: 'none', healAmount: 3, animation: 'stone_barrier' }
    );
    this.registerCombo(
      'Glacial Drift Freeze',
      ['nature', 'shield'],
      0.85,
      12,
      { damageBonus: 2, status: 'rooted', animation: 'frost_burst' }
    );
    this.registerCombo(
      'Blizzard Avalanche',
      ['snowball', 'iceMeteor'],
      0.88,
      22,
      { damageBonus: 5, status: 'slowed', animation: 'frost_burst' }
    );
    this.registerCombo(
      'Viper\'s Kiss Detonation',
      ['snakeAttack', 'snakeBomb'],
      0.92,
      20,
      { damageBonus: 6, status: 'disarmed', animation: 'lightning_strike' }
    );
    this.registerCombo(
      'Void Singularity Overload',
      ['voidBolt', 'voidErosion'],
      0.90,
      25,
      { damageBonus: 8, status: 'none', animation: 'lightning_strike', entropyDelta: 0.15 }
    );
    this.registerCombo(
      'Phase Rift Escape',
      ['entropyShield', 'voidGate'],
      0.94,
      14,
      { armorBonus: 3, status: 'none', animation: 'frost_burst' }
    );
  }

  /**
   * Registers a unique combination in the persistent database.
   */
  public static registerCombo(
    name: string,
    cards: string[],
    successRate: number,
    power: number,
    effects: any
  ): void {
    this.initDb();
    const id = `combo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const cardsJson = JSON.stringify(cards.sort());
    const effectsJson = JSON.stringify(effects);

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO combinatorial_action_registry (id, combo_name, card_combination, base_success_rate, power_rating, effects_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    try {
      stmt.run(id, name, cardsJson, successRate, power, effectsJson);
    } catch (e) {
      console.error('[DB ERROR] Failed to register combo template:', e);
    }
  }

  /**
   * Retrieves a combo by name.
   */
  public static getCombo(name: string): CombinatorialCombo | null {
    this.initDb();
    const stmt = this.db.prepare('SELECT * FROM combinatorial_action_registry WHERE combo_name = ?');
    const row = stmt.get(name) as any;
    if (!row) return null;

    return {
      id: row.id,
      combo_name: row.combo_name,
      card_combination: JSON.parse(row.card_combination),
      base_success_rate: row.base_success_rate,
      power_rating: row.power_rating,
      effects: JSON.parse(row.effects_json)
    };
  }

  /**
   * Lists all registered combos.
   */
  public static listAllCombos(): CombinatorialCombo[] {
    this.initDb();
    const stmt = this.db.prepare('SELECT * FROM combinatorial_action_registry');
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      id: row.id,
      combo_name: row.combo_name,
      card_combination: JSON.parse(row.card_combination),
      base_success_rate: row.base_success_rate,
      power_rating: row.power_rating,
      effects: JSON.parse(row.effects_json)
    }));
  }

  /**
   * Matches played cards against the database of combinatorics, ignoring order.
   */
  public static detectComboPlayed(playedCards: string[]): CombinatorialCombo | null {
    this.initDb();
    const sortedPlayed = JSON.stringify(playedCards.sort());
    
    const stmt = this.db.prepare('SELECT * FROM combinatorial_action_registry');
    const rows = stmt.all() as any[];

    for (const row of rows) {
      if (row.card_combination === sortedPlayed) {
        return {
          id: row.id,
          combo_name: row.combo_name,
          card_combination: JSON.parse(row.card_combination),
          base_success_rate: row.base_success_rate,
          power_rating: row.power_rating,
          effects: JSON.parse(row.effects_json)
        };
      }
    }
    return null;
  }
}
