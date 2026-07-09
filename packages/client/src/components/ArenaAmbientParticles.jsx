import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE, BIOME_SPECS } from '../design/worldDesign';

// ──────────────────────────────────────────────────────────────────────────────
// ArenaAmbientParticles
// 200 floating mana-dust particles that drift slowly across the battleground.
// Color shifts based on entropy.
// High entropy → faster, more chaotic drift + colour shift toward red/purple.
// ──────────────────────────────────────────────────────────────────────────────
const PARTICLE_COUNT = 200;
const ARENA_HALF     = 14; // world-space half-extent of the 63-hex grid

// Manový prach: pokojná portálová cyan → pri vysokej entropii magenta nebezpečenstva.
function getDustColor(entropy) {
    const calm = new THREE.Color(PALETTE.portal.mid);
    const danger = new THREE.Color(BIOME_SPECS.TOXIC_SWAMP.accentFlower);
    return calm.lerp(danger, Math.min(1, Math.max(0, (entropy - 0.4) * 1.6)));
}

export default function ArenaAmbientParticles({ entropy = 0.4, hazardIndex = 0.4 }) {
    const pointsRef = useRef();

    // Each particle has: position (x, y, z), velocity (dx, dy, dz), phase offset
    const { positions, velocities, phases } = useMemo(() => {
        const pos   = new Float32Array(PARTICLE_COUNT * 3);
        const vel   = new Float32Array(PARTICLE_COUNT * 3);
        const phase = new Float32Array(PARTICLE_COUNT);
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            // Scatter across arena volume (−14 to 14 in X/Z, 0.2 to 6 in Y)
            pos[i * 3]     = (Math.random() - 0.5) * ARENA_HALF * 2;
            pos[i * 3 + 1] = 0.2 + Math.random() * 5.8;
            pos[i * 3 + 2] = (Math.random() - 0.5) * ARENA_HALF * 2;

            // Slow random drift velocity
            vel[i * 3]     = (Math.random() - 0.5) * 0.4;
            vel[i * 3 + 1] = 0.04 + Math.random() * 0.12; // mostly upward
            vel[i * 3 + 2] = (Math.random() - 0.5) * 0.4;

            phase[i] = Math.random() * Math.PI * 2;
        }
        return { positions: pos, velocities: vel, phases: phase };
    }, []);

    // Mutable working array — updated each frame
    const workPos = useMemo(() => new Float32Array(positions), [positions]);

    useFrame((state, delta) => {
        if (!pointsRef.current) return;
        const time  = state.clock.elapsedTime;
        const posAttr = pointsRef.current.geometry.attributes.position;
        const chaos = 1.0 + entropy * 2.5;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const xi = i * 3, yi = xi + 1, zi = xi + 2;
            const ph = phases[i];

            // Sinusoidal shimmer on top of linear drift
            workPos[xi] += velocities[xi] * delta * chaos + Math.sin(time * 0.7 + ph) * 0.003;
            workPos[yi] += velocities[yi] * delta + Math.sin(time * 1.1 + ph * 1.3) * 0.002;
            workPos[zi] += velocities[zi] * delta * chaos + Math.cos(time * 0.9 + ph) * 0.003;

            // Wrap when particle drifts out of arena bounds or floats too high
            if (workPos[xi] >  ARENA_HALF) workPos[xi] = -ARENA_HALF;
            if (workPos[xi] < -ARENA_HALF) workPos[xi] =  ARENA_HALF;
            if (workPos[zi] >  ARENA_HALF) workPos[zi] = -ARENA_HALF;
            if (workPos[zi] < -ARENA_HALF) workPos[zi] =  ARENA_HALF;
            if (workPos[yi] > 7.0) {
                // Reset Y and re-randomise XZ
                workPos[yi] = 0.2;
                workPos[xi] = (Math.random() - 0.5) * ARENA_HALF * 2;
                workPos[zi] = (Math.random() - 0.5) * ARENA_HALF * 2;
            }

            posAttr.setXYZ(i, workPos[xi], workPos[yi], workPos[zi]);
        }
        posAttr.needsUpdate = true;

        // Pulse the particle color by updating the material tint
        const col = getDustColor(entropy);
        if (pointsRef.current.material) {
            pointsRef.current.material.color.lerp(col, 0.02);
            // Opacity pulses gently
            const baseFade = 0.25 + entropy * 0.2 + hazardIndex * 0.25;
            pointsRef.current.material.opacity = Math.min(0.9, baseFade + 0.1 * Math.sin(time * 1.5));
        }
    });

    const initialColor = getDustColor(entropy);

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                color={initialColor}
                size={0.065 + hazardIndex * 0.045}
                transparent
                opacity={0.3}
                depthWrite={false}
                sizeAttenuation
            />
        </points>
    );
}
