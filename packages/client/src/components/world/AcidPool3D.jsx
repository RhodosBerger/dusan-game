import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { BIOME_SPECS } from '../../design/worldDesign';
import { createSeededRandom } from '../../design/seededRandom';

// Kyselinové jazierko s magenta kvetmi (worldImage: močiar dole).
export default function AcidPool3D({ seed = 1 }) {
    const poolRef = useRef();

    const flowers = useMemo(() => {
        const rnd = createSeededRandom(seed);
        return Array.from({ length: 5 }, () => ({
            angle: rnd() * Math.PI * 2,
            r: 0.95 + rnd() * 0.35,
        }));
    }, [seed]);

    useFrame((state) => {
        if (poolRef.current?.material) {
            poolRef.current.material.emissiveIntensity = 0.75 + 0.2 * Math.sin(state.clock.elapsedTime * 1.8);
        }
    });

    return (
        <group>
            <mesh ref={poolRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
                <circleGeometry args={[0.9, 24]} />
                <meshStandardMaterial
                    color={BIOME_SPECS.TOXIC_SWAMP.accent}
                    emissive={BIOME_SPECS.TOXIC_SWAMP.accent}
                    emissiveIntensity={0.85}
                    roughness={0.4}
                    metalness={0}
                />
            </mesh>
            {flowers.map((f, i) => (
                <mesh key={i} position={[Math.cos(f.angle) * f.r, 0.05, Math.sin(f.angle) * f.r]}>
                    <sphereGeometry args={[0.055, 6, 5]} />
                    <meshStandardMaterial
                        color={BIOME_SPECS.TOXIC_SWAMP.accentFlower}
                        emissive={BIOME_SPECS.TOXIC_SWAMP.accentFlower}
                        emissiveIntensity={0.5}
                        roughness={0.6}
                        metalness={0}
                    />
                </mesh>
            ))}
            <pointLight color={BIOME_SPECS.TOXIC_SWAMP.accent} intensity={0.5} distance={3.5} position={[0, 0.5, 0]} />
        </group>
    );
}
