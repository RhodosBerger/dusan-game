import React, { useState, useEffect } from 'react';

/**
 * LobbyScreen — Glassmorphic hero selection and matchmaking
 * Modern redesign with animated backgrounds, faction glows, and smooth transitions
 */
export default function LobbyScreen({ onStartGame, onSearchMatch, isSearching }) {
    const [name, setName] = useState('');
    const [selectedHero, setSelectedHero] = useState('thread_king_ai');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = (e, isAI) => {
        e.preventDefault();
        const nickname = name.trim() || (selectedHero === 'thread_king_ai' ? 'Crystal_King' : 'Toxic_Hacker');
        if (isAI) {
            onStartGame({ name: nickname, hero: selectedHero, vsAI: true });
        } else {
            onSearchMatch({ name: nickname, hero: selectedHero });
        }
    };

    const heroes = [
        {
            id: 'thread_king_ai',
            name: 'Crystal King',
            faction: 'crystal',
            color: 'cyan',
            accentClass: 'faction-crystal',
            description: 'Pevný pancier, stabilná entropia a vysoké HP.',
            stats: [
                { label: 'HP', value: '20', highlight: true },
                { label: 'Armor', value: '1', highlight: true },
                { label: 'Special', value: 'Crystal Shards' },
            ],
            traits: [
                'Max HP: 20 (štartovacie)',
                'Brnenie: 1 Armor',
                'Vyššia šanca na Crystal shards',
            ],
        },
        {
            id: 'thread_hacker_root',
            name: 'Toxic Hacker',
            faction: 'toxic',
            color: 'green',
            accentClass: 'faction-toxic',
            description: 'Rýchly pohyb, odolnosť voči močiarom a loot bonusy.',
            stats: [
                { label: 'HP', value: '15', highlight: true },
                { label: 'Move', value: '+1 hex', highlight: true },
                { label: 'Special', value: 'Toxic Immune' },
            ],
            traits: [
                'Max HP: 15',
                '+1 hex dosah na klzkých plochách',
                'Imunita voči toxic-damage',
            ],
        },
    ];

    const selectedHeroData = heroes.find(h => h.id === selectedHero);

    // ─── Searching State ─────────────────────────────────────────────────────────
    if (isSearching) {
        return (
            <div className="lobby-screen lobby-screen--searching">
                {/* Animated Background */}
                <div className="lobby-bg">
                    <div className="lobby-bg__gradient lobby-bg__gradient--pulse"></div>
                    <div className="lobby-bg__grid"></div>
                    <div className="lobby-bg__particles">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <span key={i} className="lobby-particle" style={{
                                '--delay': `${i * 0.2}s`,
                                '--x': `${Math.random() * 100}%`,
                                '--y': `${Math.random() * 100}%`,
                            }}></span>
                        ))}
                    </div>
                </div>

                {/* Scanner Animation */}
                <div className="search-scanner">
                    <div className="search-scanner__ring search-scanner__ring--outer"></div>
                    <div className="search-scanner__ring search-scanner__ring--middle"></div>
                    <div className="search-scanner__ring search-scanner__ring--inner"></div>
                    <div className="search-scanner__core">
                        <div className="search-scanner__icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" strokeDasharray="4 2" />
                                <path d="M12 6v6l4 2" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Status Panel */}
                <div className="search-panel glass-panel">
                    <h3 className="search-panel__title">Vyhľadávanie zápasu</h3>
                    <p className="search-panel__description">
                        Systém analyzuje signály aktívnych klanov. Hneď ako nájde oponenta, 
                        budete automaticky teleportovaní do arény.
                    </p>
                    <div className="search-panel__dots">
                        <span className="search-dot"></span>
                        <span className="search-dot"></span>
                        <span className="search-dot"></span>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Main Lobby ──────────────────────────────────────────────────────────────
    return (
        <div className={`lobby-screen ${mounted ? 'lobby-screen--mounted' : ''}`}>
            {/* Animated Background */}
            <div className="lobby-bg">
                <div className="lobby-bg__gradient"></div>
                <div className="lobby-bg__grid"></div>
                <div className="lobby-bg__vignette"></div>
            </div>

            {/* Main Container */}
            <div className="lobby-container glass-panel">
                {/* Header */}
                <header className="lobby-header">
                    <h1 className="lobby-title">
                        <span className="lobby-title__main">THE LAST TRIBE</span>
                        <span className="lobby-title__sub">Sovereign Arena</span>
                    </h1>
                    <div className="lobby-version">v2.0</div>
                </header>

                {/* Content Grid */}
                <div className="lobby-content">
                    {/* Hero Selection Column */}
                    <section className="lobby-section">
                        <h3 className="lobby-section__title">
                            <span className="lobby-section__number">01</span>
                            Výber Hrdinu
                        </h3>

                        <div className="hero-grid">
                            {heroes.map((hero) => (
                                <HeroCard
                                    key={hero.id}
                                    hero={hero}
                                    isSelected={selectedHero === hero.id}
                                    onSelect={() => setSelectedHero(hero.id)}
                                />
                            ))}
                        </div>

                        {/* Hero Details Panel */}
                        {selectedHeroData && (
                            <div className={`hero-details glass-card ${selectedHeroData.accentClass}`}>
                                <div className="hero-details__header">
                                    <span className="hero-details__faction-badge">
                                        {selectedHeroData.faction.toUpperCase()}
                                    </span>
                                    <span className="hero-details__name">{selectedHeroData.name}</span>
                                </div>
                                
                                <div className="hero-details__stats">
                                    {selectedHeroData.stats.map((stat, i) => (
                                        <div key={i} className={`hero-stat ${stat.highlight ? 'hero-stat--highlight' : ''}`}>
                                            <span className="hero-stat__label">{stat.label}</span>
                                            <span className="hero-stat__value">{stat.value}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="hero-details__traits">
                                    {selectedHeroData.traits.map((trait, i) => (
                                        <div key={i} className="hero-trait">
                                            <span className="hero-trait__bullet"></span>
                                            <span className="hero-trait__text">{trait}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Settings Column */}
                    <section className="lobby-section">
                        <h3 className="lobby-section__title">
                            <span className="lobby-section__number">02</span>
                            Nastavenia
                        </h3>

                        {/* Player Name Input */}
                        <div className="input-group">
                            <label className="input-group__label" htmlFor="player-name">
                                Meno Hráča
                            </label>
                            <div className="input-wrapper">
                                <input
                                    id="player-name"
                                    type="text"
                                    placeholder="Zadajte alias..."
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    maxLength={15}
                                    className="input-field"
                                />
                                <span className="input-field__counter">{name.length}/15</span>
                            </div>
                        </div>

                        {/* Game Info */}
                        <div className="game-info glass-card">
                            <div className="game-info__header">
                                <svg className="game-info__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 16v-4M12 8h.01" />
                                </svg>
                                <span>O hre</span>
                            </div>
                            <p className="game-info__text">
                                Kartová stratégia s fyzikou Ohmovho zákona. 
                                Vyber si frakciu, zostav balíček a ovládni arénu.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="action-buttons">
                            <button
                                onClick={(e) => handleSubmit(e, false)}
                                className="btn btn--primary btn--glow"
                            >
                                <span className="btn__icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
                                        <path d="M13 19l6-6" />
                                        <path d="M16 16l4 4" />
                                        <path d="M19 21l2-2" />
                                    </svg>
                                </span>
                                <span className="btn__text">Vstúpiť do PvP Siete</span>
                            </button>

                            <button
                                onClick={(e) => handleSubmit(e, true)}
                                className="btn btn--secondary"
                            >
                                <span className="btn__icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="10" rx="2" />
                                        <circle cx="12" cy="5" r="2" />
                                        <path d="M12 7v4" />
                                        <line x1="8" y1="16" x2="8" y2="16" />
                                        <line x1="16" y1="16" x2="16" y2="16" />
                                    </svg>
                                </span>
                                <span className="btn__text">Trénovať proti AI</span>
                            </button>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <footer className="lobby-footer">
                    <span className="lobby-footer__status">
                        <span className="lobby-footer__dot lobby-footer__dot--online"></span>
                        Server Online
                    </span>
                    <span className="lobby-footer__players">
                        Hráčov online: <strong>—</strong>
                    </span>
                </footer>
            </div>

            {/* Inline Styles */}
            <style>{`
                /* ═══════════════════════════════════════════════════════════════════════════
                   LOBBY SCREEN STYLES
                   ═══════════════════════════════════════════════════════════════════════════ */

                .lobby-screen {
                    width: 100vw;
                    height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                    overflow: hidden;
                    padding: var(--space-4);
                    opacity: 0;
                    transition: opacity var(--duration-slow) var(--ease-out);
                }

                .lobby-screen--mounted {
                    opacity: 1;
                }

                .lobby-screen--searching {
                    flex-direction: column;
                    gap: var(--space-8);
                }

                /* ─── Background ───────────────────────────────────────────────────────────── */

                .lobby-bg {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    z-index: 0;
                }

                .lobby-bg__gradient {
                    position: absolute;
                    inset: 0;
                    background: 
                        radial-gradient(ellipse at 20% 20%, rgba(45, 211, 241, 0.12) 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 50%),
                        radial-gradient(ellipse at 50% 50%, rgba(57, 255, 20, 0.05) 0%, transparent 40%);
                }

                .lobby-bg__gradient--pulse {
                    animation: bg-pulse 4s ease-in-out infinite;
                }

                @keyframes bg-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }

                .lobby-bg__grid {
                    position: absolute;
                    inset: 0;
                    background-image: 
                        linear-gradient(rgba(45, 211, 241, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(45, 211, 241, 0.03) 1px, transparent 1px);
                    background-size: 40px 40px;
                }

                .lobby-bg__vignette {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(ellipse at center, transparent 40%, rgba(8, 9, 14, 0.8) 100%);
                }

                .lobby-bg__particles {
                    position: absolute;
                    inset: 0;
                }

                .lobby-particle {
                    position: absolute;
                    width: 2px;
                    height: 2px;
                    background: var(--primary-400);
                    border-radius: 50%;
                    left: var(--x);
                    top: var(--y);
                    animation: particle-float 3s ease-in-out infinite;
                    animation-delay: var(--delay);
                    opacity: 0.6;
                }

                @keyframes particle-float {
                    0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
                    50% { transform: translateY(-20px) scale(1.5); opacity: 1; }
                }

                /* ─── Search Scanner ───────────────────────────────────────────────────────── */

                .search-scanner {
                    position: relative;
                    width: 180px;
                    height: 180px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1;
                }

                .search-scanner__ring {
                    position: absolute;
                    border-radius: 50%;
                    border: 2px solid;
                }

                .search-scanner__ring--outer {
                    inset: 0;
                    border-color: var(--faction-crystal);
                    opacity: 0.3;
                    animation: scanner-ping 2s ease-out infinite;
                }

                .search-scanner__ring--middle {
                    inset: 16px;
                    border-color: var(--accent-mana);
                    opacity: 0.4;
                    border-style: dashed;
                    animation: scanner-spin 8s linear infinite;
                }

                .search-scanner__ring--inner {
                    inset: 32px;
                    border-color: var(--faction-crystal);
                    opacity: 0.5;
                    animation: scanner-pulse 1.5s ease-in-out infinite;
                }

                .search-scanner__core {
                    position: relative;
                    width: 60px;
                    height: 60px;
                    background: var(--panel-bg);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid var(--panel-border);
                }

                .search-scanner__icon {
                    width: 32px;
                    height: 32px;
                    color: var(--primary-400);
                    animation: scanner-rotate 4s linear infinite;
                }

                @keyframes scanner-ping {
                    0% { transform: scale(1); opacity: 0.3; }
                    100% { transform: scale(1.3); opacity: 0; }
                }

                @keyframes scanner-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes scanner-pulse {
                    0%, 100% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                }

                @keyframes scanner-rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(-360deg); }
                }

                /* ─── Search Panel ─────────────────────────────────────────────────────────── */

                .search-panel {
                    padding: var(--space-6);
                    border-radius: var(--radius-xl);
                    text-align: center;
                    max-width: 400px;
                    z-index: 1;
                    animation: fade-in var(--duration-slow) var(--ease-out);
                }

                .search-panel__title {
                    font-family: var(--font-display);
                    font-size: var(--text-lg);
                    color: var(--primary-300);
                    margin: 0 0 var(--space-3);
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                }

                .search-panel__description {
                    font-size: var(--text-sm);
                    color: var(--text-secondary);
                    line-height: 1.6;
                    margin: 0 0 var(--space-4);
                }

                .search-panel__dots {
                    display: flex;
                    justify-content: center;
                    gap: var(--space-2);
                }

                .search-dot {
                    width: 8px;
                    height: 8px;
                    background: var(--primary-400);
                    border-radius: 50%;
                    animation: dot-bounce 1.4s ease-in-out infinite;
                }

                .search-dot:nth-child(2) { animation-delay: 0.2s; }
                .search-dot:nth-child(3) { animation-delay: 0.4s; }

                @keyframes dot-bounce {
                    0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
                    40% { transform: scale(1.2); opacity: 1; }
                }

                /* ─── Main Container ───────────────────────────────────────────────────────── */

                .lobby-container {
                    position: relative;
                    z-index: 1;
                    max-width: 900px;
                    width: 100%;
                    padding: var(--space-6) var(--space-8);
                    border-radius: var(--radius-2xl);
                    max-height: 90vh;
                    overflow-y: auto;
                    animation: container-enter var(--duration-slower) var(--ease-out);
                }

                @keyframes container-enter {
                    from {
                        opacity: 0;
                        transform: translateY(30px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                /* ─── Header ───────────────────────────────────────────────────────────────── */

                .lobby-header {
                    text-align: center;
                    padding-bottom: var(--space-4);
                    margin-bottom: var(--space-6);
                    border-bottom: 1px solid var(--panel-border);
                    position: relative;
                }

                .lobby-title {
                    margin: 0;
                }

                .lobby-title__main {
                    display: block;
                    font-family: var(--font-display);
                    font-size: clamp(var(--text-xl), 5vw, var(--text-3xl));
                    font-weight: var(--font-bold);
                    letter-spacing: 0.15em;
                    background: linear-gradient(135deg, var(--primary-300) 0%, var(--accent-mana) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    text-transform: uppercase;
                }

                .lobby-title__sub {
                    display: block;
                    font-family: var(--font-mono);
                    font-size: var(--text-xs);
                    color: var(--text-muted);
                    letter-spacing: 0.3em;
                    text-transform: uppercase;
                    margin-top: var(--space-1);
                }

                .lobby-version {
                    position: absolute;
                    top: 0;
                    right: 0;
                    font-family: var(--font-mono);
                    font-size: var(--text-xs);
                    color: var(--text-muted);
                    padding: var(--space-1) var(--space-2);
                    background: var(--space-surface);
                    border-radius: var(--radius-sm);
                    border: 1px solid var(--panel-border);
                }

                /* ─── Content Grid ─────────────────────────────────────────────────────────── */

                .lobby-content {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: var(--space-8);
                }

                @media (max-width: 768px) {
                    .lobby-content {
                        grid-template-columns: 1fr;
                        gap: var(--space-6);
                    }
                }

                /* ─── Section ──────────────────────────────────────────────────────────────── */

                .lobby-section {
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-4);
                }

                .lobby-section__title {
                    font-family: var(--font-display);
                    font-size: var(--text-sm);
                    font-weight: var(--font-semibold);
                    color: var(--text-secondary);
                    letter-spacing: 0.15em;
                    text-transform: uppercase;
                    display: flex;
                    align-items: center;
                    gap: var(--space-3);
                    margin: 0;
                }

                .lobby-section__number {
                    font-family: var(--font-mono);
                    font-size: var(--text-xs);
                    color: var(--primary-400);
                    padding: var(--space-1) var(--space-2);
                    background: rgba(45, 211, 241, 0.1);
                    border-radius: var(--radius-sm);
                    border: 1px solid var(--panel-border);
                }

                /* ─── Hero Grid ────────────────────────────────────────────────────────────── */

                .hero-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: var(--space-3);
                }

                /* ─── Input Group ──────────────────────────────────────────────────────────── */

                .input-group {
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-2);
                }

                .input-group__label {
                    font-family: var(--font-mono);
                    font-size: var(--text-xs);
                    color: var(--text-secondary);
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                }

                .input-wrapper {
                    position: relative;
                }

                .input-field {
                    width: 100%;
                    padding: var(--space-3) var(--space-4);
                    padding-right: 60px;
                    background: var(--space-surface);
                    border: 1px solid var(--panel-border);
                    border-radius: var(--radius-md);
                    font-family: var(--font-sans);
                    font-size: var(--text-base);
                    font-weight: var(--font-medium);
                    color: var(--primary-300);
                    transition: all var(--duration-fast);
                }

                .input-field:focus {
                    outline: none;
                    border-color: var(--primary-400);
                    box-shadow: 0 0 0 3px rgba(45, 211, 241, 0.15), var(--shadow-glow-primary);
                }

                .input-field::placeholder {
                    color: var(--text-muted);
                    font-weight: var(--font-regular);
                }

                .input-field__counter {
                    position: absolute;
                    right: var(--space-3);
                    top: 50%;
                    transform: translateY(-50%);
                    font-family: var(--font-mono);
                    font-size: var(--text-xs);
                    color: var(--text-muted);
                }

                /* ─── Game Info ────────────────────────────────────────────────────────────── */

                .game-info {
                    padding: var(--space-4);
                    border-radius: var(--radius-lg);
                }

                .game-info__header {
                    display: flex;
                    align-items: center;
                    gap: var(--space-2);
                    font-family: var(--font-mono);
                    font-size: var(--text-sm);
                    font-weight: var(--font-semibold);
                    color: var(--text-primary);
                    margin-bottom: var(--space-2);
                }

                .game-info__icon {
                    width: 18px;
                    height: 18px;
                    color: var(--primary-400);
                }

                .game-info__text {
                    font-size: var(--text-sm);
                    color: var(--text-secondary);
                    line-height: 1.6;
                }

                /* ─── Action Buttons ───────────────────────────────────────────────────────── */

                .action-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-3);
                    margin-top: auto;
                }

                .btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: var(--space-2);
                    padding: var(--space-3) var(--space-5);
                    border-radius: var(--radius-lg);
                    font-family: var(--font-display);
                    font-size: var(--text-sm);
                    font-weight: var(--font-semibold);
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all var(--duration-normal) var(--ease-out);
                    border: 1px solid transparent;
                }

                .btn__icon {
                    width: 20px;
                    height: 20px;
                }

                .btn--primary {
                    background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-500) 100%);
                    color: var(--text-primary);
                    border-color: var(--primary-400);
                }

                .btn--primary:hover {
                    background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-400) 100%);
                    transform: translateY(-2px);
                }

                .btn--glow {
                    box-shadow: 0 4px 20px rgba(45, 211, 241, 0.3);
                }

                .btn--glow:hover {
                    box-shadow: 0 8px 30px rgba(45, 211, 241, 0.5);
                }

                .btn--secondary {
                    background: var(--space-surface);
                    color: var(--text-secondary);
                    border-color: var(--panel-border);
                }

                .btn--secondary:hover {
                    background: var(--space-surface-light);
                    color: var(--text-primary);
                    border-color: var(--accent-mana);
                }

                /* ─── Footer ───────────────────────────────────────────────────────────────── */

                .lobby-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: var(--space-4);
                    margin-top: var(--space-6);
                    border-top: 1px solid var(--panel-border);
                    font-family: var(--font-mono);
                    font-size: var(--text-xs);
                    color: var(--text-muted);
                }

                .lobby-footer__status {
                    display: flex;
                    align-items: center;
                    gap: var(--space-2);
                }

                .lobby-footer__dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }

                .lobby-footer__dot--online {
                    background: var(--semantic-success);
                    box-shadow: 0 0 8px var(--semantic-success);
                    animation: dot-pulse 2s ease-in-out infinite;
                }

                @keyframes dot-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                .lobby-footer__players strong {
                    color: var(--text-primary);
                }
            `}</style>
        </div>
    );
}

// ─── Hero Card Component ─────────────────────────────────────────────────────────
function HeroCard({ hero, isSelected, onSelect }) {
    return (
        <div
            onClick={onSelect}
            className={`hero-card ${isSelected ? `hero-card--selected ${hero.accentClass}` : ''}`}
        >
            <div className="hero-card__badge">{hero.faction.charAt(0).toUpperCase()}</div>
            <h4 className="hero-card__name">{hero.name}</h4>
            <p className="hero-card__desc">{hero.description}</p>
            
            {isSelected && (
                <div className="hero-card__selected-indicator">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>
            )}

            <style>{`
                .hero-card {
                    position: relative;
                    padding: var(--space-3);
                    background: var(--space-surface);
                    border: 2px solid var(--panel-border);
                    border-radius: var(--radius-lg);
                    cursor: pointer;
                    transition: all var(--duration-normal) var(--ease-spring);
                    overflow: hidden;
                }

                .hero-card::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.03) 100%);
                    pointer-events: none;
                }

                .hero-card:hover {
                    border-color: var(--card-border-hover);
                    transform: translateY(-2px);
                }

                .hero-card--selected {
                    border-color: var(--faction-color);
                    background: linear-gradient(180deg, rgba(45, 211, 241, 0.08) 0%, var(--space-surface) 60%);
                    box-shadow: 0 0 20px var(--faction-glow), inset 0 0 15px rgba(45, 211, 241, 0.05);
                }

                .hero-card--selected.faction-crystal {
                    background: linear-gradient(180deg, rgba(0, 238, 255, 0.1) 0%, var(--space-surface) 60%);
                }

                .hero-card--selected.faction-toxic {
                    background: linear-gradient(180deg, rgba(57, 255, 20, 0.1) 0%, var(--space-surface) 60%);
                }

                .hero-card__badge {
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--space-bg);
                    border: 1px solid var(--panel-border);
                    border-radius: var(--radius-md);
                    font-family: var(--font-display);
                    font-size: var(--text-sm);
                    font-weight: var(--font-bold);
                    color: var(--text-muted);
                    margin-bottom: var(--space-2);
                    transition: all var(--duration-normal);
                }

                .hero-card--selected .hero-card__badge {
                    background: var(--faction-color);
                    color: var(--space-bg);
                    border-color: var(--faction-color);
                }

                .hero-card__name {
                    font-family: var(--font-display);
                    font-size: var(--text-sm);
                    font-weight: var(--font-semibold);
                    color: var(--text-primary);
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    margin: 0 0 var(--space-1);
                }

                .hero-card--selected .hero-card__name {
                    color: var(--faction-color);
                }

                .hero-card__desc {
                    font-size: var(--text-xs);
                    color: var(--text-muted);
                    line-height: 1.4;
                    margin: 0;
                }

                .hero-card__selected-indicator {
                    position: absolute;
                    top: var(--space-2);
                    right: var(--space-2);
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--faction-color);
                    border-radius: 50%;
                    animation: check-pop 0.3s var(--ease-spring);
                }

                .hero-card__selected-indicator svg {
                    width: 12px;
                    height: 12px;
                    color: var(--space-bg);
                }

                @keyframes check-pop {
                    0% { transform: scale(0); }
                    60% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
