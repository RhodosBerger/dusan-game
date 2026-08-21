import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from '../design/worldDesign';

/**
 * DramaticEnvironment — multi-layer atmospheric system
 * 
 * Layers:
 * 1. Gradient sky dome (radial gradient from deep space to horizon glow)
 * 2. Aurora waves (animated shader-like mesh bands)
 * 3. Volumetric god ray light shafts (concentric translucent cones)
 * 4. Atmospheric fog dome (colored hemisphere gradient)
 * 5. Horizon glow ring (emissive ring at horizon level)
 */

// ─── Gradient Sky Dome ──────────────────────────────────────────────────────────
function GradientSkyDome() {
    const matRef = useRef();
    
    const skyTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Create radial gradient sky
        const grad = ctx.createRadialGradient(256, 400, 50, 256, 256, 400);
        grad.addColorStop(0, '#1a0a2e');      // Deep purple at zenith
        grad.addColorStop(0.3, '#0d1a3a');     // Dark blue
        grad.addColorStop(0.6, '#0a1525');    // Very dark blue
        grad.addColorStop(0.85, '#08090e');   // Near-black at horizon
        grad.addColorStop(1, '#050508');      // Black at bottom
        
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);
        
        // Add nebula clouds
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 300;
            const r = 40 + Math.random() * 80;
            const nebula = ctx.createRadialGradient(x, y, 0, x, y, r);
            const hue = Math.random() < 0.5 ? '45, 211, 241' : '168, 85, 247';
            nebula.addColorStop(0, `rgba(${hue}, 0.08)`);
            nebula.addColorStop(0.5, `rgba(${hue}, 0.03)`);
            nebula.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = nebula;
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.mapping = THREE.EquirectangularReflectionMapping;
        return texture;
    }, []);
    
    return (
        <mesh ref={matRef} scale={[500, 500, 500]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshBasicMaterial 
                map={skyTexture} 
                side={THREE.BackSide}
                depthWrite={false}
                fog={false}
            />
        </mesh>
    );
}

// ─── Aurora Waves ───────────────────────────────────────────────────────────────
function AuroraWaves() {
    const groupRef = useRef();
    const NUM_WAVES = 3;
    
    // Generate wave geometry — a wide curved ribbon
    const waveGeometries = useMemo(() => {
        const geos = [];
        for (let w = 0; w < NUM_WAVES; w++) {
            const segments = 64;
            const positions = new Float32Array((segments + 1) * 2 * 3);
            const uvs = new Float32Array((segments + 1) * 2 * 2);
            const indices = [];
            
            const width = 300;
            const halfWidth = width / 2;
            
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const x = -halfWidth + t * width;
                
                // Top edge
                positions[i * 6] = x;
                positions[i * 6 + 1] = 60 + w * 8;
                positions[i * 6 + 2] = 0;
                
                // Bottom edge
                positions[(i + segments + 1) * 3] = x;
                positions[(i + segments + 1) * 3 + 1] = 40 + w * 8;
                positions[(i + segments + 1) * 3 + 2] = 0;
                
                uvs[i * 4] = t;
                uvs[i * 4 + 1] = 1;
                uvs[(i + segments + 1) * 2] = t;
                uvs[(i + segments + 1) * 2 + 1] = 0;
            }
            
            for (let i = 0; i < segments; i++) {
                indices.push(i, i + segments + 1, i + 1);
                indices.push(i + 1, i + segments + 1, i + segments + 2);
            }
            
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
            geo.setIndex(indices);
            geos.push(geo);
        }
        return geos;
    }, []);
    
    const waveColors = useMemo(() => [
        new THREE.Color('#2dd3f1'),
        new THREE.Color('#a855f7'),
        new THREE.Color('#39ff14'),
    ], []);
    
    useFrame((state) => {
        if (!groupRef.current) return;
        const time = state.clock.elapsedTime;
        
        groupRef.current.children.forEach((wave, i) => {
            // Animate opacity and position
            wave.material.opacity = 0.08 + Math.sin(time * 0.5 + i * 2) * 0.05;
            wave.rotation.z = Math.sin(time * 0.15 + i) * 0.1;
            wave.rotation.x = -0.2 + Math.sin(time * 0.2 + i * 1.5) * 0.05;
        });
    });
    
    return (
        <group ref={groupRef}>
            {waveGeometries.map((geo, i) => (
                <mesh key={i} geometry={geo} position={[0, 0, 0]} rotation={[-0.2, 0, 0]}>
                    <meshBasicMaterial
                        color={waveColors[i]}
                        transparent
                        opacity={0.1}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                        fog={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

// ─── Volumetric Light Shafts ────────────────────────────────────────────────────
function LightShafts() {
    const groupRef = useRef();
    const SHAFT_COUNT = 5;
    
    useFrame((state) => {
        if (!groupRef.current) return;
        const time = state.clock.elapsedTime;
        
        groupRef.current.children.forEach((shaft, i) => {
            const offset = i * 1.2;
            shaft.material.opacity = 0.04 + Math.sin(time * 0.3 + offset) * 0.02;
            shaft.rotation.y = time * 0.05 + (i * Math.PI / SHAFT_COUNT);
        });
    });
    
    return (
        <group ref={groupRef} position={[0, 20, 0]}>
            {Array.from({ length: SHAFT_COUNT }).map((_, i) => (
                <mesh 
                    key={i}
                    rotation={[0, (i / SHAFT_COUNT) * Math.PI * 2, 0]}
                    position={[0, -15, 0]}
                >
                    <coneGeometry args={[8, 40, 8, 1, true]} />
                    <meshBasicMaterial
                        color="#fff4e0"
                        transparent
                        opacity={0.05}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                        fog={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

// ─── Horizon Glow Ring ──────────────────────────────────────────────────────────
function HorizonGlowRing() {
    const matRef = useRef();
    
    const ringTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        const grad = ctx.createLinearGradient(0, 0, 0, 64);
        grad.addColorStop(0, 'rgba(45, 211, 241, 0)');
        grad.addColorStop(0.5, 'rgba(45, 211, 241, 0.3)');
        grad.addColorStop(1, 'rgba(45, 211, 241, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 64);
        
        return new THREE.CanvasTexture(canvas);
    }, []);
    
    useFrame((state) => {
        if (!matRef.current) return;
        const time = state.clock.elapsedTime;
        matRef.current.opacity = 0.4 + Math.sin(time * 0.4) * 0.15;
    });
    
    return (
        <mesh ref={matRef} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[120, 200, 64]} />
            <meshBasicMaterial
                map={ringTexture}
                color={PALETTE.accent.magic}
                transparent
                opacity={0.4}
                side={THREE.DoubleSide}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                fog={false}
            />
        </mesh>
    );
}

// ─── Atmospheric Particle Haze ──────────────────────────────────────────────────
function AtmosphericHaze({ entropy = 0.4 }) {
    const pointsRef = useRef();
    const count = 500;
    
    const [positions] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = 20 + Math.random() * 80;
            const theta = Math.random() * Math.PI * 2;
            const y = (Math.random() - 0.3) * 40;
            pos[i * 3] = Math.cos(theta) * r;
            pos[i * 3 + 1] = y;
            pos[i * 3 + 2] = Math.sin(theta) * r;
        }
        return [pos];
    }, []);
    
    const [velocities] = useMemo(() => {
        const vels = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            vels[i * 3] = (Math.random() - 0.5) * 0.5;
            vels[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
            vels[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
        }
        return [vels];
    }, []);
    
    useFrame((state, delta) => {
        if (!pointsRef.current) return;
        const time = state.clock.elapsedTime;
        const posAttr = pointsRef.current.geometry.attributes.position;
        
        for (let i = 0; i < count; i++) {
            const x = posAttr.getX(i) + velocities[i * 3] * delta;
            const y = posAttr.getY(i) + velocities[i * 3 + 1] * delta + Math.sin(time + i) * 0.02;
            const z = posAttr.getZ(i) + velocities[i * 3 + 2] * delta;
            
            // Wrap around
            const dist = Math.sqrt(x * x + z * z);
            if (dist > 100) {
                posAttr.setXYZ(i, -x * 0.3, y, -z * 0.3);
            } else {
                posAttr.setXYZ(i, x, y, z);
            }
        }
        posAttr.needsUpdate = true;
        
        // Pulse opacity with entropy
        const pulse = 0.3 + Math.sin(time * 0.5) * 0.1 + entropy * 0.15;
        pointsRef.current.material.opacity = pulse;
    });
    
    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            </bufferGeometry>
            <pointsMaterial
                color={PALETTE.accent.magic}
                size={0.3}
                transparent
                opacity={0.35}
                sizeAttenuation
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                fog={true}
            />
        </points>
    );
}

// ─── Main Dramatic Environment ──────────────────────────────────────────────────
export default function DramaticEnvironment({ entropy = 0.4 }) {
    return (
        <>
            {/* Layer 1: Gradient Sky Dome */}
            <GradientSkyDome />
            
            {/* Layer 2: Aurora Waves */}
            <AuroraWaves />
            
            {/* Layer 3: Volumetric Light Shafts */}
            <LightShafts />
            
            {/* Layer 4: Horizon Glow Ring */}
            <HorizonGlowRing />
            
            {/* Layer 5: Atmospheric Haze Particles */}
            <AtmosphericHaze entropy={entropy} />
        </>
    );
}
