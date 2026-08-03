/**
 * Boolean Hex Core - Deskriptívna geometria pre hex grid systém
 * 
 * Implementuje boolean operácie na hexagonálnych bunkách
 * Umožňuje komplexné tvarovanie terénu a štruktúr
 */

export type HexCoordinate = { q: number; r: number; s?: number };
export type BooleanOperation = 'union' | 'intersection' | 'difference' | 'xor';

export interface HexCell {
  q: number;
  r: number;
  s: number;
  active: boolean;
  terrainType: string;
  elevation: number;
  properties: Record<string, any>;
}

export interface GeometricShape {
  id: string;
  type: 'circle' | 'rectangle' | 'triangle' | 'polygon' | 'custom';
  center: HexCoordinate;
  size: number;
  rotation: number;
  points?: HexCoordinate[];
  booleanOp: BooleanOperation;
}

export class BooleanHexCore {
  private grid: Map<string, HexCell>;
  private shapes: Map<string, GeometricShape>;
  private readonly gridSize: number;

  constructor(gridSize: number = 100) {
    this.grid = new Map();
    this.shapes = new Map();
    this.gridSize = gridSize;
  }

  /**
   * Konvertuje hex súradnice na string kľúč
   */
  private hexKey(q: number, r: number): string {
    return `${q},${r}`;
  }

  /**
   * Získa bunku zo súradníc
   */
  public getCell(q: number, r: number): HexCell | null {
    const key = this.hexKey(q, r);
    return this.grid.get(key) || null;
  }

  /**
   * Nastaví bunku
   */
  public setCell(q: number, r: number, cell: Partial<HexCell>): void {
    const key = this.hexKey(q, r);
    const existing = this.grid.get(key);
    
    this.grid.set(key, {
      q,
      r,
      s: -q - r, // Hex constraint
      active: true,
      terrainType: 'grass',
      elevation: 0,
      properties: {},
      ...existing,
      ...cell,
    });
  }

  /**
   * Pridá geometrický tvar do systému
   */
  public addShape(shape: GeometricShape): void {
    this.shapes.set(shape.id, shape);
    this.rasterizeShape(shape);
  }

  /**
   * Rasterizuje tvar do hex buniek
   */
  private rasterizeShape(shape: GeometricShape): void {
    const affectedCells = this.calculateShapeCells(shape);
    
    affectedCells.forEach(({ q, r, value }) => {
      const key = this.hexKey(q, r);
      const existing = this.grid.get(key);
      
      if (!existing) {
        this.setCell(q, r, { 
          active: value > 0.5,
          properties: { shapeId: shape.id, shapeValue: value }
        });
      } else {
        // Aplikuj boolean operáciu
        const newValue = this.applyBooleanOperation(
          existing.active ? 1 : 0,
          value,
          shape.booleanOp
        );
        
        this.setCell(q, r, {
          active: newValue > 0.5,
          properties: {
            ...existing.properties,
            shapeId: shape.id,
            shapeValue: value,
            lastOperation: shape.booleanOp,
          },
        });
      }
    });
  }

  /**
   * Vypočíta bunky ovplyvnené tvarom
   */
  private calculateShapeCells(shape: GeometricShape): Array<{ q: number; r: number; value: number }> {
    const cells: Array<{ q: number; r: number; value: number }> = [];
    const radius = Math.ceil(shape.size * 1.5);

    for (let dq = -radius; dq <= radius; dq++) {
      for (let dr = -radius; dr <= radius; dr++) {
        const q = shape.center.q + dq;
        const r = shape.center.r + dr;
        
        // Skontroluj či je v rámci gridu
        if (Math.abs(q) > this.gridSize || Math.abs(r) > this.gridSize) continue;

        const value = this.evaluateShapeAt(shape, q, r);
        
        if (value > 0) {
          cells.push({ q, r, value });
        }
      }
    }

    return cells;
  }

  /**
   * Vyhodnotí hodnotu tvaru v danom bode
   */
  private evaluateShapeAt(shape: GeometricShape, q: number, r: number): number {
    const dq = q - shape.center.q;
    const dr = r - shape.center.r;
    const distance = Math.sqrt(dq * dq + dr * dr + dq * dr); // Hex distance

    switch (shape.type) {
      case 'circle':
        return distance <= shape.size ? 1 - distance / shape.size : 0;
      
      case 'rectangle':
        const absDq = Math.abs(dq);
        const absDr = Math.abs(dr);
        return absDq <= shape.size && absDr <= shape.size ? 1 : 0;
      
      case 'triangle':
        // Rovnostranný trojuholník
        const rotatedQ = dq * Math.cos(shape.rotation) - dr * Math.sin(shape.rotation);
        const rotatedR = dq * Math.sin(shape.rotation) + dr * Math.cos(shape.rotation);
        return rotatedR >= 0 && rotatedR <= shape.size && 
               Math.abs(rotatedQ) <= (shape.size - rotatedR) * 0.577 ? 1 : 0;
      
      case 'polygon':
        if (!shape.points || shape.points.length === 0) return 0;
        return this.pointInPolygon(q, r, shape.points) ? 1 : 0;
      
      case 'custom':
        // Custom evaluation via properties
        return shape.properties?.evaluator?.(q, r) || 0;
      
      default:
        return 0;
    }
  }

  /**
   * Test či je bod v polygóne
   */
  private pointInPolygon(q: number, r: number, points: HexCoordinate[]): boolean {
    let inside = false;
    const n = points.length;
    
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const qi = points[i].q, ri = points[i].r;
      const qj = points[j].q, rj = points[j].r;
      
      if (((ri > r) !== (rj > r)) &&
          (q < (qj - qi) * (r - ri) / (rj - ri) + qi)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  /**
   * Aplikuje boolean operáciu na dve hodnoty
   */
  private applyBooleanOperation(a: number, b: number, op: BooleanOperation): number {
    switch (op) {
      case 'union':
        return Math.max(a, b);
      case 'intersection':
        return Math.min(a, b);
      case 'difference':
        return Math.max(0, a - b);
      case 'xor':
        return Math.abs(a - b);
      default:
        return a;
    }
  }

  /**
   * Vykoná boolean operáciu medzi dvoma tvarmi
   */
  public booleanOperation(shapeId1: string, shapeId2: string, operation: BooleanOperation): void {
    const shape1 = this.shapes.get(shapeId1);
    const shape2 = this.shapes.get(shapeId2);
    
    if (!shape1 || !shape2) return;

    // Získaj všetky ovplyvnené bunky
    const cells1 = this.calculateShapeCells(shape1);
    const cells2 = this.calculateShapeCells(shape2);
    
    // Spojenie všetkých buniek
    const allKeys = new Set<string>();
    cells1.forEach(c => allKeys.add(this.hexKey(c.q, c.r)));
    cells2.forEach(c => allKeys.add(this.hexKey(c.q, c.r)));

    allKeys.forEach(key => {
      const [q, r] = key.split(',').map(Number);
      const cell = this.getCell(q, r);
      
      if (!cell) return;

      const value1 = this.evaluateShapeAt(shape1, q, r);
      const value2 = this.evaluateShapeAt(shape2, q, r);
      
      const result = this.applyBooleanOperation(value1, value2, operation);
      
      this.setCell(q, r, {
        active: result > 0.5,
        properties: {
          ...cell.properties,
          lastOperation: operation,
          sourceShapes: [shapeId1, shapeId2],
        },
      });
    });
  }

  /**
   * Generuje procedurálny terén pomocou boolean operácií
   */
  public generateProceduralTerrain(config: {
    seed: number;
    continentCount: number;
    islandCount: number;
    mountainRanges: number;
  }): void {
    const seededRandom = this.createSeededRandom(config.seed);
    
    // Generuj kontinenty
    for (let i = 0; i < config.continentCount; i++) {
      const q = Math.floor((seededRandom() - 0.5) * this.gridSize);
      const r = Math.floor((seededRandom() - 0.5) * this.gridSize);
      const size = 10 + seededRandom() * 20;
      
      this.addShape({
        id: `continent-${i}`,
        type: 'circle',
        center: { q, r },
        size,
        rotation: 0,
        booleanOp: 'union',
      });
    }

    // Generuj ostrovy
    for (let i = 0; i < config.islandCount; i++) {
      const angle = seededRandom() * Math.PI * 2;
      const distance = 30 + seededRandom() * 40;
      const q = Math.floor(Math.cos(angle) * distance);
      const r = Math.floor(Math.sin(angle) * distance);
      const size = 5 + seededRandom() * 10;
      
      this.addShape({
        id: `island-${i}`,
        type: 'circle',
        center: { q, r },
        size,
        rotation: 0,
        booleanOp: 'union',
      });
    }

    // Generuj pohoria
    for (let i = 0; i < config.mountainRanges; i++) {
      const q = Math.floor((seededRandom() - 0.5) * this.gridSize * 0.8);
      const r = Math.floor((seededRandom() - 0.5) * this.gridSize * 0.8);
      const length = 20 + seededRandom() * 30;
      const width = 3 + seededRandom() * 5;
      const rotation = seededRandom() * Math.PI;
      
      // Vytvor dlhý obdĺžnik ako pohorie
      const points: HexCoordinate[] = [];
      for (let j = 0; j < length; j += 2) {
        points.push({
          q: Math.floor(j * Math.cos(rotation)),
          r: Math.floor(j * Math.sin(rotation)),
        });
      }
      
      this.addShape({
        id: `mountain-${i}`,
        type: 'polygon',
        center: { q, r },
        size: width,
        rotation,
        points,
        booleanOp: 'intersection',
      });
    }
  }

  /**
   * Vráti všetky aktívne bunky
   */
  public getAllActiveCells(): HexCell[] {
    return Array.from(this.grid.values()).filter(cell => cell.active);
  }

  /**
   * Exportuje grid ako JSON
   */
  public exportToJSON(): string {
    return JSON.stringify({
      gridSize: this.gridSize,
      cells: this.getAllActiveCells(),
      shapes: Array.from(this.shapes.values()),
      exportedAt: Date.now(),
    });
  }

  /**
   * Importuje grid z JSON
   */
  public importFromJSON(json: string): void {
    const data = JSON.parse(json);
    
    this.grid.clear();
    this.shapes.clear();
    
    data.cells.forEach((cell: HexCell) => {
      this.setCell(cell.q, cell.r, cell);
    });
    
    data.shapes.forEach((shape: GeometricShape) => {
      this.shapes.set(shape.id, shape);
    });
  }

  /**
   * Vytvorí seeded random funkciu
   */
  private createSeededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  /**
   * Získa susedné bunky
   */
  public getNeighbors(q: number, r: number): HexCell[] {
    const directions = [
      { dq: 1, dr: 0 }, { dq: 1, dr: -1 }, { dq: 0, dr: -1 },
      { dq: -1, dr: 0 }, { dq: -1, dr: 1 }, { dq: 0, dr: 1 }
    ];
    
    return directions
      .map(({ dq, dr }) => this.getCell(q + dq, r + dr))
      .filter((cell): cell is HexCell => cell !== null);
  }

  /**
   * Vypočíta vzdialenosť medzi dvoma hex bunkami
   */
  public hexDistance(q1: number, r1: number, q2: number, r2: number): number {
    return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
  }
}

export default BooleanHexCore;
