import { Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';

export default function AestheticCompositor({ entropy = 0.4, aberrationActive = false }) {
    return (
        <>
            {/* Vysoký luminanceThreshold: žiaria len skutočne emisné materiály */}
            <Bloom
                intensity={0.35 + entropy * 0.25}
                luminanceThreshold={0.65}
                luminanceSmoothing={0.25}
                mipmapBlur
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
