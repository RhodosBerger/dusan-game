export interface AdrenalineSpecs {
    isAdrenalineActive: boolean;
    voltageMultiplier: number;
    tensionModifier: number;
    critStrikeChance: number;
    collapsingHexesCount: number;
}

export class AdrenalineDirector {
    /**
     * Vyhodnotí, či je aktívny stav adrenalínu na základe zdravia hráčov a napätia v aréne.
     * @param playerA HP a parametre prvého hráča
     * @param playerB HP a parametre druhého hráča
     * @param systemEnergy Úroveň systémovej energie arény
     * @param turnsElapsed Celkový počet odohraných ťahov
     */
    static getAdrenalineState(playerA: any, playerB: any, systemEnergy: number, turnsElapsed: number): AdrenalineSpecs {
        const hpThreshold = 5.0; // Ak HP klesne pod 5 z počiatočných 15 (33% HP)
        const isCriticalHP = (playerA?.health <= hpThreshold) || (playerB?.health <= hpThreshold);
        const isHighEnergy = systemEnergy >= 80.0;
        const isLateGame = turnsElapsed >= 10;

        const isAdrenalineActive = isCriticalHP || isHighEnergy || isLateGame;

        let voltageMultiplier = 1.0;
        let tensionModifier = 1.0;
        let critStrikeChance = 0.05; // Základných 5%
        let collapsingHexesCount = 0;

        if (isAdrenalineActive) {
            voltageMultiplier = 1.5; // Zvýšenie poškodenia o 50%
            tensionModifier = 2.0;    // Dvojnásobné generovanie systémového tlaku
            critStrikeChance = 0.35;  // 35% šanca na kritický zásah (dvojitý prúd)
            
            // Určenie koľko vonkajších políčok kolabuje
            collapsingHexesCount = Math.min(18, Math.max(0, turnsElapsed - 8));
        }

        return {
            isAdrenalineActive,
            voltageMultiplier,
            tensionModifier,
            critStrikeChance,
            collapsingHexesCount
        };
    }

    /**
     * Upraví fyzikálne vlastnosti karty pri adrenalínovom preťažení.
     * @param baseSpecs Základné špecifikácie karty z PhysicsActionDataset
     * @param adrenaline Specs získané z getAdrenalineState
     */
    static modifyActionForAdrenaline(baseSpecs: any, adrenaline: AdrenalineSpecs): any {
        if (!adrenaline.isAdrenalineActive) {
            return baseSpecs;
        }

        // Kritický zásah (náhodný hazardný faktor)
        const isCrit = Math.random() < adrenaline.critStrikeChance;
        const finalVoltage = baseSpecs.voltage * adrenaline.voltageMultiplier * (isCrit ? 1.5 : 1.0);
        const finalKinetic = baseSpecs.kineticForce * (isCrit ? 2.0 : 1.0); // dvojnásobný push/pull pri crit

        return {
            ...baseSpecs,
            voltage: finalVoltage,
            kineticForce: finalKinetic,
            isCriticalHit: isCrit,
            current: finalVoltage / baseSpecs.resistance,
            powerLoad: finalVoltage * (finalVoltage / baseSpecs.resistance)
        };
    }

    /**
     * Vypočíta zoznam hexov, ktoré skolabujú do voidu na konci kola kvôli kolapsu arény.
     * @param turnsElapsed Celkový počet kôl
     * @param totalNodes Všetky uzly v aréne (pole 63 hexov)
     */
    static getCollapsingNodes(turnsElapsed: number, totalNodes: any[]): string[] {
        if (turnsElapsed < 8) return [];

        // Hráči sú vytláčaní z okrajov: zoradíme uzly podľa vzdialenosti od stredu (0,0)
        // Uzly s najväčšou vzdialenosťou (polomer >= 3) kolabujú ako prvé.
        const sortedByDistance = [...totalNodes].sort((a, b) => {
            const distA = Math.max(Math.abs(a.q), Math.abs(a.r), Math.abs(a.q + a.r));
            const distB = Math.max(Math.abs(b.q), Math.abs(b.r), Math.abs(b.q + b.r));
            return distB - distA; // od najvzdialenejších
        });

        const collapseCount = Math.max(0, Math.min(sortedByDistance.length - 1, (turnsElapsed - 7) * 4)); // zachováme aspoň stredový hex
        return sortedByDistance.slice(0, collapseCount).map(node => node.id);
    }
}
