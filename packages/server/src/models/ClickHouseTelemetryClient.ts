// packages/server/src/models/ClickHouseTelemetryClient.ts
declare var require: any;
declare var process: any;
const fs = require('fs');
const path = require('path');

export interface ClickHouseVisionEvent {
  session_id: string;
  fps: number;
  latency_ms: number;
  defect_class: number;
  confidence: number;
  timestamp: number;
}

export interface ClickHouseCombatEvent {
  match_id: string;
  player_id: string;
  card_id: string;
  voltage: number;
  current: number;
  timestamp: number;
}

export interface ClickHouseShortCircuitEvent {
  sector_id: string;
  voltage: number;
  resistance: number;
  current_load: number;
  timestamp: number;
}

export class ClickHouseTelemetryClient {
  private static clickhouseUrl = (process.env && process.env.CLICKHOUSE_URL) || 'http://localhost:8123';
  private static fallbackPath = (process.env && process.env.CLICKHOUSE_FALLBACK_PATH) ||
    require('path').join(require('os').tmpdir(), 'sovereign-engine', 'clickhouse_fallback.jsonl');
  
  private static visionBuffer: ClickHouseVisionEvent[] = [];
  private static combatBuffer: ClickHouseCombatEvent[] = [];
  private static shortCircuitBuffer: ClickHouseShortCircuitEvent[] = [];
  
  private static isInitialized = false;

  /**
   * Initializes the ClickHouse database connection and runs baseline DDL schemas.
   */
  public static async init(): Promise<void> {
    if (this.isInitialized) return;
    
    // Ensure scratch fallback directory exists
    const dir = path.dirname(this.fallbackPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    console.log(`[CLICKHOUSE] Connecting to ClickHouse instance at: ${this.clickhouseUrl}`);
    
    // Baseline MergeTree telemetry schemas
    const schemas = [
      `CREATE TABLE IF NOT EXISTS vision_telemetry (
        session_id String,
        fps Float32,
        latency_ms Float32,
        defect_class UInt8,
        confidence Float32,
        timestamp UInt64
      ) ENGINE = MergeTree() ORDER BY (timestamp, session_id)`,
      
      `CREATE TABLE IF NOT EXISTS combat_telemetry (
        match_id String,
        player_id String,
        card_id String,
        voltage Float32,
        current Float32,
        timestamp UInt64
      ) ENGINE = MergeTree() ORDER BY (timestamp, match_id, player_id)`,
      
      `CREATE TABLE IF NOT EXISTS short_circuit_telemetry (
        sector_id String,
        voltage Float32,
        resistance Float32,
        current_load Float32,
        timestamp UInt64
      ) ENGINE = MergeTree() ORDER BY (timestamp, sector_id)`
    ];

    for (const schema of schemas) {
      try {
        await this.query(schema);
      } catch (err: any) {
        console.warn(`[CLICKHOUSE WARN] Schema creation failed: ${err.message}. Defaulting to JSONL fallback.`);
      }
    }
    
    // Start automated batch writing loop (every 5 seconds)
    const interval: any = setInterval(() => this.flushAll(), 5000);
    if (interval && typeof interval.unref === 'function') {
      interval.unref();
    }
    this.isInitialized = true;
  }

  /**
   * Helper to execute SQL queries on the ClickHouse HTTP server interface.
   */
  private static async query(sql: string): Promise<string> {
    const res = await fetch(`${this.clickhouseUrl}/`, {
      method: 'POST',
      body: sql,
      timeout: 1500
    } as any);
    if (!res.ok) {
      throw new Error(`ClickHouse HTTP status: ${res.status}`);
    }
    return res.text();
  }

  /**
   * Log vision telemetry events to the buffer pool.
   */
  public static logVision(event: ClickHouseVisionEvent): void {
    this.visionBuffer.push(event);
    if (this.visionBuffer.length >= 50) this.flushVision();
  }

  /**
   * Log combat telemetry events to the buffer pool.
   */
  public static logCombat(event: ClickHouseCombatEvent): void {
    this.combatBuffer.push(event);
    if (this.combatBuffer.length >= 50) this.flushCombat();
  }

  /**
   * Log grid short-circuit events to the buffer pool.
   */
  public static logShortCircuit(event: ClickHouseShortCircuitEvent): void {
    this.shortCircuitBuffer.push(event);
    if (this.shortCircuitBuffer.length >= 50) this.flushShortCircuit();
  }

  /**
   * Flushes all active telemetry buffers.
   */
  public static async flushAll(): Promise<void> {
    await Promise.all([
      this.flushVision(),
      this.flushCombat(),
      this.flushShortCircuit()
    ]);
  }

  private static async flushVision(): Promise<void> {
    if (this.visionBuffer.length === 0) return;
    const batch = [...this.visionBuffer];
    this.visionBuffer = [];

    // ClickHouse batch SQL insertion format: INSERT INTO table VALUES (...), (...)
    const values = batch.map(e => 
      `('${e.session_id.replace(/'/g, "\\'")}', ${e.fps}, ${e.latency_ms}, ${e.defect_class}, ${e.confidence}, ${e.timestamp})`
    ).join(',');
    const sql = `INSERT INTO vision_telemetry VALUES ${values}`;

    try {
      await this.query(sql);
      console.log(`[CLICKHOUSE] Successfully flushed ${batch.length} vision telemetry logs.`);
    } catch (err: any) {
      this.writeToFallback('VISION', batch);
    }
  }

  private static async flushCombat(): Promise<void> {
    if (this.combatBuffer.length === 0) return;
    const batch = [...this.combatBuffer];
    this.combatBuffer = [];

    const values = batch.map(e => 
      `('${e.match_id.replace(/'/g, "\\'")}', '${e.player_id.replace(/'/g, "\\'")}', '${e.card_id.replace(/'/g, "\\'")}', ${e.voltage}, ${e.current}, ${e.timestamp})`
    ).join(',');
    const sql = `INSERT INTO combat_telemetry VALUES ${values}`;

    try {
      await this.query(sql);
      console.log(`[CLICKHOUSE] Successfully flushed ${batch.length} combat telemetry logs.`);
    } catch (err: any) {
      this.writeToFallback('COMBAT', batch);
    }
  }

  private static async flushShortCircuit(): Promise<void> {
    if (this.shortCircuitBuffer.length === 0) return;
    const batch = [...this.shortCircuitBuffer];
    this.shortCircuitBuffer = [];

    const values = batch.map(e => 
      `('${e.sector_id.replace(/'/g, "\\'")}', ${e.voltage}, ${e.resistance}, ${e.current_load}, ${e.timestamp})`
    ).join(',');
    const sql = `INSERT INTO short_circuit_telemetry VALUES ${values}`;

    try {
      await this.query(sql);
      console.log(`[CLICKHOUSE] Successfully flushed ${batch.length} short-circuit logs.`);
    } catch (err: any) {
      this.writeToFallback('SHORT_CIRCUIT', batch);
    }
  }

  /**
   * Writes data payloads to the local JSONL fallback file when ClickHouse is unreachable.
   */
  private static writeToFallback(type: string, batch: any[]): void {
    const time = Date.now();
    const lines = batch.map(item => JSON.stringify({ type, data: item, persistedAt: time })).join('\n') + '\n';
    try {
      fs.appendFileSync(this.fallbackPath, lines, 'utf8');
      console.log(`[CLICKHOUSE FALLBACK] Written ${batch.length} ${type} telemetry records to local JSONL dump.`);
    } catch (err: any) {
      console.error(`[CLICKHOUSE CRITICAL] Fallback file write failed: ${err.message}`);
    }
  }

  /**
   * Cleans/deletes the fallback log file. Used mainly for unit tests.
   */
  public static clearFallbackFile(): void {
    if (fs.existsSync(this.fallbackPath)) {
      fs.unlinkSync(this.fallbackPath);
    }
  }

  /**
   * Reads and parses all entries in the fallback log file. Used mainly for unit tests.
   */
  public static readFallbackFile(): any[] {
    if (!fs.existsSync(this.fallbackPath)) return [];
    const content = fs.readFileSync(this.fallbackPath, 'utf8');
    return content.trim().split('\n').filter((line: string) => line.length > 0).map((line: string) => JSON.parse(line));
  }
}
