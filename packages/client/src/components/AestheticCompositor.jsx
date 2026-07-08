// packages/client/src/components/AestheticCompositor.jsx
import React, { useMemo } from 'react';
import { Bloom, ChromaticAberration, Glitch, Vignette } from '@react-three/postprocessing';
import { GlitchMode } from 'postprocessing';

export default function AestheticCompositor({ entropy = 0.4, terrainTelemetry = null }) {
    const params = useMemo(() => {
        let bloomIntensity = 1.2;
        let aberrationMultiplier = 1.0;
        let glitchActive = false;
        let glitchStrength = 0.2;

        if (terrainTelemetry) {
            const intensity = terrainTelemetry.difficulty.combatIntensity;
            const rewardMult = terrainTelemetry.difficulty.dopamineRewardMultiplier;

            if (intensity === 'HIGH') {
                bloomIntensity = 1.8 * rewardMult;
                aberrationMultiplier = 1.5;
            } else if (intensity === 'CRITICAL') {
                bloomIntensity = 2.5 * rewardMult;
                aberrationMultiplier = 2.2;
                glitchActive = true;
                glitchStrength = 0.5;
            } else if (intensity === 'LOW') {
                bloomIntensity = 0.8;
                aberrationMultiplier = 0.5;
            }

            // If any high hazard block is active, simulate minor aesthetic glitch
            const hasHighHazard = terrainTelemetry.textures.some(t => t.colorVibrancy > 0.85);
            if (hasHighHazard) {
                glitchActive = true;
                glitchStrength = Math.max(glitchStrength, 0.35);
            }
        }

        // Combine with global entropy stress
        if (entropy > 0.7) {
            glitchActive = true;
            glitchStrength = Math.max(glitchStrength, 0.6);
        }

        return {
            bloomIntensity,
            aberrationOffset: 0.002 * entropy * aberrationMultiplier,
            glitchActive,
            glitchStrength
        };
    }, [entropy, terrainTelemetry]);

    return (
        <>
            {/* Bloom and ChromaticAberration disabled to prevent postprocessing blur and fringe */}
            {params.glitchActive && (
                <Glitch
                    delay={[1.0, 2.5]}
                    duration={[0.15, 0.4]}
                    strength={[params.glitchStrength * 0.5, params.glitchStrength]}
                    mode={GlitchMode.SPORADIC}
                    active
                />
            )}
            {/* DepthOfField / Bokeh effects disabled */}
            <Vignette 
                eskil={false} 
                offset={0.35} 
                darkness={0.75} 
            />
        </>
    );
}
