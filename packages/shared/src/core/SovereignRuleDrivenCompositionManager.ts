import { HexNode } from './GoCoreMediator';

export interface RuleDrivenComposition {
    nodes: HexNode[];
    teethCount: number;
    heightOffset: number;
    staggeredFramesCount: number;
    isTdpCompliant: boolean;
}

/**
 * SovereignRuleDrivenCompositionManager manages procedural scene composition automatically
 * in compliance with strict game rules and hardware TDP ceilings.
 */
export class SovereignRuleDrivenCompositionManager {
    /**
     * Verifies that the proposed element placement complies with walkability constraints,
     * hazardIndex bounds, and active thread densities (TDP/spawner safety).
     */
    public static validatePlacement(node: HexNode, placedCount: number, activeThreadsInChunk = 0): { placeable: boolean; reason: string } {
        // Spawner guards: walkable === true && hazardIndex < 0.9 (Rule 5 & Rule 2)
        if (node.walkable === false) {
            return { placeable: false, reason: "Target node is not walkable" };
        }
        if (node.hazardIndex !== undefined && node.hazardIndex >= 0.9) {
            return { placeable: false, reason: "Target node hazard index exceeds spawner safety bound (0.9)" };
        }
        // Spawner guard: active threads in chunk < 6 (Rule 5)
        if (activeThreadsInChunk >= 6) {
            return { placeable: false, reason: "Active threads in target chunk exceed concurrency limit (6)" };
        }
        // TDP safeguard: limit total active props per layout composition to 128
        if (placedCount >= 128) {
            return { placeable: false, reason: "TDP safety limit reached: maximum 128 active elements per composition" };
        }

        return { placeable: true, reason: "Nominal" };
    }

    /**
     * Maps developer metrics (lines of code, build time) to 3D geometry parameters.
     */
    public static mapCodeToGeometry(codeLines: number, buildTimeSec: number): { teethCount: number; heightOffset: number } {
        // Limit teeth count to a ceiling of 24 front/back outer teeth (Rule 10 - procedural gear mesh)
        // Ensure a minimum of 6 teeth
        const teethCount = Math.max(6, Math.min(24, Math.floor(codeLines / 100)));
        
        // Build duration maps to vertical height offset of hex tiles (max height 5.0 units)
        const heightOffset = Math.max(0.0, Math.min(5.0, buildTimeSec * 0.5));
        
        return { teethCount, heightOffset };
    }

    /**
     * Automatically synthesizes and modulates the hex grid composition according to active game rules
     * and external telemetry inputs.
     */
    public static synthesizeComposition(
        gridData: HexNode[], 
        telemetry: { codeLines: number; buildTimeSec: number },
        globalEntropy: number,
        activeThreadsCount: number
    ): RuleDrivenComposition {
        const { teethCount, heightOffset } = this.mapCodeToGeometry(telemetry.codeLines, telemetry.buildTimeSec);

        // Map and mutate nodes properties based on rules
        const mutatedNodes = gridData.map(node => {
            let friction = node.friction ?? 0.5;
            let conductivity = node.conductivity ?? 0.5;
            let hazardIndex = node.hazardIndex ?? 0.1;
            const walkable = node.walkable !== false;
            const voltage = node.voltage ?? 0.0;

            // Rule 3: Void Walker casting / Environmental scaling
            // Faction energy consumption reduces card costs to 0 when globalEntropy > 0.7
            if (globalEntropy > 0.7 && node.biome === 'VOID_CRUCIBLE') {
                conductivity = 1.0;
                hazardIndex = 0.85;
            }

            // Rule 2: Combos elevate/sink hex tile positions
            // Adjust voltage surge heights: nodes with high voltage are raised smoothly by heightOffset
            let posZ = node.posZ ?? 0.0;
            if (voltage > 5.0) {
                posZ += heightOffset;
            }

            // Rule 2: Short circuit material distribution (scorched tiles, emissive glows)
            if (globalEntropy > 0.8) {
                friction = Math.min(2.0, friction + 0.5);
                hazardIndex = Math.min(0.95, hazardIndex + 0.3);
            }

            return {
                ...node,
                friction,
                conductivity,
                hazardIndex,
                walkable,
                posZ
            };
        });

        // Verify TDP compliance: check if we exceed shader or particle thresholds
        const totalFriction = mutatedNodes.reduce((acc, curr) => acc + (curr.friction ?? 0.0), 0);
        const isTdpCompliant = totalFriction / mutatedNodes.length < 1.8 && activeThreadsCount < 6;

        return {
            nodes: mutatedNodes,
            teethCount,
            heightOffset,
            staggeredFramesCount: 3, // Always staggered over 3 frames (Rule 5)
            isTdpCompliant
        };
    }

    /**
     * Spawns escape opportunities (REPAIR_KIT / SURGE_NODE) adjacent to the player,
     * throttled by consecutive combat failures to dynamically raise difficulty.
     */
    public static spawnManaEscapePaths(
        gridData: HexNode[],
        playerPos: { posX: number; posZ: number },
        failureCount: number
    ): HexNode[] {
        const maxSpawns = Math.max(1, 4 - failureCount);
        let spawned = 0;

        return gridData.map(node => {
            if (node.walkable === false || node.threadId) {
                return node;
            }

            const dx = (node.posX ?? 0.0) - playerPos.posX;
            const dz = (node.posZ ?? 0.0) - playerPos.posZ;
            const dist = Math.sqrt(dx * dx + dz * dz);

            // Adjacent hex nodes within distance threshold (approx 2.5 units in hex coordinate layout)
            if (dist > 0.1 && dist <= 2.6 && spawned < maxSpawns) {
                spawned++;
                const opportunity = spawned % 2 === 0 ? 'REPAIR_KIT' : 'SURGE_NODE';
                return {
                    ...node,
                    hasOpportunity: opportunity
                };
            }

            return node;
        });
    }

    /**
     * Adjusts environmental hazards to motivate player retention when in danger,
     * unless failure rate indicates a difficulty lift is required.
     */
    public static motivatePlayerRetention(
        gridData: HexNode[],
        playerPos: { posX: number; posZ: number },
        playerHealth: number,
        playerMana: number,
        failureCount: number
    ): HexNode[] {
        const isLowRes = playerHealth < 10 || playerMana < 5;
        if (!isLowRes) {
            return gridData;
        }

        return gridData.map(node => {
            const dx = (node.posX ?? 0.0) - playerPos.posX;
            const dz = (node.posZ ?? 0.0) - playerPos.posZ;
            const dist = Math.sqrt(dx * dx + dz * dz);

            // Check adjacent nodes
            if (dist > 0.1 && dist <= 2.6) {
                let hazardIndex = node.hazardIndex ?? 0.1;
                if (failureCount <= 3) {
                    // Motivation: lower hazards adjacent to the player to facilitate escape
                    hazardIndex = Math.max(0.0, hazardIndex * 0.5);
                } else {
                    // Failure ramp: raise hazards due to consecutive defeats
                    hazardIndex = Math.min(0.95, hazardIndex * 1.3);
                }
                return {
                    ...node,
                    hazardIndex
                };
            }

            return node;
        });
    }
}
