import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function BiomeTransitionVFX({ position, color, onComplete }) {
  const ringRef = useRef();
  const particlesRef = useRef();
  const count = 30;

  // Particle positions & velocities
  const [positions, velocities, ages] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vels = new Float32Array(count * 3);
    const ags = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Start in a small ring around tile center
      const angle = Math.random() * Math.PI * 2;
      const r = 0.2 + Math.random() * 0.4;
      pos[i * 3] = r * Math.cos(angle);
      pos[i * 3 + 1] = r * Math.sin(angle);
      pos[i * 3 + 2] = 0.5 + Math.random() * 0.2;

      // Expand outwards and upwards
      const speed = 1.0 + Math.random() * 1.5;
      vels[i * 3] = Math.cos(angle) * speed;
      vels[i * 3 + 1] = Math.sin(angle) * speed;
      vels[i * 3 + 2] = 2.0 + Math.random() * 2.0; // rising speed

      ags[i] = 0; // age
    }

    return [pos, vels, ags];
  }, []);

  useFrame((state, delta) => {
    // 1. Animate Ring expansion
    if (ringRef.current) {
      ringRef.current.scale.x += delta * 4.5;
      ringRef.current.scale.y += delta * 4.5;
      if (ringRef.current.material) {
        ringRef.current.material.opacity = Math.max(0, ringRef.current.material.opacity - delta * 1.8);
      }
    }

    // 2. Animate Particles
    if (particlesRef.current) {
      const posAttr = particlesRef.current.geometry.attributes.position;
      let allExpired = true;

      for (let i = 0; i < count; i++) {
        ages[i] += delta;
        if (ages[i] < 0.65) {
          allExpired = false;
          // Apply velocity
          posAttr.setX(i, posAttr.getX(i) + velocities[i * 3] * delta);
          posAttr.setY(i, posAttr.getY(i) + velocities[i * 3 + 1] * delta);
          posAttr.setZ(i, posAttr.getZ(i) + velocities[i * 3 + 2] * delta);
        }
      }
      posAttr.needsUpdate = true;

      // Fade out particles
      if (particlesRef.current.material) {
        particlesRef.current.material.opacity = Math.max(0, 1.0 - ages[0] / 0.65);
      }

      if (allExpired && onComplete) {
        onComplete();
      }
    }
  });

  return (
    <group position={position}>
      {/* 3D Ring Splash */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.45, 0]}>
        <ringGeometry args={[0.3, 0.45, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Upward Particle Fountain */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color={color}
          size={0.15}
          transparent
          opacity={1.0}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
