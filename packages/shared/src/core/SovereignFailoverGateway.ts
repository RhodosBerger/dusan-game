export class SovereignFailoverGateway {
    private static online = true;
    private static lastCheckTime = 0;
    private static checkIntervalMs = 5000; // Check health every 5 seconds maximum

    /**
     * Checks if Go Core is currently online
     */
    public static isOnline(): boolean {
        return this.online;
    }

    /**
     * Set health state manually
     */
    public static setOnlineState(state: boolean): void {
        this.online = state;
    }

    /**
     * Verifies connection to Go Core. Uses small timeout to prevent latency.
     */
    public static async verifyHealth(baseUrl: string): Promise<boolean> {
        const now = Date.now();
        if (now - this.lastCheckTime < this.checkIntervalMs) {
            return this.online;
        }

        this.lastCheckTime = now;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200); // 1.2s timeout ceiling

        try {
            const res = await fetch(`${baseUrl}/api/health`, {
                method: 'GET',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            this.online = res.ok;
        } catch (err) {
            clearTimeout(timeoutId);
            this.online = false;
        }

        return this.online;
    }
}
