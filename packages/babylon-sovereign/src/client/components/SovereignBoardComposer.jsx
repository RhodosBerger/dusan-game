import React, { useState, useMemo } from 'react';

// Polymorphic node presets
const NODE_TEMPLATES = {
    CRYSTAL_SPARK: { label: 'Crystal Spark', color: '#00ffff', friction: 0.1, hazardIndex: 0.1, walkable: true, type: 'crystal' },
    TOXIC_SLUDGE: { label: 'Toxic Sludge', color: '#d800ff', friction: 1.5, hazardIndex: 0.8, walkable: true, type: 'toxic' },
    VOID_RIFT: { label: 'Void Rift', color: '#8a2be2', friction: 0.5, hazardIndex: 0.9, walkable: false, type: 'void' },
    TOWN_MARKET: { label: 'Town Market', color: '#ffd700', friction: 0.2, hazardIndex: 0.0, walkable: true, type: 'town' },
    BASE_TILE: { label: 'Standard Block', color: '#1a1a24', friction: 0.2, hazardIndex: 0.1, walkable: true, type: 'neutral' }
};

// Default layout templates (Boards / Plates)
const PRESET_BOARDS = {
    GLACIER_ARENA: [
        { id: '1', name: 'Glacier Core', x: 0, y: 0, ...NODE_TEMPLATES.CRYSTAL_SPARK },
        { id: '2', name: 'West Pass', x: -1, y: 0, ...NODE_TEMPLATES.BASE_TILE },
        { id: '3', name: 'East Rift', x: 1, y: 0, ...NODE_TEMPLATES.VOID_RIFT },
        { id: '4', name: 'South Safehouse', x: 0, y: -1, ...NODE_TEMPLATES.TOWN_MARKET },
        { id: '5', name: 'North Hazard', x: 0, y: 1, ...NODE_TEMPLATES.TOXIC_SLUDGE }
    ],
    SWAMP_CAGE: [
        { id: '1', name: 'Toxic Pit', x: 0, y: 0, ...NODE_TEMPLATES.TOXIC_SLUDGE },
        { id: '2', name: 'Silt Block A', x: -1, y: -1, ...NODE_TEMPLATES.TOXIC_SLUDGE },
        { id: '3', name: 'Safe Island', x: 1, y: 1, ...NODE_TEMPLATES.TOWN_MARKET },
        { id: '4', name: 'Crystal Outpost', x: -1, y: 1, ...NODE_TEMPLATES.CRYSTAL_SPARK }
    ],
    EMPTY_PLATE: [
        { id: '1', name: 'Center Node', x: 0, y: 0, ...NODE_TEMPLATES.BASE_TILE }
    ]
};

export default function SovereignBoardComposer() {
    const [selectedBoardKey, setSelectedBoardKey] = useState('GLACIER_ARENA');
    const [currentBoard, setCurrentBoard] = useState(() => PRESET_BOARDS.GLACIER_ARENA);
    const [activeNodeId, setActiveNodeId] = useState(null);

    // Multi-Track Timeline States
    const [currentTime, setCurrentTime] = useState(0.0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedClipId, setSelectedClipId] = useState('c1');
    const [timelineClips, setTimelineClips] = useState([
        { id: 'c1', track: 'terrain', name: 'Elevate Center Hex', start: 0.2, duration: 1.0, hex: 'A_CENTER', zOffset: 2.0, biome: 'GLACIER' },
        { id: 'c2', track: 'character', name: 'Hero Voltage Overdrive', start: 1.2, duration: 1.2, hex: 'A_BASE', voltage: 5.0, resistance: 1.2 },
        { id: 'c3', track: 'threat', name: 'Spawn Droid Wave', start: 2.2, duration: 0.8, hex: 'A_OVERHEAD', threatCount: 3 },
        { id: 'c4', track: 'system', name: 'Thermodynamic Purge', start: 3.2, duration: 0.5, heatLimit: 100 }
    ]);

    const activeClip = useMemo(() => {
        return timelineClips.find(c => c.id === selectedClipId);
    }, [selectedClipId, timelineClips]);

    const updateClipAttribute = (key, val) => {
        if (!selectedClipId) return;
        setTimelineClips(prev => prev.map(c => {
            if (c.id === selectedClipId) {
                return { ...c, [key]: val };
            }
            return c;
        }));
    };

    // Playhead animation loop (emulating video timeline playback)
    React.useEffect(() => {
        let timer;
        if (isPlaying) {
            timer = setInterval(() => {
                setCurrentTime(prev => {
                    if (prev >= 4.0) return 0.0;
                    return parseFloat((prev + 0.05).toFixed(2));
                });
            }, 50);
        }
        return () => clearInterval(timer);
    }, [isPlaying]);

    // Sync board layout when user changes template dropdown
    const handleBoardTemplateChange = (key) => {
        setSelectedBoardKey(key);
        setCurrentBoard(PRESET_BOARDS[key]);
        setActiveNodeId(null);
    };

    const activeNode = useMemo(() => {
        return currentBoard.find(n => n.id === activeNodeId);
    }, [activeNodeId, currentBoard]);

    // Replace selected design node with a polymorphic variant
    const replaceSelectedNode = (variantKey) => {
        if (!activeNodeId) return;
        const template = NODE_TEMPLATES[variantKey];
        setCurrentBoard(prev => prev.map(n => {
            if (n.id === activeNodeId) {
                return { ...n, ...template, name: `${template.label} Slot` };
            }
            return n;
        }));
    };

    // Update specific node attribute
    const updateNodeAttribute = (key, value) => {
        if (!activeNodeId) return;
        setCurrentBoard(prev => prev.map(n => {
            if (n.id === activeNodeId) {
                return { ...n, [key]: value };
            }
            return n;
        }));
    };

    // Add a new node to the active board/plate
    const addNewNode = () => {
        const id = `node_${Date.now()}`;
        const newBlock = {
            id,
            name: 'New Node',
            x: 0,
            y: 0,
            ...NODE_TEMPLATES.BASE_TILE
        };
        setCurrentBoard(prev => [...prev, newBlock]);
        setActiveNodeId(id);
    };

    // Delete selected node from the layout board
    const deleteSelectedNode = () => {
        if (!activeNodeId) return;
        setCurrentBoard(prev => prev.filter(n => n.id !== activeNodeId));
        setActiveNodeId(null);
    };

    return (
        <div style={{
            display: 'flex',
            width: '100vw',
            height: '100vh',
            background: '#0d0d11',
            color: '#ececf1',
            fontFamily: 'sans-serif'
        }}>
            {/* ─── LEFT: Layout Presets & Builder Tool ─── */}
            <div style={{
                width: 380,
                background: '#13131a',
                borderRight: '1px solid #242430',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box'
            }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #242430' }}>
                    <h2 style={{ margin: 0, fontSize: 18, color: '#00ffff' }}>BOARD COMPOSER</h2>
                    <span style={{ fontSize: 11, opacity: 0.6 }}>Design Template Prototyper</span>
                </div>

                {/* Templates Selector */}
                <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 11, marginBottom: 8, opacity: 0.8 }}>Choose Board Template</label>
                        <select 
                            value={selectedBoardKey} 
                            onChange={(e) => handleBoardTemplateChange(e.target.value)}
                            style={{ width: '100%', padding: '10px', background: '#1c1c28', color: '#fff', border: '1px solid #3c3c4e', borderRadius: 6 }}
                        >
                            <option value="GLACIER_ARENA">Glacier Arena Plate</option>
                            <option value="SWAMP_CAGE">Toxic Swamplands Cage</option>
                            <option value="EMPTY_PLATE">Empty Sandbox Plate</option>
                        </select>
                    </div>

                    {/* Multi-Track Clip Inspector */}
                    {activeClip ? (
                        <div style={{ background: '#13131a', border: '1px solid #242430', padding: 14, borderRadius: 8, marginBottom: 20 }}>
                            <h3 style={{ margin: '0 0 12px 0', fontSize: 13, color: '#a855f7' }}>🎞️ Clip: {activeClip.name}</h3>
                            
                            <div style={{ marginBottom: 10 }}>
                                <label style={{ display: 'block', fontSize: 10, opacity: 0.8, marginBottom: 4 }}>Clip Name</label>
                                <input 
                                    type="text" value={activeClip.name} 
                                    onChange={(e) => updateClipAttribute('name', e.target.value)} 
                                    style={{ width: '100%', padding: '6px', background: '#0a0a0f', color: '#fff', border: '1px solid #242430', borderRadius: 4, fontSize: 10 }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: 10, opacity: 0.8, marginBottom: 4 }}>Start (s)</label>
                                    <input 
                                        type="number" step="0.1" value={activeClip.start} 
                                        onChange={(e) => updateClipAttribute('start', parseFloat(e.target.value) || 0)} 
                                        style={{ width: '100%', padding: '6px', background: '#0a0a0f', color: '#fff', border: '1px solid #242430', borderRadius: 4, fontSize: 10 }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: 10, opacity: 0.8, marginBottom: 4 }}>Duration (s)</label>
                                    <input 
                                        type="number" step="0.1" value={activeClip.duration} 
                                        onChange={(e) => updateClipAttribute('duration', parseFloat(e.target.value) || 0)} 
                                        style={{ width: '100%', padding: '6px', background: '#0a0a0f', color: '#fff', border: '1px solid #242430', borderRadius: 4, fontSize: 10 }}
                                    />
                                </div>
                            </div>

                            {activeClip.track === 'terrain' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 10, opacity: 0.8, marginBottom: 4 }}>Z-Offset Elevation</label>
                                        <input 
                                            type="number" step="0.5" value={activeClip.zOffset} 
                                            onChange={(e) => updateClipAttribute('zOffset', parseFloat(e.target.value) || 0)} 
                                            style={{ width: '100%', padding: '6px', background: '#0a0a0f', color: '#fff', border: '1px solid #242430', borderRadius: 4, fontSize: 10 }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 10, opacity: 0.8, marginBottom: 4 }}>Biome Type</label>
                                        <select 
                                            value={activeClip.biome} 
                                            onChange={(e) => updateClipAttribute('biome', e.target.value)}
                                            style={{ width: '100%', padding: '6px', background: '#0a0a0f', color: '#fff', border: '1px solid #242430', borderRadius: 4, fontSize: 10 }}
                                        >
                                            <option value="GLACIER">Glacier</option>
                                            <option value="TOXIC_SWAMP">Toxic Swamp</option>
                                            <option value="LUSH_FOREST">Lush Forest</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {activeClip.track === 'character' && (
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: 10, opacity: 0.8, marginBottom: 4 }}>Voltage (V)</label>
                                        <input 
                                            type="number" step="0.5" value={activeClip.voltage} 
                                            onChange={(e) => updateClipAttribute('voltage', parseFloat(e.target.value) || 0)} 
                                            style={{ width: '100%', padding: '6px', background: '#0a0a0f', color: '#fff', border: '1px solid #242430', borderRadius: 4, fontSize: 10 }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: 10, opacity: 0.8, marginBottom: 4 }}>Resistance (R)</label>
                                        <input 
                                            type="number" step="0.1" value={activeClip.resistance} 
                                            onChange={(e) => updateClipAttribute('resistance', parseFloat(e.target.value) || 0)} 
                                            style={{ width: '100%', padding: '6px', background: '#0a0a0f', color: '#fff', border: '1px solid #242430', borderRadius: 4, fontSize: 10 }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}

                    <hr style={{ border: 'none', borderBottom: '1px solid #242430', margin: '20px 0' }} />

                    {/* Node Inspector */}
                    {activeNode ? (
                        <div>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: 14, color: '#ffd700' }}>Inspector: {activeNode.name}</h3>

                            {/* Swap Polymorphic Variant */}
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontSize: 11, marginBottom: 8, opacity: 0.8 }}>Swap Polymorphic Variant</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                                    {Object.keys(NODE_TEMPLATES).map(key => (
                                        <button 
                                            key={key} 
                                            onClick={() => replaceSelectedNode(key)}
                                            style={{
                                                padding: '8px',
                                                background: '#1c1c28',
                                                color: '#fff',
                                                border: '1px solid #3c3c4e',
                                                borderRadius: 4,
                                                fontSize: 10,
                                                cursor: 'pointer',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {NODE_TEMPLATES[key].label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Node Attributes */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 11, marginBottom: 6, opacity: 0.8 }}>Block Name</label>
                                <input 
                                    type="text" 
                                    value={activeNode.name}
                                    onChange={(e) => updateNodeAttribute('name', e.target.value)}
                                    style={{ width: '100%', padding: '8px', background: '#1c1c28', color: '#fff', border: '1px solid #3c3c4e', borderRadius: 4 }}
                                />
                            </div>

                            {/* Coordinates */}
                            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: 11, marginBottom: 6, opacity: 0.8 }}>Coord X</label>
                                    <input 
                                        type="number" 
                                        value={activeNode.x}
                                        onChange={(e) => updateNodeAttribute('x', parseInt(e.target.value) || 0)}
                                        style={{ width: '100%', padding: '8px', background: '#1c1c28', color: '#fff', border: '1px solid #3c3c4e', borderRadius: 4 }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: 11, marginBottom: 6, opacity: 0.8 }}>Coord Y</label>
                                    <input 
                                        type="number" 
                                        value={activeNode.y}
                                        onChange={(e) => updateNodeAttribute('y', parseInt(e.target.value) || 0)}
                                        style={{ width: '100%', padding: '8px', background: '#1c1c28', color: '#fff', border: '1px solid #3c3c4e', borderRadius: 4 }}
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={deleteSelectedNode}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    background: '#ef4444',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 6,
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    marginTop: 10
                                }}
                            >
                                Delete Design Node
                            </button>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', opacity: 0.5, marginTop: 40, fontSize: 12 }}>
                            Select a design node on the grid plate to customize its variables.
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div style={{ padding: '20px', borderTop: '1px solid #242430', background: '#0e0e14' }}>
                    <button 
                        onClick={addNewNode}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#00ffff',
                            color: '#000',
                            border: 'none',
                            borderRadius: 6,
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        + Add Custom Node
                    </button>
                </div>
            </div>

            {/* ─── RIGHT: Interactive Canvas Board ─── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px 30px', background: '#13131a', borderBottom: '1px solid #242430', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Active Composing Plate: <strong style={{ color: '#00ffff' }}>{selectedBoardKey}</strong></span>
                    <span style={{ fontSize: 11, opacity: 0.6 }}>Drag & click components to replace template presets</span>
                </div>

                {/* Grid Canvas Representation */}
                <div style={{
                    height: '50%',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignContent: 'center',
                    justifyContent: 'center',
                    gap: 16,
                    padding: 20,
                    background: '#07070a',
                    borderBottom: '1px solid #242430',
                    overflowY: 'auto'
                }}>
                    {currentBoard.map(node => {
                        const isSelected = activeNodeId === node.id;
                        return (
                            <div 
                                key={node.id}
                                onClick={() => setActiveNodeId(node.id)}
                                style={{
                                    width: 100,
                                    height: 100,
                                    background: '#13131a',
                                    borderRadius: 12,
                                    border: isSelected ? '3px solid #00ffff' : '1px solid #242430',
                                    cursor: 'pointer',
                                    padding: 10,
                                    boxSizing: 'border-box',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 9, opacity: 0.5 }}>[{node.x}, {node.y}]</span>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: node.color }} />
                                </div>
                                <div style={{ fontSize: 10, fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {node.name}
                                </div>
                                <div style={{ fontSize: 9, opacity: 0.7, textTransform: 'uppercase', color: node.color }}>
                                    {node.type}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ─── BOTTOM: Scenario Multi-Track Timeline Workspace ─── */}
                <div style={{ height: '50%', background: '#0a0a0f', display: 'flex', flexDirection: 'column', padding: '16px 20px', boxSizing: 'border-box' }}>
                    {/* Timeline Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button 
                                onClick={() => setIsPlaying(!isPlaying)}
                                style={{
                                    background: isPlaying ? '#ef4444' : '#22c55e',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: 4,
                                    fontSize: 11,
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                {isPlaying ? '❚❚ PAUSE' : '▶ PLAY'}
                            </button>
                            <button 
                                onClick={() => setCurrentTime(0.0)}
                                style={{
                                    background: '#242430',
                                    color: '#fff',
                                    border: '1px solid #3c3c4e',
                                    padding: '6px 12px',
                                    borderRadius: 4,
                                    fontSize: 11,
                                    cursor: 'pointer'
                                }}
                            >
                                🔄 RESET
                            </button>
                            <span style={{ fontSize: 12, color: '#00ffff', fontFamily: 'monospace' }}>
                                PLAYHEAD: {currentTime.toFixed(2)}s / 4.00s
                            </span>
                        </div>
                        <span style={{ fontSize: 10, color: '#a855f7', fontWeight: 'bold', letterSpacing: 1 }}>
                            🎞️ SCENARIO MULTI-TRACK TIMELINE
                        </span>
                    </div>

                    {/* Timeline Tracks Grid */}
                    <div style={{ flex: 1, border: '1px solid #242430', borderRadius: 8, background: '#0e0e14', position: 'relative', overflow: 'hidden' }}>
                        {/* Vertical Playhead Bar */}
                        <div 
                            style={{
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                left: `${(currentTime / 4.0) * 100}%`,
                                width: 2,
                                background: '#00ffff',
                                boxShadow: '0 0 8px #00ffff',
                                zIndex: 10,
                                pointerEvents: 'none',
                                transition: 'left 0.05s linear'
                            }}
                        />

                        {/* Tracks */}
                        {['terrain', 'character', 'threat', 'system'].map((trackType, tIdx) => {
                            const trackClips = timelineClips.filter(c => c.track === trackType);
                            const trackLabels = {
                                terrain: '🏔️ TERRAIN (Z)',
                                character: '🚶 HERO (V/R)',
                                threat: '🤖 NPC SPAWNS',
                                system: '⚡ SYSTEM OVERLOAD'
                            };

                            return (
                                <div 
                                    key={trackType}
                                    style={{
                                        display: 'flex',
                                        height: '25%',
                                        alignItems: 'center',
                                        borderBottom: tIdx < 3 ? '1px solid #1a1a24' : 'none',
                                        position: 'relative',
                                        paddingLeft: 120
                                    }}
                                >
                                    {/* Track Header Label */}
                                    <div style={{
                                        position: 'absolute',
                                        left: 0,
                                        width: 120,
                                        height: '100%',
                                        background: '#13131a',
                                        borderRight: '1px solid #242430',
                                        display: 'flex',
                                        alignItems: 'center',
                                        paddingLeft: 8,
                                        fontSize: 9,
                                        fontWeight: 'bold',
                                        color: '#8e8e9f'
                                    }}>
                                        {trackLabels[trackType]}
                                    </div>

                                    {/* Track Lane Body */}
                                    <div style={{ flex: 1, height: '100%', position: 'relative' }}>
                                        {trackClips.map(clip => {
                                            const leftPct = (clip.start / 4.0) * 100;
                                            const widthPct = (clip.duration / 4.0) * 100;
                                            const isSelected = selectedClipId === clip.id;

                                            return (
                                                <div 
                                                    key={clip.id}
                                                    onClick={() => setSelectedClipId(clip.id)}
                                                    style={{
                                                        position: 'absolute',
                                                        left: `${leftPct}%`,
                                                        width: `${widthPct}%`,
                                                        height: '75%',
                                                        top: '12.5%',
                                                        background: isSelected ? 'rgba(168, 85, 247, 0.35)' : 'rgba(0, 255, 255, 0.15)',
                                                        border: isSelected ? '2px solid #a855f7' : '1px solid #00ffff',
                                                        borderRadius: 6,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        color: '#fff',
                                                        fontSize: 9,
                                                        fontWeight: 'bold',
                                                        padding: '0 4px',
                                                        boxSizing: 'border-box',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        zIndex: 5
                                                    }}
                                                >
                                                    {clip.name}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
