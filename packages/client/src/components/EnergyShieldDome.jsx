import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from '../design/worldDesign';

/**
 * EnergyShieldDome — Dramatic translucent dome over the arena
 * 
 * Visual layers:
 * 1. Main dome with iridescent shader-like material
 * 2. Animated hex pattern wireframe overlay
 * 3. Pulsing energy rings at base
 * 4. Floating energy particles on dome surface
 */

// ─── Main Energy Dome ────────────────────────────────────────────────────────────
function EnergyDome() {
    const matRef = useRef();
    const domeTexture = useMemo(() => {
        // Create a hexagonal pattern texture for the dome
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, 512, 256);
        
        // Draw hexagonal grid pattern
        const hexSize = 20;
        const hexW = hexSize * Math.sqrt(3);
        const hexH = hexSize * 1.5;
        
        ctx.strokeStyle = 'rgba(45, 211, 241, 0.15)';
        ctx.lineWidth = 1;
        
        for (let row = 0; row < 12; row++) {
            for (let col = 0; col < 30; col++) {
                const x = col * hexW + (row % 2) * (hexW / 2);
                const y = row * hexH;
                
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i + Math.PI / 6;
                    const px = x + hexSize * Math.cos(angle);
                    const py = y + hexSize * Math.sin(angle);
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.stroke();
            }
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 1);
        return texture;
    }, []);
    
    useFrame((state) => {
        if (!matRef.current) return;
        const time = state.clock.elapsedTime;
        // Subtle opacity pulse
        matRef.current.opacity = 0.06 + Math.sin(time * 0.5) * 0.03;
        // Rotate texture for shimmer effect
        domeTexture.offset.x = time * 0.01;
        domeTexture.offset.y = time * 0.005;
    });
    
    return (
        <mesh position={[0, 8, 0]} scale={1}>
            <sphereGeometry args={[22, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshBasicMaterial
                ref={matRef}
                map={domeTexture}
                color={PALETTE.accent.magic}
                transparent
                opacity={0.08}
                side={THREE.DoubleSide}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                fog={false}
            />
        </mesh>
    );
}

// ─── Wireframe Overlay ──────────────────────────────────────────────────────────
function WireframeDome() {
    const ref = useRef();
    
    useFrame((state) => {
        if (!ref.current) return;
        const time = state.clock.elapsedTime;
        ref.current.rotation.y = time * 0.03;
        ref.current.material.opacity = 0.04 + Math.sin(time * 0.3) * 0.02;
    });
    
    return (
        <mesh ref={ref} position={[0, 8, 0]}>
            <sphereGeometry args={[22.5, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshBasicMaterial
                color={PALETTE.portal.mid}
                wireframe
                transparent
                opacity={0.05}
                fog={false}
            />
        </mesh>
    );
}

// ─── Base Energy Rings ──────────────────────────────────────────────────────────
function BaseEnergyRings() {
    const groupRef = useRef();
    const NUM_RINGS = 3;
    
    useFrame((state) => {
        if (!groupRef.current) return;
        const time = state.clock.elapsedTime;
        
        groupRef.current.children.forEach((ring, i) => {
            const phase = i * 2.0;
            const pulse = 0.3 + Math.sin(time * 0.8 + phase) * 0.15;
            ring.material.opacity = pulse;
            ring.rotation.z = time * (0.1 + i * 0.05);
            const scale = 1 + Math.sin(time * 1.2 + phase) * 0.02;
            ring.scale.set(scale, scale, 1);
        });
    });
    
    return (
        <group ref={groupRef} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            {Array.from({ length: NUM_RINGS }).map((_, i) => (
                <mesh key={i}>
                    <ringGeometry args={[18 + i * 1.5, 18.5 + i * 1.5, 64]} />
                    <meshBasicMaterial
                        color={i === 0 ? PALETTE.accent.magic : i === 1 ? '#a855f7' : '#39ff14'}
                        transparent
                        opacity={0.3}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            ))}
        </group>
    );
}

// ─── Floating Energy Particles on Dome ─────────────────────────────────────────
function DomeParticles() {
    const ref = useRef();
    const count = 80;
    
    const [positions] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            // Random positions on hemisphere surface
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI / 2;
            const r = 21;
            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.cos(phi) + 2;
            pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        }
        return [pos];
    }, []);
    
    const [velocities] = useMemo(() => {
        const vels = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            vels[i * 3] = (Math.random() - 0.5) * 0.3;
            vels[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
            vels[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
        }
        return [vels];
    }, []);
    
    useFrame((state, delta) => {
        if (!ref.current) return;
        const time = state.clock.elapsedTime;
        const posAttr = ref.current.geometry.attributes.position;
        
        for (let i = 0; i < count; i++) {
            let x = posAttr.getX(i) + velocities[i * 3] * delta;
            let y = posAttr.getY(i) + velocities[i * 3 + 1] * delta;
            let z = posAttr.getZ(i) + velocities[i * 3 + 2] * delta;
            
            // Keep particles near dome surface
            const dist = Math.sqrt(x * x + (y - 8) * (y - 8) + z * z);
            if (dist > 22 || dist < 20) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI / 2;
                const r = 21;
                x = r * Math.sin(phi) * Math.cos(theta);
                y = r * Math.cos(phi) + 2;
                z = r * Math.sin(phi) * Math.sin(theta);
            }
            
            posAttr.setXYZ(i, x, y, z);
        }
        posAttr.needsUpdate = true;
        
        // Pulse particle opacity
        ref.current.material.opacity = 0.4 + Math.sin(time * 0.7) * 0.2;
    });
    
    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            </bufferGeometry>
            <pointsMaterial
                color={PALETTE.portal.core}
                size={0.15}
                transparent
                opacity={0.5}
                sizeAttenuation
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                fog={false}
            />
        </points>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────────
export default function EnergyShieldDome() {
    return (
        <>
            <EnergyDome />
            <WireframeDome />
            <BaseEnergyRings />
            <DomeParticles />
        </>
    );
}
