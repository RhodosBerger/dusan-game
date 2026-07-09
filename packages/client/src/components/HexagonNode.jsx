import React from 'react';
import { Container, Graphics, Text } from '@pixi/react';
import { HEX_RADIUS, toIsometric } from '../utils/HexMath';

const HexagonNode = ({ hex, metaId }) => {
  // Funkcia pre vykreslenie wireframe polygónu
  const drawBase = React.useCallback((g) => {
    g.clear();
    // Cyber-Baroque štýl: Tmavá výplň, Cyan okraj
    g.beginFill(0x1a1a2e, 0.8);
    g.lineStyle(2, 0x00ffff, 0.6); // Neon cyan
    
    // Vykreslíme hexagón point-to-top, prevedený do izometrie
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30); 
      const px = HEX_RADIUS * Math.cos(angle);
      const py = HEX_RADIUS * Math.sin(angle);
      
      const isoPoint = toIsometric(px, py);
      
      if (i === 0) g.moveTo(isoPoint.x, isoPoint.y);
      else g.lineTo(isoPoint.x, isoPoint.y);
    }
    g.closePath();
    g.endFill();
  }, []);

  // Vykreslenie stredovej bodky pre A_CENTER, aby bolo vidieť, kde je kotva (iba pre vývoj)
  const drawCenterDebug = React.useCallback((g) => {
    g.clear();
    g.beginFill(0xff0055, 0.5); // Červená debug bodka
    g.drawCircle(0, 0, 3);
    g.endFill();
  }, []);

  return (
    <Container x={hex.pixel.x} y={hex.pixel.y} sortableChildren={true}>
      
      {/* [A_BASE] (Z-Index 0) - Podlaha hexagónu */}
      <Container zIndex={0}>
        <Graphics draw={drawBase} />
        {/* Číslo hexu pre orientáciu */}
        <Text 
          text={`${metaId}-${hex.id}`} 
          anchor={0.5} 
          style={{ fontSize: 10, fill: 0x555577 }} 
        />
      </Container>
      
      {/* [A_AURA_RING] (Z-Index 5) - Plochá oblasť pre efekty */}
      <Container zIndex={5}>
        {/* Placeholder pre aury */}
      </Container>
      
      {/* [A_CENTER] (Z-Index 10) - Geometrický stred pre Entity */}
      <Container zIndex={10}>
        <Graphics draw={drawCenterDebug} />
        {/* Tu sa neskôr vykreslí Sprite Hrdinu / Pomocníka */}
      </Container>
      
      {/* [A_OVERHEAD] (Z-Index 20) - Levitujúce prvky / UI */}
      <Container zIndex={20} y={-30}>
        {/* Placeholder pre dmg čísla alebo ikony statusov */}
      </Container>

    </Container>
  );
};

export default HexagonNode;
