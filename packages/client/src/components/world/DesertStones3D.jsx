import { useMemo } from 'react';
import { BIOME_SPECS } from '../../design/worldDesign';
import { createSeededRandom } from '../../design/seededRandom';

// Suché kamene púštneho okraja — najtichšia rekvizita, bez emisie.
export default function DesertStones3D({ seed = 1 }) {
    const stones = useMemo(() => {
        const rnd = createSeededRandom(seed);
        return Array.from({ length: 5 }, () => ({
            angle: rnd() * Math.PI * 2,
            r: 0.2 + rnd() * 0.7,
            s: 0.12 + rnd() * 0.1,
            rotY: rnd() * Math.PI,
            light: rnd() > 0.5,
        }));
    }, [seed]);

    return (
        <group>
            {stones.map((st, i) => (
                <mesh
                    key={i}
                    position={[Math.cos(st.angle) * st.r, st.s * 0.6, Math.sin(st.angle) * st.r]}
                    rotation={[0, st.rotY, 0]}
                    scale={st.s}
                    castShadow
                >
                    <dodecahedronGeometry args={[1, 0]} />
                    <meshStandardMaterial
                        color={st.light ? BIOME_SPECS.DESERT.base : BIOME_SPECS.DESERT.light}
                        roughness={1}
                        metalness={0}
                        flatShading
                    />
                </mesh>
            ))}
        </group>
    );
}
