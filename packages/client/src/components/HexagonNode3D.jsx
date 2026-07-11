import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BiomeEngine, MLTerrainSynthesizer } from '../../../shared/src/index';
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

export default function HexagonNode3D({ node, isHovered, isSelected, isTargetable = false, onHover, onClick, onDoubleClick = () => {}, occupyingThread, isCollapsing = false, entropy = 0.4, hasChest = false, hasTrap = null, terrainTelemetry = null, weatherOverride = null }) {
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
        if (isSelected || isHovered) return PALETTE.accent.magic;
        if (isTargetable) return '#00ffcc'; // Glowing active target color
        return PALETTE.rock.undersideDeep;
    }, [isSelected, isHovered, isTargetable]);

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
                <mesh castShadow receiveShadow frustumCulled={false}>
                    <extrudeGeometry args={[hexShape, extrudeSettings]} />
                    <meshStandardMaterial {...materialProps} />
                </mesh>
                <lineSegments position={[0, 0, 0.41]}>
                    <edgesGeometry args={[new THREE.ConeGeometry(radius, 0, 6)]} />
                    <lineBasicMaterial color={edgeColor} transparent opacity={isSelected ? 1.0 : isHovered ? 0.9 : isTargetable ? 0.8 : 0.45} />
                </lineSegments>

                {/* Spell Casting VFX projected on the Hexagon */}
                {flash && <SpellFlashBeam3D weatherOverride={weatherOverride} />}

                {/* Skalná podsada — 6-boký zužujúci sa "stalaktit" pod dlaždicou */}
                <mesh position={[0, 0, -undersideDepth / 2 + 0.02]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[radius * 0.92, 0.18, undersideDepth, 6, 1, false, Math.PI / 6]} />
                    <meshStandardMaterial
                        color={PALETTE.rock.underside}
                        roughness={1}
                        metalness={0}
                        flatShading
                    />
                </mesh>
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
