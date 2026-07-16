import React from 'react';

const Hand = ({ cards, activeCardId, onCardClick }) => {
  if (!cards || cards.length === 0) {
    return <div className="hand empty">Žiadne karty v ruke</div>;
  }

  return (
    <div className="hand">
      {cards.map(card => {
        // Colors according to rules: Red=Attack, Blue=Spell/Defense, Yellow=Movement, Black=Helper
        let cardClass = "card ";
        if (card.type === 'ACTION') {
          if (card.voltage > 0) cardClass += "red";
          else if (card.resistance > 0) cardClass += "blue";
          else cardClass += "yellow";
        } else if (card.type === 'HELPER') {
          cardClass += "black";
        }

        if (card.id === activeCardId) {
          cardClass += " active";
        }

        // Add ultimate border for premium feel
        if (card.voltage > 5 || card.resistance > 5) {
          cardClass += " hs-card-ultimate";
        }

        return (
          <div 
            key={card.id} 
            className={cardClass}
            onClick={() => onCardClick(card.id)}
            draggable="true"
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", card.id);
              onCardClick(card.id);
            }}
          >
            {/* Hearthstone Cost Badge */}
            <div className="hs-card-cost-badge">
              {card.cost !== undefined ? card.cost : (card.voltage || card.resistance || 2)}
            </div>

            {/* Hearthstone Oval Art Frame */}
            <div className="hs-card-art-frame">
              <svg className="w-full h-full" viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <radialGradient id={`glow-${card.id}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={card.voltage > 0 ? '#ff3366' : '#2dd3f1'} stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#05050f" stopOpacity="0.1"/>
                  </radialGradient>
                </defs>
                <ellipse cx="50%" cy="50%" rx="40" ry="30" fill={`url(#glow-${card.id})`} />
                <path d="M 30,50 Q 50,20 70,50" fill="none" stroke="#b2944b" strokeWidth="1.5" />
              </svg>
            </div>

            {/* Hearthstone Name Banner */}
            <div className="hs-card-name-banner">
              {card.name}
            </div>

            {/* Hearthstone Parchment Description Box */}
            <div className="hs-card-desc-box">
              {card.description || `Generuje ${card.voltage || card.resistance || 3} bodov energie. Typ: ${card.type}.`}
            </div>

            {/* Hearthstone Attack Badge (Voltage) */}
            <div className="hs-card-stat-star">
              {card.voltage || 0}
            </div>

            {/* Hearthstone Shield Badge (Resistance) */}
            <div className="hs-card-stat-shield">
              {card.resistance || 0}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Hand;
