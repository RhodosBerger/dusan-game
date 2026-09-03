import { ThreadState } from './ConnectionEngine';

export interface Position {
  meta: number;
  hex: number;
}

export interface HelperSpawn {
  position: Position;
  type: 'tower' | 'bomb' | 'trap' | 'watcher';
  ownerId: string;
}

/**
 * Chromozóm reprezentujúci navrhnuté rozloženie mapy arény (Scene)
 */
export interface SceneChromosome {
  playerAPosition: Position;
  playerBPosition: Position;
  flagPositions: Position[];
  helpers: HelperSpawn[];
  fitnessScore?: number;
}

export interface GeneratorConfig {
  populationSize: number;
  generations: number;
  mutationRate: number;
  crossoverRate: number;
  targetDistance: number; // Ideálna štartovacia vzdialenosť medzi hrdinami
}

/**
 * Generický Evolučný Generátor Arény (Evolutionary Scene Generator)
 * Využíva genetický algoritmus na vygenerovanie optimálnej a férovej štartovacej scény pre dvoch hráčov.
 */
export class EvolutionarySceneGenerator {
  private config: GeneratorConfig;

  constructor(config?: Partial<GeneratorConfig>) {
    this.config = {
      populationSize: config?.populationSize ?? 40,
      generations: config?.generations ?? 30,
      mutationRate: config?.mutationRate ?? 0.15,
      crossoverRate: config?.crossoverRate ?? 0.8,
      targetDistance: config?.targetDistance ?? 5,
    };
  }

  /**
   * Spustí evolúciu populácie a vráti najlepšie vygenerované rozloženie scény (najvyššia fitness)
   */
  public evolveScene(playerAId: string, playerBId: string): SceneChromosome {
    // 1. Inicializácia náhodnej populácie chromozómov
    let population = this.generateInitialPopulation(playerAId, playerBId);

    for (let gen = 0; gen < this.config.generations; gen++) {
      // 2. Ohodnotenie fitness pre celú populáciu
      population = population.map(chromo => ({
        ...chromo,
        fitnessScore: this.calculateFitness(chromo),
      }));

      // Zoradenie od najlepšej po najhoršiu fitness
      population.sort((a, b) => (b.fitnessScore || 0) - (a.fitnessScore || 0));

      const nextGeneration: SceneChromosome[] = [];

      // Elitárstvo (Elitist selection) - zachováme 2 najlepšie chromozómy
      nextGeneration.push(population[0]);
      nextGeneration.push(population[1]);

      // 3. Tvorba novej generácie pomocou selekcie, kríženia a mutácie
      while (nextGeneration.length < this.config.populationSize) {
        const parent1 = this.tournamentSelection(population);
        const parent2 = this.tournamentSelection(population);

        let offspring = this.crossover(parent1, parent2);

        offspring = this.mutate(offspring, playerAId, playerBId);

        nextGeneration.push(offspring);
      }

      population = nextGeneration;
    }

    // Vyhodnotenie finálnej fitness po poslednej generácii
    population = population.map(chromo => ({
      ...chromo,
      fitnessScore: this.calculateFitness(chromo),
    }));
    population.sort((a, b) => (b.fitnessScore || 0) - (a.fitnessScore || 0));

    return population[0];
  }

  /**
   * Fitness funkcia: Hodnotí taktickú hĺbku, rovnováhu a bezpečnosť štartovacej scény.
   * Vráti skóre od 0 (najhoršie) po 100 (ideálne).
   */
  public calculateFitness(chromo: SceneChromosome): number {
    let score = 100;

    // A. Bezpečnostná penalizácia (Collision Guard): Hráči nesmú začínať na rovnakom mieste
    if (chromo.playerAPosition.meta === chromo.playerBPosition.meta && 
        chromo.playerAPosition.hex === chromo.playerBPosition.hex) {
      return 0; // Úplne neplatný chromozóm
    }

    // B. Vzdialenosť medzi hrdinami
    const heroDist = this.getHexDistance(chromo.playerAPosition, chromo.playerBPosition);
    const distDiff = Math.abs(heroDist - this.config.targetDistance);
    // Trestáme príliš blízke alebo príliš vzdialené spony
    score -= distDiff * 15;

    // C. Symetria štartovacích pozícií voči makro stredu (férovosť)
    // Stred arény je metapozícia 4. Vzdialenosť od stredu by mala byť pre oboch podobná
    const distToCenterA = Math.abs(chromo.playerAPosition.meta - 4);
    const distToCenterB = Math.abs(chromo.playerBPosition.meta - 4);
    const symmetryPenalty = Math.abs(distToCenterA - distToCenterB);
    score -= symmetryPenalty * 10;

    // D. Prítomnosť pascí priamo na štartovacom políčku hrdinu (Trest za instantnú prehru)
    const badSpawnA = chromo.helpers.some(h => this.isSamePosition(h.position, chromo.playerAPosition));
    const badSpawnB = chromo.helpers.some(h => this.isSamePosition(h.position, chromo.playerBPosition));
    if (badSpawnA || badSpawnB) {
      score -= 40;
    }

    // E. Dostupnosť vlajok
    // Hra vyžaduje zber vlajok. Každá vlajka by mala byť strategicky dostupná
    for (const flag of chromo.flagPositions) {
      const distA = this.getHexDistance(chromo.playerAPosition, flag);
      const distB = this.getHexDistance(chromo.playerBPosition, flag);
      
      // Ak je vlajka extrémne blízko k jednému hráčovi, znižuje to férovosť
      const fairness = Math.abs(distA - distB);
      score -= fairness * 4;
    }

    // Ochrana na rozsah 0 - 100 (Saturačná aritmetika)
    return Math.max(0, Math.min(100, score));
  }

  // --- INTERNÉ EVOLUČNÉ METÓDY ---

  private generateInitialPopulation(playerAId: string, playerBId: string): SceneChromosome[] {
    const pop: SceneChromosome[] = [];
    for (let i = 0; i < this.config.populationSize; i++) {
      pop.push(this.generateRandomChromosome(playerAId, playerBId));
    }
    return pop;
  }

  private generateRandomChromosome(playerAId: string, playerBId: string): SceneChromosome {
    // Vytvorenie náhodných unikátnych pozícií pre hrdinov
    const playerAPos = { meta: Math.floor(Math.random() * 4), hex: Math.floor(Math.random() * 7) };
    const playerBPos = { meta: Math.floor(Math.random() * 4) + 5, hex: Math.floor(Math.random() * 7) }; // Spawne ho na druhej polovici

    // 2-3 náhodné vlajky
    const flags: Position[] = [];
    const numFlags = Math.floor(Math.random() * 2) + 2;
    for (let f = 0; f < numFlags; f++) {
      flags.push({ meta: Math.floor(Math.random() * 9), hex: Math.floor(Math.random() * 7) });
    }

    // 2-4 náhodní pomocníci v poli
    const helpers: HelperSpawn[] = [];
    const numHelpers = Math.floor(Math.random() * 3) + 2;
    const types: HelperSpawn['type'][] = ['tower', 'bomb', 'trap', 'watcher'];
    for (let h = 0; h < numHelpers; h++) {
      helpers.push({
        position: { meta: Math.floor(Math.random() * 9), hex: Math.floor(Math.random() * 7) },
        type: types[Math.floor(Math.random() * types.length)],
        ownerId: Math.random() > 0.5 ? playerAId : playerBId,
      });
    }

    return {
      playerAPosition: playerAPos,
      playerBPosition: playerBPos,
      flagPositions: flags,
      helpers,
    };
  }

  private tournamentSelection(population: SceneChromosome[]): SceneChromosome {
    // Náhodne vyberieme 3 jedincov a vrátime najlepšieho (Tournament size = 3)
    const tournament: SceneChromosome[] = [];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(Math.random() * population.length);
      tournament.push(population[idx]);
    }
    tournament.sort((a, b) => (b.fitnessScore || 0) - (a.fitnessScore || 0));
    return tournament[0];
  }

  /**
   * Crossover (Kríženie) - jednobodové kríženie pozícií a zoznamov
   */
  private crossover(parent1: SceneChromosome, parent2: SceneChromosome): SceneChromosome {
    if (Math.random() > this.config.crossoverRate) {
      return JSON.parse(JSON.stringify(parent1)); // Žiadne kríženie
    }

    return {
      playerAPosition: Math.random() > 0.5 ? parent1.playerAPosition : parent2.playerAPosition,
      playerBPosition: Math.random() > 0.5 ? parent1.playerBPosition : parent2.playerBPosition,
      flagPositions: Math.random() > 0.5 ? [...parent1.flagPositions] : [...parent2.flagPositions],
      helpers: Math.random() > 0.5 ? [...parent1.helpers] : [...parent2.helpers],
    };
  }

  /**
   * Mutácia - Náhodný posun súradníc alebo zmena typu
   */
  private mutate(chromo: SceneChromosome, playerAId: string, playerBId: string): SceneChromosome {
    const mutated = JSON.parse(JSON.stringify(chromo)) as SceneChromosome;

    // Mutácia pozície hráča A
    if (Math.random() < this.config.mutationRate) {
      mutated.playerAPosition.meta = Math.floor(Math.random() * 9);
      mutated.playerAPosition.hex = Math.floor(Math.random() * 7);
    }

    // Mutácia pozície hráča B
    if (Math.random() < this.config.mutationRate) {
      mutated.playerBPosition.meta = Math.floor(Math.random() * 9);
      mutated.playerBPosition.hex = Math.floor(Math.random() * 7);
    }

    // Mutácia pomocníkov
    mutated.helpers = mutated.helpers.map(helper => {
      if (Math.random() < this.config.mutationRate) {
        const types: HelperSpawn['type'][] = ['tower', 'bomb', 'trap', 'watcher'];
        return {
          ...helper,
          type: types[Math.floor(Math.random() * types.length)],
          position: { meta: Math.floor(Math.random() * 9), hex: Math.floor(Math.random() * 7) }
        };
      }
      return helper;
    });

    return mutated;
  }

  // --- GEOMETRICKÉ POMOCNÉ FUNKCIE ---

  private getHexDistance(p1: Position, p2: Position): number {
    // Vzdialenosť metapozícií + zjednodušená vzdialenosť vnútri
    const macroDist = Math.abs(p1.meta - p2.meta);
    const subDist = Math.abs(p1.hex - p2.hex);
    return macroDist + subDist;
  }

  private isSamePosition(p1: Position, p2: Position): boolean {
    return p1.meta === p2.meta && p1.hex === p2.hex;
  }
}
