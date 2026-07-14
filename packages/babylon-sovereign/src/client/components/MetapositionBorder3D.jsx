import React from 'react';
import * as THREE from 'three';
import { PALETTE } from '../design/worldDesign';

export default function MetapositionBorder3D({ nodes, isHovered }) {
    // Nenápadná "cestičková" linka; hover zvýrazní sektor magickou cyan.
    const sectorColor = isHovered ? PALETTE.accent.magic : PALETTE.path.dirt;

    const centerNode = nodes.find(n => n.subIndex === 0);
    if (!centerNode) return null;

    return (
        <group position={[centerNode.position[0], 0.45, centerNode.position[2]]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[3.3, 3.4, 32]} />
                <meshBasicMaterial
                    color={sectorColor}
                    side={THREE.DoubleSide}
                    transparent
                    opacity={isHovered ? 0.7 : 0.25}
                />
            </mesh>
        </group>
    );
}
