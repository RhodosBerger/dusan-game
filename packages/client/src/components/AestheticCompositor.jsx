import React, { forwardRef } from 'react';
import {
    Bloom, Vignette, ChromaticAberration, ToneMapping, SMAA
} from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode, KernelSize } from 'postprocessing';

/**
 * AestheticCompositor — Daytime Dota 2 Crisp Post-Processing Pipeline
 * No dark night vignette, no CRT scanlines or noisy grain; clean daylight clarity.
 */
const AestheticCompositor = forwardRef(({
    entropy = 0.4,
    aberrationActive = false,
    intensity = 0.65,
}, _ref) => {
    return (
        <>
            <SMAA />

            <Bloom
                intensity={0.12 * intensity}
                luminanceThreshold={0.88}
                luminanceSmoothing={0.15}
                mipmapBlur
                kernelSize={KernelSize.SMALL}
                radius={0.22}
                levels={3}
            />

            {aberrationActive && (
                <ChromaticAberration
                    offset={[0.002 + entropy * 0.006, 0.002 + entropy * 0.006]}
                    radialModulation={true}
                    modulationOffset={0.4}
                />
            )}

            <Vignette
                eskil={false}
                offset={0.45}
                darkness={0.15}
            />

            <ToneMapping
                blendFunction={BlendFunction.NORMAL}
                mode={ToneMappingMode.ACES_FILMIC}
            />
        </>
    );
});

export default AestheticCompositor;
