import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';
import { generate3DGrid } from '../utils/HexMath3D';
import HexagonNode3D from './HexagonNode3D';
import MetapositionBorder3D from './MetapositionBorder3D';
import ThreadMiniature from './ThreadMiniature';
import SpellProjectile3D from './SpellProjectile3D';
import HeroImpactVFX from './HeroImpactVFX';
import ArenaAmbientParticles from './ArenaAmbientParticles';
import HeroAura from './HeroAura';
import { AdrenalineDirector } from '../../../shared/src/index';
import AestheticCompositor from './AestheticCompositor';
import DramaticEnvironment from './DramaticEnvironment';
import EnergyShieldDome from './EnergyShieldDome';
import { PALETTE, LIGHTING, WORLD } from '../design/worldDesign';
import { PORTAL_NODE_ID, computePropPlacements } from '../design/propPlacement';
import CrystalSpire3D from './world/CrystalSpire3D';
import BlossomTree3D from './world/BlossomTree3D';
import AcidPool3D from './world/AcidPool3D';
import RockSpikes3D from './world/RockSpikes3D';
import DesertStones3D from './world/DesertStones3D';
import PortalVortex3D from './world/PortalVortex3D';
import { TownSanctuaryMonument3D, DirectionalCompassRose3D } from './world/ProceduralAssetTemplates3D';

const PROP_COMPONENTS = {
    CRYSTAL_SPIRE: CrystalSpire3D,
    BLOSSOM_TREE: BlossomTree3D,
    ACID_POOL: AcidPool3D,
    ROCK_SPIKES: RockSpikes3D,
    DESERT_STONES: DesertStones3D,
};

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

// ─── Sun Sphere for GodRays ────────────────────────────────────────────────────
function SunSphere({ sunRef }) {
    const meshRef = useRef();
    
    useFrame((state) => {
        const time = state.clock.elapsedTime;
        // Slowly orbit the sun
        const angle = time * 0.02;
        const x = Math.cos(angle) * 35;
        const y = 25 + Math.sin(time * 0.1) * 2;
        const z = Math.sin(angle) * 35;
        
        if (meshRef.current) {
            meshRef.current.position.set(x, y, z);
        }
        if (sunRef) {
            sunRef.current = meshRef.current;
        }
    });
    
    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[2.5, 32, 32]} />
            <meshBasicMaterial
                color="#fff4e0"
                transparent
                opacity={0.9}
                fog={false}
            />
            {/* Inner glow */}
            <pointLight
                position={[0, 0, 0]}
                intensity={0.75}
                color="#fff4e0"
                distance={80}
                decay={1.5}
            />
        </mesh>
    );
}

function DynamicCameraController({ gameMode, threads, gridData, map, shakeIntensity, isUltimate }) {
    const { camera, controls } = useThree();
    const desiredTarget = useRef(new THREE.Vector3(0, 0, 0));

    const activePlayer = useMemo(() => {
        return threads.find(t => t.type === 'PLAYER' && t.health > 0) || null;
    }, [threads]);

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

    useEffect(() => {
        if (gameMode === 'SANDBOX') {
            desiredTarget.current.set(0, 0, 0);
        } else {
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
        if (controls) {
            controls.target.lerp(desiredTarget.current, delta * 3.5);
            controls.update();
        }

        let targetFov = isUltimate ? 34 : (gameMode === 'SANDBOX' ? 45 : 38);
        if (gameMode !== 'SANDBOX' && !isUltimate) {
            if (activeBiome === 'TOXIC_SWAMP') {
                targetFov = 34;
            } else if (activeBiome === 'GLACIER') {
                targetFov = 48;
            }
        }

        if (Math.abs(camera.fov - targetFov) > 0.1) {
            camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, delta * 4.0);
            camera.updateProjectionMatrix();
        }

        if (shakeIntensity > 0) {
            camera.position.x += (Math.random() - 0.5) * shakeIntensity * 0.15;
            camera.position.y += (Math.random() - 0.5) * shakeIntensity * 0.15;
            camera.position.z += (Math.random() - 0.5) * shakeIntensity * 0.15;
        }

        if (gameMode === 'SANDBOX' && !isUltimate) {
            void state.clock.getElapsedTime();
        if (gameMode === 'SANDBOX' && !isUltimate) {
            desiredTarget.current.set(0, 0, 0);
        }
        }
    });

    return null;
}

export default function CanvasRenderer3D({ entropy = 0.4, selectedNode, onNodeClick, threads = [], shakeIntensity = 0, turnsElapsed = 1, map = [], terrainTelemetry = null, ultimateFlash = false, gameMode = 'SANDBOX' }) {
    const gridData = useMemo(() => generate3DGrid(), []);
    
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

    const metapositions = useMemo(() => {
        const groups = Array.from({ length: 9 }, () => []);
        gridData.forEach(node => groups[node.macroIndex].push(node));
        return groups;
    }, [gridData]);

    const portalNode = useMemo(() => gridData.find(n => n.id === PORTAL_NODE_ID), [gridData]);
    const townNode = useMemo(() => gridData.find(n => n.id.toLowerCase() === 'm0_s0'), [gridData]);
    const direNode = useMemo(() => gridData.find(n => n.id.toLowerCase() === 'm8_s0'), [gridData]);
    const propPlacements = useMemo(() => computePropPlacements(gridData), [gridData]);

    const cameraPosition = isMobile ? [0, 20, 20] : [0, 15, 15];
    const cameraFov = isMobile ? 55 : 45;

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
            return 0.3;
        }
        return 0.4;
    }, [map, threads]);

    // Sun ref for GodRays post-processing
    const sunRef = useRef(null);
    // Ref for AestheticCompositor to access sun
    const compositorRef = useRef(null);

    return (
        <div className="w-full h-full relative bg-[color:var(--space-bg)]">
            <Canvas 
                shadows="percentage-closer"
                gl={{ 
                    antialias: true,
                    alpha: false,
                    powerPreference: 'high-performance',
                    toneMapping: THREE.NoToneMapping,
                    toneMappingExposure: 0.82,
                }}
                dpr={[1, 1.25]}
            >
                {/* ═══ Layer 1: Deep Space Background ═══ */}
                <color attach="background" args={[PALETTE.space.background]} />
                <fog attach="fog" args={[WORLD.fog.color, WORLD.fog.near, WORLD.fog.far]} />
                
                {/* ═══ Layer 2: Dramatic Atmospheric Environment ═══ */}
                <DramaticEnvironment entropy={entropy} />
                
                {/* ═══ Layer 3: Camera + Controls ═══ */}
                <PerspectiveCamera makeDefault position={cameraPosition} fov={cameraFov} near={0.1} far={1000} />
                <OrbitControls 
                    makeDefault
                    enableDamping 
                    maxPolarAngle={Math.PI / 2.5}
                    minDistance={2} 
                    maxDistance={150}
                />

                <DynamicCameraController 
                    gameMode={gameMode} 
                    threads={threads} 
                    gridData={gridData} 
                    map={map}
                    shakeIntensity={shakeIntensity} 
                    isUltimate={ultimateFlash} 
                />

                {/* ═══ Layer 4: Dramatic HDR Lighting ═══ */}
                <ambientLight intensity={LIGHTING.ambient.intensity * 0.8} color={LIGHTING.ambient.color} />
                
                {/* Key Light — warm directional sun */}
                <directionalLight
                    castShadow
                    position={[6, 42, 8]}
                    intensity={LIGHTING.key.intensity * 0.65}
                    color={LIGHTING.key.color}
                    shadow-mapSize={[1024, 1024]}
                    shadow-camera-near={0.5}
                    shadow-camera-far={100}
                    shadow-camera-left={-40}
                    shadow-camera-right={40}
                    shadow-camera-top={40}
                    shadow-camera-bottom={-40}
                    shadow-bias={-0.0005}
                    shadow-normalBias={0.02}
                />
                
                {/* Fill Light — cool blue */}
                <directionalLight
                    position={LIGHTING.fill.position}
                    intensity={LIGHTING.fill.intensity * 0.75}
                    color={LIGHTING.fill.color}
                />
                
                {/* Rim Light — cyan backlight */}
                <directionalLight
                    position={LIGHTING.rim?.position || [0, 8, -15]}
                    intensity={(LIGHTING.rim?.intensity || 0.6) * 0.75}
                    color={LIGHTING.rim?.color || '#2dd3f1'}
                />
                
                {/* Portal accent — central glow */}
                <pointLight
                    position={[0, 32, 0]}
                    intensity={LIGHTING.portalLight.intensity * 0.35}
                    color={LIGHTING.portalLight.color}
                    distance={LIGHTING.portalLight.distance * 2}
                    decay={2}
                />
                
                {/* Faction accent lights — colored fills from edges */}
                <pointLight position={[-15, 5, -15]} intensity={0.5} color="#00eeff" distance={25} decay={2} />
                <pointLight position={[15, 5, 15]} intensity={0.5} color="#39ff14" distance={25} decay={2} />
                <pointLight position={[15, 5, -15]} intensity={0.3} color="#ffcc00" distance={20} decay={2} />

                {/* ═══ Layer 5: Sun Sphere for GodRays ═══ */}
                {false && <SunSphere sunRef={sunRef} />}
                <hemisphereLight args={['#dce8f7', '#1a1d24', 0.65]} position={[0, 50, 0]} />

                {/* ═══ Layer 6: 3D Scene — Hex Tiles + Props + Characters ═══ */}
                <ArenaGroup shakeIntensity={shakeIntensity}>
                    {gridData.map((node) => {
                        const isCollapsing = collapsingNodeIds.includes(node.id);
                        const serverChunk = map?.find(c => c.id === node.macroIndex);
                        const serverBlock = serverChunk?.blocks?.find(b => b.id === node.subIndex);
                        const hasChest = !!serverBlock?.hasOpportunity || !!serverBlock?.hasChest;
                        const hasTrap = serverBlock?.hasTrap || null;
                        return (
                            <HexagonNode3D
                                key={node.id}
                                node={node}
                                isHovered={hoveredNode?.id === node.id || hoveredNode?.macroIndex === node.macroIndex}
                                isSelected={selectedNode?.id === node.id}
                                onHover={setHoveredNode}
                                onClick={onNodeClick}
                                isCollapsing={isCollapsing}
                                entropy={entropy}
                                hasChest={hasChest}
                                hasTrap={hasTrap}
                                terrainTelemetry={terrainTelemetry}
                            />
                        );
                    })}

                    {gridData.filter(n => propPlacements.has(n.id) && !collapsingNodeIds.includes(n.id)).map(n => {
                        const PropComponent = PROP_COMPONENTS[propPlacements.get(n.id)];
                        if (!PropComponent) return null;
                        return (
                            <group key={`prop_${n.id}`} position={[n.position[0], n.position[1] + 0.45, n.position[2]]}>
                                <PropComponent seed={n.macroIndex * 7 + n.subIndex + 1} />
                            </group>
                        );
                    })}

                    <ArenaAmbientParticles 
                        entropy={entropy} 
                        hazardIndex={currentHazardIndex}
                    />

                    {portalNode && (
                        <PortalVortex3D position={[portalNode.position[0], portalNode.position[1] + 0.45, portalNode.position[2]]} />
                    )}

                    {/* ═══ Energy Shield Dome over arena ═══ */}
                    <EnergyShieldDome />
                    {townNode && <TownSanctuaryMonument3D position={[townNode.position[0], townNode.position[1] + 0.42, townNode.position[2]]} />}
                    {direNode && <TownSanctuaryMonument3D position={[direNode.position[0], direNode.position[1] + 0.42, direNode.position[2]]} />}
                    {selectedNode && <DirectionalCompassRose3D position={selectedNode.position} />}

                    {threads.map((thread) => (
                        <HeroAura
                            key={`aura_${thread.id}`}
                            thread={thread}
                            gridData={gridData}
                        />
                    ))}

                    {threads.map((thread) => (
                        <ThreadMiniature 
                            key={thread.id}
                            thread={thread}
                            gridData={gridData}
                        />
                    ))}

                    {threads.map((thread) => (
                        <HeroImpactVFX
                            key={`vfx_${thread.id}`}
                            thread={thread}
                            gridData={gridData}
                        />
                    ))}

                    <SpellProjectile3D threads={threads} gridData={gridData} />
                    <UltimateOrbVFX active={ultimateFlash} />

                    {metapositions.map((nodes, idx) => (
                        <MetapositionBorder3D 
                            key={`border_${idx}`} 
                            nodes={nodes} 
                            isHovered={hoveredNode?.macroIndex === idx}
                        />
                    ))}
                </ArenaGroup>

                {/* ═══ Layer 7: Dramatic Post-Processing Pipeline ═══ */}
                <EffectComposer disableNormalPass multisampling={0}>
                    <AestheticCompositor 
                        ref={compositorRef}
                        entropy={entropy} 
                        sunRef={sunRef}
                        intensity={0.75}
                    />
                </EffectComposer>
            </Canvas>
        </div>
    );
}
