import React, { useState, useMemo, useEffect } from 'react';
import { executeKineticOverrideTransition } from '../../../shared/src/index';
import SovereignElementorSandbox from './SovereignElementorSandbox';

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

    // Ohm's Law Simulator State
    const [testVoltage, setTestVoltage] = useState(5.0);
    const [testResistance, setTestResistance] = useState(2.5);
    const [testLane, setTestLane] = useState('A_CENTER');
    const [simState, setSimState] = useState({
        systemHeat: 0,
        memoryIntegrity: 100,
        semanticErosion: 0,
        memoryLeaks: 0
    });

    // Timeframe & Transition Orchestrator States
    const [compareSlider, setCompareSlider] = useState(50);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playhead, setPlayhead] = useState(0);
    const [transitionSpeed, setTransitionSpeed] = useState(1.0);
    const [scriptInput, setScriptInput] = useState(JSON.stringify([
        { "time": 0.0, "event": "GRID_COMPOSITION_INIT" },
        { "time": 0.35, "event": "THREAD_NPC_SPAWN" },
        { "time": 0.70, "event": "GEOMETRIC_TERRAIN_DEFORM" },
        { "time": 1.0, "event": "THERMODYNAMIC_PURGE_RESET" }
    ], null, 2));

    const [html5Entities, setHtml5Entities] = useState([
        { hexCoord: '0x12', htmlEntity: '&#48;&#120;&#49;&#52;', tag: '<span data-coord="0x12">&#48;&#120;&#49;&#52;</span>' },
        { hexCoord: '0x35', htmlEntity: '&#48;&#120;&#51;&#53;', tag: '<span data-coord="0x35">&#48;&#120;&#51;&#53;</span>' },
        { hexCoord: '0x71', htmlEntity: '&#48;&#120;&#55;&#49;', tag: '<span data-coord="0x71">&#48;&#120;&#55;&#49;</span>' }
    ]);
    const [newCoordInput, setNewCoordInput] = useState('');

    // Socket-Thread Mapper & Geometric Culling States
    const [activeConnections, setActiveConnections] = useState([]);
    const [geoCoordinates, setGeoCoordinates] = useState([]);
    const [mockSocketId, setMockSocketId] = useState('socket_' + Math.floor(Math.random() * 100));
    const [mockThreadId, setMockThreadId] = useState('thread_crystal_shards');

    const [clickhouseStatus, setClickhouseStatus] = useState({
        online: false,
        url: '',
        fallbackPath: '',
        fallbackRecordsCount: 0,
        fallbackCounts: { VISION: 0, COMBAT: 0, SHORT_CIRCUIT: 0 }
    });

    const fetchClickhouseStatus = async () => {
        try {
            const res = await fetch('/api/b2b/clickhouse/status');
            if (res.ok) {
                const data = await res.json();
                setClickhouseStatus(data);
            }
        } catch (err) {
            console.error('Failed to fetch ClickHouse status:', err);
        }
    };

    const handleMockClickhouse = async (type) => {
        try {
            const res = await fetch('/api/b2b/clickhouse/mock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            });
            if (res.ok) {
                fetchClickhouseStatus();
            }
        } catch (err) {
            console.error('Failed to mock ClickHouse event:', err);
        }
    };

    const fetchConnections = async () => {
        try {
            const res = await fetch('/api/b2b/connections');
            if (res.ok) {
                const data = await res.json();
                setActiveConnections(data.activeConnections || []);
                setGeoCoordinates(data.coordinates || []);
            }
        } catch (err) {
            console.error('Failed to fetch connections:', err);
        }
    };

    useEffect(() => {
        fetchConnections();
        fetchClickhouseStatus();
    }, []);

    const handleMockConnect = async () => {
        try {
            const res = await fetch('/api/b2b/connections/mock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ socketId: mockSocketId, threadId: mockThreadId })
            });
            if (res.ok) {
                logToConsole(`[Socket-Thread Mapper] Connected socket ${mockSocketId} to ${mockThreadId}`);
                setMockSocketId('socket_' + Math.floor(Math.random() * 1000));
                fetchConnections();
            }
        } catch (err) {
            logToConsole(`[Socket-Thread Mapper Error] Failed to register mock connection.`);
        }
    };

    const handleMockDisconnect = async (socketId) => {
        try {
            const res = await fetch('/api/b2b/connections/mock-disconnect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ socketId })
            });
            if (res.ok) {
                logToConsole(`[Socket-Thread Mapper] Disconnected socket ${socketId}`);
                fetchConnections();
            }
        } catch (err) {
            logToConsole(`[Socket-Thread Mapper Error] Failed to disconnect socket.`);
        }
    };

    const handleRegisterEntity = async () => {
        const coord = newCoordInput.trim() || '0x2B';
        try {
            const res = await fetch('/api/scenarios/html5-entities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hexCoord: coord })
            });
            if (res.ok) {
                const data = await res.json();
                setHtml5Entities(prev => [
                    ...prev,
                    { hexCoord: data.hexCoord, htmlEntity: data.htmlEntity, tag: `<span data-coord="${data.hexCoord}">${data.htmlEntity}</span>` }
                ]);
                logToConsole(`[HTML5 Registry] Registered coordinate ${data.hexCoord} -> ${data.htmlEntity}`);
            } else {
                logToConsole(`[HTML5 Registry Error] Failed to register entity.`);
            }
        } catch (err) {
            logToConsole(`[HTML5 Registry Offline] Using local simulation for ${coord}.`);
            // Local simulation fallback
            let localEntity = '';
            for (let i = 0; i < coord.length; i++) {
                localEntity += `&#${coord.charCodeAt(i)};`;
            }
            setHtml5Entities(prev => [
                ...prev,
                { hexCoord: coord, htmlEntity: localEntity, tag: `<span data-coord="${coord}">${localEntity}</span>` }
            ]);
        }
    };

    const currentDataset = DATASETS[selectedDatasetKey];

    const logToConsole = (msg) => {
        setConsoleLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
    };

    useEffect(() => {
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                setPlayhead(prev => {
                    if (prev >= 100) return 0;
                    return Math.min(100, prev + (1 * transitionSpeed));
                });
            }, 50);
        }
        return () => clearInterval(interval);
    }, [isPlaying, transitionSpeed]);

    const handleExecuteScript = () => {
        try {
            const parsed = JSON.parse(scriptInput);
            logToConsole(`[Orchestrator] Ingested ${parsed.length} keyframe events.`);
            parsed.forEach((frame) => {
                setTimeout(() => {
                    logToConsole(`[Keyframe T:${frame.time.toFixed(2)}] Fired event: ${frame.event}`);
                    if (frame.event === "GEOMETRIC_TERRAIN_DEFORM") {
                        // Increment system heat to simulate activity
                        setSimState(prev => ({ ...prev, systemHeat: Math.min(120, prev.systemHeat + 15) }));
                    }
                }, frame.time * 2000);
            });
        } catch (e) {
            logToConsole(`[Orchestrator Error] Invalid script JSON structure.`);
        }
    };

    const handleRunKineticOverride = () => {
        const payload = {
            action_type: 'KINETIC_OVERRIDE',
            actor_id: 'thread_hacker_root',
            target_id: 'helper_turret_01',
            voltage_magnitude: testVoltage,
            base_resistance: testResistance,
            target_lane: testLane
        };
        const nextState = executeKineticOverrideTransition(payload, simState);
        setSimState(nextState);
        
        const currentMagnitude = testVoltage / Math.max(0.1, testResistance);
        logToConsole(`[State Engine] Transition executed: Current I = ${currentMagnitude.toFixed(2)}.`);
        if (currentMagnitude < 1.0) {
            logToConsole(`[State Engine] Failure: Current < 1.0. Converted to heat. System Heat = ${nextState.systemHeat}.`);
        } else {
            logToConsole(`[State Engine] Success: Applied Semantic Erosion. Target Integrity = ${nextState.memoryIntegrity.toFixed(1)}.`);
        }
        if (nextState.systemHeat === 0 && simState.systemHeat + (1.0 - currentMagnitude) * 50.0 > 100) {
            logToConsole(`[State Engine] Purge Condition: Thermodynamic Purge triggered! Integrity penalized, Heat reset.`);
        }
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
                        <button 
                            onClick={() => setActiveTab3D('HTML5')}
                            style={{
                                padding: '6px 12px',
                                background: activeTab3D === 'HTML5' ? '#00ffff' : '#1c1c28',
                                color: activeTab3D === 'HTML5' ? '#000' : '#fff',
                                border: 'none',
                                borderRadius: 4,
                                fontSize: 10,
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            HTML5 Entities
                        </button>
                        <button 
                            onClick={() => setActiveTab3D('ELEMENTOR')}
                            style={{
                                padding: '6px 12px',
                                background: activeTab3D === 'ELEMENTOR' ? '#00ffff' : '#1c1c28',
                                color: activeTab3D === 'ELEMENTOR' ? '#000' : '#fff',
                                border: 'none',
                                borderRadius: 4,
                                fontSize: 10,
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Elementor Sandbox
                        </button>
                        <button 
                            onClick={() => setActiveTab3D('CONNECTIONS')}
                            style={{
                                padding: '6px 12px',
                                background: activeTab3D === 'CONNECTIONS' ? '#ffd700' : '#1c1c28',
                                color: activeTab3D === 'CONNECTIONS' ? '#000' : '#fff',
                                border: 'none',
                                borderRadius: 4,
                                fontSize: 10,
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1.0)'; }}
                        >
                            Socket-Thread Mapper
                        </button>
                    </div>
                </div>

                {/* 3D / HTML5 Viewport Container */}
                <div style={{
                    flex: 1,
                    background: '#040406',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    padding: 20,
                    boxSizing: 'border-box'
                }}>
                    {activeTab3D === 'ELEMENTOR' ? (
                        <SovereignElementorSandbox />
                    ) : activeTab3D === 'CONNECTIONS' ? (
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 16, color: '#fff', boxSizing: 'border-box' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0b0b12', padding: 12, borderRadius: 8, border: '1px solid #1c1c28' }}>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Socket ID" 
                                        value={mockSocketId}
                                        onChange={(e) => setMockSocketId(e.target.value)}
                                        style={{ width: 120, padding: '6px 10px', background: '#101017', color: '#00ffff', border: '1px solid #1c1c28', borderRadius: 4, fontSize: 11, outline: 'none' }}
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Thread ID" 
                                        value={mockThreadId}
                                        onChange={(e) => setMockThreadId(e.target.value)}
                                        style={{ width: 150, padding: '6px 10px', background: '#101017', color: '#00ffff', border: '1px solid #1c1c28', borderRadius: 4, fontSize: 11, outline: 'none' }}
                                    />
                                    <button 
                                        onClick={handleMockConnect}
                                        style={{ 
                                            padding: '6px 14px', 
                                            background: '#ffd700', 
                                            color: '#000', 
                                            border: 'none', 
                                            borderRadius: 4, 
                                            fontWeight: 'bold', 
                                            fontSize: 10, 
                                            cursor: 'pointer',
                                            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 0 10px #ffd700'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1.0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                    >
                                        + Mock Connect
                                    </button>
                                </div>
                                <button 
                                    onClick={fetchConnections}
                                    style={{ 
                                        padding: '6px 12px', 
                                        background: '#1c1c28', 
                                        color: '#00ffff', 
                                        border: '1px solid #00ffff', 
                                        borderRadius: 4, 
                                        fontSize: 10, 
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1.0)'; }}
                                >
                                    🔄 Refresh
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
                                {/* Left Side: Active Mappings */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0b0b12', border: '1px solid #1c1c28', borderRadius: 8, padding: 12 }}>
                                    <span style={{ fontSize: 11, color: '#ffd700', fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Active Bridge Mappings ({activeConnections.length})
                                    </span>
                                    <div style={{ flex: 1, overflowY: 'auto' }}>
                                        {activeConnections.length === 0 ? (
                                            <div style={{ padding: '20px 0', textAlign: 'center', color: '#68687a', fontSize: 11 }}>
                                                No active socket-thread mappings.
                                            </div>
                                        ) : (
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                                                <thead>
                                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #1c1c28', color: '#888' }}>
                                                        <th style={{ padding: '6px 4px' }}>Socket ID</th>
                                                        <th style={{ padding: '6px 4px' }}>Thread ID</th>
                                                        <th style={{ padding: '6px 4px', textAlign: 'right' }}>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {activeConnections.map((conn, idx) => (
                                                        <tr key={idx} style={{ borderBottom: '1px solid #14141d' }}>
                                                            <td style={{ padding: '8px 4px', color: '#00ffff', fontFamily: 'monospace' }}>{conn.socketId}</td>
                                                            <td style={{ padding: '8px 4px', color: '#a855f7', fontFamily: 'monospace' }}>{conn.threadId}</td>
                                                            <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                                                                <button 
                                                                    onClick={() => handleMockDisconnect(conn.socketId)}
                                                                    style={{ 
                                                                        padding: '3px 8px', 
                                                                        background: '#ff4d4d', 
                                                                        color: '#fff', 
                                                                        border: 'none', 
                                                                        borderRadius: 3, 
                                                                        fontSize: 9, 
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                                                    }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)'; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1.0)'; }}
                                                                >
                                                                    Disconnect
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side Panel Stack */}
                                <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {/* Geometric Culling Priority Card */}
                                    <div style={{ flex: '1 1 50%', display: 'flex', flexDirection: 'column', background: '#0b0b12', border: '1px solid #1c1c28', borderRadius: 8, padding: 12, minHeight: 0 }}>
                                        <span style={{ fontSize: 11, color: '#ffd700', fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                            Geometric Culling Priority
                                        </span>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
                                            <div style={{ fontSize: 9, color: '#888', lineHeight: 1.3 }}>
                                                Tiles are partitioned into rendering layers based on proximity to active anchors.
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 2 }}>
                                                {geoCoordinates.map((coord, idx) => {
                                                    const layerColor = coord.layer === 'CRITICAL' ? '#ef4444' : coord.layer === 'STRUCTURAL' ? '#eab308' : '#3b82f6';
                                                    return (
                                                        <div 
                                                            key={idx}
                                                            style={{
                                                                background: '#13131a',
                                                                border: `1px solid ${layerColor}${coord.cullActive ? '40' : 'ff'}`,
                                                                borderRadius: 6,
                                                                padding: '4px 2px',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                opacity: coord.cullActive ? 0.4 : 1,
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                        >
                                                            <span style={{ fontSize: 9, color: '#fff', fontWeight: 'bold' }}>{coord.coord}</span>
                                                            <span style={{ fontSize: 8, color: layerColor, marginTop: 2 }}>{coord.layer}</span>
                                                            {coord.cullActive && <span style={{ fontSize: 8, color: '#888', fontStyle: 'italic' }}>Culled</span>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div style={{ marginTop: 'auto', borderTop: '1px solid #1c1c28', paddingTop: 6 }}>
                                                <div style={{ display: 'flex', justifySelf: 'space-between', width: '100%', fontSize: 9, color: '#888' }}>
                                                    <span>Active Culling Limit:</span>
                                                </div>
                                                <div style={{ fontSize: 8, color: '#a855f7', fontStyle: 'italic' }}>Mapped to global DDA Config</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ClickHouse Telemetry Card */}
                                    <div style={{ flex: '1 1 50%', display: 'flex', flexDirection: 'column', background: '#0b0b12', border: '1px solid #1c1c28', borderRadius: 8, padding: 12, minHeight: 0 }}>
                                        <span style={{ fontSize: 11, color: '#00ffff', fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                            ClickHouse Data Pool
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: clickhouseStatus.online ? '#10b981' : '#f59e0b', boxShadow: clickhouseStatus.online ? '0 0 8px #10b981' : '0 0 8px #f59e0b' }} />
                                            <span style={{ fontSize: 10, fontWeight: 'bold', color: clickhouseStatus.online ? '#10b981' : '#f59e0b' }}>
                                                {clickhouseStatus.online ? 'ONLINE (MergeTree)' : 'FALLBACK MODE (JSONL)'}
                                            </span>
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', fontSize: 10 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #14141d', paddingBottom: 4 }}>
                                                <span style={{ color: '#888' }}>Endpoint:</span>
                                                <span style={{ fontFamily: 'monospace', color: '#8b5cf6' }}>{clickhouseStatus.url}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #14141d', paddingBottom: 4 }}>
                                                <span style={{ color: '#888' }}>Fallback Records:</span>
                                                <span style={{ fontWeight: 'bold', color: '#ffd700' }}>{clickhouseStatus.fallbackRecordsCount}</span>
                                            </div>
                                            <div style={{ padding: 4, background: '#101017', borderRadius: 4, marginTop: 4 }}>
                                                <div style={{ fontSize: 8, color: '#68687a', textTransform: 'uppercase', marginBottom: 4, fontWeight: 'bold' }}>Local JSONL Counts</div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                                    <span>Vision:</span>
                                                    <span style={{ color: '#a855f7' }}>{clickhouseStatus.fallbackCounts?.VISION || 0}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                                    <span>Combat:</span>
                                                    <span style={{ color: '#3b82f6' }}>{clickhouseStatus.fallbackCounts?.COMBAT || 0}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>Short-Circuit:</span>
                                                    <span style={{ color: '#ef4444' }}>{clickhouseStatus.fallbackCounts?.SHORT_CIRCUIT || 0}</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 8 }}>
                                                <button 
                                                    onClick={() => handleMockClickhouse('VISION')}
                                                    style={{ flex: 1, padding: '4px 0', background: '#a855f7', color: '#fff', border: 'none', borderRadius: 3, fontSize: 8, fontWeight: 'bold', cursor: 'pointer' }}
                                                >
                                                    + Vision
                                                </button>
                                                <button 
                                                    onClick={() => handleMockClickhouse('COMBAT')}
                                                    style={{ flex: 1, padding: '4px 0', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 3, fontSize: 8, fontWeight: 'bold', cursor: 'pointer' }}
                                                >
                                                    + Combat
                                                </button>
                                                <button 
                                                    onClick={() => handleMockClickhouse('SHORT_CIRCUIT')}
                                                    style={{ flex: 1, padding: '4px 0', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 3, fontSize: 8, fontWeight: 'bold', cursor: 'pointer' }}
                                                >
                                                    + Short
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : activeTab3D === 'HTML5' ? (
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <input 
                                    type="text" 
                                    placeholder="Enter coordinate (e.g. 0x3C)..." 
                                    value={newCoordInput}
                                    onChange={(e) => setNewCoordInput(e.target.value)}
                                    style={{ flex: 1, padding: '8px 12px', background: '#101017', color: '#00ffff', border: '1px solid #1c1c28', borderRadius: 6, fontSize: 12, outline: 'none' }}
                                />
                                <button 
                                    onClick={handleRegisterEntity}
                                    style={{ padding: '8px 16px', background: '#00ffff', color: '#000', border: 'none', borderRadius: 6, fontWeight: 'bold', fontSize: 11, cursor: 'pointer' }}
                                >
                                    + Register Entity Tag
                                </button>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', background: '#0b0b12', border: '1px solid #1c1c28', borderRadius: 8, padding: 16 }}>
                                <div style={{ fontSize: 11, color: '#ffd700', marginBottom: 12, borderBottom: '1px solid #1c1c28', paddingBottom: 6 }}>
                                    Active Paired Tag HTML5 Coordinate Canvas Layout:
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                    {html5Entities.map((ent, idx) => (
                                        <div 
                                            key={idx} 
                                            style={{
                                                background: '#13131a', 
                                                border: '1px solid #00ffff40', 
                                                padding: '8px 12px', 
                                                borderRadius: 6,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 4
                                            }}
                                        >
                                            <span style={{ fontSize: 10, color: '#00ffff', fontWeight: 'bold' }}>
                                                Coord: {ent.hexCoord}
                                            </span>
                                            <span style={{ fontSize: 9, color: '#a855f7', fontFamily: 'monospace' }}>
                                                Entity: {ent.htmlEntity}
                                            </span>
                                            <div 
                                                style={{ fontSize: 10, color: '#fff', borderTop: '1px solid #242430', paddingTop: 4, marginTop: 4 }}
                                                dangerouslySetInnerHTML={{ __html: ent.tag }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
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
                        </>
                    )}
                </div>

                {/* ─── Center: Timeframe & Transition Orchestrator ─── */}
                <div style={{
                    background: '#0d0d12',
                    borderTop: '1px solid #1c1c28',
                    padding: 16,
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#00ffff', fontWeight: 'bold' }}>⏱️ TIMEFRAME & TRANSITION ORCHESTRATOR</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button 
                                onClick={() => setIsPlaying(!isPlaying)}
                                style={{
                                    background: isPlaying ? '#ef4444' : '#22c55e',
                                    color: '#000',
                                    border: 'none',
                                    padding: '4px 10px',
                                    borderRadius: 4,
                                    fontSize: 9,
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                {isPlaying ? '❚❚ Pause' : '▶ Play Sequence'}
                            </button>
                            <select 
                                value={transitionSpeed} 
                                onChange={(e) => setTransitionSpeed(parseFloat(e.target.value))}
                                style={{ background: '#040406', color: '#fff', border: '1px solid #1c1c28', fontSize: 9, padding: '2px 4px', borderRadius: 4 }}
                            >
                                <option value="0.5">0.5x Speed</option>
                                <option value="1.0">1.0x Speed</option>
                                <option value="2.0">2.0x Speed</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {/* Timeline & Compare Slider */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 4 }}>
                                    <span style={{ color: '#888' }}>Before/After Compare State</span>
                                    <span style={{ color: '#00ffff', fontWeight: 'bold' }}>{compareSlider}% Target Elevation</span>
                                </div>
                                <input 
                                    type="range" min="0" max="100" value={compareSlider}
                                    onChange={(e) => setCompareSlider(parseInt(e.target.value))}
                                    style={{ width: '100%', accentColor: '#00ffff', cursor: 'pointer' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, opacity: 0.5, marginTop: 2 }}>
                                    <span>Z:0 Baseline (Before)</span>
                                    <span>Z:20 Target (After)</span>
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 4 }}>
                                    <span style={{ color: '#888' }}>Animation Playhead</span>
                                    <span style={{ color: '#a855f7', fontWeight: 'bold' }}>T: {(playhead / 100).toFixed(2)}s</span>
                                </div>
                                <div style={{ width: '100%', height: 6, background: '#1c1c28', borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ width: `${playhead}%`, height: '100%', background: '#a855f7' }} />
                                </div>
                            </div>
                        </div>

                        {/* Script JSON Ingestion */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 9, color: '#ffd700' }}>Keyframe Event Script</span>
                                <button 
                                    onClick={handleExecuteScript}
                                    style={{
                                        background: '#a855f7',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '2px 8px',
                                        borderRadius: 4,
                                        fontSize: 8,
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Ingest Script
                                </button>
                            </div>
                            <textarea 
                                value={scriptInput}
                                onChange={(e) => setScriptInput(e.target.value)}
                                style={{
                                    width: '100%',
                                    height: 52,
                                    background: '#040406',
                                    color: '#a855f7',
                                    border: '1px solid #1c1c28',
                                    borderRadius: 4,
                                    fontSize: 8,
                                    fontFamily: 'monospace',
                                    padding: 4,
                                    resize: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
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

                {/* Ohm's Law Kinetic Override Tester */}
                <div style={{ background: '#07070a', border: '1px solid #1c1c28', padding: 14, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 10, color: '#00ffff', fontWeight: 'bold', letterSpacing: '0.05em' }}>⚡ KINETIC OVERRIDE SIMULATOR</div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 9 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Voltage (V):</span>
                            <span style={{ color: '#00ffff', fontWeight: 'bold' }}>{testVoltage.toFixed(1)} V</span>
                        </div>
                        <input 
                            type="range" min="0.5" max="10.0" step="0.5" value={testVoltage} 
                            onChange={(e) => setTestVoltage(parseFloat(e.target.value))} 
                            style={{ accentColor: '#00ffff', cursor: 'pointer', width: '100%' }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Resistance (R):</span>
                            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{testResistance.toFixed(2)} R</span>
                        </div>
                        <input 
                            type="range" min="0.1" max="5.0" step="0.1" value={testResistance} 
                            onChange={(e) => setTestResistance(parseFloat(e.target.value))} 
                            style={{ accentColor: '#ef4444', cursor: 'pointer', width: '100%' }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                            <span>Target Z-Anchor:</span>
                            <select 
                                value={testLane} 
                                onChange={(e) => setTestLane(e.target.value)} 
                                style={{ background: '#0a0a0f', border: '1px solid #1c1c28', color: '#fff', fontSize: 9, padding: 3, borderRadius: 4 }}
                            >
                                <option value="A_BASE">A_BASE (Z:0)</option>
                                <option value="A_AURA_RING">A_AURA_RING (Z:5)</option>
                                <option value="A_CENTER">A_CENTER (Z:10)</option>
                                <option value="A_OVERHEAD">A_OVERHEAD (Z:20)</option>
                            </select>
                        </div>

                        <button 
                            onClick={handleRunKineticOverride}
                            style={{
                                marginTop: 6,
                                padding: '8px',
                                background: '#a855f7',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: 10,
                                transition: 'all 0.2s'
                            }}
                        >
                            Execute Transition Pipeline
                        </button>
                    </div>

                    <hr style={{ border: 'none', borderBottom: '1px solid #1c1c28', margin: '4px 0' }} />

                    {/* Live State Variables Indicators */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, fontSize: 9 }}>
                        <div style={{ background: '#0a0a0f', padding: 6, borderRadius: 4 }}>
                            <span style={{ opacity: 0.5, display: 'block', fontSize: 8 }}>MEMORY INTEGRITY</span>
                            <strong style={{ color: '#22c55e' }}>{simState.memoryIntegrity.toFixed(1)}</strong>
                        </div>
                        <div style={{ background: '#0a0a0f', padding: 6, borderRadius: 4 }}>
                            <span style={{ opacity: 0.5, display: 'block', fontSize: 8 }}>SEMANTIC EROSION</span>
                            <strong style={{ color: '#ef4444' }}>{simState.semanticErosion.toFixed(1)}</strong>
                        </div>
                        <div style={{ background: '#0a0a0f', padding: 6, borderRadius: 4 }}>
                            <span style={{ opacity: 0.5, display: 'block', fontSize: 8 }}>SYSTEM HEAT</span>
                            <strong style={{ color: simState.systemHeat > 100 ? '#ef4444' : '#ffd700' }}>{simState.systemHeat.toFixed(1)}</strong>
                        </div>
                        <div style={{ background: '#0a0a0f', padding: 6, borderRadius: 4 }}>
                            <span style={{ opacity: 0.5, display: 'block', fontSize: 8 }}>MEMORY LEAKS</span>
                            <strong style={{ color: '#a855f7' }}>{simState.memoryLeaks}</strong>
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
