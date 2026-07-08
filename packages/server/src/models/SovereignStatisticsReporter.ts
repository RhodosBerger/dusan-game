// packages/server/src/models/SovereignStatisticsReporter.ts
declare var require: any;
const { DatabaseSync } = require('node:sqlite');

export interface GameSpecsStatistics {
  playerCount: number;
  averagePlayerLevel: number;
  totalTelemetryEvents: number;
  telemetryBreakdown: { event_type: string; count: number }[];
  totalPlayerItems: number;
  totalMemoryRegisters: number;
  generatedAt: string;
}

export class SovereignStatisticsReporter {
  private static db: any;

  private static initDb() {
    if (!this.db) {
      this.db = new DatabaseSync('./database.db');
    }
  }

  /**
   * Generates a statistics report from the live database.
   */
  public static generateStatisticsReport(): GameSpecsStatistics {
    this.initDb();

    // 1. Players count
    const pCountRow = this.db.prepare('SELECT COUNT(*) as count FROM players').get();
    const playerCount = pCountRow ? Number(pCountRow.count) : 0;

    // 2. Average player level
    const avgLevelRow = this.db.prepare('SELECT AVG(level) as avg_level FROM players').get();
    const averagePlayerLevel = avgLevelRow && avgLevelRow.avg_level ? parseFloat(avgLevelRow.avg_level) : 1.0;

    // 3. Telemetry events count
    const tCountRow = this.db.prepare('SELECT COUNT(*) as count FROM game_events_telemetry').get();
    const totalTelemetryEvents = tCountRow ? Number(tCountRow.count) : 0;

    // 4. Telemetry events breakdown
    let telemetryBreakdown: { event_type: string; count: number }[] = [];
    try {
      telemetryBreakdown = this.db.prepare('SELECT event_type, COUNT(*) as count FROM game_events_telemetry GROUP BY event_type').all() as any[];
    } catch (e) {
      telemetryBreakdown = [];
    }

    // 5. Total player items
    const piCountRow = this.db.prepare('SELECT COUNT(*) as count FROM player_items').get();
    const totalPlayerItems = piCountRow ? Number(piCountRow.count) : 0;

    // 6. Total system memory registers
    const mrCountRow = this.db.prepare('SELECT COUNT(*) as count FROM system_memory_registers').get();
    const totalMemoryRegisters = mrCountRow ? Number(mrCountRow.count) : 0;

    return {
      playerCount,
      averagePlayerLevel,
      totalTelemetryEvents,
      telemetryBreakdown,
      totalPlayerItems,
      totalMemoryRegisters,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Compiles the statistics report into a beautifully formatted Markdown report.
   */
  public static compileMarkdownReport(stats: GameSpecsStatistics): string {
    let breakdownMd = '';
    for (const item of stats.telemetryBreakdown) {
      breakdownMd += `- **${item.event_type}**: ${item.count} occurrences\n`;
    }
    if (stats.telemetryBreakdown.length === 0) {
      breakdownMd = '- *No telemetry records found.*\n';
    }

    return `# Sovereign Engine - Live Game Specs & Statistics Report

This report was generated dynamically from the SQLite persistent database.

## System Performance & Memory Registers
- **Total Registered Memory Blocks**: ${stats.totalMemoryRegisters} registers
- **Telemetry Event Registry Entries**: ${stats.totalTelemetryEvents} records
- **Total Player Items Purchased**: ${stats.totalPlayerItems} items

## Player & Combat Demographics
- **Registered Player Accounts**: ${stats.playerCount}
- **Average Character Level**: ${stats.averagePlayerLevel.toFixed(2)}

## Database Telemetry Breakdown
${breakdownMd}

---
*Generated At: ${stats.generatedAt}*
`;
  }
}
