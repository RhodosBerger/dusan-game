// Painted Realm post-processing: jemný bloom pre emisné prvky (portál, kryštál,
// jazierka) + vinetácia. Glitch/aberácia patrili k odstránenému cyber-neon štýlu.
import { Bloom, Vignette } from '@react-three/postprocessing';

export default function AestheticCompositor({ entropy = 0.4 }) {
    return (
        <>
            {/* Vysoký luminanceThreshold: žiaria len skutočne emisné materiály */}
            <Bloom
                intensity={0.35 + entropy * 0.25}
                luminanceThreshold={0.65}
                luminanceSmoothing={0.25}
                mipmapBlur
            />
            <Vignette eskil={false} offset={0.35} darkness={0.75} />
        </>
    );
}
