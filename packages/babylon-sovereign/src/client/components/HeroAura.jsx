import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Faction aura configurations ─────────────────────────────────────────────
const AURA_CONFIG = {
    crystal: {
        innerColor:  '#00eeff',
        outerColor:  '#004466',
        pulseSpeed:  1.2,        // slow, steady breath
        pulseMin:    0.7,
        pulseMax:    1.15,
        rings:       2,
        ringGap:     0.18,
        torusR:      0.65,       // major radius
        torusTube:   0.04,       // tube radius
        rotateSpeed: 0.4,
    },
    toxic: {
        innerColor:  '#39ff14',
        outerColor:  '#003300',
        pulseSpeed:  3.8,        // fast, jittery shimmer
        pulseMin:    0.85,
        pulseMax:    1.3,
        rings:       3,
        ringGap:     0.14,
        torusR:      0.62,
        torusTube:   0.035,
        rotateSpeed: 1.1,
    },
    druid: {
        innerColor:  '#ffcc00',
        outerColor:  '#331a00',
        pulseSpeed:  0.7,        // organic, breath-like
        pulseMin:    0.75,
        pulseMax:    1.1,
        rings:       2,
        ringGap:     0.2,
        torusR:      0.68,
        torusTube:   0.045,
        rotateSpeed: 0.25,
    },
    void: {
        innerColor:  '#aa00ff',
        outerColor:  '#1a0033',
        pulseSpeed:  5.0,        // chaotic
        pulseMin:    0.6,
        pulseMax:    1.5,
        rings:       4,
        ringGap:     0.12,
        torusR:      0.72,
        torusTube:   0.05,
        rotateSpeed: 2.2,
    },
};

function getFaction(threadId) {
    if (!threadId) return 'crystal';
    if (threadId.includes('king'))   return 'crystal';
    if (threadId.includes('hacker')) return 'toxic';
    if (threadId.includes('void'))   return 'void';
    return 'druid';
}

// ─── SingleAuraRing ───────────────────────────────────────────────────────────
// One pulsing torus ring orbiting the hero at a given vertical offset and tilt
function SingleAuraRing({ config, ringIndex, lowHp }) {
    const meshRef   = useRef();
    const timeRef   = useRef(Math.random() * Math.PI * 2); // stagger rings

    useFrame((state, delta) => {
        timeRef.current += delta;
        if (!meshRef.current) return;

        // Pulse scale
        const t     = timeRef.current * config.pulseSpeed;
        const pulse = config.pulseMin + (config.pulseMax - config.pulseMin) * (0.5 + 0.5 * Math.sin(t));

        // Low-HP emergency burst: make it pulse wildly
        const hpMod = lowHp ? 1.0 + 0.5 * Math.abs(Math.sin(timeRef.current * 8)) : 1.0;

        meshRef.current.scale.setScalar(pulse * hpMod);

        // Slow rotation around Y axis (each ring at slightly different speed)
        const rotMod = 1.0 + ringIndex * 0.35;
        meshRef.current.rotation.y += delta * config.rotateSpeed * rotMod;
        meshRef.current.rotation.z += delta * config.rotateSpeed * 0.3 * rotMod;
    });

    // Alternating tilt so multiple rings don't overlap visually
    const tiltAngle = (ringIndex % 2 === 0) ? 0 : Math.PI / 4;
    const yOffset   = ringIndex * config.ringGap;

    return (
        <mesh
            ref={meshRef}
            position={[0, yOffset + 0.25, 0]}
            rotation={[Math.PI / 2 + tiltAngle, 0, ringIndex * 0.7]}
        >
            <torusGeometry args={[config.torusR + ringIndex * 0.06, config.torusTube, 6, 48]} />
            <meshBasicMaterial
                color={ringIndex === 0 ? config.innerColor : config.outerColor}
                transparent
                opacity={ringIndex === 0 ? 0.9 : 0.55}
                depthWrite={false}
            />
        </mesh>
    );
}

// ─── AuraGroundGlow ──────────────────────────────────────────────────────────
// Soft disc projected on the ground below the hero — like a Hearthstone card glow
function AuraGroundGlow({ config, lowHp }) {
    const meshRef = useRef();
    const timeRef = useRef(0);

    useFrame((state, delta) => {
        timeRef.current += delta;
        if (!meshRef.current) return;
        const pulse = 0.7 + 0.3 * Math.sin(timeRef.current * config.pulseSpeed * 0.6);
        const hpMod = lowHp ? 1.2 : 1.0;
        meshRef.current.scale.setScalar(pulse * hpMod);
        if (meshRef.current.material) {
            meshRef.current.material.opacity = (lowHp ? 0.55 : 0.3) * pulse;
        }
    });

    return (
        <mesh
            ref={meshRef}
            rotation={[Math.PI / 2, 0, 0]}
            position={[0, -0.38, 0]}
        >
            <circleGeometry args={[0.85, 32]} />
            <meshBasicMaterial
                color={config.innerColor}
                transparent
                opacity={0.3}
                depthWrite={false}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

// ─── HeroAura (main export) ──────────────────────────────────────────────────
// Mounts inside the ArenaGroup, tracks hero world position via LERP ref
export default function HeroAura({ thread, gridData }) {
    const groupRef = useRef();
    const faction  = useMemo(() => getFaction(thread?.id), [thread?.id]);
    const config   = AURA_CONFIG[faction] || AURA_CONFIG.crystal;

    const targetPos = useMemo(() => {
        if (!thread?.position || thread.position.meta == null) {
            return new THREE.Vector3(0, -100, 0); // hidden below map
        }
        const node = gridData.find(
            n => n.macroIndex === thread.position.meta && n.subIndex === thread.position.hex
        );
        return node
            ? new THREE.Vector3(node.position[0], node.position[1] + 0.4, node.position[2])
            : new THREE.Vector3(0, -100, 0);
    }, [thread?.position, gridData]);

    // LERP to hero position, same coefficient as ThreadMiniature
    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.position.lerp(targetPos, 0.1);
        }
    });

    const lowHp = (thread?.health ?? 99) <= 5;

    return (
        <group ref={groupRef} position={[targetPos.x, targetPos.y, targetPos.z]}>
            {/* Ground disc glow */}
            <AuraGroundGlow config={config} lowHp={lowHp} />

            {/* Stacked torus rings */}
            {Array.from({ length: config.rings }, (_, i) => (
                <SingleAuraRing
                    key={i}
                    config={config}
                    ringIndex={i}
                    lowHp={lowHp}
                />
            ))}
        </group>
    );
}
