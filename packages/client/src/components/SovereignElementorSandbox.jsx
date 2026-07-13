import React, { useState, useMemo } from 'react';

const INITIAL_COMPONENTS = [
    { id: 'c1', type: 'accordion', hexCoord: '0x1A', biome: 'TOXIC_SWAMP', hazard: 0.75, friction: 1.20, label: 'Toxic Corroder Accordion' },
    { id: 'c2', type: 'alert', hexCoord: '0x2B', biome: 'GLACIER', hazard: 0.90, friction: 1.50, label: 'Deep Frost Alert Shield' },
    { id: 'c3', type: 'card', hexCoord: '0x5C', biome: 'LUSH_FOREST', hazard: 0.20, friction: 0.80, label: 'Lush Meadow Hologram' }
];

export default function SovereignElementorSandbox() {
    const [components, setComponents] = useState(INITIAL_COMPONENTS);
    const [activeAccordionId, setActiveAccordionId] = useState(null);
    const [styleFormula, setStyleFormula] = useState("hazard > 0.6 ? 'scoria-glow' : 'emerald-glow'");
    const [newCoord, setNewCoord] = useState('0x4D');
    const [newBiome, setNewBiome] = useState('TOXIC_SWAMP');
    const [newType, setNewType] = useState('accordion');

    // Layout arrangement handlers (analogous to Elementor grid tools)
    const handleArrangeGrid = (pattern) => {
        let updated = [...components];
        if (pattern === 'linear') {
            updated = components.map((c, idx) => ({
                ...c,
                hexCoord: `0x${(idx + 1).toString(16).toUpperCase()}0`
            }));
        } else if (pattern === 'concentric') {
            updated = components.map((c, idx) => ({
                ...c,
                hexCoord: `0x0${(idx + 1).toString(16).toUpperCase()}`
            }));
        } else if (pattern === 'alternating') {
            updated = components.map((c, idx) => ({
                ...c,
                hexCoord: `0x${(idx).toString(16).toUpperCase()}${(idx + 1).toString(16).toUpperCase()}`,
                biome: idx % 2 === 0 ? 'TOXIC_SWAMP' : 'GLACIER'
            }));
        }
        setComponents(updated);
    };

    const handleAddComponent = () => {
        const id = `c_${Date.now()}`;
        const newComp = {
            id,
            type: newType,
            hexCoord: newCoord.trim() || '0x4D',
            biome: newBiome,
            hazard: newBiome === 'GLACIER' ? 0.9 : 0.45,
            friction: newBiome === 'GLACIER' ? 1.5 : 1.0,
            label: `${newBiome} ${newType.toUpperCase()}`
        };
        setComponents(prev => [...prev, newComp]);
    };

    const handleDeleteComponent = (id) => {
        setComponents(prev => prev.filter(c => c.id !== id));
    };

    // Evaluates the formula dynamically
    const evaluateStyleClass = (comp) => {
        try {
            // Safe evaluation using basic variables
            const fn = new Function('hazard', 'friction', `return ${styleFormula};`);
            return fn(comp.hazard, comp.friction);
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

/* Alert Overlay Plate */
.alert-overlay-plate {
    background: rgba(239, 68, 68, 0.1);
    border-left: 4px solid #ef4444;
    padding: 1rem;
    color: #ffd700;
}
`;
    }, [components]);

    return (
        <div className="flex flex-col gap-6 w-full h-full p-4 overflow-y-auto" style={{ fontFamily: 'monospace' }}>
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                    <h2 className="text-sm font-bold text-yellow-400 uppercase tracking-wider">🛠️ SOVEREIGN ELEMENTOR SANDBOX</h2>
                    <span className="text-[10px] text-slate-400">Bootstrap Modality Layout & Accordion Hex Builder</span>
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
                {/* Left Panel: Component Creator & Style Formula Editor */}
                <div className="flex flex-col gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-900">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-l-2 border-cyan-400 pl-2">1. Component Builder</h3>
                    
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-400 uppercase">Coordinate:</label>
                        <input 
                            type="text" 
                            value={newCoord}
                            onChange={(e) => setNewCoord(e.target.value)}
                            className="bg-slate-900 text-cyan-300 text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-400 uppercase">Biome Type:</label>
                        <select 
                            value={newBiome}
                            onChange={(e) => setNewBiome(e.target.value)}
                            className="bg-slate-900 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-800"
                        >
                            <option value="TOXIC_SWAMP">Toxic Swamp</option>
                            <option value="GLACIER">Glacier</option>
                            <option value="LUSH_FOREST">Lush Forest</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-400 uppercase">Component Block:</label>
                        <select 
                            value={newType}
                            onChange={(e) => setNewType(e.target.value)}
                            className="bg-slate-900 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-800"
                        >
                            <option value="accordion">Accordion Hexagon</option>
                            <option value="alert">Bootstrap Alert Plate</option>
                            <option value="card">Holographic Card</option>
                        </select>
                    </div>

                    <button 
                        onClick={handleAddComponent}
                        className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-xs py-2 rounded-lg transition-all"
                    >
                        + Add To Canvas Grid
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
                        {components.map((comp) => {
                            const evaluatedClass = evaluateStyleClass(comp);
                            
                            return (
                                <div 
                                    key={comp.id}
                                    className={`relative p-4 rounded-xl border border-slate-800 bg-slate-900/60 transition-all ${evaluatedClass}`}
                                    style={{
                                        boxShadow: evaluatedClass === 'scoria-glow' ? '0 0 10px rgba(239, 68, 68, 0.25)' : evaluatedClass === 'emerald-glow' ? '0 0 10px rgba(16, 185, 129, 0.25)' : 'none'
                                    }}
                                >
                                    <button 
                                        onClick={() => handleDeleteComponent(comp.id)}
                                        className="absolute top-2 right-2 text-rose-500 hover:text-rose-400 text-xs"
                                    >
                                        [Delete]
                                    </button>

                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-bold text-cyan-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-cyan-500/20">
                                            {comp.hexCoord}
                                        </span>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                            {comp.biome}
                                        </span>
                                    </div>

                                    {/* Render dynamic elements */}
                                    {comp.type === 'accordion' && (
                                        <div className="flex flex-col gap-1 border border-blue-500/30 rounded-lg overflow-hidden bg-slate-950/40">
                                            <button 
                                                onClick={() => setActiveAccordionId(activeAccordionId === comp.id ? null : comp.id)}
                                                className="w-full text-left px-3 py-2 bg-blue-900/20 text-xs text-blue-300 font-bold hover:bg-blue-900/35 transition-all flex justify-between"
                                            >
                                                <span>Expand Hex Plate Details</span>
                                                <span>{activeAccordionId === comp.id ? '▲' : '▼'}</span>
                                            </button>
                                            {activeAccordionId === comp.id && (
                                                <div className="p-3 text-[10px] text-slate-300 flex flex-col gap-1 bg-slate-950/60 border-t border-blue-500/20 font-mono">
                                                    <div>Label: <span className="text-slate-100 font-bold">{comp.label}</span></div>
                                                    <div>Hazard Index: <span className="text-red-400 font-bold">{comp.hazard.toFixed(2)}</span></div>
                                                    <div>Friction Coefficient: <span className="text-green-400 font-bold">{comp.friction.toFixed(2)}x</span></div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {comp.type === 'alert' && (
                                        <div className="bg-red-950/30 border border-red-500/30 p-2.5 rounded-lg text-xs text-red-200 font-bold flex flex-col gap-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-yellow-400">⚡ HAZARD SHIELD ALARM</span>
                                                <span className="text-[10px] text-slate-400">ACTIVE</span>
                                            </div>
                                            <span className="text-[10px] opacity-75 font-normal">{comp.label} triggered at {comp.hexCoord} sector.</span>
                                        </div>
                                    )}

                                    {comp.type === 'card' && (
                                        <div className="bg-slate-950/60 border border-cyan-500/30 p-3 rounded-lg flex flex-col gap-1 shadow-lg">
                                            <span className="text-cyan-300 text-xs font-bold font-heading">{comp.label}</span>
                                            <div className="flex justify-between text-[10px] text-slate-400">
                                                <span>Sector Load:</span>
                                                <span className="text-cyan-400 font-bold font-mono">1.25kW</span>
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
