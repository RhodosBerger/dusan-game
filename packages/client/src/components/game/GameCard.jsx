import React, { useState } from 'react';

/**
 * GameCard — Professional card game component
 *
 * Features:
 * - Faction-colored card frame with gradient border
 * - Cost orb in top-right corner
 * - Card type icon and label
 * - Card name with proper typography
 * - Description with readable text wrapping
 * - Ultimate cards get holographic shimmer + golden frame
 * - Reactive cards get red pulse border
 * - Hover lift with faction glow
 * - Selected state with clear cyan indicator
 * - Casting animation (lift + fade)
 * - Hotkey badge
 */

const FACTION_META = {
    crystal: {
        primary: '#00eeff',
        secondary: '#0a4a5e',
        glow: 'rgba(0, 238, 255, 0.6)',
        gradient: 'linear-gradient(135deg, #0a1a2e 0%, #0a2a3e 50%, #051525 100%)',
        icon: '\u25C6', // diamond
        label: 'CRYSTAL',
    },
    toxic: {
        primary: '#39ff14',
        secondary: '#1a4a0a',
        glow: 'rgba(57, 255, 20, 0.6)',
        gradient: 'linear-gradient(135deg, #0a1a0e 0%, #0a2a14 50%, #051a08 100%)',
        icon: '\u2620', // biohazard
        label: 'TOXIC',
    },
    druid: {
        primary: '#ffcc00',
        secondary: '#4a3a0a',
        glow: 'rgba(255, 204, 0, 0.6)',
        gradient: 'linear-gradient(135deg, #1a1a0a 0%, #2a2a0e 50%, #151505 100%)',
        icon: '\u2698', // flower
        label: 'DRUID',
    },
    void: {
        primary: '#aa00ff',
        secondary: '#2a0a3e',
        glow: 'rgba(170, 0, 255, 0.6)',
        gradient: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #050515 100%)',
        icon: '\u2725', // star
        label: 'VOID',
    },
};

const TYPE_ICONS = {
    'ATTACK': '\u2694', // crossed swords
    'DEFENSE': '\u1F6E1', // shield
    'SPELL': '\u2728', // sparkles
    'MOVEMENT': '\u27A1', // arrow
    'SPECIAL': '\u273B', // teardrop
};

function getFactionFromCardId(cardId) {
    if (cardId.includes('crystal') || cardId.includes('laser') || cardId.includes('shield') || cardId.includes('pulse')) return 'crystal';
    if (cardId.includes('toxic') || cardId.includes('snake') || cardId.includes('acid') || cardId.includes('hook') || cardId.includes('mud')) return 'toxic';
    if (cardId.includes('bear') || cardId.includes('forest') || cardId.includes('wind') || cardId.includes('nature')) return 'druid';
    return 'void';
}

function getTypeIcon(typeLabel) {
    if (!typeLabel) return TYPE_ICONS.SPECIAL;
    const upper = typeLabel.toUpperCase();
    if (upper.includes('ATTACK') || upper.includes('ÚTOK')) return TYPE_ICONS.ATTACK;
    if (upper.includes('DEFENSE') || upper.includes('OBRANA') || upper.includes('SHIELD')) return TYPE_ICONS.DEFENSE;
    if (upper.includes('SPELL') || upper.includes('KÚZLO') || upper.includes('MAGIC')) return TYPE_ICONS.SPELL;
    if (upper.includes('MOVE') || upper.includes('POHYB') || upper.includes('MOVEMENT')) return TYPE_ICONS.MOVEMENT;
    return TYPE_ICONS.SPECIAL;
}

export default function GameCard({
    card,
    index = 0,
    metadata,
    isSelected = false,
    isCasting = false,
    isReactive = false,
    onSelect,
}) {
    const [isHovered, setIsHovered] = useState(false);
    const faction = getFactionFromCardId(card.id);
    const fmeta = FACTION_META[faction];
    const isUlt = card.isUltimate;
    const typeIcon = getTypeIcon(metadata?.type);

    // Card frame style
    const frameStyle = {
        background: fmeta.gradient,
        borderColor: isHovered ? fmeta.primary : (isSelected ? '#22d3ee' : 'rgba(255,255,255,0.08)'),
        boxShadow: isHovered
            ? `0 0 30px ${fmeta.glow}, inset 0 0 12px ${fmeta.glow}, 0 8px 20px rgba(0,0,0,0.5)`
            : isSelected
                ? `0 0 15px rgba(34, 211, 238, 0.4), 0 4px 12px rgba(0,0,0,0.4)`
                : '0 4px 10px rgba(0,0,0,0.3)',
        transform: isHovered
            ? 'translateY(-20px) scale(1.06)'
            : isSelected
                ? 'translateY(-14px)'
                : isCasting
                    ? 'translateY(-40px) scale(0.9)'
                    : 'translateY(0)',
        opacity: isCasting ? 0.5 : 1,
        transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
    };

    // Ultimate golden overlay
    const ultOverlay = isUlt ? (
        <div className="card-ult-shimmer" style={{
            position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
            background: `linear-gradient(110deg, transparent 25%, ${fmeta.primary}22 40%, ${fmeta.primary}44 50%, ${fmeta.primary}22 60%, transparent 75%)`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 2.5s infinite linear',
        }} />
    ) : null;

    return (
        <div
            className={`game-card ${isUlt ? 'game-card--ultimate' : ''} ${isReactive ? 'game-card--reactive' : ''} ${isCasting ? 'game-card--casting' : ''}`}
            style={frameStyle}
            onClick={() => onSelect && onSelect(isSelected ? null : card)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {ultOverlay}

            {/* Hotkey badge */}
            <div className="game-card__hotkey" style={{
                position: 'absolute', top: -6, left: -6,
                width: 20, height: 20, borderRadius: '50%',
                background: 'rgba(10, 10, 18, 0.95)',
                border: `1.5px solid ${fmeta.primary}`,
                color: fmeta.primary,
                fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 20, boxShadow: `0 2px 6px ${fmeta.glow}`,
            }}>
                {index + 1}
            </div>

            {/* Reactive badge */}
            {isReactive && (
                <div style={{
                    position: 'absolute', top: -8, right: -4,
                    background: '#dc2626', color: '#fff',
                    fontSize: 8, fontWeight: 700, padding: '2px 6px',
                    borderRadius: 10, fontFamily: 'JetBrains Mono, monospace',
                    boxShadow: '0 0 8px #ef4444', animation: 'pulse-glow 1s infinite',
                    zIndex: 20, letterSpacing: 0.5,
                }}>
                    REACT
                </div>
            )}

            {/* Cost orb */}
            <div className="game-card__cost" style={{
                position: 'absolute', top: -8, right: -8,
                width: 26, height: 26, borderRadius: '50%',
                background: isUlt
                    ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                    : `linear-gradient(135deg, ${fmeta.primary}, ${fmeta.secondary})`,
                border: '2px solid rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: isUlt ? '#1a1a0a' : '#fff',
                fontFamily: 'JetBrains Mono, monospace',
                boxShadow: isUlt
                    ? '0 0 12px rgba(251, 191, 36, 0.6)'
                    : `0 0 8px ${fmeta.glow}`,
                zIndex: 15,
            }}>
                {isUlt ? '\u2605' : metadata?.cost || 1}
            </div>

            {/* Card content */}
            <div className="game-card__content" style={{
                display: 'flex', flexDirection: 'column', height: '100%',
                padding: '8px 6px', position: 'relative', zIndex: 5,
            }}>
                {/* Type line */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 8, fontFamily: 'JetBrains Mono, monospace',
                    color: fmeta.primary, textTransform: 'uppercase',
                    letterSpacing: 1, fontWeight: 600,
                    opacity: 0.85,
                }}>
                    <span style={{ fontSize: 10 }}>{typeIcon}</span>
                    <span className="game-card__type-text" style={{
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{metadata?.type?.split('//')[0]?.trim() || 'ACTION'}</span>
                </div>

                {/* Faction divider */}
                <div style={{
                    height: 1, margin: '4px 0',
                    background: `linear-gradient(90deg, transparent, ${fmeta.primary}44, transparent)`,
                }} />

                {/* Card name */}
                <div style={{
                    fontSize: 11, fontWeight: 700, color: '#e2e8f0',
                    textAlign: 'center', marginTop: 2, marginBottom: 4,
                    fontFamily: 'Inter, sans-serif',
                    lineHeight: 1.2,
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                    {metadata?.name || card.id}
                </div>

                {/* Description */}
                <div style={{
                    flex: 1, fontSize: 8, color: '#94a3b8',
                    fontFamily: 'JetBrains Mono, monospace',
                    textAlign: 'center', lineHeight: 1.3,
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 4, WebkitBoxOrient: 'vertical',
                    padding: '0 2px',
                }}>
                    {metadata?.desc || ''}
                </div>

                {/* Bottom badge */}
                <div style={{
                    marginTop: 'auto', padding: '3px 0',
                    background: `${fmeta.primary}15`,
                    border: `1px solid ${fmeta.primary}40`,
                    borderRadius: 4,
                    fontSize: 7, fontFamily: 'JetBrains Mono, monospace',
                    color: fmeta.primary, textAlign: 'center',
                    fontWeight: 700, letterSpacing: 1,
                    textTransform: 'uppercase',
                }}>
                    {isUlt ? '\u2605 ULTIMATE' : fmeta.label}
                </div>
            </div>

            {/* Faction top accent bar */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: 3, borderRadius: '10px 10px 0 0',
                background: `linear-gradient(90deg, transparent, ${fmeta.primary}, transparent)`,
                opacity: isHovered ? 1 : 0.6,
                transition: 'opacity 0.2s',
            }} />
        </div>
    );
}
