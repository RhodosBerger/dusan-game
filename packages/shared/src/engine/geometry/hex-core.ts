/**
 * Hex Grid Core - Simplified for Snapshot System
 */

export class HexCoord {
  constructor(public q: number, public r: number) {}
  
  equals(other: HexCoord): boolean {
    return this.q === other.q && this.r === other.r;
  }
}

export class HexGrid {
  private sectors: Map<string, any> = new Map();
  private globalEntropy: number = 0.5;

  static distance(a: HexCoord, b: HexCoord): number {
    return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - b.q - b.r)) / 2;
  }

  hasSector(coord: HexCoord): boolean {
    return this.sectors.has(this.key(coord));
  }

  addSector(coord: HexCoord, data: any): void {
    this.sectors.set(this.key(coord), { coord, ...data });
  }

  updateSector(coord: HexCoord, data: any): void {
    const key = this.key(coord);
    if (this.sectors.has(key)) {
      this.sectors.set(key, { ...this.sectors.get(key), ...data });
    }
  }

  removeSector(coord: HexCoord): void {
    this.sectors.delete(this.key(coord));
  }

  getAllSectors(): HexCoord[] {
    return Array.from(this.sectors.values()).map(v => v.coord);
  }

  getGlobalEntropy(): number {
    return this.globalEntropy;
  }

  getBiomeAt(coord: HexCoord): string {
    const sector = this.sectors.get(this.key(coord));
    return sector?.content?.biome || 'default';
  }

  applyModification(coord: HexCoord, changes: any): void {
    const key = this.key(coord);
    const sector = this.sectors.get(key);
    if (sector) {
      sector.content = { ...sector.content, ...changes };
      this.sectors.set(key, sector);
    }
  }

  private key(coord: HexCoord): string {
    return `${coord.q},${coord.r}`;
  }
}

export default HexGrid;
