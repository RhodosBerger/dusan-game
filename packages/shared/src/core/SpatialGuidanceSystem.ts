export interface CartesianPoint {
  x: number;
  y: number;
  z: number;
}

export class SpatialGuidanceSystem {
  private static HEX_RADIUS = 2.0;
  private static SQRT_3 = Math.sqrt(3);

  /**
   * Translates macroIndex (chunk) and subIndex (tile) to axial coordinates (q, r)
   */
  public static resolveAxial(macroIndex: number, subIndex: number): { q: number; r: number } {
    const macroCenters = [
      { q: 0, r: 0 },   { q: 3, r: -1 },  { q: 6, r: -2 },
      { q: -1, r: 3 },  { q: 2, r: 2 },   { q: 5, r: 1 },
      { q: -2, r: 6 },  { q: 1, r: 5 },   { q: 4, r: 4 }
    ];

    const subHexOffsets = [
      { q: 0, r: 0 },  // Center
      { q: 1, r: 0 },  { q: 1, r: -1 }, { q: 0, r: -1 },
      { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
    ];

    const center = macroCenters[macroIndex] || { q: 0, r: 0 };
    const offset = subHexOffsets[subIndex] || { q: 0, r: 0 };

    return {
      q: center.q + offset.q,
      r: center.r + offset.r
    };
  }

  /**
   * Translates macroIndex and subIndex to 3D Cartesian coordinates
   */
  public static resolveCartesian(macroIndex: number, subIndex: number): CartesianPoint {
    const { q, r } = this.resolveAxial(macroIndex, subIndex);
    const x = this.HEX_RADIUS * (this.SQRT_3 * q + (this.SQRT_3 / 2) * r);
    const z = this.HEX_RADIUS * (1.5 * r);
    return { x, y: 0, z };
  }

  /**
   * Computes the 3D Euclidean distance between two nodes
   */
  public static calculateDistance(p1: CartesianPoint, p2: CartesianPoint): number {
    return Math.sqrt(
      Math.pow(p2.x - p1.x, 2) +
      Math.pow(p2.y - p1.y, 2) +
      Math.pow(p2.z - p1.z, 2)
    );
  }

  /**
   * Computes the trajectory vector (slope/delta direction)
   */
  public static calculateTrajectory(p1: CartesianPoint, p2: CartesianPoint): CartesianPoint {
    return {
      x: p2.x - p1.x,
      y: p2.y - p1.y,
      z: p2.z - p1.z
    };
  }

  /**
   * Generates a deterministic spatial script for the movement/attack trajectory
   */
  public static generateTrajectoryScript(
    sourceId: string,
    targetId: string,
    p1: CartesianPoint,
    p2: CartesianPoint
  ): string {
    const distance = this.calculateDistance(p1, p2);
    const traj = this.calculateTrajectory(p1, p2);
    
    return `// AUTO-GENERATED DETERMINISTIC SPATIAL TRAJECTORY SCRIPT
// SOURCE: ${sourceId}
// TARGET: ${targetId}
// CARTESIAN SOURCE XYZ: [${p1.x.toFixed(2)}, ${p1.y.toFixed(2)}, ${p1.z.toFixed(2)}]
// CARTESIAN TARGET XYZ: [${p2.x.toFixed(2)}, ${p2.y.toFixed(2)}, ${p2.z.toFixed(2)}]
// TRAJECTORY DELTA VECTOR: dx: ${traj.x.toFixed(2)}, dy: ${traj.y.toFixed(2)}, dz: ${traj.z.toFixed(2)}
// EUCLIDEAN 3D DISTANCE: ${distance.toFixed(3)} units

INITIATE_TRAJECTORY_VECTOR(${p1.x.toFixed(3)}, ${p1.y.toFixed(3)}, ${p1.z.toFixed(3)}, ${p2.x.toFixed(3)}, ${p2.y.toFixed(3)}, ${p2.z.toFixed(3)});
DISPLACE_THREAD_COMPLEX_PATH(${distance.toFixed(3)});
SYNC_CARTEZIAN_COORDINATES();
`;
  }

  /**
   * Resolves a target Cartesian position based on 8-directional pull
   */
  public static resolveEightDirectionTarget(
    source: CartesianPoint,
    direction: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW',
    distanceUnits: number
  ): CartesianPoint {
    const angleMap = {
      N: Math.PI / 2,
      NE: Math.PI / 4,
      E: 0,
      SE: -Math.PI / 4,
      S: -Math.PI / 2,
      SW: -3 * Math.PI / 4,
      W: Math.PI,
      NW: 3 * Math.PI / 4
    };

    const angle = angleMap[direction] !== undefined ? angleMap[direction] : 0;
    const stepSize = 4.0; // distance spacing
    const dx = Math.cos(angle) * stepSize * distanceUnits;
    const dz = Math.sin(angle) * stepSize * distanceUnits;

    return {
      x: source.x + dx,
      y: source.y,
      z: source.z + dz
    };
  }

  /**
   * Maps Slovak or standard string terms to direction abbreviations
   */
  public static mapDirection(dir: string): 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' {
    const cleaned = dir.trim().toLowerCase();
    if (cleaned === 'sever' || cleaned === 'n' || cleaned === 'north') return 'N';
    if (cleaned === 'severovychod' || cleaned === 'severovýchod' || cleaned === 'ne' || cleaned === 'northeast') return 'NE';
    if (cleaned === 'vychod' || cleaned === 'východ' || cleaned === 'e' || cleaned === 'east') return 'E';
    if (cleaned === 'juhovychod' || cleaned === 'juhovýchod' || cleaned === 'se' || cleaned === 'southeast') return 'SE';
    if (cleaned === 'juh' || cleaned === 's' || cleaned === 'south') return 'S';
    if (cleaned === 'juhozapad' || cleaned === 'juhozápad' || cleaned === 'sw' || cleaned === 'southwest') return 'SW';
    if (cleaned === 'zapad' || cleaned === 'západ' || cleaned === 'w' || cleaned === 'west') return 'W';
    if (cleaned === 'severozapad' || cleaned === 'severozápad' || cleaned === 'nw' || cleaned === 'northwest') return 'NW';
    return 'N';
  }
}
