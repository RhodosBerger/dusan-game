import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const FACTION_PALETTE = {
    crystal: { primary: '#2ec4b6', secondary: '#c89b3c', trim: '#1f3a4d', emissive: '#155e63' },
    toxic:   { primary: '#80ed99', secondary: '#a3b18a', trim: '#2d3a24', emissive: '#2d6a4f' },
    void:    { primary: '#e056fd', secondary: '#c89b3c', trim: '#2c1b38', emissive: '#5f27cd' },
    druid:   { primary: '#e9c46a', secondary: '#e76f51', trim: '#3d2c1e', emissive: '#b5651d' },
    npc:     { primary: '#e63946', secondary: '#8d5b4c', trim: '#2b181a', emissive: '#780000' }
};

/**
 * 1. ProceduralHeroArmor3D — Dota 2 Aegis / Runic Mantle & Orbiting Relics
 */
export function ProceduralHeroArmor3D({ faction = 'crystal', lowHp = false }) {
    const outerRingRef = useRef();
    const innerRingRef = useRef();
    const satellitesRef = useRef();
    const palette = FACTION_PALETTE[faction] || FACTION_PALETTE.crystal;

    const satelliteOffsets = useMemo(() => [
        { angle: 0, height: 0.48 },
        { angle: (Math.PI * 2) / 3, height: 0.56 },
        { angle: (Math.PI * 4) / 3, height: 0.42 },
    ], []);

    useFrame((state, delta) => {
        const speedMult = lowHp ? 2.2 : 1.0;
        if (outerRingRef.current) {
            outerRingRef.current.rotation.z += delta * 0.8 * speedMult;
        }
        if (innerRingRef.current) {
            innerRingRef.current.rotation.y -= delta * 1.1 * speedMult;
        }
        if (satellitesRef.current) {
            satellitesRef.current.rotation.y += delta * 0.9 * speedMult;
        }
    });

    return (
        <group position={[0, 0.1, 0]}>
            {/* Burnished Bronze Aegis Base Ring */}
            <mesh ref={outerRingRef} position={[0, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.56, 0.025, 8, 24]} />
                <meshStandardMaterial
                    color={lowHp ? '#e63946' : palette.secondary}
                    roughness={0.45}
                    metalness={0.78}
                />
            </mesh>

            {/* Inner Runic Band */}
            <mesh ref={innerRingRef} position={[0, 0.42, 0]} rotation={[Math.PI / 2.2, 0, 0]}>
                <torusGeometry args={[0.42, 0.018, 6, 18]} />
                <meshStandardMaterial
                    color={palette.primary}
                    emissive={palette.emissive}
                    emissiveIntensity={0.35}
                    roughness={0.5}
                    metalness={0.55}
                />
            </mesh>

            {/* 3 Orbiting Carved Relic Stones */}
            <group ref={satellitesRef}>
                {satelliteOffsets.map((sat, idx) => (
                    <mesh
                        key={idx}
                        position={[Math.cos(sat.angle) * 0.64, sat.height, Math.sin(sat.angle) * 0.64]}
                        castShadow
                    >
                        <octahedronGeometry args={[0.075, 0]} />
                        <meshStandardMaterial
                            color={palette.primary}
                            emissive={palette.emissive}
                            emissiveIntensity={0.4}
                            roughness={0.35}
                            metalness={0.65}
                        />
                    </mesh>
                ))}
            </group>

            {/* Forward Facing Direction Spearhead on Pedestal Rim */}
            <mesh position={[0, 0.08, 0.54]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.11, 0.24, 4]} />
                <meshStandardMaterial
                    color="#c89b3c"
                    roughness={0.4}
                    metalness={0.8}
                />
            </mesh>
        </group>
    );
}

/**
 * 2. TownSanctuaryMonument3D — Dota 2 Ancient / Fountain Sanctuary Monument
 */
export function TownSanctuaryMonument3D({ position = [0, 0.45, 0] }) {
    const coreRef = useRef();
    const ringRef = useRef();

    useFrame((state, delta) => {
        const t = state.clock.elapsedTime;
        if (coreRef.current) {
            coreRef.current.rotation.y += delta * 0.7;
            coreRef.current.position.y = 1.25 + Math.sin(t * 1.8) * 0.08;
        }
        if (ringRef.current) {
            ringRef.current.rotation.z -= delta * 0.45;
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
            {/* Carved Basalt Stepped Plinth */}
            <mesh position={[0, 0.08, 0]} receiveShadow castShadow>
                <cylinderGeometry args={[1.15, 1.32, 0.16, 6]} />
                <meshStandardMaterial color="#252830" roughness={0.85} metalness={0.15} />
            </mesh>
            <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
                <cylinderGeometry args={[0.85, 1.02, 0.12, 6]} />
                <meshStandardMaterial color="#323642" roughness={0.78} metalness={0.22} />
            </mesh>

            {/* Antique Bronze Ring Inlay */}
            <mesh ref={ringRef} position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.78, 0.04, 8, 6]} />
                <meshStandardMaterial color="#c89b3c" roughness={0.42} metalness={0.8} />
            </mesh>

            {/* 4 Corner Carved Stone Pillars with Warm Braziers */}
            {pillarPositions.map((pos, idx) => (
                <group key={idx} position={pos}>
                    <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.22, 0.84, 0.22]} />
                        <meshStandardMaterial color="#2b2f3a" roughness={0.82} metalness={0.18} />
                    </mesh>
                    <mesh position={[0, 0.86, 0]} castShadow>
                        <boxGeometry args={[0.28, 0.1, 0.28]} />
                        <meshStandardMaterial color="#8a6d3b" roughness={0.5} metalness={0.65} />
                    </mesh>
                    <mesh position={[0, 0.98, 0]}>
                        <octahedronGeometry args={[0.09, 0]} />
                        <meshStandardMaterial
                            color="#2ec4b6"
                            emissive="#155e63"
                            emissiveIntensity={0.6}
                            roughness={0.35}
                        />
                    </mesh>
                </group>
            ))}

            {/* Floating Radiant Aegis Relic Core */}
            <mesh ref={coreRef} position={[0, 1.25, 0]} castShadow>
                <octahedronGeometry args={[0.26, 0]} />
                <meshStandardMaterial
                    color="#2ec4b6"
                    emissive="#155e63"
                    emissiveIntensity={0.55}
                    roughness={0.25}
                    metalness={0.5}
                />
            </mesh>
        </group>
    );
}

/**
 * 3. DirectionalCompassRose3D — Dota 2 Tactical 8-Way Runic Compass Ring
 */
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
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.45, 1.54, 32]} />
                <meshStandardMaterial
                    color="#c89b3c"
                    roughness={0.45}
                    metalness={0.75}
                    side={THREE.DoubleSide}
                />
            </mesh>
            {directions.map((angle, idx) => (
                <mesh
                    key={idx}
                    position={[Math.cos(angle) * 1.65, 0.02, Math.sin(angle) * 1.65]}
                    rotation={[0, -angle + Math.PI / 2, 0]}
                >
                    <coneGeometry args={[0.09, 0.22, 4]} />
                    <meshStandardMaterial
                        color={idx % 2 === 0 ? '#c89b3c' : '#2ec4b6'}
                        roughness={0.4}
                        metalness={0.7}
                    />
                </mesh>
            ))}
        </group>
    );
}

/**
 * 4. DotaTerrainObstacle3D — Viacúrovňové herné prvky (Schodiskové rampy, Kamenné mosty,
 *    Priechodné barikády a Vyhliadkové strážne veže na útesoch)
 */
export function DotaTerrainObstacle3D({ feature, tier = 0 }) {
    const wardRef = useRef();

    useFrame((state, delta) => {
        if (wardRef.current) {
            wardRef.current.rotation.y += delta * 1.2;
            wardRef.current.position.y = 1.55 + Math.sin(state.clock.elapsedTime * 2.2) * 0.07;
        }
    });

    if (feature === 'RAMP') {
        // Kamenné schodisko s bronzovým lemovaním (spája výškové úrovne)
        return (
            <group position={[0, 0, 0.42]}>
                {[0, 1, 2, 3].map((step) => (
                    <mesh
                        key={step}
                        position={[0, -0.55 + step * 0.36, -0.12 + step * 0.09]}
                        castShadow
                        receiveShadow
                    >
                        <boxGeometry args={[1.45, 0.32, 0.14]} />
                        <meshStandardMaterial color="#3a3f4d" roughness={0.85} metalness={0.12} />
                    </mesh>
                ))}
                {/* Bočné kamenné obrubníky schodiska */}
                {[-0.82, 0.82].map((x, idx) => (
                    <mesh key={idx} position={[x, 0, 0.08]} castShadow receiveShadow>
                        <boxGeometry args={[0.18, 1.55, 0.28]} />
                        <meshStandardMaterial color="#262a34" roughness={0.88} metalness={0.15} />
                    </mesh>
                ))}
            </group>
        );
    }

    if (feature === 'BRIDGE') {
        // Kamenný most cez riečnu kotlinu s bočnými parapetmi a fakľovými stĺpmi
        return (
            <group position={[0, 0, 0.42]}>
                <mesh position={[0, 0, 0.06]} receiveShadow castShadow>
                    <boxGeometry args={[1.9, 2.3, 0.12]} />
                    <meshStandardMaterial color="#3c4049" roughness={0.86} metalness={0.14} />
                </mesh>
                {[-0.95, 0.95].map((x, idx) => (
                    <group key={idx} position={[x, 0, 0.22]}>
                        <mesh castShadow receiveShadow>
                            <boxGeometry args={[0.2, 2.2, 0.26]} />
                            <meshStandardMaterial color="#252830" roughness={0.85} metalness={0.2} />
                        </mesh>
                        <mesh position={[0, 0, 0.22]}>
                            <boxGeometry args={[0.24, 0.24, 0.16]} />
                            <meshStandardMaterial
                                color="#e76f51"
                                emissive="#9c3d24"
                                emissiveIntensity={0.5}
                                roughness={0.4}
                            />
                        </mesh>
                    </group>
                ))}
            </group>
        );
    }

    if (feature === 'BARRICADE') {
        // Taktický priechod / kamenná brána v línii (hrdinovia prechádzajú stredom)
        return (
            <group position={[0, 0, 0.42]}>
                {[-0.92, 0.92].map((x, idx) => (
                    <group key={idx} position={[x, 0, 0]}>
                        <mesh position={[0, 0, 0.42]} castShadow receiveShadow>
                            <cylinderGeometry args={[0.24, 0.32, 0.85, 6]} />
                            <meshStandardMaterial color="#2d313b" roughness={0.85} metalness={0.18} />
                        </mesh>
                        <mesh position={[0, 0, 0.9]} castShadow>
                            <coneGeometry args={[0.28, 0.32, 6]} />
                            <meshStandardMaterial color="#8a6d3b" roughness={0.55} metalness={0.65} />
                        </mesh>
                    </group>
                ))}
            </group>
        );
    }

    if (feature === 'WATCHTOWER') {
        // Vyvýšený Dota Ward Obelisk na útesoch M2 a M6
        const isRadiantCliff = tier >= 2;
        return (
            <group position={[0, 0, 0.42]}>
                <mesh position={[0, 0, 0.12]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.68, 0.85, 0.24, 6]} />
                    <meshStandardMaterial color="#252830" roughness={0.86} metalness={0.18} />
                </mesh>
                <mesh position={[0, 0, 0.65]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.22, 0.38, 0.95, 6]} />
                    <meshStandardMaterial color="#343844" roughness={0.8} metalness={0.22} />
                </mesh>
                <mesh position={[0, 0, 1.18]} castShadow>
                    <torusGeometry args={[0.32, 0.04, 6, 16]} />
                    <meshStandardMaterial color="#c89b3c" roughness={0.45} metalness={0.78} />
                </mesh>
                <mesh ref={wardRef} position={[0, 0, 1.48]} castShadow>
                    <octahedronGeometry args={[0.18, 0]} />
                    <meshStandardMaterial
                        color={isRadiantCliff ? '#e9c46a' : '#2ec4b6'}
                        emissive="#b5651d"
                        emissiveIntensity={0.55}
                        roughness={0.3}
                        metalness={0.5}
                    />
                </mesh>
            </group>
        );
    }

    return null;
}
