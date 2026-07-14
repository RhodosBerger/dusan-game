import { AethericDiceEngine } from './AethericDiceEngine';
import { SovereignFailoverGateway } from './SovereignFailoverGateway';
import { SovereignPhraseGenerator, PhraseOutput } from './SovereignPhraseGenerator';

export interface HexNode {
    macroIndex: number;
    subIndex: number;
    biome?: string;
    walkable?: boolean;
    friction?: number;
    conductivity?: number;
    temperature?: number;
    humidity?: number;
    energyCostMultiplier?: number;
    hazardIndex?: number;
}

// Structures matching Go Core JSON API
export interface GoBlockRequest {
    metaId: number;
    hexId: number;
}

export interface GoBatchRequest {
    blocks: GoBlockRequest[];
}

export interface GoBlockResponse {
    metaId: number;
    hexId: number;
    biome: string;
    temperature: number;
    humidity: number;
    friction: number;
    conductivity: number;
    walkable: boolean;
    energyCostMultiplier: number;
    hazardIndex: number;
}

export interface GoPhysicsCostRequest {
    baseCost: number;
    metaId: number;
    hexId: number;
}

export interface GoPhysicsCostResponse {
    cost: number;
    costMultiplier: number;
}

export interface GoCombatRequest {
    damage: number;
    attackerHeroId: string;
    defenderHeroId: string;
    defenderArmor: number;
    reactionsCount: number;
    isSnakeOrStealth: boolean;
}

export interface GoCombatResponse {
    finalDamage: number;
    baseArmor: number;
    log: string;
}

export class GoCoreMediator {
    private apiBaseUrl: string;

    constructor(baseUrl = 'http://localhost:8081') {
        this.apiBaseUrl = baseUrl;
    }

    /**
     * STAGE 1: Serialize TS/React grid data to Go-compatible Batch Payload (Forward Parse)
     */
    public serializeCanvasGrid(tsNodes: HexNode[]): GoBatchRequest {
        return {
            blocks: tsNodes.map(n => ({
                metaId: n.macroIndex,
                hexId: n.subIndex
            }))
        };
    }

    /**
     * STAGE 2: Deserialize Go Core Batch Response back into TS/React HexNode structures (Reverse Parse)
     */
    public deserializeGoGrid(goBlocks: GoBlockResponse[], tsNodes: HexNode[]): HexNode[] {
        return tsNodes.map(tsNode => {
            const goMatch = goBlocks.find(g => g.metaId === tsNode.macroIndex && g.hexId === tsNode.subIndex);
            if (!goMatch) return tsNode;

            return {
                ...tsNode,
                biome: goMatch.biome as any,
                walkable: goMatch.walkable,
                friction: goMatch.friction,
                conductivity: goMatch.conductivity,
                temperature: goMatch.temperature,
                humidity: goMatch.humidity,
                energyCostMultiplier: goMatch.energyCostMultiplier,
                hazardIndex: goMatch.hazardIndex
            };
        });
    }

    /**
     * Query Physics Energy Cost with TS Local Fallback
     */
    public async solvePhysicsCost(baseCost: number, metaId: number, hexId: number, fallbackMultiplier = 1.0): Promise<GoPhysicsCostResponse> {
        // Trigger non-blocking heartbeat check
        SovereignFailoverGateway.verifyHealth(this.apiBaseUrl).catch(() => {});

        if (!AethericDiceEngine.bypassDice && SovereignFailoverGateway.isOnline()) {
            try {
                const res = await fetch(`${this.apiBaseUrl}/api/physics/energy-cost`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ baseCost, metaId, hexId })
                });
                if (res.ok) {
                    return await res.json();
                } else {
                    SovereignFailoverGateway.setOnlineState(false);
                }
            } catch (err) {
                SovereignFailoverGateway.setOnlineState(false);
            }
        }

        // Deterministic TS Fallback
        const fallbackCost = Math.round(baseCost * 15.0 * fallbackMultiplier);
        return {
            cost: fallbackCost,
            costMultiplier: fallbackMultiplier
        };
    }

    /**
     * Query Combat Resolution with TS Local Fallback
     */
    public async resolveCombatDamage(req: GoCombatRequest): Promise<GoCombatResponse> {
        // Trigger non-blocking heartbeat check
        SovereignFailoverGateway.verifyHealth(this.apiBaseUrl).catch(() => {});

        if (!AethericDiceEngine.bypassDice && SovereignFailoverGateway.isOnline()) {
            try {
                const res = await fetch(`${this.apiBaseUrl}/api/combat/resolve`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(req)
                });
                if (res.ok) {
                    return await res.json();
                } else {
                    SovereignFailoverGateway.setOnlineState(false);
                }
            } catch (err) {
                SovereignFailoverGateway.setOnlineState(false);
            }
        }

        // Deterministic TS Fallback
        const reduction = 1.0 - Math.exp(-0.35 * (req.defenderArmor + req.reactionsCount * 0.5));
        const comboFactor = Math.max(0.1, 1.0 - reduction);
        const netDmg = req.damage * comboFactor;
        const finalDmg = Math.round(netDmg);

        return {
            finalDamage: finalDmg,
            baseArmor: req.defenderArmor,
            log: `Bypassed Go Core. Resolved locally via TypeScript Fallback (Damage: ${finalDmg}).`
        };
    }

    /**
     * Query Go Core Tag-Pair Simulation with TS local fallback
     */
    public async simulateGeometryNodes(verb: string, target: string): Promise<PhraseOutput> {
        // Trigger non-blocking heartbeat check
        SovereignFailoverGateway.verifyHealth(this.apiBaseUrl).catch(() => {});

        if (SovereignFailoverGateway.isOnline()) {
            try {
                const res = await fetch(`${this.apiBaseUrl}/api/simulation/geometry-nodes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ verb, target })
                });
                if (res.ok) {
                    return await res.json();
                } else {
                    SovereignFailoverGateway.setOnlineState(false);
                }
            } catch (err) {
                SovereignFailoverGateway.setOnlineState(false);
            }
        }

        // TS local fallback
        return SovereignPhraseGenerator.compilePhrase(verb, target);
    }

    /**
     * UI Element Placement & Spawner boundaries Validation
     */
    public validateUIElementAvailability(node: HexNode, activeThreatsCount: number): { placeable: boolean; reason: string } {
        if (!node.walkable) {
            return { placeable: false, reason: 'Tile is blocked / non-walkable.' };
        }
        if (node.hazardIndex && node.hazardIndex >= 0.9) {
            return { placeable: false, reason: 'Tile hazard level too high (>= 0.9).' };
        }
        if (activeThreatsCount >= 6) {
            return { placeable: false, reason: 'Threat density limit reached in this sector.' };
        }
        return { placeable: true, reason: 'Target location is valid.' };
    }
}
