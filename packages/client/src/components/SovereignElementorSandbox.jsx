import React, { useState, useMemo } from 'react';
import { SovereignElementorRegistry, SovereignRealityMatrix } from '../../../shared/src/index';

export default function SovereignElementorSandbox() {
    // Load catalog from shared typescript registry
    const catalog = useMemo(() => SovereignElementorRegistry.getCatalog(), []);

    // Initial instantiated widgets
    const [instances, setInstances] = useState([
        SovereignElementorRegistry.instantiateWidget('w_accordion_hex', '0x1A', { voltageLoad: 12 }),
        SovereignElementorRegistry.instantiateWidget('w_alert_plate', '0x2B', { hazardIndex: 0.95 }),
        SovereignElementorRegistry.instantiateWidget('w_holo_card', '0x5C')
    ]);

    const [activeAccordionId, setActiveAccordionId] = useState(null);
    const [selectedWidgetId, setSelectedWidgetId] = useState(catalog[0].id);
    const [styleFormula, setStyleFormula] = useState("hazard > 0.6 ? 'scoria-glow' : 'emerald-glow'");
    const [hexCoord, setHexCoord] = useState('0x4D');
    
    // Mutable attribute overrides for new instances
    const [customHazard, setCustomHazard] = useState(0.5);
    const [customFriction, setCustomFriction] = useState(1.0);
    const [customVoltage, setCustomVoltage] = useState(15);

    // --- Reality Matrix Simulation Inputs ---
    const [simHealthA, setSimHealthA] = useState(15);
    const [simHealthB, setSimHealthB] = useState(15);
    const [consecutiveA, setConsecutiveA] = useState(false);
    const [consecutiveB, setConsecutiveB] = useState(false);
    const [activeBiome, setActiveBiome] = useState('LUSH_FOREST');
    const [lastCardA, setLastCardA] = useState('none');
    const [lastCardB, setLastCardB] = useState('none');

    // Active status lists
    const [statusSlowA, setStatusSlowA] = useState(false);
    const [statusRootA, setStatusRootA] = useState(false);
    const [statusDisarmA, setStatusDisarmA] = useState(false);
    const [statusSilenceA, setStatusSilenceA] = useState(false);

    const [statusSlowB, setStatusSlowB] = useState(false);
    const [statusRootB, setStatusRootB] = useState(false);
    const [statusDisarmB, setStatusDisarmB] = useState(false);
    const [statusSilenceB, setStatusSilenceB] = useState(false);

    const simulatedPlayerA = useMemo(() => {
        const statuses = [];
        if (statusSlowA) statuses.push('slowed');
        if (statusRootA) statuses.push('rooted');
        if (statusDisarmA) statuses.push('disarmed');
        if (statusSilenceA) statuses.push('silenced');
        return {
            health: parseInt(simHealthA) || 0,
            armor: 1,
            isConsecutiveTurn: consecutiveA,
            activeStatuses: statuses,
            lastCardTypePlayed: lastCardA === 'none' ? undefined : lastCardA
        };
    }, [simHealthA, consecutiveA, statusSlowA, statusRootA, statusDisarmA, statusSilenceA, lastCardA]);

    const simulatedPlayerB = useMemo(() => {
        const statuses = [];
        if (statusSlowB) statuses.push('slowed');
        if (statusRootB) statuses.push('rooted');
        if (statusDisarmB) statuses.push('disarmed');
        if (statusSilenceB) statuses.push('silenced');
        return {
            health: parseInt(simHealthB) || 0,
            armor: 1,
            isConsecutiveTurn: consecutiveB,
            activeStatuses: statuses,
            lastCardTypePlayed: lastCardB === 'none' ? undefined : lastCardB
        };
    }, [simHealthB, consecutiveB, statusSlowB, statusRootB, statusDisarmB, statusSilenceB, lastCardB]);

    // Calculate projection matrices across 4 realities
    const projectedRealities = useMemo(() => {
        return SovereignRealityMatrix.projectRealities(simulatedPlayerA, simulatedPlayerB, activeBiome);
    }, [simulatedPlayerA, simulatedPlayerB, activeBiome]);

    // Layout arrangement handlers
    const handleArrangeGrid = (pattern) => {
        let updated = [...instances];
        if (pattern === 'linear') {
            updated = instances.map((inst, idx) => ({
                ...inst,
                hexCoord: `0x${(idx + 1).toString(16).toUpperCase()}0`
            }));
        } else if (pattern === 'concentric') {
            updated = instances.map((inst, idx) => ({
                ...inst,
                hexCoord: `0x0${(idx + 1).toString(16).toUpperCase()}`
            }));
        } else if (pattern === 'alternating') {
            updated = instances.map((inst, idx) => ({
                ...inst,
                hexCoord: `0x${(idx).toString(16).toUpperCase()}${(idx + 1).toString(16).toUpperCase()}`,
                attributes: {
                    ...inst.attributes,
                    hazardIndex: idx % 2 === 0 ? 0.85 : 0.20
                }
            }));
        }
        setInstances(updated);
    };

    const handleInstantiate = () => {
        try {
            const newInst = SovereignElementorRegistry.instantiateWidget(
                selectedWidgetId,
                hexCoord.trim() || '0x4D',
                {
                    hazardIndex: parseFloat(customHazard),
                    friction: parseFloat(customFriction),
                    voltageLoad: parseInt(customVoltage)
                }
            );
            setInstances(prev => [...prev, newInst]);
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteInstance = (instanceId) => {
        setInstances(prev => prev.filter(i => i.instanceId !== instanceId));
    };

    const evaluateStyleClass = (inst) => {
        try {
            const fn = new Function('hazard', 'friction', `return ${styleFormula};`);
            return fn(inst.attributes.hazardIndex, inst.attributes.friction);
        } catch (e) {
            return 'default-glow';
        }
    };

    const exportedBootstrapCSS = useMemo(() => {
        return `/* Bootstrap Game Composition Custom Stylesheet */
.game-grid-viewport {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.5rem;
}
.accordion-hex-plate {
    background: #0f172a;
    border: 2px solid #3b82f6;
    border-radius: 0.75rem;
}
`;
    }, []);

    return (
        <div className="flex flex-col gap-6 w-full h-full p-4 overflow-y-auto" style={{ fontFamily: 'monospace' }}>
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                    <h2 className="text-sm font-bold text-yellow-400 uppercase tracking-wider">🛠️ SOVEREIGN ELEMENTOR & REALITY MATRIX</h2>
                    <span className="text-[10px] text-slate-400">Simulation Projections, Rulebook Math, and Layout Canvas</span>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={() => handleArrangeGrid('linear')}
                        className="bg-blue-600 hover:bg-blue-700 text-black font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all"
                    >
                        Linear Arrangement
                    </button>
                    <button 
                        onClick={() => handleArrangeGrid('concentric')}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all"
                    >
                        Concentric Ring
                    </button>
                    <button 
                        onClick={() => handleArrangeGrid('alternating')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-black font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all"
                    >
                        Alternating Biome
                    </button>
                </div>
            </div>

            {/* Matrix realities section */}
            <div className="flex flex-col gap-4 bg-slate-950 p-4 rounded-xl border border-slate-900">
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                    <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-widest">🌐 1. Simulated realities (Parallel Timelines)</h3>
                    <div className="flex gap-4 items-center">
                        <div className="flex gap-1 items-center">
                            <label className="text-[9px] text-slate-400 uppercase">Active Biome:</label>
                            <select 
                                value={activeBiome} 
                                onChange={(e) => setActiveBiome(e.target.value)}
                                className="bg-slate-900 text-yellow-400 text-[10px] px-2 py-1 rounded border border-slate-800 focus:outline-none"
                            >
                                <option value="LUSH_FOREST">Lush Forest (+1 heal)</option>
                                <option value="TOXIC_SWAMP">Toxic Swamp (+slow)</option>
                                <option value="GLACIER">Glacier (+root)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {projectedRealities.map((r, idx) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex flex-col gap-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500/10 rounded-bl-full flex items-center justify-center">
                                <span className="text-[8px] text-blue-400 font-bold">R{idx + 1}</span>
                            </div>
                            <span className="text-xs font-bold text-cyan-400">{r.realityName}</span>
                            <span className="text-[9px] text-slate-400 leading-tight min-h-8">{r.description}</span>
                            
                            <div className="border-t border-slate-850 pt-2 flex flex-col gap-1 text-[10px]">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Player A Cost:</span>
                                    <span className="text-yellow-400 font-bold">{r.actionCostA} AP</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Player B Cost:</span>
                                    <span className="text-yellow-400 font-bold">{r.actionCostB} AP</span>
                                </div>
                                <div className="flex flex-col gap-0.5 border-t border-slate-850 mt-1 pt-1 text-[9px]">
                                    <span className="text-slate-400">Status A: {r.statusEffectA.join(', ') || 'none'}</span>
                                    <span className="text-slate-400">Status B: {r.statusEffectB.join(', ') || 'none'}</span>
                                </div>
                                <div className="flex flex-col gap-0.5 border-t border-slate-850 mt-1 pt-1 text-[9px]">
                                    <span className="text-emerald-400 font-bold">{r.biomeSynergyA}</span>
                                </div>
                                <div className={`text-[10px] font-bold mt-2 text-center py-1 rounded bg-slate-950/80 ${r.isGameOver ? 'text-red-400 border border-red-500/20' : 'text-slate-400'}`}>
                                    {r.endStateDescription}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Reality Inputs Tuning */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/40 p-4 rounded-xl border border-slate-900 mt-2">
                    {/* Player A Simulator Settings */}
                    <div className="flex flex-col gap-3">
                        <span className="text-[10px] font-bold text-cyan-400 border-l border-cyan-400 pl-2">PLAYER ALPHA STATUS</span>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-slate-400 uppercase">Health:</label>
                                <input 
                                    type="number" min="0" max="25" value={simHealthA}
                                    onChange={(e) => setSimHealthA(e.target.value)}
                                    className="bg-slate-950 text-cyan-300 text-xs px-2 py-1 rounded border border-slate-800 focus:outline-none"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-slate-400 uppercase">Last Played:</label>
                                <select 
                                    value={lastCardA} onChange={(e) => setLastCardA(e.target.value)}
                                    className="bg-slate-950 text-slate-300 text-[10px] px-2 py-1 rounded border border-slate-800"
                                >
                                    <option value="none">None</option>
                                    <option value="attack">Attack (Red)</option>
                                    <option value="spell">Spell (Blue)</option>
                                    <option value="move">Move (Yellow)</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 text-[10px] text-slate-300">
                                <input type="checkbox" checked={consecutiveA} onChange={(e) => setConsecutiveA(e.target.checked)} />
                                Consecutive Turn (Fatigue AP +50%)
                            </label>
                            <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-400">
                                <label className="flex items-center gap-1"><input type="checkbox" checked={statusSlowA} onChange={(e) => setStatusSlowA(e.target.checked)} /> Zpomalení</label>
                                <label className="flex items-center gap-1"><input type="checkbox" checked={statusRootA} onChange={(e) => setStatusRootA(e.target.checked)} /> Zakorenenie</label>
                                <label className="flex items-center gap-1"><input type="checkbox" checked={statusDisarmA} onChange={(e) => setStatusDisarmA(e.target.checked)} /> Odzbrojenie</label>
                                <label className="flex items-center gap-1"><input type="checkbox" checked={statusSilenceA} onChange={(e) => setStatusSilenceA(e.target.checked)} /> Umlčanie</label>
                            </div>
                        </div>
                    </div>

                    {/* Player B Simulator Settings */}
                    <div className="flex flex-col gap-3">
                        <span className="text-[10px] font-bold text-purple-400 border-l border-purple-400 pl-2">PLAYER BETA STATUS</span>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-slate-400 uppercase">Health:</label>
                                <input 
                                    type="number" min="0" max="25" value={simHealthB}
                                    onChange={(e) => setSimHealthB(e.target.value)}
                                    className="bg-slate-950 text-purple-300 text-xs px-2 py-1 rounded border border-slate-800 focus:outline-none"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-slate-400 uppercase">Last Played:</label>
                                <select 
                                    value={lastCardB} onChange={(e) => setLastCardB(e.target.value)}
                                    className="bg-slate-950 text-slate-300 text-[10px] px-2 py-1 rounded border border-slate-800"
                                >
                                    <option value="none">None</option>
                                    <option value="attack">Attack (Red)</option>
                                    <option value="spell">Spell (Blue)</option>
                                    <option value="move">Move (Yellow)</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 text-[10px] text-slate-300">
                                <input type="checkbox" checked={consecutiveB} onChange={(e) => setConsecutiveB(e.target.checked)} />
                                Consecutive Turn (Fatigue AP +50%)
                            </label>
                            <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-400">
                                <label className="flex items-center gap-1"><input type="checkbox" checked={statusSlowB} onChange={(e) => setStatusSlowB(e.target.checked)} /> Zpomalení</label>
                                <label className="flex items-center gap-1"><input type="checkbox" checked={statusRootB} onChange={(e) => setStatusRootB(e.target.checked)} /> Zakorenenie</label>
                                <label className="flex items-center gap-1"><input type="checkbox" checked={statusDisarmB} onChange={(e) => setStatusDisarmB(e.target.checked)} /> Odzbrojenie</label>
                                <label className="flex items-center gap-1"><input type="checkbox" checked={statusSilenceB} onChange={(e) => setStatusSilenceB(e.target.checked)} /> Umlčanie</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel: Widget Selection & Attributes Tuning */}
                <div className="flex flex-col gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-900">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-l-2 border-cyan-400 pl-2">2. Widget Selection</h3>
                    
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-400 uppercase">Target Widget Block:</label>
                        <select 
                            value={selectedWidgetId}
                            onChange={(e) => setSelectedWidgetId(e.target.value)}
                            className="bg-slate-900 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-800"
                        >
                            {catalog.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-400 uppercase">Grid Coordinate:</label>
                        <input 
                            type="text" 
                            value={hexCoord}
                            onChange={(e) => setHexCoord(e.target.value)}
                            className="bg-slate-900 text-cyan-300 text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-900 pt-3">
                        <span className="text-[10px] font-bold text-yellow-500 uppercase">Tune Attribute Parameters</span>
                        
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-[9px] text-slate-400">
                                <span>Hazard Index:</span>
                                <span>{parseFloat(customHazard).toFixed(2)}</span>
                            </div>
                            <input 
                                type="range" min="0" max="1" step="0.05" value={customHazard}
                                onChange={(e) => setCustomHazard(e.target.value)}
                                className="w-full accent-cyan-400"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-[9px] text-slate-400">
                                <span>Friction:</span>
                                <span>{parseFloat(customFriction).toFixed(2)}x</span>
                            </div>
                            <input 
                                type="range" min="0.1" max="2.5" step="0.1" value={customFriction}
                                onChange={(e) => setCustomFriction(e.target.value)}
                                className="w-full accent-emerald-500"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-[9px] text-slate-400">
                                <span>Voltage Load:</span>
                                <span>{customVoltage}W</span>
                            </div>
                            <input 
                                type="range" min="5" max="100" step="5" value={customVoltage}
                                onChange={(e) => setCustomVoltage(e.target.value)}
                                className="w-full accent-purple-500"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleInstantiate}
                        className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-xs py-2 rounded-lg transition-all"
                    >
                        + Instantiate Registry Block
                    </button>

                    <div className="border-t border-slate-900 pt-4 flex flex-col gap-2">
                        <label className="text-[9px] text-yellow-400 uppercase font-bold">Modality Formula Selector</label>
                        <textarea 
                            value={styleFormula}
                            onChange={(e) => setStyleFormula(e.target.value)}
                            className="bg-slate-900 text-yellow-200 text-[10px] p-2 rounded-lg border border-slate-800 resize-none h-16 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Center Panel: Interactive Sandbox Canvas */}
                <div className="lg:col-span-2 flex flex-col gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-900">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-l-2 border-purple-400 pl-2">3. Sandbox Modality Canvas</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {instances.map((inst) => {
                            const evaluatedClass = evaluateStyleClass(inst);
                            
                            return (
                                <div 
                                    key={inst.instanceId}
                                    className={`relative p-4 rounded-xl border border-slate-800 bg-slate-900/60 transition-all ${evaluatedClass}`}
                                    style={{
                                        boxShadow: evaluatedClass === 'scoria-glow' ? '0 0 10px rgba(239, 68, 68, 0.25)' : evaluatedClass === 'emerald-glow' ? '0 0 10px rgba(16, 185, 129, 0.25)' : 'none'
                                    }}
                                >
                                    <button 
                                        onClick={() => handleDeleteInstance(inst.instanceId)}
                                        className="absolute top-2 right-2 text-rose-500 hover:text-rose-400 text-xs"
                                    >
                                        [Delete]
                                    </button>

                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-bold text-cyan-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-cyan-500/20">
                                            {inst.hexCoord}
                                        </span>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                            {inst.name}
                                        </span>
                                    </div>

                                    {/* Render dynamic elements based on widget type */}
                                    {inst.type === 'accordion' && (
                                        <div className="flex flex-col gap-1 border border-blue-500/30 rounded-lg overflow-hidden bg-slate-950/40">
                                            <button 
                                                onClick={() => setActiveAccordionId(activeAccordionId === inst.instanceId ? null : inst.instanceId)}
                                                className="w-full text-left px-3 py-2 bg-blue-900/20 text-xs text-blue-300 font-bold hover:bg-blue-900/35 transition-all flex justify-between"
                                            >
                                                <span>Expand Hex Plate Details</span>
                                                <span>{activeAccordionId === inst.instanceId ? '▲' : '▼'}</span>
                                            </button>
                                            {activeAccordionId === inst.instanceId && (
                                                <div className="p-3 text-[10px] text-slate-300 flex flex-col gap-1 bg-slate-950/60 border-t border-blue-500/20 font-mono">
                                                    <div>Walkable: <span className="text-slate-100 font-bold">{inst.attributes.walkable ? 'YES' : 'NO'}</span></div>
                                                    <div>Hazard Index: <span className="text-red-400 font-bold">{inst.attributes.hazardIndex.toFixed(2)}</span></div>
                                                    <div>Friction Coefficient: <span className="text-green-400 font-bold">{inst.attributes.friction.toFixed(2)}x</span></div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {inst.type === 'alert' && (
                                        <div className="bg-red-950/30 border border-red-500/30 p-2.5 rounded-lg text-xs text-red-200 font-bold flex flex-col gap-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-yellow-400">⚡ ALERT HAZARD LIMIT</span>
                                                <span className="text-[10px] text-slate-400">ACTIVE</span>
                                            </div>
                                            <span className="text-[10px] opacity-75 font-normal">Scorched plate detected at {inst.hexCoord} with hazard index {inst.attributes.hazardIndex.toFixed(2)}.</span>
                                        </div>
                                    )}

                                    {inst.type === 'card' && (
                                        <div className="bg-slate-950/60 border border-cyan-500/30 p-3 rounded-lg flex flex-col gap-1 shadow-lg">
                                            <span className="text-cyan-300 text-xs font-bold font-heading">{inst.name}</span>
                                            <div className="flex justify-between text-[10px] text-slate-400">
                                                <span>Voltage Load:</span>
                                                <span className="text-cyan-400 font-bold font-mono">{inst.attributes.voltageLoad}W</span>
                                            </div>
                                        </div>
                                    )}

                                    {inst.type === 'shield' && (
                                        <div className="bg-purple-950/20 border border-purple-500/30 p-3 rounded-lg flex flex-col gap-1 shadow-lg">
                                            <span className="text-purple-300 text-xs font-bold font-heading">🛡️ {inst.name}</span>
                                            <div className="flex justify-between text-[10px] text-slate-400">
                                                <span>Friction Shield:</span>
                                                <span className="text-purple-400 font-bold font-mono">{inst.attributes.friction.toFixed(2)}x</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="border-t border-slate-900 pt-4 flex flex-col gap-2">
                        <label className="text-[10px] text-yellow-400 font-bold uppercase">4. Exported CSS Snippet Layout</label>
                        <pre className="bg-slate-950 text-cyan-300 text-[9px] p-3 rounded-lg border border-slate-850 overflow-x-auto whitespace-pre h-24">
                            {exportedBootstrapCSS}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
