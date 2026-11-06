import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PALETTE } from '../../design/worldDesign';

/**
 * PortalVortex3D — Dota 2 River Rune Inlay on M4_S0
 * Receives overhead top-down light; does NOT emit blinding upward light from the floor.
 */
export default function PortalVortex3D({ position }) {
    const outerRef = useRef();
    const midRef = useRef();
    const coreRef = useRef();

    useFrame((_, delta) => {
        if (outerRef.current) outerRef.current.rotation.z += delta * 0.35;
        if (midRef.current) midRef.current.rotation.z -= delta * 0.55;
        if (coreRef.current) coreRef.current.rotation.z += delta * 0.85;
    });

    return (
        <group position={position}>
            <mesh ref={outerRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
                <ringGeometry args={[1.25, 1.55, 6]} />
                <meshStandardMaterial color="#25363d" roughness={0.78} metalness={0.35} />
            </mesh>
            <mesh ref={midRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} receiveShadow>
                <ringGeometry args={[0.75, 0.98, 6]} />
                <meshStandardMaterial color="#8a6d3b" roughness={0.5} metalness={0.72} />
            </mesh>
            <mesh ref={coreRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} receiveShadow>
                <circleGeometry args={[0.42, 6]} />
                <meshStandardMaterial color={PALETTE.portal.mid} roughness={0.45} metalness={0.4} />
            </mesh>
        </group>
    );
}
