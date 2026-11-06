import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BiomeEngine, MLTerrainSynthesizer } from '../../../shared/src/index';
import { PALETTE, BIOME_SPECS, WORLD } from '../design/worldDesign';
import {
    SnowParticles, SwampVapors, DesertHeatParticles,
    BarrensDustDevil, ForestFireflies, VoidCollapseParticles,
} from './world/BiomeParticles';
import { DotaTerrainObstacle3D } from './world/ProceduralAssetTemplates3D';

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

// ─── Selection Ring (Animated) ───────────────────────────────────────────────────
function SelectionRing({ color, radius, intensity = 1 }) {
    const ringRef = useRef();
    
    useFrame((state) => {
        if (!ringRef.current) return;
        const time = state.clock.elapsedTime;
        // Subtle rotation and pulse
        ringRef.current.rotation.z = time * 0.5;
        const scale = 1 + Math.sin(time * 2) * 0.05;
        ringRef.current.scale.set(scale, scale, 1);
    });

    return (
        <group ref={ringRef} position={[0, 0, 0.45]}>
            {/* Outer ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[radius * 0.95, 0.08, 8, 6]} />
                <meshBasicMaterial 
                    color={color} 
                    transparent 
                    opacity={0.8 * intensity}
                />
            </mesh>
            {/* Inner glow ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[radius * 0.85, 0.15, 8, 6]} />
                <meshBasicMaterial 
                    color={color} 
                    transparent 
                    opacity={0.3 * intensity}
                />
            </mesh>
            {/* Point light for glow effect */}
            <pointLight color={color} intensity={intensity * 2} distance={3} />
        </group>
    );
}

// ─── Hover Indicator ─────────────────────────────────────────────────────────────
function HoverIndicator({ radius, color }) {
    const ref = useRef();
    
    useFrame((state) => {
        if (!ref.current) return;
        const time = state.clock.elapsedTime;
        ref.current.material.opacity = 0.4 + Math.sin(time * 3) * 0.15;
    });

    return (
        <mesh ref={ref} position={[0, 0, 0.42]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius * 0.7, radius * 0.9, 6]} />
            <meshBasicMaterial 
                color={color} 
                transparent 
                opacity={0.5}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

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
                <meshPhysicalMaterial 
                    color="#1a1a24" 
                    metalness={0.85} 
                    roughness={0.25}
                    clearcoat={0.4}
                    clearcoatRoughness={0.2}
                />
            </mesh>
            {/* Chest Lid (Neon Golden frame) */}
            <mesh position={[0, 0, 0.14]} castShadow>
                <boxGeometry args={[0.47, 0.37, 0.1]} />
                <meshPhysicalMaterial 
                    color="#d4af37" 
                    emissive="#d4af37" 
                    emissiveIntensity={0.3} 
                    metalness={0.95} 
                    roughness={0.15}
                    clearcoat={0.6}
                />
            </mesh>
            {/* Glowing Aetheric Core lock */}
            <mesh position={[0, -0.19, 0.05]}>
                <sphereGeometry args={[0.07, 16, 16]} />
                <meshBasicMaterial color={PALETTE.accent.magic} />
            </mesh>
            <pointLight distance={2} intensity={1.2} color={PALETTE.accent.magic} />
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

    const color = type === 'ROOT_TRAP' ? '#fb923c' : '#ef4444';

    return (
        <group ref={meshRef} position={[0, 0, 0.6]}>
            {/* Skull Top */}
            <mesh position={[0, 0, 0.15]} castShadow>
                <sphereGeometry args={[0.18, 16, 16]} />
                <meshPhysicalMaterial 
                    color={color} 
                    emissive={color} 
                    emissiveIntensity={1.8} 
                    roughness={0.15} 
                    metalness={0.85}
                    clearcoat={0.5}
                />
            </mesh>
            {/* Skull Jaw */}
            <mesh position={[0, -0.1, -0.02]} castShadow>
                <boxGeometry args={[0.12, 0.1, 0.15]} />
                <meshPhysicalMaterial 
                    color={color} 
                    emissive={color} 
                    emissiveIntensity={1.8} 
                    roughness={0.15} 
                    metalness={0.85}
                />
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
            <pointLight distance={2} intensity={1.2} color={color} />
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
                <meshPhysicalMaterial 
                    color="#3a3d52" 
                    metalness={0.92} 
                    roughness={0.25}
                    clearcoat={0.3}
                />
            </mesh>
            {/* Tower roof */}
            <mesh position={[0, 0, 0.95]} castShadow>
                <coneGeometry args={[0.35, 0.4, 6]} />
                <meshPhysicalMaterial 
                    color={PALETTE.accent.magic} 
                    emissive="#004444" 
                    emissiveIntensity={0.4}
                    roughness={0.15}
                    metalness={0.6}
                    clearcoat={0.5}
                />
            </mesh>
            {/* Surrounding wall pillars */}
            {[-0.5, 0.5].map((x, idx) => (
                <group key={idx} position={[x, 0, 0.2]}>
                    <mesh castShadow>
                        <boxGeometry args={[0.2, 0.2, 0.4]} />
                        <meshPhysicalMaterial 
                            color="#2d2f3f" 
                            metalness={0.85} 
                            roughness={0.35}
                            clearcoat={0.2}
                        />
                    </mesh>
                    <mesh position={[0, 0, 0.25]}>
                        <coneGeometry args={[0.15, 0.2, 4]} />
                        <meshBasicMaterial color={PALETTE.accent.magic} />
                    </mesh>
                </group>
            ))}
            {/* Glowing neon ring */}
            <mesh position={[0, 0, 0.8]} rotation={[0, 0, 0]}>
                <torusGeometry args={[0.45, 0.035, 8, 24]} />
                <meshBasicMaterial color={PALETTE.accent.magic} />
            </mesh>
            <pointLight distance={4} intensity={1.2} color={PALETTE.accent.magic} position={[0, 0, 1.2]} />
        </group>
    );
}

export default function HexagonNode3D({ node, isHovered, isSelected, onHover, onClick, occupyingThread, isCollapsing = false, entropy = 0.4, hasChest = false, hasTrap = null, terrainTelemetry = null }) {
    const tileRef = useRef();
    const edgeRef = useRef();
    const radius = 2.0;

    // Generovanie 3D tvaru hexagónu (ExtrudeGeometry pre 3D podstavec)
    const hexShape = useMemo(() => {
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

    // Biome-specific edge color
    const biomeAccentColor = useMemo(() => {
        const spec = BIOME_SPECS[biomeInfo.biome];
        return spec?.accent || PALETTE.accent.magic;
    }, [biomeInfo.biome]);

    const edgeColor = useMemo(() => {
        if (isSelected) return PALETTE.accent.magic;
        if (isHovered) return biomeAccentColor;
        return PALETTE.rock.undersideDeep;
    }, [isSelected, isHovered, biomeAccentColor]);

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

        // Smooth lift on hover/select with spring-like easing
        const targetLift = (isHovered || isSelected) && !isCollapsing ? 0.3 : 0;
        tileRef.current.position.z = THREE.MathUtils.lerp(tileRef.current.position.z, targetLift, 0.12);

        // Subtle tilt on hover for depth
        if (isHovered && !isCollapsing) {
            const tiltAmount = 0.02;
            tileRef.current.rotation.x = THREE.MathUtils.lerp(tileRef.current.rotation.x, Math.sin(time * 2) * tiltAmount, 0.1);
            tileRef.current.rotation.y = THREE.MathUtils.lerp(tileRef.current.rotation.y, Math.cos(time * 2) * tiltAmount, 0.1);
        } else {
            tileRef.current.rotation.x = THREE.MathUtils.lerp(tileRef.current.rotation.x, 0, 0.1);
            tileRef.current.rotation.y = THREE.MathUtils.lerp(tileRef.current.rotation.y, 0, 0.1);
        }

        if (isCollapsing) {
            tileRef.current.position.y = THREE.MathUtils.lerp(tileRef.current.position.y, -4.5, 0.04);
        } else {
            if (time < spawnDelay) {
                tileRef.current.position.y = -5;
            } else {
                const entryProgress = Math.min(1.0, (time - spawnDelay) * 2.0);
                // Smooth ease-out for entry
                const easedProgress = 1 - Math.pow(1 - entryProgress, 3);
                const baseHeight = THREE.MathUtils.lerp(-5, 0, easedProgress);
                const waveFreq = 2.0 + entropy * 1.5;
                const waveAmp = 0.02 + entropy * 0.06;
                const idleOffset = Math.sin(time * waveFreq + (node.position[0] + node.position[2]) * 0.45) * waveAmp;
                tileRef.current.position.y = baseHeight + idleOffset;
            }
        }

        // Animate edge opacity for selected/hovered state
        if (edgeRef.current) {
            const targetOpacity = isSelected ? 1.0 : isHovered ? 0.8 : 0.35;
            edgeRef.current.material.opacity = THREE.MathUtils.lerp(
                edgeRef.current.material.opacity, 
                targetOpacity, 
                0.15
            );
        }
    });

    // Výpočet dynamického lighting na základe ML Light Emission a Biómu
    const emissiveColor = useMemo(() => {
        if (isCollapsing) return new THREE.Color(PALETTE.rock.undersideDeep);
        if (flash) return new THREE.Color(PALETTE.portal.core).multiplyScalar(3.0);
        if (isSelected) return new THREE.Color(PALETTE.accent.magic).multiplyScalar(0.2);
        if (isHovered) return new THREE.Color(biomeAccentColor).multiplyScalar(0.15);
        if (mlInfo.lightEmission > 0.4) {
            if (biomeInfo.biome === 'TOXIC_SWAMP') {
                return new THREE.Color(BIOME_SPECS.TOXIC_SWAMP.accent).multiplyScalar(mlInfo.lightEmission * 0.18);
            }
            if (biomeInfo.biome === 'GLACIER') {
                return new THREE.Color(BIOME_SPECS.GLACIER.accent).multiplyScalar(mlInfo.lightEmission * 0.12);
            }
            if (biomeInfo.biome === 'LUSH_FOREST') {
                return new THREE.Color(BIOME_SPECS.LUSH_FOREST.accent).multiplyScalar(mlInfo.lightEmission * 0.1);
            }
        }
        return new THREE.Color('#000000');
    }, [flash, isHovered, isSelected, mlInfo.lightEmission, biomeInfo.biome, isCollapsing, biomeAccentColor]);

    // Textúra sa maliarsky tónuje k `base` farbe biómu
    const baseTint = useMemo(() => {
        if (isCollapsing) return new THREE.Color(PALETTE.rock.underside);
        if (isSelected) return new THREE.Color('#ffffff').lerp(new THREE.Color(PALETTE.accent.magic), 0.6);
        if (isHovered) {
            return new THREE.Color('#ffffff').lerp(new THREE.Color(biomeAccentColor), 0.35);
        }
        const spec = BIOME_SPECS[biomeInfo.biome];
        const base = new THREE.Color('#d8d2c5').lerp(new THREE.Color(spec.base), 0.72);
        if (mlInfo.colorSaturation < 0.5) {
            base.lerp(new THREE.Color('#888888'), 0.5 - mlInfo.colorSaturation);
        }
        return base;
    }, [isSelected, isHovered, mlInfo.colorSaturation, biomeInfo.biome, isCollapsing, biomeAccentColor]);

    // Enhanced material properties with biome-specific Physical material
    const materialProps = useMemo(() => {
        const spec = BIOME_SPECS[biomeInfo.biome];
        
        // Biome-specific dramatic material settings
        const defaultProps = {
            map: textures[biomeInfo.biome] || null,
            color: baseTint,
            roughness: spec?.roughness ?? WORLD.tileRoughness,
            metalness: spec?.metalness ?? WORLD.tileMetalness,
            emissive: emissiveColor,
            emissiveIntensity: spec?.emissiveIntensity ?? 0.05,
            // Physical material — dramatic reflections
            clearcoat: spec?.clearcoat ?? WORLD.tileClearcoat,
            clearcoatRoughness: spec?.clearcoatRoughness ?? WORLD.tileClearcoatRoughness,
            envMapIntensity: WORLD.tileEnvMapIntensity ?? 1.5,
            // Transparency for ice/water biomes
            transmission: 0,
            ior: spec?.ior || 1.0,
            thickness: spec?.transmission ? 0.5 : 0,
        };

        if (!activeTelemetry) return defaultProps;

        const pattern = activeTelemetry.texturePattern;
        const vibrancy = activeTelemetry.colorVibrancy;

        if (pattern === 'glitch_grid_noise') {
            return {
                ...defaultProps,
                roughness: 0.3,
                metalness: 0.3,
                color: baseTint.clone().lerp(new THREE.Color(PALETTE.accent.magic), 0.3 * vibrancy),
                clearcoat: 0.6,
                emissiveIntensity: 0.2,
            };
        }
        if (pattern === 'crystal_vein_specular') {
            return {
                ...defaultProps,
                roughness: 0.1,
                metalness: 0.5,
                color: baseTint.clone().lerp(new THREE.Color(BIOME_SPECS.GLACIER.accent), 0.35 * vibrancy),
                clearcoat: 1.0,
                clearcoatRoughness: 0.03,
                transmission: 0,
                ior: 1.31,
                emissiveIntensity: 0.25,
            };
        }
        if (pattern === 'moss_dense_bump') {
            return {
                ...defaultProps,
                roughness: 0.95,
                metalness: 0.05,
                color: baseTint.clone().lerp(new THREE.Color(BIOME_SPECS.LUSH_FOREST.base), 0.45 * vibrancy),
                clearcoat: 0.15,
            };
        }
        if (pattern === 'void_particle_noise') {
            return {
                ...defaultProps,
                roughness: 0.5,
                metalness: 0.4,
                color: baseTint.clone().lerp(new THREE.Color(PALETTE.rock.undersideDeep), 0.45 * vibrancy),
                clearcoat: 0.5,
                emissiveIntensity: 0.15,
            };
        }

        return defaultProps;
    }, [activeTelemetry, baseTint, emissiveColor, biomeInfo.biome]);

    // Kamenná podsada: okrajové hexy visia hlbšie — dojem odlomeného ostrova.
    const undersideDepth = useMemo(() => {
        const dist = Math.hypot(node.position[0], node.position[2]) / 14;
        const jitter = ((node.macroIndex * 7 + node.subIndex) % 5) * 0.15;
        return 1.6 + dist * 2.2 + jitter;
    }, [node.position, node.macroIndex, node.subIndex]);

    return (
        <group
            position={node.position}
            rotation={[-Math.PI / 2, 0, 0]}
            onPointerOver={(e) => { e.stopPropagation(); onHover(node); }}
            onPointerOut={(e) => { e.stopPropagation(); onHover(null); }}
            onClick={(e) => { e.stopPropagation(); onClick(node); }}
        >
            {/* Dlaždica + hrana + podsada — animovaná ako celok */}
            <group ref={tileRef}>
                {/* Main hex tile with physical material */}
                <mesh castShadow receiveShadow frustumCulled={false}>
                    <extrudeGeometry args={[hexShape, extrudeSettings]} />
                    <meshStandardMaterial roughness={materialProps.roughness} metalness={materialProps.metalness} map={materialProps.map} color={materialProps.color} emissive="#000000" emissiveIntensity={0} />
                </mesh>
                
                {/* Edge outline with animated opacity */}
                <lineSegments ref={edgeRef} position={[0, 0, 0.41]}>
                    <edgesGeometry args={[new THREE.ConeGeometry(radius, 0, 6)]} />
                    <lineBasicMaterial 
                        color={edgeColor} 
                        transparent 
                        opacity={0.35}
                        linewidth={2}
                    />
                </lineSegments>

                {/* Biome-specific edge glow (subtle) */}
                {(isHovered || isSelected) && (
                    <lineSegments position={[0, 0, 0.42]}>
                        <edgesGeometry args={[new THREE.ConeGeometry(radius * 1.02, 0, 6)]} />
                        <lineBasicMaterial 
                            color={biomeAccentColor} 
                            transparent 
                            opacity={isSelected ? 0.6 : 0.3}
                        />
                    </lineSegments>
                )}

                {/* Skalná podsada — 6-boký zužujúci sa "stalaktit" pod dlaždicou */}
                <mesh position={[0, 0, -undersideDepth / 2 + 0.02]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[radius * 0.96, (node.elevationTier || 0) >= 1 ? radius * 0.82 : 0.28, undersideDepth + Math.max(0, (node.position[1] || 0) * 1.3), 6, 1, false, Math.PI / 6]} />
                    <meshStandardMaterial
                        color={PALETTE.rock.underside}
                        roughness={1}
                        metalness={0}
                        flatShading
                    />
                </mesh>

                {/* Hover shadow projection */}
                {isHovered && !isCollapsing && (
                    <mesh position={[0, 0, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[radius * 0.8, 6]} />
                        <meshBasicMaterial 
                            color="#000000" 
                            transparent 
                            opacity={0.3}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                )}
            </group>

            {/* Selection Ring (animated) */}
            {isSelected && !isCollapsing && (
                <SelectionRing 
                    color={PALETTE.accent.magic} 
                    radius={radius}
                    intensity={1.2}
                />
            )}

            {/* Hover Indicator */}
            {isHovered && !isSelected && !isCollapsing && (
                <HoverIndicator 
                    radius={radius}
                    color={biomeAccentColor}
                />
            )}

            {/* Časticové efekty biómov */}
            {node.subIndex === 0 && biomeInfo.biome === 'GLACIER' && !isCollapsing && <SnowParticles />}
            {node.subIndex === 0 && biomeInfo.biome === 'TOXIC_SWAMP' && !isCollapsing && <SwampVapors />}
            {node.subIndex === 0 && biomeInfo.biome === 'DESERT' && !isCollapsing && <DesertHeatParticles />}
            {node.subIndex === 0 && biomeInfo.biome === 'BARRENS' && !isCollapsing && <BarrensDustDevil />}
            {biomeInfo.biome === 'LUSH_FOREST' && !isCollapsing && entropy > 0.5 && <ForestFireflies />}
            {isCollapsing && <VoidCollapseParticles />}
            {hasChest && !isCollapsing && <LootChest3D />}
            {node.isTown && !isCollapsing && <TownBuilding3D />}
            {hasTrap && !isCollapsing && <Trap3D type={hasTrap} />}
            {node.terrainFeature && !isCollapsing && <DotaTerrainObstacle3D feature={node.terrainFeature} tier={node.elevationTier} />}

            {/* Status hologram nad vybraným políčkom */}
            {isSelected && (
                <group position={[0, 0, 2.4]}>
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <torusGeometry args={[0.3, 0.05, 8, 32]} />
                        <meshBasicMaterial color={PALETTE.accent.magic} wireframe />
                    </mesh>
                    {/* Pulsing inner ring */}
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <torusGeometry args={[0.2, 0.03, 8, 32]} />
                        <meshBasicMaterial color={PALETTE.accent.magic} transparent opacity={0.6} />
                    </mesh>
                </group>
            )}
        </group>
    );
}
