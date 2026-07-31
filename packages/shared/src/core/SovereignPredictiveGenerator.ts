export interface PredictionOutput {
  state: string;
  height: number;
  colorHex: string;
  verb: string;
}

export interface ImpactLog {
  session: string;
  verb: string;
  impact: any;
  timestamp: number;
}

export class SovereignPredictiveGenerator {
  private static impactLogs: ImpactLog[] = [];

  private static STATES = ['COMPILING', 'TESTING', 'OPTIMIZING', 'INSPECTING', 'DEPLOYED'];
  private static COLORS = [
    '#22D3EE', // Cyan (Compiling)
    '#EAB308', // Yellow (Testing)
    '#A855F7', // Purple (Optimizing)
    '#10B981', // Green (Inspecting)
    '#EF4444'  // Red (Deployed)
  ];
  private static HEIGHTS = [0.8, 1.4, 2.0, 1.2, 0.4];

  /**
   * Deterministically predicts next state using bitwise operations on coordinates and verb hash.
   */
  public static predictNextState(meta: number, hex: number, verb: string): PredictionOutput {
    let verbHash = 0;
    for (let i = 0; i < verb.length; i++) {
      verbHash = (verbHash << 5) - verbHash + verb.charCodeAt(i);
      verbHash |= 0; // Convert to 32bit integer
    }

    // Binary delegated deterministic hash calculation
    const key = Math.abs((meta ^ hex ^ verbHash)) % this.STATES.length;

    return {
      state: this.STATES[key],
      height: this.HEIGHTS[key],
      colorHex: this.COLORS[key],
      verb
    };
  }

  /**
   * Performs quick in-memory writes to the solid-state impact log.
   */
  public static writeImpactLog(session: string, verb: string, impact: any): void {
    this.impactLogs.push({
      session,
      verb,
      impact,
      timestamp: Date.now()
    });

    // Cap the logs length to prevent infinite growth
    if (this.impactLogs.length > 500) {
      this.impactLogs.shift();
    }
  }

  /**
   * Retrieves all logged impacts.
   */
  public static getImpactLogs(): ImpactLog[] {
    return this.impactLogs;
  }

  /**
   * Clears the impact log memory.
   */
  public static clearImpactLogs(): void {
    this.impactLogs = [];
  }
}
