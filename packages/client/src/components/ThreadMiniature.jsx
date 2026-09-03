import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BiomeEngine, AethericDiceEngine } from '../../../shared/src/index';
import { KeyframeAnimationExtension } from '../utils/KeyframeAnimationExtension';

const textureLoader = new THREE.TextureLoader();

// Hero portrait textures
const heroTextures = {
    thread_king_ai:    textureLoader.load('/heroes/crystal_hero.png'),
    thread_hacker_root: textureLoader.load('/heroes/toxic_hero.png'),
};

// ─── Faction tint palette ─────────────────────────────────────────────────────
const FACTION_TINT = {
    crystal: '#d0ffff',
    toxic:   '#d0ffd0',
    druid:   '#fff0aa',
    void:    '#e8ccff',
    npc:     '#ff5577',
};

function getFaction(id, type) {
    if (type === 'NPC') return 'npc';
    if (!id) return 'crystal';
    if (id.includes('king'))   return 'crystal';
    if (id.includes('hacker')) return 'toxic';
    if (id.includes('void'))   return 'void';
    return 'druid';
}

// ─── FloatingDice3D ───────────────────────────────────────────────────────────
// Renders D12 (dodecahedron) or D6 (cube) wireframe mesh floating above the hero's portrait
function FloatingDice3D({ categoryKey, tintColor }) {
    const meshRef = useRef();
    const timeRef = useRef(0);
    const isD12 = categoryKey === 'AETHER_SPELLWEAVER' || categoryKey === 'GIGANTIC_BEHEMOTH';

    useFrame((state, delta) => {
        timeRef.current += delta;
        if (meshRef.current) {
            meshRef.current.rotation.x = timeRef.current * 1.2;
            meshRef.current.rotation.y = timeRef.current * 1.5;
            meshRef.current.position.y = 2.1 + Math.sin(timeRef.current * 3.0) * 0.08;
        }
    });

    return (
        <mesh ref={meshRef} position={[0, 2.1, 0]}>
            {isD12 ? (
                <dodecahedronGeometry args={[0.18]} />
            ) : (
                <boxGeometry args={[0.18, 0.18, 0.18]} />
            )}
            <meshBasicMaterial 
                color={tintColor} 
                wireframe 
                transparent 
                opacity={0.7} 
            />
        </mesh>
    );
}

// ─── FloatingEquippedWeapon3D ─────────────────────────────────────────────────
// Renders small rotating neon components next to the hero representing equipped weapons and harvesting tools
function FloatingEquippedWeapon3D({ items }) {
    const groupRef = useRef();
    const timeRef = useRef(0);

    const hasWeapon = items?.some(i => i.itemKey.includes('SABER') || i.itemKey.includes('BLASTER'));
    const hasTool = items?.some(i => i.itemKey.includes('HARVESTER') || i.itemKey.includes('WRENCH'));

    useFrame((state, delta) => {
        timeRef.current += delta;
        if (groupRef.current) {
            groupRef.current.rotation.y = timeRef.current * 1.8;
            groupRef.current.position.y = 0.8 + Math.sin(timeRef.current * 2.2) * 0.05;
        }
    });

    if (!hasWeapon && !hasTool) return null;

    return (
        <group ref={groupRef}>
            {hasWeapon && (
                <group position={[0.7, 0, 0]} rotation={[0, 0, Math.PI / 6]}>
                    {/* Glowing Blade */}
                    <mesh castShadow>
                        <boxGeometry args={[0.04, 0.45, 0.02]} />
                        <meshStandardMaterial 
                            color="#ff00a0" 
                            emissive="#ff00a0" 
                            emissiveIntensity={1.5} 
                        />
                    </mesh>
                    {/* Hilt */}
                    <mesh position={[0, -0.28, 0]} castShadow>
                        <cylinderGeometry args={[0.015, 0.015, 0.12, 8]} />
                        <meshStandardMaterial color="#333333" roughness={0.8} />
                    </mesh>
                    {/* Guard */}
                    <mesh position={[0, -0.21, 0]} castShadow>
                        <boxGeometry args={[0.12, 0.02, 0.02]} />
                        <meshStandardMaterial color="#777777" roughness={0.5} />
                    </mesh>
                </group>
            )}

            {hasTool && (
                <group position={[-0.7, 0, 0]}>
                    {/* Rotating Harvester Ring */}
                    <mesh castShadow>
                        <torusGeometry args={[0.16, 0.02, 8, 24]} />
                        <meshStandardMaterial 
                            color="#39ff14" 
                            emissive="#39ff14" 
                            emissiveIntensity={1.2} 
                        />
                    </mesh>
                    {/* Core Hub */}
                    <mesh castShadow>
                        <sphereGeometry args={[0.06, 8, 8]} />
                        <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.2} />
                    </mesh>
                </group>
            )}
        </group>
    );
}

// ─── GlitchCore3D ─────────────────────────────────────────────────────────────
// Pulsing glitch core with an orbit ring for neutral AI monsters
function GlitchCore3D({ tintColor }) {
    const coreRef = useRef();
    const ringRef = useRef();
    const timeRef = useRef(0);

    useFrame((state, delta) => {
        timeRef.current += delta;
        const t = timeRef.current;
        if (coreRef.current) {
            coreRef.current.position.y = 0.8 + Math.sin(t * 3.5) * 0.1;
            coreRef.current.rotation.x = t * 2.0;
            coreRef.current.rotation.y = t * 2.5;
            
            // Pulsing scale
            const scale = 0.65 + Math.sin(t * 8.0) * 0.08;
            coreRef.current.scale.set(scale, scale, scale);
        }
        if (ringRef.current) {
            ringRef.current.position.y = 0.8 + Math.sin(t * 3.5) * 0.1;
            ringRef.current.rotation.y = -t * 1.5;
            ringRef.current.rotation.z = t * 0.8;
        }
    });

    return (
        <group>
            {/* Octahedron Core - glowing red */}
            <mesh ref={coreRef}>
                <octahedronGeometry args={[0.3]} />
                <meshStandardMaterial 
                    color={tintColor} 
                    emissive={tintColor} 
                    emissiveIntensity={2.0} 
                    roughness={0.1}
                />
            </mesh>

            {/* Glowing Orbit Ring */}
            <mesh ref={ringRef} rotation={[Math.PI / 4, 0, 0]}>
                <torusGeometry args={[0.5, 0.03, 6, 24]} />
                <meshStandardMaterial 
                    color="#ff5500" 
                    emissive="#ff5500" 
                    emissiveIntensity={1.5} 
                />
            </mesh>
            
            {/* Small floating spike orbits */}
            <mesh position={[0.4, 0.8, 0.4]}>
                <sphereGeometry args={[0.04, 6, 6]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
        </group>
    );
}

function BiomeSplash({ position, color, onDone }) {
    const pointsRef = useRef();
    const count = 16;
    const timeRef = useRef(0);
    const DURATION = 0.6; // short burst

    const [velocities] = useMemo(() => {
        const vels = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.8 + Math.random() * 1.5;
            vels.push(new THREE.Vector3(
                Math.cos(angle) * speed,
                0.5 + Math.random() * 2.0, // jump up
                Math.sin(angle) * speed
            ));
        }
        return [vels];
    }, []);

    const [positions] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = position[0];
            pos[i * 3 + 1] = position[1];
            pos[i * 3 + 2] = position[2];
        }
        return [pos];
    }, [position]);

    useFrame((state, delta) => {
        timeRef.current += delta;
        const t = timeRef.current / DURATION;
        if (t >= 1.0) {
            onDone();
            return;
        }

        if (!pointsRef.current) return;
        const posAttr = pointsRef.current.geometry.attributes.position;
        for (let i = 0; i < count; i++) {
            const vel = velocities[i];
            const x = posAttr.getX(i) + vel.x * delta;
            const y = posAttr.getY(i) + vel.y * delta - 4.9 * delta * delta * timeRef.current;
            const z = posAttr.getZ(i) + vel.z * delta;
            posAttr.setXYZ(i, x, y, z);
        }
        posAttr.needsUpdate = true;
        
        if (pointsRef.current.material) {
            pointsRef.current.material.opacity = 1.0 - t;
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute 
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial 
                color={color} 
                size={0.12} 
                transparent 
                opacity={1.0}
            />
        </points>
    );
}

// ─── FootprintGlow ────────────────────────────────────────────────────────────
// A small flat disc that lingers on the ground and fades out, marking old positions
function FootprintGlow({ position, color }) {
    const meshRef = useRef();
    const lifeRef = useRef(1.0);   // 1.0 → 0.0

    useFrame((state, delta) => {
        lifeRef.current -= delta * 0.9; // fade in ~1.1 s
        if (!meshRef.current) return;
        const life = Math.max(0, lifeRef.current);
        if (meshRef.current.material) {
            meshRef.current.material.opacity = life * 0.45;
        }
        const scale = 0.5 + (1.0 - life) * 0.4;
        meshRef.current.scale.set(scale, scale, scale);
    });

    return (
        <mesh
            ref={meshRef}
            position={[position[0], position[1] + 0.02, position[2]]}
            rotation={[Math.PI / 2, 0, 0]}
        >
            <circleGeometry args={[0.55, 24]} />
            <meshBasicMaterial
                color={color}
                transparent
                opacity={0.45}
                depthWrite={false}
            />
        </mesh>
    );
}

// ─── ThreadMiniature ─────────────────────────────────────────────────────────
export default function ThreadMiniature({ thread, gridData }) {
    const groupRef   = useRef();
    const spriteRef  = useRef();

    // Track footprint positions (up to 3 historical)
    const footprintRef = useRef([]);
    const lastHexRef   = useRef(null);
    const [splashes, setSplashes] = useState([]);

    // Keyframe Animation States
    const activeAnimationRef = useRef({
        keyframes: null,
        progress: 1.0,
        startPos: null,
        endPos: null
    });
    
    // Trail decoys composition state (shadow silhouettes)
    const [decoyTrail, setDecoyTrail] = useState([]);

    // Active raster VFX particles
    const [rasterParticles, setRasterParticles] = useState([]);

    // Idle float animation
    const floatTimeRef = useRef(Math.random() * Math.PI * 2); // stagger heroes
    const isLowHp      = (thread?.health ?? 99) <= 5;

    const faction = useMemo(() => getFaction(thread?.id, thread?.type), [thread?.id, thread?.type]);
    const tint    = FACTION_TINT[faction] || FACTION_TINT.crystal;
    const isNPC   = thread?.type === 'NPC';

    // Target world position from current hex
    const targetPos = useMemo(() => {
        if (!thread.position || thread.position.meta === null || thread.position.hex === null) {
            return new THREE.Vector3(0, -100, 0);
        }
        const node = gridData.find(
            n => n.macroIndex === thread.position.meta && n.subIndex === thread.position.hex
        );
        if (!node) return new THREE.Vector3(0, -100, 0);
        return new THREE.Vector3(node.position[0], node.position[1] + 0.4, node.position[2]);
    }, [thread.position, gridData]);

    const texture = useMemo(() => {
        if (thread.id.includes('king')) return heroTextures.thread_king_ai;
        return heroTextures.thread_hacker_root;
    }, [thread.id]);

    // Determine faction animation profile
    const animProfile = useMemo(() => {
        if (thread.id.includes('king')) return 'slow_walk';
        if (thread.id.includes('hacker')) return 'slime_trail';
        if (thread.id.includes('void')) return 'teleport_dash';
        return 'earth_glide';
    }, [thread.id]);

    // Listen for target coordinate changes to run generator
    useEffect(() => {
        if (!targetPos || targetPos.y < -50) return;
        
        if (prevTargetPosRef.current === null) {
            prevTargetPosRef.current = targetPos.clone();
            if (groupRef.current) {
                groupRef.current.position.copy(targetPos);
            }
            return;
        }

        const start = prevTargetPosRef.current.clone();
        const end = targetPos.clone();

        if (start.distanceTo(end) > 0.1) {
            const keys = KeyframeAnimationExtension.generateKeyframes(
                [start.x, start.y, start.z],
                [end.x, end.y, end.z],
                animProfile,
                thread.isStealthed
            );
            activeAnimationRef.current = {
                keyframes: keys,
                progress: 0.0,
                startPos: start,
                endPos: end
            };
        }

        prevTargetPosRef.current = targetPos.clone();
    }, [targetPos, animProfile, thread.isStealthed]);

    const prevTargetPosRef = useRef(null);

    useFrame((state, delta) => {
        floatTimeRef.current += delta;
        const t = floatTimeRef.current;
        const isStealthed = thread.isStealthed;

        const anim = activeAnimationRef.current;
        let currentOpacity = isStealthed ? 0.35 : 1.0;
        let currentScale = [1, 1, 1];
        let currentRotation = [0, 0, 0];

        // ── Keyframe Animation Player ─────────────────────────────────────
        if (anim && anim.keyframes && anim.progress < 1.0) {
            const speed = isStealthed ? 2.2 : 1.5; // Stealth movement is faster/swifter
            anim.progress = Math.min(1.0, anim.progress + delta * speed);

            const frame = KeyframeAnimationExtension.interpolate(anim.keyframes, anim.progress);
            if (frame && groupRef.current) {
                groupRef.current.position.set(frame.position[0], frame.position[1], frame.position[2]);
                currentOpacity = frame.opacity;
                currentScale = frame.scale;
                currentRotation = frame.rotation;

                // Spawning decoy silhouettes in composition
                if (isStealthed) {
                    const decoys = KeyframeAnimationExtension.generateDecoyTrail(anim.keyframes, anim.progress, 3, 0.12);
                    setDecoyTrail(decoys);
                }

                // Spawn floating raster VFX particles
                if (frame.vfxType !== 'none' && Math.random() < 0.45) {
                    const vfxColor = isStealthed ? '#00e5ff' : tint;
                    setRasterParticles(prev => [
                        ...prev,
                        {
                            id: `vfx_p_${Date.now()}_${Math.random()}`,
                            position: [
                                frame.position[0] + (Math.random() - 0.5) * 0.4,
                                frame.position[1] + (Math.random() - 0.5) * 0.4,
                                frame.position[2] + (Math.random() - 0.5) * 0.4
                            ],
                            velocity: [
                                (Math.random() - 0.5) * 0.4,
                                Math.random() * 0.9 + 0.5,
                                (Math.random() - 0.5) * 0.4
                            ],
                            color: vfxColor,
                            type: frame.vfxType,
                            life: 1.0
                        }
                    ]);
                }
            }

            if (anim.progress >= 1.0) {
                setDecoyTrail([]);
            }
        } else {
            if (groupRef.current) {
                groupRef.current.position.lerp(targetPos, 0.1);
            }
            setDecoyTrail([]);
        }

        // ── Idle float animation on sprite ────────────────────────────────
        if (spriteRef.current) {
            const bob = Math.sin(t * 1.8) * 0.12 + Math.sin(t * 3.1) * 0.03;
            spriteRef.current.position.y = 0.8 + bob;
            spriteRef.current.rotation.set(currentRotation[0], currentRotation[1], currentRotation[2]);

            if (isLowHp && spriteRef.current.material) {
                const flicker = 0.5 + 0.5 * Math.sign(Math.sin(t * 75.4));
                spriteRef.current.material.opacity = 0.6 + flicker * 0.4;
            } else if (spriteRef.current.material) {
                if (isStealthed) {
                    // Hologram shimmer while standing still
                    const stealthShimmer = 0.28 + Math.sin(t * 18) * 0.06;
                    spriteRef.current.material.opacity = stealthShimmer;
                } else {
                    spriteRef.current.material.opacity = currentOpacity;
                }
            }

            // Apply scale
            spriteRef.current.scale.set(1.8 * currentScale[0], 1.8 * currentScale[1], 1.0 * currentScale[2]);
        }

        // Update active raster particles
        if (rasterParticles.length > 0) {
            setRasterParticles(prev => 
                prev.map(p => ({
                    ...p,
                    position: [
                        p.position[0] + p.velocity[0] * delta,
                        p.position[1] + p.velocity[1] * delta,
                        p.position[2] + p.velocity[2] * delta
                    ],
                    life: p.life - delta * 1.8
                })).filter(p => p.life > 0)
            );
        }

        // ── Footprint trail: record position ──────────────────────────────
        const curHexKey = `${thread.position?.meta}_${thread.position?.hex}`;
        if (curHexKey !== lastHexRef.current && targetPos.y > -50) {
            const worldPt = groupRef.current
                ? [groupRef.current.position.x, groupRef.current.position.y - 0.38, groupRef.current.position.z]
                : [targetPos.x, targetPos.y - 0.38, targetPos.z];

            footprintRef.current = [
                { id: Date.now(), pos: worldPt, color: tint },
                ...footprintRef.current,
            ].slice(0, 3);

            if (lastHexRef.current !== null && thread.position?.meta !== null && thread.position?.hex !== null) {
                const destBiome = BiomeEngine.getBiomeForHex(thread.position.meta, thread.position.hex)?.biome;
                const splashColors = {
                    GLACIER: '#a0d8f0',
                    TOXIC_SWAMP: '#d800ff',
                    LUSH_FOREST: '#39ff14',
                    DESERT: '#ffaa44',
                    BARRENS: '#8b5e00'
                };
                const splashColor = splashColors[destBiome] || '#00ffff';

                setSplashes(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    pos: [targetPos.x, targetPos.y - 0.38, targetPos.z],
                    color: splashColor
                }]);
            }

            lastHexRef.current = curHexKey;
        }
    });

    return (
        <>
            {/* ── Footprint glows (rendered outside the hero group so they stay on ground) */}
            {footprintRef.current.map(fp => (
                <FootprintGlow key={fp.id} position={fp.pos} color={fp.color} />
            ))}

            {/* ── Biome transition splashes */}
            {splashes.map(s => (
                <BiomeSplash
                    key={s.id}
                    position={s.pos}
                    color={s.color}
                    onDone={() => setSplashes(prev => prev.filter(x => x.id !== s.id))}
                />
            ))}

            {/* ── Ghost Decoy silhouettes composition */}
            {decoyTrail.map(decoy => (
                <group key={decoy.id} position={decoy.position}>
                    <sprite scale={[1.8 * decoy.scale[0], 1.8 * decoy.scale[1], 1.0]}>
                        <spriteMaterial
                            map={texture}
                            color="#00ffff"
                            transparent
                            opacity={decoy.opacity}
                            blending={THREE.AdditiveBlending}
                        />
                    </sprite>
                </group>
            ))}

            {/* ── Active Raster Particles VFX */}
            {rasterParticles.map(p => (
                <group key={p.id} position={p.position}>
                    <mesh rotation={[0, 0, Math.random() * Math.PI]}>
                        <planeGeometry args={[0.08, 0.08]} />
                        <meshBasicMaterial
                            color={p.color}
                            transparent
                            opacity={p.life * 0.85}
                            blending={THREE.AdditiveBlending}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                </group>
            ))}

            {/* ── Hero group (LERP-tracked or keyframe animated) */}
            <group ref={groupRef} position={[targetPos.x, -5, targetPos.z]}>
                {/* Base pedestal */}
                <mesh castShadow receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.5, 0.55, 0.1, 16]} />
                    <meshStandardMaterial
                        color={isNPC ? "#2a0005" : "#1a1a1a"}
                        roughness={0.9}
                        metalness={0.1}
                    />
                </mesh>

                {/* Low-HP pulse ring on base */}
                {isLowHp && (
                    <LowHpBaseRing faction={faction} />
                )}

                {isNPC ? (
                    /* Pulsing crimson Glitch Core instead of billboard */
                    <GlitchCore3D tintColor="#ff0055" />
                ) : (
                    <>
                        {/* Billboard sprite with idle float applied via spriteRef */}
                        <sprite ref={spriteRef} position={[0, 0.8, 0]} scale={[1.8, 1.8, 1.0]}>
                            <spriteMaterial
                                map={texture}
                                color={tint}
                                transparent
                                alphaTest={0.1}
                                opacity={1.0}
                            />
                        </sprite>

                        {/* Floating Aetheric Dice representation based on class */}
                        <FloatingDice3D categoryKey={AethericDiceEngine.getCategoryByHero(thread.id)} tintColor={tint} />

                        {/* Equipped weapons & harvesting tools purchased at Town Shop */}
                        <FloatingEquippedWeapon3D items={thread.items} />
                    </>
                )}
            </group>
        </>
    );
}

// ─── LowHpBaseRing ────────────────────────────────────────────────────────────
// Crimson pulsing ring around the base when HP is critical
function LowHpBaseRing({ faction }) {
    const meshRef = useRef();
    const timeRef = useRef(0);
    const color   = faction === 'crystal' ? '#ff4444' : faction === 'toxic' ? '#ff6600' : '#ff2222';

    useFrame((state, delta) => {
        timeRef.current += delta;
        if (!meshRef.current) return;
        const pulse = 0.9 + 0.4 * Math.abs(Math.sin(timeRef.current * 4.5));
        meshRef.current.scale.setScalar(pulse);
        if (meshRef.current.material) {
            meshRef.current.material.opacity = 0.5 + 0.4 * Math.abs(Math.sin(timeRef.current * 4.5));
        }
    });

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
            <torusGeometry args={[0.52, 0.06, 6, 32]} />
            <meshBasicMaterial
                color={color}
                transparent
                opacity={0.8}
                depthWrite={false}
            />
        </mesh>
    );
}
