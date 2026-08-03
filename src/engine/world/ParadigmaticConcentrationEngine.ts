/**
 * Paradigmatic Concentration Engine
 * 
 * Generuje koncentrácie objektov na ploche podľa definovaných vzorcov (patterns).
 * Tieto vzorce určujú hustotu, rozloženie a typológiu objektov v rámci gridu.
 * Slúži ako predloha pre Detailný World Generator.
 */

import { Vector2, Vector3 } from 'three';
import { AxiomLibrary } from '../axioms/AxiomLibrary';
import { OctantDirection, OctantConnectivityGrid } from './OctantConnectivityGrid';

export type ConcentrationPatternType = 
  | 'CLUSTER'       // Hlukovitá koncentrácia
  | 'SPIRAL'        // Špirálovité rozloženie
  | 'GRID_DENSE'    // Hustá mriežka
  | 'GRID_SPARSE'   // Riedka mriežka
  | 'RING'          // Prstencové rozloženie
  | 'FLOW_LINE'     // Linárne prúdenie (rieka, cesta)
  | 'NOISE_FIELD';  // Perlin/Simplex noise distribúcia

export interface ConcentrationParams {
  pattern: ConcentrationPatternType;
  density: number; // 0.0 - 1.0
  spread: number;  // Rozptyl od stredu
  rotation: number;
  seed: number;
  axiomSource: string;
}

export interface GeneratedConcentration {
  positions: Vector3[];
  orientations: number[]; // Uhol v radiánoch
  types: string[];        // Typy objektov z Axiom Library
  metadata: {
    pattern: ConcentrationPatternType;
    center: Vector3;
    boundingRadius: number;
  };
}

export class ParadigmaticConcentrationEngine {
  private axiomLib: AxiomLibrary;
  private connectivityGrid: OctantConnectivityGrid;

  constructor(axiomLib: AxiomLibrary) {
    this.axiomLib = axiomLib;
    this.connectivityGrid = new OctantConnectivityGrid();
  }

  /**
   * Vygeneruje koncentráciu objektov na základe vzorca.
   */
  generateConcentration(
    center: Vector3,
    params: ConcentrationParams,
    areaSize: number
  ): GeneratedConcentration {
    const positions: Vector3[] = [];
    const orientations: number[] = [];
    const types: string[] = [];
    
    const count = Math.floor(areaSize * areaSize * params.density);
    const availableTypes = this.axiomLib.getTypesForAxiom(params.axiomSource);

    if (availableTypes.length === 0) {
      console.warn(`No types found for axiom: ${params.axiomSource}`);
      return { positions, orientations, types, metadata: this.createMetadata(center, params) };
    }

    for (let i = 0; i < count; i++) {
      let pos = this.calculatePositionByPattern(i, count, params, areaSize);
      
      // Aplikácia rotácie celého patternu
      pos = this.rotateVector2(pos, center.x, center.z, params.rotation);
      const finalPos = new Vector3(pos.x, center.y, pos.y);

      // Overenie nadväzností (8 smerov)
      if (!this.connectivityGrid.validatePlacement(finalPos, params.axiomSource)) {
        continue; // Preskočiť ak konflikt
      }

      positions.push(finalPos);
      orientations.push(this.calculateOrientation(i, params.pattern));
      
      // Výber typu s váhou podľa pozície (napr. stred vs okraj)
      const typeIndex = this.selectTypeByContext(i, count, availableTypes, params.pattern);
      types.push(availableTypes[typeIndex]);

      // Registrácia do gridu pre budúce overenia
      this.connectivityGrid.registerObject(finalPos, params.axiomSource);
    }

    return {
      positions,
      orientations,
      types,
      metadata: this.createMetadata(center, params)
    };
  }

  private calculatePositionByPattern(
    index: number,
    total: number,
    params: ConcentrationParams,
    size: number
  ): { x: number; y: number } {
    const random = this.seededRandom(params.seed + index);
    const maxDist = (size / 2) * params.spread;

    switch (params.pattern) {
      case 'CLUSTER':
        // Gaussovské rozdelenie okolo stredu
        const u1 = random();
        const u2 = random();
        const stdDev = maxDist / 3;
        return {
          x: this.boxMuller(u1, u2) * stdDev,
          y: this.boxMuller(u1, u2) * stdDev
        };

      case 'SPIRAL':
        const angle = (index / total) * Math.PI * 2 * 3; // 3 otáčky
        const radius = (index / total) * maxDist;
        return {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        };

      case 'RING':
        const ringAngle = (index / total) * Math.PI * 2;
        const innerRadius = maxDist * 0.6;
        const variance = (random() - 0.5) * (maxDist * 0.2);
        return {
          x: Math.cos(ringAngle) * (innerRadius + variance),
          y: Math.sin(ringAngle) * (innerRadius + variance)
        };

      case 'FLOW_LINE':
        // Jednoduchá krivka
        const t = index / total;
        return {
          x: (t - 0.5) * size * 2,
          y: Math.sin(t * Math.PI * 4) * (maxDist * 0.5)
        };

      case 'GRID_DENSE':
      case 'GRID_SPARSE':
        const cols = Math.sqrt(total);
        const row = Math.floor(index / cols);
        const col = index % cols;
        const step = size / cols;
        const offset = params.pattern === 'GRID_SPARSE' ? (random() > 0.5 ? step/2 : 0) : 0;
        return {
          x: (col * step) - (size/2) + offset,
          y: (row * step) - (size/2) + offset
        };

      default: // NOISE_FIELD
        return {
          x: (random() - 0.5) * size,
          y: (random() - 0.5) * size
        };
    }
  }

  private rotateVector2(v: {x: number, y: number}, cx: number, cy: number, angle: number) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = v.x - cx;
    const dy = v.y - cy;
    return {
      x: cx + dx * cos - dy * sin,
      y: cy + dx * sin + dy * cos
    };
  }

  private boxMuller(u1: number, u2: number): number {
    return Math.sqrt(-2 * Math.log(u1 + 0.0001)) * Math.cos(2 * Math.PI * u2);
  }

  private seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  private calculateOrientation(index: number, pattern: ConcentrationPatternType): number {
    if (pattern === 'SPIRAL' || pattern === 'RING') {
      return (index * 0.1) % (Math.PI * 2);
    }
    return this.seededRandom(index)( ) * Math.PI * 2;
  }

  private selectTypeByContext(
    index: number, 
    total: number, 
    types: string[], 
    pattern: ConcentrationPatternType
  ): number {
    // Logika pre výber typu podľa pozície (napr. vzácnejšie veci v strede clusteru)
    if (pattern === 'CLUSTER') {
      const normalizedDist = index / total; // Predpokladáme usporiadanie od stredu
      if (normalizedDist < 0.2 && types.length > 2) {
        return Math.floor(this.seededRandom(index)() * (types.length * 0.3)); // Vzácné typy
      }
    }
    return Math.floor(this.seededRandom(index + total)() * types.length);
  }

  private createMetadata(center: Vector3, params: ConcentrationParams) {
    return {
      pattern: params.pattern,
      center: center.clone(),
      boundingRadius: (params.spread * 10) // Zjednodušený odhad
    };
  }

  reset() {
    this.connectivityGrid.clear();
  }
}
