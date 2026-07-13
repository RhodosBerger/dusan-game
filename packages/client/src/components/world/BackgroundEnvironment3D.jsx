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
            // Fade out radially and vertically
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

const BACKGROUND_PARTICLE_COUNT = 120;

export default function BackgroundEnvironment3D({ activeBiome, entropy = 0.4, ultimateFlash = false, scorchedTilesCount = 0 }) {
    const rayGroupRef = useRef();
    const particlesRef = useRef();

    // Cache geometries (Rule 1: Geometry & Material Caching)
    const coneGeom = useMemo(() => new THREE.ConeGeometry(1, 1, 4), []);
    const crystalGeom = useMemo(() => new THREE.CylinderGeometry(0, 1, 1, 4), []);
    const rayGeom = useMemo(() => new THREE.CylinderGeometry(1, 3.5, 1, 16, 1, true), []);
    
    // Cache background weather particles
    const { positions, velocities, colors } = useMemo(() => {
        const pos = new Float32Array(BACKGROUND_PARTICLE_COUNT * 3);
        const vel = new Float32Array(BACKGROUND_PARTICLE_COUNT * 3);
        const cols = new Float32Array(BACKGROUND_PARTICLE_COUNT * 3);
        for (let i = 0; i < BACKGROUND_PARTICLE_COUNT; i++) {
            // Orbit radius around the central crystal
            const angle = Math.random() * Math.PI * 2;
            const r = 5.0 + Math.random() * 20.0;
            pos[i * 3] = Math.cos(angle) * r;
            pos[i * 3 + 1] = 5.0 + Math.random() * 30.0;
            pos[i * 3 + 2] = -42.0 + (Math.random() - 0.5) * 15.0;

            // Float velocity
            vel[i * 3] = (Math.random() - 0.5) * 0.5; // drift X
            vel[i * 3 + 1] = -0.4 - Math.random() * 0.8; // fall Y
            vel[i * 3 + 2] = (Math.random() - 0.5) * 0.5; // drift Z

            // Initial white colors
            cols[i * 3] = 1.0;
            cols[i * 3 + 1] = 1.0;
            cols[i * 3 + 2] = 1.0;
        }
        return { positions: pos, velocities: vel, colors: cols };
    }, []);

    // Create a mutable position cache for particle updates
    const mutablePositions = useMemo(() => new Float32Array(positions), [positions]);

    // Determine environmental theme colors based on active biome & entropy
    const theme = useMemo(() => {
        if (activeBiome === 'TOXIC_SWAMP') {
            return {
                crystalColor: '#a3e635',
                emissiveColor: '#39ff14',
                rayColor: new THREE.Color('#39ff14'),
                mountainColor: '#0a0d08',
                particleColor: new THREE.Color('#a3e635'),
                particleSize: 0.12
            };
        }
        if (entropy >= 0.6) {
            return {
                crystalColor: '#c084fc',
                emissiveColor: '#a855f7',
                rayColor: new THREE.Color('#a855f7'),
                mountainColor: '#060309',
                particleColor: new THREE.Color('#c084fc'),
                particleSize: 0.14
            };
        }
        if (entropy >= 0.3) {
            return {
                crystalColor: '#22d3ee',
                emissiveColor: '#00ffff',
                rayColor: new THREE.Color('#00ffff'),
                mountainColor: '#04070b',
                particleColor: new THREE.Color('#00ffff'),
                particleSize: 0.1
            };
        }
        // Default / Lush Forest / Glacier
        return {
            crystalColor: '#0891b2',
            emissiveColor: '#2dd3f1',
            rayColor: new THREE.Color('#baf8fc'),
            mountainColor: '#040508',
            particleColor: new THREE.Color('#ffffff'),
            particleSize: 0.08
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

    const particlesMat = useMemo(() => new THREE.PointsMaterial({
        size: theme.particleSize,
        vertexColors: false,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    }), [theme.particleSize]);

    // Update materials, shader uniforms, and particles dynamically on frame tick
    useFrame((state, delta) => {
        const time = state.clock.elapsedTime;
        
        // --- 1. God Rays & Ultimate Flare ---
        if (godRaysMat) {
            // Speed up shimmering during ultimate flaring
            godRaysMat.uniforms.uTime.value = time * (ultimateFlash ? 2.5 : 1.0);
            godRaysMat.uniforms.uEntropy.value = entropy;

            // Blend light ray color to hot orange-red during high grid stress
            const baseRayCol = theme.rayColor.clone();
            if (scorchedTilesCount > 0) {
                const stressFactor = Math.min(1.0, scorchedTilesCount / 4.0);
                baseRayCol.lerp(new THREE.Color('#ff5500'), stressFactor * 0.7);
            }
            godRaysMat.uniforms.uColor.value.copy(baseRayCol);
        }

        // Dynamic scale flaring on ultimate flash
        if (rayGroupRef.current) {
            const baseScale = ultimateFlash ? (1.35 + Math.sin(time * 15.0) * 0.15) : 1.0;
            rayGroupRef.current.scale.set(baseScale, baseScale, baseScale);
        }

        // --- 2. Central Crystal & Grid Stress (Scorched Tiles) ---
        if (crystalMat) {
            const emissiveColorBase = new THREE.Color(theme.emissiveColor);
            
            // If the grid is scorched, melt/heat the crystals with hot red cores
            if (scorchedTilesCount > 0) {
                const meltFactor = Math.min(1.0, scorchedTilesCount / 5.0);
                emissiveColorBase.lerp(new THREE.Color('#ff2200'), meltFactor);
            }

            crystalMat.color.set(theme.crystalColor);
            crystalMat.emissive.copy(emissiveColorBase);
            
            // Pulse emissive glow (intense spikes during ultimate casts)
            const pulseRate = ultimateFlash ? 16.0 : 1.5;
            const pulseAmp = ultimateFlash ? 2.0 : 0.45;
            crystalMat.emissiveIntensity = 2.2 + Math.sin(time * pulseRate) * pulseAmp;
        }

        // --- 3. Mountain Volcanic Glow ---
        if (mountainMat) {
            const baseMountainCol = new THREE.Color(theme.mountainColor);
            
            if (scorchedTilesCount > 0) {
                const burnFactor = Math.min(1.0, scorchedTilesCount / 6.0);
                // Heat up the base of the mountains to simulated molten scoria
                mountainMat.emissive.set('#ff2200');
                mountainMat.emissiveIntensity = burnFactor * 1.6;
                baseMountainCol.lerp(new THREE.Color('#1c0a05'), burnFactor);
            } else {
                mountainMat.emissive.set('#000000');
                mountainMat.emissiveIntensity = 0.0;
            }

            mountainMat.color.copy(baseMountainCol);
        }

        // --- 4. Weather Particles Simulation ---
        if (particlesRef.current) {
            const posAttr = particlesRef.current.geometry.attributes.position;
            const speedMultiplier = ultimateFlash ? 2.5 : 1.0;
            
            for (let i = 0; i < BACKGROUND_PARTICLE_COUNT; i++) {
                const xi = i * 3, yi = xi + 1, zi = xi + 2;

                // Apply fall velocities
                mutablePositions[xi] += velocities[xi] * delta * speedMultiplier;
                mutablePositions[yi] += velocities[yi] * delta * speedMultiplier;
                mutablePositions[zi] += velocities[zi] * delta * speedMultiplier;

                // Wrap boundaries
                if (mutablePositions[yi] < 2.0) {
                    mutablePositions[yi] = 35.0; // Reset height to top
                    const angle = Math.random() * Math.PI * 2;
                    const r = 5.0 + Math.random() * 20.0;
                    mutablePositions[xi] = Math.cos(angle) * r;
                    mutablePositions[zi] = -42.0 + (Math.random() - 0.5) * 15.0;
                }

                posAttr.setXYZ(i, mutablePositions[xi], mutablePositions[yi], mutablePositions[zi]);
            }
            posAttr.needsUpdate = true;

            // Interpolate particle color
            if (particlesRef.current.material) {
                const targetParticleColor = theme.particleColor.clone();
                if (scorchedTilesCount > 0) {
                    const heatRatio = Math.min(1.0, scorchedTilesCount / 4.0);
                    targetParticleColor.lerp(new THREE.Color('#ff8800'), heatRatio * 0.8); // turn to fire embers
                }
                particlesRef.current.material.color.copy(targetParticleColor);
            }
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
            <group ref={rayGroupRef} position={[0, 18, -42]} rotation={[0.42, 0, 0]}>
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

            {/* Background Weather Particle System */}
            <points ref={particlesRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[positions, 3]}
                    />
                </bufferGeometry>
                <primitive object={particlesMat} />
            </points>
        </group>
    );
}
