import React from 'react';

const Hand = ({ cards, activeCardId, onCardClick }) => {
  if (!cards || cards.length === 0) {
    return <div className="hand empty">Žiadne karty v ruke</div>;
  }

  return (
    <div className="hand">
      {cards.map(card => {
        // Farby podľa pravidiel: Červená=Útok, Modrá=Kúzlo/Obrana, Žltá=Pohyb, Čierna=Helper/Doplnok
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
            <h4>{card.name}</h4>
            <div className="stats">
              {card.voltage > 0 && <span>V: {card.voltage}</span>}
              {card.resistance > 0 && <span>R: {card.resistance}</span>}
              {card.semanticErosion > 0 && <span>D: {card.semanticErosion}</span>}
            </div>
            <div className="type">{card.type}</div>
          </div>
        );
      })}
    </div>
  );
};

export default Hand;
