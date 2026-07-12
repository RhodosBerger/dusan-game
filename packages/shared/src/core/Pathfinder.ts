import { BiomeEngine } from './BiomeEngine';

export interface PathNode {
  chunkId: number;
  blockId: number;
  q: number;
  r: number;
}

export class Pathfinder {
  /**
   * Vypočíta vzdialenosť medzi dvoma hexagonálnymi koordinátami
   */
  public static hexDistance(q1: number, r1: number, q2: number, r2: number): number {
    return (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs((q1 + r1) - (q2 + r2))) / 2;
  }

  /**
   * Nájde A* najkratšiu cestu na aréne (63 blokov celkovo)
   * @param startChunkId Začiatočný chunk
   * @param startBlockId Začiatočný blok
   * @param targetChunkId Cieľový chunk
   * @param targetBlockId Cieľový blok
   * @param blocksList Zoznam všetkých blokov s ich priechodnosťou a násobičom energie
   */
  public static findPath(
    startChunkId: number,
    startBlockId: number,
    targetChunkId: number,
    targetBlockId: number,
    blocksList: { chunkId: number; blockId: number; walkable: boolean; energyCostMultiplier: number }[]
  ): PathNode[] | null {
    
    // Vytvoríme zoznam všetkých uzlov na grafe s ich súradnicami
    const nodes: (PathNode & { walkable: boolean; cost: number })[] = [];
    
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 7; j++) {
        const coords = BiomeEngine.getHexCoordinates(i, j);
        const listMatch = blocksList.find(b => b.chunkId === i && b.blockId === j);
        
        nodes.push({
          chunkId: i,
          blockId: j,
          q: coords.q,
          r: coords.r,
          walkable: listMatch ? listMatch.walkable : true,
          cost: listMatch ? listMatch.energyCostMultiplier : 1.0
        });
      }
    }

    const startNode = nodes.find(n => n.chunkId === startChunkId && n.blockId === startBlockId);
    const targetNode = nodes.find(n => n.chunkId === targetChunkId && n.blockId === targetBlockId);
    
    if (!startNode || !targetNode) return null;

    // A* inicializácia
    const openSet: typeof startNode[] = [startNode];
    const cameFrom = new Map<string, typeof startNode>();

    const gScore = new Map<string, number>(); // cena od štartu k uzlu
    const fScore = new Map<string, number>(); // odhadovaná celková cena cez uzol

    const keyOf = (n: PathNode) => `${n.chunkId}_${n.blockId}`;

    nodes.forEach(n => {
      gScore.set(keyOf(n), Infinity);
      fScore.set(keyOf(n), Infinity);
    });

    gScore.set(keyOf(startNode), 0);
    fScore.set(keyOf(startNode), this.hexDistance(startNode.q, startNode.r, targetNode.q, targetNode.r));

    while (openSet.length > 0) {
      // Nájdeme uzol v openSet s najnižším fScore
      openSet.sort((a, b) => (fScore.get(keyOf(a)) || Infinity) - (fScore.get(keyOf(b)) || Infinity));
      const current = openSet.shift()!;

      // Ak sme v cieli, zrekonštruujeme cestu
      if (current.chunkId === targetChunkId && current.blockId === targetBlockId) {
        const path: PathNode[] = [current];
        let currKey = keyOf(current);
        while (cameFrom.has(currKey)) {
          const parent = cameFrom.get(currKey)!;
          path.unshift(parent);
          currKey = keyOf(parent);
        }
        return path;
      }

      // Nájdeme susedov (vzdialenosť = 1)
      const neighbors = nodes.filter(n => {
        if (!n.walkable && !(n.chunkId === targetChunkId && n.blockId === targetBlockId)) return false;
        return this.hexDistance(current.q, current.r, n.q, n.r) === 1;
      });

      for (const neighbor of neighbors) {
        const nKey = keyOf(neighbor);
        const tentativeGScore = (gScore.get(keyOf(current)) ?? 0) + neighbor.cost;

        if (tentativeGScore < (gScore.get(nKey) ?? Infinity)) {
          cameFrom.set(nKey, current);
          gScore.set(nKey, tentativeGScore);
          fScore.set(nKey, tentativeGScore + this.hexDistance(neighbor.q, neighbor.r, targetNode.q, targetNode.r));

          if (!openSet.some(n => n.chunkId === neighbor.chunkId && n.blockId === neighbor.blockId)) {
            openSet.push(neighbor);
          }
        }
      }
    }

    return null; // Cesta neexistuje
  }

  /**
   * Validates if a target hex tile is within a specific range/reach from a start hex tile.
   */
  public static validateActionDistance(
    startMeta: number,
    startHex: number,
    targetMeta: number,
    targetHex: number,
    range: number,
    minRange: number = 0
  ): boolean {
    const startCoords = BiomeEngine.getHexCoordinates(startMeta, startHex);
    const targetCoords = BiomeEngine.getHexCoordinates(targetMeta, targetHex);
    const distance = this.hexDistance(startCoords.q, startCoords.r, targetCoords.q, targetCoords.r);
    return distance >= minRange && distance <= range;
  }
}
