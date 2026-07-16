// ────────────────────────────────────────────────────────────────────────────
// HeroModel3D.jsx — CDN GLTF Loader with Draco + React Suspense
//
// Production asset loading pattern for hero 3D models:
//   1. Models stored compressed (Draco) on CDN (Cloudflare R2 / AWS S3)
//   2. React Suspense shows a faction-appropriate fallback while loading
//   3. Scene clone prevents material sharing between multiple instances
//   4. Faction tint applied via emissive override
//
// Setup in main.jsx:
//   import { useGLTF } from '@react-three/drei';
//   useGLTF.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
// ────────────────────────────────────────────────────────────────────────────

import React, { Suspense, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── CDN base URL — controlled via Vite env variable ──────────────────────────
const CDN_BASE = import.meta.env.VITE_CDN_URL || '';

// ── Faction → GLB path (supports local folder overrides / custom game content)
const MODEL_URLS = {
    crystal:         `${CDN_BASE}/models/heroes/crystal/hero.glb`,
    crystal_warrior: `${CDN_BASE}/models/heroes/crystal_warrior/hero.glb`,
    crystal_mage:    `${CDN_BASE}/models/heroes/crystal_mage/hero.glb`,
    crystal_rogue:   `${CDN_BASE}/models/heroes/crystal_rogue/hero.glb`,
    
    toxic:           `${CDN_BASE}/models/heroes/toxic/hero.glb`,
    toxic_warrior:   `${CDN_BASE}/models/heroes/toxic_warrior/hero.glb`,
    toxic_mage:      `${CDN_BASE}/models/heroes/toxic_mage/hero.glb`,
    toxic_rogue:     `${CDN_BASE}/models/heroes/toxic_rogue/hero.glb`,
    
    druid:           `${CDN_BASE}/models/heroes/druid/hero.glb`,
    druid_warrior:   `${CDN_BASE}/models/heroes/druid_warrior/hero.glb`,
    druid_mage:      `${CDN_BASE}/models/heroes/druid_mage/hero.glb`,
    druid_rogue:     `${CDN_BASE}/models/heroes/druid_rogue/hero.glb`,
    
    void:            `${CDN_BASE}/models/heroes/void/hero.glb`,
    void_warrior:    `${CDN_BASE}/models/heroes/void_warrior/hero.glb`,
    void_mage:       `${CDN_BASE}/models/heroes/void_mage/hero.glb`,
    void_rogue:      `${CDN_BASE}/models/heroes/void_rogue/hero.glb`,
};

// Faction emissive tints applied on top of the base model material
const FACTION_EMISSIVE = {
    crystal: new THREE.Color('#00eeff'),
    toxic:   new THREE.Color('#39ff14'),
    druid:   new THREE.Color('#ffcc00'),
    void:    new THREE.Color('#aa00ff'),
};

// ────────────────────────────────────────────────────────────────────────────
// Pre-warm: call this from LobbyScreen so models start loading before the match
// ────────────────────────────────────────────────────────────────────────────
export function preloadAllHeroModels() {
    Object.values(MODEL_URLS).forEach(url => useGLTF.preload(url));
}

// ────────────────────────────────────────────────────────────────────────────
// Fallback: shown inside Suspense while GLB is in-flight
// ────────────────────────────────────────────────────────────────────────────
function HeroLoadingFallback({ position, faction }) {
    const ringRef = useRef();
    const baseFaction = faction.split('_')[0];
    const tint        = FACTION_EMISSIVE[baseFaction] || FACTION_EMISSIVE.crystal;

    useFrame((state) => {
        if (ringRef.current) {
            ringRef.current.rotation.y = state.clock.elapsedTime * 1.5;
        }
    });

    return (
        <group position={position}>
            {/* Ghost sphere placeholder */}
            <mesh>
                <sphereGeometry args={[0.5, 8, 8]} />
                <meshBasicMaterial
                    color={tint}
                    transparent
                    opacity={0.15}
                    wireframe
                />
            </mesh>

            {/* Spinning loading ring */}
            <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.65, 0.04, 6, 48]} />
                <meshBasicMaterial color={tint} transparent opacity={0.7} />
            </mesh>

            {/* Dashed outer ring — static */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.75, 0.02, 4, 16]} />
                <meshBasicMaterial
                    color={tint}
                    transparent
                    opacity={0.3}
                    wireframe
                />
            </mesh>
        </group>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// Inner loader — must be wrapped in Suspense (useGLTF triggers it)
// ────────────────────────────────────────────────────────────────────────────
function HeroGLTF({ faction, position, scale = 1, lowHp = false }) {
    const baseFaction = faction.split('_')[0];
    const url         = MODEL_URLS[faction] || MODEL_URLS[baseFaction] || MODEL_URLS.crystal;
    const { scene }   = useGLTF(url);      // Draco-decompressed, cached by drei
    const emissiveTint = FACTION_EMISSIVE[baseFaction] || FACTION_EMISSIVE.crystal;

    // Clone scene: each instance gets its own material copy
    const cloned = useMemo(() => {
        const clone = scene.clone(true);
        clone.traverse((child) => {
            if (!child.isMesh) return;
            child.castShadow    = true;
            child.receiveShadow = true;
            if (child.material) {
                child.material = child.material.clone();
                child.material.emissive          = emissiveTint.clone();
                child.material.emissiveIntensity  = lowHp ? 0.45 : 0.15;
                child.material.needsUpdate        = true;
            }
        });
        return clone;
    }, [scene, faction, lowHp]);

    // Idle float animation
    const groupRef = useRef();
    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.position.y =
                (position[1] ?? 0) + Math.sin(state.clock.elapsedTime * 1.8) * 0.08;
        }
    });

    return (
        <group ref={groupRef}>
            <primitive object={cloned} position={position} scale={scale} />
        </group>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// Public API — always use this; Suspense boundary is internal
// ────────────────────────────────────────────────────────────────────────────
export default function HeroModel3D({ faction = 'crystal', position = [0, 0, 0], scale = 1, lowHp = false }) {
    return (
        <Suspense fallback={<HeroLoadingFallback position={position} faction={faction} />}>
            <HeroGLTF
                faction={faction}
                position={position}
                scale={scale}
                lowHp={lowHp}
            />
        </Suspense>
    );
}
