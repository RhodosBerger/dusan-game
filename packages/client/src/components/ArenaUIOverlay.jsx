import React from 'react';
import skCards from '../../../shared/src/translations/sk/cards.json';
import { CRYSTAL_CARDS_BASE, TOXIC_CARDS_BASE, DRUID_CARDS_BASE, VOID_CARDS_BASE, AlgebraicActionTensor, getPhysicsSpecs, ITEMS_CATALOG } from '../../../shared/src/index';
import GameplayCompositorTemplate from './GameplayCompositorTemplate';
import GameCard from './game/GameCard';
import PlayerPortrait from './game/PlayerPortrait';
import TurnBanner from './game/TurnBanner';

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
    terrainTelemetry = null
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
                    <span>Telemetry {!isMobile && (collapsed.telemetry ? '▶' : '▼')}</span>
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
                                📖 KÓDEX
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
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/85 border border-red-500/40 text-white px-6 py-3 rounded-2xl flex flex-col md:flex-row items-center gap-4 shadow-[0_0_30px_rgba(239,68,68,0.3)] backdrop-blur-xl z-40 pointer-events-auto min-w-[320px] md:min-w-[480px]">
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
                                ⚠ INCOMING ATTACK — INTERRUPT
                            </span>
                            <div className="text-xs md:text-sm font-bold text-slate-200 mt-0.5">
                                <span className="text-[color:var(--accent-magic)]">{attackerName}</span> cast <span className="text-purple-400">{cardMeta?.name || currentAction?.instruction?.name || 'Attack'}</span>
                            </div>
                            <div className="text-[9px] md:text-[10px] text-slate-400 mt-0.5">
                                Threat: <span className="text-red-400 font-bold">-{currentAction?.instruction?.damage || 1} HP</span> | Reactive card required to defend!
                            </div>
                        </div>

                        {/* Pass button */}
                        <button
                            onClick={() => onPassReaction && onPassReaction()}
                            className="bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-400 hover:text-red-200 text-[10px] md:text-xs font-mono font-bold px-3 py-1.5 rounded-lg shadow-lg cursor-pointer transition-all hover:scale-95 uppercase tracking-wide flex-shrink-0"
                            title="Skip reaction window and immediately resolve combat"
                        >
                            SKIP ⏭
                        </button>
                    </div>
                );
            })()}
            {/* ═══ UNIFIED TOP BAR — Turn banner + Player portraits ═══ */}
            <div className="w-full flex justify-between items-start gap-3 pointer-events-auto">
                {/* Left: Crystal player portrait */}
                {crystalPlayer && (
                    <PlayerPortrait
                        player={crystalPlayer}
                        faction="crystal"
                        isActive={gameState?.activePlayerId === crystalPlayer.id}
                        side="left"
                        compact={window.innerWidth < 1024}
                    />
                )}

                {/* Center: Turn banner */}
                <TurnBanner
                    activePlayerName={activePlayer?.name || 'Unknown'}
                    activePlayerFaction={
                        gameState?.activePlayerId === 'thread_king_ai' ? 'crystal' :
                        gameState?.activePlayerId === 'thread_hacker_root' ? 'toxic' : 'crystal'
                    }
                    phase={gameState?.turnStateMachine?.currentPhase || 'ACTION'}
                    turnCount={gameState?.turnsElapsed || 1}
                    systemEnergy={gameState?.systemEnergy || 0}
                    entropy={entropy}
                    onEndTurn={onEndTurn}
                    isMyTurn={true}
                />

                {/* Right: Toxic player portrait */}
                {toxicPlayer && (
                    <PlayerPortrait
                        player={toxicPlayer}
                        faction="toxic"
                        isActive={gameState?.activePlayerId === toxicPlayer.id}
                        side="right"
                        compact={window.innerWidth < 1024}
                    />
                )}

                {/* Mobile dashboard button */}
                <button
                    onClick={() => setIsMobileDrawerOpen(true)}
                    className="lg:hidden bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-purple-300 font-bold px-3 py-2 rounded-xl transition-all uppercase tracking-wide cursor-pointer flex-shrink-0"
                >
                    📊
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

            {/* ═══ CENTER HUD — Action prompt + physics spectrometer ═══ */}
            <div className="self-center flex flex-col items-center gap-2 pointer-events-auto">
                {selectedCard && (
                    <div className="flex flex-col gap-2">
                        <div className="bg-black/70 border border-[color:var(--accent-magic)] text-white px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-md text-xs font-mono text-center flex flex-col gap-1 min-w-[280px]">
                            <div>
                                <span className="text-slate-500">CARD:</span> <span className="text-[color:var(--accent-magic)] font-bold">{getCardMetadata(selectedCard.id).name}</span>
                            </div>
                            {selectedNode ? (
                                <div className="flex items-center justify-center gap-3">
                                    <span><span className="text-slate-500">TARGET:</span> <span className="text-yellow-400 font-bold">{selectedNode.id}</span></span>
                                    <button
                                        onClick={handleExecuteClick}
                                        className="bg-[color:var(--accent-magic)] hover:brightness-110 text-[color:var(--panel-bg)] px-4 py-1 rounded-lg font-bold transition-all cursor-pointer text-[11px] uppercase tracking-wide"
                                    >
                                        CAST [Space] V={selectedCard.isUltimate ? 6 : 3}
                                    </button>
                                </div>
                            ) : (
                                <div className="text-slate-400 italic text-[10px]">
                                    Click a hex tile in the arena to select target
                                </div>
                            )}
                        </div>

                        {/* TACTICAL PHYSICS SPECTROMETER */}
                        <div className="bg-black/70 border border-purple-500/30 text-slate-300 p-3 rounded-xl shadow-lg backdrop-blur-md text-[10px] font-mono flex flex-col gap-2 min-w-[280px]">
                            <div className="text-[#a855f7] font-bold uppercase tracking-wider text-center border-b border-purple-500/20 pb-1">
                                PHYSICS SPECTROMETER
                            </div>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-left">
                                <div>Voltage (V): <span className="text-[color:var(--accent-magic)] font-bold"><AnimatedNumber value={currentV} suffix=" V" /></span></div>
                                <div>Resistance (R): <span className="text-[color:var(--accent-loot)] font-bold"><AnimatedNumber value={currentR} suffix=" Ω" /></span></div>
                                <div className={currentI >= 1.0
                                    ? "text-green-400 font-bold drop-shadow-[0_0_8px_rgba(57,255,20,0.6)] animate-pulse"
                                    : "text-red-400 font-bold animate-pulse border border-red-500/30 px-1 rounded bg-red-950/20"
                                }>
                                    Current (I=V/R): <span><AnimatedNumber value={currentI} suffix=" A" /></span>
                                </div>
                                <div>Power (P=V*I): <span className="text-purple-400 font-bold"><AnimatedNumber value={currentP} suffix=" W" /></span></div>
                            </div>

                            {selectedNode && (() => {
                                const prediction = AlgebraicActionTensor.evaluate(activePlayer, selectedCard.id, selectedNode);
                                return (
                                    <div className="mt-1.5 pt-1.5 border-t border-purple-500/20 text-left flex flex-col gap-1">
                                        <div className="text-yellow-400 font-bold uppercase tracking-widest text-[8px] text-center mb-1">
                                            OUTCOME PREDICTION
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Damage:</span>
                                            <span className="text-red-400 font-bold">{prediction.damageApplied} HP</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>System Load:</span>
                                            <span className="text-orange-400 font-bold">+{prediction.energyDelta.toFixed(0)} J</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Displacement:</span>
                                            <span className="text-[color:var(--accent-magic)] font-bold uppercase">
                                                {prediction.displacementType === 'none' ? 'None' :
                                                 `${prediction.displacementType} ${prediction.displacementDistance} hex`}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Status:</span>
                                            <span className="text-[color:var(--accent-loot)] font-bold uppercase">{prediction.statusApplied}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Hit Chance:</span>
                                            <span className="text-green-400 font-bold">{prediction.successProbability.toFixed(0)}%</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {!selectedCard && selectedNode && (
                    <div className="bg-black/70 border border-slate-700/50 text-white px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-md text-xs font-mono text-center flex flex-col gap-1.5 min-w-[250px]">
                        <div>
                            <span className="text-slate-500">HEX:</span> <span className="text-yellow-400 font-bold">{selectedNode.id}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                            Q={selectedNode.q}, R={selectedNode.r}
                        </div>
                        <button
                            onClick={() => onMoveHero(selectedNode)}
                            className="bg-[color:var(--accent-magic)] hover:brightness-110 text-[color:var(--panel-bg)] px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer w-full mt-1 flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-wide"
                        >
                            → MOVE HERO HERE
                        </button>
                    </div>
                )}
            </div>

            {/* ═══ BOTTOM HUD — Card hand + stat chips + action buttons ═══ */}
            <div className="w-full flex flex-col items-center gap-2 pointer-events-auto pb-2">
                {/* Compact stat chips */}
                {activePlayer && (
                    <div className="flex flex-wrap gap-2 text-[9px] md:text-[10px] font-mono text-slate-400 justify-center items-center">
                        <span className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-lg border border-slate-800/80">
                            <span style={{color: 'var(--accent-magic)'}}>⚔</span>
                            <span className="text-slate-300 font-bold">{activePlayer.attackReach}</span>
                            <span className="text-slate-600">ATK</span>
                        </span>
                        <span className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-lg border border-slate-800/80">
                            <span style={{color: '#a855f7'}}>✦</span>
                            <span className="text-slate-300 font-bold">{activePlayer.spellReach}</span>
                            <span className="text-slate-600">SP</span>
                        </span>
                        <span className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-lg border border-slate-800/80">
                            <span style={{color: '#4ade80'}}>→</span>
                            <span className="text-slate-300 font-bold">{activePlayer.movementBase}</span>
                            <span className="text-slate-600">MOV</span>
                        </span>
                        <span className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-lg border border-slate-800/80">
                            <span style={{color: '#60a5fa'}}>♣</span>
                            <span className="text-slate-300 font-bold">{cards.length}/{activePlayer.handLimit}</span>
                            <span className="text-slate-600">HAND</span>
                        </span>
                        <span className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-lg border border-slate-800/80">
                            <span style={{color: '#34d399'}}>▼</span>
                            <span className="text-slate-300 font-bold">{activePlayer.drawPileCount}</span>
                            <span className="text-slate-600">DECK</span>
                        </span>
                        <span className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-lg border border-slate-800/80">
                            <span style={{color: '#fb7185'}}>▲</span>
                            <span className="text-slate-300 font-bold">{activePlayer.discardPileCount}</span>
                            <span className="text-slate-600">DISC</span>
                        </span>
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${
                            activePlayer.freeMovementUsed
                                ? 'bg-red-950/40 border-red-500/30 text-red-400'
                                : 'bg-green-950/40 border-green-500/30 text-green-400'
                        }`}>
                            {activePlayer.freeMovementUsed ? '✗ USED' : '✓ FREE'}
                        </span>
                    </div>
                )}
                {/* Card hand container */}
                <div className="flex items-end gap-2 md:gap-3 max-w-full overflow-x-auto custom-scrollbar pb-2" style={{ scrollbarWidth: 'thin' }}>
                    {cards.length === 0 ? (
                        <div className="text-slate-500 text-xs font-mono self-center py-8 px-16 bg-black/40 rounded-xl border border-dashed border-slate-800">
                            ♻ Hand is empty — draw cards at end of turn
                        </div>
                    ) : (
                        cards.map((card, idx) => {
                            const meta = getCardMetadata(card.id);
                            const isSelected = selectedCard === card;
                            const isCasting = castingCard === card;
                            const isReactive = gameState?.turnStateMachine?.currentPhase === 'INTERRUPT_WINDOW' &&
                                (card.id.includes('magic') || card.id.includes('shield') || card.id.includes('pulse'));

                            return (
                                <GameCard
                                    key={`${card.id}_${idx}`}
                                    card={card}
                                    index={idx}
                                    metadata={meta}
                                    isSelected={isSelected}
                                    isCasting={isCasting}
                                    isReactive={isReactive}
                                    onSelect={setSelectedCard}
                                />
                            );
                        })
                    )}
                    
                    {/* Action side buttons */}
                    {isPlayerInTown && (
                        <button
                            onClick={() => setIsShopOpen(true)}
                            className="h-36 md:h-44 w-14 md:w-16 flex-shrink-0 bg-[color:var(--panel-bg)] border border-[color:var(--accent-magic)] hover:brightness-125 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all text-[color:var(--accent-magic)] rounded-xl flex items-center justify-center font-mono text-[10px] font-bold [writing-mode:vertical-lr] uppercase tracking-widest cursor-pointer"
                        >
                            ◈ SHOP
                        </button>
                    )}

                    <button
                        onClick={onToggleStealth}
                        className={`h-36 md:h-44 w-14 md:w-16 flex-shrink-0 border transition-all rounded-xl flex items-center justify-center font-mono text-[10px] font-bold [writing-mode:vertical-lr] uppercase tracking-widest cursor-pointer ${
                            isStealthed
                                ? 'bg-[color:var(--panel-border)] border-[color:var(--accent-magic)] text-[color:var(--accent-magic)] shadow-[0_0_15px_rgba(0,229,255,0.45)] font-extrabold'
                                : 'bg-slate-950/40 border-slate-700/60 text-slate-400 hover:bg-slate-900/60 hover:text-slate-300'
                        }`}
                    >
                        {isStealthed ? 'STEALTH ON' : 'STEALTH'}
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

