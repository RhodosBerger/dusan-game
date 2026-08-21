import React, { useState, useEffect } from 'react';

/**
 * TurnBanner — Top-center banner showing current turn state
 *
 * Features:
 * - Shows whose turn it is with faction colors
 * - Phase indicator (ACTION, INTERRUPT, MOVEMENT, etc.)
 * - Turn counter
 * - System energy + entropy mini-display
 * - Animated transition on turn change
 * - End turn button integrated
 *
 * Props:
 * - activePlayerName: string
 * - activePlayerFaction: 'crystal' | 'toxic' | 'druid' | 'void'
 * - phase: string (turnStateMachine.currentPhase)
 * - turnCount: number
 * - systemEnergy: number (0-100)
 * - entropy: number (0-1)
 * - onEndTurn: function
 * - isMyTurn: boolean
 */

const FACTION_COLORS = {
    crystal: '#00eeff',
    toxic: '#39ff14',
    druid: '#ffcc00',
    void: '#aa00ff',
};

const PHASE_META = {
    ACTION: { label: 'ACTION PHASE', icon: '\u2694', color: '#22d3ee' },
    MOVEMENT: { label: 'MOVEMENT PHASE', icon: '\u27A1', color: '#4ade80' },
    INTERRUPT_WINDOW: { label: 'INTERRUPT!', icon: '\u26A0', color: '#ef4444' },
    DRAW: { label: 'DRAW PHASE', icon: '\u1F0CF', color: '#a855f7' },
    END_TURN: { label: 'END OF TURN', icon: '\u23F1', color: '#fbbf24' },
};

export default function TurnBanner({
    activePlayerName = '',
    activePlayerFaction = 'crystal',
    phase = 'ACTION',
    turnCount = 1,
    systemEnergy = 0,
    entropy = 0.4,
    onEndTurn,
    isMyTurn = true,
}) {
    const [turnPulse, setTurnPulse] = useState(false);
    const [prevPlayer, setPrevPlayer] = useState(activePlayerName);

    useEffect(() => {
        if (activePlayerName !== prevPlayer) {
            setTurnPulse(true);
            setPrevPlayer(activePlayerName);
            const t = setTimeout(() => setTurnPulse(false), 600);
            return () => clearTimeout(t);
        }
    }, [activePlayerName, prevPlayer]);

    const fcolor = FACTION_COLORS[activePlayerFaction] || FACTION_COLORS.crystal;
    const phaseMeta = PHASE_META[phase] || { label: phase, icon: '\u2731', color: '#94a3b8' };
    const energyHigh = systemEnergy > 80;
    const entropyHigh = entropy > 0.7;

    return (
        <div
            className={`turn-banner ${turnPulse ? 'turn-banner--pulse' : ''}`}
            style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 14px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(10,10,18,0.92), rgba(5,5,15,0.88))',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${fcolor}40`,
                boxShadow: `0 0 16px ${fcolor}22, 0 4px 12px rgba(0,0,0,0.4)`,
                pointerEvents: 'auto',
                transition: 'all 0.3s ease',
                animation: turnPulse ? 'scale-in 0.5s ease' : 'none',
            }}
        >
            {/* Turn counter */}
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                paddingRight: 10,
                borderRight: '1px solid rgba(255,255,255,0.08)',
            }}>
                <span style={{
                    fontSize: 7, fontFamily: 'JetBrains Mono, monospace',
                    color: '#64748b', fontWeight: 600, letterSpacing: 1,
                    textTransform: 'uppercase',
                }}>TURN</span>
                <span style={{
                    fontSize: 16, fontFamily: 'Orbitron, monospace',
                    color: '#e2e8f0', fontWeight: 800, lineHeight: 1,
                }}>{turnCount}</span>
            </div>

            {/* Active player indicator */}
            <div style={{
                display: 'flex', flexDirection: 'column', gap: 1,
                minWidth: 0,
            }}>
                <span style={{
                    fontSize: 7, fontFamily: 'JetBrains Mono, monospace',
                    color: '#64748b', fontWeight: 600, letterSpacing: 1,
                    textTransform: 'uppercase',
                }}>
                    {isMyTurn ? 'YOUR TURN' : 'OPPONENT TURN'}
                </span>
                <span style={{
                    fontSize: 12, fontFamily: 'Inter, sans-serif',
                    color: fcolor, fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 4,
                }}>
                    <span style={{
                        display: 'inline-block', width: 6, height: 6,
                        borderRadius: '50%', background: fcolor,
                        boxShadow: `0 0 6px ${fcolor}`,
                        animation: 'pulse-glow 1.5s infinite ease-in-out',
                    }} />
                    {activePlayerName || 'Unknown'}
                </span>
            </div>

            {/* Phase badge */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 6,
                background: `${phaseMeta.color}15`,
                border: `1px solid ${phaseMeta.color}40`,
                fontSize: 8, fontFamily: 'JetBrains Mono, monospace',
                color: phaseMeta.color, fontWeight: 700,
                letterSpacing: 0.5, textTransform: 'uppercase',
                whiteSpace: 'nowrap',
            }}>
                <span style={{ fontSize: 10 }}>{phaseMeta.icon}</span>
                {phaseMeta.label}
            </div>

            {/* System energy mini-bar */}
            <div style={{
                display: 'flex', flexDirection: 'column', gap: 1,
                paddingLeft: 10,
                borderLeft: '1px solid rgba(255,255,255,0.08)',
            }}>
                <span style={{
                    fontSize: 7, fontFamily: 'JetBrains Mono, monospace',
                    color: '#64748b', fontWeight: 600,
                }}>SYS</span>
                <div style={{
                    width: 50, height: 4, borderRadius: 2,
                    background: 'rgba(15,23,42,0.8)', overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.06)',
                }}>
                    <div style={{
                        width: `${systemEnergy}%`, height: '100%',
                        background: energyHigh
                            ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                            : 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                        transition: 'width 0.4s ease',
                        boxShadow: energyHigh ? '0 0 6px #ef444466' : 'none',
                    }} />
                </div>
            </div>

            {/* Entropy mini-bar */}
            <div style={{
                display: 'flex', flexDirection: 'column', gap: 1,
            }}>
                <span style={{
                    fontSize: 7, fontFamily: 'JetBrains Mono, monospace',
                    color: '#64748b', fontWeight: 600,
                }}>ENT</span>
                <div style={{
                    width: 50, height: 4, borderRadius: 2,
                    background: 'rgba(15,23,42,0.8)', overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.06)',
                }}>
                    <div style={{
                        width: `${entropy * 100}%`, height: '100%',
                        background: entropyHigh
                            ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                            : 'linear-gradient(90deg, #4ade80, #22c55e)',
                        transition: 'width 0.4s ease',
                        boxShadow: entropyHigh ? '0 0 6px #ef444466' : 'none',
                    }} />
                </div>
            </div>

            {/* End turn button */}
            {onEndTurn && (
                <button
                    onClick={onEndTurn}
                    style={{
                        marginLeft: 4,
                        padding: '4px 12px', borderRadius: 8,
                        background: isMyTurn
                            ? 'linear-gradient(135deg, #7f1d1d, #991b1b)'
                            : 'rgba(30,41,59,0.6)',
                        border: isMyTurn
                            ? '1px solid #ef444466'
                            : '1px solid rgba(255,255,255,0.08)',
                        color: isMyTurn ? '#fca5a5' : '#64748b',
                        fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 700, letterSpacing: 1,
                        textTransform: 'uppercase',
                        cursor: isMyTurn ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s ease',
                        boxShadow: isMyTurn ? '0 0 8px rgba(239,68,68,0.2)' : 'none',
                        whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                        if (isMyTurn) {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #991b1b, #b91c1c)';
                            e.currentTarget.style.boxShadow = '0 0 14px rgba(239,68,68,0.4)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (isMyTurn) {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #7f1d1d, #991b1b)';
                            e.currentTarget.style.boxShadow = '0 0 8px rgba(239,68,68,0.2)';
                        }
                    }}
                >
                    END [E]
                </button>
            )}
        </div>
    );
}
