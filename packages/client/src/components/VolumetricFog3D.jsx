// packages/client/src/components/VolumetricFog3D.jsx
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function VolumetricFog3D({ particleCount = 200, entropy = 0.4 }) {
    const pointsRef = useRef();

    // Generate random positions, sizes and velocities for fog particles
    const [positions, velocities, sizes] = useMemo(() => {
        const pos = new Float32Array(particleCount * 3);
        const vel = new Float32Array(particleCount);
        const sz = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            // Spread across the 9-chunk arena layout (approx x: -15 to 15, z: -15 to 15)
            pos[i * 3] = (Math.random() - 0.5) * 35;
            pos[i * 3 + 1] = Math.random() * 1.5 + 0.1; // Keep it low, close to the hexagon floor
            pos[i * 3 + 2] = (Math.random() - 0.5) * 35;

            vel[i] = Math.random() * 0.05 + 0.02; // Slow floating drift speed
            sz[i] = Math.random() * 1.2 + 0.6;   // Particle sizes
        }

        return [pos, vel, sz];
    }, [particleCount]);

    // Animate the fog movement and alpha variations
    useFrame((state) => {
        if (!pointsRef.current) return;
        const geo = pointsRef.current.geometry;
        const posArr = geo.attributes.position.array;
        const time = state.clock.getElapsedTime();

        for (let i = 0; i < particleCount; i++) {
            // Drift horizontally
            posArr[i * 3] += velocities[i] * 0.1;
            
            // Slow vertical bobbing
            posArr[i * 3 + 1] = (Math.random() * 0.1) + Math.sin(time * 0.2 + i) * 0.3 + 0.6;

            // Reset if drift goes too far
            if (posArr[i * 3] > 18) {
                posArr[i * 3] = -18;
            }
        }
        geo.attributes.position.needsUpdate = true;
    });

    // Circular particle texture generator
    const particleTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(canvas);
    }, []);

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={2.5}
                map={particleTexture}
                transparent={true}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                color={entropy > 0.7 ? '#8800ff' : '#00ffff'} // Purple glitch fog at high entropy, cyan otherwise
            />
        </points>
    );
}
