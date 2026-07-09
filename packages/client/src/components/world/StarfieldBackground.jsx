import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { PALETTE, WORLD } from '../../design/worldDesign';
import { createSeededRandom } from '../../design/seededRandom';

const SPHERE_RADIUS = 250;

// Deterministicky rozhodí hviezdy po guli okolo scény.
function generateStars(count, seed) {
    const rnd = createSeededRandom(seed);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const theta = rnd() * Math.PI * 2;
        const phi = Math.acos(2 * rnd() - 1);
        positions[i * 3] = SPHERE_RADIUS * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = SPHERE_RADIUS * Math.cos(phi);
        positions[i * 3 + 2] = SPHERE_RADIUS * Math.sin(phi) * Math.sin(theta);
    }
    return positions;
}

export default function StarfieldBackground() {
    const dimRef = useRef();
    const brightRef = useRef();

    const dimStars = useMemo(() => generateStars(WORLD.starCount - 20, 11), []);
    const brightStars = useMemo(() => generateStars(20, 23), []);

    useFrame((state) => {
        const time = state.clock.elapsedTime;
        if (dimRef.current?.material) {
            dimRef.current.material.opacity = 0.55 + 0.15 * Math.sin(time * 0.8);
        }
        if (brightRef.current?.material) {
            brightRef.current.material.opacity = 0.8 + 0.2 * Math.sin(time * 1.3 + 1.7);
        }
    });

    return (
        <group>
            <points ref={dimRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[dimStars, 3]} />
                </bufferGeometry>
                {/* fog={false} — hviezdy sú za hmlou, nesmú ňou byť pohltené */}
                <pointsMaterial color={PALETTE.space.starlight} size={1.5} sizeAttenuation={false} transparent opacity={0.6} fog={false} depthWrite={false} />
            </points>
            <points ref={brightRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[brightStars, 3]} />
                </bufferGeometry>
                <pointsMaterial color={PALETTE.space.starlight} size={3} sizeAttenuation={false} transparent opacity={0.9} fog={false} depthWrite={false} />
            </points>
        </group>
    );
}
