// HexMath3D.js - Výpočet pozícií pre 3D svet (X, Z sú rovina mapy, Y je výška)
const HEX_RADIUS = 2.0; // Vzdialenosť od stredu k vrcholu v 3D jednotkách
const SQRT_3 = Math.sqrt(3);

// Rozostupy pre súvislý včelí plást
const HEX_WIDTH = SQRT_3 * HEX_RADIUS;
const HEX_HEIGHT = 2 * HEX_RADIUS;
const HORIZ_SPACING = HEX_WIDTH;
const VERT_SPACING = HEX_HEIGHT * 0.75;

/**
 * Konvertuje axiálne koordináty (q, r) na 3D priestorové súradnice (Vector3)
 */
export function axialToCube(q, r) {
    const x = HEX_RADIUS * (SQRT_3 * q + SQRT_3 / 2 * r);
    const z = HEX_RADIUS * (3.0 / 2.0 * r);
    return { x, y: 0, z }; // Y je predvolene na zemi
}

/**
 * Generuje kompletnú topológiu 9 metapozícií (každá 7 hexov = 63 celkovo)
 */
export function generate3DGrid() {
    const grid = [];
    // Definuje stredové body pre 3x3 Metapozície v makro-mriežke
    // Usporiadané tak, aby sub-hexy susedných makro-blokov do seba presne zapadli
    const macroCenters = [
        { q: 0, r: 0 },   { q: 3, r: -1 },  { q: 6, r: -2 },
        { q: -1, r: 3 },  { q: 2, r: 2 },   { q: 5, r: 1 },
        { q: -2, r: 6 },  { q: 1, r: 5 },   { q: 4, r: 4 }
    ];

    // Relatívne posuny pre 7 sub-hexov (stred + 6 susedov)
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

            grid.push({
                id: `m${macroIdx}_s${subIdx}`,
                macroIndex: macroIdx,
                subIndex: subIdx,
                q: finalQ,
                r: finalR,
                position: [pos3D.x, pos3D.y, pos3D.z],
                isCenter: subIdx === 0
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
