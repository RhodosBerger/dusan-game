import React, { useState, useMemo } from 'react';
import { SovereignElementorRegistry } from '../../../shared/src/index';

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

    // Evaluates formula dynamically
    const evaluateStyleClass = (inst) => {
        try {
            const fn = new Function('hazard', 'friction', `return ${styleFormula};`);
            return fn(inst.attributes.hazardIndex, inst.attributes.friction);
        } catch (e) {
            return 'default-glow';
        }
    };

    // Exports stylesheet snippet representing Bootstrap-style compositions
    const exportedBootstrapCSS = useMemo(() => {
        return `/* Bootstrap Game Composition Custom Stylesheet */
.game-grid-viewport {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.5rem;
}

/* Accordion Hexagon Plate */
.accordion-hex-plate {
    background: #0f172a;
    border: 2px solid #3b82f6;
    border-radius: 0.75rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.accordion-hex-plate.scoria-glow {
    border-color: #ef4444;
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
}
.accordion-hex-plate.emerald-glow {
    border-color: #10b981;
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
}
`;
    }, [instances]);

    return (
        <div className="flex flex-col gap-6 w-full h-full p-4 overflow-y-auto" style={{ fontFamily: 'monospace' }}>
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                    <h2 className="text-sm font-bold text-yellow-400 uppercase tracking-wider">🛠️ SOVEREIGN ELEMENTOR SANDBOX</h2>
                    <span className="text-[10px] text-slate-400">TypeScript Widget Registry & Layout Arrangement Engine</span>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel: Widget Selection & Attributes Tuning */}
                <div className="flex flex-col gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-900">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-l-2 border-cyan-400 pl-2">1. Widget Selection</h3>
                    
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
                        <span className="text-[8px] text-slate-500">Evaluates style class dynamically (vars: hazard, friction)</span>
                    </div>
                </div>

                {/* Center Panel: Interactive Sandbox Canvas */}
                <div className="lg:col-span-2 flex flex-col gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-900">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-l-2 border-purple-400 pl-2">2. Sandbox Modality Canvas</h3>

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
                        <label className="text-[10px] text-yellow-400 font-bold uppercase">3. Exported CSS Snippet Layout (Bootstrap compatible)</label>
                        <pre className="bg-slate-950 text-cyan-300 text-[9px] p-3 rounded-lg border border-slate-850 overflow-x-auto whitespace-pre h-24">
                            {exportedBootstrapCSS}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
