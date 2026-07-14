import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { BiomeEngine, MLTerrainSynthesizer, AlgebraicActionTensor, SpatialGuidanceSystem } from '../../../shared/src/index';
import { PALETTE, BIOME_SPECS, WORLD } from '../design/worldDesign';
import {
    SnowParticles, SwampVapors, DesertHeatParticles,
    BarrensDustDevil, ForestFireflies, VoidCollapseParticles,
} from './world/BiomeParticles';

// Načítanie textúr terénu raz globálne
const textureLoader = new THREE.TextureLoader();

const textures = {
    LUSH_FOREST: textureLoader.load('/textures/lush_forest_tile.png'),
    TOXIC_SWAMP: textureLoader.load('/textures/toxic_swamp_tile.png'),
    GLACIER: textureLoader.load('/textures/glacier_tile.png'),
    DESERT: textureLoader.load('/textures/desert_tile.png'),
    BARRENS: textureLoader.load('/textures/barrens_tile.png'),
    SCORCHED: textureLoader.load('/textures/scorched_tile.png')
};

// Nastavenie opakovaní textúry tak, aby presne sedeli na plochu hexagónu
Object.values(textures).forEach(tex => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(0.3, 0.3);
});

const radius = 2.0;

// Shared cached geometries to prevent memory bloat and GC spikes (Rule 1)
const hexShape = (() => {
    const shape = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + (Math.PI / 6);
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        if (i === 0) shape.moveTo(x, z);
        else shape.lineTo(x, z);
    }
    shape.closePath();
    return shape;
})();

const extrudeSettings = { depth: 0.4, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.05, bevelThickness: 0.05 };
const sharedHexGeometry = new THREE.ExtrudeGeometry(hexShape, extrudeSettings);

const innerHexShape = (() => {
    const innerRadius = 1.75;
    const shape = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + (Math.PI / 6);
        const x = innerRadius * Math.cos(angle);
        const z = innerRadius * Math.sin(angle);
        if (i === 0) shape.moveTo(x, z);
        else shape.lineTo(x, z);
    }
    shape.closePath();
    return shape;
})();
const sharedInnerHexGeometry = new THREE.ExtrudeGeometry(innerHexShape, { depth: 0.05, bevelEnabled: false });

const sharedStalactiteGeometry = new THREE.CylinderGeometry(radius * 0.92, 0.18, 1.0, 6, 1, false, Math.PI / 6);
const sharedConeEdgeGeometry = new THREE.ConeGeometry(radius, 0, 6);

const heroTextures = {
    thread_king_ai: textureLoader.load('/heroes/crystal_hero.png'),
    thread_hacker_root: textureLoader.load('/heroes/toxic_hero.png')
};

function LootChest3D() {
    const meshRef = useRef();

    useFrame((state) => {
        if (!meshRef.current) return;
        const time = state.clock.elapsedTime;
        meshRef.current.rotation.z = time * 0.5;
        meshRef.current.position.z = 0.55 + Math.sin(time * 2.2) * 0.08;
    });

    return (
        <group ref={meshRef} position={[0, 0, 0.45]}>
            {/* Chest Base (Dark carbon metal) */}
            <mesh castShadow>
                <boxGeometry args={[0.45, 0.35, 0.22]} />
                <meshStandardMaterial color="#1a1a24" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Chest Lid (Neon Golden frame) */}
            <mesh position={[0, 0, 0.14]} castShadow>
                <boxGeometry args={[0.47, 0.37, 0.1]} />
                <meshStandardMaterial color="#d4af37" emissive="#d4af37" emissiveIntensity={0.2} metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Glowing Aetheric Core lock */}
            <mesh position={[0, -0.19, 0.05]}>
                <sphereGeometry args={[0.07, 16, 16]} />
                <meshBasicMaterial color={PALETTE.accent.magic} />
            </mesh>
            <pointLight distance={1.8} intensity={0.8} color={PALETTE.accent.magic} />
        </group>
    );
}

function Trap3D({ type }) {
    const meshRef = useRef();

    useFrame((state) => {
        if (!meshRef.current) return;
        const time = state.clock.elapsedTime;
        meshRef.current.rotation.y = Math.sin(time * 1.5) * 0.4;
        meshRef.current.position.z = 0.6 + Math.sin(time * 3.5) * 0.1;
    });

    const color = type === 'ROOT_TRAP' ? '#fb923c' : '#ef4444'; // Orange for root trap, Red for EMP mine

    return (
        <group ref={meshRef} position={[0, 0, 0.46]}>
            {/* Skull Top */}
            <mesh position={[0, 0, 0.15]} castShadow>
                <sphereGeometry args={[0.18, 16, 16]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} roughness={0.2} metalness={0.8} />
            </mesh>
            {/* Skull Jaw */}
            <mesh position={[0, -0.1, -0.02]} castShadow>
                <boxGeometry args={[0.12, 0.1, 0.15]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} roughness={0.2} metalness={0.8} />
            </mesh>
            {/* Left Eye */}
            <mesh position={[-0.06, 0.08, 0.18]}>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshBasicMaterial color="#000000" />
            </mesh>
            {/* Right Eye */}
            <mesh position={[0.06, 0.08, 0.18]}>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshBasicMaterial color="#000000" />
            </mesh>
            <pointLight distance={1.5} intensity={0.8} color={color} />
        </group>
    );
}

function TownBuilding3D() {
    const meshRef = useRef();

    useFrame((state) => {
        if (!meshRef.current) return;
        const time = state.clock.elapsedTime;
        meshRef.current.rotation.z = time * 0.15;
    });

    return (
        <group ref={meshRef} position={[0, 0, 0.45]}>
            {/* Center tower */}
            <mesh position={[0, 0, 0.4]} castShadow>
                <cylinderGeometry args={[0.3, 0.35, 0.8, 6]} />
                <meshStandardMaterial color="#3a3d52" metalness={0.9} roughness={0.3} />
            </mesh>
            {/* Tower roof */}
            <mesh position={[0, 0, 0.95]} castShadow>
                <coneGeometry args={[0.35, 0.4, 6]} />
                <meshStandardMaterial color={PALETTE.accent.magic} emissive="#004444" roughness={0.2} />
            </mesh>
            {/* Surrounding wall pillars */}
            {[-0.5, 0.5].map((x, idx) => (
                <group key={idx} position={[x, 0, 0.2]}>
                    <mesh castShadow>
                        <boxGeometry args={[0.2, 0.2, 0.4]} />
                        <meshStandardMaterial color="#2d2f3f" metalness={0.8} roughness={0.4} />
                    </mesh>
                    <mesh position={[0, 0, 0.25]}>
                        <coneGeometry args={[0.15, 0.2, 4]} />
                        <meshBasicMaterial color={PALETTE.accent.magic} />
                    </mesh>
                </group>
            ))}
            {/* Glowing neon ring */}
            <mesh position={[0, 0, 0.8]} rotation={[0, 0, 0]}>
                <torusGeometry args={[0.45, 0.03, 8, 24]} />
                <meshBasicMaterial color={PALETTE.accent.magic} />
            </mesh>
            <pointLight distance={3} intensity={0.8} color={PALETTE.accent.magic} position={[0, 0, 1.2]} />
        </group>
    );
}

function RepairKit3D() {
    const meshRef = useRef();

    useFrame((state) => {
        if (!meshRef.current) return;
        const time = state.clock.elapsedTime;
        meshRef.current.rotation.y = time * 1.5;
        meshRef.current.position.z = 0.6 + Math.sin(time * 3.0) * 0.08;
    });

    return (
        <group ref={meshRef} position={[0, 0, 0.4]}>
            {/* Hexagonal capsule */}
            <mesh castShadow>
                <cylinderGeometry args={[0.12, 0.12, 0.4, 6]} />
                <meshStandardMaterial color="#065f46" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Glowing neon green bands */}
            {[-0.12, 0.12].map((zVal, idx) => (
                <mesh key={idx} position={[0, zVal, 0]}>
                    <torusGeometry args={[0.13, 0.02, 6, 12]} />
                    <meshBasicMaterial color="#39ff14" />
                </mesh>
            ))}
            {/* Caps */}
            {[-0.2, 0.2].map((zVal, idx) => (
                <mesh key={idx} position={[0, zVal, 0]}>
                    <cylinderGeometry args={[0.12, 0.12, 0.02, 6]} />
                    <meshStandardMaterial color="#34d399" metalness={0.8} />
                </mesh>
            ))}
            <pointLight distance={1.5} intensity={1.0} color="#39ff14" />
        </group>
    );
}

function SurgeNode3D() {
    const coreRef = useRef();
    const ringRef = useRef();

    useFrame((state) => {
        const time = state.clock.elapsedTime;
        if (coreRef.current) {
            coreRef.current.rotation.x = time * 2.0;
            coreRef.current.rotation.y = time * 1.5;
            coreRef.current.position.z = 0.6 + Math.sin(time * 4.0) * 0.06;
        }
        if (ringRef.current) {
            ringRef.current.rotation.z = -time * 3.0;
            ringRef.current.position.z = 0.6 + Math.sin(time * 4.0) * 0.06;
        }
    });

    return (
        <group position={[0, 0, 0.4]}>
            {/* Glowing electrical sphere core */}
            <mesh ref={coreRef}>
                <sphereGeometry args={[0.14, 16, 16]} />
                <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={1.8} />
            </mesh>
            {/* Surrounding electric ring */}
            <mesh ref={ringRef} rotation={[Math.PI / 3, Math.PI / 6, 0]}>
                <torusGeometry args={[0.22, 0.015, 6, 24]} />
                <meshBasicMaterial color="#00ffcc" />
            </mesh>
            <pointLight distance={2.0} intensity={1.2} color="#00ffcc" />
        </group>
    );
}

function VoidRift3D() {
    const meshRef = useRef();

    useFrame((state) => {
        if (!meshRef.current) return;
        const time = state.clock.elapsedTime;
        meshRef.current.rotation.z = -time * 0.8;
        meshRef.current.scale.setScalar(1.0 + Math.sin(time * 5.0) * 0.1);
    });

    return (
        <group ref={meshRef} position={[0, 0, 0.9]}>
            {/* Outer dark matter sphere */}
            <mesh>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial color="#1a0826" emissive="#a855f7" emissiveIntensity={2.5} roughness={0.1} />
            </mesh>
            {/* Gravitational ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.3, 0.02, 6, 24]} />
                <meshBasicMaterial color="#c084fc" />
            </mesh>
            <pointLight distance={2.2} intensity={1.4} color="#a855f7" />
        </group>
    );
}

function FactionFlag3D({ faction }) {
    const flagRef = useRef();
    const flagColor = useMemo(() => {
        if (faction === 'crystal') return '#00ffff';
        if (faction === 'toxic') return '#39ff14';
        if (faction === 'void') return '#a855f7';
        return '#888888'; // Neutral
    }, [faction]);

    useFrame((state) => {
        const time = state.clock.elapsedTime;
        if (flagRef.current) {
            flagRef.current.rotation.y = Math.sin(time * 3.5) * 0.12;
        }
    });

    return (
        <group position={[0, 0, 0]}>
            {/* Flagpole (Iron/Carbon) */}
            <mesh castShadow position={[0, 0.9, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 1.8, 8]} />
                <meshStandardMaterial color="#444455" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* Flag Banner */}
            <group ref={flagRef} position={[0, 1.4, 0]}>
                <mesh castShadow position={[0.3, 0, 0]}>
                    <boxGeometry args={[0.6, 0.35, 0.02]} />
                    <meshStandardMaterial color={flagColor} roughness={0.8} />
                </mesh>
                {/* Floating Faction Sigil Ornament */}
                <mesh position={[0.3, 0, 0.02]} rotation={[0, 0, Math.PI / 4]}>
                    {faction === 'crystal' ? (
                        <octahedronGeometry args={[0.08]} />
                    ) : faction === 'toxic' ? (
                        <boxGeometry args={[0.08, 0.08, 0.08]} />
                    ) : (
                        <sphereGeometry args={[0.07, 8, 8]} />
                    )}
                    <meshBasicMaterial color="#ffffff" />
                </mesh>
            </group>

            {/* Glowing flag tip */}
            <mesh position={[0, 1.82, 0]}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshBasicMaterial color={flagColor} />
            </mesh>
        </group>
    );
}

function SpellFlashBeam3D({ weatherOverride }) {
    const meshRef = useRef();

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        meshRef.current.scale.x += delta * 1.8;
        meshRef.current.scale.y += delta * 1.8;
        meshRef.current.position.z += delta * 2.2;
        if (meshRef.current.material) {
            meshRef.current.material.opacity = Math.max(0, meshRef.current.material.opacity - delta * 2.2);
        }
    });

    const color = useMemo(() => {
        if (weatherOverride === 'TOXIC_HAZE') return '#9fdb3b';
        if (weatherOverride === 'VOID_ECLIPSE') return '#a855f7';
        if (weatherOverride === 'AURORA_STORM') return '#00ffff';
        return '#2dd3f1'; // PALETTE.accent.magic
    }, [weatherOverride]);

    return (
        <mesh ref={meshRef} position={[0, 0, 0.45]}>
            <cylinderGeometry args={[1.8, 1.8, 0.4, 6, 1, true]} />
            <meshBasicMaterial 
                color={color} 
                transparent 
                opacity={0.9} 
                side={THREE.DoubleSide} 
                depthWrite={false}
            />
        </mesh>
    );
}

export default function HexagonNode3D({ node, isHovered, isSelected, isTargetable = false, targetableType = null, onHover, onClick, onDoubleClick = () => {}, occupyingThread, threads = [], isCollapsing = false, entropy = 0.4, hasChest = false, hasTrap = null, terrainTelemetry = null, weatherOverride = null, isSurgeActive = false, isScorched = false, distanceToPlayer = null, maxRange = null, selectedCard = null, realityPhase = 'STANDARD', matrixSource = null, hasOpportunity = null, hasChestOnly = false }) {
    const tileRef = useRef();
    const materialRef = useRef();
    const innerMaterialRef = useRef();
    const [waveTrigger, setWaveTrigger] = React.useState({ time: 0, originMeta: null, originHex: null });

    const activeOccupyingThread = useMemo(() => {
        return threads.find(t => t.position && t.position.meta === node.macroIndex && t.position.hex === node.subIndex);
    }, [threads, node.macroIndex, node.subIndex]);

    // Generovanie 3D tvaru hexagónu (ExtrudeGeometry pre 3D podstavec)
    const hexShape = useMemo(() => {
        const shape = new THREE.Shape();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i + (Math.PI / 6); // Otočenie pre flat-to-top po rotácii
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);
            if (i === 0) shape.moveTo(x, z);
            else shape.lineTo(x, z);
        }
        shape.closePath();
        return shape;
    }, []);

    // Získanie detailov o bióme pre danú pozíciu z BiomeEngine
    const biomeInfo = useMemo(() => {
        return BiomeEngine.getBiomeForHex(node.macroIndex, node.subIndex);
    }, [node.macroIndex, node.subIndex]);

    // Vyhodnotenie kombinatorických vlastností cez ML Terrain Synthesizer
    const mlInfo = useMemo(() => {
        return MLTerrainSynthesizer.synthesizeBlock(node.macroIndex, node.subIndex);
    }, [node.macroIndex, node.subIndex]);

    const predictedOutcome = useMemo(() => {
        if (!selectedCard) return null;
        const mockSource = { level: 1, luck: 0.5, id: 'thread_king_ai' };
        return AlgebraicActionTensor.evaluate(mockSource, selectedCard.id, {
            biome: biomeInfo.biome,
            friction: node.friction || mlInfo.friction || 0.5,
            hazardIndex: node.hazardIndex || mlInfo.hazardIndex || 0.1
        });
    }, [selectedCard, biomeInfo.biome, node.friction, node.hazardIndex, mlInfo]);

    const handleBeforeCompile = React.useCallback((shader) => {
        shader.uniforms.uGravityPulse = { value: 0.0 };
        shader.vertexShader = `
            uniform float uGravityPulse;
            ${shader.vertexShader}
        `.replace(
            '#include <begin_vertex>',
            `
            #include <begin_vertex>
            if (uGravityPulse > 0.05) {
                vec4 worldPos = modelMatrix * vec4(position, 1.0);
                float distToCenter = length(worldPos.xz);
                float sinkFactor = 1.0 - smoothstep(0.0, 15.0, distToCenter);
                transformed.z -= sinkFactor * 1.5 * uGravityPulse;
            }
            `
        );
        if (materialRef.current) {
            materialRef.current.userData.shader = shader;
        }
    }, []);

    const realityConfig = useMemo(() => {
        const phase = node.realityPhase || realityPhase || 'STANDARD';
        if (phase === 'SURGE') {
            return {
                roughness: 0.25,
                metalness: 0.6,
                color: new THREE.Color('#00ffcc'),
                emissive: new THREE.Color('#00ffcc').multiplyScalar(2.0)
            };
        }
        if (phase === 'VOID') {
            return {
                roughness: 0.15,
                metalness: 0.8,
                color: new THREE.Color('#1a0826'),
                emissive: new THREE.Color('#9900ff').multiplyScalar(1.5)
            };
        }
        if (phase === 'GLITCH') {
            const seed = Math.sin(node.macroIndex * 7.1 + node.subIndex * 13.3) * 1000;
            const r = Math.abs(Math.sin(seed));
            return {
                roughness: 0.9,
                metalness: 0.1,
                color: r > 0.75 ? new THREE.Color('#ff003c') : r > 0.45 ? new THREE.Color('#00f0aa') : new THREE.Color('#00aaff'),
                emissive: new THREE.Color('#ff003c').multiplyScalar(r * 2.0)
            };
        }
        if (phase === 'GRAVITY_WELL') {
            return {
                roughness: 0.35,
                metalness: 0.9,
                color: new THREE.Color('#4b0082'), // Indigo
                emissive: new THREE.Color('#8a2be2').multiplyScalar(2.2) // BlueViolet
            };
        }
        return null;
    }, [node.realityPhase, realityPhase, node.macroIndex, node.subIndex]);

    const matrixInfo = useMemo(() => {
        if (!matrixSource) return null;
        try {
            const startPos = SpatialGuidanceSystem.resolveCartesian(matrixSource.meta, matrixSource.hex);
            const nodePos = SpatialGuidanceSystem.resolveCartesian(node.macroIndex, node.subIndex);
            const distance = SpatialGuidanceSystem.calculateDistance(startPos, nodePos);
            
            const friction = node.friction || mlInfo.friction || 0.5;
            const elevationFactor = isSurgeActive ? 1.4 : 1.0;
            
            let baseCost = distance * 10 * friction * elevationFactor;
            
            const phase = node.realityPhase || realityPhase || 'STANDARD';
            if (phase === 'VOID') {
                baseCost *= 1.35;
            } else if (phase === 'GLITCH') {
                baseCost *= (1.0 + Math.sin(node.macroIndex + node.subIndex) * 0.25);
            } else if (phase === 'GRAVITY_WELL') {
                const distStart = Math.sqrt(startPos.x * startPos.x + startPos.z * startPos.z);
                const distTarget = Math.sqrt(nodePos.x * nodePos.x + nodePos.z * nodePos.z);
                if (distTarget < distStart) {
                    baseCost *= 0.5;
                } else {
                    baseCost *= (2.5 * friction);
                }
            }
            
            const dx = nodePos.x - startPos.x;
            const dz = nodePos.z - startPos.z;
            
            return {
                distance,
                cost: baseCost,
                dx,
                dz
            };
        } catch (e) {
            return null;
        }
    }, [matrixSource, node.macroIndex, node.subIndex, node.friction, mlInfo.friction, isSurgeActive, node.realityPhase, realityPhase]);

    const activeTelemetry = useMemo(() => {
        if (!terrainTelemetry || !terrainTelemetry.textures) return null;
        return terrainTelemetry.textures.find(t => t.chunkId === node.macroIndex && t.blockId === node.subIndex) || null;
    }, [terrainTelemetry, node.macroIndex, node.subIndex]);

    // Nastavenia pre 3D hrúbku map-tile-u
    const extrudeSettings = { depth: 0.4, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.05, bevelThickness: 0.05 };

    const edgeColor = useMemo(() => {
        if (isSelected || isHovered) return PALETTE.accent.magic;
        
        const phase = node.realityPhase || realityPhase || 'STANDARD';
        if (phase === 'GRAVITY_WELL' && matrixSource) {
            try {
                const startPos = SpatialGuidanceSystem.resolveCartesian(matrixSource.meta, matrixSource.hex);
                const nodePos = SpatialGuidanceSystem.resolveCartesian(node.macroIndex, node.subIndex);
                const distStart = Math.sqrt(startPos.x * startPos.x + startPos.z * startPos.z);
                const distTarget = Math.sqrt(nodePos.x * nodePos.x + nodePos.z * nodePos.z);
                if (distTarget >= distStart) {
                    return '#8a2be2'; // Purple/Violet pulse for amplified cost
                }
            } catch (e) {}
        }

        if (matrixInfo) {
            if (matrixInfo.cost < 20) return '#00ffcc'; // Teal for cheap
            if (matrixInfo.cost < 45) return '#fb923c'; // Orange for medium
            return '#ec4899'; // Pink/Magenta for expensive
        }
        if (isTargetable) {
            if (targetableType === 'move') return '#22c55e'; // Glowing green for movement reach
            if (targetableType === 'attack') return '#ef4444'; // Glowing red for attack reach
            if (targetableType === 'spell') return '#8b5cf6'; // Glowing violet/purple for spell reach
            return '#00ffcc'; // Glowing active target fallback
        }
        return PALETTE.rock.undersideDeep;
    }, [isSelected, isHovered, isTargetable, targetableType, matrixInfo]);

    const [flash, setFlash] = React.useState(false);

    React.useEffect(() => {
        const handleEffect = (e) => {
            const { targetHex, sourceHex } = e.detail;
            const origin = sourceHex || targetHex;
            if (origin) {
                setWaveTrigger({
                    time: Date.now(),
                    originMeta: origin.macroIndex !== undefined ? origin.macroIndex : origin.meta,
                    originHex: origin.subIndex !== undefined ? origin.subIndex : origin.hex
                });
            }
            if (targetHex && targetHex.meta === node.macroIndex && targetHex.hex === node.subIndex) {
                setFlash(true);
                const timer = setTimeout(() => setFlash(false), 500);
                return () => clearTimeout(timer);
            }
        };

        window.addEventListener('card_played_effect', handleEffect);
        return () => {
            window.removeEventListener('card_played_effect', handleEffect);
        };
    }, [node.macroIndex, node.subIndex]);

    const spawnDelay = useMemo(() => {
        return (node.macroIndex * 7 + node.subIndex) * 0.05;
    }, [node.macroIndex, node.subIndex]);

    useFrame((state, delta) => {
        if (materialRef.current && materialRef.current.userData && materialRef.current.userData.shader) {
            const phase = node.realityPhase || realityPhase || 'STANDARD';
            materialRef.current.userData.shader.uniforms.uGravityPulse.value = phase === 'GRAVITY_WELL' ? 1.0 : 0.0;
        }

        if (!tileRef.current) return;
        const time = state.clock.elapsedTime;

        let targetLift = 0;
        const phase = node.realityPhase || realityPhase || 'STANDARD';
        if (isCollapsing) {
            targetLift = 0;
        } else if (isHovered || isSelected) {
            targetLift = 0.25;
        } else if (isSurgeActive || phase === 'SURGE') {
            // Smoothly elevate with dynamic oscillation wave based on time
            targetLift = 0.85 + Math.sin(time * 12.0) * 0.20;
        } else if (activeOccupyingThread) {
            // Geometric deformation of terrain when occupied by NPC or damaged entity
            if (activeOccupyingThread.type === 'NPC') {
                targetLift = -0.35;
            } else if (activeOccupyingThread.health < (activeOccupyingThread.maxHealth || 15)) {
                const lossRatio = 1.0 - (activeOccupyingThread.health / (activeOccupyingThread.maxHealth || 15));
                targetLift = -0.60 * lossRatio;
            }
        } else if (phase === 'GLITCH') {
            const seed = Math.sin(node.macroIndex * 7.1 + node.subIndex * 13.3) * 1000;
            const r = Math.sin(time * 5.0 + seed);
            if (r > 0.85) {
                targetLift = Math.abs(r) * 0.45;
            }
        }

        // Apply topological radial ripple wave from card play location
        let rippleHeight = 0;
        if (waveTrigger.time > 0) {
            const elapsedSec = (Date.now() - waveTrigger.time) / 1000;
            try {
                const startPos = SpatialGuidanceSystem.resolveCartesian(waveTrigger.originMeta, waveTrigger.originHex);
                const nodePos = SpatialGuidanceSystem.resolveCartesian(node.macroIndex, node.subIndex);
                const dist = SpatialGuidanceSystem.calculateDistance(startPos, nodePos);
                
                const delay = dist * 0.08;
                const relativeTime = elapsedSec - delay;
                if (relativeTime > 0 && relativeTime < 0.65) {
                    rippleHeight = Math.sin(relativeTime * Math.PI / 0.65) * 0.55;
                }
            } catch (e) {}
        }
        targetLift += rippleHeight;

        tileRef.current.position.z = THREE.MathUtils.lerp(tileRef.current.position.z, targetLift, 0.15);

        if (isCollapsing) {
            tileRef.current.position.y = THREE.MathUtils.lerp(tileRef.current.position.y, -4.5, 0.04);
        } else {
            if (time < spawnDelay) {
                tileRef.current.position.y = -5;
            } else {
                const entryProgress = Math.min(1.0, (time - spawnDelay) * 2.0);
                const baseHeight = THREE.MathUtils.lerp(-5, 0, entryProgress);
                const waveFreq = 2.0 + entropy * 1.5;
                const waveAmp = 0.02 + entropy * 0.06;
                const idleOffset = Math.sin(time * waveFreq + (node.position[0] + node.position[2]) * 0.45) * waveAmp;
                tileRef.current.position.y = baseHeight + idleOffset;
            }
        }

        // Mutate material properties in-place directly on frame tick to eliminate GC allocations
        if (materialRef.current) {
            materialRef.current.color.copy(materialProps.color);
            materialRef.current.roughness = materialProps.roughness;
            materialRef.current.metalness = materialProps.metalness;
            materialRef.current.emissive.copy(materialProps.emissive);
            materialRef.current.map = materialProps.map;
            materialRef.current.needsUpdate = true;
        }

        if (innerMaterialRef.current) {
            innerMaterialRef.current.color.set(isSelected ? "#00ffff" : isHovered ? "#3b82f6" : "#0c0f1d");
            innerMaterialRef.current.emissive.set(isSelected ? "#00ffff" : isHovered ? "#22d3ee" : "#000000");
            innerMaterialRef.current.emissiveIntensity = isSelected ? 1.5 : isHovered ? 0.8 : 0.0;
            innerMaterialRef.current.needsUpdate = true;
        }
    });

    // Výpočet dynamického ligtingu na základe ML Light Emission a Biómu
    const emissiveColor = useMemo(() => {
        if (isCollapsing) return new THREE.Color(PALETTE.rock.undersideDeep);
        if (isScorched) return new THREE.Color('#3a0e10').multiplyScalar(0.4); // Red hot ember glow
        if (flash) return new THREE.Color(PALETTE.portal.core).multiplyScalar(3.0);
        if (isHovered) return new THREE.Color(PALETTE.accent.magic).multiplyScalar(0.12);
        if (mlInfo.lightEmission > 0.4) {
            if (biomeInfo.biome === 'TOXIC_SWAMP') {
                return new THREE.Color(BIOME_SPECS.TOXIC_SWAMP.accent).multiplyScalar(mlInfo.lightEmission * 0.15);
            }
            if (biomeInfo.biome === 'GLACIER') {
                return new THREE.Color(BIOME_SPECS.GLACIER.accent).multiplyScalar(mlInfo.lightEmission * 0.10);
            }
        }
        return new THREE.Color('#000000');
    }, [flash, isHovered, mlInfo.lightEmission, biomeInfo.biome, isCollapsing, isScorched]);

    // Textúra sa maliarsky tónuje k `base` farbe biómu
    const baseTint = useMemo(() => {
        if (isCollapsing) return new THREE.Color(PALETTE.rock.underside);
        if (isScorched) return new THREE.Color('#16141a'); // Burnt charcoal tint
        if (isSelected) return new THREE.Color(PALETTE.accent.magic);
        if (isHovered) {
            return new THREE.Color('#ffffff').lerp(new THREE.Color(PALETTE.accent.magic), 0.25);
        }
        const spec = BIOME_SPECS[biomeInfo.biome];
        const base = new THREE.Color('#ffffff').lerp(new THREE.Color(spec.base), 0.45);
        if (mlInfo.colorSaturation < 0.5) {
            base.lerp(new THREE.Color('#888888'), 0.5 - mlInfo.colorSaturation);
        }
        return base;
    }, [isSelected, isHovered, mlInfo.colorSaturation, biomeInfo.biome, isCollapsing, isScorched]);

    const materialProps = useMemo(() => {
        let roughnessMultiplier = 1.0;
        let metalnessOverride = WORLD.tileMetalness;
        let tintModifier = new THREE.Color('#ffffff');
        let emissiveIntensity = 1.0;

        if (weatherOverride === 'TOXIC_HAZE') {
            roughnessMultiplier = 0.45; // slimy swamp surfaces
            metalnessOverride = 0.2;
            tintModifier.lerp(new THREE.Color('#9fdb3b'), 0.2); // green haze overlay
        } else if (weatherOverride === 'VOID_ECLIPSE') {
            roughnessMultiplier = 0.3; // glassy void crystal
            metalnessOverride = 0.7; // dark metallic sheen
            tintModifier.lerp(new THREE.Color('#2d0a4e'), 0.45); // dark violet shadow
        } else if (weatherOverride === 'AURORA_STORM') {
            roughnessMultiplier = 0.7;
            metalnessOverride = 0.4;
            emissiveIntensity = 2.0; // amplify emissions
        }

        const defaultProps = {
            map: textures[biomeInfo.biome] || null,
            color: baseTint.clone().multiply(tintModifier),
            roughness: WORLD.tileRoughness * roughnessMultiplier,
            metalness: metalnessOverride,
            emissive: emissiveColor.clone().multiplyScalar(emissiveIntensity),
        };

        if (isScorched) {
            defaultProps.map = textures.SCORCHED;
            defaultProps.roughness = 0.9;
            defaultProps.metalness = 0.1;
            defaultProps.emissive = new THREE.Color('#ef4444').multiplyScalar(1.5);
        }

        if (isScorched) return defaultProps;

        const phase = node.realityPhase || realityPhase || 'STANDARD';
        if (phase !== 'STANDARD' && realityConfig) {
            return {
                ...defaultProps,
                roughness: realityConfig.roughness,
                metalness: realityConfig.metalness,
                color: realityConfig.color,
                emissive: realityConfig.emissive
            };
        }

        if (!activeTelemetry) return defaultProps;

        const pattern = activeTelemetry.texturePattern;
        const vibrancy = activeTelemetry.colorVibrancy;

        if (pattern === 'glitch_grid_noise') {
            return {
                ...defaultProps,
                roughness: 0.5 * roughnessMultiplier,
                color: baseTint.clone().multiply(tintModifier).lerp(new THREE.Color(PALETTE.accent.magic), 0.2 * vibrancy),
            };
        }
        if (pattern === 'crystal_vein_specular') {
            return {
                ...defaultProps,
                roughness: 0.4 * roughnessMultiplier,
                color: baseTint.clone().multiply(tintModifier).lerp(new THREE.Color(BIOME_SPECS.GLACIER.accent), 0.25 * vibrancy),
            };
        }
        if (pattern === 'moss_dense_bump') {
            return {
                ...defaultProps,
                roughness: 1.0 * roughnessMultiplier,
                color: baseTint.clone().multiply(tintModifier).lerp(new THREE.Color(BIOME_SPECS.LUSH_FOREST.base), 0.35 * vibrancy),
            };
        }
        if (pattern === 'void_particle_noise') {
            return {
                ...defaultProps,
                color: baseTint.clone().multiply(tintModifier).lerp(new THREE.Color(PALETTE.rock.undersideDeep), 0.35 * vibrancy),
            };
        }

        return defaultProps;
    }, [activeTelemetry, baseTint, emissiveColor, biomeInfo.biome, weatherOverride]);

    // Kamenná podsada: okrajové hexy visia hlbšie — dojem odlomeného ostrova.
    const undersideDepth = useMemo(() => {
        const dist = Math.hypot(node.position[0], node.position[2]) / 14; // 14 ≈ polomer arény
        const jitter = ((node.macroIndex * 7 + node.subIndex) % 5) * 0.15;
        return 1.6 + dist * 2.2 + jitter;
    }, [node.position, node.macroIndex, node.subIndex]);

    return (
        <group
            position={node.position}
            rotation={[-Math.PI / 2, 0, 0]} // Otočenie v trojrozmernom priestore (X, Z je plocha)
            onPointerOver={(e) => { e.stopPropagation(); onHover(node); }}
            onPointerOut={(e) => { e.stopPropagation(); onHover(null); }}
            onClick={(e) => { e.stopPropagation(); onClick(node); }}
            onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(node); }}
        >
            {/* Dlaždica + hrana + (Task 6: podsada) — animovaná ako celok */}
            <group ref={tileRef}>
                {/* Outer Extruded Base */}
                <mesh geometry={sharedHexGeometry} castShadow receiveShadow frustumCulled={false}>
                    <meshStandardMaterial ref={materialRef} onBeforeCompile={handleBeforeCompile} />
                </mesh>

                {/* Inner Tech-Plate Overlay (Advanced 3D Geometry) */}
                <mesh geometry={sharedInnerHexGeometry} position={[0, 0, 0.402]} castShadow receiveShadow>
                    <meshStandardMaterial 
                        ref={innerMaterialRef}
                        color="#0c0f1d"
                        roughness={0.15}
                        metalness={0.85} 
                    />
                </mesh>

                <lineSegments position={[0, 0, 0.41]}>
                    <edgesGeometry args={[sharedConeEdgeGeometry]} />
                    <lineBasicMaterial color={edgeColor} transparent opacity={isSelected ? 1.0 : isHovered ? 0.9 : isTargetable ? 0.8 : 0.45} />
                </lineSegments>

                {/* Spell Casting VFX projected on the Hexagon */}
                {flash && <SpellFlashBeam3D weatherOverride={weatherOverride} />}

                {/* Skalná podsada — 6-boký zužujúci sa "stalaktit" pod dlaždicou (Scaled dynamically on shared geometry) */}
                <mesh 
                    geometry={sharedStalactiteGeometry}
                    position={[0, 0, -undersideDepth / 2 + 0.02]} 
                    rotation={[Math.PI / 2, 0, 0]}
                    scale={[1.0, undersideDepth, 1.0]}
                    castShadow
                >
                    <meshStandardMaterial
                        color={PALETTE.rock.underside}
                        roughness={1}
                        metalness={0}
                        flatShading
                    />
                </mesh>

                {/* Relocated spawned objects to move together with tile height deformation */}
                {hasChestOnly && !isCollapsing && <LootChest3D />}
                {hasOpportunity === 'REPAIR_KIT' && !isCollapsing && <RepairKit3D />}
                {hasOpportunity === 'SURGE_NODE' && !isCollapsing && <SurgeNode3D />}
                {hasOpportunity === 'VOID_RIFT' && !isCollapsing && <VoidRift3D />}
                
                {node.isTown && !isCollapsing && <TownBuilding3D />}
                {hasTrap && !isCollapsing && <Trap3D type={hasTrap} />}

                {/* Render Faction Base Flags at starting points */}
                {!isCollapsing && node.macroIndex === 0 && node.subIndex === 0 && (
                    <group position={[-0.65, 0.45, 0.41]}>
                        <FactionFlag3D faction="crystal" />
                    </group>
                )}
                {!isCollapsing && node.macroIndex === 8 && node.subIndex === 6 && (
                    <group position={[-0.65, 0.45, 0.41]}>
                        <FactionFlag3D faction="toxic" />
                    </group>
                )}
                {!isCollapsing && node.macroIndex === 5 && node.subIndex === 3 && (
                    <group position={[-0.65, 0.45, 0.41]}>
                        <FactionFlag3D faction="void" />
                    </group>
                )}

                {/* Render dynamic territorial flags next to all towns */}
                {node.isTown && !isCollapsing && (
                    <group position={[0.65, -0.45, 0.41]}>
                        <FactionFlag3D 
                            faction={
                                activeOccupyingThread?.id.includes('king') ? 'crystal' :
                                activeOccupyingThread?.id.includes('hacker') ? 'toxic' :
                                activeOccupyingThread?.id.includes('void') ? 'void' : 'neutral'
                            } 
                        />
                    </group>
                )}
            </group>

            {/* Časticové efekty biómov */}
            {biomeInfo.biome === 'GLACIER' && !isCollapsing && <SnowParticles />}
            {biomeInfo.biome === 'TOXIC_SWAMP' && !isCollapsing && <SwampVapors />}
            {biomeInfo.biome === 'DESERT' && !isCollapsing && <DesertHeatParticles />}
            {biomeInfo.biome === 'BARRENS' && !isCollapsing && <BarrensDustDevil />}
            {biomeInfo.biome === 'LUSH_FOREST' && !isCollapsing && entropy > 0.5 && <ForestFireflies />}
            {isCollapsing && <VoidCollapseParticles />}

            {/* ANCHOR: A_OVERHEAD - Statusový hologram visiaci nad vybraným políčkom */}
            {isSelected && (
                <mesh position={[0, 0, 2.4]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.25, 0.04, 8, 32]} />
                    <meshBasicMaterial color={PALETTE.accent.magic} wireframe />
                </mesh>
            )}

            {isTargetable && isHovered && distanceToPlayer !== null && maxRange !== null && (
                <Html distanceFactor={12} position={[0, 0, 1.8]} center>
                    <div className="glass-panel-heavy p-2 text-xs text-[#e0e7ff] border border-[#00ffcc] rounded shadow-2xl pointer-events-none select-none backdrop-blur-md" style={{ minWidth: '170px', fontFamily: "'Rajdhani', sans-serif" }}>
                        <div className="font-bold text-[#00ffcc] uppercase tracking-wider mb-1 text-[11px]" style={{ fontFamily: "'Oxanium', sans-serif" }}>
                            Target Predictor
                        </div>
                        <div className="flex justify-between mb-0.5">
                            <span>Sector Distance:</span>
                            <span className="font-mono text-cyan-400 font-bold">{distanceToPlayer} / {maxRange}</span>
                        </div>
                        <div className="flex justify-between mb-0.5 border-b border-[#1f2937] pb-1">
                            <span>Steps to Limit:</span>
                            <span className="font-mono text-yellow-400 font-bold">{maxRange - distanceToPlayer} steps</span>
                        </div>
                        {predictedOutcome && (
                            <div className="mt-1 flex flex-col gap-0.5">
                                <div className="flex justify-between">
                                    <span className="opacity-75">Base Power:</span>
                                    <span className="font-mono text-cyan-300 font-bold">{selectedCard.damage || 0}V</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="opacity-75">Est. Damage:</span>
                                    <span className="font-mono text-red-400 font-bold">{predictedOutcome.damageApplied} HP</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="opacity-75">Success Rate:</span>
                                    <span className="font-mono text-green-400 font-bold">{predictedOutcome.successProbability.toFixed(0)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="opacity-75">Energy Load:</span>
                                    <span className="font-mono text-yellow-500 font-bold">{Math.round(predictedOutcome.energyDelta)}W</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="opacity-75">Displacement:</span>
                                    <span className="font-mono text-purple-400 font-bold">{predictedOutcome.displacementDistance}m</span>
                                </div>
                            </div>
                        )}
                    </div>
                </Html>
            )}

            {matrixInfo && matrixInfo.distance > 0.1 && matrixInfo.distance < 18 && (
                <Html distanceFactor={14} position={[0, 0, 1.2]} center>
                    <div className="pointer-events-none select-none text-[7px] text-white bg-slate-950/90 px-1 py-0.5 rounded border border-cyan-500/30 font-mono flex flex-col items-center shadow-lg backdrop-blur-sm">
                        <span className="text-[6px] text-cyan-400 font-bold">ΔX:{matrixInfo.dx > 0 ? `+${matrixInfo.dx.toFixed(1)}` : matrixInfo.dx.toFixed(1)}</span>
                        <span className={matrixInfo.cost < 20 ? 'text-emerald-400 font-bold' : matrixInfo.cost < 45 ? 'text-amber-400 font-bold' : 'text-rose-500 font-bold'}>
                            {Math.round(matrixInfo.cost)}W
                        </span>
                    </div>
                </Html>
            )}

            {/* Floating Hexadecimal Coordinate tag */}
            <Html distanceFactor={16} position={[0, 0, 1.65]} center>
                <div 
                    className="pointer-events-none select-none text-[6px] text-[#00ffff] bg-slate-950/90 px-1.5 py-0.5 rounded border border-[#00ffff]/40 font-mono shadow-[0_0_8px_rgba(0,255,255,0.2)] tracking-wider"
                >
                    {`0x${node.macroIndex.toString(16).toUpperCase()}${node.subIndex.toString(16).toUpperCase()}`}
                </div>
            </Html>
        </group>

    );
}
