/**
 * SovereignLeaderboardEvaluator evaluates match telemetry, averages success rates against
 * NPCs, AI (Sovereign AI), and Real Players, and translates them into progress bar percentages.
 */
export interface RawLeaderboardData {
  playerId: string;
  stepsTaken: number;
  npcWins: number;
  npcMatches: number;
  aiWins: number;
  aiMatches: number;
  playerWins: number;
  playerMatches: number;
}

export interface EvaluatedLeaderboardEntry {
  playerId: string;
  stepsTaken: number;
  npcSuccessRate: number;    // 0 to 1
  aiSuccessRate: number;     // 0 to 1
  playerSuccessRate: number; // 0 to 1
  
  // Progress bar percentages (0% to 100%)
  npcProgress: number;
  aiProgress: number;
  playerProgress: number;
  
  overallScore: number;
}

export class SovereignLeaderboardEvaluator {
  /**
   * Evaluates raw player stats into rates, progress bar values, and overall score.
   */
  public static evaluatePlayerStats(data: RawLeaderboardData): EvaluatedLeaderboardEntry {
    const npcSuccessRate = data.npcMatches > 0 ? data.npcWins / data.npcMatches : 0;
    const aiSuccessRate = data.aiMatches > 0 ? data.aiWins / data.aiMatches : 0;
    const playerSuccessRate = data.playerMatches > 0 ? data.playerWins / data.playerMatches : 0;

    const npcProgress = Math.round(npcSuccessRate * 100);
    const aiProgress = Math.round(aiSuccessRate * 100);
    const playerProgress = Math.round(playerSuccessRate * 100);

    // Score Formula: 50% Player success, 30% AI success, 20% NPC success, penalized slightly by steps to promote efficiency
    const baseScore = (npcSuccessRate * 0.2 + aiSuccessRate * 0.3 + playerSuccessRate * 0.5) * 1000;
    const stepPenalty = data.stepsTaken * 0.05;
    const overallScore = Math.max(0, parseFloat((baseScore - stepPenalty).toFixed(2)));

    return {
      playerId: data.playerId,
      stepsTaken: data.stepsTaken,
      npcSuccessRate,
      aiSuccessRate,
      playerSuccessRate,
      npcProgress,
      aiProgress,
      playerProgress,
      overallScore
    };
  }

  /**
   * Generates a new database entry record for Prisma database insertions
   */
  public static generateDatabaseEntry(data: EvaluatedLeaderboardEntry) {
    return {
      playerId: data.playerId,
      stepsTaken: data.stepsTaken,
      npcWins: Math.round(data.npcSuccessRate * 10), // mock baseline counts
      npcMatches: 10,
      aiWins: Math.round(data.aiSuccessRate * 10),
      aiMatches: 10,
      playerWins: Math.round(data.playerSuccessRate * 10),
      playerMatches: 10,
      overallScore: data.overallScore
    };
  }
}
