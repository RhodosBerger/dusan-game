import React, { useState, useEffect, useRef } from 'react';

/**
 * Hearthstone-Inspired AAA Card Component
 * Features:
 * - 3D parallax hover effect with mouse tracking
 * - Holographic foil shader effect
 * - Dynamic glow based on card state (playable, selected, exhausted)
 * - Smooth scale/rotation animations
 * - Mana cost gem, attack/health orbs
 * - Rarity gem indicator
 * - Card type border (Minion, Spell, Weapon, Hero)
 */

const CARD_TYPES = {
    MINION: 'minion',
    SPELL: 'spell',
    WEAPON: 'weapon',
    HERO: 'hero',
};

const RARITIES = {
    COMMON: { color: '#8b9bb4', gem: 'circle' },      // Silver
    RARE: { color: '#0070dd', gem: 'diamond' },       // Blue
    EPIC: { color: '#a335ee', gem: 'square' },        // Purple
    LEGENDARY: { color: '#ff8000', gem: 'dragon' },   // Orange
};

const FACTION_COLORS = {
    crystal: { primary: '#00b4ff', secondary: '#006699', glow: 'rgba(0, 180, 255, 0.6)' },
    toxic: { primary: '#39ff14', secondary: '#006600', glow: 'rgba(57, 255, 20, 0.6)' },
    druid: { primary: '#ffc800', secondary: '#996600', glow: 'rgba(255, 200, 0, 0.6)' },
    void: { primary: '#aa00ff', secondary: '#660099', glow: 'rgba(170, 0, 255, 0.6)' },
};

export default function CardAAA({ 
    card, 
    isSelected = false, 
    isPlayable = true,
    isExhausted = false,
    onClick,
    onHover,
    index = 0,
    totalCards = 1
}) {
    const cardRef = useRef(null);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);
    
    const faction = card?.faction || 'crystal';
    const colors = FACTION_COLORS[faction] || FACTION_COLORS.crystal;
    const rarity = RARITIES[card?.rarity?.toUpperCase()] || RARITIES.COMMON;
    
    // Mouse move parallax effect
    const handleMouseMove = (e) => {
        if (!cardRef.current || !isHovered) return;
        
        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;
        
        const rotateX = (mouseY / (rect.height / 2)) * -15; // Max ±15deg
        const rotateY = (mouseX / (rect.width / 2)) * 15;
        
        setRotation({ x: rotateX, y: rotateY });
    };
    
    const handleMouseEnter = () => {
        setIsHovered(true);
        onHover?.(card.id);
    };
    
    const handleMouseLeave = () => {
        setIsHovered(false);
        setRotation({ x: 0, y: 0 });
        onHover?.(null);
    };
    
    // Calculate fan angle for hand positioning
    const fanAngle = totalCards > 1 
        ? ((index / (totalCards - 1)) - 0.5) * 20 // ±10 degrees
        : 0;
    
    const liftAmount = isHovered ? -40 : isSelected ? -60 : 0;
    const scale = isHovered ? 1.15 : isSelected ? 1.2 : 1.0;
    
    const cardStyle = {
        transform: `
            perspective(1000px)
            rotateZ(${fanAngle}deg)
            rotateX(${rotation.x}deg)
            rotateY(${rotation.y}deg)
            translateY(${liftAmount}px)
            scale(${scale})
        `,
        transition: isHovered 
            ? 'transform 0.15s ease-out, box-shadow 0.15s ease-out' 
            : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease',
        boxShadow: isHovered
            ? `0 20px 60px ${colors.glow}, 0 0 100px rgba(255,255,255,0.1)`
            : isSelected
            ? `0 30px 80px ${colors.glow}, 0 0 120px rgba(255,255,255,0.2)`
            : '0 10px 30px rgba(0,0,0,0.5)',
        filter: isExhausted ? 'grayscale(0.7) brightness(0.6)' : 'none',
        cursor: isPlayable && !isExhausted ? 'pointer' : 'default',
        opacity: isExhausted ? 0.6 : 1,
    };
    
    return (
        <div
            ref={cardRef}
            className="absolute card-aaa-container"
            style={{
                ...cardStyle,
                width: '220px',
                height: '320px',
                left: `${index * 180}px`,
                transformOrigin: 'center bottom',
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => isPlayable && !isExhausted && onClick?.(card)}
        >
            {/* Card Border Frame */}
            <div 
                className="card-border-frame absolute inset-0 rounded-xl"
                style={{
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                    padding: '3px',
                    boxShadow: `inset 0 0 20px ${colors.glow}`,
                }}
            >
                {/* Holographic Foil Overlay */}
                {card.rarity === 'LEGENDARY' && (
                    <div 
                        className="absolute inset-0 rounded-xl pointer-events-none"
                        style={{
                            background: `
                                linear-gradient(
                                    125deg,
                                    transparent 0%,
                                    rgba(255,255,255,0.3) 25%,
                                    transparent 50%,
                                    rgba(255,255,255,0.2) 75%,
                                    transparent 100%
                                )
                            `,
                            backgroundSize: '200% 200%',
                            animation: isHovered ? 'foil-shimmer 1.5s linear infinite' : 'none',
                            mixBlendMode: 'overlay',
                        }}
                    />
                )}
                
                {/* Card Inner Content */}
                <div className="relative w-full h-full bg-[#1a1a2e] rounded-lg overflow-hidden">
                    {/* Card Type Background */}
                    <div 
                        className="absolute inset-0 opacity-20"
                        style={{
                            background: card.type === CARD_TYPES.SPELL 
                                ? 'radial-gradient(circle at center, #4a0080, transparent 70%)'
                                : card.type === CARD_TYPES.MINION
                                ? 'radial-gradient(circle at center, #004080, transparent 70%)'
                                : 'radial-gradient(circle at center, #804000, transparent 70%)',
                        }}
                    />
                    
                    {/* Mana Cost Gem (Top Left) */}
                    {card.manaCost !== undefined && (
                        <div 
                            className="absolute top-2 left-2 w-10 h-10 flex items-center justify-center"
                            style={{
                                background: 'radial-gradient(circle at 30% 30%, #60a5ff, #004080)',
                                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                boxShadow: '0 0 10px rgba(96, 165, 255, 0.8)',
                            }}
                        >
                            <span className="text-white font-bold text-lg drop-shadow-lg">
                                {card.manaCost}
                            </span>
                        </div>
                    )}
                    
                    {/* Card Art Area */}
                    <div className="absolute top-12 left-2 right-2 h-40 rounded-lg overflow-hidden border-2 border-gray-700">
                        {card.artUrl ? (
                            <img 
                                src={card.artUrl} 
                                alt={card.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div 
                                className="w-full h-full flex items-center justify-center"
                                style={{
                                    background: `linear-gradient(45deg, ${colors.secondary}, ${colors.primary})`,
                                }}
                            >
                                <span className="text-4xl">{card.icon || '⚔️'}</span>
                            </div>
                        )}
                    </div>
                    
                    {/* Card Name */}
                    <div className="absolute top-56 left-0 right-0 text-center">
                        <div 
                            className="inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                            style={{
                                background: `linear-gradient(to right, ${colors.secondary}, ${colors.primary})`,
                                color: '#fff',
                                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                            }}
                        >
                            {card.name}
                        </div>
                    </div>
                    
                    {/* Card Text / Description */}
                    <div className="absolute top-64 left-3 right-3 h-16 overflow-y-auto">
                        <p className="text-[10px] text-gray-300 leading-tight text-center">
                            {card.description}
                        </p>
                    </div>
                    
                    {/* Attack & Health Orbs (for Minions) */}
                    {card.type === CARD_TYPES.MINION && (
                        <>
                            {/* Attack (Bottom Left) */}
                            <div 
                                className="absolute bottom-3 left-2 w-12 h-12 flex items-center justify-center"
                                style={{
                                    background: 'radial-gradient(circle at 30% 30%, #ff6b6b, #800000)',
                                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                    boxShadow: '0 0 10px rgba(255, 107, 107, 0.8)',
                                }}
                            >
                                <span className="text-white font-bold text-xl drop-shadow-lg">
                                    {card.attack ?? '?'}
                                </span>
                            </div>
                            
                            {/* Health (Bottom Right) */}
                            <div 
                                className="absolute bottom-3 right-2 w-12 h-12 flex items-center justify-center"
                                style={{
                                    background: 'radial-gradient(circle at 30% 30%, #51cf66, #006600)',
                                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                    boxShadow: '0 0 10px rgba(81, 207, 102, 0.8)',
                                }}
                            >
                                <span className="text-white font-bold text-xl drop-shadow-lg">
                                    {card.health ?? '?'}
                                </span>
                            </div>
                        </>
                    )}
                    
                    {/* Rarity Gem (Bottom Center) */}
                    <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2">
                        <div 
                            className="w-3 h-3"
                            style={{
                                background: rarity.color,
                                clipPath: card.rarity === 'LEGENDARY' 
                                    ? 'path("M15 5 L25 15 L15 25 L5 15 Z")' 
                                    : rarity.gem === 'diamond'
                                    ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
                                    : rarity.gem === 'square'
                                    ? 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
                                    : 'circle',
                                boxShadow: `0 0 8px ${rarity.color}`,
                            }}
                        />
                    </div>
                </div>
            </div>
            
            {/* Playable Indicator Glow */}
            {isPlayable && !isExhausted && (
                <div 
                    className="absolute -inset-2 rounded-xl pointer-events-none"
                    style={{
                        background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
                        opacity: isHovered ? 0.8 : 0.3,
                        animation: 'pulse-glow 2s ease-in-out infinite',
                    }}
                />
            )}
        </div>
    );
}

// Add global CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes foil-shimmer {
        0% { background-position: 0% 50%; }
        100% { background-position: 200% 50%; }
    }
    
    @keyframes pulse-glow {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 0.6; }
    }
`;
document.head.appendChild(style);
