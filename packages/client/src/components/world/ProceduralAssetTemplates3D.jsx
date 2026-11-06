import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

export const PHYSICS_PRESETS = {
    DOTA_HEAVY_STONE: {
        stiffness: 185.0,
        damping: 16.5,
        mass: 2.4,
        gravity: 9.81,
        restitution: 0.28,
        recoilAmplitude: 0.24,
    },
    AETHERIC_RELIC_FLOAT: {
        stiffness: 95.0,
        damping: 8.5,
        mass: 0.85,
        gravity: 4.2,
        restitution: 0.55,
        recoilAmplitude: 0.35,
    },
};

const FACTION_PALETTE = {
    crystal: { primary: '#0284c7', secondary: '#d97706', trim: '#1f3a4d', stone: '#475569' },
    toxic:   { primary: '#16a34a', secondary: '#65a30d', trim: '#2d3a24', stone: '#3f6212' },
    void:    { primary: '#9333ea', secondary: '#d97706', trim: '#2c1b38', stone: '#4c1d95' },
    druid:   { primary: '#d97706', secondary: '#ea580c', trim: '#3d2c1e', stone: '#78350f' },
    npc:     { primary: '#dc2626', secondary: '#8d5b4c', trim: '#2b181a', stone: '#7f1d1d' },
};

export function ProceduralHeroArmor3D({ faction = 'crystal', lowHp = false }) {
    const outerRingRef = useRef();
    const satellitesRef = useRef();
    const springState = useRef({ y: 0, vy: 0 });
    const palette = FACTION_PALETTE[faction] || FACTION_PALETTE.crystal;
    const preset = PHYSICS_PRESETS.AETHERIC_RELIC_FLOAT;

    const satelliteOffsets = useMemo(() => [
        { angle: 0, height: 0.52 },
        { angle: (Math.PI * 2) / 3, height: 0.60 },
        { angle: (Math.PI * 4) / 3, height: 0.46 },
    ], []);

    useFrame((state, delta) => {
        const dt = Math.min(delta, 0.05);
        const speedMult = lowHp ? 2.0 : 1.0;

        const targetY = Math.sin(state.clock.elapsedTime * 2.4) * 0.05;
        const force = -preset.stiffness * (springState.current.y - targetY) - preset.damping * springState.current.vy;
        springState.current.vy += (force / preset.mass) * dt;
        springState.current.y += springState.current.vy * dt;

        if (outerRingRef.current) {
            outerRingRef.current.rotation.z += dt * 0.75 * speedMult;
            outerRingRef.current.position.y = 0.28 + springState.current.y;
        }
        if (satellitesRef.current) {
            satellitesRef.current.rotation.y += dt * 0.95 * speedMult;
            satellitesRef.current.position.y = springState.current.y * 1.2;
        }
    });

    return (
        <group position={[0, 0.08, 0]}>
            <mesh ref={outerRingRef} position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow raycast={() => null}>
                <torusGeometry args={[0.56, 0.032, 8, 24]} />
                <meshStandardMaterial color={lowHp ? '#dc2626' : palette.secondary} roughness={0.45} metalness={0.75} />
            </mesh>

            {[-0.46, 0.46].map((xPos, idx) => (
                <RoundedBox
                    key={idx}
                    args={[0.20, 0.12, 0.24]}
                    radius={0.03}
                    smoothness={2}
                    position={[xPos, 0.58, 0]}
                    rotation={[0, 0, idx === 0 ? 0.25 : -0.25]}
                    castShadow
                    receiveShadow
                    raycast={() => null}
                >
                    <meshStandardMaterial color={palette.stone} roughness={0.6} metalness={0.5} />
                </RoundedBox>
            ))}

            <group ref={satellitesRef}>
                {satelliteOffsets.map((sat, idx) => (
                    <Float key={idx} speed={2.0} rotationIntensity={0.5} floatIntensity={0.2}>
                        <mesh
                            position={[Math.cos(sat.angle) * 0.64, sat.height, Math.sin(sat.angle) * 0.64]}
                            castShadow
                            raycast={() => null}
                        >
                            <octahedronGeometry args={[0.075, 0]} />
                            <meshStandardMaterial color={palette.primary} roughness={0.35} metalness={0.6} />
                        </mesh>
                    </Float>
                ))}
            </group>

            <mesh position={[0, 0.08, 0.56]} rotation={[Math.PI / 2, 0, 0]} castShadow raycast={() => null}>
                <coneGeometry args={[0.11, 0.24, 4]} />
                <meshStandardMaterial color="#d97706" roughness={0.4} metalness={0.8} />
            </mesh>
        </group>
    );
}

export function TownSanctuaryMonument3D({ position = [0, 0.45, 0] }) {
    const ringRef = useRef();

    useFrame((_, delta) => {
        if (ringRef.current) {
            ringRef.current.rotation.z -= delta * 0.4;
        }
    });

    const pillarPositions = [
        [0.95, 0, 0.95],
        [-0.95, 0, 0.95],
        [0.95, 0, -0.95],
        [-0.95, 0, -0.95],
    ];

    return (
        <group position={position}>
            <mesh ref={ringRef} position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow castShadow raycast={() => null}>
                <torusGeometry args={[0.88, 0.038, 8, 6]} />
                <meshStandardMaterial color="#d97706" roughness={0.45} metalness={0.72} />
            </mesh>

            {pillarPositions.map((pos, idx) => (
                <group key={idx} position={pos}>
                    <RoundedBox args={[0.20, 0.65, 0.20]} radius={0.03} smoothness={2} position={[0, 0.32, 0]} castShadow receiveShadow raycast={() => null}>
                        <meshStandardMaterial color="#64748b" roughness={0.78} metalness={0.15} />
                    </RoundedBox>
                    <RoundedBox args={[0.26, 0.10, 0.26]} radius={0.02} smoothness={2} position={[0, 0.68, 0]} castShadow receiveShadow raycast={() => null}>
                        <meshStandardMaterial color="#d97706" roughness={0.48} metalness={0.68} />
                    </RoundedBox>
                </group>
            ))}

            <Sparkles count={10} scale={[1.5, 1.0, 1.5]} position={[0, 0.8, 0]} size={1.2} speed={0.25} opacity={0.4} color="#d97706" />
        </group>
    );
}

export function DirectionalCompassRose3D({ position = [0, 0, 0] }) {
    const groupRef = useRef();

    useFrame((_, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.12;
        }
    });

    const directions = useMemo(() => Array.from({ length: 8 }, (_, i) => i * (Math.PI / 4)), []);

    return (
        <group ref={groupRef} position={[position[0], (position[1] || 0) + 0.44, position[2]]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} receiveShadow raycast={() => null}>
                <ringGeometry args={[1.45, 1.54, 32]} />
                <meshStandardMaterial color="#d97706" roughness={0.48} metalness={0.72} side={THREE.DoubleSide} />
            </mesh>
            {directions.map((angle, idx) => (
                <mesh
                    key={idx}
                    position={[Math.cos(angle) * 1.65, 0.02, Math.sin(angle) * 1.65]}
                    rotation={[0, -angle + Math.PI / 2, 0]}
                    castShadow
                    raycast={() => null}
                >
                    <coneGeometry args={[0.08, 0.20, 4]} />
                    <meshStandardMaterial color={idx % 2 === 0 ? '#d97706' : '#0284c7'} roughness={0.45} metalness={0.68} />
                </mesh>
            ))}
        </group>
    );
}

/**
 * DotaTerrainObstacle3D — Note: Rendered inside HexagonNode3D which has rotation={[-Math.PI/2, 0, 0]},
 * so local +Z is World +Y (Up), and cylinders/cones use rotation={[Math.PI/2, 0, 0]} to stand upright!
 */
export function DotaTerrainObstacle3D({ feature, tier = 0 }) {
    const watchRef = useRef();
    useFrame((state, delta) => {
        if (watchRef.current) {
            watchRef.current.rotation.z += delta * 1.1;
            watchRef.current.position.z = 0.85 + Math.sin(state.clock.elapsedTime * 2.5) * 0.06;
        }
    });
    if (feature === 'RAMP') {
        return (
            <group position={[0, 0, 0.41]}>
                {[0, 1, 2].map((step) => (
                    <mesh
                        key={step}
                        position={[0, -0.38 + step * 0.38, 0.03 + step * 0.04]}
                        castShadow
                        receiveShadow
                        raycast={() => null}
                    >
                        <boxGeometry args={[1.15, 0.28, 0.06]} />
                        <meshStandardMaterial color="#94a3b8" roughness={0.82} metalness={0.1} />
                    </mesh>
                ))}
            </group>
        );
    }

    if (feature === 'BRIDGE') {
        return (
            <group position={[0, 0, 0.41]}>
                <mesh position={[0, 0, 0.03]} receiveShadow castShadow raycast={() => null}>
                    <boxGeometry args={[1.35, 1.75, 0.06]} />
                    <meshStandardMaterial color="#94a3b8" roughness={0.82} metalness={0.12} />
                </mesh>
                {[-0.68, 0.68].map((x, idx) => (
                    <mesh key={idx} position={[x, 0, 0.11]} castShadow receiveShadow raycast={() => null}>
                        <boxGeometry args={[0.14, 1.7, 0.14]} />
                        <meshStandardMaterial color="#64748b" roughness={0.8} metalness={0.18} />
                    </mesh>
                ))}
            </group>
        );
    }

    if (feature === 'BARRICADE') {
        return (
            <group position={[0, 0, 0.41]}>
                {[-0.88, 0.88].map((x, idx) => (
                    <group key={idx} position={[x, 0, 0]}>
                        <mesh position={[0, 0, 0.24]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow raycast={() => null}>
                            <cylinderGeometry args={[0.16, 0.22, 0.48, 6]} />
                            <meshStandardMaterial color="#64748b" roughness={0.82} metalness={0.15} />
                        </mesh>
                        <mesh position={[0, 0, 0.54]} rotation={[Math.PI / 2, 0, 0]} castShadow raycast={() => null}>
                            <coneGeometry args={[0.20, 0.22, 6]} />
                            <meshStandardMaterial color="#d97706" roughness={0.5} metalness={0.65} />
                        </mesh>
                    </group>
                ))}
            </group>
        );
    }

    if (feature === 'WATCHTOWER') {
        const isHighCliff = tier >= 2;
        return (
            <group position={[0, 0, 0.41]}>
                <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow raycast={() => null}>
                    <cylinderGeometry args={[0.45, 0.58, 0.16, 6]} />
                    <meshStandardMaterial color="#64748b" roughness={0.84} metalness={0.16} />
                </mesh>
                <mesh position={[0, 0, 0.42]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow raycast={() => null}>
                    <cylinderGeometry args={[0.16, 0.28, 0.58, 6]} />
                    <meshStandardMaterial color="#94a3b8" roughness={0.78} metalness={0.2} />
                </mesh>
                <mesh ref={watchRef} position={[0, 0, 0.85]} castShadow raycast={() => null}>
                    <octahedronGeometry args={[0.14, 0]} />
                    <meshStandardMaterial color={isHighCliff ? '#f59e0b' : '#0284c7'} roughness={0.35} metalness={0.55} />
                </mesh>
            </group>
        );
    }

    return null;
}
