// packages/client/src/utils/VercelCMSHelper.js

/**
 * Vercel Serverless & CMS Integration Helper
 * Coordinates front-end layout configurations with back-end serverless functions.
 */
export const VercelCMSHelper = {
    apiBase: '', // Relative routing via vercel.json rules

    /**
     * Synchronizes composed board elements to Vercel Serverless Database (SQLite/PostgreSQL)
     */
    async syncBoardState(sessionId, elapsedTurns, boardNodes) {
        const payload = {
            session_id: sessionId,
            turns_elapsed: elapsedTurns,
            blocks: boardNodes.map(node => ({
                macro_index: node.x,
                sub_index: node.y,
                biome: node.type && node.type.toUpperCase() === 'TOXIC' ? 'TOXIC_SWAMP' : 'LUSH_FOREST',
                walkable: node.walkable !== false,
                thread_id: node.type === 'PLAYER' ? 'thread_king_ai' : null,
                has_trap: node.type === 'void' ? 'VOID_GATE' : null,
                hazard_index: node.hazardIndex || 0.1
            }))
        };

        try {
            const res = await fetch(`${this.apiBase}/api/canvas/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Vercel serverless synchronization failed');
            return await res.json();
        } catch (error) {
            console.warn('[VercelCMSHelper] fallback to local storage:', error.message);
            localStorage.setItem(`fallback_session_${sessionId}`, JSON.stringify(payload));
            return { status: 'offline_fallback', syncSaved: true };
        }
    },

    /**
     * Triggers dynamic Go Core pathfinder on Vercel Serverless Go runtime
     */
    async calculateGoPath(startCoords, endCoords) {
        try {
            const res = await fetch(`${this.apiBase}/api/go/pathfind`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ start: startCoords, end: endCoords })
            });
            if (res.ok) {
                return await res.json();
            }
            throw new Error('Vercel Go serverless returned status ' + res.status);
        } catch (error) {
            console.warn('[VercelCMSHelper] Go Core serverless fallback:', error.message);
            // Deterministic Manhattan distance path fallback
            return this.localPathFallback(startCoords, endCoords);
        }
    },

    localPathFallback(start, end) {
        // Simple linear interpolation path fallback
        const path = [];
        let curr = [...start];
        path.push([...curr]);
        while (curr[0] !== end[0] || curr[1] !== end[1]) {
            if (curr[0] < end[0]) curr[0]++;
            else if (curr[0] > end[0]) curr[0]--;

            if (curr[1] < end[1]) curr[1]++;
            else if (curr[1] > end[1]) curr[1]--;

            path.push([...curr]);
        }
        return path;
    }
};
