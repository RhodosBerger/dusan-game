import React, { useState, useMemo } from 'react';

// Faction and Biome Constants
const BIOMES = ['LUSH_FOREST', 'TOXIC_SWAMP', 'GLACIER', 'DESERT', 'BARRENS'];
const ACTOR_TYPES = ['PLAYER', 'NPC', 'TOWN', 'NONE'];

export default function SovereignBuilderCMS({ gridData, onSave }) {
    const [selectedNode, setSelectedNode] = useState(null);
    const [editorGrid, setEditorGrid] = useState(() => {
        // Pre-populate with standard grid data template
        const data = gridData || Array.from({ length: 63 }).map((_, i) => ({
            macroIndex: Math.floor(i / 7),
            subIndex: i % 7,
            biome: 'LUSH_FOREST',
            walkable: true,
            hazardIndex: 0.15,
            friction: 0.25
        }));
        return data.map(node => ({
            ...node,
            biome: node.biome || 'LUSH_FOREST',
            walkable: node.walkable !== false,
            hazardIndex: node.hazardIndex || 0.1,
            friction: node.friction || 0.2,
            actorType: node.threadId ? (node.threadId.includes('npc') ? 'NPC' : 'PLAYER') : 'NONE',
            temperature: node.temperature || 20,
            humidity: node.humidity || 50,
            conductivity: node.conductivity || 0.5,
            estimatedPower: '20W'
        }));
    });

    const [isSyncing, setIsSyncing] = useState(false);
    const [logMessages, setLogMessages] = useState(['[CMS Builder] initialized. Ready to compile tactical assets.']);

    // Selected block details
    const selectedBlockData = useMemo(() => {
        return editorGrid.find(n => n.macroIndex === selectedNode?.macroIndex && n.subIndex === selectedNode?.subIndex);
    }, [selectedNode, editorGrid]);

    // Handle block property updates
    const updateBlockProperty = (key, value) => {
        if (!selectedNode) return;
        setEditorGrid(prev => prev.map(n => {
            if (n.macroIndex === selectedNode.macroIndex && n.subIndex === selectedNode.subIndex) {
                return { ...n, [key]: value };
            }
            return n;
        }));
    };

    // Trigger Go Core Batch Synthesis to resolve metrics (Rule 6 - Go Core integration)
    const triggerGoCoreBatchSync = async () => {
        setIsSyncing(true);
        setLogMessages(prev => [`[GO_CORE] Dispatching batch synthesis for ${editorGrid.length} nodes...`, ...prev]);
        try {
            const response = await fetch('http://localhost:8081/api/synthesize/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    blocks: editorGrid.map(n => ({ metaId: n.macroIndex, hexId: n.subIndex }))
                })
            });
            if (response.ok) {
                const results = await response.json();
                // Map synthesized Go values back to our editor state
                setEditorGrid(prev => prev.map((n, i) => {
                    const match = results.find(r => r.metaId === n.macroIndex && r.hexId === n.subIndex);
                    if (match) {
                        return {
                            ...n,
                            biome: match.biome,
                            friction: match.friction,
                            conductivity: match.conductivity,
                            temperature: match.temperature,
                            humidity: match.humidity,
                            hazardIndex: match.hazardIndex
                        };
                    }
                    return n;
                }));
                setLogMessages(prev => ['[GO_CORE] Batch synthesis resolved successfully. Grid synchronized.', ...prev]);
            } else {
                setLogMessages(prev => ['[WARNING] Go Core offline. Applying deterministic TS fallbacks.', ...prev]);
            }
        } catch (err) {
            setLogMessages(prev => [`[ERROR] Connection failed: ${err.message}. Using cached values.`, ...prev]);
        } finally {
            setIsSyncing(false);
        }
    };

    // Export game configuration JSON ready for engine consumption
    const handleExport = () => {
        const config = {
            version: "1.0.0",
            timestamp: new Date().toISOString(),
            grid: editorGrid.map(n => ({
                meta: n.macroIndex,
                hex: n.subIndex,
                biome: n.biome,
                walkable: n.walkable,
                hazardIndex: n.hazardIndex,
                friction: n.friction,
                actor: n.actorType !== 'NONE' ? {
                    type: n.actorType,
                    id: n.actorType === 'PLAYER' ? 'thread_king_ai' : 'thread_npc_glitch_01'
                } : null
            }))
        };
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tactical_scene_template_${Date.now()}.json`;
        a.click();
        setLogMessages(prev => ['[CMS Builder] Grid configuration exported successfully.', ...prev]);
    };

    return (
        <div style={{
            display: 'flex',
            width: '100vw',
            height: '100vh',
            background: '#0d0e12',
            color: '#e2e8f0',
            fontFamily: 'sans-serif'
        }}>
            {/* ─── LEFT SIDEBAR: Oxygen / Elementor-like Inspector Panel ─── */}
            <div style={{
                width: 360,
                background: '#15171e',
                borderRight: '1px solid #232733',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box'
            }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #232733' }}>
                    <h2 style={{ margin: 0, fontSize: 18, color: '#39ff14', letterSpacing: 0.5 }}>SOVEREIGN BUILDER CMS</h2>
                    <span style={{ fontSize: 11, opacity: 0.6 }}>React-Go Gamedev Layout Composer</span>
                </div>

                {/* Inspector Scroll Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                    {selectedBlockData ? (
                        <div>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: 14, color: '#ffd700' }}>
                                Inspector: Block M{selectedBlockData.macroIndex}_S{selectedBlockData.subIndex}
                            </h3>

                            {/* Biome Select */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 11, marginBottom: 6, opacity: 0.8 }}>Biome Selection</label>
                                <select 
                                    value={selectedBlockData.biome}
                                    onChange={(e) => updateBlockProperty('biome', e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: 4, background: '#1d202b', color: '#fff', border: '1px solid #333' }}
                                >
                                    {BIOMES.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>

                            {/* Actor Placement */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 11, marginBottom: 6, opacity: 0.8 }}>Actor Placement</label>
                                <select 
                                    value={selectedBlockData.actorType}
                                    onChange={(e) => updateBlockProperty('actorType', e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: 4, background: '#1d202b', color: '#fff', border: '1px solid #333' }}
                                >
                                    {ACTOR_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>

                            {/* Walkability Toggle */}
                            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 11, opacity: 0.8 }}>Walkable Mesh Target</span>
                                <input 
                                    type="checkbox"
                                    checked={selectedBlockData.walkable}
                                    onChange={(e) => updateBlockProperty('walkable', e.target.checked)}
                                    style={{ cursor: 'pointer', scale: '1.2' }}
                                />
                            </div>

                            {/* Hazard Index Slider */}
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6, opacity: 0.8 }}>
                                    <span>Hazard Stress Index</span>
                                    <span>{selectedBlockData.hazardIndex}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0.0" 
                                    max="1.0" 
                                    step="0.05"
                                    value={selectedBlockData.hazardIndex}
                                    onChange={(e) => updateBlockProperty('hazardIndex', parseFloat(e.target.value))}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            {/* Friction Slider */}
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6, opacity: 0.8 }}>
                                    <span>Friction Coefficient</span>
                                    <span>{selectedBlockData.friction}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0.1" 
                                    max="2.5" 
                                    step="0.1"
                                    value={selectedBlockData.friction}
                                    onChange={(e) => updateBlockProperty('friction', parseFloat(e.target.value))}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            {/* Go Core Meta Attributes Readout */}
                            <div style={{
                                background: '#1d202b',
                                padding: 12,
                                borderRadius: 6,
                                border: '1px solid #333',
                                fontSize: 11,
                                lineHeight: '1.6'
                            }}>
                                <span style={{ color: '#00ffff', fontWeight: 'bold', display: 'block', marginBottom: 4 }}>Go Synthesis Feedback:</span>
                                <div>Temperature: {selectedBlockData.temperature}°C</div>
                                <div>Humidity: {selectedBlockData.humidity}%</div>
                                <div>Conductivity: {selectedBlockData.conductivity}S/m</div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', opacity: 0.5, marginTop: 40, fontSize: 13 }}>
                            Click on a grid node to load the layout builder properties.
                        </div>
                    )}
                </div>

                {/* Operations Bar */}
                <div style={{ padding: '16px 20px', borderTop: '1px solid #232733', background: '#111319' }}>
                    <button 
                        onClick={triggerGoCoreBatchSync}
                        disabled={isSyncing}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: '#39ff14',
                            color: '#000',
                            border: 'none',
                            borderRadius: 4,
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            opacity: isSyncing ? 0.6 : 1,
                            marginBottom: 8
                        }}
                    >
                        {isSyncing ? 'Syncing...' : 'Fetch Go Core Batch'}
                    </button>
                    <button 
                        onClick={handleExport}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: 'transparent',
                            color: '#fff',
                            border: '1px solid #444',
                            borderRadius: 4,
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Export Template JSON
                    </button>
                </div>
            </div>

            {/* ─── CENTER PLAYGROUND: Interactive Matrix Sandbox ─── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Visualizer header */}
                <div style={{ padding: '16px 24px', background: '#111319', borderBottom: '1px solid #232733', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, opacity: 0.8 }}>Canvas Composer Grid View (Oxygen Pattern)</span>
                    <span style={{ fontSize: 12, color: '#39ff14' }}>API Node status: Active</span>
                </div>

                {/* Interactive Grid Map */}
                <div style={{
                    flex: 1,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(8, 70px)',
                    gridGap: '8px',
                    alignContent: 'center',
                    justifyContent: 'center',
                    background: '#0a0b0d'
                }}>
                    {editorGrid.slice(0, 48).map((node) => {
                        const isSelected = selectedNode?.macroIndex === node.macroIndex && selectedNode?.subIndex === node.subIndex;
                        const biomeColors = {
                            LUSH_FOREST: '#15803d',
                            TOXIC_SWAMP: '#a21caf',
                            GLACIER: '#0369a1',
                            DESERT: '#b45309',
                            BARRENS: '#78350f'
                        };
                        const color = biomeColors[node.biome] || '#333';
                        return (
                            <div 
                                key={`${node.macroIndex}_${node.subIndex}`}
                                onClick={() => setSelectedNode({ macroIndex: node.macroIndex, subIndex: node.subIndex })}
                                style={{
                                    width: 70,
                                    height: 70,
                                    background: color,
                                    borderRadius: 8,
                                    border: isSelected ? '3px solid #39ff14' : '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    position: 'relative'
                                }}
                            >
                                <span style={{ fontSize: 9, opacity: 0.7, fontWeight: 'bold' }}>M{node.macroIndex}_S{node.subIndex}</span>
                                {node.actorType !== 'NONE' && (
                                    <span style={{
                                        fontSize: 10,
                                        fontWeight: 'bold',
                                        color: '#fff',
                                        background: '#000',
                                        padding: '2px 4px',
                                        borderRadius: 4,
                                        marginTop: 4
                                    }}>
                                        {node.actorType}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* ─── BOTTOM PANEL: Log & Diagnostic Telemetry Output ─── */}
                <div style={{
                    height: 180,
                    background: '#111319',
                    borderTop: '1px solid #232733',
                    padding: '16px 24px',
                    boxSizing: 'border-box',
                    overflowY: 'auto'
                }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: 12, color: '#888', textTransform: 'uppercase' }}>Builder Diagnostics Bus</h4>
                    <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#39ff14', lineHeight: '1.5' }}>
                        {logMessages.map((log, index) => <div key={index}>{log}</div>)}
                    </div>
                </div>
            </div>
        </div>
    );
}
