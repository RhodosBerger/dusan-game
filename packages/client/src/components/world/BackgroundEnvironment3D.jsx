import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const GodRaysShader = {
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        uniform float uTime;
        uniform float uEntropy;
        uniform vec3 uColor;
        varying vec2 vUv;
        
        void main() {
            // Fade out radially and vertically (fade at top and bottom)
            float alpha = (1.0 - vUv.y) * sin(vUv.x * 3.14159);
            
            // Shimmering pattern with phase offsets (avoids dynamic branching for TDP safety)
            float shimmer = sin(vUv.x * 12.0 + uTime * 0.9) * 0.12 
                          + cos(vUv.y * 8.0 - uTime * 1.3) * 0.08 
                          + 0.8;
            
            alpha *= shimmer;
            
            // Adjust transparency based on entropy
            float targetAlpha = alpha * (0.35 + uEntropy * 0.45);
            
            gl_FragColor = vec4(uColor, targetAlpha * 0.35);
        }
    `
};

export default function BackgroundEnvironment3D({ activeBiome, entropy = 0.4 }) {
    const crystalMaterialRef = useRef();

    // Cache geometries (Rule 1: Geometry & Material Caching)
    const coneGeom = useMemo(() => new THREE.ConeGeometry(1, 1, 4), []);
    const crystalGeom = useMemo(() => new THREE.CylinderGeometry(0, 1, 1, 4), []);
    const rayGeom = useMemo(() => new THREE.CylinderGeometry(1, 3.5, 1, 16, 1, true), []); // Open-ended cone of light!

    // Determine colors based on biome & entropy
    const theme = useMemo(() => {
        if (activeBiome === 'TOXIC_SWAMP') {
            return {
                crystalColor: '#a3e635',
                emissiveColor: '#39ff14',
                rayColor: new THREE.Color('#39ff14'),
                mountainColor: '#0a0d08'
            };
        }
        if (entropy >= 0.6) {
            return {
                crystalColor: '#c084fc',
                emissiveColor: '#a855f7',
                rayColor: new THREE.Color('#a855f7'),
                mountainColor: '#060309'
            };
        }
        if (entropy >= 0.3) {
            return {
                crystalColor: '#22d3ee',
                emissiveColor: '#00ffff',
                rayColor: new THREE.Color('#00ffff'),
                mountainColor: '#04070b'
            };
        }
        // Default / Lush Forest / Glacier
        return {
            crystalColor: '#0891b2',
            emissiveColor: '#2dd3f1',
            rayColor: new THREE.Color('#baf8fc'),
            mountainColor: '#040508'
        };
    }, [activeBiome, entropy]);

    // Cache mountain range configurations
    const mountainInstances = useMemo(() => {
        return [
            // Left flank
            { pos: [-35, 10, -50], scale: [18, 32, 18], rot: [0.1, 0.4, -0.1] },
            { pos: [-25, 6, -45], scale: [14, 24, 14], rot: [-0.05, 0.2, 0.05] },
            { pos: [-45, 12, -55], scale: [22, 38, 22], rot: [0.0, 0.8, -0.2] },
            
            // Right flank
            { pos: [35, 10, -50], scale: [18, 32, 18], rot: [0.1, -0.4, 0.1] },
            { pos: [25, 6, -45], scale: [14, 24, 14], rot: [-0.05, -0.2, -0.05] },
            { pos: [45, 12, -55], scale: [22, 38, 22], rot: [0.0, -0.8, 0.2] },

            // Behind central crystal
            { pos: [-10, 8, -55], scale: [20, 28, 20], rot: [0.05, 0.1, 0.0] },
            { pos: [10, 8, -55], scale: [20, 28, 20], rot: [0.05, -0.1, 0.0] }
        ];
    }, []);

    // Cache crystal cluster configurations
    const crystalInstances = useMemo(() => {
        return [
            // Main spire pointing straight up-forward
            { pos: [0, 10, -42], scale: [3.8, 28, 3.8], rot: [0.12, 0.78, 0.0] },
            
            // Surrounding spires rotated outwards
            { pos: [-4, 6, -41], scale: [2.0, 16, 2.0], rot: [0.3, 0.2, -0.25] },
            { pos: [4, 6, -41], scale: [2.0, 16, 2.0], rot: [0.3, -0.2, 0.25] },
            { pos: [-2, 4, -39], scale: [1.6, 12, 1.6], rot: [0.45, 0.5, -0.4] },
            { pos: [2, 4, -39], scale: [1.6, 12, 1.6], rot: [0.45, -0.5, 0.4] }
        ];
    }, []);

    // Cache materials (Rule 1: Geometry & Material Caching)
    const mountainMat = useMemo(() => new THREE.MeshStandardMaterial({
        roughness: 0.95,
        metalness: 0.1,
        flatShading: true
    }), []);

    const crystalMat = useMemo(() => new THREE.MeshStandardMaterial({
        roughness: 0.08,
        metalness: 0.92,
        flatShading: true,
        transparent: true,
        opacity: 0.95
    }), []);

    const godRaysMat = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uEntropy: { value: 0.4 },
            uColor: { value: new THREE.Color() }
        },
        vertexShader: GodRaysShader.vertexShader,
        fragmentShader: GodRaysShader.fragmentShader,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
    }), []);

    // Update materials and shader uniforms dynamically on frame tick
    useFrame((state) => {
        const time = state.clock.elapsedTime;
        
        // Dynamic shader uniform updates
        if (godRaysMat) {
            godRaysMat.uniforms.uTime.value = time;
            godRaysMat.uniforms.uEntropy.value = entropy;
            godRaysMat.uniforms.uColor.value.copy(theme.rayColor);
        }

        // Dynamic crystal emissive glow matching the active biome
        if (crystalMat) {
            crystalMat.color.set(theme.crystalColor);
            crystalMat.emissive.set(theme.emissiveColor);
            crystalMat.emissiveIntensity = 2.0 + Math.sin(time * 1.5) * 0.4;
        }

        if (mountainMat) {
            mountainMat.color.set(theme.mountainColor);
        }
    });

    return (
        <group>
            {/* Background Mountains */}
            <group>
                {mountainInstances.map((m, idx) => (
                    <mesh
                        key={`mt_${idx}`}
                        geometry={coneGeom}
                        material={mountainMat}
                        position={m.pos}
                        scale={m.scale}
                        rotation={m.rot}
                        castShadow
                        receiveShadow
                    />
                ))}
            </group>

            {/* Central Crystal Spire Structures */}
            <group>
                {crystalInstances.map((c, idx) => (
                    <mesh
                        key={`cry_${idx}`}
                        geometry={crystalGeom}
                        material={crystalMat}
                        position={c.pos}
                        scale={c.scale}
                        rotation={c.rot}
                        castShadow
                    />
                ))}
            </group>

            {/* Volumetric God Rays / Crepuscular Light Shafts */}
            <group position={[0, 18, -42]} rotation={[0.42, 0, 0]}>
                <mesh
                    geometry={rayGeom}
                    material={godRaysMat}
                    scale={[6.0, 48, 6.0]}
                    position={[0, -20, 0]}
                />
                <mesh
                    geometry={rayGeom}
                    material={godRaysMat}
                    scale={[4.0, 36, 4.0]}
                    position={[0, -15, 0]}
                    rotation={[0, Math.PI / 4, 0]}
                />
            </group>
        </group>
    );
}
