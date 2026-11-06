// HexMath3D.js - Výpočet pozícií pre 3D svet (X, Z sú rovina mapy, Y je výška)
// Symetrická viacúrovňová topológia v štýle Dota 2 (River Basin, Lanes, High-Ground Bastions, Cliff Outposts)
const HEX_RADIUS = 2.0; // Vzdialenosť od stredu k vrcholu v 3D jednotkách
const SQRT_3 = Math.sqrt(3);

/**
 * Konvertuje axiálne koordináty (q, r) na 3D priestorové súradnice (Vector3)
 */
export function axialToCube(q, r) {
    const x = HEX_RADIUS * (SQRT_3 * q + SQRT_3 / 2 * r);
    const z = HEX_RADIUS * (3.0 / 2.0 * r);
    return { x, y: 0, z };
}

/**
 * Deterministická symetrická výšková mapa (Dota 2 štýl: Rieka v údolí, Stredné línie,
 * Radiant/Dire High-Ground základne M0/M8 a Vyvýšené útesy M2/M6 s prístupovými rampami)
 */
function computeTacticalElevation(macroIdx, subIdx) {
    // M4: Centrálna riečna kotlina (River / Abyssal Pit) — znížená úroveň
    if (macroIdx === 4) {
        if (subIdx === 0) return { y: -0.55, tier: -1, feature: 'RIVER_RUNE' };
        if (subIdx === 2 || subIdx === 5) return { y: -0.22, tier: -1, feature: 'BRIDGE' };
        return { y: -0.42, tier: -1, feature: null };
    }

    // M0 (Radiant Bastion) & M8 (Dire Citadel) — symetrický High-Ground (Tier 1)
    if (macroIdx === 0) {
        if (subIdx === 0) return { y: 1.05, tier: 1, feature: 'SANCTUARY' };
        if (subIdx === 1 || subIdx === 6) return { y: 0.48, tier: 0, feature: 'RAMP' };
        return { y: 0.88, tier: 1, feature: null };
    }
    if (macroIdx === 8) {
        if (subIdx === 0) return { y: 1.05, tier: 1, feature: 'SANCTUARY' };
        if (subIdx === 3 || subIdx === 4) return { y: 0.48, tier: 0, feature: 'RAMP' };
        return { y: 0.88, tier: 1, feature: null };
    }

    // M2 (Severovýchodný útes) & M6 (Juhozápadný útes) — najvyššie taktické plošiny (Tier 2, Ward Cliffs)
    if (macroIdx === 2) {
        if (subIdx === 0) return { y: 1.52, tier: 2, feature: 'WATCHTOWER' };
        if (subIdx === 4 || subIdx === 5) return { y: 0.65, tier: 1, feature: 'RAMP' };
        return { y: 1.28, tier: 2, feature: null };
    }
    if (macroIdx === 6) {
        if (subIdx === 0) return { y: 1.52, tier: 2, feature: 'WATCHTOWER' };
        if (subIdx === 1 || subIdx === 2) return { y: 0.65, tier: 1, feature: 'RAMP' };
        return { y: 1.28, tier: 2, feature: null };
    }

    // M1, M3, M5, M7 — Prechodové bojové línie (Mid-Ground Lanes) s prekážkami a mostami k rieke
    if (macroIdx === 1 || macroIdx === 7) {
        if (subIdx === 0) return { y: 0.35, tier: 0, feature: 'BARRICADE' };
        if ((macroIdx === 1 && subIdx === 5) || (macroIdx === 7 && subIdx === 2)) {
            return { y: -0.10, tier: 0, feature: 'BRIDGE' };
        }
        return { y: 0.18, tier: 0, feature: null };
    }

    if (macroIdx === 3 || macroIdx === 5) {
        if (subIdx === 0) return { y: 0.42, tier: 0, feature: 'BARRICADE' };
        if ((macroIdx === 3 && subIdx === 1) || (macroIdx === 5 && subIdx === 4)) {
            return { y: -0.08, tier: 0, feature: 'RAMP' };
        }
        return { y: 0.22, tier: 0, feature: null };
    }

    return { y: 0, tier: 0, feature: null };
}

/**
 * Generuje kompletnú topológiu 9 metapozícií (každá 7 hexov = 63 celkovo)
 */
export function generate3DGrid() {
    const grid = [];
    const macroCenters = [
        { q: 0, r: 0 },   { q: 3, r: -1 },  { q: 6, r: -2 },
        { q: -1, r: 3 },  { q: 2, r: 2 },   { q: 5, r: 1 },
        { q: -2, r: 6 },  { q: 1, r: 5 },   { q: 4, r: 4 }
    ];

    const subHexOffsets = [
        { q: 0, r: 0 },  // Stred
        { q: 1, r: 0 },  { q: 1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
    ];

    macroCenters.forEach((macro, macroIdx) => {
        subHexOffsets.forEach((offset, subIdx) => {
            const finalQ = macro.q + offset.q;
            const finalR = macro.r + offset.r;
            const pos3D = axialToCube(finalQ, finalR);
            const elev = computeTacticalElevation(macroIdx, subIdx);

            grid.push({
                id: `m${macroIdx}_s${subIdx}`,
                macroIndex: macroIdx,
                subIndex: subIdx,
                q: finalQ,
                r: finalR,
                position: [pos3D.x, elev.y, pos3D.z],
                elevationTier: elev.tier,
                terrainFeature: elev.feature,
                isCenter: subIdx === 0,
                isTown: macroIdx === 0 && subIdx === 0
            });
        });
    });

    // Vypočítame offset na vycentrovanie mapy vo svete
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    grid.forEach(node => {
        if (node.position[0] < minX) minX = node.position[0];
        if (node.position[0] > maxX) maxX = node.position[0];
        if (node.position[2] < minZ) minZ = node.position[2];
        if (node.position[2] > maxZ) maxZ = node.position[2];
    });

    const offsetX = -(minX + maxX) / 2;
    const offsetZ = -(minZ + maxZ) / 2;

    grid.forEach(node => {
        node.position[0] += offsetX;
        node.position[2] += offsetZ;
    });

    return grid;
}
