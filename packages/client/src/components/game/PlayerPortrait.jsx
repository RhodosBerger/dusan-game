import React from 'react';

/**
 * StatBar — Animated stat bar with gradient fill
 *
 * Props:
 * - value: current value
 * - max: maximum value
 * - label: bar label text
 * - color: primary color (hex)
 * - colorEnd: optional gradient end color
 * - icon: optional emoji/icon prefix
 * - height: bar height in px (default 8)
 * - showText: show numeric text overlay (default true)
 * - warn: flash red when value is low (default true)
 */
export function StatBar({
    value = 0,
    max = 100,
    label = '',
    color = '#00eeff',
    colorEnd = null,
    icon = '',
    height = 8,
    showText = true,
    warn = true,
}) {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    const isLow = warn && pct <= 25;
    const fillColor = isLow ? '#ef4444' : color;
    const fillEnd = isLow ? '#dc2626' : (colorEnd || color);

    return (
        <div className="stat-bar" style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
            {showText && (
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
                    color: isLow ? '#ef4444' : '#94a3b8',
                }}>
                    <span>{icon && <span style={{ marginRight: 3 }}>{icon}</span>}{label}</span>
                    <span style={{ color: isLow ? '#ef4444' : fillColor, fontWeight: 700 }}>
                        {Math.round(value)}<span style={{ color: '#64748b', fontWeight: 400 }}>/{max}</span>
                    </span>
                </div>
            )}
            <div style={{
                width: '100%', height, borderRadius: height / 2,
                background: 'rgba(15, 23, 42, 0.8)', overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.06)',
                position: 'relative',
            }}>
                <div style={{
                    width: `${pct}%`, height: '100%', borderRadius: height / 2,
                    background: `linear-gradient(90deg, ${fillColor}, ${fillEnd})`,
                    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: `0 0 ${height}px ${fillColor}66`,
                    position: 'relative',
                }}>
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: height / 2,
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.25), transparent 50%)',
                    }} />
                </div>
            </div>
        </div>
    );
}

/**
 * PlayerPortrait — Professional player card with portrait, stats, status effects
 *
 * Props:
 * - player: game thread object (health, maxHealth, name, level, etc.)
 * - faction: 'crystal' | 'toxic' | 'druid' | 'void'
 * - isActive: boolean — highlight if it's this player's turn
 * - side: 'left' | 'right' — mirror layout
 * - compact: boolean — minimal layout for mobile
 */
const FACTION_PORTRAITS = {
    crystal: { color: '#00eeff', dark: '#0a2a3e', icon: '\u25C6', name: 'CRYSTAL KING' },
    toxic: { color: '#39ff14', dark: '#0a2a14', icon: '\u2620', name: 'TOXIC HACKER' },
    druid: { color: '#ffcc00', dark: '#2a2a0e', icon: '\u2698', name: 'DRUID' },
    void: { color: '#aa00ff', dark: '#1a0a2e', icon: '\u2725', name: 'VOID' },
};

const STATUS_ICONS = {
    isRooted: { icon: '\u2693', label: 'Rooted', color: '#ef4444' },
    isSlowed: { icon: '\u23F3', label: 'Slowed', color: '#fbbf24' },
    isDisarmed: { icon: '\u26D4', label: 'Disarmed', color: '#ef4444' },
    isSilenced: { icon: '\u2702', label: 'Silenced', color: '#60a5fa' },
    isStealthed: { icon: '\u1F575', label: 'Stealth', color: '#94a3b8' },
};

export default function PlayerPortrait({
    player = {},
    faction = 'crystal',
    isActive = false,
    side = 'left',
    compact = false,
}) {
    const fmeta = FACTION_PORTRAITS[faction] || FACTION_PORTRAITS.crystal;
    const hp = player.health ?? 0;
    const maxHp = player.maxHealth || 15;
    const level = player.level || 1;
    const xp = player.xp || 0;
    const xpMax = level * 100;

    const activeGlow = isActive
        ? `0 0 20px ${fmeta.color}44, 0 0 40px ${fmeta.color}22, inset 0 0 15px ${fmeta.color}11`
        : '0 4px 12px rgba(0,0,0,0.4)';

    const borderStyle = isActive
        ? `1.5px solid ${fmeta.color}`
        : '1px solid rgba(255,255,255,0.08)';

    const statusKeys = Object.keys(STATUS_ICONS).filter(k => player[k]);
    const isDead = hp <= 0;

    const layout = side === 'right' ? 'row-reverse' : 'row';

    return (
        <div
            className={`player-portrait ${isActive ? 'player-portrait--active' : ''} ${isDead ? 'player-portrait--dead' : ''}`}
            style={{
                display: 'flex', flexDirection: layout, alignItems: 'center', gap: 10,
                padding: compact ? '6px 10px' : '8px 14px',
                borderRadius: 12,
                background: `linear-gradient(135deg, ${fmeta.dark}cc, rgba(5,5,15,0.85))`,
                backdropFilter: 'blur(10px)',
                border: borderStyle,
                boxShadow: activeGlow,
                transition: 'all 0.3s ease',
                opacity: isDead ? 0.4 : 1,
                minWidth: compact ? 140 : 220,
                maxWidth: 300,
            }}
        >
            {/* Portrait avatar */}
            <div style={{
                width: compact ? 32 : 42, height: compact ? 32 : 42,
                borderRadius: 8,
                background: `linear-gradient(135deg, ${fmeta.color}33, ${fmeta.dark})`,
                border: `1.5px solid ${fmeta.color}66`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: compact ? 16 : 20,
                color: fmeta.color,
                flexShrink: 0,
                position: 'relative',
                boxShadow: isActive ? `0 0 12px ${fmeta.color}55` : 'none',
            }}>
                {fmeta.icon}
                {isActive && (
                    <div style={{
                        position: 'absolute', inset: -2,
                        borderRadius: 10,
                        border: `1.5px solid ${fmeta.color}`,
                        animation: 'pulse-glow 1.5s infinite ease-in-out',
                        pointerEvents: 'none',
                    }} />
                )}
                {isDead && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, color: '#ef4444',
                        background: 'rgba(0,0,0,0.6)', borderRadius: 8,
                    }}>
                        \u00D7
                    </div>
                )}
            </div>

            {/* Stats column */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                {/* Name + level */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    gap: 6,
                }}>
                    <span style={{
                        fontSize: compact ? 9 : 11, fontWeight: 700,
                        color: '#e2e8f0', fontFamily: 'Inter, sans-serif',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {player.name || fmeta.name}
                    </span>
                    <span style={{
                        fontSize: 8, fontFamily: 'JetBrains Mono, monospace',
                        color: fmeta.color, fontWeight: 700, flexShrink: 0,
                        background: `${fmeta.color}15`,
                        padding: '1px 5px', borderRadius: 4,
                        border: `1px solid ${fmeta.color}33`,
                    }}>
                        LVL {level}
                    </span>
                </div>

                {/* HP bar */}
                {!compact && (
                    <StatBar
                        value={hp}
                        max={maxHp}
                        label="HP"
                        color={fmeta.color}
                        colorEnd={faction === 'toxic' ? '#22c55e' : faction === 'druid' ? '#f59e0b' : fmeta.color}
                        icon="\u2764"
                        height={7}
                    />
                )}

                {/* Compact HP text */}
                {compact && (
                    <div style={{
                        fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
                        color: hp <= maxHp * 0.25 ? '#ef4444' : fmeta.color,
                        fontWeight: 700,
                    }}>
                        {hp}/{maxHp} HP
                    </div>
                )}

                {/* Status effects */}
                {statusKeys.length > 0 && !compact && (
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 1 }}>
                        {statusKeys.map(key => {
                            const s = STATUS_ICONS[key];
                            return (
                                <span key={key} style={{
                                    fontSize: 8, padding: '1px 4px', borderRadius: 3,
                                    background: `${s.color}15`,
                                    color: s.color, border: `1px solid ${s.color}40`,
                                    fontFamily: 'JetBrains Mono, monospace',
                                    fontWeight: 600,
                                }} title={s.label}>
                                    {s.icon} {s.label}
                                </span>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
