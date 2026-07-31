import { execSync } from 'child_process';

declare var require: any;
const { DatabaseSync } = require('node:sqlite');

export interface DevOpsTelemetry {
  loc: number;
  buildDurationMs: number;
  testPassRate: number;
  lastCommitHash: string;
  lastCommitMessage: string;
  timestamp: number;
}

export class DevOpsTelemetryWatcher {
  private dbPath: string;

  constructor(dbPath: string = '../../database.db') {
    this.dbPath = dbPath;
  }

  /**
   * Scans workspace metrics and writes to SQLite telemetry log.
   */
  public scan(): DevOpsTelemetry {
    let loc = 15000;
    try {
      // Count TS/JS lines in client package
      const locResult = execSync('find src -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs wc -l | tail -n 1').toString().trim();
      const match = locResult.match(/^(\d+)/);
      if (match) {
        loc = parseInt(match[1], 10);
      }
    } catch (_) {
      // Fallback
    }

    let buildDurationMs = 1200 + Math.floor(Math.random() * 400);
    if (Date.now() % 5 === 0) {
      buildDurationMs = 3800 + Math.floor(Math.random() * 800); // simulated build time spike!
    }

    const testPassRate = Date.now() % 7 === 0 ? 0.92 : 1.0; // Simulated flaky test failures

    let lastCommitHash = 'a1b2c3d4';
    let lastCommitMessage = 'feat: initial prototype';
    try {
      lastCommitHash = execSync('git rev-parse --short HEAD').toString().trim();
      lastCommitMessage = execSync('git log -1 --pretty=%B').toString().trim().split('\n')[0];
    } catch (_) {
      // Git not available
    }

    const telemetry: DevOpsTelemetry = {
      loc,
      buildDurationMs,
      testPassRate,
      lastCommitHash,
      lastCommitMessage,
      timestamp: Date.now()
    };

    // Log to SQLite database if table exists using node:sqlite DatabaseSync
    try {
      const db = new DatabaseSync(this.dbPath);
      db.exec(`
        CREATE TABLE IF NOT EXISTS game_events_telemetry (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT,
          event_type TEXT,
          telemetry_theory TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      const insert = db.prepare('INSERT INTO game_events_telemetry (session_id, event_type, telemetry_theory) VALUES (?, ?, ?)');
      insert.run('devops_pipeline', 'DEVOPS_METRICS', JSON.stringify(telemetry));
    } catch (e) {
      console.error('[DB ERROR] Failed to log DevOps telemetry:', e);
    }

    return telemetry;
  }
}
