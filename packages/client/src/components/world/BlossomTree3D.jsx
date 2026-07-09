import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { BIOME_SPECS } from '../../design/worldDesign';
import { createSeededRandom } from '../../design/seededRandom';

const TRUNK_COLOR = '#201d27'; // tmavý pokrútený kmeň z worldImage
const PETAL_COUNT = 8;

// Padajúce lupienky pod korunou.
function FallingPetals({ seed }) {
    const pointsRef = useRef();
    const seeds = useMemo(() => {
        const rnd = createSeededRandom(seed + 100);
        return Array.from({ length: PETAL_COUNT }, () => ({
            angle: rnd() * Math.PI * 2,
            r: 0.3 + rnd() * 0.6,
            phase: rnd() * Math.PI * 2,
            speed: 0.15 + rnd() * 0.2,
        }));
    }, [seed]);
    const positions = useMemo(() => new Float32Array(PETAL_COUNT * 3), []);

    useFrame((state) => {
        if (!pointsRef.current) return;
        const time = state.clock.elapsedTime;
        const posAttr = pointsRef.current.geometry.attributes.position;
        for (let i = 0; i < PETAL_COUNT; i++) {
            const s = seeds[i];
            const y = 1.6 - ((time * s.speed + s.phase) % 1.6);
            posAttr.setXYZ(
                i,
                Math.cos(s.angle) * s.r + Math.sin(time * 1.5 + s.phase) * 0.12,
                y,
                Math.sin(s.angle) * s.r,
            );
        }
        posAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            </bufferGeometry>
            <pointsMaterial color={BIOME_SPECS.LUSH_FOREST.accent} size={0.07} transparent opacity={0.9} depthWrite={false} />
        </points>
    );
}

// Ružový strom z lúky (worldImage vpravo).
export default function BlossomTree3D({ seed = 1 }) {
    const rnd = useMemo(() => createSeededRandom(seed), [seed]);
    const lean = useMemo(() => (rnd() - 0.5) * 0.35, [rnd]);

    return (
        <group rotation={[0, 0, lean]}>
            {/* Kmeň + konár */}
            <mesh position={[0, 0.55, 0]} castShadow>
                <cylinderGeometry args={[0.09, 0.15, 1.1, 6]} />
                <meshStandardMaterial color={TRUNK_COLOR} roughness={1} metalness={0} flatShading />
            </mesh>
            <mesh position={[0.28, 0.95, 0]} rotation={[0, 0, -0.7]} castShadow>
                <cylinderGeometry args={[0.05, 0.08, 0.6, 5]} />
                <meshStandardMaterial color={TRUNK_COLOR} roughness={1} metalness={0} flatShading />
            </mesh>
            {/* Koruna — 3 ružové gule */}
            <mesh position={[0, 1.35, 0]} castShadow>
                <sphereGeometry args={[0.55, 10, 8]} />
                <meshStandardMaterial color={BIOME_SPECS.LUSH_FOREST.accent} roughness={1} metalness={0} flatShading />
            </mesh>
            <mesh position={[0.5, 1.15, 0.1]} castShadow>
                <sphereGeometry args={[0.4, 9, 7]} />
                <meshStandardMaterial color={BIOME_SPECS.LUSH_FOREST.accent} roughness={1} metalness={0} flatShading />
            </mesh>
            <mesh position={[-0.35, 1.1, -0.15]} castShadow>
                <sphereGeometry args={[0.32, 9, 7]} />
                <meshStandardMaterial color={BIOME_SPECS.LUSH_FOREST.accent} roughness={1} metalness={0} flatShading />
            </mesh>
            <FallingPetals seed={seed} />
        </group>
    );
}
