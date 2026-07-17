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
import { GeometryModifierStack } from '../utils/GeometryModifierStack';

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

const ITEM_URLS = [
    '/models/items/trap/model.glb',
    '/models/items/repair_kit/model.glb',
    '/models/items/surge_node/model.glb',
    '/models/items/void_rift/model.glb',
    '/models/items/chest/model.glb',
];

// ────────────────────────────────────────────────────────────────────────────
// Pre-warm: call this from LobbyScreen so models start loading before the match
// ────────────────────────────────────────────────────────────────────────────
export function preloadAllHeroModels() {
    Object.values(MODEL_URLS).forEach(url => useGLTF.preload(url));
    ITEM_URLS.forEach(url => useGLTF.preload(url));
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
// Global models registry cache & GET resolver
// ────────────────────────────────────────────────────────────────────────────
let globalModelsRegistry = null;
let registryPromise = null;

export function getModelsRegistryPromise() {
    if (!registryPromise) {
        registryPromise = fetch('/api/assets/3d-models')
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                globalModelsRegistry = data;
                return data;
            })
            .catch(err => {
                console.warn('Fallback: models registry failed to load', err);
                globalModelsRegistry = [];
                return [];
            });
    }
    return registryPromise;
}

// ────────────────────────────────────────────────────────────────────────────
// Procedural Gear Primitive Mesh (Rule 10 config loops / 24 bevel teeth)
// ────────────────────────────────────────────────────────────────────────────
export function ProceduralGearMesh({ color = '#e2e8f0', emissive = '#00ffff', size = 0.8, position = [0, 0, 0] }) {
    const gearRef = useRef();

    useFrame((state) => {
        if (gearRef.current) {
            // Continuous rotation ref to prevent React state recreation (Rule 10)
            gearRef.current.rotation.z = state.clock.elapsedTime * 0.8;
        }
    });

    const geometry = useMemo(() => {
        const shape = new THREE.Shape();
        const teeth = 24;
        const innerRadius = 0.3 * size;
        const outerRadius = 0.5 * size;

        for (let i = 0; i < teeth; i++) {
            const angle = (i / teeth) * Math.PI * 2;
            const nextAngle = ((i + 0.5) / teeth) * Math.PI * 2;
            const nextAngle2 = ((i + 1) / teeth) * Math.PI * 2;

            shape.lineTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
            shape.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
            shape.lineTo(Math.cos(nextAngle) * outerRadius, Math.sin(nextAngle) * outerRadius);
            shape.lineTo(Math.cos(nextAngle) * innerRadius, Math.sin(nextAngle) * innerRadius);
            shape.lineTo(Math.cos(nextAngle2) * innerRadius, Math.sin(nextAngle2) * innerRadius);
        }

        const hole = new THREE.Path();
        hole.absarc(0, 0, 0.1 * size, 0, Math.PI * 2, true);
        shape.holes.push(hole);

        const baseGeom = GeometryModifierStack.applyBevel(
            shape,
            0.15 * size,
            0.02 * size,
            0.02 * size,
            2
        );

        // Apply non-destructive ArrayModifier (Rule 12)
        return GeometryModifierStack.applyArray(baseGeom, 2, [0, 0, 0.25 * size]);
    }, [size]);

    return (
        <group position={position}>
            <mesh ref={gearRef} geometry={geometry} castShadow receiveShadow>
                <meshStandardMaterial
                    color={color}
                    roughness={0.2}
                    metalness={0.8}
                    emissive={emissive}
                    emissiveIntensity={0.6}
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
    const [modelRegistry, setModelRegistry] = React.useState(globalModelsRegistry);

    React.useEffect(() => {
        if (!modelRegistry) {
            getModelsRegistryPromise().then(data => {
                setModelRegistry(data);
            });
        }
    }, [modelRegistry]);

    // Resolve matched model metadata from fetched registry
    const matchedModel = modelRegistry?.find(m => m.id === `model_${baseFaction}_hero`);
    
    // Check if resolved template points to procedural primitives mapping
    if (matchedModel?.meshType === 'PRIMITIVE_GEAR') {
        const emissiveTint = FACTION_EMISSIVE[baseFaction] || FACTION_EMISSIVE.crystal;
        return (
            <ProceduralGearMesh 
                position={position} 
                size={scale} 
                color="#e2e8f0" 
                emissive={emissiveTint.getStyle()} 
            />
        );
    }

    const url         = matchedModel?.url || MODEL_URLS[faction] || MODEL_URLS[baseFaction] || MODEL_URLS.crystal;
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
