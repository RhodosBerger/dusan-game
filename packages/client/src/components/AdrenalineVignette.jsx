import React, { useEffect, useRef, useState } from 'react';

// ─── AdrenalineVignette ───────────────────────────────────────────────────────
// A CSS overlay that renders a pulsing colored vignette border around the viewport.
// Activates when:
//   - isAdrenaline is true (HP ≤ 5 or turn ≥ 10 or energy ≥ 80%)
// 
// The pulse rate and intensity increase as HP drops.
// Provides zero impact on 3D rendering — pure DOM overlay.
// ─────────────────────────────────────────────────────────────────────────────

const FACTION_VIGNETTE = {
    crystal: { color: '0, 180, 255',   glow: '0, 100, 200'   },
    toxic:   { color: '57, 255, 20',   glow: '20, 100, 0'    },
    druid:   { color: '255, 200, 0',   glow: '120, 60, 0'    },
    void:    { color: '170, 0, 255',   glow: '80, 0, 130'    },
    danger:  { color: '255, 40, 40',   glow: '180, 0, 0'     },
};

function getFaction(threadId) {
    if (!threadId) return 'crystal';
    if (threadId.includes('king'))   return 'crystal';
    if (threadId.includes('hacker')) return 'toxic';
    if (threadId.includes('void'))   return 'void';
    return 'druid';
}

export default function AdrenalineVignette({ gameState, localPlayerId }) {
    const [vignetteStyle, setVignetteStyle] = useState({});
    const [active, setActive]               = useState(false);
    const animFrameRef = useRef(null);
    const startTimeRef = useRef(null);

    useEffect(() => {
        if (!gameState) return;

        const threads    = gameState.threads || [];
        const localThread = threads.find(t => t.id === localPlayerId) || threads[0];
        const allHp      = threads.map(t => t.health ?? 99);
        const minHp      = Math.min(...allHp);
        const turnsElapsed = gameState.turnsElapsed ?? 0;
        const systemEnergy = gameState.systemEnergy ?? 0;

        const isAdrenaline = minHp <= 5 || systemEnergy >= 80 || turnsElapsed >= 10;
        setActive(isAdrenaline);

        if (!isAdrenaline) {
            setVignetteStyle({});
            return;
        }

        // Choose color: if our hero is the one in danger → danger red, else faction color
        const localHp   = localThread?.health ?? 99;
        const isInDanger = localHp <= 5;
        const faction    = isInDanger ? 'danger' : getFaction(localThread?.id);
        const palette    = FACTION_VIGNETTE[faction];

        // Pulse rate: faster as HP drops (from 1.0 Hz at 5HP → 4.0 Hz at 0HP)
        const hpFactor = Math.max(0, Math.min(1, (5 - localHp) / 5)); // 0..1
        const hz       = 1.0 + hpFactor * 3.0;
        const period   = 1000 / hz; // ms per full cycle

        // Cancel previous animation loop
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        startTimeRef.current = performance.now();

        const animate = (now) => {
            const elapsed = now - startTimeRef.current;
            // Sine pulse → 0..1
            const t = 0.5 + 0.5 * Math.sin((elapsed / period) * 2 * Math.PI);

            // Intensity: min 0.25, max 0.85 — scales with HP danger
            const baseAlpha = 0.25 + hpFactor * 0.35;
            const alpha     = baseAlpha + t * (0.25 + hpFactor * 0.2);
            const spread    = 60 + t * (40 + hpFactor * 60);

            setVignetteStyle({
                boxShadow: [
                    `inset 0 0 ${spread}px ${spread * 0.6}px rgba(${palette.color}, ${alpha.toFixed(2)})`,
                    `inset 0 0 ${spread * 1.5}px ${spread}px rgba(${palette.glow}, ${(alpha * 0.5).toFixed(2)})`,
                ].join(', '),
            });

            animFrameRef.current = requestAnimationFrame(animate);
        };

        animFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [gameState, localPlayerId]);

    if (!active) return null;

    return (
        <div
            style={{
                position:      'fixed',
                inset:         0,
                pointerEvents: 'none',
                zIndex:        50,
                ...vignetteStyle,
                // Smooth transition when activating/deactivating
                transition:    'opacity 0.6s ease',
                opacity:       active ? 1 : 0,
            }}
            aria-hidden="true"
        />
    );
}
