import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { BIOME_SPECS, PALETTE } from '../../design/worldDesign';

export function SnowParticles() {
    const pointsRef = useRef();
    const count = 12;

    const [positions, speeds] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const spd = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 1.4;
            pos[i * 3] = r * Math.cos(angle);
            pos[i * 3 + 1] = r * Math.sin(angle);
            pos[i * 3 + 2] = Math.random() * 3.5;
            spd[i] = 0.015 + Math.random() * 0.02;
        }
        return [pos, spd];
    }, []);

    useFrame(() => {
        if (!pointsRef.current) return;
        const posAttr = pointsRef.current.geometry.attributes.position;
        for (let i = 0; i < count; i++) {
            let z = posAttr.getZ(i);
            z -= speeds[i];
            if (z < 0.2) z = 3.5;
            posAttr.setZ(i, z);
        }
        posAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef} position={[0, 0, 0]}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                color={BIOME_SPECS.GLACIER.particleColor}
                size={0.06}
                transparent
                opacity={0.8}
            />
        </points>
    );
}

export function SwampVapors() {
    const pointsRef = useRef();
    const count = 8;

    const [positions, speeds] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const spd = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 1.1;
            pos[i * 3] = r * Math.cos(angle);
            pos[i * 3 + 1] = r * Math.sin(angle);
            pos[i * 3 + 2] = Math.random() * 2.0;
            spd[i] = 0.008 + Math.random() * 0.012;
        }
        return [pos, spd];
    }, []);

    useFrame(() => {
        if (!pointsRef.current) return;
        const posAttr = pointsRef.current.geometry.attributes.position;
        for (let i = 0; i < count; i++) {
            let z = posAttr.getZ(i);
            z += speeds[i];
            if (z > 2.0) z = 0.2;
            posAttr.setZ(i, z);
        }
        posAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef} position={[0, 0, 0]}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                color={BIOME_SPECS.TOXIC_SWAMP.particleColor}
                size={0.1}
                transparent
                opacity={0.6}
            />
        </points>
    );
}

export function DesertHeatParticles() {
    const pointsRef = useRef();
    const count = 10;

    const [positions, speeds] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const spd = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 1.1;
            pos[i * 3] = r * Math.cos(angle);
            pos[i * 3 + 1] = r * Math.sin(angle);
            pos[i * 3 + 2] = Math.random() * 2.5;
            spd[i] = 0.012 + Math.random() * 0.018;
        }
        return [pos, spd];
    }, []);

    useFrame(() => {
        if (!pointsRef.current) return;
        const posAttr = pointsRef.current.geometry.attributes.position;
        for (let i = 0; i < count; i++) {
            let z = posAttr.getZ(i);
            z += speeds[i];
            if (z > 2.5) z = 0.1;
            posAttr.setZ(i, z);
        }
        posAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef} position={[0, 0, 0]}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                color={BIOME_SPECS.DESERT.particleColor}
                size={0.08}
                transparent
                opacity={0.7}
            />
        </points>
    );
}

export function BarrensDustDevil() {
    const pointsRef = useRef();
    const count = 12;
    const angles = useMemo(() => new Float32Array(count).map(() => Math.random() * Math.PI * 2), []);
    const radii = useMemo(() => new Float32Array(count).map(() => 0.1 + Math.random() * 0.7), []);
    const heights = useMemo(() => new Float32Array(count).map(() => Math.random() * 2.5), []);

    const initialPositions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = radii[i] * Math.cos(angles[i]);
            pos[i * 3 + 1] = radii[i] * Math.sin(angles[i]);
            pos[i * 3 + 2] = heights[i];
        }
        return pos;
    }, [angles, radii, heights]);

    useFrame((state) => {
        if (!pointsRef.current) return;
        const posAttr = pointsRef.current.geometry.attributes.position;
        const time = state.clock.elapsedTime;
        for (let i = 0; i < count; i++) {
            const currentAngle = angles[i] + time * 3.5;
            const currentRadius = radii[i] * (1.0 + heights[i] * 0.25);
            posAttr.setX(i, currentRadius * Math.cos(currentAngle));
            posAttr.setY(i, currentRadius * Math.sin(currentAngle));

            let z = posAttr.getZ(i) + 0.015;
            if (z > 2.5) z = 0.1;
            posAttr.setZ(i, z);
        }
        posAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef} position={[0, 0, 0]}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[initialPositions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                color={BIOME_SPECS.BARRENS.particleColor}
                size={0.09}
                transparent
                opacity={0.6}
            />
        </points>
    );
}

export function ForestFireflies({ entropy }) {
    const pointsRef = useRef();
    const count = 5;

    const [positions, phases, speeds] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const phs = new Float32Array(count);
        const spd = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 1.3;
            pos[i * 3] = r * Math.cos(angle);
            pos[i * 3 + 1] = r * Math.sin(angle);
            pos[i * 3 + 2] = 0.5 + Math.random() * 1.8;
            phs[i] = Math.random() * Math.PI * 2;
            spd[i] = 0.8 + Math.random() * 1.2;
        }
        return [pos, phs, spd];
    }, []);

    useFrame((state) => {
        if (!pointsRef.current) return;
        const posAttr = pointsRef.current.geometry.attributes.position;
        const time = state.clock.elapsedTime;
        for (let i = 0; i < count; i++) {
            const ph = phases[i];
            const sp = speeds[i];
            posAttr.setX(i, positions[i * 3] + Math.sin(time * sp + ph) * 0.18);
            posAttr.setY(i, positions[i * 3 + 1] + Math.cos(time * sp * 0.8 + ph) * 0.18);
            posAttr.setZ(i, positions[i * 3 + 2] + Math.sin(time * sp * 1.2 + ph) * 0.12);
        }
        posAttr.needsUpdate = true;

        if (pointsRef.current.material) {
            pointsRef.current.material.opacity = 0.4 + 0.5 * Math.abs(Math.sin(time * 2.5));
        }
    });

    return (
        <points ref={pointsRef} position={[0, 0, 0]}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                color={BIOME_SPECS.LUSH_FOREST.particleColor}
                size={0.12}
                transparent
                opacity={0.8}
            />
        </points>
    );
}

export function VoidCollapseParticles() {
    const pointsRef = useRef();
    const count = 15;

    const [positions, speeds] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const spd = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 1.3;
            pos[i * 3] = r * Math.cos(angle);
            pos[i * 3 + 1] = r * Math.sin(angle);
            pos[i * 3 + 2] = Math.random() * 3.5;
            spd[i] = 0.02 + Math.random() * 0.03;
        }
        return [pos, spd];
    }, []);

    useFrame(() => {
        if (!pointsRef.current) return;
        const posAttr = pointsRef.current.geometry.attributes.position;
        for (let i = 0; i < count; i++) {
            let z = posAttr.getZ(i) + speeds[i];
            if (z > 3.5) z = 0.1;
            posAttr.setZ(i, z);
        }
        posAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef} position={[0, 0, 0]}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                color={PALETTE.path.dirt}
                size={0.095}
                transparent
                opacity={0.9}
            />
        </points>
    );
}
