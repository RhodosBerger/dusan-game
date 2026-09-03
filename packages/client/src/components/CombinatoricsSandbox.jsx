import React, { useState, useMemo } from 'react';
import { 
    CRYSTAL_CARDS_BASE, 
    TOXIC_CARDS_BASE, 
    DRUID_CARDS_BASE, 
    VOID_CARDS_BASE,
    RuleOfThreeSolver,
    CombinatoricProbabilityEngine
} from '../../../shared/src/index';

// Preklad mien a popisov vybraných kľúčových kariet pre pekné zobrazenie
const CARD_LABELS = {
    voltage_surge: { name: "Voltage Surge (Napätie)", hero: "crystal", desc: "Pridá vysoké napätie (V=5, R=1)" },
    charge: { name: "Charge (Náboj)", hero: "crystal", desc: "Zvýši prúd a prinesie energiu (V=3, R=2)" },
    shield: { name: "Ice Shield (Štít)", hero: "crystal", desc: "Zvýši odpor a brnenie (V=1, R=4)" },
    grow: { name: "Grow (Rast)", hero: "druid", desc: "Rozšíri korene a zvýši biologickú silu (V=2, R=3)" },
    nature: { name: "Nature Wrath (Hnev Prírody)", hero: "druid", desc: "Uvoľní prírodnú energiu (V=4, R=2)" },
    voidBolt: { name: "Void Bolt (Výboj Prázdnoty)", hero: "void", desc: "Využíva temnú energiu a zvyšuje entropiu (V=4, R=1)" },
    entropyShield: { name: "Entropy Shield (Entropický Štít)", hero: "void", desc: "Odkloní útoky pomocou chaosu (V=2, R=3)" },
    snowball: { name: "Snowball (Snehová Guľa)", hero: "crystal", desc: "Spomalí cieľ a udelí základný zásah (V=4, R=1)" },
    iceMeteor: { name: "Ice Meteor (Ľadový Meteor)", hero: "crystal", desc: "Silný plošný úder a mrazivé poškodenie (V=5, R=2)" },
    snakeAttack: { name: "Snake Attack (Hadí Útok)", hero: "toxic", desc: "Kusnutie s jedovatou penetráciou (V=4.5, R=1.5)" },
    snakeBomb: { name: "Snake Bomb (Hadia Bomba)", hero: "toxic", desc: "Vyloží pascu so sémantickou eróziou (V=3, R=3)" },
    voidErosion: { name: "Void Erosion (Erózia Prázdnoty)", hero: "void", desc: "Zahltí oblasť a zvýši entropiu (V=6, R=1)" },
    voidGate: { name: "Void Gate (Brána Prázdnoty)", hero: "void", desc: "Umožní teleportáciu cez sieť (V=2, R=2)" }
};

// Všetky simulované karty dostupné v sandboxe
const SANDBOX_CARDS = [
    { id: 'voltage_surge', name: 'Voltage Surge', heroId: 'crystal', v: 5.0, r: 1.0 },
    { id: 'charge', name: 'Charge', heroId: 'crystal', v: 3.0, r: 2.0 },
    { id: 'shield', name: 'Ice Shield', heroId: 'crystal', v: 1.0, r: 4.0 },
    { id: 'grow', name: 'Grow', heroId: 'druid', v: 2.0, r: 3.0 },
    { id: 'nature', name: 'Nature Wrath', heroId: 'druid', v: 4.0, r: 2.0 },
    { id: 'voidBolt', name: 'Void Bolt', heroId: 'void', v: 4.0, r: 1.0 },
    { id: 'entropyShield', name: 'Entropy Shield', heroId: 'void', v: 2.0, r: 3.0 },
    { id: 'snowball', name: 'Snowball', heroId: 'crystal', v: 4.0, r: 1.0 },
    { id: 'iceMeteor', name: 'Ice Meteor', heroId: 'crystal', v: 5.0, r: 2.0 },
    { id: 'snakeAttack', name: 'Snake Attack', heroId: 'toxic', v: 4.5, r: 1.5 },
    { id: 'snakeBomb', name: 'Snake Bomb', heroId: 'toxic', v: 3.0, r: 3.0 },
    { id: 'voidErosion', name: 'Void Erosion', heroId: 'void', v: 6.0, r: 1.0 },
    { id: 'voidGate', name: 'Void Gate', heroId: 'void', v: 2.0, r: 2.0 }
];

// Pevne definované biómy a ich fyzikálne modifikátory
const BIOMES = [
    { name: "Lush Forest (Les)", value: "LUSH_FOREST", hazard: 0.3, friction: 0.5, color: "#22c55e" },
    { name: "Toxic Swamp (Močiar)", value: "TOXIC_SWAMP", hazard: 0.8, friction: 0.9, color: "#a855f7" },
    { name: "Desert Heat (Púšť)", value: "DESERT", hazard: 0.6, friction: 0.2, color: "#eab308" },
    { name: "Glacier Ice (Ľadovec)", value: "GLACIER", hazard: 0.4, friction: 0.7, color: "#3b82f6" },
    { name: "Barrens (Prázdnota)", value: "BARRENS", hazard: 0.5, friction: 0.4, color: "#f97316" }
];

export default function CombinatoricsSandbox({ onClose }) {
    const [selectedCards, setSelectedCards] = useState([]);
    const [heroLevel, setHeroLevel] = useState(3);
    const [arenaEntropy, setArenaEntropy] = useState(0.4);
    const [selectedBiome, setSelectedBiome] = useState(BIOMES[0]);

    // Pridanie karty do slotov komba (max 3)
    const addCardToCombo = (card) => {
        if (selectedCards.length < 3) {
            setSelectedCards([...selectedCards, card]);
        }
    };

    // Odobratie karty z komba
    const removeCardFromCombo = (index) => {
        const copy = [...selectedCards];
        copy.splice(index, 1);
        setSelectedCards(copy);
    };

    // Detekcia kombinácií na základe vybraných kariet
    const detectedCombo = useMemo(() => {
        if (selectedCards.length < 2) return null;
        
        const ids = selectedCards.map(c => c.id).sort();
        
        if (ids.includes('charge') && ids.includes('voltage_surge')) {
            return {
                name: 'Aetheric Current Burst (Elektrický Výboj)',
                basePower: 15,
                effects: 'Extra +4 damage, +12.0 Energy'
            };
        }
        if (ids.includes('grow') && ids.includes('shield')) {
            return {
                name: 'Earthen Wall Shield (Kamenná Hradba)',
                basePower: 10,
                effects: 'Extra +5 brnenia, vyliečenie o 3 HP'
            };
        }
        if (ids.includes('nature') && ids.includes('shield')) {
            return {
                name: 'Glacial Drift Freeze (Ľadový Presun)',
                basePower: 12,
                effects: 'Znehybnenie cieľa (Root), +2 damage'
            };
        }
        if (ids.includes('nature') && ids.includes('voltage_surge')) {
            return {
                name: 'Pyroclastic Rift (Ohnivá Trhlina)',
                basePower: 18,
                effects: 'Prepätie: +6 damage, popálenie zeme'
            };
        }
        if (ids.includes('snowball') && ids.includes('iceMeteor')) {
            return {
                name: 'Blizzard Avalanche (Snehová Lavína)',
                basePower: 22,
                effects: 'Mrazivé spomalenie (Slow) pre celú zónu, +5 damage'
            };
        }
        if (ids.includes('snakeAttack') && ids.includes('snakeBomb')) {
            return {
                name: 'Viper\'s Kiss Detonation (Výbuch Zmije)',
                basePower: 20,
                effects: 'Odstránenie bojových útokov cieľa (Disarmed), +6 damage'
            };
        }
        if (ids.includes('voidBolt') && ids.includes('voidErosion')) {
            return {
                name: 'Void Singularity Overload (Preťaženie Singularity)',
                basePower: 25,
                effects: 'Nestabilita systému (Entropia +15%), +8 damage'
            };
        }
        if (ids.includes('entropyShield') && ids.includes('voidGate')) {
            return {
                name: 'Phase Rift Escape (Fázový Únik)',
                basePower: 14,
                effects: 'Trvalé brnenie +3, rýchly únik na susedný hex'
            };
        }

        return null;
    }, [selectedCards]);

    // Fyzikálne prepočty Ohmovho zákona pre kombo
    const physicsCalculation = useMemo(() => {
        if (selectedCards.length === 0) return null;

        // Sčítanie hodnôt z kariet
        const vBase = selectedCards.reduce((acc, c) => acc + c.v, 0);
        const rBase = selectedCards.reduce((acc, c) => acc + c.r, 0);

        // Vplyv biómu na efektívnu fyziku
        const vEffective = vBase + selectedBiome.hazard * 1.5;
        const rEffective = rBase + selectedBiome.friction * 2.0;
        const iEffective = vEffective / rEffective;
        const powerEffective = vEffective * iEffective;

        // Vplyv levelu hrdinu (multiplikátor poškodenia +10% za level)
        const levelMultiplier = 1 + (heroLevel - 1) * 0.1;
        const rawDamage = powerEffective * 0.4 * levelMultiplier;

        // Combinatoric probability engine combo scaling
        const damageReductionFactor = CombinatoricProbabilityEngine.calculateComboDamageFactor(2, selectedCards.length);
        const finalDamage = Math.round(rawDamage * damageReductionFactor);

        return {
            vBase,
            rBase,
            vEffective,
            rEffective,
            iEffective,
            powerEffective,
            levelMultiplier,
            finalDamage,
            damageReductionFactor
        };
    }, [selectedCards, selectedBiome, heroLevel]);

    // Výpočet šance na vzácny Loot Drop
    const lootDropChance = useMemo(() => {
        const prob = CombinatoricProbabilityEngine.calculateLootDropProbability(
            arenaEntropy,
            0.5, // luck
            selectedBiome.hazard // difficulty based on biome hazard
        );
        return (prob * 100).toFixed(1);
    }, [arenaEntropy, selectedBiome]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 text-slate-100 font-sans">
            <div className="relative w-full max-w-4xl bg-slate-900/90 border border-cyan-500/30 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 bg-slate-950/80 border-b border-cyan-500/20">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🧪</span>
                        <h2 className="text-lg font-bold font-mono tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                            COMBINATORICS & EXPERIENCE SANDBOX
                        </h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors cursor-pointer text-sm font-mono border border-slate-800 hover:border-slate-500 px-3 py-1 rounded"
                    >
                        [Zatvoriť ESC]
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Left Column: Builders & Selectors */}
                    <div className="space-y-6">
                        
                        {/* Biome and Parameter Selectors */}
                        <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-lg space-y-4">
                            <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
                                🕹️ Vstupné Parametre Gameplayu
                            </h3>
                            
                            {/* Level Slider */}
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-400">Skúsenostný Level Hrdinu:</span>
                                    <span className="text-amber-400 font-mono font-bold">LVL {heroLevel} (+{( (heroLevel - 1) * 10).toFixed(0)}% sila)</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="10" 
                                    value={heroLevel}
                                    onChange={(e) => setHeroLevel(Number(e.target.value))}
                                    className="w-full accent-amber-500 cursor-pointer"
                                />
                            </div>

                            {/* Entropy Slider */}
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-400">Globálna Entropia Arény:</span>
                                    <span className="text-purple-400 font-mono font-bold">{(arenaEntropy * 100).toFixed(0)}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="1" 
                                    step="0.05"
                                    value={arenaEntropy}
                                    onChange={(e) => setArenaEntropy(Number(e.target.value))}
                                    className="w-full accent-purple-500 cursor-pointer"
                                />
                            </div>

                            {/* Biome Selector */}
                            <div>
                                <span className="text-xs text-slate-400 block mb-1">Aktívny Bióm Arény:</span>
                                <div className="grid grid-cols-3 gap-2">
                                    {BIOMES.map((b) => (
                                        <button
                                            key={b.value}
                                            onClick={() => setSelectedBiome(b)}
                                            style={{ borderColor: selectedBiome.value === b.value ? b.color : 'transparent' }}
                                            className={`text-[10px] font-mono py-1.5 px-2 bg-slate-900 border rounded cursor-pointer hover:bg-slate-800 text-center transition-all ${
                                                selectedBiome.value === b.value ? 'bg-slate-800 text-white' : 'text-slate-400 border-slate-800'
                                            }`}
                                        >
                                            {b.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Card Picker */}
                        <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-lg">
                            <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3">
                                🃏 Výber Hracích Kariet
                            </h3>
                            <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                                {SANDBOX_CARDS.map((card) => {
                                    const label = CARD_LABELS[card.id];
                                    return (
                                        <button
                                            key={card.id}
                                            onClick={() => addCardToCombo(card)}
                                            disabled={selectedCards.length >= 3}
                                            className="p-2 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded text-left transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                                        >
                                            <div className="text-[11px] font-bold text-slate-200 group-hover:text-cyan-300">
                                                {label?.name || card.name}
                                            </div>
                                            <div className="text-[8px] text-slate-500 font-mono mt-0.5">
                                                V={card.v} | R={card.r} | Frakcia: {card.heroId.toUpperCase()}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Active Combo & Live Math Engine */}
                    <div className="space-y-6 flex flex-col justify-between">
                        
                        {/* Active Slots */}
                        <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-lg">
                            <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3">
                                🧪 Vybrané Combo Slot (Zoradené)
                            </h3>
                            
                            <div className="flex gap-2 min-h-[80px] bg-slate-950/80 p-2.5 rounded border border-slate-900 items-center justify-center">
                                {selectedCards.length === 0 ? (
                                    <span className="text-xs text-slate-600 font-mono">Pridajte kliknutím 1 až 3 karty na vytvorenie komba</span>
                                ) : (
                                    selectedCards.map((card, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => removeCardFromCombo(idx)}
                                            className="relative flex-1 p-2 bg-slate-900 border border-cyan-500/20 hover:border-red-500/40 rounded text-center cursor-pointer transition-all hover:scale-95"
                                            title="Kliknutím odstráňte z komba"
                                        >
                                            <div className="text-[9px] font-bold text-slate-300 truncate">
                                                {CARD_LABELS[card.id]?.name || card.name}
                                            </div>
                                            <div className="text-[7px] text-cyan-400 font-mono mt-0.5">
                                                V={card.v} | R={card.r}
                                            </div>
                                            <div className="absolute top-0 right-0 bg-red-950/80 text-[6px] text-red-400 px-1 rounded-bl">x</div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Detected Combo Announcement */}
                            {detectedCombo ? (
                                <div className="mt-3 p-2 bg-purple-950/50 border border-purple-500/30 rounded flex flex-col">
                                    <span className="text-[9px] font-mono text-purple-400 font-bold uppercase tracking-wide">
                                        ✨ Detegovaná Kombinácia z DB:
                                    </span>
                                    <span className="text-xs font-bold text-purple-200 mt-0.5">
                                        {detectedCombo.name} (Základný Výkon: {detectedCombo.basePower} W)
                                    </span>
                                    <span className="text-[10px] text-slate-400 mt-0.5">
                                        {detectedCombo.effects}
                                    </span>
                                </div>
                            ) : selectedCards.length >= 2 ? (
                                <div className="mt-3 p-2 bg-slate-900/60 border border-slate-800 rounded text-center">
                                    <span className="text-[9px] font-mono text-slate-500">
                                        Bez šablóny v DB (Využíva sa len čistý Ohmov fyzikálny prepočet)
                                    </span>
                                </div>
                            ) : null}
                        </div>

                        {/* Live Physics Engine Readouts */}
                        <div className="bg-slate-950/50 p-4 border border-cyan-500/20 rounded-lg flex-1 mt-4 space-y-4">
                            <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
                                📊 Výpočty Matematického Enginu
                            </h3>

                            {physicsCalculation ? (
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    
                                    {/* Column 1: Ohm Inputs */}
                                    <div className="space-y-1.5 font-mono text-[11px]">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Základné V:</span>
                                            <span className="text-slate-300">{physicsCalculation.vBase.toFixed(1)} V</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Základný R:</span>
                                            <span className="text-slate-300">{physicsCalculation.rBase.toFixed(1)} Ω</span>
                                        </div>
                                        <div className="flex justify-between text-cyan-400/90 font-bold">
                                            <span>Efektívne V:</span>
                                            <span>{physicsCalculation.vEffective.toFixed(2)} V</span>
                                        </div>
                                        <div className="flex justify-between text-cyan-400/90 font-bold">
                                            <span>Efektívny R:</span>
                                            <span>{physicsCalculation.rEffective.toFixed(2)} Ω</span>
                                        </div>
                                        <div className="border-t border-slate-800 my-1"></div>
                                        <div className="flex justify-between text-yellow-400 font-semibold">
                                            <span>Prúd (I = V/R):</span>
                                            <span>{physicsCalculation.iEffective.toFixed(2)} A</span>
                                        </div>
                                        <div className="flex justify-between text-yellow-400 font-bold">
                                            <span>Výkon (P = V*I):</span>
                                            <span>{physicsCalculation.powerEffective.toFixed(2)} W</span>
                                        </div>
                                    </div>

                                    {/* Column 2: Final Resolution */}
                                    <div className="space-y-2 flex flex-col justify-center items-center bg-slate-950/80 p-3 rounded border border-slate-800">
                                        <span className="text-[9px] font-mono text-slate-500 uppercase">Výsledné Poškodenie</span>
                                        <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 animate-pulse">
                                            {physicsCalculation.finalDamage} DMG
                                        </span>
                                        <div className="text-[8px] font-mono text-slate-400 text-center leading-relaxed">
                                            Koeficient útoku: {(physicsCalculation.damageReductionFactor * 100).toFixed(0)}%<br/>
                                            Level modifikátor: {physicsCalculation.levelMultiplier.toFixed(1)}x
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-xs text-slate-600 font-mono">
                                    Vyberte aspoň jednu kartu pre zobrazenie prepočtov
                                </div>
                            )}

                            {/* Sigmoid drop chances */}
                            <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-xs">
                                <div className="flex flex-col">
                                    <span className="font-mono text-slate-400 text-[10px]">Sigmoidný Loot Drop model:</span>
                                    <span className="text-[8px] text-slate-600 font-mono">P = 1 / (1 + e^(-(E*1.5 + L - D)))</span>
                                </div>
                                <div className="px-3 py-1 bg-purple-950/40 border border-purple-500/20 rounded font-mono font-bold text-purple-300">
                                    {lootDropChance}% šanca
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-500">
                    <span>Model: Ohm's Law physics + Combinatoric Probability scaling</span>
                    <button 
                        onClick={() => setSelectedCards([])}
                        className="px-2 py-1 bg-red-950/40 hover:bg-red-900 border border-red-500/20 text-red-400 rounded cursor-pointer transition-colors"
                    >
                        Vyčistiť Combo Slot
                    </button>
                </div>

            </div>
        </div>
    );
}
