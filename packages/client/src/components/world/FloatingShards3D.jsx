import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE, WORLD } from '../../design/worldDesign';
import { createSeededRandom } from '../../design/seededRandom';

// Odlomené skalné úlomky vznášajúce sa okolo ostrova (worldImage: kamene pod ostrovom).
export default function FloatingShards3D() {
    const groupRef = useRef();

    const shards = useMemo(() => {
        const rnd = createSeededRandom(97);
        return Array.from({ length: WORLD.shardCount }, () => ({
            angle: rnd() * Math.PI * 2,
            radius: 15 + rnd() * 10,
            y: -2 - rnd() * 6,
            scale: 0.15 + rnd() * 0.45,
            rotSpeed: 0.05 + rnd() * 0.15,
            bobPhase: rnd() * Math.PI * 2,
            bobAmp: 0.2 + rnd() * 0.3,
        }));
    }, []);

    const geometry = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);
    const material = useMemo(
        () => new THREE.MeshStandardMaterial({
            color: PALETTE.rock.underside,
            roughness: 1,
            metalness: 0,
            flatShading: true,
        }),
        [],
    );

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const time = state.clock.elapsedTime;
        groupRef.current.children.forEach((mesh, i) => {
            const s = shards[i];
            mesh.rotation.y += s.rotSpeed * delta;
            mesh.position.y = s.y + Math.sin(time * 0.4 + s.bobPhase) * s.bobAmp;
        });
    });

    return (
        <group ref={groupRef}>
            {shards.map((s, i) => (
                <mesh
                    key={i}
                    geometry={geometry}
                    material={material}
                    position={[Math.cos(s.angle) * s.radius, s.y, Math.sin(s.angle) * s.radius]}
                    scale={s.scale}
                />
            ))}
        </group>
    );
}
