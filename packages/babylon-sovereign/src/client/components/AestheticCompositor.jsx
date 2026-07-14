import { Bloom, Vignette, ChromaticAberration, SSAO } from '@react-three/postprocessing';

export default function AestheticCompositor({ entropy = 0.4, aberrationActive = false, isLowPower = false, realityPhase = 'STANDARD' }) {
    const finalAberration = aberrationActive || realityPhase === 'VOID' || realityPhase === 'GLITCH';
    const bloomIntensity = realityPhase === 'SURGE' ? 2.5 : realityPhase === 'VOID' ? 0.6 : (isLowPower ? 0.25 : 0.35 + entropy * 0.25);
    const vignetteDarkness = realityPhase === 'VOID' ? 0.95 : 0.75;
    const vignetteOffset = realityPhase === 'VOID' ? 0.25 : 0.35;

    return (
        <>
            {/* Ambient contact shadows: high-quality vs low-overhead mode */}
            <SSAO 
                intensity={1.2}
                radius={0.3}
                luminanceInfluence={0.5}
                bias={0.02}
                samples={isLowPower ? 8 : 24} // 8 samples on low-power Intel Iris Xe, 24 samples on discrete GPUs
            />
            
            {/* Vysoký luminanceThreshold: žiaria len skutočne emisné materiály */}
            <Bloom
                intensity={bloomIntensity}
                luminanceThreshold={realityPhase === 'SURGE' ? 0.3 : 0.65}
                luminanceSmoothing={0.25}
                mipmapBlur={!isLowPower} // Disable costly mipmap blur on integrated graphics
            />
            
            {finalAberration && (
                <ChromaticAberration 
                    offset={realityPhase === 'GLITCH' ? [0.035, 0.035] : [0.015, 0.015]} 
                />
            )}
            <Vignette eskil={false} offset={vignetteOffset} darkness={vignetteDarkness} />
        </>
    );
}
