import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * DramaticEnvironment — Bright Daytime Dota 2 Sky Dome (sunlit azure zenith above, soft slate mist below)
 */
function GradientSkyDome() {
    const skyTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Daytime vertical gradient: y=0 is TOP (sunlit zenith +Y), y=512 is BOTTOM (-Y)
        const grad = ctx.createLinearGradient(0, 0, 0, 512);
        grad.addColorStop(0.0, '#5b94c4');   // Clear daytime sky zenith
        grad.addColorStop(0.32, '#88b8de');  // Upper daylight sky
        grad.addColorStop(0.50, '#bfd9ec');  // Warm sunlit horizon
        grad.addColorStop(0.65, '#6c879e');  // Below horizon mist
        grad.addColorStop(1.0, '#47596b');   // Soft shadow below map (no upward glow)

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);

        const texture = new THREE.CanvasTexture(canvas);
        texture.mapping = THREE.EquirectangularReflectionMapping;
        return texture;
    }, []);

    return (
        <mesh scale={[500, 500, 500]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshBasicMaterial
                map={skyTexture}
                side={THREE.BackSide}
                depthWrite={false}
                fog={false}
            />
        </mesh>
    );
}

export default function DramaticEnvironment() {
    return (
        <>
            <GradientSkyDome />
        </>
    );
}
