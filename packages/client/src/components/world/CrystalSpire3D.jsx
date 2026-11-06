import { useMemo } from 'react';
import { BIOME_SPECS } from '../../design/worldDesign';
import { createSeededRandom } from '../../design/seededRandom';

// Zhluk tyrkysových kryštálov — dominanta ľadovca (worldImage: štít s kryštálom).
export default function CrystalSpire3D({ seed = 1 }) {
    const crystals = useMemo(() => {
        const rnd = createSeededRandom(seed);
        return Array.from({ length: 5 }, (_, i) => ({
            angle: rnd() * Math.PI * 2,
            r: i === 0 ? 0 : 0.25 + rnd() * 0.45,
            h: i === 0 ? 1.5 : 0.5 + rnd() * 0.7,
            tiltX: (rnd() - 0.5) * 0.5,
            tiltZ: (rnd() - 0.5) * 0.5,
        }));
    }, [seed]);

    return (
        <group>
            {crystals.map((c, i) => (
                <group
                    key={i}
                    position={[Math.cos(c.angle) * c.r, 0, Math.sin(c.angle) * c.r]}
                    rotation={[c.tiltX, 0, c.tiltZ]}
                >
                    <mesh position={[0, c.h / 2, 0]} castShadow>
                        <coneGeometry args={[0.14 + c.h * 0.08, c.h, 5]} />
                        <meshStandardMaterial
                            color={BIOME_SPECS.GLACIER.accent}
                            emissive={BIOME_SPECS.GLACIER.accent}
                            emissiveIntensity={0.05}
                            roughness={0.15}
                            metalness={0}
                            flatShading
                        />
                    </mesh>
                </group>
            ))}
            {false && <pointLight color={BIOME_SPECS.GLACIER.accent} intensity={0.6} distance={4} position={[0, 1, 0]} />}
        </group>
    );
}
