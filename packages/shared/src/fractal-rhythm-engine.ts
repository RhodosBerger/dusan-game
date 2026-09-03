/**
 * Fractal Sector & Empirical Rhythm Engine
 * 
 * Prepája generovanie krajiny, ekonomiku, dobrodružstvo a fyzikálny priestor.
 * Využíva tricyklické schémy derivovania fraktálov na vytvorenie "jasu" za úspechom.
 * Riadi sa pravidlom 75/30 pre vzdialenosti príležitostí.
 * Zabraňuje entropii pomocou kľúčového patternu overenia dôkazu (Proof-of-Existence).
 */

export interface FractalPoint {
  x: number;
  y: number;
  z: number; // hĺbka/výška
  intensity: number; // jas
  rhythmPhase: number;
  entropyLevel: number;
}

export interface SectorData {
  id: string;
  points: FractalPoint[];
  rhythmValue: number;
  economicFactor: number;
  adventurePotential: number;
  isEntropyStable: boolean;
  proofHash?: string;
}

export interface TricycleDerivation {
  cycle: number; // 0, 1, 2
  derivativeOrder: number;
  value: number;
}

export class FractalRhythmEngine {
  private readonly RULE_75 = 0.75;
  private readonly SCALE_30 = 0.30;
  private readonly ENTROPY_THRESHOLD = 0.85;
  
  /**
   * Generuje fraktálny sektor pomocou n-tej derivácie plochy
   */
  generateSector(
    seed: number,
    iterations: number,
    derivativeOrder: number,
    mapScale: number
  ): SectorData {
    const points: FractalPoint[] = [];
    let totalIntensity = 0;
    let totalRhythm = 0;
    
    // Tricyklická schéma derivovania
    const tricycleCycles: TricycleDerivation[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const cycle = i % 3;
      const baseValue = this.fractalFunction(seed, i, derivativeOrder);
      
      // Derivácia podľa cyklu
      const derivedValue = this.tricycleDerivate(baseValue, cycle, derivativeOrder);
      
      tricycleCycles.push({
        cycle,
        derivativeOrder,
        value: derivedValue
      });
      
      // Výpočet súradníc s prihliadnutím na 75% vzdialenosť bod-bod
      const distanceFactor = this.calculateAlgorithmicDistance(i, iterations, this.RULE_75);
      const scaleFactor = mapScale * this.SCALE_30;
      
      const x = Math.cos(derivedValue * distanceFactor) * scaleFactor;
      const y = Math.sin(derivedValue * distanceFactor) * scaleFactor;
      const z = this.calculateDepth(derivedValue, cycle);
      
      // Výpočet intenzity (jas) - sukcesívne zlepšovanie
      const intensity = this.calculateIntensity(derivedValue, cycle, iterations);
      totalIntensity += intensity;
      
      // Empirický rytmus spájajúci ekonomiku a dobrodružstvo
      const rhythm = this.calculateEmpiricalRhythm(cycle, derivedValue, i);
      totalRhythm += rhythm;
      
      // Entropia - rastie ak nie je dôkaz
      const entropy = this.calculateEntropy(i, derivativeOrder);
      
      points.push({
        x,
        y,
        z,
        intensity,
        rhythmPhase: rhythm,
        entropyLevel: entropy
      });
    }
    
    const avgRhythm = totalRhythm / iterations;
    const economicFactor = this.extractEconomicFactor(avgRhythm, tricycleCycles);
    const adventurePotential = this.extractAdventurePotential(avgRhythm, points);
    
    // Kontrola entropie
    const maxEntropy = Math.max(...points.map(p => p.entropyLevel));
    const isEntropyStable = maxEntropy < this.ENTROPY_THRESHOLD;
    
    return {
      id: `sector_${seed}_${Date.now()}`,
      points,
      rhythmValue: avgRhythm,
      economicFactor,
      adventurePotential,
      isEntropyStable,
      proofHash: undefined
    };
  }
  
  /**
   * Overenie dôkazu v súborovom systéme (simulácia)
   * Zabraní vyhovoreniu entropie ak hráč nemá dôkaz
   */
  async verifyProofOfExistence(
    sector: SectorData,
    filePaths: string[]
  ): Promise<SectorData> {
    if (!filePaths || filePaths.length === 0) {
      // Bez dôkazu sa entropia zvýši na maximum
      sector.points = sector.points.map(p => ({
        ...p,
        entropyLevel: Math.min(1.0, p.entropyLevel + 0.5),
        intensity: Math.max(0, p.intensity - 0.3)
      }));
      sector.isEntropyStable = false;
      return sector;
    }
    
    // Simulácia hashovania súborov ako dôkazu
    const proofContent = filePaths.join('|') + sector.id;
    const proofHash = await this.simpleHash(proofContent);
    
    sector.proofHash = proofHash;
    
    // S dôkazom sa entropia zníži a jas zvýši
    sector.points = sector.points.map(p => ({
      ...p,
      entropyLevel: Math.max(0, p.entropyLevel - 0.4),
      intensity: Math.min(1.0, p.intensity + 0.25)
    }));
    
    sector.isEntropyStable = true;
    
    return sector;
  }
  
  /**
   * Tricyklická derivácia - mení správanie podľa fázy cyklu
   */
  private tricycleDerivate(value: number, cycle: number, order: number): number {
    switch (cycle) {
      case 0: // Prvý cyklus - pozičná derivácia
        return value * (order + 1);
      case 1: // Druhý cyklus - rýchlostná derivácia
        return Math.pow(value, 2) * Math.sin(order);
      case 2: // Tretí cyklus - akceleračná derivácia
        return Math.log(Math.abs(value) + 1) * Math.cos(order);
      default:
        return value;
    }
  }
  
  /**
   * Fraktálna funkcia pre generovanie hodnôt
   */
  private fractalFunction(seed: number, iteration: number, order: number): number {
    const normalized = (seed + iteration) / (order + 1);
    return Math.sin(normalized) * Math.cos(normalized * 0.5);
  }
  
  /**
   * Výpočet algoritmických vzdialeností (75% pravidlo)
   */
  private calculateAlgorithmicDistance(
    current: number,
    total: number,
    rule75: number
  ): number {
    const progress = current / total;
    // 75% definuje algoritmické vzdialenosti príležitostí
    if (progress < rule75) {
      return progress * 2;
    }
    return rule75 + (progress - rule75) * 0.5;
  }
  
  /**
   * Výpočet hĺbky na základe cyklu a hodnoty
   */
  private calculateDepth(value: number, cycle: number): number {
    const baseDepth = value * 10;
    switch (cycle) {
      case 0: return baseDepth;
      case 1: return baseDepth * 1.5;
      case 2: return baseDepth * 0.7;
      default: return baseDepth;
    }
  }
  
  /**
   * Výpočet intenzity (jas) - svetelné signály
   */
  private calculateIntensity(
    value: number,
    cycle: number,
    totalIterations: number
  ): number {
    const baseIntensity = (Math.abs(value) + 0.1) / 2;
    const cycleBonus = (cycle + 1) / 3;
    const normalization = 1 / Math.log(totalIterations + 2);
    
    return Math.min(1.0, baseIntensity * cycleBonus * normalization * 5);
  }
  
  /**
   * Empirický rytmus spájajúci ekonomiku a dobrodružstvo
   */
  private calculateEmpiricalRhythm(
    cycle: number,
    value: number,
    iteration: number
  ): number {
    const rhythmBase = Math.sin(value * (cycle + 1)) * Math.cos(iteration * 0.1);
    // Rytmus meraný empiricky s cestovaním
    return (rhythmBase + 1) / 2; // Normalizované na 0-1
  }
  
  /**
   * Výpočet entropie - rastie s iteráciami ak nie je kontrolovaná
   */
  private calculateEntropy(iteration: number, order: number): number {
    const baseEntropy = Math.log(iteration + 1) / Math.log(100);
    const orderFactor = 1 / (order + 1);
    return Math.min(1.0, baseEntropy * orderFactor);
  }
  
  /**
   * Extrakcia ekonomického faktora z rytmu
   */
  private extractEconomicFactor(
    avgRhythm: number,
    cycles: TricycleDerivation[]
  ): number {
    const cycleVariation = Math.max(...cycles.map(c => c.value)) - 
                          Math.min(...cycles.map(c => c.value));
    return avgRhythm * (1 + cycleVariation);
  }
  
  /**
   * Extrakcia potenciálu dobrodružstva z bodov
   */
  private extractAdventurePotential(avgRhythm: number, points: FractalPoint[]): number {
    const depthVariation = Math.max(...points.map(p => p.z)) - 
                          Math.min(...points.map(p => p.z));
    const intensityAvg = points.reduce((sum, p) => sum + p.intensity, 0) / points.length;
    
    return (depthVariation * 0.3 + intensityAvg * 0.7) * avgRhythm;
  }
  
  /**
   * Jednoduchá hash funkcia pre dôkaz
   */
  private async simpleHash(str: string): Promise<string> {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
  
  /**
   * Generovanie svetelných signálov pre canvas vykresľovanie
   * Vracia parametre pre geometrické funkcie vykresľovania
   */
  generateLightSignals(points: FractalPoint[]) {
    return points.map(p => {
      // Geometrická funkcia riadiaca spôsob vykreslovania
      const geometryType = p.rhythmPhase > 0.66 ? 'circle' : 
                          p.rhythmPhase > 0.33 ? 'polygon' : 'line';
      
      // Svetelný signál na základe intenzity a entropie
      const lightColor = this.calculateLightColor(p.intensity, p.entropyLevel);
      
      return {
        x: p.x,
        y: p.y,
        z: p.z,
        geometryType,
        color: lightColor,
        alpha: p.intensity,
        size: Math.abs(p.z) * 2 + 1
      };
    });
  }
  
  /**
   * Výpočet farby svetla na základe intenzity a entropie
   */
  private calculateLightColor(intensity: number, entropy: number): string {
    // Nízka entropia + vysoká intenzita = teplé farby (úspech)
    // Vysoká entropia = studené farby (chaos)
    
    if (entropy > this.ENTROPY_THRESHOLD) {
      // Chaos - modrofialové tóny
      const blue = Math.floor(200 + entropy * 55);
      const red = Math.floor(50 * (1 - entropy));
      return `rgb(${red}, 50, ${blue})`;
    }
    
    // Stabilný stav - teplé tóny podľa intenzity
    const red = Math.floor(200 + intensity * 55);
    const green = Math.floor(150 + intensity * 105);
    const blue = Math.floor(100 + intensity * 55);
    
    return `rgb(${red}, ${green}, ${blue})`;
  }
}
