import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Faction color palettes — matches Crystal/Toxic/Druid lore
const FACTION_PALETTES = {
    crystal: {
        core:     '#00eeff',
        mid:      '#0088cc',
        outer:    '#002244',
        sparks:   '#ffffff',
        ring:     '#00ffff',
    },
    toxic: {
        core:     '#39ff14',
        mid:      '#7fff00',
        outer:    '#1a3300',
        sparks:   '#d8ff80',
        ring:     '#00ff66',
    },
    druid: {
        core:     '#ffcc00',
        mid:      '#8b5e00',
        outer:    '#2a1800',
        sparks:   '#fffacd',
        ring:     '#ff9900',
    },
};

function getFaction(threadId) {
    if (!threadId) return 'crystal';
    if (threadId.includes('king')) return 'crystal';
    if (threadId.includes('hacker')) return 'toxic';
    return 'druid';
}

// ──────────────────────────────────────────────────────────────────────────────
// Particle burst that explodes outward from hero position on hit
// ──────────────────────────────────────────────────────────────────────────────
function ImpactBurst({ position, faction, damage, onDone }) {
    const palette = FACTION_PALETTES[faction] || FACTION_PALETTES.crystal;
    const PARTICLE_COUNT = Math.min(40, 12 + Math.floor(damage * 3));

    const groupRef   = useRef();
    const timeRef    = useRef(0);
    const DURATION   = 0.9; // seconds

    // Initial velocity for each particle — random spherical distribution
    const velocities = useMemo(() => {
        return Array.from({ length: PARTICLE_COUNT }, () => {
            const theta = Math.random() * Math.PI * 2;
            const phi   = Math.random() * Math.PI;
            const speed = 1.5 + Math.random() * 3.5;
            return new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.abs(Math.sin(phi) * Math.sin(theta)) * speed * 1.4, // bias upward
                Math.cos(phi) * speed
            );
        });
    }, [PARTICLE_COUNT]);

    // Per-particle refs for position tracking
    const particleRefs = useRef(velocities.map(() => ({
        pos: new THREE.Vector3(...position),
        life: Math.random()
    })));

    const meshRefs = useRef([]);

    useFrame((state, delta) => {
        timeRef.current += delta;
        const t = timeRef.current / DURATION;

        if (t >= 1.0) {
            onDone && onDone();
            return;
        }

        velocities.forEach((vel, i) => {
            const p = particleRefs.current[i];
            // Apply velocity + gravity
            p.pos.x += vel.x * delta;
            p.pos.y += vel.y * delta - 4.9 * delta * delta * timeRef.current;
            p.pos.z += vel.z * delta;
            p.life  += delta;

            const mesh = meshRefs.current[i];
            if (mesh) {
                mesh.position.set(p.pos.x, p.pos.y, p.pos.z);
                // Fade out + shrink
                const fade = 1.0 - t;
                mesh.scale.setScalar(fade * (0.05 + Math.random() * 0.04));
                if (mesh.material) mesh.material.opacity = Math.max(0, fade);
            }
        });
    });

    return (
        <group ref={groupRef}>
            {velocities.map((_, i) => (
                <mesh
                    key={i}
                    ref={el => meshRefs.current[i] = el}
                    position={position}
                >
                    <sphereGeometry args={[1, 4, 4]} />
                    <meshBasicMaterial
                        color={i % 3 === 0 ? palette.core : i % 3 === 1 ? palette.mid : palette.sparks}
                        transparent
                        opacity={1}
                    />
                </mesh>
            ))}
        </group>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Expanding shockwave ring at hero position on hit
// ──────────────────────────────────────────────────────────────────────────────
function ShockwaveRing({ position, faction, onDone }) {
    const palette = FACTION_PALETTES[faction] || FACTION_PALETTES.crystal;
    const meshRef = useRef();
    const timeRef = useRef(0);
    const DURATION = 0.5;

    useFrame((state, delta) => {
        timeRef.current += delta;
        const t = timeRef.current / DURATION;
        if (t >= 1.0) { onDone && onDone(); return; }
        if (meshRef.current) {
            const scale = 0.2 + t * 3.5;
            meshRef.current.scale.set(scale, scale, scale);
            if (meshRef.current.material) {
                meshRef.current.material.opacity = Math.max(0, 1.0 - t * 1.6);
            }
        }
    });

    return (
        <mesh
            ref={meshRef}
            position={[position[0], position[1] + 0.6, position[2]]}
            rotation={[Math.PI / 2, 0, 0]}
        >
            <torusGeometry args={[0.5, 0.06, 6, 32]} />
            <meshBasicMaterial color={palette.ring} transparent opacity={1} />
        </mesh>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Floating damage number — world-space billboard
// ──────────────────────────────────────────────────────────────────────────────
function FloatingDamageOrb({ position, damage, faction, onDone }) {
    const palette  = FACTION_PALETTES[faction] || FACTION_PALETTES.crystal;
    const meshRef  = useRef();
    const timeRef  = useRef(0);
    const DURATION = 1.2;
    const yOffset  = useRef(0);

    useFrame((state, delta) => {
        timeRef.current += delta;
        const t = timeRef.current / DURATION;
        if (t >= 1.0) { onDone && onDone(); return; }
        yOffset.current += delta * 1.8;
        if (meshRef.current) {
            meshRef.current.position.set(position[0], position[1] + 1.5 + yOffset.current, position[2]);
            const fade = 1.0 - t;
            meshRef.current.material.opacity = Math.max(0, fade);
            const pulse = 1.0 + 0.15 * Math.sin(timeRef.current * 18);
            meshRef.current.scale.setScalar(pulse * (0.12 + damage * 0.015));
        }
    });

    return (
        <mesh
            ref={meshRef}
            position={[position[0], position[1] + 1.5, position[2]]}
        >
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color={palette.core} transparent opacity={1} />
        </mesh>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// HeroImpactVFX — mounts on the hero's current 3D world position
// Listens to card_played_effect dispatched from window
// ──────────────────────────────────────────────────────────────────────────────
export default function HeroImpactVFX({ thread, gridData }) {
    const [effects, setEffects] = useState([]);

    const faction = useMemo(() => getFaction(thread?.id), [thread?.id]);

    // Get the thread's current 3D world position from gridData
    const worldPos = useMemo(() => {
        if (!thread?.position || thread.position.meta == null) return null;
        const node = gridData.find(n =>
            n.macroIndex === thread.position.meta &&
            n.subIndex   === thread.position.hex
        );
        return node ? [...node.position] : null;
    }, [thread?.position, gridData]);

    useEffect(() => {
        const handleHit = (e) => {
            const { targetHex, voltage = 2, current = 1, isUltimate = false, damage = 3 } = e.detail;
            if (!targetHex || !worldPos) return;

            // Only trigger VFX if this hero is on the targeted hex
            if (!thread?.position) return;
            if (thread.position.meta !== targetHex.meta || thread.position.hex !== targetHex.hex) return;

            const effectId = `hit_${Date.now()}_${Math.random()}`;
            const finalDmg = Math.max(1, damage);

            setEffects(prev => [...prev, {
                id: effectId,
                pos: worldPos,
                faction,
                damage: finalDmg,
                isUltimate,
                timestamp: Date.now(),
                burst: true,
                ring: true,
                orb: true,
            }]);
        };

        window.addEventListener('card_played_effect', handleHit);
        return () => window.removeEventListener('card_played_effect', handleHit);
    }, [thread, worldPos, faction]);

    const removeEffect = (id, part) => {
        setEffects(prev => {
            const updated = prev.map(e => e.id === id ? { ...e, [part]: false } : e);
            return updated.filter(e => e.burst || e.ring || e.orb);
        });
    };

    if (!worldPos) return null;

    return (
        <group>
            {effects.map(eff => (
                <group key={eff.id}>
                    {eff.burst && (
                        <ImpactBurst
                            position={eff.pos}
                            faction={eff.faction}
                            damage={eff.damage}
                            onDone={() => removeEffect(eff.id, 'burst')}
                        />
                    )}
                    {eff.ring && (
                        <ShockwaveRing
                            position={eff.pos}
                            faction={eff.faction}
                            onDone={() => removeEffect(eff.id, 'ring')}
                        />
                    )}
                    {eff.orb && (
                        <FloatingDamageOrb
                            position={eff.pos}
                            faction={eff.faction}
                            damage={eff.damage}
                            onDone={() => removeEffect(eff.id, 'orb')}
                        />
                    )}
                </group>
            ))}
        </group>
    );
}
