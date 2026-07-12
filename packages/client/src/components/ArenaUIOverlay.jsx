import React from 'react';
import skCards from '../../../shared/src/translations/sk/cards.json';
import { CRYSTAL_CARDS_BASE, TOXIC_CARDS_BASE, DRUID_CARDS_BASE, VOID_CARDS_BASE, AlgebraicActionTensor, getPhysicsSpecs, ITEMS_CATALOG } from '../../../shared/src/index';
import GameplayCompositorTemplate from './GameplayCompositorTemplate';

const allBases = [...CRYSTAL_CARDS_BASE, ...TOXIC_CARDS_BASE, ...DRUID_CARDS_BASE, ...VOID_CARDS_BASE];

// Count-up animation for spectrometer
function AnimatedNumber({ value, suffix = '', decimals = 1 }) {
    const [displayValue, setDisplayValue] = React.useState(value);

    React.useEffect(() => {
        let start = displayValue;
        const end = value;
        if (start === end) return;

        const duration = 250; // ms count up
        const startTime = performance.now();

        const update = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const current = start + (end - start) * progress;
            setDisplayValue(current);
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };

        requestAnimationFrame(update);
    }, [value]);

    return <span>{displayValue.toFixed(decimals)}{suffix}</span>;
}

const getFactionHoverClass = (cardId) => {
    if (cardId.includes('crystal') || cardId.includes('laser') || cardId.includes('shield') || cardId.includes('pulse')) {
        return 'card-hover-crystal';
    }
    if (cardId.includes('toxic') || cardId.includes('snake') || cardId.includes('acid') || cardId.includes('hook') || cardId.includes('mud')) {
        return 'card-hover-toxic';
    }
    if (cardId.includes('bear') || cardId.includes('forest') || cardId.includes('wind') || cardId.includes('nature')) {
        return 'card-hover-druid';
    }
    return 'card-hover-void';
};

const getCardMetadata = (cardId) => {
    const cardBase = allBases.find(c => c.id === cardId);
    if (!cardBase) {
        return { name: cardId, type: 'Inštrukcia', desc: 'Simulácia Ohmovho zákona', cost: 1 };
    }
    const heroKey = cardBase.heroId;
    const trans = skCards[heroKey]?.[cardId] || { name: cardId, description: '' };
    
    const typeLabel = cardBase.cardCategorization.toUpperCase() + (cardBase.isUnit ? ' // JEDNOTKA' : ' // AKCIA');
    const descLabel = trans.description || (cardBase.effect ? `Efekt: ${cardBase.effect}` : 'Základná inštrukcia');
    const cost = cardBase.isUltimate ? 2 : 1;

    return {
        name: trans.name,
        type: typeLabel,
        desc: descLabel,
        cost: cost
    };
};

export default function ArenaUIOverlay({ 
    gameState, 
    entropy = 0.4, 
    setEntropy, 
    selectedCard, 
    setSelectedCard, 
    selectedNode, 
    onExecuteAction, 
    onEndTurn, 
    onMoveHero,
    onResetSimulation, 
    onEvolveScene,
    isSandbox, 
    setIsSandbox, 
    actionLogs = [],
    onCureStatus,
    onBuyItem,
    onSellItem,
    onPassReaction,
    onToggleStealth,
    semanticSector = null,
    terrainTelemetry = null,
    weatherOverride = null,
    setWeatherOverride,
    isManualWeather = false,
    setIsManualWeather
}) {
    const [isCodexOpen, setIsCodexOpen] = React.useState(false);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = React.useState(false);
    const [castingCard, setCastingCard] = React.useState(null);
    const [goTelemetry, setGoTelemetry] = React.useState(null);
    const [isShopOpen, setIsShopOpen] = React.useState(false);
    const [hoveredCardIndex, setHoveredCardIndex] = React.useState(null);

    React.useEffect(() => {
        const fetchTelemetry = () => {
            fetch('http://localhost:8081/api/telemetry/analytics')
                .then(res => res.json())
                .then(data => setGoTelemetry(data))
                .catch(err => console.warn('[TELEMETRY] Go Core offline'));
        };
        fetchTelemetry();
        const interval = setInterval(fetchTelemetry, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleExecuteClick = () => {
        if (!selectedCard) return;
        setCastingCard(selectedCard);
        // Wait for card lift animation to finish
        setTimeout(() => {
            onExecuteAction();
            setCastingCard(null);
        }, 450);
    };

    React.useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore when typing in inputs/textareas
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
                return;
            }

            const key = e.key;

            // 1-9 keys to select cards in hand
            if (key >= '1' && key <= '9') {
                const idx = parseInt(key, 10) - 1;
                if (idx < cards.length) {
                    const card = cards[idx];
                    setSelectedCard(prev => prev === card ? null : card);
                }
            }

            // Escape to deselect current card
            if (key === 'Escape') {
                setSelectedCard(null);
            }

            // Space key for card execution or ending turn
            if (key === ' ') {
                e.preventDefault();
                if (selectedCard && selectedNode) {
                    handleExecuteClick();
                } else if (!selectedCard) {
                    onEndTurn();
                }
            }

            // 'E' or 'e' to end turn
            if (key === 'e' || key === 'E') {
                onEndTurn();
            }

            // 'T' or 't' to toggle telemetry panel
            if (key === 't' || key === 'T') {
                setCollapsed(prev => ({ ...prev, telemetry: !prev.telemetry }));
            }

            // 'C' or 'c' to toggle tactical codex sliding drawer
            if (key === 'c' || key === 'C') {
                setIsCodexOpen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cards, selectedCard, selectedNode, onEndTurn, setSelectedCard, onExecuteAction]);

    const [collapsed, setCollapsed] = React.useState({
        telemetry: window.innerWidth < 1024,
        sandbox: true, // predvolene zatvorené pre šetrenie miesta
        quests: window.innerWidth < 1024,
        logs: window.innerWidth < 1024, // na mobiloch predvolene zatvorené
        compositor: true
    });

    const activePlayer = gameState?.threads?.find(t => t.id === gameState?.activePlayerId) || gameState?.threads?.[0];
    const cards = activePlayer?.currentBuffer || [];
    const isPlayerInTown = activePlayer?.position?.meta === 0 && activePlayer?.position?.hex === 0;
    const isStealthed = activePlayer?.isStealthed || false;

    let currentV = 0;
    let currentR = 0;
    let currentI = 0;
    let currentP = 0;

    if (selectedCard) {
        const specs = getPhysicsSpecs(selectedCard.id);
        if (selectedNode) {
            currentV = specs.voltage + (selectedNode.hazardIndex ?? 0) * 1.5;
            currentR = specs.resistance + (selectedNode.friction ?? 0) * 2.0;
        } else {
            currentV = specs.voltage;
            currentR = specs.resistance;
        }
        currentI = currentV / currentR;
        currentP = currentV * currentI;
    }

    // Ostatní hráči telemetry
    const crystalPlayer = gameState?.threads?.find(t => t.id === 'thread_king_ai');
    const toxicPlayer = gameState?.threads?.find(t => t.id === 'thread_hacker_root');

    const renderTelemetry = (isMobile = false) => {
        return (
            <div className="bg-[color:var(--panel-bg)] border border-[color:var(--panel-border)] text-white p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[280px] w-full text-left">
                <div 
                    onClick={() => !isMobile && setCollapsed(prev => ({ ...prev, telemetry: !prev.telemetry }))}
                    className={`text-[10px] text-[color:var(--accent-magic)] tracking-widest font-mono uppercase mb-1 flex justify-between items-center ${!isMobile ? 'cursor-pointer select-none' : ''}`}
                >
                    <span>Telemetry [T] {!isMobile && (collapsed.telemetry ? '▶' : '▼')}</span>
                    <span className="text-purple-400 font-bold">V2</span>
                </div>
                
                {(!collapsed.telemetry || isMobile) && (
                    <>
                        <div className="flex justify-between items-center">
                            <div className="text-base md:text-lg font-bold text-slate-200">Sovereign Engine Sandbox</div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsCodexOpen(true); }}
                                className="bg-purple-950/60 hover:bg-purple-900 border border-[#a855f7]/40 text-purple-300 text-[10px] font-mono px-2 py-0.5 rounded cursor-pointer font-bold transition-all flex items-center gap-1"
                            >
                                📖 KÓDEX [C]
                            </button>
                        </div>
                        
                        <div className="mt-3 flex flex-col gap-2.5 text-xs font-mono">
                            {/* Crystal Player Telemetry */}
                            <div className="border-b border-slate-800/60 pb-1.5">
                                <div className="flex justify-between text-[color:var(--accent-magic)] font-bold">
                                    <span>CRYSTAL (King AI):</span>
                                    <span>{crystalPlayer ? `${crystalPlayer.health} / ${crystalPlayer.maxHealth || 15} HP` : 'Deallocated'}</span>
                                </div>
                                {crystalPlayer && (
                                    <>
                                        <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                                            <span>LVL {crystalPlayer.level || 1} (XP: {crystalPlayer.xp || 0} / {(crystalPlayer.level || 1) * 100})</span>
                                            <span>Luck: {(crystalPlayer.luck ?? 0.5).toFixed(2)}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-2 text-[9px] text-[color:var(--accent-magic)] mt-1">
                                            <span>Dosah Útoku: {crystalPlayer.attackReach}</span>
                                            <span>Dosah Kúzla: {crystalPlayer.spellReach}</span>
                                            <span>Max Ruka: {crystalPlayer.handLimit} (Vlajky: {crystalPlayer.axiomaticFlags})</span>
                                        </div>
                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                            {crystalPlayer.isRooted && (
                                                <button 
                                                    onClick={() => onCureStatus('rooted')}
                                                    className="bg-red-950/70 hover:bg-red-900 border border-red-500/30 text-red-400 text-[8px] font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                                    title="Kliknutím vyliečite obetovaním červenej (attack) karty"
                                                >
                                                    🩹 Rooted (Cure)
                                                </button>
                                            )}
                                            {crystalPlayer.isSlowed && (
                                                <button 
                                                    onClick={() => onCureStatus('slowed')}
                                                    className="bg-[color:var(--panel-bg)] hover:brightness-125 border border-[color:var(--accent-loot)] text-[color:var(--accent-loot)] text-[8px] font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                                    title="Kliknutím vyliečite obetovaním žltej (move) karty"
                                                >
                                                    🩹 Slowed (Cure)
                                                </button>
                                            )}
                                            {crystalPlayer.isDisarmed && (
                                                <button 
                                                    onClick={() => onCureStatus('disarmed')}
                                                    className="bg-red-950/70 hover:bg-red-900 border border-red-500/30 text-red-400 text-[8px] font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                                    title="Kliknutím vyliečite obetovaním červenej (attack) karty"
                                                >
                                                    🩹 Disarmed (Cure)
                                                </button>
                                            )}
                                            {crystalPlayer.isSilenced && (
                                                <button 
                                                    onClick={() => onCureStatus('silenced')}
                                                    className="bg-blue-950/70 hover:bg-blue-900 border border-blue-500/30 text-blue-400 text-[8px] font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                                    title="Kliknutím vyliečite obetovaním modrej (spell) karty"
                                                >
                                                    🩹 Silenced (Cure)
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Toxic Player Telemetry */}
                            <div className="border-b border-slate-800/60 pb-1.5">
                                <div className="flex justify-between text-purple-400 font-bold">
                                    <span>TOXIC (Hacker Root):</span>
                                    <span>{toxicPlayer ? `${toxicPlayer.health} / ${toxicPlayer.maxHealth || 12} HP` : 'Deallocated'}</span>
                                </div>
                                {toxicPlayer && (
                                    <>
                                        <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                                            <span>LVL {toxicPlayer.level || 1} (XP: {toxicPlayer.xp || 0} / {(toxicPlayer.level || 1) * 100})</span>
                                            <span>Luck: {(toxicPlayer.luck ?? 0.5).toFixed(2)}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-2 text-[9px] text-purple-400/80 mt-1">
                                            <span>Dosah Útoku: {toxicPlayer.attackReach}</span>
                                            <span>Dosah Kúzla: {toxicPlayer.spellReach}</span>
                                            <span>Max Ruka: {toxicPlayer.handLimit} (Vlajky: {toxicPlayer.axiomaticFlags})</span>
                                        </div>
                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                            {toxicPlayer.isRooted && (
                                                <button 
                                                    onClick={() => onCureStatus('rooted')}
                                                    className="bg-red-950/70 hover:bg-red-900 border border-red-500/30 text-red-400 text-[8px] font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                                    title="Kliknutím vyliečite obetovaním červenej (attack) karty"
                                                >
                                                    🩹 Rooted (Cure)
                                                </button>
                                            )}
                                            {toxicPlayer.isSlowed && (
                                                <button 
                                                    onClick={() => onCureStatus('slowed')}
                                                    className="bg-[color:var(--panel-bg)] hover:brightness-125 border border-[color:var(--accent-loot)] text-[color:var(--accent-loot)] text-[8px] font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                                    title="Kliknutím vyliečite obetovaním žltej (move) karty"
                                                >
                                                    🩹 Slowed (Cure)
                                                </button>
                                            )}
                                            {toxicPlayer.isDisarmed && (
                                                <button 
                                                    onClick={() => onCureStatus('disarmed')}
                                                    className="bg-red-950/70 hover:bg-red-900 border border-red-500/30 text-red-400 text-[8px] font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                                    title="Kliknutím vyliečite obetovaním červenej (attack) karty"
                                                >
                                                    🩹 Disarmed (Cure)
                                                </button>
                                            )}
                                            {toxicPlayer.isSilenced && (
                                                <button 
                                                    onClick={() => onCureStatus('silenced')}
                                                    className="bg-blue-950/70 hover:bg-blue-900 border border-blue-500/30 text-blue-400 text-[8px] font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                                    title="Kliknutím vyliečite obetovaním modrej (spell) karty"
                                                >
                                                    🩹 Silenced (Cure)
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="flex justify-between mt-1 pt-1 border-t border-slate-800">
                                <span>SYSTEM ENERGY:</span>
                                <span className={(gameState?.systemEnergy || 0) > 80 ? "text-red-400 animate-pulse font-bold" : "text-[color:var(--accent-loot)]"}>
                                    {(gameState?.systemEnergy || 0).toFixed(1)} / 100.0
                                </span>
                            </div>
                        </div>

                        <div className="mt-3 flex justify-between items-center text-xs font-mono">
                            <span>ENTROPY STRESS:</span>
                            <span className={entropy > 0.7 ? "text-red-400 animate-pulse font-bold" : "text-green-400"}>
                                {(entropy * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 mt-1 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-[color:var(--accent-magic)] to-[color:var(--accent-danger)] h-full transition-all duration-300" style={{ width: `${entropy * 100}%` }}></div>
                        </div>
                        {goTelemetry && (
                            <div className="mt-2.5 pt-2 border-t border-slate-800/80 font-mono text-[9px] flex flex-col gap-1 text-slate-400">
                                <div className="flex justify-between font-bold text-[color:var(--accent-magic)] items-center">
                                    <span>📡 AETHERIC GPS SIGNAL:</span>
                                    <span className="bg-[color:var(--panel-bg)] text-[color:var(--accent-magic)] text-[8px] px-1 rounded font-bold uppercase tracking-wider">CONNECTED</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Combat Events (Time/Place):</span>
                                    <span className="text-white font-bold">{goTelemetry.totalCombatEvents}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Avg Magnitude (Power):</span>
                                    <span className="text-white font-bold">{goTelemetry.avgMagnitude?.toFixed(2)} V</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Manners (Attack/Def/Spell):</span>
                                    <span className="text-white font-bold">
                                        {goTelemetry.mannerDistribution?.attack} / {goTelemetry.mannerDistribution?.defense} / {goTelemetry.mannerDistribution?.spell}
                                    </span>
                                </div>
                            </div>
                        )}
                        {terrainTelemetry?.difficulty && (
                            <div className="mt-2.5 pt-2 border-t border-slate-800/80 font-mono text-[9px] flex flex-col gap-1 text-slate-400">
                                <div className="flex justify-between font-bold text-purple-400 items-center">
                                    <span>🧠 TELEMETRY DOPAMINE BALANCER:</span>
                                    <span className="bg-purple-950 text-purple-300 text-[8px] px-1 rounded font-bold uppercase tracking-wider">
                                        {terrainTelemetry.difficulty.combatIntensity} INTENSITY
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Difficulty Multiplier:</span>
                                    <span className="text-white font-bold">{terrainTelemetry.difficulty.difficultyMultiplier}x</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Dopamine Reward:</span>
                                    <span className="text-white font-bold text-[color:var(--accent-magic)]">{terrainTelemetry.difficulty.dopamineRewardMultiplier}x XP/Loot</span>
                                </div>
                                <div className="text-[8px] text-purple-400/80 leading-tight italic mt-0.5">
                                    {terrainTelemetry.directionalFlow}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    const renderSandbox = (isMobile = false) => {
        return (
            <div className="bg-[color:var(--panel-bg)] border border-slate-700/30 text-white p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[280px] w-full text-left">
                <div 
                    onClick={() => !isMobile && setCollapsed(prev => ({ ...prev, sandbox: !prev.sandbox }))}
                    className={`text-[10px] text-slate-400 tracking-wider font-mono uppercase flex justify-between items-center ${!isMobile ? 'cursor-pointer select-none' : ''}`}
                >
                    <span>Sandbox Config {!isMobile && (collapsed.sandbox ? '▶' : '▼')}</span>
                </div>
                
                {(!collapsed.sandbox || isMobile) && (
                    <div className="mt-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono">Mód:</span>
                            <button 
                                onClick={() => setIsSandbox(!isSandbox)}
                                className={`text-[10px] font-mono px-2 py-0.5 rounded cursor-pointer font-bold ${isSandbox ? 'bg-green-950 text-green-400 border border-green-500/40' : 'bg-blue-950 text-blue-400 border border-blue-500/40'}`}
                            >
                                {isSandbox ? 'OFFLINE SANDBOX' : 'LIVE SERVER'}
                            </button>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-mono text-slate-400 flex justify-between">
                                <span>Simulate Shader Entropy:</span>
                                <span>{(entropy * 100).toFixed(0)}%</span>
                            </label>
                            <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.05" 
                                value={entropy} 
                                onChange={(e) => setEntropy(parseFloat(e.target.value))}
                                className="w-full accent-[color:var(--accent-magic)] cursor-pointer"
                            />
                        </div>

                        <button
                            onClick={onResetSimulation}
                            className="w-full mt-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 py-1 rounded text-xs font-mono cursor-pointer transition-colors"
                        >
                            Resetovať simuláciu
                        </button>

                        <button 
                            onClick={onEvolveScene}
                            className="w-full mt-2 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-500/40 py-1 rounded text-xs font-mono cursor-pointer transition-colors font-bold"
                        >
                            Evolučne vygenerovať scénu
                        </button>

                        {/* Weather & Ambient Profiles Setup */}
                        <div className="mt-3 pt-3 border-t border-slate-700/30">
                            <label className="text-[10px] font-mono text-slate-400 block mb-1">
                                Weather & Lighting Profile:
                            </label>
                            <div className="grid grid-cols-2 gap-1.5">
                                <button
                                    onClick={() => {
                                        setWeatherOverride(null);
                                        setIsManualWeather(false);
                                    }}
                                    className={`text-[9px] font-mono py-1 px-1.5 rounded cursor-pointer transition-colors text-center border font-bold ${!weatherOverride ? 'bg-[color:var(--accent-loot,#39ff14)]/20 text-[color:var(--accent-loot,#39ff14)] border-[color:var(--accent-loot,#39ff14)]/50' : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'}`}
                                >
                                    AUTO (BIOME)
                                </button>
                                <button
                                    onClick={() => {
                                        setWeatherOverride('DEFAULT');
                                        setIsManualWeather(true);
                                    }}
                                    className={`text-[9px] font-mono py-1 px-1.5 rounded cursor-pointer transition-colors text-center border font-bold ${weatherOverride === 'DEFAULT' ? 'bg-blue-950 text-blue-300 border-blue-500/50' : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'}`}
                                >
                                    CLEAR REALM
                                </button>
                                <button
                                    onClick={() => {
                                        setWeatherOverride('TOXIC_HAZE');
                                        setIsManualWeather(true);
                                    }}
                                    className={`text-[9px] font-mono py-1 px-1.5 rounded cursor-pointer transition-colors text-center border font-bold ${weatherOverride === 'TOXIC_HAZE' ? 'bg-lime-950 text-lime-300 border-lime-500/50' : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'}`}
                                >
                                    TOXIC HAZE
                                </button>
                                <button
                                    onClick={() => {
                                        setWeatherOverride('VOID_ECLIPSE');
                                        setIsManualWeather(true);
                                    }}
                                    className={`text-[9px] font-mono py-1 px-1.5 rounded cursor-pointer transition-colors text-center border font-bold ${weatherOverride === 'VOID_ECLIPSE' ? 'bg-purple-950 text-purple-300 border-purple-500/50' : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'}`}
                                >
                                    VOID ECLIPSE
                                </button>
                                <button
                                    onClick={() => {
                                        setWeatherOverride('AURORA_STORM');
                                        setIsManualWeather(true);
                                    }}
                                    className={`text-[9px] font-mono py-1 px-1.5 rounded cursor-pointer transition-colors text-center border font-bold ${weatherOverride === 'AURORA_STORM' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50' : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'}`}
                                >
                                    AURORA STORM
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderQuests = (isMobile = false) => {
        if (!activePlayer || !activePlayer.quests || activePlayer.quests.length === 0) return null;
        return (
            <div className="bg-[color:var(--panel-bg)] border border-[#a855f7]/30 text-white p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[280px] w-full text-left">
                <div 
                    onClick={() => !isMobile && setCollapsed(prev => ({ ...prev, quests: !prev.quests }))}
                    className={`text-[10px] text-[#a855f7] tracking-widest font-mono uppercase flex justify-between items-center font-bold ${!isMobile ? 'cursor-pointer select-none' : ''}`}
                >
                    <span>Active Quests {!isMobile && (collapsed.quests ? '▶' : '▼')}</span>
                    <span>{activePlayer.quests.filter(q => q.completed).length} / {activePlayer.quests.length}</span>
                </div>
                
                {(!collapsed.quests || isMobile) && (
                    <div className="flex flex-col gap-2.5 font-mono text-xs mt-3">
                        {activePlayer.quests.map((quest) => {
                            const isSemantic = semanticSector?.databaseQuest && 
                                (semanticSector.databaseQuest.quest_id === quest.id || 
                                 (quest.id === 'q_crystal_forge' && semanticSector.databaseQuest.quest_id === 'q_crystal_forge') ||
                                 (quest.id === 'q_toxic_cleanse' && semanticSector.databaseQuest.quest_id === 'q_toxic_cleanse'));

                            const title = isSemantic ? semanticSector.databaseQuest.title : quest.title;
                            const description = isSemantic ? semanticSector.databaseQuest.prompt : quest.description;

                            // Badge helper for quest.objectiveType
                            let objectiveBadge = null;
                            switch (quest.objectiveType) {
                                case 'DEFEAT_NPC':
                                    objectiveBadge = <span className="text-[7.5px] bg-red-950/80 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20 font-bold uppercase mr-1">⚔️ NPC Defeat</span>;
                                    break;
                                case 'HARVEST_MATERIAL':
                                    objectiveBadge = <span className="text-[7.5px] bg-[color:var(--panel-bg)] text-[color:var(--accent-loot)] px-1.5 py-0.5 rounded border border-[color:var(--accent-loot)] font-bold uppercase mr-1">⛏️ Collect</span>;
                                    break;
                                case 'REACH_BIOME':
                                    objectiveBadge = <span className="text-[7.5px] bg-blue-950/80 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 font-bold uppercase mr-1">🗺️ Explore</span>;
                                    break;
                                case 'REACH_LEVEL':
                                    objectiveBadge = <span className="text-[7.5px] bg-emerald-950/80 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold uppercase mr-1">📈 Level Up</span>;
                                    break;
                                default:
                                    objectiveBadge = <span className="text-[7.5px] bg-indigo-950/80 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20 font-bold uppercase mr-1">🎯 Objective</span>;
                            }

                            return (
                                <div key={quest.id} className="border-t border-slate-800 pt-2.5 first:border-0 first:pt-0">
                                    <div className="flex flex-wrap gap-1.5 items-center mb-1">
                                        {objectiveBadge}
                                        {quest.completed && <span className="text-[7.5px] bg-green-950 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20 font-bold uppercase">COMPLETED</span>}
                                    </div>
                                    <div className="flex justify-between items-start gap-1">
                                        <span className={quest.completed ? "text-green-400 line-through font-semibold" : "text-slate-200 font-semibold"}>
                                            {title}
                                        </span>
                                    </div>
                                    <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">{description}</div>
                                    
                                    {quest.targetName && (
                                        <div className="text-[8px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                                            <span className="text-slate-500 uppercase font-semibold text-[7px]">Target:</span>
                                            <span className="bg-slate-900 border border-slate-800 text-slate-300 px-1 rounded text-[7px] font-bold">{quest.targetName}</span>
                                        </div>
                                    )}

                                    <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-400">
                                        <div className="w-2/3 bg-slate-800 h-1.5 rounded overflow-hidden mr-2">
                                            <div 
                                                className={`h-full transition-all duration-300 ${quest.completed ? 'bg-green-500' : 'bg-purple-500'}`} 
                                                style={{ width: `${(quest.progress / quest.targetValue) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span>{quest.progress} / {quest.targetValue}</span>
                                    </div>
                                    <div className="text-[8px] text-slate-400 mt-1 flex justify-between font-mono">
                                        <span className="text-[color:var(--accent-magic)] font-bold">+{quest.xpReward} XP</span>
                                        {quest.materialReward && (
                                            <span className="text-purple-400 font-bold">+{quest.materialReward.amount} {quest.materialReward.type}</span>
                                        )}
                                    </div>
                                    {isSemantic && semanticSector?.dialogue?.generated_dialogue && (
                                        <div className="mt-2.5 p-2 bg-purple-950/40 border border-purple-500/20 rounded text-[9px] text-purple-300 leading-tight italic font-mono flex flex-col gap-1">
                                            <span className="text-[8px] text-[color:var(--accent-magic)] font-bold uppercase not-italic">💬 {semanticSector.dialogue.archetype} DIALOGUE:</span>
                                            "{semanticSector.dialogue.generated_dialogue}"
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    const renderLogs = (isMobile = false) => {
        return (
            <div className="bg-[#0e0e16]/75 border border-purple-500/30 text-slate-300 p-4 rounded-xl shadow-2xl backdrop-blur-md lg:w-96 w-full max-w-md max-h-64 font-mono text-xs text-left">
                <div 
                    onClick={() => !isMobile && setCollapsed(prev => ({ ...prev, logs: !prev.logs }))}
                    className={`text-[#a855f7] font-bold uppercase mb-1.5 text-[10px] tracking-wider flex justify-between items-center ${!isMobile ? 'cursor-pointer select-none' : ''}`}
                >
                    <span>Telemetry Log {!isMobile && (collapsed.logs ? '▶' : '▼')}</span>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                </div>
                
                {(!collapsed.logs || isMobile) && (
                    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1 mt-2">
                        {actionLogs.length === 0 ? (
                            <div className="text-slate-500 italic">&gt; Čaká sa na akcie...</div>
                        ) : (
                            actionLogs.map((log, idx) => (
                                <div 
                                    key={idx} 
                                    className={
                                        log.includes('Zlyhalo') || log.includes('purged') ? 'text-red-400' :
                                        log.includes('Vyhodnotenie') || log.includes('Ohm') ? 'text-[color:var(--accent-loot)]' :
                                        log.includes('Pohyb') || log.includes('Úspešné') ? 'text-[color:var(--accent-magic)]' : 'text-slate-300'
                                    }
                                >
                                    &gt; {log}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderCompositor = (isMobile = false) => {
        return (
            <div className="bg-[color:var(--panel-bg)] border border-purple-500/30 text-white p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[280px] w-full text-left">
                <div 
                    onClick={() => !isMobile && setCollapsed(prev => ({ ...prev, compositor: !prev.compositor }))}
                    className={`text-[10px] text-purple-400 tracking-widest font-mono uppercase mb-1 flex justify-between items-center ${!isMobile ? 'cursor-pointer select-none' : ''}`}
                >
                    <span>🎨 Nanobanana Compositor {!isMobile && (collapsed.compositor ? '▶' : '▼')}</span>
                </div>
                
                {(!collapsed.compositor || isMobile) && (
                    <div className="mt-2.5">
                        <GameplayCompositorTemplate activeThreadId={activePlayer?.id} />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 z-10 font-sans">
            {/* REACTIVE INTERRUPT WINDOW OVERLAY */}
            {gameState?.turnStateMachine?.currentPhase === 'INTERRUPT_WINDOW' && (() => {
                const currentAction = gameState?.turnStateMachine?.currentAction;
                const attacker = gameState?.threads?.find(t => t.id === currentAction?.sourceId);
                const attackerName = attacker ? attacker.name : (currentAction?.sourceId || 'Nepriateľ');
                const cardMeta = currentAction ? getCardMetadata(currentAction.instruction.id) : null;
                const timerVal = gameState?.turnStateMachine?.timerLeft ?? 3;
                const circumference = 2 * Math.PI * 16; // r=16 -> ~100.53
                const strokeDashoffset = circumference - (timerVal / 3) * circumference;

                return (
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-slate-950/90 border border-red-500/40 text-white px-6 py-3 rounded-2xl flex flex-col md:flex-row items-center gap-4 shadow-[0_0_30px_rgba(239,68,68,0.3)] backdrop-blur-xl z-40 pointer-events-auto min-w-[320px] md:min-w-[480px]">
                        {/* Countdown ring */}
                        <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle 
                                    cx="24" 
                                    cy="24" 
                                    r="16" 
                                    className="stroke-red-950/30 fill-transparent" 
                                    strokeWidth="3.5" 
                                />
                                <circle 
                                    cx="24" 
                                    cy="24" 
                                    r="16" 
                                    className="stroke-red-500 fill-transparent transition-all duration-300 ease-linear" 
                                    strokeWidth="3.5" 
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span className="text-xs font-mono font-bold text-red-400 z-10">{timerVal}s</span>
                        </div>

                        {/* Threat detail */}
                        <div className="flex-1 flex flex-col text-center md:text-left">
                            <span className="text-[10px] md:text-[11px] font-mono text-red-500 uppercase tracking-widest font-bold">
                                ⚠️ PRICHÁDZAJÚCI ÚTOK (INTERRUPT)
                            </span>
                            <div className="text-xs md:text-sm font-bold text-slate-200 mt-0.5">
                                <span className="text-[color:var(--accent-magic)]">{attackerName}</span> použil <span className="text-purple-400">{cardMeta?.name || currentAction?.instruction?.name || 'Útok'}</span>
                            </div>
                            <div className="text-[9px] md:text-[10px] text-slate-400 mt-0.5">
                                Hrozba: <span className="text-red-400 font-bold">-{currentAction?.instruction?.damage || 1} HP</span> | Vyžaduje sa reakčná karta na obranu!
                            </div>
                        </div>

                        {/* Pass button */}
                        <button
                            onClick={() => onPassReaction && onPassReaction()}
                            className="bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-400 hover:text-red-200 text-[10px] md:text-xs font-mono font-bold px-3 py-1.5 rounded-lg shadow-lg cursor-pointer transition-all hover:scale-95 uppercase tracking-wide flex-shrink-0"
                            title="Preskočiť okno reakcie a okamžite vyhodnotiť boj"
                        >
                            Preskočiť ⏭️
                        </button>
                    </div>
                );
            })()}
            {/* Mobile/Tablet Compact Top Bar */}
            <div className="w-full flex lg:hidden justify-between items-center bg-[#0e0e16]/90 border border-slate-800/80 p-3 rounded-2xl backdrop-blur-xl shadow-xl pointer-events-auto gap-3 text-white font-mono text-[10px] md:text-xs">
                <div className="flex items-center gap-2">
                    <span className="text-[color:var(--accent-magic)] font-bold">💎 {crystalPlayer ? crystalPlayer.health : 0} HP</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-purple-400 font-bold">🧪 {toxicPlayer ? toxicPlayer.health : 0} HP</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[color:var(--accent-loot)] font-bold">⚡ {(gameState?.systemEnergy || 0).toFixed(0)}%</span>
                    <span className="text-slate-600">|</span>
                    <span className={entropy > 0.7 ? "text-red-400 animate-pulse font-bold" : "text-green-400 font-bold"}>🌀 {(entropy * 100).toFixed(0)}%</span>
                </div>
                <button 
                    onClick={() => setIsMobileDrawerOpen(true)}
                    className="bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-purple-300 font-bold px-3 py-1 rounded-xl transition-all uppercase tracking-wide cursor-pointer"
                >
                    📊 Dashboard
                </button>
            </div>

            {/* Desktop-only side panels — kontajner je celoplošný, preto NESMIE chytať
                pointer eventy (blokoval by kameru na canvase pod ním); interaktívne sú
                až samotné panely. flex-1 + min-h-0 zaručí, že panely si zoberú len
                priestor zvyšný po spodnom HUD s kartami a vnútri skrolujú. */}
            <div className="w-full hidden lg:flex lg:flex-row justify-between items-start gap-4 pointer-events-none pr-2 flex-1 min-h-0">
                <div className="flex flex-col gap-3 w-full max-w-md pointer-events-auto max-h-full overflow-y-auto pr-1">
                    {renderTelemetry(false)}
                    {renderSandbox(false)}
                    {renderQuests(false)}
                    {renderCompositor(false)}
                </div>
                <div className="pointer-events-auto max-h-full overflow-y-auto">
                    {renderLogs(false)}
                </div>
            </div>

            {/* Mobile/Tablet Full Dashboard Drawer */}
            {isMobileDrawerOpen && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-40 flex justify-end pointer-events-auto lg:hidden">
                    <div className="w-full sm:w-[450px] h-full bg-[#08080f]/95 border-l border-slate-800 p-5 flex flex-col gap-4 overflow-y-auto shadow-2xl relative">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                            <h2 className="text-sm font-bold text-white tracking-widest font-mono uppercase flex items-center gap-1.5">
                                <span>📊</span> Sovereign Dashboard
                            </h2>
                            <button 
                                onClick={() => setIsMobileDrawerOpen(false)}
                                className="text-slate-400 hover:text-white font-mono text-xs cursor-pointer px-2 py-1 rounded bg-slate-900 border border-slate-800 transition-colors hover:bg-slate-800"
                            >
                                ✕ ZATVORIŤ
                            </button>
                        </div>

                        <div className="flex flex-col gap-4">
                            {renderTelemetry(true)}
                            {renderSandbox(true)}
                            {renderQuests(true)}
                            {renderCompositor(true)}
                            {renderLogs(true)}
                        </div>
                    </div>
                </div>
            )}

            {/* Stredné HUD - Výber, Pohyb a Spustenie akcie */}
            <div className="self-center flex flex-col items-center gap-2 pointer-events-auto">
                {selectedCard && (
                    <div className="flex flex-col gap-2">
                        <div className="bg-[color:var(--panel-bg)] border border-[color:var(--accent-magic)] text-white px-4 py-2.5 rounded-lg shadow-xl backdrop-blur-md text-xs font-mono text-center flex flex-col gap-1 min-w-[280px]">
                            <div>
                                Vybratá inštrukcia: <span className="text-[color:var(--accent-magic)] font-bold">{getCardMetadata(selectedCard.id).name}</span>
                            </div>
                            {selectedNode ? (
                                <div>
                                    Cieľový hexagón: <span className="text-yellow-400 font-bold">{selectedNode.id}</span>
                                    <button 
                                        onClick={handleExecuteClick}
                                        className="ml-3 bg-[color:var(--panel-bg)] hover:brightness-125 border border-[color:var(--accent-magic)] text-[color:var(--accent-magic)] px-3 py-0.5 rounded font-bold transition-colors cursor-pointer"
                                    >
                                        Spustiť [Space] (V={selectedCard.isUltimate ? 6 : 3})
                                    </button>
                                </div>
                            ) : (
                                <div className="text-slate-400 italic">
                                    Kliknutím na 3D arénu vyberte cieľový hexagón
                                </div>
                            )}
                        </div>

                        {/* TACTICAL PHYSICS SPECTROMETER */}
                        <div className="bg-[#0e0e16]/90 border border-purple-500/40 text-slate-300 p-3 rounded-lg shadow-lg backdrop-blur-md text-[10px] font-mono flex flex-col gap-2 min-w-[280px]">
                            <div className="text-[#a855f7] font-bold uppercase tracking-wider text-center border-b border-purple-500/20 pb-1">
                                📊 Taktický Fyzikálny Spektrometer
                            </div>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-left">
                                 <div>Napätie (V): <span className="text-[color:var(--accent-magic)] font-bold"><AnimatedNumber value={currentV} suffix=" V" /></span></div>
                                 <div>Odpor (R): <span className="text-[color:var(--accent-loot)] font-bold"><AnimatedNumber value={currentR} suffix=" Ω" /></span></div>
                                 <div className={currentI >= 1.0 
                                     ? "text-green-400 font-bold drop-shadow-[0_0_8px_rgba(57,255,20,0.6)] animate-pulse" 
                                     : "text-red-400 font-bold animate-pulse border border-red-500/30 px-1 rounded bg-red-950/20"
                                 }>
                                     Prúd (I = V/R): <span><AnimatedNumber value={currentI} suffix=" A" /></span>
                                 </div>
                                 <div>Ohmic Load (P = V*I): <span className="text-purple-400 font-bold"><AnimatedNumber value={currentP} suffix=" W" /></span></div>
                             </div>

                            {selectedNode && (
                                <div className="mt-1.5 pt-1.5 border-t border-purple-500/20 text-left flex flex-col gap-1">
                                    <div className="text-yellow-400 font-bold uppercase tracking-widest text-[8px] text-center mb-1">
                                        Predikcia Kvantového Stavu
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Poškodenie (DMG):</span>
                                        <span className="text-red-400 font-bold">
                                            {AlgebraicActionTensor.evaluate(activePlayer, selectedCard.id, selectedNode).damageApplied} HP
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Systémové preťaženie:</span>
                                        <span className="text-orange-400 font-bold">
                                            +{AlgebraicActionTensor.evaluate(activePlayer, selectedCard.id, selectedNode).energyDelta.toFixed(0)} J
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Kinetické vytesnenie:</span>
                                        <span className="text-[color:var(--accent-magic)] font-bold uppercase">
                                            {AlgebraicActionTensor.evaluate(activePlayer, selectedCard.id, selectedNode).displacementType === 'none' ? 'Bez posunu' : 
                                             `${AlgebraicActionTensor.evaluate(activePlayer, selectedCard.id, selectedNode).displacementType} ${AlgebraicActionTensor.evaluate(activePlayer, selectedCard.id, selectedNode).displacementDistance} hex`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Udelený stav:</span>
                                        <span className="text-[color:var(--accent-loot)] font-bold uppercase">
                                            {AlgebraicActionTensor.evaluate(activePlayer, selectedCard.id, selectedNode).statusApplied}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Šanca na zásah:</span>
                                        <span className="text-green-400 font-bold">
                                            {AlgebraicActionTensor.evaluate(activePlayer, selectedCard.id, selectedNode).successProbability.toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!selectedCard && selectedNode && (
                    <div className="bg-[color:var(--panel-bg)] border border-slate-700/50 text-white px-4 py-2.5 rounded-lg shadow-xl backdrop-blur-md text-xs font-mono text-center flex flex-col gap-1.5 min-w-[250px]">
                        <div>
                            Vybrané políčko: <span className="text-yellow-400 font-bold">{selectedNode.id}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                            Koord: Q={selectedNode.q}, R={selectedNode.r}
                        </div>
                        <button 
                            onClick={() => onMoveHero(selectedNode)}
                            className="bg-[color:var(--panel-bg)] hover:brightness-125 border border-[color:var(--accent-magic)] text-[color:var(--accent-magic)] px-3 py-1 rounded font-bold transition-colors cursor-pointer w-full mt-1 flex items-center justify-center gap-1.5"
                        >
                            🚶 Presunúť hrdinu sem
                        </button>
                    </div>
                )}
            </div>

            {/* Spodná ruka kariet (Spodný HUD z bodu 2 checklistu) */}
            <div className="w-full flex flex-col items-center gap-2 pointer-events-auto pb-4">
                <div className="text-[10px] md:text-xs font-mono text-slate-400 bg-black/60 px-3 py-1 rounded-full border border-slate-800">
                    Aktívny klan: <span className="text-slate-200 font-bold uppercase">{gameState?.activePlayerId === 'thread_king_ai' ? 'Crystal (King AI)' : 'Toxic (Hacker Root)'}</span>
                </div>
                {activePlayer && (
                    <div className="flex flex-wrap gap-3 md:gap-4 text-[10px] md:text-xs font-mono text-slate-300 bg-black/80 px-4 py-2 rounded-xl border border-slate-800 shadow-lg justify-center items-center">
                        <span className="text-[color:var(--accent-magic)] font-bold">❤️ HP: {activePlayer.health}/{activePlayer.maxHealth || 15}</span>
                        <span className="text-[color:var(--accent-loot)]">⚔️ Dosah Útoku: {activePlayer.attackReach}</span>
                        <span className="text-purple-400">🔮 Dosah Kúzla: {activePlayer.spellReach}</span>
                        <span className="text-green-400">👟 Pohyb: {activePlayer.movementBase}</span>
                        <span className="text-blue-400">🎴 Limit ruky: {activePlayer.handLimit} (Vlajky: {activePlayer.axiomaticFlags})</span>
                        <span className="text-emerald-400">📥 Balíček: {activePlayer.drawPileCount}</span>
                        <span className="text-rose-400">📤 Odhadzovacie: {activePlayer.discardPileCount}</span>
                        <span className="text-slate-400 font-bold">{activePlayer.freeMovementUsed ? "🚫 Ťah využitý" : "🚶 Voľný pohyb"}</span>
                    </div>
                )}
                <div className="bg-[color:var(--panel-bg)] border border-slate-700/50 p-3 md:p-4 rounded-2xl flex gap-2.5 md:gap-3 backdrop-blur-xl shadow-2xl max-w-full overflow-x-auto custom-scrollbar">
                    {cards.length === 0 ? (
                        <div className="text-slate-500 text-xs font-mono self-center py-6 px-12">Ruka je prázdna (dobite si na konci tahu)</div>
                    ) : (
                        cards.map((card, idx) => {
                            const meta = getCardMetadata(card.id);
                            const isSelected = selectedCard === card;
                            const isCasting = castingCard === card;
                            const hoverClass = getFactionHoverClass(card.id);
                            const isUlt = card.isUltimate;
                            const isReactive = gameState?.turnStateMachine?.currentPhase === 'INTERRUPT_WINDOW' && 
                                (card.id.includes('magic') || card.id.includes('shield') || card.id.includes('pulse'));
                            
                            const isHovered = hoveredCardIndex === idx;
                            let inlineStyle = {};
                            if (isHovered) {
                                if (isUlt) {
                                    inlineStyle = {
                                        boxShadow: '0 0 35px rgba(172, 242, 39, 0.9), inset 0 0 15px rgba(172, 242, 39, 0.3)',
                                        borderColor: 'var(--accent-loot)',
                                        transform: 'translateY(-20px) scale(1.05)',
                                    };
                                } else if (card.id.includes('crystal') || card.id.includes('laser') || card.id.includes('shield') || card.id.includes('pulse')) {
                                    inlineStyle = {
                                        boxShadow: '0 0 25px rgba(0, 238, 255, 0.75), inset 0 0 10px rgba(0, 238, 255, 0.2)',
                                        borderColor: '#00eeff',
                                        transform: 'translateY(-16px)',
                                    };
                                } else if (card.id.includes('toxic') || card.id.includes('snake') || card.id.includes('acid') || card.id.includes('hook') || card.id.includes('mud')) {
                                    inlineStyle = {
                                        boxShadow: '0 0 30px rgba(57, 255, 20, 0.8), inset 0 0 12px rgba(57, 255, 20, 0.2)',
                                        borderColor: '#39ff14',
                                        transform: 'translateY(-16px)',
                                    };
                                } else if (card.id.includes('bear') || card.id.includes('forest') || card.id.includes('wind') || card.id.includes('nature')) {
                                    inlineStyle = {
                                        boxShadow: '0 0 25px rgba(255, 204, 0, 0.8), inset 0 0 10px rgba(255, 204, 0, 0.2)',
                                        borderColor: '#ffcc00',
                                        transform: 'translateY(-16px)',
                                    };
                                } else {
                                    inlineStyle = {
                                        boxShadow: '0 0 25px rgba(170, 0, 255, 0.8), inset 0 0 10px rgba(170, 0, 255, 0.2)',
                                        borderColor: '#aa00ff',
                                        transform: 'translateY(-16px)',
                                    };
                                }
                            } else if (isSelected) {
                                inlineStyle = {
                                    transform: 'translateY(-16px)',
                                    borderColor: '#22d3ee',
                                    boxShadow: '0 0 15px rgba(34, 211, 238, 0.4)'
                                };
                            }

                            return (
                                <div 
                                    key={`${card.id}_${idx}`}
                                    onClick={() => setSelectedCard(isSelected ? null : card)}
                                    onMouseEnter={() => setHoveredCardIndex(idx)}
                                    onMouseLeave={() => setHoveredCardIndex(null)}
                                    style={inlineStyle}
                                    className={`w-24 h-36 md:w-32 md:h-44 flex-shrink-0 bg-gradient-to-b from-[#181824] to-[#0b0b11] border rounded-xl p-2 md:p-2.5 flex flex-col justify-between text-white cursor-pointer transition-all duration-200 relative ${
                                        isUlt ? 'card-ultimate' : ''
                                    } ${isReactive ? 'border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]' : ''} ${isCasting ? 'card-cast-lift' : ''}`}
                                >
                                    {/* Hotkey Indicator Badge */}
                                    <div className="absolute -top-1.5 -left-1.5 bg-[#14141e]/95 border border-[color:var(--accent-magic)] text-[color:var(--accent-magic)] text-[8px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-lg pointer-events-none z-20">
                                        {idx + 1}
                                    </div>
                                    {isReactive && (
                                        <div className="absolute -top-2 -right-1 bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-[0_0_6px_#ef4444] animate-pulse font-mono tracking-wide z-10">
                                            ⚡ REACT
                                        </div>
                                    )}
                                    <div className="text-[7px] md:text-[8px] font-mono text-[color:var(--accent-magic)] uppercase tracking-wider">{meta.type}</div>
                                    <div className="text-[10px] md:text-xs font-bold text-center mt-1 text-slate-200 truncate">{meta.name}</div>
                                    <div className="text-[8px] md:text-[9px] text-slate-400 text-center font-mono leading-tight line-clamp-3">{meta.desc}</div>
                                    <div className="bg-[color:var(--panel-bg)] text-[7px] md:text-[8px] text-center font-mono text-[color:var(--accent-magic)] py-0.5 md:py-1 rounded border border-[color:var(--accent-magic)]">
                                        {card.isUltimate ? 'Ultimate' : 'Normal'}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    
                    {/* Tlačidlo Ukončiť Kolo z bodu 2 checklistu */}
                    {isPlayerInTown && (
                        <button 
                            onClick={() => setIsShopOpen(true)}
                            className="h-36 md:h-44 w-12 md:w-16 flex-shrink-0 bg-[color:var(--panel-bg)] border border-[color:var(--accent-magic)] hover:brightness-125 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all text-[color:var(--accent-magic)] rounded-xl flex items-center justify-center font-mono text-[10px] md:text-xs font-bold [writing-mode:vertical-lr] uppercase tracking-widest cursor-pointer"
                        >
                            🏬 Town Shop
                        </button>
                    )}
                    
                    <button 
                        onClick={onToggleStealth}
                        className={`h-36 md:h-44 w-12 md:w-16 flex-shrink-0 border transition-all rounded-xl flex items-center justify-center font-mono text-[10px] md:text-xs font-bold [writing-mode:vertical-lr] uppercase tracking-widest cursor-pointer ${
                            isStealthed 
                                ? 'bg-[color:var(--panel-border)] border-[color:var(--accent-magic)] text-[color:var(--accent-magic)] shadow-[0_0_15px_rgba(0,229,255,0.45)] font-extrabold' 
                                : 'bg-slate-950/40 border-slate-700/60 text-slate-400 hover:bg-slate-900/60 hover:text-slate-350'
                        }`}
                    >
                        {isStealthed ? 'Stealth ON' : 'Stealth OFF'}
                    </button>
                    
                    <button 
                        onClick={onEndTurn}
                        className="h-36 md:h-44 w-12 md:w-16 flex-shrink-0 bg-red-950/40 border border-red-500/40 hover:bg-red-900/60 transition-colors text-red-400 rounded-xl flex items-center justify-center font-mono text-[10px] md:text-xs font-bold [writing-mode:vertical-lr] uppercase tracking-widest cursor-pointer"
                    >
                        End Turn [E]
                    </button>
                </div>
            </div>

            {/* Taktický Kódex Sliding Drawer */}
            {isCodexOpen && (
                <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] h-full bg-[#05050a]/95 border-l border-purple-500/30 shadow-2xl p-6 flex flex-col gap-5 overflow-y-auto pointer-events-auto z-50">
                    {/* Close button */}
                    <button 
                        onClick={() => setIsCodexOpen(false)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white font-mono text-base cursor-pointer"
                    >
                        ✕
                    </button>
                    
                    <div>
                        <h2 className="text-lg font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
                            <span className="text-purple-400">📖</span> TAKTICKÝ KÓDEX & MISIE
                        </h2>
                        <p className="text-[9px] text-slate-500 font-mono mt-1">&gt; SYSTEM PLANS & CODE MECHANICS</p>
                    </div>

                    {/* Sekcia 1: Plány a Misie */}
                    <div className="bg-[#0e0e16]/60 border border-slate-800 p-4 rounded-xl">
                        <h3 className="text-xs font-bold text-[color:var(--accent-magic)] uppercase mb-2 font-mono flex items-center gap-1.5">
                            <span>🎯</span> HERNÉ CIELE (SYSTEM GOALS)
                        </h3>
                        <ul className="flex flex-col gap-2 text-[10px] font-mono">
                            <li className="flex items-start gap-1.5 text-green-400">
                                <span>✔</span>
                                <span><strong>Obj. 1:</strong> WebSockets & State Machine integrácia</span>
                            </li>
                            <li className="flex items-start gap-1.5 text-green-400">
                                <span>✔</span>
                                <span><strong>Obj. 2:</strong> Lerp pohyb figúriek a flash efekt</span>
                            </li>
                            <li className="flex items-start gap-1.5 text-green-400">
                                <span>✔</span>
                                <span><strong>Obj. 3:</strong> Dávkové Go Core API</span>
                            </li>
                            <li className="flex items-start gap-1.5 text-green-400">
                                <span>✔</span>
                                <span><strong>Obj. 4:</strong> DDA a algebraický sledovací balancer</span>
                            </li>
                            <li className="flex items-start gap-1.5 text-green-400">
                                <span>✔</span>
                                <span><strong>Obj. 5:</strong> RPG Quest a odmeňovací systém</span>
                            </li>
                        </ul>
                    </div>

                    {/* Sekcia 2: Mechaniky a Popisy */}
                    <div className="bg-[#0e0e16]/60 border border-slate-800 p-4 rounded-xl flex flex-col gap-2.5">
                        <h3 className="text-xs font-bold text-purple-400 uppercase font-mono flex items-center gap-1.5">
                            <span>⚙</span> MECHANIKY A VÝPOČTY (RULES)
                        </h3>
                        
                        <div className="text-[10px] font-mono flex flex-col gap-2.5">
                            <div>
                                <span className="text-yellow-500 font-bold">1. Minecraft-style Biomes:</span>
                                <p className="text-slate-400 leading-tight mt-0.5">Biómy sú generované cez Perlinov šum. Lush Forest je chladný a priepustný, Toxic Swamp má vysokú entropiu.</p>
                            </div>
                            <div>
                                <span className="text-yellow-500 font-bold">2. Voxel Physics:</span>
                                <p className="text-slate-400 leading-tight mt-0.5">Každý bióm má vlastnú treciu silu (Friction). Pohyb po Toxic Swamp spotrebúva viac systémovej energie než Lush Forest.</p>
                            </div>
                            <div>
                                <span className="text-yellow-500 font-bold">3. DDA Balans (Dynamic Difficulty):</span>
                                <p className="text-slate-400 leading-tight mt-0.5">Prediktívny balancer na konci ťahu prepočíta šance. Zaostávajúcemu hráčovi zvýši Luck parameter a zníži škodu od terénu až o 50%.</p>
                            </div>
                            <div>
                                <span className="text-yellow-500 font-bold">4. RPG Leveling:</span>
                                <p className="text-slate-400 leading-tight mt-0.5">Plnením questov a elimináciou NPC získavate XP. Pri postupe na vyšší Level sa vám zvýši brnenie a plne vylieči HP.</p>
                            </div>
                            <div>
                                <span className="text-yellow-500 font-bold">5. Taktický Rámec (Synergie a Overdrive):</span>
                                <p className="text-slate-400 leading-tight mt-0.5">Biómové Synergie (napr. +1 HP heal v lesoch, +1 DMG v močiaroch), Kinetické Vytesnenie (odtláčanie na nebezpečné diely) a Ohmov Overdrive pri kritickom nabití systémovej energie (≥75% na doberanie, ≥90% na brnenie).</p>
                            </div>
                        </div>
                    </div>

                    {/* Sekcia 3: Herný Kódex */}
                    <div className="bg-[#0e0e16]/60 border border-slate-800 p-4 rounded-xl">
                        <h3 className="text-xs font-bold text-[color:var(--accent-loot)] uppercase mb-2 font-mono flex items-center gap-1.5">
                            <span>🛡</span> CLAN ART STYLES
                        </h3>
                        <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
                            Aréna kombinuje sklenené cyberpunkové rozhranie (Cyber-Baroque) s izometrickou 63-hexagónovou mriežkou. Voxelové figúrky predstavujú hrdinov z Warhammer klanov - technologických rytierov (Crystal AI) a rebelov (Toxic Hacker Root).
                        </p>
                    </div>
                </div>
            )}

            {/* Town Shop Modal */}
            {isShopOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center pointer-events-auto z-50 p-4">
                    <div className="bg-[#0b0b12]/95 border border-[color:var(--accent-magic)] rounded-2xl w-full max-w-2xl p-6 shadow-[0_0_40px_rgba(6,182,212,0.15)] max-h-[85vh] overflow-y-auto text-left">
                        {/* Header */}
                        <div className="flex justify-between items-start border-b border-slate-800 pb-3 mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <span>🏬</span> Mesto a Obchod (Town Shop)
                                </h2>
                                <p className="text-[10px] text-[color:var(--accent-magic)] font-mono mt-0.5">
                                    Miesto pre nákup a predaj zbraní, nástrojov a surovín. pozícia: M0_S0
                                </p>
                            </div>
                            <button 
                                onClick={() => setIsShopOpen(false)}
                                className="text-slate-400 hover:text-white font-mono text-lg cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Player Currencies */}
                        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 mb-5 flex justify-around text-xs font-mono">
                            <div>
                                <span className="text-[color:var(--accent-magic)] font-bold">Crystal Shards:</span>{' '}
                                <span className="text-white font-bold">{activePlayer?.materials?.CrystalShard || 0}</span>
                            </div>
                            <div>
                                <span className="text-purple-400 font-bold">Toxic Spores:</span>{' '}
                                <span className="text-white font-bold">{activePlayer?.materials?.Spores || 0}</span>
                            </div>
                            <div>
                                <span className="text-[color:var(--accent-loot)] font-bold">Essence:</span>{' '}
                                <span className="text-white font-bold">{activePlayer?.materials?.Essence || 0}</span>
                            </div>
                            <div>
                                <span className="text-green-400 font-bold">Weapon DMG:</span>{' '}
                                <span className="text-white font-bold">+{activePlayer?.baseDamage ? activePlayer.baseDamage - 5 : 0}</span>
                            </div>
                        </div>

                        {/* Owned Inventory List */}
                        <div className="mb-5">
                            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 font-mono">
                                🎒 Vlastnené predmety a zbrane (Inventory)
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {!activePlayer?.items || activePlayer.items.length === 0 ? (
                                    <div className="text-[10px] text-slate-500 font-mono italic">Žiadne zakúpené predmety v inventári.</div>
                                ) : (
                                    activePlayer.items.map((item, idx) => {
                                        const catalogItem = ITEMS_CATALOG[item.itemKey];
                                        return (
                                            <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-lg p-2 flex items-center gap-3 text-xs font-mono">
                                                <div>
                                                    <div className="text-slate-200 font-bold">{catalogItem?.name || item.itemKey}</div>
                                                    <div className="text-[9px] text-slate-400">Kat: {item.category} | Množstvo: {item.quantity}</div>
                                                </div>
                                                <button 
                                                    onClick={() => onSellItem(item.itemKey)}
                                                    className="bg-red-950/70 hover:bg-red-900 border border-red-500/30 text-red-400 text-[10px] px-2 py-0.5 rounded cursor-pointer transition-colors"
                                                >
                                                    Predať (+{catalogItem?.sellValue?.amount} {catalogItem?.sellValue?.material})
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Buyable Shop Items */}
                        <div>
                            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 font-mono">
                                🛒 Kúpiť vybavenie a zbrane (Shop Catalog)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.values(ITEMS_CATALOG).map((item, idx) => {
                                    const costColor = item.buyCost.material === 'CrystalShard' ? 'text-[color:var(--accent-magic)]' :
                                                      item.buyCost.material === 'Spores' ? 'text-purple-400' : 'text-[color:var(--accent-loot)]';
                                    const balance = activePlayer?.materials?.[item.buyCost.material] || 0;
                                    const canAfford = balance >= item.buyCost.amount;

                                    return (
                                        <div key={idx} className="bg-slate-900/40 border border-slate-800 hover:border-slate-700/60 rounded-xl p-3 flex flex-col justify-between gap-2.5">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <span className="text-xs font-bold text-white font-mono">{item.name}</span>
                                                    <span className="bg-slate-850 text-slate-400 text-[8px] font-mono px-1.5 py-0.2 rounded font-bold uppercase">{item.category}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 leading-relaxed mt-1 font-mono">{item.description}</p>
                                                {item.statBonus?.damage && (
                                                    <span className="text-[9px] text-green-400 font-mono mt-1 block">Stat Bonus: +{item.statBonus.damage} Damage</span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center mt-2 border-t border-slate-850 pt-2">
                                                <span className="text-[10px] font-mono text-slate-400">
                                                    Cena:{' '}
                                                    <span className={`${costColor} font-bold`}>
                                                        {item.buyCost.amount} {item.buyCost.material}
                                                    </span>
                                                </span>
                                                <button 
                                                    onClick={() => onBuyItem(item.key)}
                                                    disabled={!canAfford}
                                                    className={`text-[10px] font-mono px-3 py-1 rounded font-bold transition-all cursor-pointer ${
                                                        canAfford 
                                                        ? 'bg-[color:var(--panel-bg)] hover:brightness-125 border border-[color:var(--accent-magic)] text-[color:var(--accent-magic)]' 
                                                        : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
                                                    }`}
                                                >
                                                    Kúpiť
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

