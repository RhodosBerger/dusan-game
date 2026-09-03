// packages/server/src/matchmaking/MatchmakingWorker.ts
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

export interface QueuePlayer {
    id:       string;
    socketId: string;
    mmr:      number;
    joinedAt: number;
}

export class MatchmakingWorker {
    private redis: Redis;
    private intervalId: NodeJS.Timeout | null = null;
    private isRunning = false;

    /**
     * @param redisUrl          Redis connection string
     * @param pairingTolerance  Maximum MMR score difference allowed to pair players
     * @param checkIntervalMs   Loop interval to scan and match players
     */
    constructor(
        redisUrl: string = process.env.REDIS_URL || 'redis://127.0.0.1:6379',
        private readonly pairingTolerance: number = 50,
        private readonly checkIntervalMs:  number = 2000
    ) {
        this.redis = new Redis(redisUrl, {
            lazyConnect: true,
            maxRetriesPerRequest: null // compliant with queue patterns
        });
    }

    /**
     * Connect to the Redis instance
     */
    async connect(): Promise<void> {
        try {
            await this.redis.connect();
            console.log('[REDIS] Matchmaking connection established.');
        } catch (err) {
            console.error('[REDIS] Connection error:', err);
        }
    }

    /**
     * Adds a player to the matchmaking sorted set and registers their metadata
     */
    async addPlayer(player: Omit<QueuePlayer, 'joinedAt'>): Promise<void> {
        const payload = JSON.stringify({
            id: player.id,
            socketId: player.socketId,
            mmr: player.mmr,
            joinedAt: Date.now()
        });

        // Use transaction to set MMR score and store metadata details
        const tx = this.redis.multi();
        tx.zadd('matchmaking:queue', player.mmr, player.id);
        tx.hset('matchmaking:metadata', player.id, payload);
        await tx.exec();
        
        console.log(`[MATCHMAKING] Player ${player.id} (MMR: ${player.mmr}) joined the queue.`);
    }

    /**
     * Removes a player from the queue
     */
    async removePlayer(playerId: string): Promise<void> {
        const tx = this.redis.multi();
        tx.zrem('matchmaking:queue', playerId);
        tx.hdel('matchmaking:metadata', playerId);
        await tx.exec();
        
        console.log(`[MATCHMAKING] Player ${playerId} removed from the queue.`);
    }

    /**
     * Start the matchmaking scanning loop
     */
    start(onMatchFound: (matchId: string, p1: QueuePlayer, p2: QueuePlayer) => void): void {
        if (this.isRunning) return;
        this.isRunning = true;

        this.intervalId = setInterval(async () => {
            try {
                await this.matchmake(onMatchFound);
            } catch (err) {
                console.error('[MATCHMAKING ERROR] Matching loop error:', err);
            }
        }, this.checkIntervalMs);

        console.log(`[MATCHMAKING] Matchmaking worker started (Tolerance: +/- ${this.pairingTolerance} MMR).`);
    }

    /**
     * Match players in the queue based on ELO/MMR sliding window
     */
    private async matchmake(
        onMatchFound: (matchId: string, p1: QueuePlayer, p2: QueuePlayer) => void
    ): Promise<void> {
        // ZRANGE to fetch all active queued player IDs in MMR sorted order
        const playerIds = await this.redis.zrange('matchmaking:queue', 0, -1);
        if (playerIds.length < 2) return;

        // Retrieve metadata details for all players
        const rawMetadata = await this.redis.hmget('matchmaking:metadata', ...playerIds);
        const players: QueuePlayer[] = rawMetadata
            .filter((m): m is string => m !== null)
            .map(m => JSON.parse(m))
            .sort((a, b) => a.mmr - b.mmr); // double-ensure ascending MMR order

        const matchedIds = new Set<string>();

        for (let i = 0; i < players.length - 1; i++) {
            const p1 = players[i];
            if (matchedIds.has(p1.id)) continue;

            for (let j = i + 1; j < players.length; j++) {
                const p2 = players[j];
                if (matchedIds.has(p2.id)) continue;

                // ELO check
                const eloGap = Math.abs(p1.mmr - p2.mmr);
                if (eloGap > this.pairingTolerance) {
                    // Since array is sorted, any subsequent players will exceed the ELO gap
                    break;
                }

                // Match found! Attempt atomic removal to ensure mutual lock
                const transaction = this.redis.multi();
                transaction.zrem('matchmaking:queue', p1.id, p2.id);
                transaction.hdel('matchmaking:metadata', p1.id, p2.id);
                const results = await transaction.exec();

                // If zrem successfully removed both, matching is confirmed
                if (results && (results[0][1] as number) === 2) {
                    matchedIds.add(p1.id);
                    matchedIds.add(p2.id);

                    const matchId = `match_${uuidv4()}`;
                    console.log(`[MATCHMAKING] MATCH CREATED: ${p1.id} (MMR: ${p1.mmr}) vs ${p2.id} (MMR: ${p2.mmr})`);
                    
                    onMatchFound(matchId, p1, p2);
                }
                break; // Break sub-loop and move to next index
            }
        }
    }

    /**
     * Stop the matchmaking loop and disconnect Redis client
     */
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        this.redis.disconnect();
        console.log('[MATCHMAKING] Matchmaking worker stopped.');
    }
}
