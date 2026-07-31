// packages/shared/src/core/questEvolution.ts
import { HexCoordinate, TelemetryData } from './types';

/**
 * Čistá fitness funkcia pre evolučnú optimalizáciu questových ciest.
 * Hodnotí trajektóriu na základe dĺžky, HP risku a hustoty NPC.
 */
export function calculateFitness(
  chromosome: HexCoordinate[], 
  telemetry: TelemetryData,
  hazardIndexMap: Map<string, number>
): number {
  let fitness = 0;
  let currentHP = telemetry.hp;
  const pathLength = chromosome.length;

  if (pathLength === 0) return -999;

  // 1. Penalizácia za príliš krátku alebo dlhú cestu (hľadáme optimálny odskok)
  const targetLength = 6; 
  fitness -= Math.abs(pathLength - targetLength) * 15;

  // 2. Simulácia HP opotrebenia pozdĺž cesty na základe hazardIndexov metapozícií
  for (const coord of chromosome) {
    const key = `${coord.q},${coord.r}`;
    const hazard = hazardIndexMap.get(key) ?? 0.1;
    
    // Ak by hráč na tejto ceste zomrel (HP <= 0), chromozóm je vysoko penalizovaný
    currentHP -= (hazard * 20); // predpokladané poškodenie z boja
    if (currentHP <= 15) {
      fitness -= 200; // kritická zóna nízkeho HP
    }
  }

  // Ak hráč prežije v zdravom rozmedzí (napr. 30-70 HP), získa bonus za balanc
  if (currentHP > 20 && currentHP < 80) {
    fitness += 100;
  }

  // 3. Hustota stretnutí (optimalizácia zábavnosti a taktiky)
  fitness += pathLength * 12;

  return fitness;
}

/**
 * Bezstavový evolučný generátor ciest (Evolutionary Scenario Generator)
 */
export class EvolutionaryQuestPlanner {
  private populationSize = 30;
  private generations = 50;
  private mutationRate = 0.15;

  constructor(private availableNodes: HexCoordinate[], private hazardMap: Map<string, number>) {}

  public planOptimalPath(telemetry: TelemetryData, startNode: HexCoordinate): HexCoordinate[] {
    // Inicializácia náhodnej populácie ciest začínajúcich zo startNode
    let population: HexCoordinate[][] = Array.from({ length: this.populationSize }, () => 
      this.generateRandomPath(startNode, 4 + Math.floor(Math.random() * 5))
    );

    for (let g = 0; g < this.generations; g++) {
      // 1. Vyhodnotenie fitness (pure mapping)
      const scored = population.map(chrom => ({
        chrom,
        score: calculateFitness(chrom, telemetry, this.hazardMap)
      }));

      // Zoradenie zostupne podľa úspešnosti
      scored.sort((a, b) => b.score - a.score);

      // Elitárstvo - zachovanie top 5 ciest
      const nextGen: HexCoordinate[][] = scored.slice(0, 5).map(s => s.chrom);

      // 2. Selekcia, kríženie a mutácia
      while (nextGen.length < this.populationSize) {
        const parentA = this.rouletteSelect(scored);
        const parentB = this.rouletteSelect(scored);
        let child = this.crossover(parentA, parentB);

        if (Math.random() < this.mutationRate) {
          child = this.mutate(child);
        }
        nextGen.push(child);
      }
      population = nextGen;
    }

    // Vráti najlepšiu nájdenú cestu
    return population[0];
  }

  private generateRandomPath(start: HexCoordinate, length: number): HexCoordinate[] {
    const path = [start];
    let current = start;
    for (let i = 1; i < length; i++) {
      const neighbors = this.availableNodes.filter(n => this.isNeighbor(current, n));
      if (neighbors.length === 0) break;
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      path.push(next);
      current = next;
    }
    return path;
  }

  private isNeighbor(a: HexCoordinate, b: HexCoordinate): boolean {
    const dq = Math.abs(a.q - b.q);
    const dr = Math.abs(a.r - b.r);
    const ds = Math.abs((-a.q - a.r) - (-b.q - b.r));
    return Math.max(dq, dr, ds) === 1;
  }

  private rouletteSelect(scored: { chrom: HexCoordinate[]; score: number }[]): HexCoordinate[] {
    const offset = Math.abs(scored[scored.length - 1].score) + 1;
    const totalFitness = scored.reduce((sum, s) => sum + (s.score + offset), 0);
    let r = Math.random() * totalFitness;
    for (const item of scored) {
      r -= (item.score + offset);
      if (r <= 0) return item.chrom;
    }
    return scored[0].chrom;
  }

  private crossover(a: HexCoordinate[], b: HexCoordinate[]): HexCoordinate[] {
    const cut = Math.floor(Math.random() * Math.min(a.length, b.length));
    return [...a.slice(0, cut), ...b.slice(cut)];
  }

  private mutate(path: HexCoordinate[]): HexCoordinate[] {
    if (path.length <= 2) return path;
    const mutant = [...path];
    const idx = 1 + Math.floor(Math.random() * (path.length - 2));
    const neighbors = this.availableNodes.filter(n => this.isNeighbor(mutant[idx - 1], n));
    if (neighbors.length > 0) {
      mutant[idx] = neighbors[Math.floor(Math.random() * neighbors.length)];
    }
    return mutant;
  }
}
