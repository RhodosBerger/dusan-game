import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BiomeEngine, MLTerrainSynthesizer } from '../../../shared/src/index';
import { PALETTE, BIOME_SPECS, WORLD } from '../design/worldDesign';

function SnowParticles() {
    const pointsRef = useRef();
    const count = 12;
    
    const [positions, speeds] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const spd = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 1.4;
            pos[i * 3] = r * Math.cos(angle);
            pos[i * 3 + 1] = r * Math.sin(angle);
            pos[i * 3 + 2] = Math.random() * 3.5;
            spd[i] = 0.015 + Math.random() * 0.02;
        }
        return [pos, spd];
    }, []);

    useFrame(() => {
        if (!pointsRef.current) return;
        const posAttr = pointsRef.current.geometry.attributes.position;
        for (let i = 0; i < count; i++) {
            let z = posAttr.getZ(i);
            z -= speeds[i];
            if (z < 0.2) z = 3.5;
            posAttr.setZ(i, z);
        }
        posAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef} position={[0, 0, 0]}>
            <bufferGeometry>
                <bufferAttribute 
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial 
                color="#ffffff" 
                size={0.06} 
                transparent 
                opacity={0.8}
            />
        </points>
    );
}

function SwampVapors() {
    const pointsRef = useRef();
    const count = 8;
    
    const [positions, speeds] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const spd = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 1.1;
            pos[i * 3] = r * Math.cos(angle);
            pos[i * 3 + 1] = r * Math.sin(angle);
            pos[i * 3 + 2] = Math.random() * 2.0;
            spd[i] = 0.008 + Math.random() * 0.012;
        }
        return [pos, spd];
    }, []);

    useFrame(() => {
        if (!pointsRef.current) return;
        const posAttr = pointsRef.current.geometry.attributes.position;
        for (let i = 0; i < count; i++) {
            let z = posAttr.getZ(i);
            z += speeds[i];
            if (z > 2.0) z = 0.2;
            posAttr.setZ(i, z);
        }
        posAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef} position={[0, 0, 0]}>
            <bufferGeometry>
                <bufferAttribute 
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial 
                color="#c77dff" 
                size={0.1} 
                transparent 
                opacity={0.6}
            />
        </points>
    );
}

function DesertHeatParticles() {
    const pointsRef = useRef();
    const count = 10;
    
    const [positions, speeds] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const spd = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 1.1;
            pos[i * 3] = r * Math.cos(angle);
            pos[i * 3 + 1] = r * Math.sin(angle);
            pos[i * 3 + 2] = Math.random() * 2.5;
            spd[i] = 0.012 + Math.random() * 0.018;
        }
        return [pos, spd];
    }, []);

    useFrame(() => {
        if (!pointsRef.current) return;
        const posAttr = pointsRef.current.geometry.attributes.position;
        for (let i = 0; i < count; i++) {
            let z = posAttr.getZ(i);
            z += speeds[i];
            if (z > 2.5) z = 0.1;
            posAttr.setZ(i, z);
        }
        posAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef} position={[0, 0, 0]}>
            <bufferGeometry>
                <bufferAttribute 
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial 
                color="#ffaa44" 
                size={0.08} 
                transparent 
                opacity={0.7}
            />
        </points>
    );
}

function BarrensDustDevil() {
    const pointsRef = useRef();
    const count = 12;
    const angles = useMemo(() => new Float32Array(count).map(() => Math.random() * Math.PI * 2), []);
    const radii = useMemo(() => new Float32Array(count).map(() => 0.1 + Math.random() * 0.7), []);
    const heights = useMemo(() => new Float32Array(count).map(() => Math.random() * 2.5), []);
    
    const initialPositions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = radii[i] * Math.cos(angles[i]);
            pos[i * 3 + 1] = radii[i] * Math.sin(angles[i]);
            pos[i * 3 + 2] = heights[i];
        }
        return pos;
    }, [angles, radii, heights]);

    useFrame((state) => {
        if (!pointsRef.current) return;
        const posAttr = pointsRef.current.geometry.attributes.position;
        const time = state.clock.elapsedTime;
        for (let i = 0; i < count; i++) {
            const currentAngle = angles[i] + time * 3.5;
            const currentRadius = radii[i] * (1.0 + heights[i] * 0.25);
            posAttr.setX(i, currentRadius * Math.cos(currentAngle));
            posAttr.setY(i, currentRadius * Math.sin(currentAngle));
            
            let z = posAttr.getZ(i) + 0.015;
            if (z > 2.5) z = 0.1;
            posAttr.setZ(i, z);
        }
        posAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef} position={[0, 0, 0]}>
            <bufferGeometry>
                <bufferAttribute 
                    attach="attributes-position"
                    args={[initialPositions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial 
                color="#bfa37a" 
                size={0.09} 
                transparent 
                opacity={0.6}
            />
        </points>
    );
}

function ForestFireflies({ entropy }) {
    const pointsRef = useRef();
    const count = 5;
    
    const [positions, phases, speeds] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const phs = new Float32Array(count);
        const spd = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 1.3;
            pos[i * 3] = r * Math.cos(angle);
            pos[i * 3 + 1] = r * Math.sin(angle);
            pos[i * 3 + 2] = 0.5 + Math.random() * 1.8;
            phs[i] = Math.random() * Math.PI * 2;
            spd[i] = 0.8 + Math.random() * 1.2;
        }
        return [pos, phs, spd];
    }, []);

    useFrame((state) => {
        if (!pointsRef.current) return;
        const posAttr = pointsRef.current.geometry.attributes.position;
        const time = state.clock.elapsedTime;
        for (let i = 0; i < count; i++) {
            const ph = phases[i];
            const sp = speeds[i];
            posAttr.setX(i, positions[i * 3] + Math.sin(time * sp + ph) * 0.18);
            posAttr.setY(i, positions[i * 3 + 1] + Math.cos(time * sp * 0.8 + ph) * 0.18);
            posAttr.setZ(i, positions[i * 3 + 2] + Math.sin(time * sp * 1.2 + ph) * 0.12);
        }
        posAttr.needsUpdate = true;
        
        if (pointsRef.current.material) {
            pointsRef.current.material.opacity = 0.4 + 0.5 * Math.abs(Math.sin(time * 2.5));
        }
    });

    return (
        <points ref={pointsRef} position={[0, 0, 0]}>
            <bufferGeometry>
                <bufferAttribute 
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial 
                color="#ffffaa" 
                size={0.12} 
                transparent 
                opacity={0.8}
            />
        </points>
    );
}

function VoidCollapseParticles() {
    const pointsRef = useRef();
    const count = 15;
    
    const [positions, speeds] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const spd = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 1.3;
            pos[i * 3] = r * Math.cos(angle);
            pos[i * 3 + 1] = r * Math.sin(angle);
            pos[i * 3 + 2] = Math.random() * 3.5;
            spd[i] = 0.02 + Math.random() * 0.03;
        }
        return [pos, spd];
    }, []);

    useFrame(() => {
        if (!pointsRef.current) return;
        const posAttr = pointsRef.current.geometry.attributes.position;
        for (let i = 0; i < count; i++) {
            let z = posAttr.getZ(i) + speeds[i];
            if (z > 3.5) z = 0.1;
            posAttr.setZ(i, z);
        }
        posAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef} position={[0, 0, 0]}>
            <bufferGeometry>
                <bufferAttribute 
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                color={PALETTE.path.dirt}
                size={0.095}
                transparent
                opacity={0.9}
            />
        </points>
    );
}


// Načítanie textúr terénu raz globálne
const textureLoader = new THREE.TextureLoader();

const textures = {
    LUSH_FOREST: textureLoader.load('/textures/lush_forest_tile.png'),
    TOXIC_SWAMP: textureLoader.load('/textures/toxic_swamp_tile.png'),
    GLACIER: textureLoader.load('/textures/glacier_tile.png'),
    DESERT: textureLoader.load('/textures/desert_tile.png'),
    BARRENS: textureLoader.load('/textures/barrens_tile.png')
};

// Nastavenie opakovaní textúry tak, aby presne sedeli na plochu hexagónu
Object.values(textures).forEach(tex => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(0.3, 0.3);
});

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
        <group ref={meshRef} position={[0, 0, 0.55]}>
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
        <group ref={meshRef} position={[0, 0, 0.6]}>
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
        <group ref={meshRef} position={[0, 0, 0.4]}>
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

export default function HexagonNode3D({ node, isHovered, isSelected, onHover, onClick, occupyingThread, isCollapsing = false, entropy = 0.4, hasChest = false, hasTrap = null, terrainTelemetry = null }) {
    const tileRef = useRef();
    const radius = 2.0;

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
    }, [radius]);

    // Získanie detailov o bióme pre danú pozíciu z BiomeEngine
    const biomeInfo = useMemo(() => {
        return BiomeEngine.getBiomeForHex(node.macroIndex, node.subIndex);
    }, [node.macroIndex, node.subIndex]);

    // Vyhodnotenie kombinatorických vlastností cez ML Terrain Synthesizer
    const mlInfo = useMemo(() => {
        return MLTerrainSynthesizer.synthesizeBlock(node.macroIndex, node.subIndex);
    }, [node.macroIndex, node.subIndex]);

    const activeTelemetry = useMemo(() => {
        if (!terrainTelemetry || !terrainTelemetry.textures) return null;
        return terrainTelemetry.textures.find(t => t.chunkId === node.macroIndex && t.blockId === node.subIndex) || null;
    }, [terrainTelemetry, node.macroIndex, node.subIndex]);

    // Nastavenia pre 3D hrúbku map-tile-u
    const extrudeSettings = { depth: 0.4, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.05, bevelThickness: 0.05 };

    const edgeColor = useMemo(() => {
        return (isSelected || isHovered) ? PALETTE.accent.magic : PALETTE.rock.undersideDeep;
    }, [isSelected, isHovered]);

    const [flash, setFlash] = React.useState(false);

    React.useEffect(() => {
        const handleEffect = (e) => {
            const { targetHex } = e.detail;
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

    useFrame((state) => {
        if (!tileRef.current) return;
        const time = state.clock.elapsedTime;

        const targetLift = (isHovered || isSelected) && !isCollapsing ? 0.25 : 0;
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
    });

    // Výpočet dynamického ligtingu na základe ML Light Emission a Biómu
    const emissiveColor = useMemo(() => {
        if (isCollapsing) return new THREE.Color(PALETTE.rock.undersideDeep);
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
    }, [flash, isHovered, mlInfo.lightEmission, biomeInfo.biome, isCollapsing]);

    // Textúra sa maliarsky tónuje k `base` farbe biómu
    const baseTint = useMemo(() => {
        if (isCollapsing) return new THREE.Color(PALETTE.rock.underside);
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
    }, [isSelected, isHovered, mlInfo.colorSaturation, biomeInfo.biome, isCollapsing]);

    const materialProps = useMemo(() => {
        const defaultProps = {
            map: textures[biomeInfo.biome] || null,
            color: baseTint,
            roughness: WORLD.tileRoughness,
            metalness: WORLD.tileMetalness,
            emissive: emissiveColor,
        };

        if (!activeTelemetry) return defaultProps;

        const pattern = activeTelemetry.texturePattern;
        const vibrancy = activeTelemetry.colorVibrancy;

        if (pattern === 'glitch_grid_noise') {
            return {
                ...defaultProps,
                roughness: 0.5,
                color: baseTint.clone().lerp(new THREE.Color(PALETTE.accent.magic), 0.2 * vibrancy),
            };
        }
        if (pattern === 'crystal_vein_specular') {
            return {
                ...defaultProps,
                roughness: 0.4,
                color: baseTint.clone().lerp(new THREE.Color(BIOME_SPECS.GLACIER.accent), 0.25 * vibrancy),
            };
        }
        if (pattern === 'moss_dense_bump') {
            return {
                ...defaultProps,
                roughness: 1.0,
                color: baseTint.clone().lerp(new THREE.Color(BIOME_SPECS.LUSH_FOREST.base), 0.35 * vibrancy),
            };
        }
        if (pattern === 'void_particle_noise') {
            return {
                ...defaultProps,
                color: baseTint.clone().lerp(new THREE.Color(PALETTE.rock.undersideDeep), 0.35 * vibrancy),
            };
        }

        return defaultProps;
    }, [activeTelemetry, baseTint, emissiveColor, biomeInfo.biome]);

    return (
        <group 
            position={node.position} 
            rotation={[-Math.PI / 2, 0, 0]} // Otočenie v trojrozmernom priestore (X, Z je plocha)
            onPointerOver={(e) => { e.stopPropagation(); onHover(node); }}
            onPointerOut={(e) => { e.stopPropagation(); onHover(null); }}
            onClick={(e) => { e.stopPropagation(); onClick(node); }}
        >
            {/* Dlaždica + hrana + (Task 6: podsada) — animovaná ako celok */}
            <group ref={tileRef}>
                <mesh castShadow receiveShadow frustumCulled={false}>
                    <extrudeGeometry args={[hexShape, extrudeSettings]} />
                    <meshStandardMaterial {...materialProps} />
                </mesh>
                <lineSegments position={[0, 0, 0.41]}>
                    <edgesGeometry args={[new THREE.ConeGeometry(radius, 0, 6)]} />
                    <lineBasicMaterial color={edgeColor} transparent opacity={isSelected ? 1.0 : isHovered ? 0.9 : 0.45} />
                </lineSegments>
            </group>

            {/* Časticové efekty biómov */}
            {biomeInfo.biome === 'GLACIER' && !isCollapsing && <SnowParticles />}
            {biomeInfo.biome === 'TOXIC_SWAMP' && !isCollapsing && <SwampVapors />}
            {biomeInfo.biome === 'DESERT' && !isCollapsing && <DesertHeatParticles />}
            {biomeInfo.biome === 'BARRENS' && !isCollapsing && <BarrensDustDevil />}
            {biomeInfo.biome === 'LUSH_FOREST' && !isCollapsing && entropy > 0.5 && <ForestFireflies />}
            {isCollapsing && <VoidCollapseParticles />}
            {hasChest && !isCollapsing && <LootChest3D />}
            {node.isTown && !isCollapsing && <TownBuilding3D />}
            {hasTrap && !isCollapsing && <Trap3D type={hasTrap} />}

            {/* ANCHOR: A_OVERHEAD - Statusový hologram visiaci nad vybraným políčkom */}
            {isSelected && (
                <mesh position={[0, 0, 2.4]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.25, 0.04, 8, 32]} />
                    <meshBasicMaterial color={PALETTE.accent.magic} wireframe />
                </mesh>
            )}
        </group>

    );
}
