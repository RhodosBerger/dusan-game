// HexMath3D.js - Výpočet pozícií pre 3D svet (X, Z sú rovina mapy, Y je výška)
// Vyvážená, súdržná viacúrovňová topológia (jemné hrateľné prevýšenia bez rozbitých medzier)
const HEX_RADIUS = 2.0;
const SQRT_3 = Math.sqrt(3);

export function axialToCube(q, r) {
    const x = HEX_RADIUS * (SQRT_3 * q + SQRT_3 / 2 * r);
    const z = HEX_RADIUS * (3.0 / 2.0 * r);
    return { x, y: 0, z };
}

function computeTacticalElevation(macroIdx, subIdx) {
    // M4: Riečna kotlina v strede mapy (mierne znížená úroveň pre čistú čitateľnosť)
    if (macroIdx === 4) {
        if (subIdx === 0) return { y: -0.22, tier: -1, feature: 'RIVER_RUNE' };
        if (subIdx === 2 || subIdx === 5) return { y: -0.08, tier: -1, feature: 'BRIDGE' };
        return { y: -0.18, tier: -1, feature: null };
    }

    // M0 (Radiant) & M8 (Dire) — symetrické základne (mierne vyvýšené)
    if (macroIdx === 0) {
        if (subIdx === 0) return { y: 0.32, tier: 1, feature: 'SANCTUARY' };
        if (subIdx === 1 || subIdx === 6) return { y: 0.14, tier: 0, feature: 'RAMP' };
        return { y: 0.26, tier: 1, feature: null };
    }
    if (macroIdx === 8) {
        if (subIdx === 0) return { y: 0.32, tier: 1, feature: 'SANCTUARY' };
        if (subIdx === 3 || subIdx === 4) return { y: 0.14, tier: 0, feature: 'RAMP' };
        return { y: 0.26, tier: 1, feature: null };
    }

    // M2 & M6 — Vyhliadkové útesy (Tier 2)
    if (macroIdx === 2) {
        if (subIdx === 0) return { y: 0.48, tier: 2, feature: 'WATCHTOWER' };
        if (subIdx === 4 || subIdx === 5) return { y: 0.20, tier: 1, feature: 'RAMP' };
        return { y: 0.38, tier: 2, feature: null };
    }
    if (macroIdx === 6) {
        if (subIdx === 0) return { y: 0.48, tier: 2, feature: 'WATCHTOWER' };
        if (subIdx === 1 || subIdx === 2) return { y: 0.20, tier: 1, feature: 'RAMP' };
        return { y: 0.38, tier: 2, feature: null };
    }

    // M1, M3, M5, M7 — Stredové línie
    if (macroIdx === 1 || macroIdx === 7) {
        if (subIdx === 0) return { y: 0.08, tier: 0, feature: 'BARRICADE' };
        if ((macroIdx === 1 && subIdx === 5) || (macroIdx === 7 && subIdx === 2)) {
            return { y: -0.04, tier: 0, feature: 'BRIDGE' };
        }
        return { y: 0.04, tier: 0, feature: null };
    }

    if (macroIdx === 3 || macroIdx === 5) {
        if (subIdx === 0) return { y: 0.10, tier: 0, feature: 'BARRICADE' };
        if ((macroIdx === 3 && subIdx === 1) || (macroIdx === 5 && subIdx === 4)) {
            return { y: -0.02, tier: 0, feature: 'RAMP' };
        }
        return { y: 0.06, tier: 0, feature: null };
    }

    return { y: 0, tier: 0, feature: null };
}

export function generate3DGrid() {
    const grid = [];
    const macroCenters = [
        { q: 0, r: 0 },   { q: 3, r: -1 },  { q: 6, r: -2 },
        { q: -1, r: 3 },  { q: 2, r: 2 },   { q: 5, r: 1 },
        { q: -2, r: 6 },  { q: 1, r: 5 },   { q: 4, r: 4 }
    ];

    const subHexOffsets = [
        { q: 0, r: 0 },
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
