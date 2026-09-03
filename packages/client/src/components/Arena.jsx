import React from 'react';
import { Stage, Graphics, Text, Container } from '@pixi/react';
import * as PIXI from 'pixi.js';

// Výpočet pozície pre hexagóny vnútri metapozície
const getHexPositions = (centerX, centerY, radius) => {
  const positions = [];
  // Stredový hexagón (0)
  positions.push({ x: centerX, y: centerY });
  // 6 okolitých hexagónov (1-6)
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    positions.push({
      x: centerX + radius * 1.1 * Math.cos(angle),
      y: centerY + radius * 1.1 * Math.sin(angle)
    });
  }
  return positions;
};

// Vykreslenie jedného hexagónu
const HexagonShape = ({ x, y, radius, color, onClick, isOccupied, threadType }) => {
  const draw = React.useCallback((g) => {
    g.clear();
    g.lineStyle(2, 0x00ffcc, 0.5); // Cyber-Baroque farba
    g.beginFill(color, 0.2);
    
    // Kreslenie hexagónu
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i + (Math.PI / 6); // Otočenie o 30 stupňov
      const px = radius * Math.cos(angle);
      const py = radius * Math.sin(angle);
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.endFill();

    // Ak je obsadený, nakreslíme ikonu entity
    if (isOccupied) {
      g.beginFill(threadType === 'PLAYER' ? 0xff0055 : 0xffcc00, 0.8);
      g.drawCircle(0, 0, radius * 0.5);
      g.endFill();
    }
  }, [radius, color, isOccupied, threadType]);

  return (
    <Graphics 
      x={x} 
      y={y} 
      draw={draw} 
      interactive={true} 
      pointerdown={onClick} 
      cursor="pointer"
    />
  );
};

const Arena = ({ map, threads, onHexClick }) => {
  // Fixné rozmery pre demo
  const width = 800;
  const height = 600;
  
  // Rozloženie 3x3 Metapozícií
  const colWidth = width / 3;
  const rowHeight = height / 3;
  const metaRadius = 35; // Veľkosť vnútorného hexagónu

  return (
    <Stage width={width} height={height} options={{ backgroundColor: 0x0f0f1a, antialias: true }}>
      <Container>
        {map.map((meta, index) => {
          const col = index % 3;
          const row = Math.floor(index / 3);
          const centerX = col * colWidth + colWidth / 2;
          const centerY = row * rowHeight + rowHeight / 2;
          
          const hexPositions = getHexPositions(centerX, centerY, metaRadius);

          return (
            <Container key={`meta_${meta.id}`}>
              {/* Odkaz na Metapozíciu - pozadie */}
              <Graphics
                draw={(g) => {
                  g.clear();
                  g.lineStyle(1, 0x333344, 1);
                  g.drawRect(col * colWidth + 10, row * rowHeight + 10, colWidth - 20, rowHeight - 20);
                }}
              />
              
              {/* Interné Hexagóny */}
              {meta.hexagons.map((hex, hexIndex) => {
                const pos = hexPositions[hexIndex];
                const thread = hex.threadId ? threads.find(t => t.id === hex.threadId) : null;
                
                return (
                  <HexagonShape 
                    key={`hex_${meta.id}_${hex.id}`}
                    x={pos.x}
                    y={pos.y}
                    radius={15}
                    color={0x1a1a2e}
                    isOccupied={!!thread}
                    threadType={thread ? thread.type : null}
                    onClick={() => onHexClick(meta.id, hex.id)}
                  />
                );
              })}
            </Container>
          );
        })}
      </Container>
    </Stage>
  );
};

export default Arena;
