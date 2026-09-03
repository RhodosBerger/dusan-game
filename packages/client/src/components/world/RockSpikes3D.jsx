import { useMemo } from 'react';
import { BIOME_SPECS } from '../../design/worldDesign';
import { createSeededRandom } from '../../design/seededRandom';

// Červené skalné ihly (worldImage: štíty vľavo). Žiadna emisia — len tvar a farba.
export default function RockSpikes3D({ seed = 1 }) {
    const spikes = useMemo(() => {
        const rnd = createSeededRandom(seed);
        return Array.from({ length: 4 }, (_, i) => ({
            angle: rnd() * Math.PI * 2,
            r: i === 0 ? 0 : 0.3 + rnd() * 0.5,
            h: i === 0 ? 1.2 : 0.6 + rnd() * 0.5,
            base: 0.18 + rnd() * 0.12,
            tiltX: (rnd() - 0.5) * 0.35,
            tiltZ: (rnd() - 0.5) * 0.35,
        }));
    }, [seed]);

    return (
        <group>
            {spikes.map((s, i) => (
                <group
                    key={i}
                    position={[Math.cos(s.angle) * s.r, 0, Math.sin(s.angle) * s.r]}
                    rotation={[s.tiltX, 0, s.tiltZ]}
                >
                    <mesh position={[0, s.h / 2, 0]} castShadow>
                        <coneGeometry args={[s.base, s.h, 5]} />
                        <meshStandardMaterial
                            color={i % 2 === 0 ? BIOME_SPECS.BARRENS.base : BIOME_SPECS.BARRENS.light}
                            roughness={1}
                            metalness={0}
                            flatShading
                        />
                    </mesh>
                </group>
            ))}
        </group>
    );
}
