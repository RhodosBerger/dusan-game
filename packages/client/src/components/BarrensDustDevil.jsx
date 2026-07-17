import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MAX_PARTICLES = 128;

export default function BarrensDustDevil({ gridData, map }) {
    const pointsRef = useRef();

    // Find all Barrens nodes
    const barrensNodes = useMemo(() => {
        if (!gridData || !map) return [];
        return gridData.filter(node => {
            const chunk = map.find(c => c.id === node.macroIndex);
            const block = chunk?.blocks?.find(b => b.id === node.subIndex);
            return block?.biome === 'BARRENS';
        });
    }, [gridData, map]);

    // Pre-assign each particle to a node, with unique angles, speeds, and height offsets
    const particleMeta = useMemo(() => {
        const meta = [];
        for (let i = 0; i < MAX_PARTICLES; i++) {
            const nodeIndex = barrensNodes.length > 0 ? i % barrensNodes.length : -1;
            meta.push({
                nodeIndex,
                speed: 3.0 + Math.random() * 3.0,
                baseRadius: 0.2 + Math.random() * 0.4,
                heightOffset: Math.random() * 2.0,
                twistFactor: 1.5 + Math.random() * 2.0
            });
        }
        return meta;
    }, [barrensNodes]);

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
        if (!pointsRef.current || barrensNodes.length === 0) return;
        const time = state.clock.elapsedTime;
        const posAttr = pointsRef.current.geometry.attributes.position;

        for (let i = 0; i < MAX_PARTICLES; i++) {
            const pm = particleMeta[i];
            if (pm.nodeIndex === -1) continue;

            const node = barrensNodes[pm.nodeIndex];
            
            // Dynamic height (drifts upward and loops)
            let y = ((time * 0.5 + pm.heightOffset) % 2.0); // height 0 to 2
            
            // Funnel shape: radius expands slightly as height increases
            const radius = pm.baseRadius * (1.0 + y * 0.5);
            
            // Spiral rotation angle with height twist
            const angle = time * pm.speed + y * pm.twistFactor + (i * 0.1);

            const x = node.x + Math.cos(angle) * radius;
            const z = node.z + Math.sin(angle) * radius;

            posAttr.setXYZ(i, x, 0.2 + y, z);
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
                color="#cca43b" // Sandy gold color
                size={0.075}
                transparent
                opacity={0.5}
                depthWrite={false}
                sizeAttenuation
            />
        </points>
    );
}
