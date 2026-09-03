export class RuleOfThreeSolver {
    /**
     * Rieši priamu úmeru: a1 / b1 = a2 / b2
     * Ak je jedna hodnota neznáma (null), vypočíta ju.
     */
    static solveDirect(
        a1: number, 
        b1: number, 
        a2: number | null, 
        b2: number | null
    ): number {
        if (b1 === 0) throw new Error("RuleOfThree: b1 cannot be zero in direct proportion.");
        if (a2 === null && b2 === null) throw new Error("RuleOfThree: Specify either a2 or b2 to solve.");

        if (a2 === null) {
            if (b2 === null) throw new Error("RuleOfThree: Invalid state.");
            return (a1 * b2) / b1;
        } else {
            if (a1 === 0) throw new Error("RuleOfThree: a1 cannot be zero when solving for b2.");
            return (b1 * a2) / a1;
        }
    }

    /**
     * Rieši nepriamu úmeru: a1 * b1 = a2 * b2
     * Ak je jedna hodnota neznáma (null), vypočíta ju.
     */
    static solveInverse(
        a1: number, 
        b1: number, 
        a2: number | null, 
        b2: number | null
    ): number {
        if (a2 === null && b2 === null) throw new Error("RuleOfThree: Specify either a2 or b2 to solve.");

        if (a2 === null) {
            if (b2 === null || b2 === 0) throw new Error("RuleOfThree: b2 cannot be zero when solving for a2.");
            return (a1 * b1) / b2;
        } else {
            if (a2 === 0) throw new Error("RuleOfThree: a2 cannot be zero when solving for b2.");
            return (a1 * b1) / a2;
        }
    }

    /**
     * Rieši Ohmov zákon: I = V / R
     * Ak je jedna hodnota neznáma (null alebo 0), vypočíta ju na základe ostatných dvoch.
     */
    static solveOhm(
        v: number | null | undefined, 
        r: number | null | undefined, 
        i: number | null | undefined
    ): { voltage: number; resistance: number; current: number } {
        const valV = v || 0;
        const valR = r || 0;
        const valI = i || 0;

        if (valI === 0 && valV !== 0 && valR !== 0) {
            return { voltage: valV, resistance: valR, current: valV / valR };
        }
        if (valV === 0 && valI !== 0 && valR !== 0) {
            return { voltage: valI * valR, resistance: valR, current: valI };
        }
        if (valR === 0 && valV !== 0 && valI !== 0) {
            return { voltage: valV, resistance: valV / valI, current: valI };
        }

        throw new Error("RuleOfThree: Provide exactly two non-zero variables to solve Ohm's law.");
    }
}
