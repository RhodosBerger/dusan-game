import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { PALETTE, LIGHTING } from '../../design/worldDesign';
import { createSeededRandom } from '../../design/seededRandom';

const PARTICLE_COUNT = 40;

// Špirálovito stúpajúce iskry nad vírom.
function PortalSwirl() {
    const pointsRef = useRef();
    const seeds = useMemo(() => {
        const rnd = createSeededRandom(4);
        return Array.from({ length: PARTICLE_COUNT }, () => ({
            phase: rnd() * Math.PI * 2,
            speed: 0.5 + rnd() * 0.8,
            yOffset: rnd() * 3,
        }));
    }, []);

    const positions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);

    useFrame((state) => {
        if (!pointsRef.current) return;
        const time = state.clock.elapsedTime;
        const posAttr = pointsRef.current.geometry.attributes.position;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const s = seeds[i];
            const y = ((time * s.speed * 0.4 + s.yOffset) % 3);
            const r = 1.6 - (y / 3) * 1.3;
            const angle = s.phase + time * 1.2;
            posAttr.setXYZ(i, r * Math.cos(angle), y, r * Math.sin(angle));
        }
        posAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            </bufferGeometry>
            <pointsMaterial color={PALETTE.portal.mid} size={0.09} transparent opacity={0.85} depthWrite={false} />
        </points>
    );
}

export default function PortalVortex3D({ position }) {
    const outerRef = useRef();
    const midRef = useRef();
    const coreRef = useRef();

    useFrame((_, delta) => {
        if (outerRef.current) outerRef.current.rotation.z += delta * 0.4;
        if (midRef.current) midRef.current.rotation.z -= delta * 0.7;
        if (coreRef.current) coreRef.current.rotation.z += delta * 1.1;
    });

    return (
        <group position={position}>
            <mesh ref={outerRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <circleGeometry args={[1.7, 48]} />
                <meshBasicMaterial color={PALETTE.portal.outer} transparent opacity={0.5} depthWrite={false} />
            </mesh>
            <mesh ref={midRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <circleGeometry args={[1.15, 48]} />
                <meshBasicMaterial color={PALETTE.portal.mid} transparent opacity={0.7} depthWrite={false} />
            </mesh>
            <mesh ref={coreRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
                <circleGeometry args={[0.55, 32]} />
                <meshBasicMaterial color={PALETTE.portal.core} transparent opacity={0.95} depthWrite={false} />
            </mesh>
            <pointLight
                color={LIGHTING.portalLight.color}
                intensity={LIGHTING.portalLight.intensity}
                distance={LIGHTING.portalLight.distance}
                position={[0, 1, 0]}
            />
            <PortalSwirl />
        </group>
    );
}
