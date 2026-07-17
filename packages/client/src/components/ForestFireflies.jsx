import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MAX_PARTICLES = 128;

export default function ForestFireflies({ gridData, map, entropy = 0.4 }) {
    const pointsRef = useRef();

    // Find all Lush Forest nodes
    const forestNodes = useMemo(() => {
        if (!gridData || !map) return [];
        return gridData.filter(node => {
            const chunk = map.find(c => c.id === node.macroIndex);
            const block = chunk?.blocks?.find(b => b.id === node.subIndex);
            return (block?.biome || 'LUSH_FOREST') === 'LUSH_FOREST';
        });
    }, [gridData, map]);

    // Pre-allocate firefly paths around their home nodes
    const fireflyMeta = useMemo(() => {
        const meta = [];
        for (let i = 0; i < MAX_PARTICLES; i++) {
            const nodeIndex = forestNodes.length > 0 ? i % forestNodes.length : -1;
            meta.push({
                nodeIndex,
                speedX: 0.2 + Math.random() * 0.3,
                speedY: 0.3 + Math.random() * 0.4,
                speedZ: 0.2 + Math.random() * 0.3,
                range: 0.4 + Math.random() * 0.4,
                phase: Math.random() * Math.PI * 2
            });
        }
        return meta;
    }, [forestNodes]);

    const { positions } = useMemo(() => {
        const pos = new Float32Array(MAX_PARTICLES * 3);
        for (let i = 0; i < MAX_PARTICLES; i++) {
            pos[i * 3] = 0;
            pos[i * 3 + 1] = -999; // Cull initially
            pos[i * 3 + 2] = 0;
        }
        return { positions: pos };
    }, []);

    useFrame((state, delta) => {
        if (!pointsRef.current) return;
        const time = state.clock.elapsedTime;
        const posAttr = pointsRef.current.geometry.attributes.position;

        // Fireflies are only active when entropy > 0.5
        const active = entropy > 0.5 && forestNodes.length > 0;

        for (let i = 0; i < MAX_PARTICLES; i++) {
            const fm = fireflyMeta[i];
            
            if (active && fm.nodeIndex !== -1) {
                const node = forestNodes[fm.nodeIndex];
                const ph = fm.phase;

                // Bobbing & drifting around node coordinates
                const dx = Math.sin(time * fm.speedX + ph) * fm.range;
                const dy = 0.5 + Math.sin(time * fm.speedY + ph * 1.5) * 0.3;
                const dz = Math.cos(time * fm.speedZ + ph * 0.8) * fm.range;

                posAttr.setXYZ(i, node.x + dx, dy, node.z + dz);
            } else {
                posAttr.setXYZ(i, 0, -999, 0); // Cull offscreen
            }
        }
        posAttr.needsUpdate = true;

        if (pointsRef.current.material) {
            // Gently pulse firefly size/opacity over time
            pointsRef.current.material.opacity = 0.4 + 0.35 * Math.sin(time * 2.0);
        }
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
                color="#eab308" // Soft warm yellow
                size={0.06}
                transparent
                opacity={0.7}
                depthWrite={false}
                sizeAttenuation
            />
        </points>
    );
}
