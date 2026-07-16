import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MapControls, PerspectiveCamera, Html } from '@react-three/drei';
import { EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';
import { CRYSTAL_CARDS_BASE, TOXIC_CARDS_BASE, DRUID_CARDS_BASE, VOID_CARDS_BASE, Pathfinder, SpatialGuidanceSystem, HardwareGovernor } from '../../../shared/src/index';
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
import BackgroundEnvironment3D from './world/BackgroundEnvironment3D';
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
    const materialRef = useRef();

    useEffect(() => {
        if (active && meshRef.current) {
            meshRef.current.visible = true;
            meshRef.current.scale.setScalar(0.01);
            if (materialRef.current) {
                materialRef.current.opacity = 0.85;
            }
        }
    }, [active]);

    useFrame((state, delta) => {
        if (meshRef.current && meshRef.current.visible) {
            meshRef.current.rotation.y += delta * 3.5;
            meshRef.current.rotation.x += delta * 1.5;
            const nextScale = meshRef.current.scale.x + delta * 28;
            if (nextScale > 18) {
                meshRef.current.visible = false;
            } else {
                meshRef.current.scale.setScalar(nextScale);
                if (materialRef.current) {
                    materialRef.current.opacity = 0.85 * (1.0 - nextScale / 18);
                }
            }
        }
    });

    return (
        <mesh ref={meshRef} position={[0, 1.2, 0]} scale={0.01} visible={false}>
            <sphereGeometry args={[1, 14, 14]} />
            <meshBasicMaterial 
                ref={materialRef}
                color="#ffd700" 
                wireframe={true} 
                transparent={true} 
                opacity={0.85} 
            />
        </mesh>
    );
}


function DynamicCameraController({ gameMode, threads, gridData, map, shakeIntensity, isUltimate, activeBiome, selectedNode, hoveredNode }) {
    const { camera, controls } = useThree();
    const desiredTarget = useRef(new THREE.Vector3(0, 0, 0));
    const isLockedToUnit = useRef(true);
    const keysPressed = useRef({});

    // Vyhľadanie aktívneho hrdinu
    const activePlayer = useMemo(() => {
        return threads.find(t => t.type === 'PLAYER' && t.health > 0) || null;
    }, [threads]);

    const activeUnitNode = useMemo(() => {
        const targetThread = threads.find(t => t.health > 0 && t.position && t.position.meta !== null);
        if (targetThread && targetThread.position) {
            return gridData.find(
                n => n.macroIndex === targetThread.position.meta && n.subIndex === targetThread.position.hex
            ) || null;
        }
        return null;
    }, [threads, gridData]);

    const focusedNode = selectedNode || hoveredNode || activeUnitNode;

    // Calculate dynamic slant (pitch, yaw) and zoom (fov) based on focusedNode
    const cameraProfile = useMemo(() => {
        if (!focusedNode) {
            return {
                pitch: 1.05,
                yaw: Math.PI / 4,
                fov: 22
            };
        }

        const x = focusedNode.position[0];
        const z = focusedNode.position[2];
        const r = Math.sqrt(x * x + z * z);
        
        // 1. Yaw (Head slant heading): locked to stable view without skew animation
        const yaw = Math.PI / 4;

        // 2. Pitch (Elevation slant angle): locked to stable 2.5D angle
        const pitch = 1.05;

        // 3. FOV (Zoom factor)
        let fov = 22;
        if (isUltimate) {
            fov = 14;
        } else if (selectedNode && selectedNode.id === focusedNode.id) {
            fov = 17; // Close focus zoom on selected tile
        } else if (focusedNode.hazardIndex > 0.65) {
            fov = 16; // Deep focus zoom on danger zones
        } else {
            // Zoom out slightly for outer tiles
            fov = 20 + (r / 14.0) * 6.0;
        }

        return { pitch, yaw, fov };
    }, [focusedNode, activeBiome, isUltimate, selectedNode]);

    // Reset lock on turn/active player change
    const lastActivePlayerId = useRef(null);
    const activeId = activePlayer?.id || null;
    if (activeId !== lastActivePlayerId.current) {
        isLockedToUnit.current = true;
        lastActivePlayerId.current = activeId;
    }

    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
                isLockedToUnit.current = false; // Break camera lock on keyboard panning
            }
            if (key === ' ') {
                e.preventDefault();
                isLockedToUnit.current = true; // Spacebar snaps camera back to active unit
            }
            keysPressed.current[key] = true;
        };
        const handleKeyUp = (e) => {
            keysPressed.current[e.key.toLowerCase()] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useEffect(() => {
        if (!controls) return;
        const handleStart = () => {
            isLockedToUnit.current = false;
        };
        controls.addEventListener('start', handleStart);
        return () => {
            controls.removeEventListener('start', handleStart);
        };
    }, [controls]);

    useEffect(() => {
        if (!isLockedToUnit.current) return;

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
        // Keyboard panning (WASD / Arrows) mapped to screen directions in isometric perspective
        const panSpeed = 36.0 * delta;
        let moveX = 0;
        let moveZ = 0;

        if (keysPressed.current['w'] || keysPressed.current['arrowup']) {
            moveX -= 1;
            moveZ -= 1;
        }
        if (keysPressed.current['s'] || keysPressed.current['arrowdown']) {
            moveX += 1;
            moveZ += 1;
        }
        if (keysPressed.current['a'] || keysPressed.current['arrowleft']) {
            moveX -= 1;
            moveZ += 1;
        }
        if (keysPressed.current['d'] || keysPressed.current['arrowright']) {
            moveX += 1;
            moveZ -= 1;
        }

        if (moveX !== 0 || moveZ !== 0) {
            const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
            const dx = (moveX / len) * panSpeed;
            const dz = (moveZ / len) * panSpeed;
            
            desiredTarget.current.x += dx;
            desiredTarget.current.z += dz;
            isLockedToUnit.current = false;
        }

        // 1. Plynulý LERP stredu záujmu a rotačných obmedzení MapControls
        if (controls) {
            if (isLockedToUnit.current) {
                // Apply dynamic tile-specific camera slant limits in-place (Rule 5 safety)
                controls.minPolarAngle = THREE.MathUtils.lerp(controls.minPolarAngle, cameraProfile.pitch, delta * 3.0);
                controls.maxPolarAngle = controls.minPolarAngle;

                controls.minAzimuthAngle = THREE.MathUtils.lerp(controls.minAzimuthAngle, cameraProfile.yaw, delta * 3.0);
                controls.maxAzimuthAngle = controls.minAzimuthAngle;
            } else {
                // Free 3D perspective rotation limits when unlocked
                controls.minPolarAngle = 0.1;
                controls.maxPolarAngle = Math.PI / 2 - 0.05;
                controls.minAzimuthAngle = -Infinity;
                controls.maxAzimuthAngle = Infinity;
            }

            // If dragging the map, copy controls target to desiredTarget to avoid fighting
            if (!isLockedToUnit.current && state.pointer.down) {
                desiredTarget.current.copy(controls.target);
            } else {
                controls.target.lerp(desiredTarget.current, delta * 3.5);
                controls.update();
            }
        }

        // 2. Úprava FOV (zorného uhla) pre detailný zoom a taktický prehľad
        const targetFov = cameraProfile.fov;
        if (Math.abs(camera.fov - targetFov) > 0.1) {
            camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, delta * 4.0);
            camera.updateProjectionMatrix();
        }

        // 3. Dynamické trasenie kamery (Camera Shake)
        if (shakeIntensity > 0) {
            camera.position.x += (Math.random() - 0.5) * shakeIntensity * 0.15;
            camera.position.y += (Math.random() - 0.5) * shakeIntensity * 0.15;
            camera.position.z += (Math.random() - 0.5) * shakeIntensity * 0.15;
        }

        // 4. Pomalý automatický oblet v Sandbox móde
        if (gameMode === 'SANDBOX' && !isUltimate && isLockedToUnit.current) {
            const time = state.clock.getElapsedTime();
            desiredTarget.current.set(Math.sin(time * 0.25) * 1.5, 0, Math.cos(time * 0.25) * 1.5);
        }
    });

    return null;
}

function HardwareGovernorController({ onLimitsChange, globalEntropyStress }) {
    const { scene } = useThree();
    const lastUniformUpdateRef = useRef(0);
    const prevTier = useRef(HardwareGovernor.currentTier);

    useFrame((state, delta) => {
        const deltaMs = delta * 1000;
        
        // 1. Update profile based on real frame time
        const newLimits = HardwareGovernor.updateProfile(deltaMs);

        // Notify parent of limits change if Tier changes
        if (HardwareGovernor.currentTier !== prevTier.current) {
            prevTier.current = HardwareGovernor.currentTier;
            onLimitsChange(newLimits);
            console.log(`[GOVERNOR] Performance Tier changed to: ${HardwareGovernor.currentTier}`);
        }

        // 2. Uniform throttling (TDP safety)
        const interval = 1000 / newLimits.uniformThrottleHz;
        const now = state.clock.getElapsedTime() * 1000;
        if (now - lastUniformUpdateRef.current > interval) {
            scene.traverse((object) => {
                if (object instanceof THREE.Mesh && object.material) {
                    // Check standard three material uniforms as fallback, or userData shader
                    const uniforms = object.material.uniforms || object.material.userData?.shader?.uniforms;
                    if (uniforms) {
                        if (uniforms.uGravityPulse) {
                            uniforms.uGravityPulse.value = newLimits.enableVolumetricFog ? state.clock.getElapsedTime() : 0;
                        }
                        if (uniforms.uEntropyStress) {
                            uniforms.uEntropyStress.value = globalEntropyStress || 0;
                        }
                    }
                }
            });
            lastUniformUpdateRef.current = now;
        }
    });

    return null;
}

const VolumetricRayShader = {
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uTime;
        uniform float uOffset;
        varying vec2 vUv;
        void main() {
            // Smooth vertical fade to eliminate sharp top/bottom cylinder vertices
            float verticalFade = sin(vUv.y * 3.14159265);
            // Non-linear glow boost
            verticalFade = pow(verticalFade, 1.6);
            
            // Dynamic multi-frequency shimmer for volumetric turbulence (inspired by Bioshock)
            float shimmer = 0.75 + 0.25 * sin(uTime * 1.8 + vUv.y * 6.0 + uOffset) 
                                 + 0.1 * cos(uTime * 3.2 - vUv.x * 4.0);
            
            gl_FragColor = vec4(uColor, uOpacity * verticalFade * shimmer);
        }
    `
};

function GodRays3D({ activeProfile }) {
    const groupRef = useRef();
    const pointsRef = useRef();
    
    // Generate dust particles inside the light shafts area
    const moteCount = 120;
    const [positions, velocities, sizes] = useMemo(() => {
        const pos = new Float32Array(moteCount * 3);
        const vel = new Float32Array(moteCount * 3);
        const sz = new Float32Array(moteCount);
        for (let i = 0; i < moteCount; i++) {
            // Cylindrical coordinates around center
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 8.5;
            pos[i * 3] = radius * Math.cos(angle);
            pos[i * 3 + 1] = (Math.random() - 0.5) * 45; // Spanning height from bottom to top
            pos[i * 3 + 2] = radius * Math.sin(angle);
            
            // Tiny drift speeds
            vel[i * 3] = (Math.random() - 0.5) * 0.05;
            vel[i * 3 + 1] = Math.random() * 0.08 + 0.03; // Slowly floating upwards
            vel[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
            
            sz[i] = Math.random() * 0.15 + 0.05;
        }
        return [pos, vel, sz];
    }, []);

    useFrame((state) => {
        const time = state.clock.elapsedTime;
        if (groupRef.current) {
            // Gently sway the whole light shafts group
            groupRef.current.rotation.y = time * 0.02;
            groupRef.current.rotation.z = Math.sin(time * 0.15) * 0.02;

            // Pulse the opacity of individual rays to look like shifting atmospheric dust
            groupRef.current.children.forEach((child, idx) => {
                if (child.material && child.material.uniforms) {
                    const offset = idx * 1.5;
                    child.material.uniforms.uTime.value = time;
                    child.material.uniforms.uOpacity.value = (0.22 + Math.sin(time * 0.6 + offset) * 0.08) * (activeProfile.key.intensity / 1.3);
                    child.material.uniforms.uColor.value.set(activeProfile.key.color);
                }
            });
        }

        if (pointsRef.current) {
            const geo = pointsRef.current.geometry;
            const posArr = geo.attributes.position.array;
            for (let i = 0; i < moteCount; i++) {
                // Drift motes upwards
                posArr[i * 3 + 1] += velocities[i * 3 + 1] * 0.15;
                posArr[i * 3] += Math.sin(time * 0.3 + i) * 0.008;
                posArr[i * 3 + 2] += Math.cos(time * 0.3 + i) * 0.008;

                // Reset if they float too high
                if (posArr[i * 3 + 1] > 25) {
                    posArr[i * 3 + 1] = -25;
                }
            }
            geo.attributes.position.needsUpdate = true;
        }
    });

    const rayColor = activeProfile.key.color;

    // Bioshock-inspired warm bokeh light texture with blurred outer halo
    const bokehTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        // Create radial gradient for a soft, out-of-focus circular orb
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        grad.addColorStop(0.15, 'rgba(254, 240, 138, 0.85)'); // Warm glow center
        grad.addColorStop(0.45, 'rgba(251, 191, 36, 0.35)');  // Soft amber transition
        grad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');      // Smooth fade-out edge
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(canvas);
    }, []);

    const rayUniforms = useMemo(() => {
        return [
            { uColor: { value: new THREE.Color(rayColor) }, uOpacity: { value: 0.22 }, uTime: { value: 0 }, uOffset: { value: 0 } },
            { uColor: { value: new THREE.Color(rayColor) }, uOpacity: { value: 0.22 }, uTime: { value: 0 }, uOffset: { value: 1.5 } },
            { uColor: { value: new THREE.Color(rayColor) }, uOpacity: { value: 0.22 }, uTime: { value: 0 }, uOffset: { value: 3.0 } },
            { uColor: { value: new THREE.Color(rayColor) }, uOpacity: { value: 0.22 }, uTime: { value: 0 }, uOffset: { value: 4.5 } }
        ];
    }, [rayColor]);

    return (
        <group ref={groupRef} position={[0, 15, 0]}>
            {/* Volumetric light ray shafts casting through open space of the arena from top to bottom */}
            {[
                { pos: [-4, 0, -3], rot: [0.35, 0, 0.45], scale: [1, 50, 1], radius: 1.5 },
                { pos: [6, 0, 4], rot: [-0.25, 0, -0.35], scale: [1.25, 55, 1.25], radius: 2.0 },
                { pos: [-2, 0, 6], rot: [0.15, 0, -0.45], scale: [0.85, 48, 0.85], radius: 1.2 },
                { pos: [2, 0, -5], rot: [-0.1, 0, 0.25], scale: [1.1, 52, 1.1], radius: 1.7 }
            ].map((ray, idx) => (
                <mesh 
                    key={idx} 
                    position={ray.pos} 
                    rotation={ray.rot} 
                    scale={ray.scale}
                >
                    <cylinderGeometry args={[ray.radius * 0.15, ray.radius, 1.0, 16, 1, true]} />
                    <shaderMaterial
                        vertexShader={VolumetricRayShader.vertexShader}
                        fragmentShader={VolumetricRayShader.fragmentShader}
                        uniforms={rayUniforms[idx]}
                        transparent={true}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            ))}

            {/* Shimmering dust motes floating inside the shafts */}
            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[positions, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={1.5}
                    map={bokehTexture}
                    transparent={true}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    color={rayColor}
                    opacity={0.7}
                />
            </points>
        </group>
    );
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
            <GodRays3D activeProfile={activeProfile} />
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

export default function CanvasRenderer3D({ entropy = 0.4, selectedNode, onNodeClick, selectedCard = null, onExecuteAction = () => {}, onMoveHero = () => {}, threads = [], myThreadId = null, shakeIntensity = 0, turnsElapsed = 1, map = [], terrainTelemetry = null, ultimateFlash = false, gameMode = 'SANDBOX', weatherOverride = null, activeTransitions = [], onTransitionComplete, surgeTile = null, scorchedTiles = [], hoveredNode: externalHoveredNode, setHoveredNode: externalSetHoveredNode, realityPhase = 'STANDARD', onCollectFlag = () => {}, isOverlayActive = false }) {
    const hasWebGL = useMemo(() => isWebGLAvailable(), []);
    const [isLowPower, setIsLowPower] = useState(false);
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    const gridData = useMemo(() => generate3DGrid(), []);

    const visibleChunksCount = useMemo(() => {
        const myThread = threads.find(t => t.id === myThreadId);
        if (!myThread || !myThread.quests) return 4;
        const completedCount = myThread.quests.filter(q => q.completed).length;
        return Math.min(9, 4 + completedCount);
    }, [threads, myThreadId]);

    const visibleGridData = useMemo(() => {
        return gridData.filter(node => node.macroIndex < visibleChunksCount);
    }, [gridData, visibleChunksCount]);
    const [limits, setLimits] = useState({
        kclIterations: 24,
        uniformThrottleHz: 10,
        maxInstancedProps: 50,
        enableVolumetricFog: true
    });
    
    // Calculate which node IDs are collapsing this turn (including locked/collapsed campaign islands)
    const collapsingNodeIds = useMemo(() => {
        const base = AdrenalineDirector.getCollapsingNodes(turnsElapsed, gridData);
        if (map) {
            gridData.forEach(node => {
                const serverChunk = map.find(c => c.id === node.macroIndex);
                const serverBlock = serverChunk?.blocks?.find(b => b.id === node.subIndex);
                if (serverBlock && serverBlock.walkable === false) {
                    if (!base.includes(node.id)) {
                        base.push(node.id);
                    }
                }
            });
        }
        return base;
    }, [turnsElapsed, gridData, map]);

    const [localHoveredNode, localSetHoveredNode] = useState(null);
    const hoveredNode = externalHoveredNode !== undefined ? externalHoveredNode : localHoveredNode;
    const setHoveredNode = externalSetHoveredNode !== undefined ? externalSetHoveredNode : localSetHoveredNode;

    const [hudConfig, setHudConfig] = useState(null);
    const [backofficeRegs, setBackofficeRegs] = useState(null);

    useEffect(() => {
        const fetchRegs = () => {
            fetch('/api/backoffice/regulators')
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data) setBackofficeRegs(data);
                })
                .catch(() => {});
        };
        fetchRegs();
        const interval = setInterval(fetchRegs, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleUpdate = (e) => {
            setHudConfig(e.detail);
        };
        window.addEventListener('spatial_guidance_update', handleUpdate);
        return () => window.removeEventListener('spatial_guidance_update', handleUpdate);
    }, []);

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
        visibleGridData.forEach(node => groups[node.macroIndex].push(node));
        return groups.filter(g => g.length > 0);
    }, [visibleGridData]);

    const matrixSource = useMemo(() => {
        if (hudConfig) {
            const srcThread = threads.find(t => t.id === hudConfig.sourceId) || threads[0];
            if (srcThread && srcThread.position && srcThread.position.meta !== undefined && srcThread.position.meta !== null) {
                return { meta: srcThread.position.meta, hex: srcThread.position.hex };
            }
        } else if (selectedCard) {
            const activeHero = threads.find(t => t.id === (threads[0]?.id || 'thread_king_ai'));
            if (activeHero && activeHero.position && activeHero.position.meta !== undefined && activeHero.position.meta !== null) {
                return { meta: activeHero.position.meta, hex: activeHero.position.hex };
            }
        }
        return null;
    }, [hudConfig, selectedCard, threads]);

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

    const cameraPosition = [28, 24, 28];
    const cameraFov = isMobile ? 32 : 24;

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
            <Canvas shadows={{ type: THREE.PCFShadowMap }}>
                <color attach="background" args={[PALETTE.space.background]} />
                <fog attach="fog" args={[WORLD.fog.color, WORLD.fog.near, WORLD.fog.far]} />
                <StarfieldBackground />
                <BackgroundEnvironment3D 
                    activeBiome={activeBiome} 
                    entropy={entropy} 
                    ultimateFlash={ultimateFlash}
                    scorchedTilesCount={scorchedTiles?.length || 0}
                />
                <FloatingShards3D />
                <HardwareGovernorController 
                    onLimitsChange={setLimits} 
                    globalEntropyStress={entropy} 
                />

                {/* Kamera dynamicky prispôsobená pre mobilné zariadenia */}
                <PerspectiveCamera makeDefault position={cameraPosition} fov={cameraFov} near={0.1} far={1000} />
                <MapControls 
                    enableDamping 
                    enableRotate={true} // Povolí otáčanie pre plný 3D zážitok z bojišťa
                    minDistance={10} 
                    maxDistance={120} 
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
                    selectedNode={selectedNode}
                    hoveredNode={hoveredNode}
                />

                {/* Dynamické osvetlenie a volumetrické profily sveta */}
                <EnvironmentController activeBiome={activeBiome} entropy={entropy} weatherOverride={weatherOverride} />

                {/* 3D Scéna - Vykreslenie 63 Hexov */}
                <ArenaGroup shakeIntensity={shakeIntensity}>
                    {visibleGridData.map((node) => {
                        const isCollapsing = collapsingNodeIds.includes(node.id);
                        const serverChunk = map?.find(c => c.id === node.macroIndex);
                        const serverBlock = serverChunk?.blocks?.find(b => b.id === node.subIndex);
                        const hasChest = !!serverBlock?.hasOpportunity || !!serverBlock?.hasChest;
                        const hasTrap = serverBlock?.hasTrap || null;

                        const targetableType = (() => {
                            const activeHero = threads.find(t => t.id === (threads[0]?.id || 'thread_king_ai'));
                            if (!activeHero || activeHero.position?.meta === undefined || activeHero.position?.meta === null) return null;
                            const dist = getMetaDistance(activeHero.position.meta, node.macroIndex);

                            if (!selectedCard) {
                                if (activeHero.freeMovementUsed) return null;
                                return dist <= (activeHero.movementBase || 1) ? 'move' : null;
                            }

                            const base = allBases.find(b => b.id === selectedCard.id);
                            if (!base) return null;
                            const isAttackNode = base.cardCategorization === 'attack' || base.damage > 0;
                            const isMoveNode = selectedCard.id.includes('teleport') || selectedCard.id.includes('gate');
                            const reach = isAttackNode ? (activeHero.attackReach || 1) : (activeHero.spellReach || 2);
                            const isTargetable = reach === 0 ? dist === 0 : dist <= reach;
                            if (!isTargetable) return null;

                            if (isMoveNode) return 'move';
                            if (isAttackNode) return 'attack';
                            return 'spell';
                        })();

                        const isTargetable = !!targetableType;

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

                        const activeHero = threads.find(t => t.id === (threads[0]?.id || 'thread_king_ai'));
                        const distanceToPlayer = activeHero && activeHero.position && activeHero.position.meta !== null && activeHero.position.meta !== undefined
                            ? getMetaDistance(activeHero.position.meta, node.macroIndex)
                            : null;
                        
                        const maxRange = (() => {
                            if (!activeHero) return 1;
                            if (!selectedCard) return activeHero.movementBase || 1;
                            const base = allBases.find(b => b.id === selectedCard.id);
                            if (!base) return 1;
                            const isAttackNode = base.cardCategorization === 'attack' || base.damage > 0;
                            return isAttackNode ? (activeHero.attackReach || 1) : (activeHero.spellReach || 2);
                        })();

                        return (
                            <HexagonNode3D
                                key={node.id}
                                node={node}
                                turnsElapsed={turnsElapsed}
                                isHovered={hoveredNode?.id === node.id || hoveredNode?.macroIndex === node.macroIndex}
                                isSelected={selectedNode?.id === node.id}
                                isTargetable={isTargetable}
                                targetableType={targetableType}
                                onHover={setHoveredNode}
                                onClick={onNodeClick}
                                onDoubleClick={handleDoubleClick}
                                isCollapsing={isCollapsing}
                                entropy={entropy}
                                hasChest={hasChest}
                                hasChestOnly={!!serverBlock?.hasChest}
                                hasOpportunity={serverBlock?.hasOpportunity || null}
                                hasTrap={hasTrap}
                                terrainTelemetry={terrainTelemetry}
                                weatherOverride={weatherOverride}
                                isSurgeActive={surgeTile && surgeTile.meta === node.macroIndex && surgeTile.hex === node.subIndex}
                                isScorched={scorchedTiles.includes(`m${node.macroIndex}_s${node.subIndex}`)}
                                distanceToPlayer={distanceToPlayer}
                                maxRange={maxRange}
                                selectedCard={selectedCard}
                                realityPhase={realityPhase}
                                matrixSource={matrixSource}
                                threads={threads}
                                onCollectFlag={onCollectFlag}
                                backofficeRegs={backofficeRegs}
                                isOverlayActive={isOverlayActive}
                            />
                        );
                    })}

                    {/* Concentric Aiming Sectors (Rings) relative to the active player's position */}
                    {(() => {
                        if (!selectedCard) return null;
                        const activeHero = threads.find(t => t.id === (threads[0]?.id || 'thread_king_ai'));
                        if (!activeHero || activeHero.position?.meta === undefined || activeHero.position?.meta === null) return null;
                        
                        const heroNode = gridData.find(n => n.macroIndex === activeHero.position.meta && n.subIndex === activeHero.position.hex);
                        if (!heroNode) return null;

                        const base = allBases.find(b => b.id === selectedCard.id);
                        if (!base) return null;
                        const isAttackNode = base.cardCategorization === 'attack' || base.damage > 0;
                        const reach = isAttackNode ? (activeHero.attackReach || 1) : (activeHero.spellReach || 2);

                        const rings = [];
                        for (let r = 1; r <= reach; r++) {
                            const radius = r * 6.8;
                            rings.push(
                                <mesh key={`reach_ring_${r}`} position={[heroNode.position[0], 0.05, heroNode.position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
                                    <ringGeometry args={[radius - 0.1, radius + 0.1, 64]} />
                                    <meshBasicMaterial color={r === reach ? '#ef4444' : '#00ffcc'} transparent opacity={0.15} />
                                </mesh>
                            );
                        }
                        return rings;
                    })()}

                    {/* experimental_v2: Absolute path trajectory line and cost estimation overlays */}
                    {(() => {
                        let sourceMeta = 0;
                        let sourceHex = 0;
                        let targetMeta = 0;
                        let targetHex = 0;
                        let voltageVal = 2;

                        if (selectedCard && hoveredNode) {
                            const activeHero = threads.find(t => t.id === (threads[0]?.id || 'thread_king_ai'));
                            if (!activeHero || activeHero.position?.meta === undefined) return null;
                            sourceMeta = activeHero.position.meta;
                            sourceHex = activeHero.position.hex;
                            targetMeta = hoveredNode.macroIndex;
                            targetHex = hoveredNode.subIndex;
                            const base = allBases.find(b => b.id === selectedCard.id);
                            if (base) {
                                voltageVal = selectedCard.voltage || 2;
                            }
                        } else if (hudConfig) {
                            const srcThread = threads.find(t => t.id === hudConfig.sourceId) || threads[0];
                            if (!srcThread || srcThread.position?.meta === undefined) return null;
                            sourceMeta = srcThread.position.meta;
                            sourceHex = srcThread.position.hex;

                            if (hudConfig.targetType === 'threads') {
                                const tgt = threads.find(t => t.id === hudConfig.targetId);
                                if (!tgt) return null;
                                targetMeta = tgt.meta || 0;
                                targetHex = tgt.hex || 0;
                            } else if (hudConfig.targetType === 'custom') {
                                targetMeta = hudConfig.customMeta;
                                targetHex = hudConfig.customHex;
                            } else if (hudConfig.targetType === '8direction') {
                                const srcPos = SpatialGuidanceSystem.resolveCartesian(sourceMeta, sourceHex);
                                const projectedTarget = SpatialGuidanceSystem.resolveEightDirectionTarget(srcPos, hudConfig.eightDDir, hudConfig.eightDDist);
                                let closestNode = gridData[0];
                                let minDistance = Infinity;
                                for (const node of gridData) {
                                    const dx = node.position[0] - projectedTarget.x;
                                    const dz = node.position[2] - projectedTarget.z;
                                    const d = dx*dx + dz*dz;
                                    if (d < minDistance) {
                                        minDistance = d;
                                        closestNode = node;
                                    }
                                }
                                targetMeta = closestNode.macroIndex;
                                targetHex = closestNode.subIndex;
                            } else {
                                return null;
                            }
                        } else {
                            return null;
                        }

                        const heroNode = gridData.find(n => n.macroIndex === sourceMeta && n.subIndex === sourceHex);
                        const hoverGridNode = gridData.find(n => n.macroIndex === targetMeta && n.subIndex === targetHex);
                        if (!heroNode || !hoverGridNode) return null;

                        // Calculate actual path points using Pathfinder
                        let pathSteps = [];
                        try {
                            const blocks = map && map.length > 0 ? map.flatMap(c => 
                                (c.blocks || []).map(b => ({
                                    chunkId: c.id,
                                    blockId: b.id,
                                    walkable: b.walkable !== false,
                                    energyCostMultiplier: b.energyCostMultiplier || 1.0,
                                    hazardIndex: b.hazardIndex || 0.0
                                }))
                            ) : [];
                            pathSteps = Pathfinder.findPath(
                                sourceMeta,
                                sourceHex,
                                targetMeta,
                                targetHex,
                                blocks
                            ) || [];
                        } catch (e) {
                            pathSteps = [
                                { chunkId: sourceMeta, blockId: sourceHex },
                                { chunkId: targetMeta, blockId: targetHex }
                            ];
                        }

                        if (pathSteps.length === 0) {
                            pathSteps = [
                                { chunkId: sourceMeta, blockId: sourceHex },
                                { chunkId: targetMeta, blockId: targetHex }
                            ];
                        }

                        const points = pathSteps.map(step => {
                            const nodeCoord = gridData.find(n => n.macroIndex === step.chunkId && n.subIndex === step.blockId);
                            return nodeCoord ? new THREE.Vector3(nodeCoord.position[0], 0.5, nodeCoord.position[2]) : null;
                        }).filter(Boolean);

                        if (points.length < 2) return null;

                        const startPos = SpatialGuidanceSystem.resolveCartesian(sourceMeta, sourceHex);
                        const endPos = SpatialGuidanceSystem.resolveCartesian(targetMeta, targetHex);
                        const eucDistance = SpatialGuidanceSystem.calculateDistance(startPos, endPos);
                        const trajectoryCost = eucDistance * 10 * voltageVal;

                        const startVec = points[0];
                        const endVec = points[points.length - 1];
                        const dirVec = new THREE.Vector3().subVectors(endVec, startVec);
                        const distanceLen = dirVec.length();
                        const directionNorm = dirVec.clone().normalize();
                        const up = new THREE.Vector3(0, 1, 0);
                        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, directionNorm);
                        const midPoint = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);

                        return (
                            <group>
                                {points.map((p, idx) => (
                                    <mesh key={idx} position={[p.x, p.y + 0.1, p.z]}>
                                        <sphereGeometry args={[0.08, 16, 16]} />
                                        <meshBasicMaterial color="#ef4444" />
                                    </mesh>
                                ))}
                                {distanceLen > 0.2 && (
                                    <group>
                                        <mesh position={[midPoint.x, midPoint.y + 0.15, midPoint.z]} quaternion={quaternion}>
                                            <cylinderGeometry args={[0.02, 0.02, distanceLen, 8]} />
                                            <meshBasicMaterial color="#ef4444" transparent opacity={0.7} />
                                        </mesh>
                                        <mesh position={[endVec.x, endVec.y + 0.15, endVec.z]} quaternion={quaternion}>
                                            <coneGeometry args={[0.12, 0.35, 8]} />
                                            <meshBasicMaterial color="#ef4444" />
                                        </mesh>
                                    </group>
                                )}
                                {!isOverlayActive && (
                                    <Html distanceFactor={14} position={[points[points.length - 1].x, points[points.length - 1].y + 1.2, points[points.length - 1].z]} center>
                                        <div className="glass-panel-heavy p-2 text-[8px] text-white border border-red-500 rounded bg-slate-950/90 w-44 backdrop-blur font-mono">
                                            <div className="font-bold text-red-400 uppercase tracking-wider mb-1 text-[9px]">EXPERIMENTAL_V2 GUIDANCE</div>
                                            <div>Src Cartesian: [{startPos.x.toFixed(1)}, {startPos.y.toFixed(1)}, {startPos.z.toFixed(1)}]</div>
                                            <div>Tgt Cartesian: [{endPos.x.toFixed(1)}, {endPos.y.toFixed(1)}, {endPos.z.toFixed(1)}]</div>
                                            <div className="text-yellow-400">Euclidean Dist: {eucDistance.toFixed(2)}m</div>
                                            <div className="text-cyan-400 font-bold border-t border-slate-800 mt-1 pt-1">Est. Trajectory Cost: {trajectoryCost.toFixed(1)}W</div>
                                            <div className="text-[7px] text-slate-500 italic mt-0.5">Calculated by SpatialGuidanceSystem</div>
                                        </div>
                                    </Html>
                                )}
                            </group>
                        );
                    })()}

                    {/* Rekvizity biómov — Optimalizované vykresľovanie cez Instanced Rendering a zdieľané materiály */}
                    <InstancedWorldProps 
                        gridData={visibleGridData} 
                        collapsingNodeIds={collapsingNodeIds} 
                        maxInstancedProps={limits.maxInstancedProps}
                    />

                    {/* Floating mana particles across the whole arena */}
                    <ArenaAmbientParticles 
                        entropy={entropy} 
                        hazardIndex={currentHazardIndex}
                    />

                    {/* Centrálny magický vír — srdce ostrova */}
                    {portalNode && portalNode.macroIndex < visibleChunksCount && (
                        <PortalVortex3D position={[portalNode.position[0], 0.55, portalNode.position[2]]} />
                    )}

                    {/* Volumetric Fog Layer controlled by HardwareGovernor */}
                    {limits.enableVolumetricFog && (
                        <VolumetricFog3D entropy={entropy} />
                    )}

                    {/* Hero Aura rings + ground glow — mounted per thread, LERP-tracked */}
                    {threads.map((thread) => (
                        <HeroAura
                            key={`aura_${thread.id}`}
                            thread={thread}
                            gridData={visibleGridData}
                        />
                    ))}

                    {/* Vykreslenie plynule Lerp-ovaných figúrok postáv */}
                    {threads.map((thread) => {
                        const associatedNode = thread.position && thread.position.meta !== null && thread.position.hex !== null
                            ? visibleGridData.find(n => n.macroIndex === thread.position.meta && n.subIndex === thread.position.hex)
                            : null;

                        const handleMiniatureClick = () => {
                            if (associatedNode) {
                                onNodeClick(associatedNode);
                            }
                        };

                        const handleMiniatureDoubleClick = () => {
                            if (associatedNode && selectedCard) {
                                const activeHero = threads.find(t => t.id === (threads[0]?.id || 'thread_king_ai'));
                                if (activeHero && activeHero.position?.meta !== undefined && activeHero.position?.meta !== null) {
                                    const dist = getMetaDistance(activeHero.position.meta, associatedNode.macroIndex);
                                    const base = allBases.find(b => b.id === selectedCard.id);
                                    if (base) {
                                        const isAttackNode = base.cardCategorization === 'attack' || base.damage > 0;
                                        const reach = isAttackNode ? (activeHero.attackReach || 1) : (activeHero.spellReach || 2);
                                        const isTargetable = reach === 0 ? dist === 0 : dist <= reach;
                                        if (isTargetable) {
                                            onNodeClick(associatedNode);
                                            setTimeout(() => {
                                                onExecuteAction();
                                            }, 50);
                                        }
                                    }
                                }
                            }
                        };

                        return (
                            <ThreadMiniature 
                                key={thread.id}
                                thread={thread}
                                gridData={visibleGridData}
                                onClick={handleMiniatureClick}
                                onDoubleClick={handleMiniatureDoubleClick}
                                isLocalPlayer={thread.id === myThreadId}
                            />
                        );
                    })}

                    {/* Hero hit VFX — mounted per thread */}
                    {threads.map((thread) => (
                        <HeroImpactVFX
                            key={`vfx_${thread.id}`}
                            thread={thread}
                            gridData={visibleGridData}
                        />
                    ))}

                    {/* Vykreslenie projektilov kúziel */}
                    <SpellProjectile3D threads={threads} gridData={visibleGridData} />

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
                <EffectComposer>
                    <AestheticCompositor entropy={entropy} isLowPower={isLowPower} realityPhase={realityPhase} />
                </EffectComposer>
            </Canvas>
        </div>
    );
}
