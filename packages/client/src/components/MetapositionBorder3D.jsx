import React from 'react';
import * as THREE from 'three';

export default function MetapositionBorder3D({ nodes, isHovered }) {
    // Dynamická farba sektora (napr. striedanie oranžovej, cyan, fialovej podľa indexu metapozície)
    const sectorColor = isHovered ? '#00ffff' : '#8800ff';

    // Výpočet hrubého obrysu okolo 7 spojených hexov (zjednodušená vizualizácia pomocou kružnice/obrysu macro stredu)
    const centerNode = nodes.find(n => n.subIndex === 0);

    if (!centerNode) return null;

    return (
        <group position={[centerNode.position[0], 0.45, centerNode.position[2]]}>
            {/* Vonkajší ochranný neónový kruh/štít metapozície */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[3.3, 3.4, 32]} />
                <meshBasicMaterial 
                    color={sectorColor} 
                    side={THREE.DoubleSide}
                    transparent
                    opacity={isHovered ? 0.9 : 0.4}
                />
            </mesh>
        </group>
    );
}
