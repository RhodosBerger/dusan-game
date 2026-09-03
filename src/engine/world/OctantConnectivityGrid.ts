/**
 * Octant Connectivity Grid
 * 
 * Spravuje 8-smerové nadväznosti medzi objektmi v priestore.
 * Zabezpečuje, že generované objekty dodržiavajú pravidlá susedstva a connectivity.
 */

import { Vector3 } from 'three';

export type OctantDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export interface ConnectivityRule {
  axiomType: string;
  allowedNeighbors: OctantDirection[];
  forbiddenNeighbors: OctantDirection[];
  maxAdjacentSameType: number;
}

export class OctantConnectivityGrid {
  private grid: Map<string, string> = new Map(); // key: "x,y,z", value: axiomType
  private rules: Map<string, ConnectivityRule> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    // Predvolené pravidlá pre základné typy
    this.registerRule({
      axiomType: 'FOREST',
      allowedNeighbors: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
      forbiddenNeighbors: [],
      maxAdjacentSameType: 5
    });

    this.registerRule({
      axiomType: 'WATER',
      allowedNeighbors: ['N', 'E', 'S', 'W'], // Diagonálne nepripojené
      forbiddenNeighbors: ['NE', 'SE', 'SW', 'NW'],
      maxAdjacentSameType: 10
    });

    this.registerRule({
      axiomType: 'MOUNTAIN',
      allowedNeighbors: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
      forbiddenNeighbors: [],
      maxAdjacentSameType: 3
    });

    this.registerRule({
      axiomType: 'URBAN',
      allowedNeighbors: ['N', 'E', 'S', 'W'],
      forbiddenNeighbors: [],
      maxAdjacentSameType: 8
    });
  }

  registerRule(rule: ConnectivityRule) {
    this.rules.set(rule.axiomType, rule);
  }

  /**
   * Overí či je možné umiestniť objekt na danú pozíciu
   */
  validatePlacement(position: Vector3, axiomType: string): boolean {
    const rule = this.rules.get(axiomType);
    if (!rule) return true; // Ak nie je pravidlo, povoľujeme

    const neighbors = this.getNeighbors(position);
    
    // Kontrola zakázaných smerov
    for (const [direction, neighborType] of neighbors) {
      if (rule.forbiddenNeighbors.includes(direction)) {
        return false;
      }
      
      // Kontrola maximálneho počtu susedov rovnakého typu
      if (neighborType === axiomType) {
        const sameTypeCount = Array.from(neighbors.values())
          .filter(t => t === axiomType).length;
        
        if (sameTypeCount >= rule.maxAdjacentSameType) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Zaregistruje objekt do gridu
   */
  registerObject(position: Vector3, axiomType: string) {
    const key = this.getPositionKey(position);
    this.grid.set(key, axiomType);
  }

  /**
   * Získa susedov danej pozície s ich smermi
   */
  getNeighbors(position: Vector3): Map<OctantDirection, string> {
    const neighbors = new Map<OctantDirection, string>();
    const directions: Record<OctantDirection, { x: number; z: number }> = {
      'N': { x: 0, z: -1 },
      'NE': { x: 1, z: -1 },
      'E': { x: 1, z: 0 },
      'SE': { x: 1, z: 1 },
      'S': { x: 0, z: 1 },
      'SW': { x: -1, z: 1 },
      'W': { x: -1, z: 0 },
      'NW': { x: -1, z: -1 }
    };

    for (const [dir, offset] of Object.entries(directions)) {
      const neighborPos = new Vector3(
        position.x + offset.x,
        position.y,
        position.z + offset.z
      );
      const key = this.getPositionKey(neighborPos);
      const type = this.grid.get(key);
      if (type) {
        neighbors.set(dir as OctantDirection, type);
      }
    }

    return neighbors;
  }

  private getPositionKey(position: Vector3): string {
    return `${Math.round(position.x)},${Math.round(position.y)},${Math.round(position.z)}`;
  }

  clear() {
    this.grid.clear();
  }

  getSize(): number {
    return this.grid.size;
  }
}
