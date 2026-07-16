import { HeroId } from './types';

export interface CardGenItem {
  id: string;
  name: string;
  heroId: HeroId;
  damage: number;
}

export interface DeckChromosome {
  cards: CardGenItem[];
  hexCoordsSeq: string[];
  narrativeTags: string[];
  fitnessScore?: number;
}

export interface DeckGeneratorConfig {
  populationSize: number;
  generations: number;
  mutationRate: number;
}

/**
 * Evolutionary Deck Generator Engine
 * Optimizes card shuffle configurations and builds unique narrative quest sequences.
 */
export class EvolutionaryDeckGenerator {
  private config: DeckGeneratorConfig;

  constructor(config?: Partial<DeckGeneratorConfig>) {
    this.config = {
      populationSize: config?.populationSize ?? 30,
      generations: config?.generations ?? 20,
      mutationRate: config?.mutationRate ?? 0.2,
    };
  }

  /**
   * Runs the evolutionary genetic algorithm to find an optimal card and narrative shuffle
   */
  public evolveDeckAndNarrative(
    availableCards: CardGenItem[],
    targetBiomes: string[],
    historyQuestIds: string[]
  ): DeckChromosome {
    if (availableCards.length === 0) {
      return { cards: [], hexCoordsSeq: [], narrativeTags: [] };
    }

    let population = this.initializePopulation(availableCards, targetBiomes);

    for (let gen = 0; gen < this.config.generations; gen++) {
      population = population.map(chromo => ({
        ...chromo,
        fitnessScore: this.calculateFitness(chromo, targetBiomes, historyQuestIds),
      }));

      population.sort((a, b) => (b.fitnessScore || 0) - (a.fitnessScore || 0));

      const nextGen: DeckChromosome[] = [population[0], population[1]]; // Elitism

      while (nextGen.length < this.config.populationSize) {
        const p1 = this.selectParent(population);
        const p2 = this.selectParent(population);

        let offspring = this.crossover(p1, p2);
        offspring = this.mutate(offspring, availableCards);

        nextGen.push(offspring);
      }

      population = nextGen;
    }

    population = population.map(chromo => ({
      ...chromo,
      fitnessScore: this.calculateFitness(chromo, targetBiomes, historyQuestIds),
    }));
    population.sort((a, b) => (b.fitnessScore || 0) - (a.fitnessScore || 0));

    return population[0];
  }

  private initializePopulation(cards: CardGenItem[], biomes: string[]): DeckChromosome[] {
    const pop: DeckChromosome[] = [];
    for (let i = 0; i < this.config.populationSize; i++) {
      const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
      const hexCoordsSeq = Array.from({ length: 5 }, () => `0x${Math.floor(Math.random() * 255).toString(16).toUpperCase()}`);
      const narrativeTags = ["SCENARIO_INIT", "COMBAT_TRIGGER", "RESONANCE_FLUX"].sort(() => Math.random() - 0.5);
      pop.push({ cards: shuffledCards, hexCoordsSeq, narrativeTags });
    }
    return pop;
  }

  private calculateFitness(chromo: DeckChromosome, biomes: string[], historyQuestIds: string[]): number {
    let score = 50.0;

    chromo.cards.forEach((card, idx) => {
      const targetBiome = biomes[idx % biomes.length] || 'LUSH_FOREST';
      if (card.heroId === 'crystal' && targetBiome === 'GLACIER') score += 10.0;
      if (card.heroId === 'toxic' && targetBiome === 'TOXIC_SWAMP') score += 10.0;
      if (card.heroId === 'void' && targetBiome === 'BARRENS') score += 10.0;
    });

    chromo.narrativeTags.forEach(tag => {
      if (historyQuestIds.includes(tag)) {
        score -= 20.0;
      }
    });

    const uniqueHexes = new Set(chromo.hexCoordsSeq);
    score += uniqueHexes.size * 5.0;

    return Math.max(0, Math.min(100, score));
  }

  private selectParent(pop: DeckChromosome[]): DeckChromosome {
    const idx = Math.floor(Math.random() * Math.min(10, pop.length));
    return pop[idx];
  }

  private crossover(p1: DeckChromosome, p2: DeckChromosome): DeckChromosome {
    const midpoint = Math.floor(p1.cards.length / 2);
    const childCards = [...p1.cards.slice(0, midpoint), ...p2.cards.slice(midpoint)];
    const childHex = [...p1.hexCoordsSeq.slice(0, 2), ...p2.hexCoordsSeq.slice(2)];
    return {
      cards: childCards,
      hexCoordsSeq: childHex,
      narrativeTags: [...p1.narrativeTags]
    };
  }

  private mutate(chromo: DeckChromosome, allCards: CardGenItem[]): DeckChromosome {
    if (Math.random() < this.config.mutationRate && chromo.cards.length > 1) {
      const idx1 = Math.floor(Math.random() * chromo.cards.length);
      const idx2 = Math.floor(Math.random() * chromo.cards.length);
      const temp = chromo.cards[idx1];
      chromo.cards[idx1] = chromo.cards[idx2];
      chromo.cards[idx2] = temp;
    }
    return chromo;
  }
}
