import React, { forwardRef } from 'react';
import {
    Bloom, Vignette, ChromaticAberration, Noise, ToneMapping,
    GodRays, SMAA, Scanline
} from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode, KernelSize } from 'postprocessing';

/**
 * AestheticCompositor — Crisp, optimized post-processing pipeline
 */
const AestheticCompositor = forwardRef(({
    entropy = 0.4,
    aberrationActive = false,
    intensity = 0.75,
    sunRef = null
}, _ref) => {
    const bloomIntensity = (0.16 + entropy * 0.12) * intensity;
    const bloomThreshold = Math.max(0.72, 0.85 - entropy * 0.08);

    return (
        <>
            {/* SMAA — anti-aliasing for clean edges */}
            <SMAA />

            {/* Subtle Bloom — clean emissive glow without scene blur */}
            <Bloom
                intensity={bloomIntensity}
                luminanceThreshold={bloomThreshold}
                luminanceSmoothing={0.15}
                mipmapBlur
                kernelSize={KernelSize.SMALL}
                radius={0.25}
                levels={3}
            />

            {/* GodRays — lightweight volumetric shafts */}
            {false && sunRef?.current && (
                <GodRays
                    sun={sunRef.current}
                    samples={20}
                    density={0.94}
                    decay={0.92}
                    weight={0.14}
                    exposure={0.12 * intensity}
                    clampMax={0.85}
                    blur={false}
                />
            )}

            {/* ChromaticAberration — glitch distortion */}
            {aberrationActive && (
                <ChromaticAberration
                    offset={[0.002 + entropy * 0.008, 0.002 + entropy * 0.008]}
                    radialModulation={true}
                    modulationOffset={0.4}
                />
            )}

            {/* Scanline — subtle CRT overlay */}
            <Scanline
                density={0.5}
                opacity={0.03 + entropy * 0.02}
                blendFunction={BlendFunction.OVERLAY}
            />

            {/* Noise — film grain */}
            <Noise
                premultiply
                blendFunction={BlendFunction.ADD}
                opacity={0.02 + entropy * 0.015}
            />

            {/* Vignette — subtle edge darkening */}
            <Vignette
                eskil={false}
                offset={0.28 + entropy * 0.08}
                darkness={0.55 + entropy * 0.15}
            />

            {/* ToneMapping — ACES filmic for balanced color */}
            <ToneMapping
                blendFunction={BlendFunction.NORMAL}
                mode={ToneMappingMode.ACES_FILMIC}
            />
        </>
    );
});

export default AestheticCompositor;
