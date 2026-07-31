export type HardwareTier = 'LEGACY' | 'LOW_END' | 'NOMINAL' | 'HIGH_END';

export interface StructuralStateParameters {
  activeThreadsCount: number;
  globalEntropyStress: number;
  averageFrameTimeMs: number;
  viewportPropsCount: number;
  isLowPowerGPU?: boolean;
}

export interface BalancedExecutionLimits {
  hardwareTier: HardwareTier;
  kclIterations: number;         // Gauss-Seidel solver cykly
  gpuThrottleFrequencyHz: number; // Tlmenie uniformov na zamedzenie TDP špičiek
  instancedCullingLimit: number; // Orezanie props na GPU
  renderPostProcessing: boolean;  // Stav post-processingu scény
}

export interface BlockState {
  id: number;
  walkable?: boolean;
  hasTrap?: string | null;
  hasOpportunity?: string | null;
  hasChest?: boolean;
  isTown?: boolean;
}

export interface ChunkState {
  id: number;
  blocks: BlockState[];
}

export interface RenderThreadState {
  id: string;
  position: {
    meta: number | null;
    hex: number | null;
  };
}

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
  triggerVarietySwap: boolean;
}

export interface RenderPrioritiesPayload {
  playerLocation: { meta: number; hex: number };
  priorities: PriorityNode[];
  instancedGroups: InstancedGroup[];
}

export class RenderPriorityBalancer {
  static getTopologyDistance(c1: number, h1: number, c2: number, h2: number): number {
    const x1 = c1 % 3;
    const y1 = Math.floor(c1 / 3);
    const x2 = c2 % 3;
    const y2 = Math.floor(c2 / 3);

    const hx1 = h1 === 3 ? 0 : Math.cos((h1 * Math.PI) / 3);
    const hy1 = h1 === 3 ? 0 : Math.sin((h1 * Math.PI) / 3);
    const hx2 = h2 === 3 ? 0 : Math.cos((h2 * Math.PI) / 3);
    const hy2 = h2 === 3 ? 0 : Math.sin((h2 * Math.PI) / 3);

    const chunkDist = Math.abs(x1 - x2) + Math.abs(y1 - y2);
    const hexDist = Math.sqrt((hx1 - hx2) ** 2 + (hy1 - hy2) ** 2);

    return chunkDist * 3 + hexDist;
  }

  static getRenderPriorities(
    engine: { map: { chunks: ChunkState[] }; threads: RenderThreadState[] },
    threadId: string
  ): RenderPrioritiesPayload | null {
    const thread = engine.threads.find(t => t.id === threadId);
    if (!thread) return null;

    const playerMeta = thread.position.meta !== null ? thread.position.meta : 0;
    const playerHex = thread.position.hex !== null ? thread.position.hex : 3;

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
        let triggerVarietySwap = false;
        if (positions.length >= 3) {
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

    priorities.sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return a.distance - b.distance;
    });

    return {
      playerLocation: { meta: playerMeta, hex: playerHex },
      priorities,
      instancedGroups
    };
  }

  /**
   * Čistá matematická funkcia bez side-efektov (Pure Function)
   * Vyhodnocuje priority záťaže striktne zo štrukturálnych parametrov stavu
   */
  public static balanceComputeLoad(params: StructuralStateParameters): BalancedExecutionLimits {
    let limits: BalancedExecutionLimits;

    // SCENÁR A: Legacy/Extrémny hardvérový klastrový stres / slabá GPU
    if (params.isLowPowerGPU || params.averageFrameTimeMs > 33.3) {
      limits = {
        hardwareTier: 'LEGACY',
        kclIterations: 8,          // Redukovaný výpočtový budget solvera
        gpuThrottleFrequencyHz: 2,   // Striktný throttling zápisu na slabých GPU
        instancedCullingLimit: Math.max(5, params.viewportPropsCount - 45),
        renderPostProcessing: false
      };
    }
    // SCENÁR B: Slabý hardvér
    else if (params.averageFrameTimeMs > 16.6 || params.globalEntropyStress > 0.8) {
      limits = {
        hardwareTier: 'LOW_END',
        kclIterations: 16,
        gpuThrottleFrequencyHz: 5,
        instancedCullingLimit: Math.max(10, params.viewportPropsCount - 30),
        renderPostProcessing: false
      };
    }
    // SCENÁR C: Výkonný hardvér
    else if (params.averageFrameTimeMs < 8.3 && params.globalEntropyStress < 0.3) {
      limits = {
        hardwareTier: 'HIGH_END',
        kclIterations: 40,
        gpuThrottleFrequencyHz: 30,
        instancedCullingLimit: params.viewportPropsCount,
        renderPostProcessing: true
      };
    }
    // SCENÁR D: Nominálny stav
    else {
      limits = {
        hardwareTier: 'NOMINAL',
        kclIterations: 24,
        gpuThrottleFrequencyHz: 10,
        instancedCullingLimit: Math.min(params.viewportPropsCount, 50),
        renderPostProcessing: true
      };
    }

    return this.validateLimits(limits, limits.hardwareTier);
  }

  /**
   * Skontroluje a koriguje limity pre danú výkonnostnú triedu
   */
  public static validateLimits(limits: BalancedExecutionLimits, tier: HardwareTier): BalancedExecutionLimits {
    const validated = { ...limits };
    if (tier === 'LEGACY') {
      validated.kclIterations = Math.min(8, validated.kclIterations);
      validated.gpuThrottleFrequencyHz = Math.min(2, validated.gpuThrottleFrequencyHz);
      validated.instancedCullingLimit = Math.min(5, validated.instancedCullingLimit);
      validated.renderPostProcessing = false;
    } else if (tier === 'LOW_END') {
      validated.kclIterations = Math.min(16, validated.kclIterations);
      validated.gpuThrottleFrequencyHz = Math.min(5, validated.gpuThrottleFrequencyHz);
      validated.instancedCullingLimit = Math.min(20, validated.instancedCullingLimit);
      validated.renderPostProcessing = false;
    } else if (tier === 'NOMINAL') {
      validated.kclIterations = Math.max(16, Math.min(24, validated.kclIterations));
      validated.gpuThrottleFrequencyHz = Math.max(5, Math.min(10, validated.gpuThrottleFrequencyHz));
      validated.instancedCullingLimit = Math.min(50, validated.instancedCullingLimit);
    } else if (tier === 'HIGH_END') {
      validated.kclIterations = Math.max(24, Math.min(40, validated.kclIterations));
      validated.gpuThrottleFrequencyHz = Math.max(10, Math.min(30, validated.gpuThrottleFrequencyHz));
    }
    return validated;
  }
}
