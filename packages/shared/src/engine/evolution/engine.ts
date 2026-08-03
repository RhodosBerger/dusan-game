/**
 * AXIOM Engine - Evolution Engine
 * Implements genetic algorithms for game balance adaptation
 */

import {
  EvolutionConfig,
  Genome,
  EvolutionState,
  FitnessFunction,
  EvolutionMetrics
} from './types';

export class EvolutionEngine {
  private config: EvolutionConfig;
  private population: Genome[];
  private state: EvolutionState;
  private generationHistory: EvolutionMetrics[];

  constructor(config: EvolutionConfig) {
    this.config = config;
    this.population = [];
    this.state = {
      currentGeneration: 0,
      bestGenome: null,
      averageFitness: 0,
      diversity: 1,
      convergenceRate: 0
    };
    this.generationHistory = [];
  }

  /**
   * Initialize population with random genomes
   */
  initializePopulation(): void {
    this.population = [];
    for (let i = 0; i < this.config.generationSize; i++) {
      const genome: Genome = {
        id: `genome_${Date.now()}_${i}`,
        genes: this.generateRandomGenes(),
        fitness: 0,
        generation: 0,
        metadata: {
          createdAt: Date.now()
        }
      };
      this.population.push(genome);
    }
    this.state.currentGeneration = 0;
  }

  /**
   * Generate random genes for a genome
   */
  private generateRandomGenes(): Record<string, number> {
    const genes: Record<string, number> = {};
    // Example gene structure - can be customized based on game parameters
    const geneKeys = [
      'card_damage_multiplier',
      'health_regeneration_rate',
      'movement_cost_reduction',
      'mana_efficiency',
      'critical_chance',
      'defense_bonus'
    ];
    
    geneKeys.forEach(key => {
      genes[key] = Math.random();
    });
    
    return genes;
  }

  /**
   * Evaluate fitness of all genomes in population
   */
  evaluatePopulation(fitnessFn: FitnessFunction): void {
    this.population.forEach(genome => {
      genome.fitness = fitnessFn(genome);
    });
  }

  /**
   * Select parent using tournament selection
   */
  private selectParent(): Genome {
    const tournamentSize = 5;
    const tournament: Genome[] = [];
    
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * this.population.length);
      tournament.push(this.population[randomIndex]);
    }
    
    return tournament.reduce((best, current) => 
      current.fitness > best.fitness ? current : best
    );
  }

  /**
   * Perform crossover between two parents
   */
  private crossover(parent1: Genome, parent2: Genome): Genome {
    if (Math.random() > this.config.crossoverRate) {
      return { ...parent1 };
    }

    const childGenes: Record<string, number> = {};
    const keys = Object.keys(parent1.genes);
    
    keys.forEach(key => {
      if (Math.random() < 0.5) {
        childGenes[key] = parent1.genes[key];
      } else {
        childGenes[key] = parent2.genes[key];
      }
    });

    return {
      id: `genome_${Date.now()}_child`,
      genes: childGenes,
      fitness: 0,
      generation: this.state.currentGeneration + 1,
      metadata: {
        createdAt: Date.now()
      }
    };
  }

  /**
   * Apply mutation to a genome
   */
  private mutate(genome: Genome): Genome {
    const mutatedGenes = { ...genome.genes };
    
    Object.keys(mutatedGenes).forEach(key => {
      if (Math.random() < this.config.mutationRate) {
        // Gaussian mutation
        const mutation = (Math.random() - 0.5) * 0.2;
        mutatedGenes[key] = Math.max(0, Math.min(1, mutatedGenes[key] + mutation));
      }
    });

    return {
      ...genome,
      genes: mutatedGenes
    };
  }

  /**
   * Create next generation through selection, crossover, and mutation
   */
  private createNextGeneration(): Genome[] {
    const newPopulation: Genome[] = [];

    // Elitism: keep best individuals
    const sorted = [...this.population].sort((a, b) => b.fitness - a.fitness);
    for (let i = 0; i < this.config.elitismCount; i++) {
      newPopulation.push({ ...sorted[i] });
    }

    // Fill rest of population
    while (newPopulation.length < this.config.generationSize) {
      const parent1 = this.selectParent();
      const parent2 = this.selectParent();
      let child = this.crossover(parent1, parent2);
      child = this.mutate(child);
      newPopulation.push(child);
    }

    return newPopulation;
  }

  /**
   * Calculate population diversity
   */
  private calculateDiversity(): number {
    if (this.population.length < 2) return 0;

    const avgGenes: Record<string, number> = {};
    const keys = Object.keys(this.population[0].genes);
    
    // Calculate average for each gene
    keys.forEach(key => {
      const sum = this.population.reduce((acc, g) => acc + g.genes[key], 0);
      avgGenes[key] = sum / this.population.length;
    });

    // Calculate variance
    let totalVariance = 0;
    keys.forEach(key => {
      const variance = this.population.reduce((acc, g) => {
        return acc + Math.pow(g.genes[key] - avgGenes[key], 2);
      }, 0) / this.population.length;
      totalVariance += variance;
    });

    return Math.sqrt(totalVariance / keys.length);
  }

  /**
   * Run one evolution cycle
   */
  async evolve(fitnessFn: FitnessFunction, cycles: number = 1): Promise<EvolutionState> {
    for (let cycle = 0; cycle < cycles; cycle++) {
      // Evaluate current population
      this.evaluatePopulation(fitnessFn);

      // Update state
      const sorted = [...this.population].sort((a, b) => b.fitness - a.fitness);
      const bestGenome = sorted[0];
      const worstGenome = sorted[sorted.length - 1];
      const avgFitness = this.population.reduce((acc, g) => acc + g.fitness, 0) / this.population.length;

      const previousBest = this.state.bestGenome?.fitness || 0;
      const improvement = bestGenome.fitness - previousBest;

      this.state = {
        currentGeneration: this.state.currentGeneration + 1,
        bestGenome: { ...bestGenome },
        averageFitness: avgFitness,
        diversity: this.calculateDiversity(),
        convergenceRate: improvement / (previousBest || 1)
      };

      // Record metrics
      const metrics: EvolutionMetrics = {
        generationNumber: this.state.currentGeneration,
        bestFitness: bestGenome.fitness,
        averageFitness: avgFitness,
        worstFitness: worstGenome.fitness,
        diversity: this.state.diversity,
        improvementRate: this.state.convergenceRate,
        timestamp: Date.now()
      };
      this.generationHistory.push(metrics);

      // Check termination conditions
      if (bestGenome.fitness >= this.config.fitnessThreshold ||
          this.state.currentGeneration >= this.config.maxGenerations) {
        break;
      }

      // Create next generation
      this.population = this.createNextGeneration();
    }

    return this.state;
  }

  /**
   * Get current evolution state
   */
  getState(): EvolutionState {
    return { ...this.state };
  }

  /**
   * Get evolution history
   */
  getHistory(): EvolutionMetrics[] {
    return [...this.generationHistory];
  }

  /**
   * Get best genome found so far
   */
  getBestGenome(): Genome | null {
    return this.state.bestGenome ? { ...this.state.bestGenome } : null;
  }

  /**
   * Reset evolution engine
   */
  reset(): void {
    this.population = [];
    this.state = {
      currentGeneration: 0,
      bestGenome: null,
      averageFitness: 0,
      diversity: 1,
      convergenceRate: 0
    };
    this.generationHistory = [];
  }
}
