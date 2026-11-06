import React from 'react';
import * as THREE from 'three';
import { PALETTE } from '../design/worldDesign';

export default function MetapositionBorder3D({ nodes, isHovered }) {
    const sectorColor = isHovered ? PALETTE.accent.magic : PALETTE.path.dirt;

    const centerNode = nodes.find(n => n.subIndex === 0);
    if (!centerNode) return null;

    return (
        <group position={[centerNode.position[0], (centerNode.position[1] || 0) + 0.43, centerNode.position[2]]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
                <ringGeometry args={[3.3, 3.4, 32]} />
                <meshBasicMaterial
                    color={sectorColor}
                    side={THREE.DoubleSide}
                    transparent
                    opacity={isHovered ? 0.65 : 0.22}
                />
            </mesh>
        </group>
    );
}
