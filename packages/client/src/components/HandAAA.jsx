import React, { useState, useEffect } from 'react';
import CardAAA from './CardAAA';

/**
 * Hearthstone-Inspired Hand Component
 * 
 * Features:
 * - Fan-shaped card arrangement with smooth transitions
 * - Dynamic card count handling (2-10 cards)
 * - Hover highlights and lift animations
 * - Playable card indicators
 * - Responsive sizing for different screen widths
 */

export default function HandAAA({ 
    cards = [], 
    selectedCardId = null,
    playableCardIds = [],
    exhaustedCardIds = [],
    onCardClick,
    onCardHover,
}) {
    const [hoveredCardId, setHoveredCardId] = useState(null);
    const totalCards = cards.length;

    // Handle empty hand
    if (totalCards === 0) {
        return (
            <div className="fixed bottom-0 left-0 right-0 h-64 flex items-center justify-center pointer-events-none">
                <div className="text-gray-500 text-sm uppercase tracking-widest opacity-50">
                    No Cards Available
                </div>
            </div>
        );
    }

    const handleCardHover = (cardId) => {
        setHoveredCardId(cardId);
        onCardHover?.(cardId);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 h-80 flex items-end justify-center pb-4 pointer-events-auto overflow-visible">
            {/* Container for fanned cards */}
            <div 
                className="relative"
                style={{
                    width: `${Math.min(totalCards * 180, window.innerWidth - 40)}px`,
                    height: '320px',
                }}
            >
                {cards.map((card, index) => {
                    const isSelected = selectedCardId === card.id;
                    const isPlayable = playableCardIds.includes(card.id);
                    const isExhausted = exhaustedCardIds.includes(card.id);
                    const isHovered = hoveredCardId === card.id;

                    return (
                        <CardAAA
                            key={card.id}
                            card={card}
                            index={index}
                            totalCards={totalCards}
                            isSelected={isSelected}
                            isPlayable={isPlayable}
                            isExhausted={isExhausted}
                            onClick={onCardClick}
                            onHover={handleCardHover}
                        />
                    );
                })}
            </div>

            {/* Background gradient to blend with game scene */}
            <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'linear-gradient(to top, rgba(5,5,15,0.9) 0%, rgba(5,5,15,0.6) 50%, transparent 100%)',
                }}
            />
        </div>
    );
}
