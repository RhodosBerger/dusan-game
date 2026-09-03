import { Bloom, Vignette, ChromaticAberration, SSAO } from '@react-three/postprocessing';

export default function AestheticCompositor({ entropy = 0.4, aberrationActive = false, isLowPower = false }) {
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
                intensity={isLowPower ? 0.25 : 0.35 + entropy * 0.25}
                luminanceThreshold={0.65}
                luminanceSmoothing={0.25}
                mipmapBlur={!isLowPower} // Disable costly mipmap blur on integrated graphics
            />
            
            {aberrationActive && (
                <ChromaticAberration 
                    offset={[0.015, 0.015]} 
                />
            )}
            <Vignette eskil={false} offset={0.35} darkness={0.75} />
        </>
    );
}
