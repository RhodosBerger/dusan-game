// packages/shared/src/core/AlgebraicOpportunityGenerator.ts

export type OpportunityType = 'SURGE_NODE' | 'VOID_RIFT' | 'REPAIR_KIT';

export interface OpportunityInfo {
  type: OpportunityType;
  position: { meta: number; hex: number };
  value: number;
}

export class AlgebraicOpportunityGenerator {
  /**
   * Topologically calculates the midpoint spawn coordinate on the hexagonal grid.
   */
  static calculateSpawnHex(
    playerAPos: { meta: number; hex: number } | null,
    playerBPos: { meta: number; hex: number } | null
  ): { meta: number; hex: number } {
    const posA = playerAPos || { meta: 0, hex: 0 };
    const posB = playerBPos || { meta: 5, hex: 5 };

    let meta = Math.round((posA.meta + posB.meta) / 2);
    let hex = Math.round((posA.hex + posB.hex) / 2);

    // If it falls exactly on one of the players' positions, offset it to ensure a neutral spawn
    const isPlayerA = (meta === posA.meta && hex === posA.hex);
    const isPlayerB = (meta === posB.meta && hex === posB.hex);
    if (isPlayerA || isPlayerB) {
      hex = (hex + 2) % 7;
      meta = (meta + 1) % 9;
    }

    return { meta, hex };
  }

  /**
   * Translates opportunity data into a simulated hexadecimal RAM/swap memory dump register string.
   */
  static convertToHexDump(type: OpportunityType, meta: number, hex: number, value: number): string {
    const typeCode = type === 'SURGE_NODE' ? '11' :
                     type === 'VOID_RIFT' ? '22' : '33';

    const metaHex = meta.toString(16).padStart(2, '0');
    const hexHex = hex.toString(16).padStart(2, '0');
    const valHex = value.toString(16).padStart(2, '0');

    return "0x" + `${typeCode}${metaHex}${hexHex}${valHex}`.toUpperCase();
  }

  /**
   * Randomly decides which opportunity to spawn based on entropy level.
   */
  static getOpportunityTypeByEntropy(entropy: number): OpportunityType {
    if (entropy > 0.6) {
      return 'VOID_RIFT'; // High entropy triggers spatial voids
    }
    return Math.random() > 0.5 ? 'SURGE_NODE' : 'REPAIR_KIT';
  }
}
