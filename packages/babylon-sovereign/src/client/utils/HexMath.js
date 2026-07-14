export const HEX_RADIUS = 30; // Základný polomer hexagónu

// Vektory pre 6 susedov v axiálnych súradniciach (q, r)
export const HEX_DIRECTIONS = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 }
];

// Generátor izometrických súradníc (uhol 45 stupňov = PI/4)
const COS_45 = Math.cos(Math.PI / 4);
const SIN_45 = Math.sin(Math.PI / 4);

export function toIsometric(x2d, y2d) {
  const xIso = (x2d - y2d) * COS_45;
  const yIso = (x2d + y2d) * SIN_45 * 0.5;
  return { x: xIso, y: yIso };
}

// Prevody axiálnych súradníc na pixelové (ploché)
export function axialToPixel(q, r, radius = HEX_RADIUS) {
  const x = radius * Math.sqrt(3) * (q + r / 2);
  const y = radius * (3 / 2) * r;
  return { x, y };
}

// Generuje všetkých 63 hexov usporiadaných do 9 metapozícií, aby na seba dokonale nadväzovali.
export function generateMacroGrid() {
  const metapositions = [];
  
  // 3x3 macro grid indexy (col, row)
  let metaId = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      // Bázové vektory pre prepojenie 7-hexových rosettov v axiálnych súradniciach:
      // dU = (2, 1), dV = (-1, 2)
      const centerQ = col * 2 + row * (-1);
      const centerR = col * 1 + row * 2;
      
      const hexagons = [];
      let hexId = 0;

      // Stredový hex (id 0)
      const centerFlatPixel = axialToPixel(centerQ, centerR);
      hexagons.push({
        id: hexId++,
        q: centerQ,
        r: centerR,
        pixel: toIsometric(centerFlatPixel.x, centerFlatPixel.y)
      });

      // 6 susedov (id 1 až 6)
      for (const dir of HEX_DIRECTIONS) {
        const hexQ = centerQ + dir.q;
        const hexR = centerR + dir.r;
        const flatPixel = axialToPixel(hexQ, hexR);
        hexagons.push({
          id: hexId++,
          q: hexQ,
          r: hexR,
          pixel: toIsometric(flatPixel.x, flatPixel.y)
        });
      }

      metapositions.push({
        id: metaId++,
        col,
        row,
        centerQ,
        centerR,
        hexagons
      });
    }
  }

  // Pre centrovanie celého gridu na obrazovke nájdeme bounding box izometrických stredov
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  metapositions.forEach(meta => {
    meta.hexagons.forEach(hex => {
      if (hex.pixel.x < minX) minX = hex.pixel.x;
      if (hex.pixel.x > maxX) maxX = hex.pixel.x;
      if (hex.pixel.y < minY) minY = hex.pixel.y;
      if (hex.pixel.y > maxY) maxY = hex.pixel.y;
    });
  });

  const width = maxX - minX;
  const height = maxY - minY;
  const offsetX = -minX - width / 2;
  const offsetY = -minY - height / 2;

  // Aplikujeme offset pre vycentrovanie (0,0 bude presný stred celej mapy)
  metapositions.forEach(meta => {
    meta.hexagons.forEach(hex => {
      hex.pixel.x += offsetX;
      hex.pixel.y += offsetY;
    });
  });

  return metapositions;
}
