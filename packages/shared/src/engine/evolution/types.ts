/**
 * AXIOM Engine - Evolution Types
 * Final Phase: Self-Adaptive Gaming Ecosystem
 */

export interface EvolutionConfig {
  generationSize: number;
  mutationRate: number;
  crossoverRate: number;
  elitismCount: number;
  fitnessThreshold: number;
  maxGenerations: number;
}

export interface Genome {
  id: string;
  genes: Record<string, number>;
  fitness: number;
  generation: number;
  metadata: {
    createdAt: number;
    playerId?: string;
    matchId?: string;
  };
}

export interface EvolutionState {
  currentGeneration: number;
  bestGenome: Genome | null;
  averageFitness: number;
  diversity: number;
  convergenceRate: number;
}

export interface AdaptiveDifficulty {
  playerSkillRating: number;
  recommendedChallenge: number;
  adjustmentFactor: number;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
}

export interface FitnessFunction {
  (genome: Genome): number;
}

export interface EvolutionMetrics {
  generationNumber: number;
  bestFitness: number;
  averageFitness: number;
  worstFitness: number;
  diversity: number;
  improvementRate: number;
  timestamp: number;
}
