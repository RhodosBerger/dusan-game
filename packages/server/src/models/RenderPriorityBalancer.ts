// packages/server/src/models/RenderPriorityBalancer.ts
import { SovereignEngine } from './SovereignEngine';

export interface PriorityNode {
  meta: number;
  hex: number;
  distance: number;
  priority: 'CRITICAL' | 'HIGH' | 'LOW' | 'CULLED';
  priorityScore: number; // 0.0 to 1.0
}

export interface InstancedGroup {
  entityType: string;
  instanceCount: number;
  positions: { meta: number; hex: number }[];
  triggerVarietySwap: boolean; // Anti-repetitiveness flag
}

export interface RenderPrioritiesPayload {
  playerLocation: { meta: number; hex: number };
  priorities: PriorityNode[];
  instancedGroups: InstancedGroup[];
}

export class RenderPriorityBalancer {
  /**
   * Helper to calculate topological distance between two hexes on the 9-chunk map.
   */
  static getTopologyDistance(c1: number, h1: number, c2: number, h2: number): number {
    // 3x3 layout coordinates for chunks 0-8
    const x1 = c1 % 3;
    const y1 = Math.floor(c1 / 3);
    const x2 = c2 % 3;
    const y2 = Math.floor(c2 / 3);

    // Hex sub-layout coordinate offsets
    // Node 3 is the center, others are radial
    const hx1 = h1 === 3 ? 0 : Math.cos((h1 * Math.PI) / 3);
    const hy1 = h1 === 3 ? 0 : Math.sin((h1 * Math.PI) / 3);
    const hx2 = h2 === 3 ? 0 : Math.cos((h2 * Math.PI) / 3);
    const hy2 = h2 === 3 ? 0 : Math.sin((h2 * Math.PI) / 3);

    const chunkDist = Math.abs(x1 - x2) + Math.abs(y1 - y2);
    const hexDist = Math.sqrt((hx1 - hx2) ** 2 + (hy1 - hy2) ** 2);

    return chunkDist * 3 + hexDist;
  }

  /**
   * Calculates render priority levels and instancing opportunities.
   */
  static getRenderPriorities(engine: SovereignEngine, threadId: string): RenderPrioritiesPayload | null {
    const thread = engine.threads.find(t => t.id === threadId);
    if (!thread) return null;

    const playerMeta = thread.position.meta !== null ? thread.position.meta : 0;
    const playerHex = thread.position.hex !== null ? thread.position.hex : 3;

    // 1. Calculate distances & priorities for all 63 hexagons
    const priorities: PriorityNode[] = [];
    engine.map.chunks.forEach((chunk) => {
      chunk.blocks.forEach((block) => {
        const dist = RenderPriorityBalancer.getTopologyDistance(playerMeta, playerHex, chunk.id, block.id);
        
        let priority: PriorityNode['priority'] = 'CULLED';
        let priorityScore = 0.0;

        if (dist < 1.0) {
          priority = 'CRITICAL';
          priorityScore = 1.0;
        } else if (dist < 4.0) {
          priority = 'HIGH';
          priorityScore = 0.7;
        } else if (dist < 7.0) {
          priority = 'LOW';
          priorityScore = 0.3;
        } else {
          priority = 'CULLED';
          priorityScore = 0.0;
        }

        priorities.push({
          meta: chunk.id,
          hex: block.id,
          distance: Number(dist.toFixed(2)),
          priority,
          priorityScore
        });
      });
    });

    // 2. Identify instanced rendering opportunities for static/dynamic meshes
    const entityGroups: { [key: string]: { meta: number; hex: number }[] } = {
      'ROOT_TRAP': [],
      'EMP_MINE': [],
      'SURGE_NODE': [],
      'VOID_RIFT': [],
      'REPAIR_KIT': [],
      'CHEST': [],
      'TOWN': []
    };

    engine.map.chunks.forEach((chunk) => {
      chunk.blocks.forEach((block) => {
        if (block.hasTrap) {
          entityGroups[block.hasTrap].push({ meta: chunk.id, hex: block.id });
        }
        if (block.hasOpportunity) {
          entityGroups[block.hasOpportunity].push({ meta: chunk.id, hex: block.id });
        }
        if (block.hasChest) {
          entityGroups['CHEST'].push({ meta: chunk.id, hex: block.id });
        }
        if (block.isTown) {
          entityGroups['TOWN'].push({ meta: chunk.id, hex: block.id });
        }
      });
    });

    const instancedGroups: InstancedGroup[] = [];
    Object.keys(entityGroups).forEach((type) => {
      const positions = entityGroups[type];
      if (positions.length > 0) {
        // Anti-repetitiveness check (ML Variety threshold)
        // If more than 3 instances are grouped closely in adjacent chunks,
        // flag it to trigger variety swaps (alternate mesh models/textures)
        let triggerVarietySwap = false;
        if (positions.length >= 3) {
          // Count nearby coordinates
          let closePairs = 0;
          for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
              const dx = Math.abs((positions[i].meta % 3) - (positions[j].meta % 3));
              const dy = Math.abs(Math.floor(positions[i].meta / 3) - Math.floor(positions[j].meta / 3));
              if (dx <= 1 && dy <= 1) {
                closePairs++;
              }
            }
          }
          if (closePairs >= 2) {
            triggerVarietySwap = true;
          }
        }

        instancedGroups.push({
          entityType: type,
          instanceCount: positions.length,
          positions,
          triggerVarietySwap
        });
      }
    });

    return {
      playerLocation: { meta: playerMeta, hex: playerHex },
      priorities,
      instancedGroups
    };
  }
}
