import React, { useState, useMemo } from 'react';

// Faction and Biome Constants
const BIOMES = ['LUSH_FOREST', 'TOXIC_SWAMP', 'GLACIER', 'DESERT', 'BARRENS'];
const ACTOR_TYPES = ['PLAYER', 'NPC', 'TOWN', 'NONE'];

const ModelPreview3D = ({ fileJson }) => {
    const canvasRef = React.useRef(null);

    React.useEffect(() => {
        let active = true;
        let angleX = 0;
        let angleY = 0;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let color = "#39ff14";
        let meshType = "cube";
        let scale = 1.0;
        try {
            const parsed = JSON.parse(fileJson);
            color = parsed.color || "#39ff14";
            meshType = parsed.meshType || "cube";
            scale = parsed.scale || 1.0;
        } catch (e) {
            // fallback
        }

        const render = () => {
            if (!active) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const size = 50 * scale;

            let vertices = [];
            let edges = [];

            if (meshType === "cube") {
                vertices = [
                    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
                    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
                ];
                edges = [
                    [0, 1], [1, 2], [2, 3], [3, 0],
                    [4, 5], [5, 6], [6, 7], [7, 4],
                    [0, 4], [1, 5], [2, 6], [3, 7]
                ];
            } else if (meshType === "sphere") {
                const latitudeBands = 8;
                const longitudeBands = 8;
                for (let lat = 0; lat <= latitudeBands; lat++) {
                    const theta = (lat * Math.PI) / latitudeBands;
                    const sinTheta = Math.sin(theta);
                    const cosTheta = Math.cos(theta);

                    for (let lon = 0; lon <= longitudeBands; lon++) {
                        const phi = (lon * 2 * Math.PI) / longitudeBands;
                        const sinPhi = Math.sin(phi);
                        const cosPhi = Math.cos(phi);

                        vertices.push([cosPhi * sinTheta, cosTheta, sinPhi * sinTheta]);
                    }
                }
                for (let lat = 0; lat < latitudeBands; lat++) {
                    for (let lon = 0; lon < longitudeBands; lon++) {
                        const first = (lat * (longitudeBands + 1)) + lon;
                        const second = first + longitudeBands + 1;
                        edges.push([first, first + 1]);
                        edges.push([first, second]);
                    }
                }
            } else if (meshType === "torus") {
                const radialSegments = 8;
                const tubularSegments = 8;
                const r = 0.4;
                const R = 0.7;
                for (let i = 0; i <= radialSegments; i++) {
                    const u = (i * 2 * Math.PI) / radialSegments;
                    for (let j = 0; j <= tubularSegments; j++) {
                        const v = (j * 2 * Math.PI) / tubularSegments;
                        const x = (R + r * Math.cos(v)) * Math.cos(u);
                        const y = (R + r * Math.cos(v)) * Math.sin(u);
                        const z = r * Math.sin(v);
                        vertices.push([x, y, z]);
                    }
                }
                for (let i = 0; i < radialSegments; i++) {
                    for (let j = 0; j < tubularSegments; j++) {
                        const first = (i * (tubularSegments + 1)) + j;
                        const second = first + tubularSegments + 1;
                        edges.push([first, first + 1]);
                        edges.push([first, second]);
                    }
                }
            } else {
                vertices = [];
                const segments = 10;
                for (let i = 0; i < segments; i++) {
                    const angle = (i * 2 * Math.PI) / segments;
                    vertices.push([Math.cos(angle) * 0.7, -0.9, Math.sin(angle) * 0.7]);
                }
                for (let i = 0; i < segments; i++) {
                    const angle = (i * 2 * Math.PI) / segments;
                    vertices.push([Math.cos(angle) * 0.7, 0.9, Math.sin(angle) * 0.7]);
                }
                for (let i = 0; i < segments; i++) {
                    const next = (i + 1) % segments;
                    edges.push([i, next]);
                    edges.push([i + segments, next + segments]);
                    edges.push([i, i + segments]);
                }
            }

            const radX = angleX * Math.PI / 180;
            const radY = angleY * Math.PI / 180;

            const cosX = Math.cos(radX);
            const sinX = Math.sin(radX);
            const cosY = Math.cos(radY);
            const sinY = Math.sin(radY);

            const projected = vertices.map(([x, y, z]) => {
                let y1 = y * cosX - z * sinX;
                let z1 = y * sinX + z * cosX;
                let x2 = x * cosY + z1 * sinY;
                let z2 = -x * sinY + z1 * cosY;
                const distance = 4;
                const factor = 200 / (distance + z2);
                const px = cx + x2 * size * factor * 0.5;
                const py = cy + y1 * size * factor * 0.5;
                return [px, py];
            });

            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            edges.forEach(([i, j]) => {
                if (projected[i] && projected[j]) {
                    ctx.beginPath();
                    ctx.moveTo(projected[i][0], projected[i][1]);
                    ctx.lineTo(projected[j][0], projected[j][1]);
                    ctx.stroke();
                }
            });

            angleX += 0.7;
            angleY += 1.1;

            requestAnimationFrame(render);
        };

        render();
        return () => { active = false; };
    }, [fileJson]);

    return (
        <div style={{
            background: '#15171e',
            border: '1px solid #232733',
            borderRadius: 8,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 12,
            marginBottom: 16
        }}>
            <span style={{ fontSize: 11, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Real-time 3D Object Preview</span>
            <canvas ref={canvasRef} width={240} height={180} style={{ display: 'block', background: '#0d0e12', borderRadius: 4 }} />
        </div>
    );
};

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

    const [virtualFiles, setVirtualFiles] = useState({
        "game_content/models/crystal_knight.json": JSON.stringify({
            name: "Crystal Knight",
            faction: "crystal",
            color: "#00eeff",
            roughness: 0.9,
            metalness: 0.1,
            emissive: "#00ffff",
            scale: 1.0,
            meshType: "sphere"
        }, null, 2),
        "game_content/models/toxic_hacker.json": JSON.stringify({
            name: "Toxic Hacker",
            faction: "toxic",
            color: "#39ff14",
            roughness: 0.5,
            metalness: 0.2,
            emissive: "#39ff14",
            scale: 1.1,
            meshType: "cube"
        }, null, 2),
        "game_content/models/void_weaver.json": JSON.stringify({
            name: "Void Weaver",
            faction: "void",
            color: "#a855f7",
            roughness: 0.8,
            metalness: 0.3,
            emissive: "#d946ef",
            scale: 1.0,
            meshType: "torus"
        }, null, 2),
        "game_content/models/druid_scout.json": JSON.stringify({
            name: "Druid Scout",
            faction: "druid",
            color: "#ffcc00",
            roughness: 0.95,
            metalness: 0.05,
            emissive: "#ffcc00",
            scale: 0.95,
            meshType: "cylinder"
        }, null, 2),
        "game_content/configs/gameplay_rules.json": JSON.stringify({
            baseEnergy: 50,
            entropyRate: 0.05,
            maxTurns: 30,
            collapseStartTurn: 8
        }, null, 2)
    });
    const [selectedFile, setSelectedFile] = useState("game_content/models/crystal_knight.json");
    const [fileContent, setFileContent] = useState(virtualFiles["game_content/models/crystal_knight.json"]);

    const getActorColor = (actorType) => {
        if (actorType === 'NONE') return 'transparent';
        try {
            if (actorType === 'PLAYER') {
                const parsed = JSON.parse(virtualFiles["game_content/models/crystal_knight.json"]);
                return parsed.color || '#00eeff';
            } else if (actorType === 'NPC') {
                const parsed = JSON.parse(virtualFiles["game_content/models/toxic_hacker.json"]);
                return parsed.color || '#39ff14';
            }
        } catch (e) {
            // fallback
        }
        return actorType === 'PLAYER' ? '#00eeff' : '#39ff14';
    };

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
                                        background: getActorColor(node.actorType),
                                        padding: '2px 6px',
                                        borderRadius: 4,
                                        marginTop: 4,
                                        textShadow: '0 0 4px rgba(0,0,0,0.8)'
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

            {/* ─── RIGHT SIDEBAR: Game Content File Manager & Editor ─── */}
            <div style={{
                width: 360,
                background: '#15171e',
                borderLeft: '1px solid #232733',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box'
            }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #232733' }}>
                    <h2 style={{ margin: 0, fontSize: 16, color: '#00eeff', letterSpacing: 0.5 }}>📂 GAME CONTENT MANAGER</h2>
                    <span style={{ fontSize: 11, opacity: 0.6 }}>Virtual Assets & Config Overwriter</span>
                </div>

                {/* File Explorer Tree */}
                <div style={{ padding: '12px 20px', borderBottom: '1px solid #232733', background: '#0d0e12' }}>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 8, fontWeight: 'bold' }}>WORKSPACE HIERARCHY</div>
                    
                    {/* Models folder */}
                    <div style={{ marginLeft: 4, marginBottom: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 'bold', color: '#ffd700', marginBottom: 4 }}>📂 game_content/models</div>
                        {Object.keys(virtualFiles).filter(f => f.includes('models/')).map(file => {
                            const isSelected = selectedFile === file;
                            const displayName = file.split('/').pop();
                            return (
                                <div 
                                    key={file}
                                    onClick={() => {
                                        setSelectedFile(file);
                                        setFileContent(virtualFiles[file]);
                                    }}
                                    style={{
                                        fontSize: 11,
                                        padding: '4px 8px',
                                        marginLeft: 12,
                                        borderRadius: 4,
                                        background: isSelected ? 'rgba(0, 238, 255, 0.15)' : 'transparent',
                                        color: isSelected ? '#00eeff' : '#ccc',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    <span style={{ marginRight: 6 }}>📄</span> {displayName}
                                </div>
                            );
                        })}
                    </div>

                    {/* Configs folder */}
                    <div style={{ marginLeft: 4 }}>
                        <div style={{ fontSize: 12, fontWeight: 'bold', color: '#ffd700', marginBottom: 4 }}>📂 game_content/configs</div>
                        {Object.keys(virtualFiles).filter(f => f.includes('configs/')).map(file => {
                            const isSelected = selectedFile === file;
                            const displayName = file.split('/').pop();
                            return (
                                <div 
                                    key={file}
                                    onClick={() => {
                                        setSelectedFile(file);
                                        setFileContent(virtualFiles[file]);
                                    }}
                                    style={{
                                        fontSize: 11,
                                        padding: '4px 8px',
                                        marginLeft: 12,
                                        borderRadius: 4,
                                        background: isSelected ? 'rgba(0, 238, 255, 0.15)' : 'transparent',
                                        color: isSelected ? '#00eeff' : '#ccc',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    <span style={{ marginRight: 6 }}>📄</span> {displayName}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Live 3D projection canvas for models */}
                <div style={{ padding: '16px 20px 0 20px', flexShrink: 0 }}>
                    {selectedFile.includes('models/') && (
                        <ModelPreview3D fileJson={fileContent} />
                    )}
                </div>

                {/* File Editor Codearea */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: '#ffd700', fontFamily: 'monospace' }}>
                            {selectedFile}
                        </span>
                        <span style={{ fontSize: 10, opacity: 0.5 }}>JSON Mode</span>
                    </div>
                    <textarea 
                        value={fileContent}
                        onChange={(e) => setFileContent(e.target.value)}
                        style={{
                            flex: 1,
                            width: '100%',
                            background: '#0d0e12',
                            color: '#00ff00',
                            border: '1px solid #232733',
                            borderRadius: 6,
                            padding: 10,
                            fontFamily: 'monospace',
                            fontSize: 11,
                            resize: 'none',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* Overwrite trigger bar */}
                <div style={{ padding: '16px 20px', borderTop: '1px solid #232733', background: '#111319' }}>
                    <button 
                        onClick={() => {
                            try {
                                const parsed = JSON.parse(fileContent);
                                setVirtualFiles(prev => ({
                                    ...prev,
                                    [selectedFile]: JSON.stringify(parsed, null, 2)
                                }));
                                setLogMessages(prev => [`[CMS] File '${selectedFile}' overwritten successfully.`, ...prev]);
                            } catch (e) {
                                setLogMessages(prev => [`[ERROR] Failed to overwrite '${selectedFile}': Invalid JSON syntax.`, ...prev]);
                            }
                        }}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: '#00eeff',
                            color: '#000',
                            border: 'none',
                            borderRadius: 4,
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            boxShadow: '0 0 10px rgba(0, 238, 255, 0.3)'
                        }}
                    >
                        Preísať súbor / Overwrite File
                    </button>
                </div>
            </div>
        </div>
    );
}
