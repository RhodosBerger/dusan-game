import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';
import { CRYSTAL_CARDS_BASE, TOXIC_CARDS_BASE, DRUID_CARDS_BASE, VOID_CARDS_BASE } from '../../../shared/src/index';
import { generate3DGrid } from '../utils/HexMath3D';

const allBases = [...CRYSTAL_CARDS_BASE, ...TOXIC_CARDS_BASE, ...DRUID_CARDS_BASE, ...VOID_CARDS_BASE];

const META_COORDS = [
  { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
  { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
  { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }
];
const getMetaDistance = (metaA, metaB) => {
  const a = META_COORDS[metaA] || { x: 0, y: 0 };
  const b = META_COORDS[metaB] || { x: 0, y: 0 };
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
};
import HexagonNode3D from './HexagonNode3D';
import MetapositionBorder3D from './MetapositionBorder3D';
import ThreadMiniature from './ThreadMiniature';
import SpellProjectile3D from './SpellProjectile3D';
import HeroImpactVFX from './HeroImpactVFX';
import ArenaAmbientParticles from './ArenaAmbientParticles';
import HeroAura from './HeroAura';
import { AdrenalineDirector } from '../../../shared/src/index';
import AestheticCompositor from './AestheticCompositor';
import BiomeTransitionVFX from './BiomeTransitionVFX';
import VolumetricFog3D from './VolumetricFog3D';
import { PALETTE, LIGHTING, WORLD } from '../design/worldDesign';
import StarfieldBackground from './world/StarfieldBackground';
import { getActiveProfile, WORLD_PROFILES } from '../design/worldProfiles';
import FloatingShards3D from './world/FloatingShards3D';
import PortalVortex3D from './world/PortalVortex3D';
import { PORTAL_NODE_ID } from '../design/propPlacement';
import InstancedWorldProps from './world/InstancedWorldProps';

function ArenaGroup({ children, shakeIntensity }) {
    const groupRef = useRef();
    const shakeRef = useRef(0);

    useEffect(() => {
        if (shakeIntensity > 0) {
            shakeRef.current = shakeIntensity;
        }
    }, [shakeIntensity]);

    useFrame(() => {
        if (groupRef.current) {
            if (shakeRef.current > 0.01) {
                groupRef.current.position.x = (Math.random() - 0.5) * shakeRef.current * 0.35;
                groupRef.current.position.y = (Math.random() - 0.5) * shakeRef.current * 0.35;
                groupRef.current.position.z = (Math.random() - 0.5) * shakeRef.current * 0.35;
                shakeRef.current *= 0.85;
            } else {
                groupRef.current.position.set(0, 0, 0);
            }
        }
    });

    return <group ref={groupRef}>{children}</group>;
}

function UltimateOrbVFX({ active }) {
    const meshRef = useRef();
    const [scale, setScale] = useState(0.01);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (active) {
            setVisible(true);
            setScale(0.01);
        }
    }, [active]);

    useFrame((state, delta) => {
        if (visible && meshRef.current) {
            meshRef.current.rotation.y += delta * 3.5;
            meshRef.current.rotation.x += delta * 1.5;
            const nextScale = meshRef.current.scale.x + delta * 28;
            if (nextScale > 18) {
                setVisible(false);
                setScale(0.01);
            } else {
                setScale(nextScale);
            }
        }
    });

    if (!visible) return null;

    return (
        <mesh ref={meshRef} position={[0, 1.2, 0]} scale={scale}>
            <sphereGeometry args={[1, 14, 14]} />
            <meshBasicMaterial 
                color="#ffd700" 
                wireframe={true} 
                transparent={true} 
                opacity={0.85 * (1.0 - scale / 18)} 
            />
        </mesh>
    );
}

function DynamicCameraController({ gameMode, threads, gridData, map, shakeIntensity, isUltimate, activeBiome }) {
    const { camera, controls } = useThree();
    const desiredTarget = useRef(new THREE.Vector3(0, 0, 0));

    // Vyhľadanie aktívneho hrdinu
    const activePlayer = useMemo(() => {
        return threads.find(t => t.type === 'PLAYER' && t.health > 0) || null;
    }, [threads]);

    useEffect(() => {
        if (gameMode === 'SANDBOX') {
            desiredTarget.current.set(0, 0, 0);
        } else {
            // Sledovanie aktívneho hráča alebo NPC na ťahu
            const targetThread = threads.find(t => t.health > 0 && t.position && t.position.meta !== null);
            if (targetThread && targetThread.position) {
                const node = gridData.find(
                    n => n.macroIndex === targetThread.position.meta && n.subIndex === targetThread.position.hex
                );
                if (node) {
                    desiredTarget.current.set(node.position[0], node.position[1], node.position[2]);
                }
            } else {
                desiredTarget.current.set(0, 0, 0);
            }
        }
    }, [gameMode, threads, gridData, activePlayer]);

    useFrame((state, delta) => {
        // 1. Plynulý LERP stredu záujmu
        if (controls) {
            controls.target.lerp(desiredTarget.current, delta * 3.5);
            controls.update();
        }

        // 2. Úprava FOV (zorného uhla) pre detailný zoom a taktický prehľad
        let targetFov = isUltimate ? 34 : (gameMode === 'SANDBOX' ? 45 : 38);
        if (gameMode !== 'SANDBOX' && !isUltimate) {
            if (activeBiome === 'TOXIC_SWAMP') {
                targetFov = 34; // Zoomed-in
            } else if (activeBiome === 'GLACIER') {
                targetFov = 48; // Wide-angle
            }
        }

        if (Math.abs(camera.fov - targetFov) > 0.1) {
            camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, delta * 4.0);
            camera.updateProjectionMatrix();
        }

        // 3. Dynamické trasenie kamery (Camera Shake) s vysokou responzivitou
        if (shakeIntensity > 0) {
            camera.position.x += (Math.random() - 0.5) * shakeIntensity * 0.15;
            camera.position.y += (Math.random() - 0.5) * shakeIntensity * 0.15;
            camera.position.z += (Math.random() - 0.5) * shakeIntensity * 0.15;
        }

        // 4. Pomalý automatický oblet v Sandbox móde pre udržanie dynamiky scény
        if (gameMode === 'SANDBOX' && !isUltimate) {
            const time = state.clock.getElapsedTime();
            desiredTarget.current.set(Math.sin(time * 0.25) * 1.5, 0, Math.cos(time * 0.25) * 1.5);
        }
    });

    return null;
}

function EnvironmentController({ activeBiome, entropy, weatherOverride }) {
    const { scene } = useThree();
    const ambientLightRef = useRef();
    const keyLightRef = useRef();
    const fillLightRef = useRef();
    
    const activeProfile = useMemo(() => {
        if (weatherOverride) {
            return WORLD_PROFILES[weatherOverride];
        }
        return getActiveProfile(activeBiome, entropy);
    }, [activeBiome, entropy, weatherOverride]);

    useFrame((state, delta) => {
        const speed = delta * 2.0;
        if (scene.fog) {
            const targetFogColor = new THREE.Color(activeProfile.fog.color);
            scene.fog.color.lerp(targetFogColor, speed);
            scene.fog.near = THREE.MathUtils.lerp(scene.fog.near, activeProfile.fog.near, speed);
            scene.fog.far = THREE.MathUtils.lerp(scene.fog.far, activeProfile.fog.far, speed);
        }
        if (scene.background) {
            const targetBgColor = new THREE.Color(activeProfile.fog.color);
            scene.background.lerp(targetBgColor, speed);
        }
        if (ambientLightRef.current) {
            ambientLightRef.current.color.lerp(new THREE.Color(activeProfile.ambient.color), speed);
            ambientLightRef.current.intensity = THREE.MathUtils.lerp(ambientLightRef.current.intensity, activeProfile.ambient.intensity, speed);
        }
        if (keyLightRef.current) {
            keyLightRef.current.color.lerp(new THREE.Color(activeProfile.key.color), speed);
            keyLightRef.current.intensity = THREE.MathUtils.lerp(keyLightRef.current.intensity, activeProfile.key.intensity, speed);
        }
        if (fillLightRef.current) {
            fillLightRef.current.color.lerp(new THREE.Color(activeProfile.fill.color), speed);
            fillLightRef.current.intensity = THREE.MathUtils.lerp(fillLightRef.current.intensity, activeProfile.fill.intensity, speed);
        }
    });

    return (
        <>
            <ambientLight ref={ambientLightRef} intensity={activeProfile.ambient.intensity} color={activeProfile.ambient.color} />
            <directionalLight
                ref={keyLightRef}
                castShadow
                position={activeProfile.key.position}
                intensity={activeProfile.key.intensity}
                color={activeProfile.key.color}
                shadow-mapSize={[2048, 2048]}
            />
            <directionalLight
                ref={fillLightRef}
                position={activeProfile.fill.position}
                intensity={activeProfile.fill.intensity}
                color={activeProfile.fill.color}
            />
        </>
    );
}

function isWebGLAvailable() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
        return false;
    }
}

export default function CanvasRenderer3D({ entropy = 0.4, selectedNode, onNodeClick, selectedCard = null, onExecuteAction = () => {}, onMoveHero = () => {}, threads = [], shakeIntensity = 0, turnsElapsed = 1, map = [], terrainTelemetry = null, ultimateFlash = false, gameMode = 'SANDBOX', weatherOverride = null, activeTransitions = [], onTransitionComplete }) {
    const hasWebGL = useMemo(() => isWebGLAvailable(), []);
    const [isLowPower, setIsLowPower] = useState(false);
    const gridData = useMemo(() => generate3DGrid(), []);
    
    // Calculate which node IDs are collapsing this turn
    const collapsingNodeIds = useMemo(() => {
        return AdrenalineDirector.getCollapsingNodes(turnsElapsed, gridData);
    }, [turnsElapsed, gridData]);

    const [hoveredNode, setHoveredNode] = useState(null);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    if (renderer && (renderer.includes('Iris') || renderer.includes('Intel') || renderer.includes('Mobile') || renderer.includes('HD Graphics') || renderer.includes('AMD Radeon(TM) Graphics'))) {
                        setIsLowPower(true);
                        console.log(`[PERFORMANCE_PROFILER] Low-power GPU detected: ${renderer}. Enabling performance optimization profile.`);
                    }
                }
            }
        } catch (e) {
            // Fallback
        }
    }, []);

    // Zoskupenie uzlov podľa metapozícií kvôli efektívnemu vykresleniu hraníc
    const metapositions = useMemo(() => {
        const groups = Array.from({ length: 9 }, () => []);
        gridData.forEach(node => groups[node.macroIndex].push(node));
        return groups;
    }, [gridData]);

    const portalNode = useMemo(() => gridData.find(n => n.id === PORTAL_NODE_ID), [gridData]);


    const activeBiome = useMemo(() => {
        if (!map || map.length === 0) return 'LUSH_FOREST';
        const targetThread = threads.find(t => t.health > 0 && t.position && t.position.meta !== null);
        if (targetThread && targetThread.position) {
            const chunk = map.find(c => c.id === targetThread.position.meta);
            const block = chunk?.blocks?.find(b => b.id === targetThread.position.hex);
            return block?.biome || 'LUSH_FOREST';
        }
        return 'LUSH_FOREST';
    }, [map, threads]);

    const cameraPosition = isMobile ? [0, 20, 20] : [0, 15, 15];
    const cameraFov = isMobile ? 55 : 45;

    // Calculate current average hazard index based on the active threads' locations
    const currentHazardIndex = useMemo(() => {
        if (!map || map.length === 0) return 0.4;
        const targetThread = threads.find(t => t.health > 0 && t.position && t.position.meta !== null);
        if (targetThread && targetThread.position) {
            const chunk = map.find(c => c.id === targetThread.position.meta);
            const block = chunk?.blocks?.find(b => b.id === targetThread.position.hex);
            if (block?.biome === 'TOXIC_SWAMP') return 0.8;
            if (block?.biome === 'DESERT') return 0.6;
            if (block?.biome === 'GLACIER') return 0.4;
            if (block?.biome === 'BARRENS') return 0.5;
            return 0.3; // LUSH_FOREST
        }
        return 0.4;
    }, [map, threads]);

    if (!hasWebGL) {
        // Headless Container Fallback View (Docker / Jenkins friendly)
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#070b19] text-[#e0e7ff] p-6 text-center border border-[#1f2937] rounded-lg">
                <div className="text-xl font-bold mb-2 tracking-wide text-[var(--accent-loot,#39ff14)]">Sovereign Arena - Headless Container Mode</div>
                <p className="text-sm opacity-75 max-w-md mb-6 leading-relaxed">
                    WebGL rendering is unavailable or running inside a virtualized CI environment (Docker/Jenkins). Rendering a static, safe HTML canvas fallback for testing validation.
                </p>
                <div className="w-full max-w-sm border border-[#111827] p-5 rounded-lg bg-[#0b0f19] shadow-2xl">
                    <div className="text-xs uppercase tracking-widest opacity-50 mb-3 font-semibold">Simulated Environment State</div>
                    <div className="flex flex-col gap-2 text-left font-mono text-xs">
                        <div className="flex justify-between border-b border-[#1f2937] pb-1">
                            <span className="opacity-75">Active Threads:</span>
                            <span className="text-[#39ff14]">{threads.length}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#1f2937] pb-1">
                            <span className="opacity-75">Turns Elapsed:</span>
                            <span className="text-[#00eeff]">{turnsElapsed}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#1f2937] pb-1">
                            <span className="opacity-75">Global Entropy:</span>
                            <span className="text-[#ffcc00]">{entropy.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pb-1">
                            <span className="opacity-75">Tactic Mode:</span>
                            <span className="text-[#ff007f]">{gameMode}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative bg-[color:var(--space-bg)]">
            <Canvas shadows>
                <color attach="background" args={[PALETTE.space.background]} />
                <fog attach="fog" args={[WORLD.fog.color, WORLD.fog.near, WORLD.fog.far]} />
                <StarfieldBackground />
                <FloatingShards3D />

                {/* Kamera dynamicky prispôsobená pre mobilné zariadenia */}
                <PerspectiveCamera makeDefault position={cameraPosition} fov={cameraFov} near={0.1} far={1000} />
                <OrbitControls 
                    enableDamping 
                    maxPolarAngle={Math.PI / 2.5} // Zamedzí pohľadu z podlahy
                    minDistance={2} 
                    maxDistance={150} 
                />

                {/* Dynamické riadenie kamery na základe herného režimu */}
                <DynamicCameraController 
                    gameMode={gameMode} 
                    threads={threads} 
                    gridData={gridData} 
                    map={map}
                    shakeIntensity={shakeIntensity} 
                    isUltimate={ultimateFlash} 
                    activeBiome={activeBiome}
                />

                {/* Dynamické osvetlenie a volumetrické profily sveta */}
                <EnvironmentController activeBiome={activeBiome} entropy={entropy} weatherOverride={weatherOverride} />

                {/* 3D Scéna - Vykreslenie 63 Hexov */}
                <ArenaGroup shakeIntensity={shakeIntensity}>
                    {gridData.map((node) => {
                        const isCollapsing = collapsingNodeIds.includes(node.id);
                        const serverChunk = map?.find(c => c.id === node.macroIndex);
                        const serverBlock = serverChunk?.blocks?.find(b => b.id === node.subIndex);
                        const hasChest = !!serverBlock?.hasOpportunity || !!serverBlock?.hasChest;
                        const hasTrap = serverBlock?.hasTrap || null;

                        const isTargetable = (() => {
                            if (!selectedCard) return false;
                            const activeHero = threads.find(t => t.id === (threads[0]?.id || 'thread_king_ai'));
                            if (!activeHero || activeHero.position?.meta === undefined || activeHero.position?.meta === null) return false;
                            const dist = getMetaDistance(activeHero.position.meta, node.macroIndex);
                            const base = allBases.find(b => b.id === selectedCard.id);
                            if (!base) return false;
                            const isAttackNode = base.cardCategorization === 'attack' || base.damage > 0;
                            const reach = isAttackNode ? (activeHero.attackReach || 1) : (activeHero.spellReach || 2);
                            return reach === 0 ? dist === 0 : dist <= reach;
                        })();

                        const handleDoubleClick = () => {
                            if (selectedCard) {
                                if (isTargetable) {
                                    onNodeClick(node);
                                    setTimeout(() => {
                                        onExecuteAction();
                                    }, 50);
                                }
                            } else {
                                onMoveHero(node);
                            }
                        };

                        return (
                            <HexagonNode3D
                                key={node.id}
                                node={node}
                                isHovered={hoveredNode?.id === node.id || hoveredNode?.macroIndex === node.macroIndex}
                                isSelected={selectedNode?.id === node.id}
                                isTargetable={isTargetable}
                                onHover={setHoveredNode}
                                onClick={onNodeClick}
                                onDoubleClick={handleDoubleClick}
                                isCollapsing={isCollapsing}
                                entropy={entropy}
                                hasChest={hasChest}
                                hasTrap={hasTrap}
                                terrainTelemetry={terrainTelemetry}
                                weatherOverride={weatherOverride}
                            />
                        );
                    })}

                    {/* Rekvizity biómov — Optimalizované vykresľovanie cez Instanced Rendering a zdieľané materiály */}
                    <InstancedWorldProps 
                        gridData={gridData} 
                        collapsingNodeIds={collapsingNodeIds} 
                    />

                    {/* Floating mana particles across the whole arena */}
                    <ArenaAmbientParticles 
                        entropy={entropy} 
                        hazardIndex={currentHazardIndex}
                    />

                    {/* Centrálny magický vír — srdce ostrova */}
                    {portalNode && (
                        <PortalVortex3D position={[portalNode.position[0], 0.55, portalNode.position[2]]} />
                    )}

                    {/* Volumetric Fog Layer disabled for sharp visual focus */}

                    {/* Hero Aura rings + ground glow — mounted per thread, LERP-tracked */}
                    {threads.map((thread) => (
                        <HeroAura
                            key={`aura_${thread.id}`}
                            thread={thread}
                            gridData={gridData}
                        />
                    ))}

                    {/* Vykreslenie plynule Lerp-ovaných figúrok postáv */}
                    {threads.map((thread) => (
                        <ThreadMiniature 
                            key={thread.id}
                            thread={thread}
                            gridData={gridData}
                        />
                    ))}

                    {/* Hero hit VFX — mounted per thread */}
                    {threads.map((thread) => (
                        <HeroImpactVFX
                            key={`vfx_${thread.id}`}
                            thread={thread}
                            gridData={gridData}
                        />
                    ))}

                    {/* Vykreslenie projektilov kúziel */}
                    <SpellProjectile3D threads={threads} gridData={gridData} />

                    {/* expanding 3D golden sphere mesh for Ultimate actions */}
                    <UltimateOrbVFX active={ultimateFlash} />

                    {/* Vykreslenie neónových ohraničení pre všetkých 9 Metapozícií */}
                    {metapositions.map((nodes, idx) => (
                        <MetapositionBorder3D 
                            key={`border_${idx}`} 
                            nodes={nodes} 
                            isHovered={hoveredNode?.macroIndex === idx}
                        />
                    ))}

                    {/* Aktívne efekty prechodu hrdinu medzi biómami */}
                    {activeTransitions?.map(t => (
                        <BiomeTransitionVFX 
                            key={t.id}
                            position={t.position}
                            color={t.color}
                            onComplete={() => onTransitionComplete(t.id)}
                        />
                    ))}
                </ArenaGroup>

                {/* Kognitívna Termodynamika - Dynamický Post-processing podľa Entropy */}
                <EffectComposer disableNormalPass>
                    <AestheticCompositor entropy={entropy} isLowPower={isLowPower} />
                </EffectComposer>
            </Canvas>
        </div>
    );
}
