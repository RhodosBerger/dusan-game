import React, { useState } from 'react';

export default function MetacognitiveArchitectureHub({ onClose, gameState }) {
    const [activeTab, setActiveTab] = useState('map');
    const [selectedComponent, setSelectedComponent] = useState('lifo');

    // Vibecode prompt generator states
    const [vibeAction, setVibeAction] = useState('modify');
    const [vibeGoal, setVibeGoal] = useState('adjust_values');
    const [generatedPrompt, setGeneratedPrompt] = useState('');

    const componentsData = {
        lifo: {
            title: "Bojový LIFO Kondenzátor (Reaction LIFO Capacitor)",
            path: "packages/shared/src/core/SovereignLIFOArbiter.ts",
            analogy: "Predstavuje elektrický kondenzátor bojových akcií. Akcie sa vrstvia na seba (Stack) a vyhodnocujú sa spätne (zhora nadol). Posledná reakcia (napr. únikový úskok) vybije/anuluje útok priamo pod ňou.",
            dependency: "Používaný v serverovom TurnStateMachine a klientskom LIFO Reaction Stack Builderi pri vyhodnocovaní reakčného okna.",
            terminology: "LIFO Stack, Dodge Mitigation, Local Wound Capacities, Disarmed Status, Slowed Status.",
            apiRef: "SovereignLIFOArbiter.resolveStack(actionStack, healthA, healthB)",
            glowColor: "rgba(34, 211, 238, 0.4)",
            borderClass: "border-cyan-500/40"
        },
        ohmic: {
            title: "Odporový Sieťový Obvod (Ohmic Grid Circuit)",
            path: "packages/shared/src/core/OhmGridEvaluator.ts & SovereignEngine.ts",
            analogy: "Bojové akcie prenášajú prúd. Napätie (Voltage) reprezentuje útočnú silu karty a Odpor (Resistance) predstavuje obranné vlastnosti cieľa a terénu. Prúd (Current) udelí poškodenie a nízky prúd vyvolá prebytočné teplo (System Heat), ktoré hromadí systémovú energiu.",
            dependency: "Prepojený so systémom energetického kolapsu a výpočtom poškodenia cez CombinatoricProbabilityEngine.",
            terminology: "Ohmic Flow, Voltage Load, Resistance Threshold, System Heat Accumulation, Thermal Purge.",
            apiRef: "OhmGridEvaluator.evaluateCurrent(voltage, resistance)",
            glowColor: "rgba(239, 68, 68, 0.4)",
            borderClass: "border-red-500/40"
        },
        dopamine: {
            title: "Dopamínový Vychyľovač Šťastia (Dopamine Luck Shifter)",
            path: "packages/shared/src/core/AethericDiceEngine.ts",
            analogy: "Skryté loaded dice, ktoré zvyšujú šance ľudského hráča v súboji o 65%. Vychyľuje výsledok porovnávania (Contested Roll) v prospech hráča a pri nízkom HP aktivuje úhybné magnetické pole (Evasive Shield).",
            dependency: "Wired priamo do SovereignEngine.ts pred vyhodnocovaním poškodenia z kartových akcií.",
            terminology: "DDA Loaded Dice, Evasive Shield, Contested Damage Skew, Target Zone Probability, Luck Shift.",
            apiRef: "AethericDiceEngine.calculateContestedDamage(rollA, rollB, baseDmg, condition, attackerType, defenderType)",
            glowColor: "rgba(168, 85, 247, 0.4)",
            borderClass: "border-purple-500/40"
        },
        mazak: {
            title: "Priestorová Matrica Váh (Spatial Weight Matrix - Dusans Mazak Model)",
            path: "packages/server/src/models/DynamicDifficultyMapGenerator.ts",
            analogy: "Gravitačná mapa mriežky, kde stred má najvyššiu váhu (1.0 - čierna diera s vysokým rizikom), rohy strednú (0.8 - taktické výspy) a hrany najnižšiu (0.5). Podľa týchto váh generátor rozmiestňuje NPC jednotky, prekážky a predmety.",
            dependency: "Určuje walkability, šance na spawn súprav na opravu a celkovú obtiažnosť biómov.",
            terminology: "Dusans customized Mazak weight, Manhattan distance scaling, Walkability chance, NPC Spawn density.",
            apiRef: "DynamicDifficultyMapGenerator.getDusansCustomizedMazakWeight(metaIndex, subIndex)",
            glowColor: "rgba(245, 158, 11, 0.4)",
            borderClass: "border-yellow-500/40"
        },
        aetherbridge: {
            title: "Aetherické Premostenie (Aetheric Go-WASM Bridge)",
            path: "packages/shared/src/core/GoCoreMediator.ts & UniversalWasmBridge.ts",
            analogy: "Premostenie dvoch svetov. Rýchle a výpočtovo náročné algoritmy prebiehajú v Go (WASM v prehliadači alebo HTTP na serveri). Ak je premostenie odpojené, kód plynule prepne na lokálne TypeScript fallbacky.",
            dependency: "Zabezpečuje synchronizovanú fyziku, vyhodnocovanie ciest (A*) a optimalizáciu instanced props.",
            terminology: "GoCoreMediator, Wasm Fallback Tunnel, syncPost Curl, batch initialization.",
            apiRef: "GoCoreMediator.solvePhysicsCost(baseCost, metaId, hexId, multiplier)",
            glowColor: "rgba(16, 185, 129, 0.4)",
            borderClass: "border-emerald-500/40"
        }
    };

    const handleGeneratePrompt = () => {
        const comp = componentsData[selectedComponent];
        
        let actionText = "";
        let goalText = "";

        if (vibeAction === 'modify') {
            actionText = "Uprav a rozšir funkcionalitu v";
        } else if (vibeAction === 'debug') {
            actionText = "Analyzuj a vyrieš potenciálne chyby alebo zlyhania v";
        } else {
            actionText = "Napíš sadu unit testov pre";
        }

        if (vibeGoal === 'adjust_values') {
            goalText = "Uprav konštanty, limity koeficientov a matematické vzorce pre lepšiu hrateľnosť a vybalansovanie hodnôt.";
        } else if (vibeGoal === 'add_state') {
            goalText = "Pridaj novú vlastnosť alebo stavový efekt, ktorý sa uloží do profilu hráča a prenesie sa do state machine.";
        } else {
            goalText = "Optimalizuj výpočty a zníž zložitosť pre potlačenie TDP preťaženia GPU/CPU podľa pravidiel.";
        }

        const prompt = `Ahoj Antigravity, pozri sa prosím na komponent: **${comp.title}** (umiestnený v [${comp.path.split('/').pop()}](${comp.path})).
${actionText} tomto súbore.
Mojím cieľom je: ${goalText}

Zameraj sa na tieto sémantické pojmy: **${comp.terminology}**.
Uisti sa, že zmeny sú plne integrované a neporušujú testovaciu sadu testEngine.ts.`;

        setGeneratedPrompt(prompt);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedPrompt);
        alert("Prompt bol skopírovaný do schránky! Môžeš ho poslať AI asistentovi.");
    };

    return (
        <div className="fixed top-20 left-5 w-[460px] h-[calc(100vh-120px)] bg-[#08090e]/95 border border-cyan-500/30 rounded-2xl p-6 box-border text-[#ececf1] z-50 flex flex-col font-mono backdrop-blur-lg shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4 flex-shrink-0">
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-cyan-400 tracking-wider">🧠 METAKOGNITÍVNY RÁMEC</span>
                    <span className="text-[9px] text-slate-500 uppercase mt-0.5">Codebase Analogy & Prompting Interface</span>
                </div>
                <button 
                    onClick={onClose}
                    className="background-none border-none text-red-500 hover:text-red-400 font-bold text-sm cursor-pointer transition-colors"
                >
                    ✕
                </button>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginBottom: '16px', flexShrink: 0 }}>
                <button 
                    onClick={() => setActiveTab('map')}
                    style={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        padding: '8px 0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: '1px solid ' + (activeTab === 'map' ? 'rgba(45, 211, 241, 0.5)' : 'rgba(255, 255, 255, 0.05)'),
                        background: activeTab === 'map' ? 'rgba(8, 145, 178, 0.2)' : 'rgba(8, 10, 15, 0.5)',
                        color: activeTab === 'map' ? '#67e8f9' : '#64748b'
                    }}
                >
                    🗺️ MAPA KÓDU
                </button>
                <button 
                    onClick={() => setActiveTab('analogies')}
                    style={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        padding: '8px 0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: '1px solid ' + (activeTab === 'analogies' ? 'rgba(45, 211, 241, 0.5)' : 'rgba(255, 255, 255, 0.05)'),
                        background: activeTab === 'analogies' ? 'rgba(8, 145, 178, 0.2)' : 'rgba(8, 10, 15, 0.5)',
                        color: activeTab === 'analogies' ? '#67e8f9' : '#64748b'
                    }}
                >
                    ⚡ ANALÓGIE
                </button>
                <button 
                    onClick={() => setActiveTab('vibecode')}
                    style={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        padding: '8px 0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: '1px solid ' + (activeTab === 'vibecode' ? 'rgba(45, 211, 241, 0.5)' : 'rgba(255, 255, 255, 0.05)'),
                        background: activeTab === 'vibecode' ? 'rgba(8, 145, 178, 0.2)' : 'rgba(8, 10, 15, 0.5)',
                        color: activeTab === 'vibecode' ? '#67e8f9' : '#64748b'
                    }}
                >
                    🔮 VIBECODE
                </button>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: '4px', display: 'flex', flexDirection: 'column' }}>
                {activeTab === 'map' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                        <span style={{ fontSize: '10px', color: '#94a3b8', lineHeight: '1.4' }}>
                            Vizualizácia prepojenia kontajnerov a toku údajov v **Sovereign Engine V2**:
                        </span>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(2, 6, 23, 0.7)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            {/* Visual Nodes */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '9px' }}>
                                <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '4px', textAlign: 'center', position: 'relative' }}>
                                    <div style={{ fontWeight: 'bold', color: '#34d399' }}>⚡ AETHERIC CORE (Go Core / WASM)</div>
                                    <span style={{ fontSize: '8px', color: '#475569' }}>Physics & A* Pathfinder</span>
                                    <div style={{ position: 'absolute', left: '50%', bottom: '-12px', transform: 'translateX(-50%)', color: '#334155', fontWeight: 'bold' }}>↓</div>
                                </div>
                                <div style={{ height: '8px' }}></div>
                                <div style={{ padding: '8px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '4px', textAlign: 'center', position: 'relative' }}>
                                    <div style={{ fontWeight: 'bold', color: '#c084fc' }}>🧠 CENTRAL SYSTEM (Server CNS)</div>
                                    <span style={{ fontSize: '8px', color: '#475569' }}>SovereignEngine & State Machine</span>
                                    <div style={{ position: 'absolute', left: '50%', bottom: '-12px', transform: 'translateX(-50%)', color: '#334155', fontWeight: 'bold' }}>↓</div>
                                </div>
                                <div style={{ height: '8px' }}></div>
                                <div style={{ padding: '8px', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '4px', textAlign: 'center' }}>
                                    <div style={{ fontWeight: 'bold', color: '#22d3ee' }}>💻 COMPOSITING SHELL (Client)</div>
                                    <span style={{ fontSize: '8px', color: '#475569' }}>Three.js WebGL & HUD Overlays</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(2, 6, 23, 0.4)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '10px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                            <span style={{ fontWeight: 'bold', color: '#f1f5f9' }}>🔍 Metakognitívny tip:</span>
                            <span style={{ lineHeight: '1.4' }}>
                                Každá akcia v klientskom rozhraní (Compositing Shell) preteká cez server (CNS) a overuje sa fyzikálnymi a štatistickými vzorcami (Aetheric Core). Ak chceš zmeniť pravidlá, upravuj predovšetkým CNS a shared knižnice.
                            </span>
                        </div>
                    </div>
                )}

                {activeTab === 'analogies' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                            <label style={{ fontSize: '10px', color: '#94a3b8' }}>VYBERTE ANALÓGIU KÓDU:</label>
                            <select 
                                value={selectedComponent}
                                onChange={(e) => setSelectedComponent(e.target.value)}
                                style={{ background: '#020617', color: '#67e8f9', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px', fontSize: '12px', outline: 'none' }}
                            >
                                <option value="lifo">Bojový LIFO Kondenzátor (Arbiter)</option>
                                <option value="ohmic">Odporový Sieťový Obvod (Ohmic Grid)</option>
                                <option value="dopamine">Dopamínový Vychyľovač Šťastia (Loaded Dice)</option>
                                <option value="mazak">Priestorová Matrica Váh (Mazak Model)</option>
                                <option value="aetherbridge">Aetherické Premostenie (Go-WASM)</option>
                            </select>
                        </div>

                        {/* Analogy Details Box */}
                        <div 
                            style={{
                                padding: '16px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                background: 'rgba(2, 6, 23, 0.6)',
                                boxShadow: `0 0 15px ${componentsData[selectedComponent].glowColor}`,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#e2e8f0', textTransform: 'uppercase' }}>{componentsData[selectedComponent].title}</span>
                                <span style={{ fontSize: '8px', color: '#64748b', marginTop: '4px', selectAll: 'all' }}>{componentsData[selectedComponent].path}</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '9px', color: '#eab308', fontWeight: 'bold' }}>Fyzikálna analógia:</span>
                                <p style={{ fontSize: '10px', color: '#cbd5e1', lineHeight: '1.4', margin: 0 }}>{componentsData[selectedComponent].analogy}</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '9px', color: '#22d3ee', fontWeight: 'bold' }}>Integrácia & Závislosť:</span>
                                <p style={{ fontSize: '10px', color: '#cbd5e1', lineHeight: '1.4', margin: 0 }}>{componentsData[selectedComponent].dependency}</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                <span style={{ fontSize: '9px', color: '#64748b' }}>APIVolanie / Metóda:</span>
                                <code style={{ fontSize: '8px', color: '#67e8f9', background: '#020617', padding: '6px', borderRadius: '4px', overflowX: 'auto', display: 'block', whiteSpace: 'pre', fontFamily: 'monospace' }}>
                                    {componentsData[selectedComponent].apiRef}
                                </code>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'vibecode' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                            Nastavte ciele a vygenerujte formálny prompt pre promptovanie AI:
                        </span>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '9px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ color: '#94a3b8', textTransform: 'uppercase' }}>1. Typ Akcie</label>
                                <select 
                                    value={vibeAction} 
                                    onChange={(e) => setVibeAction(e.target.value)}
                                    style={{ background: '#020617', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.05)', padding: '8px', borderRadius: '6px', outline: 'none' }}
                                >
                                    <option value="modify">Modifikácia / Rozšírenie</option>
                                    <option value="debug">Ladenie / Hľadanie chýb</option>
                                    <option value="test">Tvorba testov</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ color: '#94a3b8', textTransform: 'uppercase' }}>2. Cieľová Oblasť</label>
                                <select 
                                    value={vibeGoal} 
                                    onChange={(e) => setVibeGoal(e.target.value)}
                                    style={{ background: '#020617', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.05)', padding: '8px', borderRadius: '6px', outline: 'none' }}
                                >
                                    <option value="adjust_values">Vybalansovanie hodnôt</option>
                                    <option value="add_state">Pridanie nového stavu</option>
                                    <option value="optimize">TDP & Optimalizácia výkonu</option>
                                </select>
                            </div>
                        </div>

                        <button 
                            onClick={handleGeneratePrompt}
                            style={{
                                background: '#0891b2',
                                color: '#000',
                                fontWeight: 'bold',
                                fontSize: '12px',
                                padding: '8px 0',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                border: 'none',
                                transition: 'all 0.2s ease',
                                marginTop: '4px'
                            }}
                        >
                            🔮 Generovať Vibecode Prompt
                        </button>

                        {generatedPrompt && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minHeight: 0, marginTop: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase' }}>Vygenerovaný prompt:</span>
                                    <button 
                                        onClick={copyToClipboard}
                                        style={{ background: 'none', border: 'none', color: '#22d3ee', fontSize: '9px', cursor: 'pointer' }}
                                    >
                                        [Kopírovať]
                                    </button>
                                </div>
                                <textarea 
                                    readOnly 
                                    value={generatedPrompt}
                                    style={{
                                        width: '100%',
                                        flex: 1,
                                        background: '#020617',
                                        color: 'rgba(103, 232, 249, 0.9)',
                                        fontSize: '9px',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        fontFamily: 'monospace',
                                        resize: 'none',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Phase and Turn Overlay indicators */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: '#64748b', fontFamily: 'monospace', flexShrink: 0 }}>
                <span>Phase: <strong style={{ color: '#eab308' }}>{gameState?.turnStateMachine?.currentPhase || 'PREPARATION'}</strong></span>
                <span>Active: <strong style={{ color: '#c084fc' }}>{gameState?.turnStateMachine?.activePlayerId ? (gameState.turnStateMachine.activePlayerId === 'thread_king_ai' ? 'Crystal King' : 'Toxic Hacker') : 'None'}</strong></span>
            </div>
        </div>
    );
}
