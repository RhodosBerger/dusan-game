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
    posX?: number;
    posZ?: number;
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

export interface GoThread {
    id: string;
    name: string;
    type: string;
    health: number;
    maxHealth: number;
    energy: number;
}

export interface GoStateEngine {
    matchId: string;
    turnsElapsed: number;
    activePhase: string;
    activePlayerId: string;
    systemEnergy: number;
    threads: GoThread[];
    playedVoltage: number;
    playedResist: number;
}

export interface GoActionPayload {
    attackerId: string;
    targetId: string;
    cardId: string;
    voltage: number;
    resistance: number;
    damage: number;
}

export interface GoStateResolveResponse {
    success: boolean;
    state: GoStateEngine;
    comboTrigger: string;
    logs: string;
}

export interface GoPathfinderBlock {
    chunkId: number;
    blockId: number;
    posX: number;
    posZ: number;
    walkable: boolean;
    hazardIndex: number;
}

export interface GoPathfinderResponse {
    success: boolean;
    path: GoPathfinderBlock[] | null;
    cost: number;
    logs: string;
}

export interface GoEnvironmentNode {
    chunkId: number;
    blockId: number;
    friction: number;
    conductivity: number;
    hazardIndex: number;
    walkable: boolean;
}

export interface GoEnvironmentFluxResponse {
    success: boolean;
    grid: GoEnvironmentNode[];
    logs: string;
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

    /**
     * Query Go Core State Engine to initialize game state
     */
    public async initializeSovereignState(): Promise<GoStateEngine> {
        // Trigger non-blocking heartbeat check
        SovereignFailoverGateway.verifyHealth(this.apiBaseUrl).catch(() => {});

        if (SovereignFailoverGateway.isOnline()) {
            try {
                const res = await fetch(`${this.apiBaseUrl}/api/state/init`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
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

        // TS local fallback state
        return {
            matchId: "match_simulation_01",
            turnsElapsed: 1,
            activePhase: "ACTION",
            activePlayerId: "thread_king_ai",
            systemEnergy: 80,
            threads: [
                { id: "thread_king_ai", name: "AI Overlord", type: "PLAYER", health: 30, maxHealth: 30, energy: 100 },
                { id: "thread_hacker_root", name: "Root Hacker", type: "AI", health: 30, maxHealth: 30, energy: 100 }
            ],
            playedVoltage: 0,
            playedResist: 0
        };
    }

    /**
     * Query Go Core State Engine to resolve a thread action
     */
    public async resolveSovereignAction(state: GoStateEngine, action: GoActionPayload): Promise<GoStateResolveResponse> {
        // Trigger non-blocking heartbeat check
        SovereignFailoverGateway.verifyHealth(this.apiBaseUrl).catch(() => {});

        if (SovereignFailoverGateway.isOnline()) {
            try {
                const res = await fetch(`${this.apiBaseUrl}/api/state/resolve-action`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ state, action })
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

        // TS local fallback calculations (Exact parity)
        const nextState = { ...state };
        const attacker = nextState.threads.find(t => t.id === action.attackerId);
        const defender = nextState.threads.find(t => t.id === action.targetId);

        let combo = "NONE";
        let logs = `Bypassed Go Core. Resolved locally via TypeScript Fallback.`;

        if (attacker && defender) {
            attacker.energy = Math.max(0, attacker.energy - 20);
            defender.health = Math.max(0, defender.health - action.damage);
            nextState.playedVoltage += action.voltage;
            if (nextState.playedResist === 0) {
                nextState.playedResist = action.resistance;
            } else {
                nextState.playedResist *= action.resistance;
            }

            if (nextState.playedVoltage >= 8.0) {
                combo = "VOLTAGE_SURGE";
                defender.health = Math.max(0, defender.health - 2);
                logs += " [COMBO] Voltage Surge triggered! +2 bonus damage applied.";
                nextState.playedVoltage = 0.0;
            } else if (nextState.playedResist > 0.0 && nextState.playedResist <= 1.0) {
                combo = "SHORT_CIRCUIT";
                attacker.energy = Math.max(0, attacker.energy - 15);
                logs += " [COMBO] Short Circuit triggered! Attacker suffered energy drain.";
                nextState.playedResist = 0.0;
            }
        }

        return {
            success: true,
            state: nextState,
            comboTrigger: combo,
            logs
        };
    }

    private pathfindingQueue: Array<{
        resolve: (val: GoPathfinderBlock[] | null) => void;
        reject: (err: any) => void;
        startChunk: number;
        startBlock: number;
        endChunk: number;
        endBlock: number;
        gridData: HexNode[];
    }> = [];
    private isQueueProcessing = false;

    /**
     * Finds short path utilizing authoritative Go Core pathfinder, backed by 2ms time-sliced client queue (Rule 5 & Section 12)
     */
    public async findPath(
        startChunk: number,
        startBlock: number,
        endChunk: number,
        endBlock: number,
        gridData: HexNode[]
    ): Promise<GoPathfinderBlock[] | null> {
        return new Promise((resolve, reject) => {
            this.pathfindingQueue.push({
                resolve,
                reject,
                startChunk,
                startBlock,
                endChunk,
                endBlock,
                gridData
            });

            if (!this.isQueueProcessing) {
                this.processPathfindingQueue();
            }
        });
    }

    private async processPathfindingQueue() {
        this.isQueueProcessing = true;
        const startTime = Date.now();

        while (this.pathfindingQueue.length > 0) {
            // Respect strict 2ms CPU execution limit (Rule 5 & Section 12)
            if (Date.now() - startTime > 2) {
                if (typeof requestAnimationFrame !== 'undefined') {
                    requestAnimationFrame(() => this.processPathfindingQueue());
                } else {
                    setTimeout(() => this.processPathfindingQueue(), 1);
                }
                return;
            }

            const task = this.pathfindingQueue.shift();
            if (task) {
                try {
                    const result = await this.executePathfindingTask(task);
                    task.resolve(result);
                } catch (err) {
                    task.reject(err);
                }
            }
        }
        this.isQueueProcessing = false;
    }

    private async executePathfindingTask(task: {
        startChunk: number;
        startBlock: number;
        endChunk: number;
        endBlock: number;
        gridData: HexNode[];
    }): Promise<GoPathfinderBlock[] | null> {
        // Map HexNodes to Go-compatible PathfinderBlocks
        const grid: GoPathfinderBlock[] = task.gridData.map(node => ({
            chunkId: node.macroIndex,
            blockId: node.subIndex,
            posX: node.posX || 0,
            posZ: node.posZ || 0,
            walkable: node.walkable !== false,
            hazardIndex: node.hazardIndex || 0
        }));

        SovereignFailoverGateway.verifyHealth(this.apiBaseUrl).catch(() => {});

        if (SovereignFailoverGateway.isOnline()) {
            try {
                const res = await fetch(`${this.apiBaseUrl}/api/pathfinding/search`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        startChunk: task.startChunk,
                        startBlock: task.startBlock,
                        endChunk: task.endChunk,
                        endBlock: task.endBlock,
                        grid
                    })
                });
                if (res.ok) {
                    const data: GoPathfinderResponse = await res.json();
                    if (data.success && data.path) {
                        return data.path;
                    }
                } else {
                    SovereignFailoverGateway.setOnlineState(false);
                }
            } catch (err) {
                SovereignFailoverGateway.setOnlineState(false);
            }
        }

        // TS Fallback A* implementation (Exact Parity)
        return this.localTSPathfinder(task.startChunk, task.startBlock, task.endChunk, task.endBlock, grid);
    }

    private localTSPathfinder(
        startChunk: number,
        startBlock: number,
        endChunk: number,
        endBlock: number,
        grid: GoPathfinderBlock[]
    ): GoPathfinderBlock[] | null {
        const start = grid.find(b => b.chunkId === startChunk && b.blockId === startBlock);
        const end = grid.find(b => b.chunkId === endChunk && b.blockId === endBlock);

        if (!start || !end) return null;

        const getDist = (a: GoPathfinderBlock, b: GoPathfinderBlock) => {
            return Math.sqrt(Math.pow(a.posX - b.posX, 2) + Math.pow(a.posZ - b.posZ, 2));
        };

        const openSet: Array<{ block: GoPathfinderBlock; gScore: number; fScore: number; parent: any }> = [
            { block: start, gScore: 0, fScore: getDist(start, end), parent: null }
        ];

        const closedSet = new Set<string>();

        while (openSet.length > 0) {
            openSet.sort((a, b) => a.fScore - b.fScore);
            const current = openSet.shift()!;
            const currKey = `${current.block.chunkId}_${current.block.blockId}`;
            closedSet.add(currKey);

            if (current.block.chunkId === end.chunkId && current.block.blockId === end.blockId) {
                const path: GoPathfinderBlock[] = [];
                let curr: any = current;
                while (curr) {
                    path.unshift(curr.block);
                    curr = curr.parent;
                }
                return path;
            }

            // Find neighbors within 3.5 units
            const neighbors = grid.filter(neighbor => {
                if (!neighbor.walkable) return false;
                if (neighbor.chunkId === current.block.chunkId && neighbor.blockId === current.block.blockId) return false;
                const d = getDist(current.block, neighbor);
                return d > 0.1 && d <= 3.5;
            });

            for (const neighbor of neighbors) {
                const neighKey = `${neighbor.chunkId}_${neighbor.blockId}`;
                if (closedSet.has(neighKey)) continue;

                const tentativeG = current.gScore + getDist(current.block, neighbor);
                const openMatch = openSet.find(o => o.block.chunkId === neighbor.chunkId && o.block.blockId === neighbor.blockId);

                if (!openMatch) {
                    openSet.push({
                        block: neighbor,
                        gScore: tentativeG,
                        fScore: tentativeG + getDist(neighbor, end),
                        parent: current
                    });
                } else if (tentativeG < openMatch.gScore) {
                    openMatch.gScore = tentativeG;
                    openMatch.fScore = tentativeG + getDist(neighbor, end);
                    openMatch.parent = current;
                }
            }
        }

        return null;
    }

    /**
     * Authoritative Go Core environmental flux calculation (Goal 9)
     */
    public async calculateEnvironmentFlux(weather: string, gridData: HexNode[]): Promise<HexNode[]> {
        // Trigger non-blocking heartbeat check
        SovereignFailoverGateway.verifyHealth(this.apiBaseUrl).catch(() => {});

        const grid: GoEnvironmentNode[] = gridData.map(node => ({
            chunkId: node.macroIndex,
            blockId: node.subIndex,
            friction: node.friction || 1.0,
            conductivity: node.conductivity || 0.5,
            hazardIndex: node.hazardIndex || 0.0,
            walkable: node.walkable !== false
        }));

        if (SovereignFailoverGateway.isOnline()) {
            try {
                const res = await fetch(`${this.apiBaseUrl}/api/environment/flux`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ weather, grid })
                });
                if (res.ok) {
                    const data: GoEnvironmentFluxResponse = await res.json();
                    if (data.success && data.grid) {
                        return gridData.map(tsNode => {
                            const goMatch = data.grid.find(g => g.chunkId === tsNode.macroIndex && g.blockId === tsNode.subIndex);
                            if (!goMatch) return tsNode;
                            return {
                                ...tsNode,
                                friction: goMatch.friction,
                                conductivity: goMatch.conductivity,
                                hazardIndex: goMatch.hazardIndex
                            };
                        });
                    }
                } else {
                    SovereignFailoverGateway.setOnlineState(false);
                }
            } catch (err) {
                SovereignFailoverGateway.setOnlineState(false);
            }
        }

        // TS Fallback weather calculations (Exact Parity)
        return gridData.map(tsNode => {
            let friction = tsNode.friction || 1.0;
            let conductivity = tsNode.conductivity || 0.5;
            let hazardIndex = tsNode.hazardIndex || 0.0;

            if (weather === 'TOXIC_STORM') {
                hazardIndex = 0.8;
                conductivity = 0.9;
            } else if (weather === 'BLIZZARD') {
                friction = 2.0;
                hazardIndex = 0.4;
            } else {
                friction = 1.0;
                hazardIndex = 0.0;
                conductivity = 0.5;
            }

            return {
                ...tsNode,
                friction,
                conductivity,
                hazardIndex
            };
        });
    }
}

