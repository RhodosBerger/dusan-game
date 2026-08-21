import React, { useRef, forwardRef } from 'react';
import { 
    Bloom, Vignette, ChromaticAberration, Noise, ToneMapping,
    GodRays, DepthOfField, SMAA, Scanline
} from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode, KernelSize } from 'postprocessing';

/**
 * AestheticCompositor — Dramatic post-processing pipeline
 * 
 * Full effects stack (bottom to top):
 * 1. SMAA — anti-aliasing for clean edges
 * 2. Bloom — dramatic emissive glow (entropy-scaled)
 * 3. GodRays — volumetric light shafts from sun
 * 4. DepthOfField — cinematic focus blur
 * 5. ChromaticAberration — glitch distortion (when active)
 * 6. Scanline — CRT overlay for retro-cyber aesthetic
 * 7. Noise — film grain texture
 * 8. Vignette — dramatic edge darkening
 * 9. ToneMapping — ACES filmic color grading
 */
const AestheticCompositor = forwardRef(({ 
    entropy = 0.4, 
    aberrationActive = false, 
    intensity = 1.0,
    sunRef = null
}, ref) => {
    // Dynamic bloom intensity — dramatic scaling with entropy
    const bloomIntensity = (0.5 + entropy * 0.5) * intensity;
    const bloomThreshold = Math.max(0.3, 0.6 - entropy * 0.2);
    
    return (
        <>
            {/* SMAA — anti-aliasing for clean edges */}
            <SMAA />
            
            {/* Bloom — dramatic emissive glow */}
            <Bloom
                intensity={bloomIntensity}
                luminanceThreshold={bloomThreshold}
                luminanceSmoothing={0.15}
                mipmapBlur
                kernelSize={KernelSize.LARGE}
                radius={0.8}
                levels={8}
            />
            
            {/* GodRays — volumetric light shafts from sun */}
            {sunRef?.current && (
                <GodRays
                    sun={sunRef.current}
                    samples={60}
                    density={0.96}
                    decay={0.93}
                    weight={0.3}
                    exposure={0.3 * intensity}
                    clampMax={1.0}
                    blur={true}
                />
            )}
            
            {/* DepthOfField — cinematic focus on arena center */}
            <DepthOfField
                focusDistance={0.02}
                focalLength={0.05}
                bokehScale={2.5}
                height={480}
            />
            
            {/* ChromaticAberration — glitch distortion */}
            {aberrationActive && (
                <ChromaticAberration 
                    offset={[0.003 + entropy * 0.012, 0.003 + entropy * 0.012]}
                    radialModulation={true}
                    modulationOffset={0.4}
                />
            )}
            
            {/* Scanline — subtle CRT overlay */}
            <Scanline
                density={0.5}
                opacity={0.04 + entropy * 0.03}
                blendFunction={BlendFunction.OVERLAY}
            />
            
            {/* Noise — film grain */}
            <Noise
                premultiply
                blendFunction={BlendFunction.ADD}
                opacity={0.03 + entropy * 0.02}
            />
            
            {/* Vignette — dramatic edge darkening */}
            <Vignette 
                eskil={false} 
                offset={0.25 + entropy * 0.1} 
                darkness={0.7 + entropy * 0.2}
            />
            
            {/* ToneMapping — ACES filmic for cinematic color */}
            <ToneMapping
                blendFunction={BlendFunction.NORMAL}
                mode={ToneMappingMode.ACES_FILMIC}
            />
        </>
    );
});

export default AestheticCompositor;
