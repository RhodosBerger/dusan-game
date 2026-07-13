import { DatabaseSyncManager } from '../models/DatabaseSyncManager';

export interface TelemetrySummary {
    sessionId: string;
    totalEvents: number;
    eventsByType: Record<string, number>;
}

export interface StressSectorsReport {
    sectorCount: number;
    highStressSectors: { macroId: number; subId: number; hazardIndex: number }[];
}

export class TelemetryBigQueryService {
    private dbSync: DatabaseSyncManager;

    constructor(dbSync: DatabaseSyncManager) {
        this.dbSync = dbSync;
    }

    /**
     * Record a telemetry event into the SQLite database
     */
    public logEvent(sessionId: string, eventType: string, theoryData: Record<string, any>): void {
        const db = this.dbSync.getDbInstance();
        const stmt = db.prepare(`
            INSERT INTO game_events_telemetry (session_id, event_type, telemetry_theory)
            VALUES (?, ?, ?)
        `);
        stmt.run(sessionId, eventType, JSON.stringify(theoryData));
    }

    /**
     * Aggregates turns, action point spenditure, and types of logs (Big Data Query Simulation)
     */
    public getSummary(sessionId: string): TelemetrySummary {
        const db = this.dbSync.getDbInstance();
        const stmt = db.prepare(`
            SELECT event_type, COUNT(*) as cnt 
            FROM game_events_telemetry 
            WHERE session_id = ? 
            GROUP BY event_type
        `);
        const rows = stmt.all(sessionId) as { event_type: string; cnt: number }[];

        let total = 0;
        const eventsByType: Record<string, number> = {};
        rows.forEach(r => {
            eventsByType[r.event_type] = r.cnt;
            total += r.cnt;
        });

        return {
            sessionId,
            totalEvents: total,
            eventsByType
        };
    }

    /**
     * Senior Algebra Query: Find sectors/hex nodes where hazard stress index exceeds 0.7
     */
    public getHighStressSectors(sessionId: string): StressSectorsReport {
        const db = this.dbSync.getDbInstance();
        
        // Fetch telemetry events representing terrain stress updates
        const stmt = db.prepare(`
            SELECT telemetry_theory 
            FROM game_events_telemetry 
            WHERE session_id = ? AND event_type = 'terrain_stress_update'
        `);
        const rows = stmt.all(sessionId) as { telemetry_theory: string }[];

        const highStressSectors: { macroId: number; subId: number; hazardIndex: number }[] = [];

        rows.forEach(r => {
            try {
                const data = JSON.parse(r.telemetry_theory);
                // Ensure data has the required layout block shape
                if (data && Array.isArray(data.blocks)) {
                    data.blocks.forEach((b: any) => {
                        if (typeof b.hazard_index === 'number' && b.hazard_index >= 0.7) {
                            highStressSectors.push({
                                macroId: b.macro_index || 0,
                                subId: b.sub_index || 0,
                                hazardIndex: b.hazard_index
                            });
                        }
                    });
                }
            } catch (e) {
                // Ignore parse failures
            }
        });

        return {
            sectorCount: highStressSectors.length,
            highStressSectors
        };
    }
}
