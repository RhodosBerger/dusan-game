import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ──────────────────────────────────────────────────────────────────────────────
// Faction visual profiles — drives orb color, trail color, and shard shape
// ──────────────────────────────────────────────────────────────────────────────
const FACTION_VFX = {
    crystal: {
        orbColor:   '#00eeff',
        glowColor:  '#0055aa',
        trailColor: '#00aabb',
        shardColor: '#ffffff',
        orbScale:   0.28,
        speed:      2.8,
        trailLen:   12,
    },
    toxic: {
        orbColor:   '#39ff14',
        glowColor:  '#004400',
        trailColor: '#66ff33',
        shardColor: '#ccff88',
        orbScale:   0.24,
        speed:      3.2,
        trailLen:   14,
    },
    druid: {
        orbColor:   '#ffcc00',
        glowColor:  '#663300',
        trailColor: '#ff9900',
        shardColor: '#fffacd',
        orbScale:   0.26,
        speed:      2.5,
        trailLen:   10,
    },
    ultimate: {   // Override for ultimate cards — bigger, slower, dramatic
        orbColor:   '#ff00ff',
        glowColor:  '#330033',
        trailColor: '#cc00cc',
        shardColor: '#ffffff',
        orbScale:   0.45,
        speed:      1.8,
        trailLen:   20,
    },
};

function getFaction(threadId) {
    if (!threadId) return 'crystal';
    if (threadId.includes('king'))   return 'crystal';
    if (threadId.includes('hacker')) return 'toxic';
    return 'druid';
}

// ──────────────────────────────────────────────────────────────────────────────
// CometTrail — fixed-length trail of ghost orbs that follow the projectile
// ──────────────────────────────────────────────────────────────────────────────
function CometTrail({ positions, vfx }) {
    return (
        <group>
            {positions.map((pos, i) => {
                const age   = (positions.length - i) / positions.length; // 0 = head, 1 = tail
                const scale = vfx.orbScale * (1.0 - age * 0.9);
                const alpha = (1.0 - age) * 0.55;
                return (
                    <mesh key={i} position={[pos.x, pos.y, pos.z]}>
                        <sphereGeometry args={[scale, 6, 6]} />
                        <meshBasicMaterial
                            color={vfx.trailColor}
                            transparent
                            opacity={alpha}
                            depthWrite={false}
                        />
                    </mesh>
                );
            })}
        </group>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// OrbitingShard — tiny spinning crystal/shard orbiting the projectile
// ──────────────────────────────────────────────────────────────────────────────
function OrbitingShard({ center, faction, index, speed = 1.0 }) {
    const meshRef  = useRef();
    const angleRef = useRef((index / 3) * Math.PI * 2);
    const ORBIT_R  = 0.4;

    useFrame((state, delta) => {
        angleRef.current += delta * speed * 2.8;
        if (meshRef.current) {
            meshRef.current.position.set(
                center.x + Math.cos(angleRef.current) * ORBIT_R,
                center.y + Math.sin(angleRef.current * 0.7) * 0.25,
                center.z + Math.sin(angleRef.current) * ORBIT_R
            );
            meshRef.current.rotation.x += delta * 3;
            meshRef.current.rotation.z += delta * 2;
        }
    });

    const vfx = FACTION_VFX[faction] || FACTION_VFX.crystal;

    return (
        <mesh ref={meshRef} position={[center.x, center.y, center.z]}>
            <tetrahedronGeometry args={[0.09, 0]} />
            <meshBasicMaterial color={vfx.shardColor} transparent opacity={0.85} />
        </mesh>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// SingleProjectile — full orb with glow halo + comet trail + orbiting shards
// ──────────────────────────────────────────────────────────────────────────────
function SingleProjectile({ proj }) {
    const vfx = proj.isUltimate ? FACTION_VFX.ultimate : (FACTION_VFX[proj.faction] || FACTION_VFX.crystal);
    const pos = proj.currentPos;

    // Track trail positions (ring buffer)
    const trailRef = useRef([]);
    const lastPosRef = useRef(new THREE.Vector3(pos.x, pos.y, pos.z));

    useFrame(() => {
        const cur = proj.currentPos;
        if (cur.distanceTo(lastPosRef.current) > 0.05) {
            trailRef.current = [cur.clone(), ...trailRef.current].slice(0, vfx.trailLen);
            lastPosRef.current.copy(cur);
        }
    });

    // Pulsing glow scale
    const glowRef = useRef();
    const timeRef = useRef(0);
    useFrame((state, delta) => {
        timeRef.current += delta;
        if (glowRef.current) {
            const pulse = 1.6 + 0.4 * Math.sin(timeRef.current * 14);
            glowRef.current.scale.setScalar(pulse);
        }
    });

    return (
        <group>
            {/* Comet trail */}
            <CometTrail positions={trailRef.current} vfx={vfx} />

            {/* Main orb — core */}
            <group position={[pos.x, pos.y, pos.z]}>
                {/* Inner core */}
                <mesh>
                    <sphereGeometry args={[vfx.orbScale, 12, 12]} />
                    <meshBasicMaterial color={vfx.orbColor} />
                </mesh>

                {/* Pulsing outer glow halo */}
                <mesh ref={glowRef}>
                    <sphereGeometry args={[vfx.orbScale * 1.3, 8, 8]} />
                    <meshBasicMaterial
                        color={vfx.glowColor}
                        transparent
                        opacity={0.25}
                        wireframe={false}
                        depthWrite={false}
                    />
                </mesh>

                {/* Wireframe cage */}
                <mesh scale={[1.5, 1.5, 1.5]}>
                    <sphereGeometry args={[vfx.orbScale, 6, 4]} />
                    <meshBasicMaterial
                        color={vfx.orbColor}
                        transparent
                        opacity={0.15}
                        wireframe
                    />
                </mesh>

                {/* 3 orbiting shards */}
                {[0, 1, 2].map(i => (
                    <OrbitingShard
                        key={i}
                        center={pos}
                        faction={proj.isUltimate ? 'ultimate' : proj.faction}
                        index={i}
                        speed={proj.isUltimate ? 1.8 : 1.0}
                    />
                ))}
            </group>
        </group>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// ImpactFlash — brief bright flash at target hex when projectile lands
// ──────────────────────────────────────────────────────────────────────────────
function ImpactFlash({ position, faction, onDone }) {
    const vfx    = FACTION_VFX[faction] || FACTION_VFX.crystal;
    const meshRef = useRef();
    const timeRef = useRef(0);
    const DURATION = 0.35;

    useFrame((state, delta) => {
        timeRef.current += delta;
        const t = timeRef.current / DURATION;
        if (t >= 1.0) { onDone && onDone(); return; }
        if (meshRef.current) {
            const scale = 0.3 + t * 4.5;
            meshRef.current.scale.setScalar(scale);
            if (meshRef.current.material) {
                meshRef.current.material.opacity = Math.max(0, 1.0 - t * 2.5);
            }
        }
    });

    return (
        <mesh
            ref={meshRef}
            position={[position.x, position.y + 0.3, position.z]}
        >
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshBasicMaterial
                color={vfx.orbColor}
                transparent
                opacity={1}
                depthWrite={false}
            />
        </mesh>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// SpellProjectile3D — main export
// ──────────────────────────────────────────────────────────────────────────────
export default function SpellProjectile3D({ threads = [], gridData = [] }) {
    const [projectiles,  setProjectiles]  = useState([]);
    const [impactFlashes, setImpactFlashes] = useState([]);

    // We store the latest threads/gridData in a ref so the event listener always
    // has access to the freshest values without being re-registered every render.
    const threadsRef  = useRef(threads);
    const gridRef     = useRef(gridData);
    useEffect(() => { threadsRef.current  = threads; },  [threads]);
    useEffect(() => { gridRef.current     = gridData; }, [gridData]);

    useEffect(() => {
        const handleCardPlayed = (e) => {
            const {
                targetHex,
                voltage    = 2,
                current    = 1,
                isUltimate = false,
                damage     = 3,
            } = e.detail;
            if (!targetHex) return;

            const currentThreads = threadsRef.current;
            const currentGrid    = gridRef.current;

            const targetNode = currentGrid.find(
                n => n.macroIndex === targetHex.meta && n.subIndex === targetHex.hex
            );
            if (!targetNode) return;

            // Find the attacker — the player NOT on the target hex
            const attacker = currentThreads.find(
                t => t.position &&
                    !(t.position.meta === targetHex.meta && t.position.hex === targetHex.hex)
            );
            if (!attacker?.position) return;

            const attackerNode = currentGrid.find(
                n => n.macroIndex === attacker.position.meta && n.subIndex === attacker.position.hex
            );
            if (!attackerNode) return;

            const faction = getFaction(attacker.id);

            const startPos = new THREE.Vector3(
                attackerNode.position[0],
                attackerNode.position[1] + 1.4,
                attackerNode.position[2]
            );
            const endPos = new THREE.Vector3(
                targetNode.position[0],
                targetNode.position[1] + 0.5,
                targetNode.position[2]
            );

            const vfx   = isUltimate ? FACTION_VFX.ultimate : (FACTION_VFX[faction] || FACTION_VFX.crystal);
            const speed = isUltimate ? 1.6 : vfx.speed;

            const newProj = {
                id:         `proj_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                startPos,
                endPos,
                currentPos: startPos.clone(),
                progress:   0,
                speed,
                faction,
                isUltimate,
                damage,
                voltage,
                current,
                arcHeight: isUltimate ? 3.2 : 1.8,
            };

            setProjectiles(prev => [...prev, newProj]);
        };

        window.addEventListener('card_played_effect', handleCardPlayed);
        return () => window.removeEventListener('card_played_effect', handleCardPlayed);
    }, []);

    useFrame((state, delta) => {
        setProjectiles(prev => {
            const finished = [];
            const updated  = prev.map(p => {
                const nextProgress = p.progress + delta * p.speed;
                const t = Math.min(nextProgress, 1.0);

                const currentPos = new THREE.Vector3().lerpVectors(p.startPos, p.endPos, t);
                // Parabolic arc with Catmull-Rom peak bias
                currentPos.y += Math.sin(t * Math.PI) * p.arcHeight;

                if (nextProgress >= 1.0) {
                    finished.push({ ...p, currentPos });
                }

                return { ...p, progress: nextProgress, currentPos };
            });

            // Spawn impact flashes for finished projectiles.
            // Dedup podľa id: React môže updater zavolať dvakrát (StrictMode)
            // a rovnaký záblesk by sa pridal duplicitne (duplicate key warning).
            if (finished.length > 0) {
                setImpactFlashes(prev2 => {
                    const fresh = finished
                        .map(f => ({
                            id:      `flash_${f.id}`,
                            pos:     f.currentPos.clone(),
                            faction: f.faction,
                        }))
                        .filter(nf => !prev2.some(x => x.id === nf.id));
                    return fresh.length > 0 ? [...prev2, ...fresh] : prev2;
                });
            }

            return updated.filter(p => p.progress < 1.0);
        });
    });

    return (
        <group>
            {/* Active projectiles */}
            {projectiles.map(p => (
                <SingleProjectile key={p.id} proj={p} />
            ))}

            {/* Impact flashes at landing */}
            {impactFlashes.map(f => (
                <ImpactFlash
                    key={f.id}
                    position={f.pos}
                    faction={f.faction}
                    onDone={() =>
                        setImpactFlashes(prev => prev.filter(x => x.id !== f.id))
                    }
                />
            ))}
        </group>
    );
}
