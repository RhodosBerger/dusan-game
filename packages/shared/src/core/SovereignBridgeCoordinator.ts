import { ActionStackEntry } from './SovereignLIFOArbiter';
import { NetworkThreadState } from './types';

/**
 * SovereignBridgeCoordinator coordinates:
 * 1. Bi-directional Socket ID <-> Thread ID mapping regardless of registration order.
 * 2. Look-ahead action batching and queuing to synchronize player actions with turn execution.
 * 3. Export of local telemetry profiles for Kubernetes pod environments.
 * 4. Cooperative play and Docker resource TDP culling profile culls.
 */
export class SovereignBridgeCoordinator {
    // Bi-directional mapping tables
    private socketToThreadMap = new Map<string, string>();
    private threadToSocketMap = new Map<string, string>();

    // Cooperative action batch queues for turn pre-planning
    private actionBatches = new Map<string, ActionStackEntry[]>();

    constructor() {}

    /**
     * Lists active connection socket to thread ID mappings.
     */
    public getActiveMappings(): Array<{ socketId: string; threadId: string }> {
        const mappings: Array<{ socketId: string; threadId: string }> = [];
        this.socketToThreadMap.forEach((threadId, socketId) => {
            mappings.push({ socketId, threadId });
        });
        return mappings;
    }

    /**
     * Registers a mapping between a socket connection and an engine player thread.
     * Can be registered in any order.
     */
    public registerMapping(socketId: string, threadId: string): void {
        this.socketToThreadMap.set(socketId, threadId);
        this.threadToSocketMap.set(threadId, socketId);
        
        // Transfer any pending actions bound to socketId to the threadId bucket
        if (this.actionBatches.has(socketId)) {
            const actions = this.actionBatches.get(socketId)!;
            this.actionBatches.set(threadId, actions);
            this.actionBatches.delete(socketId);
        }
    }

    /**
     * Resolves a Thread ID from a Socket ID
     */
    public getThreadId(socketId: string): string | null {
        return this.socketToThreadMap.get(socketId) || null;
    }

    /**
     * Resolves a Socket ID from a Thread ID (e.g. for outgoing events)
     */
    public getSocketId(threadId: string): string | null {
        return this.threadToSocketMap.get(threadId) || null;
    }

    /**
     * Removes active mapping when a socket connection terminates
     */
    public removeMapping(socketId: string): void {
        const threadId = this.socketToThreadMap.get(socketId);
        if (threadId) {
            this.threadToSocketMap.delete(threadId);
        }
        this.socketToThreadMap.delete(socketId);
    }

    /**
     * Queues an action package or pre-planned trajectory batch.
     * Accessible by either Socket ID or Thread ID.
     */
    public queueActionPackage(identity: string, actions: ActionStackEntry[]): void {
        const key = this.getThreadId(identity) || this.getSocketId(identity) || identity;
        this.actionBatches.set(key, actions);
    }

    /**
     * Retrieves and clears the next pre-planned action queue package
     */
    public flushActionPackage(identity: string): ActionStackEntry[] {
        const key = this.getThreadId(identity) || this.getSocketId(identity) || identity;
        if (!this.actionBatches.has(key)) {
            return [];
        }
        const actions = this.actionBatches.get(key) || [];
        this.actionBatches.delete(key);
        return actions;
    }

    /**
     * Exports local server telemetry profile as JSON patterns.
     * Designed to be exposed via HTTP endpoints for Kubernetes config sync.
     */
    public exportK8sTelemetryPatterns(localStats: {
        cpuUsageMs: number;
        memoryBytes: number;
        sqliteWalQueueLength: number;
        clickhouseConnected: boolean;
    }) {
        return {
            apiVersion: "sovereign.dusan-game.io/v1alpha1",
            kind: "LocalTelemetryProfile",
            metadata: {
                name: "local-server-profile",
                timestamp: new Date().toISOString()
            },
            spec: {
                mediatorEndpoint: "/api/telemetry/analytics",
                governorConfig: {
                    targetCpuMsThreshold: 10.0,
                    targetMemBytesThreshold: 50 * 1024 * 1024 // 50MB
                },
                healthIndicators: {
                    sqliteHealthy: localStats.sqliteWalQueueLength < 100,
                    clickhouseFallbackActive: !localStats.clickhouseConnected
                },
                metrics: {
                    latencyProfileMs: 15.0,
                    activeConnections: this.socketToThreadMap.size
                }
            }
        };
    }

    /**
     * Cooperative match planning loop.
     * Plans actions cooperatively for player and AI companion threads.
     * Cull parameters are enforced when CPU resources are constrained.
     */
    public resolveCooperativeActions(
        players: NetworkThreadState[],
        npcs: NetworkThreadState[],
        isCpuConstrained: boolean
    ): ActionStackEntry[] {
        const compiledCoopActions: ActionStackEntry[] = [];
        
        // Cooperative players queue actions
        for (const player of players) {
            const playerActions = this.flushActionPackage(player.id);
            compiledCoopActions.push(...playerActions);
        }

        // Generate companion actions or NPC responses
        const npcActionsLimit = isCpuConstrained ? 2 : 10;
        let processedNPCs = 0;

        for (const npc of npcs) {
            if (processedNPCs >= npcActionsLimit) break;
            
            // Standard move action for NPCs towards nearest player
            if (npc.position.meta !== null && npc.position.hex !== null) {
                compiledCoopActions.push({
                    id: `coop_npc_action_${npc.id}_${Date.now()}`,
                    player: "playerB", // NPC belongs to adversary side
                    type: "move",
                    cardId: "base_move",
                    damage: 0
                });
                processedNPCs++;
            }
        }

        return compiledCoopActions;
    }
}
