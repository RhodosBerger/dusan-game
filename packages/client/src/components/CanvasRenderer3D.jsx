import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Glitch, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { GlitchMode } from 'postprocessing';
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
import VolumetricFog3D from './VolumetricFog3D';

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

export default function CanvasRenderer3D({ entropy = 0.4, selectedNode, onNodeClick, threads = [], aestheticTheme = 'CYBER_NEON', shakeIntensity = 0, turnsElapsed = 1, map = [], terrainTelemetry = null, ultimateFlash = false }) {
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

    // Zoskupenie uzlov podľa metapozícií kvôli efektívnemu vykresleniu hraníc
    const metapositions = useMemo(() => {
        const groups = Array.from({ length: 9 }, () => []);
        gridData.forEach(node => groups[node.macroIndex].push(node));
        return groups;
    }, [gridData]);

    const cameraPosition = isMobile ? [0, 20, 20] : [0, 15, 15];
    const cameraFov = isMobile ? 55 : 45;

    return (
        <div className="w-full h-full relative bg-[#0a0a0f]">
            <Canvas shadows>
                {/* Kamera dynamicky prispôsobená pre mobilné zariadenia */}
                <PerspectiveCamera makeDefault position={cameraPosition} fov={cameraFov} near={0.1} far={1000} />
                <OrbitControls 
                    enableDamping 
                    maxPolarAngle={Math.PI / 2.5} // Zamedzí pohľadu z podlahy
                    minDistance={2} 
                    maxDistance={150} 
                />

                {/* Dynamické PBR Osvetlenie */}
                <ambientLight intensity={0.2} color="#4a4a6a" />
                <directionalLight
                    castShadow
                    position={[10, 20, 10]}
                    intensity={1.5}
                    color="#ffffff"
                    shadow-mapSize={[2048, 2048]}
                />
                {/* Faction accent lights — shift with aestheticTheme */}
                <pointLight position={[-10, 5, -10]} intensity={0.5} color="#00ffff" />
                <pointLight
                    position={[10, 3, -10]}
                    intensity={0.3 + entropy * 0.4}
                    color={
                        aestheticTheme === 'GHOSTLY_VOID'   ? '#8800ff' :
                        aestheticTheme === 'VIBRANT_BAROQUE' ? '#ff6600' :
                        aestheticTheme === 'MONOCHROME_RETRO'? '#00ff44' :
                        '#ff00aa'
                    }
                />
                <pointLight
                    position={[0, 8, 0]}
                    intensity={0.15 + entropy * 0.25}
                    color="#ffffff"
                />

                {/* 3D Scéna - Vykreslenie 63 Hexov */}
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
                                aestheticTheme={aestheticTheme}
                                isCollapsing={isCollapsing}
                                entropy={entropy}
                                hasChest={hasChest}
                                hasTrap={hasTrap}
                                terrainTelemetry={terrainTelemetry}
                            />
                        );
                    })}

                    {/* Floating mana particles across the whole arena */}
                    <ArenaAmbientParticles aestheticTheme={aestheticTheme} entropy={entropy} />

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
                </ArenaGroup>

                {/* Kognitívna Termodynamika - Dynamický Post-processing podľa Entropy */}
                <EffectComposer disableNormalPass>
                    <AestheticCompositor entropy={entropy} terrainTelemetry={terrainTelemetry} />
                </EffectComposer>
            </Canvas>
        </div>
    );
}
