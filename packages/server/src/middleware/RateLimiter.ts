// ────────────────────────────────────────────────────────────────────────────
// RateLimiter.ts — Token Bucket per socket connection
// Prevents command flooding for competitive fairness.
//
// Token Bucket Algorithm:
//   - Each socket starts with `capacity` tokens
//   - Tokens refill at `refillRate` per second
//   - Each game action costs 1 token
//   - If tokens < 1 → reject action and emit 'rate_limited'
// ────────────────────────────────────────────────────────────────────────────

interface RateBucket {
    tokens:    number;
    lastRefill: number;
}

export class SocketRateLimiter {
    private buckets = new Map<string, RateBucket>();

    /**
     * @param capacity   Max burst tokens (default: 10 actions at once)
     * @param refillRate Tokens refilled per second (default: 3/s = one action every ~333ms)
     */
    constructor(
        private readonly capacity:   number = 10,
        private readonly refillRate: number = 3,
    ) {}

    /**
     * Returns true if action is allowed, false if rate-limited.
     * Call once per incoming socket event that mutates game state.
     */
    allow(socketId: string): boolean {
        const now = Date.now();
        let bucket = this.buckets.get(socketId);

        if (!bucket) {
            // First action — give full capacity
            bucket = { tokens: this.capacity, lastRefill: now };
            this.buckets.set(socketId, bucket);
        }

        // Refill proportionally to elapsed time
        const elapsed = (now - bucket.lastRefill) / 1000; // seconds
        bucket.tokens = Math.min(
            this.capacity,
            bucket.tokens + elapsed * this.refillRate,
        );
        bucket.lastRefill = now;

        if (bucket.tokens < 1) {
            // Rate limited — do not consume token
            return false;
        }

        bucket.tokens -= 1;
        return true;
    }

    /**
     * Current token count for a socket (useful for debugging)
     */
    getTokens(socketId: string): number {
        return this.buckets.get(socketId)?.tokens ?? this.capacity;
    }

    /**
     * Remove a disconnected player's bucket to free memory
     */
    evict(socketId: string): void {
        this.buckets.delete(socketId);
    }

    /**
     * Clear all buckets (e.g., on server restart / test teardown)
     */
    clear(): void {
        this.buckets.clear();
    }
}

// ── Singleton for the main server instance ────────────────────────────────────
export const globalRateLimiter = new SocketRateLimiter(
    10,  // up to 10 burst actions (e.g., multi-click)
    3,   // 3 actions/second steady-state
);
