export interface PhraseOutput {
    verb: string;
    target: string;
    heightMultiplier: number;
    bevelOffset: number;
    conductivity: number;
    hazardIndex: number;
    colorHex: string;
    rotationSpeed: number;
    teethCount: number;
}

export class SovereignPhraseGenerator {
    public static readonly VALID_VERBS = ['DEFORM', 'COMPILE', 'ACTIVATE', 'HARVEST'];
    public static readonly VALID_TARGETS = ['HEX', 'GEAR', 'CRYSTAL', 'TOWER'];

    private static readonly COLOR_PALETTE = [
        '#06b6d4', // Cyan
        '#a855f7', // Purple
        '#10b981', // Emerald
        '#eab308', // Amber
        '#ef4444', // Rose
        '#3b82f6', // Blue
        '#ec4899'  // Pink
    ];

    /**
     * Compiles a verb-target tag pair into a deterministic set of geometry/physics parameters
     */
    public static compilePhrase(verb: string, target: string): PhraseOutput {
        const v = verb.toUpperCase().trim();
        const t = target.toUpperCase().trim();

        // 1. Calculate bitwise hash value from input characters
        let vHash = 0;
        for (let i = 0; i < v.length; i++) {
            vHash = (vHash << 5) - vHash + v.charCodeAt(i);
            vHash |= 0;
        }

        let tHash = 0;
        for (let i = 0; i < t.length; i++) {
            tHash = (tHash << 5) - tHash + t.charCodeAt(i);
            tHash |= 0;
        }

        const combinedHash = Math.abs(vHash ^ tHash);

        // 2. Generate deterministic statistics
        const heightMultiplier = 0.5 + ((combinedHash % 200) / 100); // 0.5 to 2.5
        const bevelOffset = 0.05 + ((combinedHash % 30) / 100); // 0.05 to 0.35
        const conductivity = 0.1 + ((combinedHash % 81) / 100); // 0.1 to 0.9
        const hazardIndex = 0.0 + ((combinedHash % 96) / 100); // 0.0 to 0.95
        const colorHex = this.COLOR_PALETTE[combinedHash % this.COLOR_PALETTE.length];
        const rotationSpeed = 0.01 + ((combinedHash % 70) / 1000); // 0.01 to 0.08
        const teethCount = 6 + (combinedHash % 19); // 6 to 24 teeth

        return {
            verb: v,
            target: t,
            heightMultiplier,
            bevelOffset,
            conductivity,
            hazardIndex,
            colorHex,
            rotationSpeed,
            teethCount
        };
    }
}
