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
                    flex: 1,
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignContent: 'center',
                    justifyContent: 'center',
                    gap: 16,
                    padding: 40,
                    background: '#07070a'
                }}>
                    {currentBoard.map(node => {
                        const isSelected = activeNodeId === node.id;
                        return (
                            <div 
                                key={node.id}
                                onClick={() => setActiveNodeId(node.id)}
                                style={{
                                    width: 110,
                                    height: 110,
                                    background: '#13131a',
                                    borderRadius: 12,
                                    border: isSelected ? '3px solid #00ffff' : '1px solid #242430',
                                    cursor: 'pointer',
                                    padding: 12,
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
                                <div style={{ fontSize: 11, fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {node.name}
                                </div>
                                <div style={{ fontSize: 9, opacity: 0.7, textTransform: 'uppercase', color: node.color }}>
                                    {node.type}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
