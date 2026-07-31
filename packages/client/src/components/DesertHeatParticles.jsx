import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MAX_PARTICLES = 128;

export default function DesertHeatParticles({ gridData, map }) {
    const pointsRef = useRef();

    // Find all desert node positions
    const desertNodes = useMemo(() => {
        if (!gridData || !map) return [];
        return gridData.filter(node => {
            const chunk = map.find(c => c.id === node.macroIndex);
            const block = chunk?.blocks?.find(b => b.id === node.subIndex);
            return block?.biome === 'DESERT';
        });
    }, [gridData, map]);

    const { positions, phases } = useMemo(() => {
        const pos = new Float32Array(MAX_PARTICLES * 3);
        const phase = new Float32Array(MAX_PARTICLES);

        for (let i = 0; i < MAX_PARTICLES; i++) {
            if (desertNodes.length > 0) {
                const node = desertNodes[Math.floor(Math.random() * desertNodes.length)];
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 0.8;
                pos[i * 3] = node.x + Math.cos(angle) * radius;
                pos[i * 3 + 1] = 0.2 + Math.random() * 1.5;
                pos[i * 3 + 2] = node.z + Math.sin(angle) * radius;
            } else {
                pos[i * 3] = 0;
                pos[i * 3 + 1] = -999;
                pos[i * 3 + 2] = 0;
            }
            phase[i] = Math.random() * Math.PI * 2;
        }
        return { positions: pos, phases: phase };
    }, [desertNodes]);

    const workPos = useMemo(() => new Float32Array(positions), [positions]);

    useFrame((state, delta) => {
        if (!pointsRef.current || desertNodes.length === 0) return;
        const time = state.clock.elapsedTime;
        const posAttr = pointsRef.current.geometry.attributes.position;

        for (let i = 0; i < MAX_PARTICLES; i++) {
            const xi = i * 3, yi = xi + 1, zi = xi + 2;
            if (workPos[yi] > -100) {
                workPos[yi] += delta * 0.45;
                const ph = phases[i];
                if (workPos[yi] > 2.2) {
                    const node = desertNodes[Math.floor(Math.random() * desertNodes.length)];
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.random() * 0.8;
                    workPos[xi] = node.x + Math.cos(angle) * radius;
                    workPos[yi] = 0.2;
                    workPos[zi] = node.z + Math.sin(angle) * radius;
                }
                
                posAttr.setXYZ(
                    i, 
                    workPos[xi] + Math.sin(time * 2.0 + ph) * 0.05, 
                    workPos[yi], 
                    workPos[zi] + Math.cos(time * 1.8 + ph) * 0.05
                );
            }
        }
        posAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                color="#f97316"
                size={0.08}
                transparent
                opacity={0.65}
                depthWrite={false}
                sizeAttenuation
            />
        </points>
    );
}
