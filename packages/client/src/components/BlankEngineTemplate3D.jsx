import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── GEOMETRY & MATERIAL CACHE (Rule 1 Compliance) ───────────────────────────
// These are instantiated once at load time, preventing garbage collection spikes.
const GEOMETRIES = {
    tile: new THREE.CylinderGeometry(0.95, 1.0, 0.2, 6),
    marker: new THREE.SphereGeometry(0.12, 12, 12),
};

const MATERIALS = {
    standardTile: new THREE.MeshStandardMaterial({
        color: '#1e1e24',
        roughness: 0.8,
        metalness: 0.2
    }),
    hoveredTile: new THREE.MeshBasicMaterial({
        color: '#39ff14',
        wireframe: true,
        transparent: true,
        opacity: 0.8
    }),
    actorCore: new THREE.MeshStandardMaterial({
        color: '#ffd700',
        emissive: '#ffd700',
        emissiveIntensity: 1.2
    })
};

// ─── CENTRALIZED PRIORITY MATRIX & CAMERA FOCUS (Milestone 1-3) ───────────────
function SceneController({ hoveredNode, setHoveredNode }) {
    const lastUniformTime = useRef(0);
    const cameraTarget = useRef(new THREE.Vector3(0, 0, 0));

    // Listen to custom server-event triggers to execute action animations on actors
    useEffect(() => {
        const handleEvent = (e) => {
            console.log('[BLANK_ENGINE] Event triggered for target:', e.detail);
            // Instantly transition camera focus to trigger target location
            if (e.detail?.position) {
                cameraTarget.current.set(...e.detail.position);
            }
        };
        window.addEventListener('blank_engine_action_trigger', handleEvent);
        return () => window.removeEventListener('blank_engine_action_trigger', handleEvent);
    }, []);

    useFrame((state, delta) => {
        const elapsed = state.clock.getElapsedTime();

        // 1. Throttled GPU Uniform Updating (10Hz Pacing - Rule 5)
        if (elapsed - lastUniformTime.current > 0.1) {
            // update custom shaders here
            lastUniformTime.current = elapsed;
        }

        // 2. Smooth Camera Lens Focus LERPing
        state.camera.lookAt(
            THREE.MathUtils.lerp(state.camera.position.x - 2, cameraTarget.current.x, 0.05),
            THREE.MathUtils.lerp(state.camera.position.y - 5, cameraTarget.current.y, 0.05),
            THREE.MathUtils.lerp(state.camera.position.z - 8, cameraTarget.current.z, 0.05)
        );
    });

    return null;
}

// ─── PROCEDURAL ACTOR REPRESENTATION ──────────────────────────────────────────
function TemplateActor({ position }) {
    const actorRef = useRef();

    useFrame((state) => {
        if (actorRef.current) {
            // Smooth idle breathing bobbing
            actorRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 2.5) * 0.05;
        }
    });

    return (
        <mesh 
            ref={actorRef}
            position={position}
            geometry={GEOMETRIES.marker}
            material={MATERIALS.actorCore}
            castShadow
        />
    );
}

// ─── BLANK ENGINE CANVAS TEMPLATE ─────────────────────────────────────────────
export default function BlankEngineTemplate3D() {
    const [hoveredNode, setHoveredNode] = React.useState(null);

    // Mock Grid Data Array (e.g. 7 Hexagonal blocks)
    const mockNodes = useMemo(() => {
        const list = [];
        for (let q = -1; q <= 1; q++) {
            for (let r = -1; r <= 1; r++) {
                if (q + r >= -1 && q + r <= 1) {
                    const x = 1.75 * q + 0.875 * r;
                    const z = 1.5 * r;
                    list.push({ id: `q${q}_r${r}`, pos: [x, 0, z] });
                }
            }
        }
        return list;
    }, []);

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#0a0a0c' }}>
            <Canvas
                shadows
                camera={{ position: [2, 5, 8], fov: 45 }}
            >
                <ambientLight intensity={0.2} />
                <directionalLight 
                    position={[5, 10, 5]} 
                    intensity={1.0} 
                    castShadow 
                    shadow-mapSize-width={512} 
                    shadow-mapSize-height={512} 
                />

                {/* Grid Render loop using Cached geometries & materials */}
                {mockNodes.map(node => (
                    <group 
                        key={node.id} 
                        position={node.pos}
                        onPointerOver={() => setHoveredNode(node.id)}
                        onPointerOut={() => setHoveredNode(null)}
                    >
                        <mesh 
                            rotation={[Math.PI / 6, 0, 0]} 
                            geometry={GEOMETRIES.tile} 
                            material={MATERIALS.standardTile} 
                            receiveShadow 
                        />
                        {hoveredNode === node.id && (
                            <mesh 
                                rotation={[Math.PI / 6, 0, 0]} 
                                position={[0, 0.12, 0]}
                                geometry={GEOMETRIES.tile} 
                                material={MATERIALS.hoveredTile} 
                            />
                        )}
                    </group>
                ))}

                {/* Render Template Actor */}
                <TemplateActor position={[0, 0.4, 0]} />

                {/* Core scene and camera pacing controller */}
                <SceneController hoveredNode={hoveredNode} setHoveredNode={setHoveredNode} />
            </Canvas>

            {/* Docked HUD Layer overlay */}
            <div style={{
                position: 'absolute',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '16px 24px',
                borderRadius: 16,
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                fontFamily: 'sans-serif',
                textAlign: 'center',
                pointerEvents: 'none'
            }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: 16, color: '#39ff14' }}>SOVEREIGN BLANK ENGINE V1</h3>
                <span style={{ fontSize: 12, opacity: 0.7 }}>Hovered Block Address: {hoveredNode || 'None'}</span>
            </div>
        </div>
    );
}
