import React, { useState, useMemo } from 'react';

// Mock datasets representing game state configurations
const DATASETS = {
    NEON_CYBERPUNK: {
        id: 'neon_cyberpunk',
        name: 'Neon Cyberpunk Sector',
        entropy: 0.85,
        hazard: 0.65,
        friction: 0.35,
        cssOverride: '.grid-node { border: 2px solid #00ffff; box-shadow: 0 0 10px #00ffff; }',
        nodes: [
            { id: 'n1', type: 'hacker', x: 0, y: 0, label: 'Proxy Gateway' },
            { id: 'n2', type: 'hacker', x: 1, y: 0, label: 'RAM Register' },
            { id: 'n3', type: 'void', x: -1, y: 1, label: 'Buffer Overflow' }
        ],
        babylonEndpoint: 'http://localhost:8081/api/babylon/cyberpunk'
    },
    FANTASY_KINGDOM: {
        id: 'fantasy_kingdom',
        name: 'High Fantasy Realm',
        entropy: 0.30,
        hazard: 0.15,
        friction: 0.95,
        cssOverride: '.grid-node { border: 2px solid #d4af37; background: #2a1b0a; }',
        nodes: [
            { id: 'n1', type: 'druid', x: 0, y: 0, label: 'Forest Keep' },
            { id: 'n2', type: 'druid', x: 0, y: 1, label: 'Stone Circle' },
            { id: 'n3', type: 'crystal', x: 2, y: -1, label: 'Gold Mine' }
        ],
        babylonEndpoint: 'http://localhost:8081/api/babylon/fantasy'
    },
    VOID_DREAD: {
        id: 'void_dread',
        name: 'Void Dread Abyss',
        entropy: 0.95,
        hazard: 0.90,
        friction: 0.50,
        cssOverride: '.grid-node { border: 2px dotted #8a2be2; animation: shake 0.5s infinite; }',
        nodes: [
            { id: 'n1', type: 'void', x: 0, y: 0, label: 'Singularity Center' },
            { id: 'n2', type: 'void', x: -1, y: -1, label: 'Event Horizon' }
        ],
        babylonEndpoint: 'http://localhost:8081/api/babylon/void'
    }
};

// Mock Filesystem Structure
const FILE_SYSTEM = {
    name: 'root',
    children: [
        {
            name: 'datasets',
            children: [
                { name: 'neon_cyberpunk.json', datasetKey: 'NEON_CYBERPUNK' },
                { name: 'fantasy_kingdom.json', datasetKey: 'FANTASY_KINGDOM' },
                { name: 'void_dread.json', datasetKey: 'VOID_DREAD' }
            ]
        },
        {
            name: 'snippets',
            children: [
                { name: 'neon_pulse.css', content: '.grid-pulse { animation: neon 1s infinite alternate; }' },
                { name: 'fantasy_parchment.css', content: '.theme-board { background: #f4edd2; color: #1c130c; }' }
            ]
        },
        {
            name: 'models',
            children: [
                { name: 'droid_miniature.obj' },
                { name: 'crystal_spike.obj' },
                { name: 'swamp_spore.obj' }
            ]
        }
    ]
};

export default function SovereignB2BPortal({ onLoadDataset, onApplyCSS }) {
    const [selectedDatasetKey, setSelectedDatasetKey] = useState('NEON_CYBERPUNK');
    const [activeTab3D, setActiveTab3D] = useState('THREE'); // 'THREE' or 'BABYLON'
    const [cssSnippet, setCssSnippet] = useState(DATASETS.NEON_CYBERPUNK.cssOverride);
    const [consoleLogs, setConsoleLogs] = useState(['[B2B PORTAL] Initialized localhost session...']);

    const currentDataset = DATASETS[selectedDatasetKey];

    const logToConsole = (msg) => {
        setConsoleLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
    };

    const handleSelectFile = (file) => {
        if (file.datasetKey) {
            const ds = DATASETS[file.datasetKey];
            setSelectedDatasetKey(file.datasetKey);
            setCssSnippet(ds.cssOverride);
            logToConsole(`Loaded dataset: ${ds.name}`);
            if (onLoadDataset) {
                onLoadDataset(ds);
            }
        } else if (file.content) {
            setCssSnippet(file.content);
            logToConsole(`Loaded CSS snippet: ${file.name}`);
            if (onApplyCSS) {
                onApplyCSS(file.content);
            }
        } else {
            logToConsole(`Selected asset model: ${file.name}`);
        }
    };

    const handleApplyCSS = () => {
        logToConsole("Injected CSS overrides to frontend layers.");
        if (onApplyCSS) {
            onApplyCSS(cssSnippet);
        }
    };

    const handlePingBabylon = () => {
        logToConsole(`Pinging Babylon.js endpoint: ${currentDataset.babylonEndpoint}`);
        setTimeout(() => {
            logToConsole(`[Babylon.js] Connection verified. Target mesh: ${currentDataset.id}_base.obj loaded.`);
        }, 600);
    };

    return (
        <div style={{
            display: 'flex',
            width: '100vw',
            height: '100vh',
            background: '#0a0a0f',
            color: '#d1d1e0',
            fontFamily: 'monospace',
            boxSizing: 'border-box'
        }}>
            {/* ─── LEFT: Filesystem & Datasets ─── */}
            <div style={{
                width: 320,
                background: '#101017',
                borderRight: '1px solid #1c1c28',
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
                boxSizing: 'border-box'
            }}>
                <h3 style={{ margin: '0 0 4px 0', color: '#ffd700', fontSize: 14 }}>📁 FILESYSTEM</h3>
                <span style={{ fontSize: 9, opacity: 0.5, marginBottom: 20 }}>B2B Game Context Broker</span>

                <div style={{ flex: 1, overflowY: 'auto', fontSize: 12 }}>
                    {FILE_SYSTEM.children.map(folder => (
                        <div key={folder.name} style={{ marginBottom: 16 }}>
                            <div style={{ fontWeight: 'bold', color: '#ffd700', marginBottom: 6 }}>🗁 {folder.name}</div>
                            <div style={{ paddingLeft: 12 }}>
                                {folder.children.map(file => (
                                    <div 
                                        key={file.name} 
                                        onClick={() => handleSelectFile(file)}
                                        style={{ 
                                            padding: '4px 0', 
                                            cursor: 'pointer', 
                                            color: '#00ffff',
                                            textDecoration: 'underline'
                                        }}
                                    >
                                        📄 {file.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ borderTop: '1px solid #1c1c28', paddingTop: 16 }}>
                    <button 
                        onClick={handlePingBabylon}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: '#22c55e',
                            color: '#000',
                            border: 'none',
                            borderRadius: 6,
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: 11
                        }}
                    >
                        🔗 Ping Babylon.js Endpoint
                    </button>
                </div>
            </div>

            {/* ─── CENTER: 3D Viewport ─── */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid #1c1c28'
            }}>
                <div style={{
                    padding: '16px 24px',
                    background: '#101017',
                    borderBottom: '1px solid #1c1c28',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span>ACTIVE DATASET: <strong style={{ color: '#00ffff' }}>{currentDataset.name}</strong></span>
                    
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button 
                            onClick={() => setActiveTab3D('THREE')}
                            style={{
                                padding: '6px 12px',
                                background: activeTab3D === 'THREE' ? '#00ffff' : '#1c1c28',
                                color: activeTab3D === 'THREE' ? '#000' : '#fff',
                                border: 'none',
                                borderRadius: 4,
                                fontSize: 10,
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Three.js (R3F)
                        </button>
                        <button 
                            onClick={() => setActiveTab3D('BABYLON')}
                            style={{
                                padding: '6px 12px',
                                background: activeTab3D === 'BABYLON' ? '#00ffff' : '#1c1c28',
                                color: activeTab3D === 'BABYLON' ? '#000' : '#fff',
                                border: 'none',
                                borderRadius: 4,
                                fontSize: 10,
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Babylon.js
                        </button>
                    </div>
                </div>

                {/* 3D Mock Viewport Container */}
                <div style={{
                    flex: 1,
                    background: '#040406',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: 48 }}>{activeTab3D === 'THREE' ? '🌌' : '⚡'}</span>
                        <div style={{ fontSize: 14, fontWeight: 'bold', marginTop: 12 }}>
                            {activeTab3D === 'THREE' ? 'Three.js (R3F) Viewport' : 'Babylon.js Sandbox Viewport'}
                        </div>
                        <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4 }}>
                            Rendering dataset: {currentDataset.id}
                        </div>
                    </div>

                    {/* Nodes map preview overlay */}
                    <div style={{
                        position: 'absolute',
                        bottom: 20,
                        left: 20,
                        background: '#101017e6',
                        padding: 12,
                        borderRadius: 8,
                        border: '1px solid #1c1c28'
                    }}>
                        <span style={{ display: 'block', fontSize: 10, color: '#ffd700', marginBottom: 6 }}>Nodes Context Map</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {currentDataset.nodes.map(n => (
                                <div key={n.id} style={{ padding: '4px 8px', background: '#040406', borderRadius: 4, fontSize: 9 }}>
                                    {n.label} [{n.x}, {n.y}]
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Console logs */}
                <div style={{
                    height: 160,
                    background: '#07070a',
                    borderTop: '1px solid #1c1c28',
                    padding: 16,
                    boxSizing: 'border-box',
                    overflowY: 'auto',
                    fontSize: 10
                }}>
                    <div style={{ color: '#ffd700', marginBottom: 6 }}>CONSOLE LOGS</div>
                    {consoleLogs.map((log, idx) => (
                        <div key={idx} style={{ marginBottom: 4 }}>{log}</div>
                    ))}
                </div>
            </div>

            {/* ─── RIGHT: Progress Diffs & CSS Override ─── */}
            <div style={{
                width: 340,
                background: '#101017',
                padding: 24,
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                gap: 20
            }}>
                <h3 style={{ margin: 0, fontSize: 13, color: '#00ffff' }}>🎛️ PROGRESS & BALANCING DIFFS</h3>

                {/* Progress Bars showing dataset values */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 4 }}>
                            <span>Global Entropy Factor</span>
                            <span>{(currentDataset.entropy * 100).toFixed(0)}%</span>
                        </div>
                        <div style={{ width: '100%', height: 8, background: '#1c1c28', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${currentDataset.entropy * 100}%`, height: '100%', background: '#a855f7' }} />
                        </div>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 4 }}>
                            <span>Friction AP Multiplier</span>
                            <span>{currentDataset.friction.toFixed(2)}x</span>
                        </div>
                        <div style={{ width: '100%', height: 8, background: '#1c1c28', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${currentDataset.friction * 100}%`, height: '100%', background: '#22c55e' }} />
                        </div>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 4 }}>
                            <span>Hazard Stress Index</span>
                            <span>{currentDataset.hazard.toFixed(2)}</span>
                        </div>
                        <div style={{ width: '100%', height: 8, background: '#1c1c28', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${currentDataset.hazard * 100}%`, height: '100%', background: '#ef4444' }} />
                        </div>
                    </div>
                </div>

                <hr style={{ border: 'none', borderBottom: '1px solid #1c1c28' }} />

                {/* Snippets / CSS Override */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <label style={{ display: 'block', fontSize: 10, color: '#ffd700', marginBottom: 6 }}>CSS Snippet Override</label>
                    <textarea 
                        value={cssSnippet}
                        onChange={(e) => setCssSnippet(e.target.value)}
                        style={{
                            flex: 1,
                            width: '100%',
                            background: '#040406',
                            color: '#00ffff',
                            border: '1px solid #1c1c28',
                            borderRadius: 6,
                            padding: 12,
                            fontSize: 10,
                            fontFamily: 'monospace',
                            boxSizing: 'border-box',
                            resize: 'none'
                        }}
                    />
                    <button 
                        onClick={handleApplyCSS}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: '#00ffff',
                            color: '#000',
                            border: 'none',
                            borderRadius: 6,
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            marginTop: 10,
                            fontSize: 11
                        }}
                    >
                        Apply CSS Override
                    </button>
                </div>
            </div>
        </div>
    );
}
