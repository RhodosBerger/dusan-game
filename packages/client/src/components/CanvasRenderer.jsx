import React, { useMemo } from 'react';
import { Stage, Container } from '@pixi/react';
import HexagonNode from './HexagonNode';
import { generateMacroGrid } from '../utils/HexMath';

const CanvasRenderer = () => {
  // Generovanie súradníc (zavolá sa iba raz vďaka useMemo)
  const macroGrid = useMemo(() => generateMacroGrid(), []);

  // Rozmery plátna
  const width = 1000;
  const height = 800;

  return (
    <Stage 
      width={width} 
      height={height} 
      options={{ 
        backgroundColor: 0x05050f, // Tmavé Cyber-Baroque pozadie
        antialias: true,
        resolution: window.devicePixelRatio || 1,
      }}
    >
      {/* Hlavný kontajner, do ktorého ukladáme priamo izometrické súradnice */}
      <Container 
        x={width / 2} 
        y={height / 2} 
      >
        {macroGrid.map(meta => (
          <Container key={`meta_${meta.id}`}>
            {meta.hexagons.map(hex => (
              <HexagonNode 
                key={`hex_${meta.id}_${hex.id}`} 
                hex={hex} 
                metaId={meta.id} 
              />
            ))}
          </Container>
        ))}
      </Container>
    </Stage>
  );
};

export default CanvasRenderer;
