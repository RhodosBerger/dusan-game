import React, { useState, useMemo } from 'react';

// Faction and Biome Constants
const BIOMES = ['LUSH_FOREST', 'TOXIC_SWAMP', 'GLACIER', 'DESERT', 'BARRENS'];
const ACTOR_TYPES = ['PLAYER', 'NPC', 'TOWN', 'NONE'];

const ModelPreview3D = ({ fileJson, selectedFile }) => {
    const canvasRef = React.useRef(null);
    const anglesRef = React.useRef({ x: 0, y: 0 });

    React.useEffect(() => {
        let active = true;
        let angleX = anglesRef.current.x;
        let angleY = anglesRef.current.y;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let color = "#39ff14";
        let meshType = "cube";
        let scale = 1.0;

        if (selectedFile && selectedFile.includes('configs/')) {
            meshType = "gear";
            color = "#ffd700";
        } else {
            try {
                const parsed = JSON.parse(fileJson);
                color = parsed.color || "#39ff14";
                meshType = parsed.meshType || "cube";
                scale = parsed.scale || 1.0;
            } catch (e) {
                // fallback
            }
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
            } else if (meshType === "gear") {
                const teeth = 12;
                const innerRad = 0.5;
                const outerRad = 0.85;
                const depth = 0.25;
                for (let i = 0; i < teeth * 2; i++) {
                    const angle = (i * Math.PI) / teeth;
                    const r = (i % 2 === 0) ? outerRad : innerRad;
                    vertices.push([Math.cos(angle) * r, Math.sin(angle) * r, -depth]);
                    vertices.push([Math.cos(angle) * r, Math.sin(angle) * r, depth]);
                }
                for (let i = 0; i < teeth * 2; i++) {
                    const next = ((i + 1) % (teeth * 2));
                    const idx1 = i * 2;
                    const idx2 = next * 2;
                    edges.push([idx1, idx2]);
                    edges.push([idx1 + 1, idx2 + 1]);
                    edges.push([idx1, idx1 + 1]);
                }
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
        return () => {
            active = false;
            anglesRef.current = { x: angleX, y: angleY };
        };
    }, [fileJson, selectedFile]);

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

const KeyframePreview3D = ({ formula, variant, elementType }) => {
    const canvasRef = React.useRef(null);
    const anglesRef = React.useRef({ x: 0, y: 0 });

    React.useEffect(() => {
        let active = true;
        let angleX = anglesRef.current.x;
        let angleY = anglesRef.current.y;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = () => {
            if (!active) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            
            const t = (Date.now() % 1600) / 1600;
            const mult = variant * 0.5;

            let offsetX = 0;
            let offsetY = 0;
            let offsetZ = 0;
            let scaleFactor = 1.0;
            let opacity = 1.0;
            let rotationY = 0;

            if (formula === 'slow_walk') {
                offsetY = Math.sin(t * Math.PI) * 1.0 * mult;
                scaleFactor = 1.0 + Math.sin(t * Math.PI) * 0.15 * mult;
            } else if (formula === 'slime_trail') {
                offsetX = Math.sin(t * Math.PI * 2 * 2.5) * 0.35 * mult;
                rotationY = Math.cos(t * Math.PI * 2 * 2.5) * 0.45;
            } else if (formula === 'teleport_dash') {
                if (t < 0.2) {
                    opacity = 1.0 - (t / 0.2);
                    scaleFactor = 1.0 - (t / 0.2);
                } else if (t >= 0.2 && t < 0.8) {
                    opacity = 0;
                    scaleFactor = 0;
                } else {
                    opacity = (t - 0.8) / 0.2;
                    scaleFactor = (t - 0.8) / 0.2;
                }
            } else if (formula === 'earth_glide') {
                offsetY = -Math.sin(t * Math.PI) * 0.8 * mult;
                scaleFactor = 1.0 - Math.sin(t * Math.PI) * 0.35 * mult;
            } else if (formula === 'helix_drill') {
                offsetX = Math.cos(t * Math.PI * 4) * 0.3 * mult;
                offsetZ = Math.sin(t * Math.PI * 4) * 0.3 * mult;
                offsetY = (t - 0.5) * 0.6 * mult;
                rotationY = t * Math.PI * 4;
            } else if (formula === 'linear_dash') {
                offsetX = (t - 0.5) * 1.5 * mult;
            } else if (formula === 'step_clamber') {
                offsetY = Math.floor(t * 4) * 0.25 * mult;
            } else if (formula === 'phase_fade') {
                opacity = 1.0 - t * 0.6 * mult;
            } else if (formula === 'friction_brake') {
                offsetX = Math.sin(t * Math.PI / 2) * 1.2 * mult;
            } else if (formula === 'wind_drift') {
                offsetX = (Math.random() - 0.5) * 0.15 * mult;
                offsetZ = (Math.random() - 0.5) * 0.15 * mult;
            } else if (formula === 'charge_surge') {
                offsetX = Math.pow(t, 3) * 1.6 * mult;
            } else if (formula === 'entropy_decay') {
                offsetX = Math.cos(t * 8) * (1 - t) * 0.8 * mult;
                offsetZ = Math.sin(t * 8) * (1 - t) * 0.8 * mult;
            }

            const size = 30 * scaleFactor;

            let vertices = [];
            let edges = [];

            if (elementType === 'NPC' || elementType === 'CHEST') {
                vertices = [
                    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
                    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
                ];
                edges = [
                    [0, 1], [1, 2], [2, 3], [3, 0],
                    [4, 5], [5, 6], [6, 7], [7, 4],
                    [0, 4], [1, 5], [2, 6], [3, 7]
                ];
            } else if (elementType === 'PLAYER') {
                const segments = 8;
                for (let i = 0; i < segments; i++) {
                    const angle = (i * 2 * Math.PI) / segments;
                    vertices.push([Math.cos(angle) * 0.6, -0.8, Math.sin(angle) * 0.6]);
                }
                for (let i = 0; i < segments; i++) {
                    const angle = (i * 2 * Math.PI) / segments;
                    vertices.push([Math.cos(angle) * 0.6, 0.8, Math.sin(angle) * 0.6]);
                }
                for (let i = 0; i < segments; i++) {
                    const next = (i + 1) % segments;
                    edges.push([i, next]);
                    edges.push([i + segments, next + segments]);
                    edges.push([i, i + segments]);
                }
            } else {
                const segments = 8;
                for (let i = 0; i < segments; i++) {
                    const angle = (i * 2 * Math.PI) / segments;
                    const r = (i % 2 === 0) ? 0.8 : 0.4;
                    vertices.push([Math.cos(angle) * r, -0.2, Math.sin(angle) * r]);
                    vertices.push([Math.cos(angle) * r, 0.2, Math.sin(angle) * r]);
                }
                for (let i = 0; i < segments * 2; i += 2) {
                    const next = (i + 2) % (segments * 2);
                    edges.push([i, next]);
                    edges.push([i + 1, next + 1]);
                    edges.push([i, i + 1]);
                }
            }

            const radX = angleX * Math.PI / 180;
            const radY = (angleY + rotationY * 180 / Math.PI) * Math.PI / 180;

            const cosX = Math.cos(radX);
            const sinX = Math.sin(radX);
            const cosY = Math.cos(radY);
            const sinY = Math.sin(radY);

            const color = elementType === 'PLAYER' ? '#00eeff' : elementType === 'NPC' ? '#39ff14' : elementType === 'TRAP' ? '#a855f7' : '#ffd700';

            const projected = vertices.map(([vx, vy, vz]) => {
                let y1 = vy * cosX - vz * sinX;
                let z1 = vy * sinX + vz * cosX;
                let x2 = vx * cosY + z1 * sinY;
                let z2 = -vx * sinY + z1 * cosY;

                x2 += offsetX;
                y1 -= offsetY;
                z2 += offsetZ;

                const distance = 4;
                const factor = 180 / (distance + z2);
                const px = cx + x2 * size * factor * 0.5;
                const py = cy + y1 * size * factor * 0.5;
                return [px, py];
            });

            ctx.strokeStyle = color;
            ctx.globalAlpha = opacity;
            ctx.lineWidth = 1.8;
            ctx.shadowColor = color;
            ctx.shadowBlur = 6;
            
            edges.forEach(([i, j]) => {
                if (projected[i] && projected[j]) {
                    ctx.beginPath();
                    ctx.moveTo(projected[i][0], projected[i][1]);
                    ctx.lineTo(projected[j][0], projected[j][1]);
                    ctx.stroke();
                }
            });

            angleX += 0.5;
            angleY += 0.8;

            requestAnimationFrame(render);
        };

        render();
        return () => {
            active = false;
            anglesRef.current = { x: angleX, y: angleY };
        };
    }, [formula, variant, elementType]);

    return (
        <div style={{
            background: '#0d0e12',
            border: '1px solid #232733',
            borderRadius: 8,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 10,
            marginBottom: 16
        }}>
            <span style={{ fontSize: 10, color: '#ffd700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Formula Trajectory 3D Preview</span>
            <canvas ref={canvasRef} width={240} height={160} style={{ display: 'block', background: '#07070a', borderRadius: 4 }} />
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
        }, null, 2),
        "game_content/configs/database_sets.json": JSON.stringify({
            registers: [
                { address: "0x3C", description: "Active Combat Phase Buffer Index", value: "0x00FF08" },
                { address: "0x4F", description: "Ohmic Entropy Feedback Thread State", value: "0x120C1F" },
                { address: "0x5A", description: "Voltage Surge Combo Register", value: "0x000256" }
            ],
            procedures: [
                { id: "proc_combos", name: "Gauss-Seidel combo chain resolver", status: "OPTIMAL" },
                { id: "proc_traps", name: "Collision-free trap spawner guard", status: "ACTIVE" },
                { id: "proc_mmr", name: "Redis MMR matchmaking pairings scheduler", status: "STANDBY" }
            ]
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

    // Keyframe Backoffice Panel States (Goal 6)
    const [activeRightTab, setActiveRightTab] = useState('files');
    const [selectedFormula, setSelectedFormula] = useState('slow_walk');
    const [selectedVariant, setSelectedVariant] = useState(1); // 1 to 30
    const [selectedElementType, setSelectedElementType] = useState('PLAYER');

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

    const loadMapPreset = (type) => {
        let presetGrid = [];
        if (type === 'glacial') {
            presetGrid = Array.from({ length: 63 }).map((_, i) => {
                const m = Math.floor(i / 7);
                const s = i % 7;
                const isGlacier = (m + s) % 3 !== 0;
                return {
                    macroIndex: m,
                    subIndex: s,
                    biome: isGlacier ? 'GLACIER' : 'LUSH_FOREST',
                    walkable: s !== 0,
                    hazardIndex: isGlacier ? 0.05 : 0.1,
                    friction: isGlacier ? 1.3 : 0.5,
                    actorType: (m === 0 && s === 3) ? 'PLAYER' : 'NONE',
                    temperature: isGlacier ? -10 : 10,
                    humidity: 30,
                    conductivity: 0.2,
                    estimatedPower: '10W'
                };
            });
            setLogMessages(prev => ['[CMS] Loaded category: Glacial Sanctuary (optimized for Crystal Knight).', ...prev]);
        } else if (type === 'toxic') {
            presetGrid = Array.from({ length: 63 }).map((_, i) => {
                const m = Math.floor(i / 7);
                const s = i % 7;
                const isToxic = (m + s) % 2 === 0;
                return {
                    macroIndex: m,
                    subIndex: s,
                    biome: isToxic ? 'TOXIC_SWAMP' : 'BARRENS',
                    walkable: s !== 1,
                    hazardIndex: isToxic ? 0.6 : 0.25,
                    friction: isToxic ? 0.15 : 0.8,
                    actorType: (m === 4 && s === 3) ? 'NPC' : 'NONE',
                    temperature: 25,
                    humidity: 85,
                    conductivity: 0.9,
                    estimatedPower: '35W'
                };
            });
            setLogMessages(prev => ['[CMS] Loaded category: Toxic Hive (optimized for Toxic Hacker).', ...prev]);
        } else if (type === 'druid') {
            presetGrid = Array.from({ length: 63 }).map((_, i) => {
                const m = Math.floor(i / 7);
                const s = i % 7;
                const isForest = (m + s) % 4 !== 0;
                return {
                    macroIndex: m,
                    subIndex: s,
                    biome: isForest ? 'LUSH_FOREST' : 'GLACIER',
                    walkable: true,
                    hazardIndex: 0.1,
                    friction: 0.45,
                    actorType: (m === 8 && s === 3) ? 'PLAYER' : 'NONE',
                    temperature: 18,
                    humidity: 60,
                    conductivity: 0.4,
                    estimatedPower: '18W'
                };
            });
            setLogMessages(prev => ['[CMS] Loaded category: Druid\'s Glade (optimized for Druid Scout).', ...prev]);
        } else {
            presetGrid = Array.from({ length: 63 }).map((_, i) => {
                const m = Math.floor(i / 7);
                const s = i % 7;
                const isDesert = (m + s) % 2 === 0;
                return {
                    macroIndex: m,
                    subIndex: s,
                    biome: isDesert ? 'DESERT' : 'BARRENS',
                    walkable: s !== 5,
                    hazardIndex: 0.4,
                    friction: 0.3,
                    actorType: (m === 6 && s === 3) ? 'NPC' : 'NONE',
                    temperature: 42,
                    humidity: 10,
                    conductivity: 0.1,
                    estimatedPower: '25W'
                };
            });
            setLogMessages(prev => ['[CMS] Loaded category: Void Crucible (optimized for Void Weaver).', ...prev]);
        }
        setEditorGrid(presetGrid);
        setSelectedNode(null);
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

                {/* Tactical Map Category Presets */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #232733', background: '#111319' }}>
                    <div style={{ fontSize: 11, color: '#ffd700', marginBottom: 8, fontWeight: 'bold' }}>TACTICAL MAP PRESETS</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button 
                            onClick={() => loadMapPreset('glacial')}
                            style={{ padding: '6px', fontSize: 10, background: '#1d202b', border: '1px solid #333', color: '#00eeff', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            Glacial Sanctuary
                        </button>
                        <button 
                            onClick={() => loadMapPreset('toxic')}
                            style={{ padding: '6px', fontSize: 10, background: '#1d202b', border: '1px solid #333', color: '#39ff14', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            Toxic Hive
                        </button>
                        <button 
                            onClick={() => loadMapPreset('druid')}
                            style={{ padding: '6px', fontSize: 10, background: '#1d202b', border: '1px solid #333', color: '#ffcc00', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            Druid's Glade
                        </button>
                        <button 
                            onClick={() => loadMapPreset('void')}
                            style={{ padding: '6px', fontSize: 10, background: '#1d202b', border: '1px solid #333', color: '#a855f7', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            Void Crucible
                        </button>
                    </div>
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
                {/* Right Sidebar Tab Selector */}
                <div style={{ display: 'flex', borderBottom: '1px solid #232733', background: '#111319' }}>
                    <button 
                        onClick={() => setActiveRightTab('files')}
                        style={{
                            flex: 1,
                            padding: '12px 6px',
                            background: activeRightTab === 'files' ? 'transparent' : '#15171e',
                            color: activeRightTab === 'files' ? '#00eeff' : '#888',
                            border: 'none',
                            borderBottom: activeRightTab === 'files' ? '2px solid #00eeff' : 'none',
                            fontSize: 11,
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        📂 FILE EXPLORER
                    </button>
                    <button 
                        onClick={() => setActiveRightTab('keyframes')}
                        style={{
                            flex: 1,
                            padding: '12px 6px',
                            background: activeRightTab === 'keyframes' ? 'transparent' : '#15171e',
                            color: activeRightTab === 'keyframes' ? '#ffd700' : '#888',
                            border: 'none',
                            borderBottom: activeRightTab === 'keyframes' ? '2px solid #ffd700' : 'none',
                            fontSize: 11,
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        🎬 KEYFRAMES BACKOFFICE
                    </button>
                </div>

                {activeRightTab === 'files' ? (
                    <>
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

                        {/* Live 3D projection canvas for models or configs */}
                        <div style={{ padding: '16px 20px 0 20px', flexShrink: 0 }}>
                            {selectedFile && (
                                <ModelPreview3D fileJson={fileContent} selectedFile={selectedFile} />
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
                                Prepísať súbor / Overwrite File
                            </button>
                        </div>
                    </>
                ) : (
                    /* Keyframes Backoffice dashboard */
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px', overflowY: 'auto' }}>
                        <div style={{ marginBottom: 16 }}>
                            <h3 style={{ margin: 0, fontSize: 14, color: '#ffd700' }}>🎬 KEYFRAME TIMELINE EDITOR</h3>
                            <span style={{ fontSize: 10, opacity: 0.6 }}>Ohmic Walk Formulas & Combinatorics</span>
                        </div>

                        {/* Live 3D Keyframe Trajectory Previewer */}
                        <KeyframePreview3D 
                            formula={selectedFormula} 
                            variant={selectedVariant} 
                            elementType={selectedElementType} 
                        />

                        {/* Element Filter */}
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ display: 'block', fontSize: 10, color: '#888', marginBottom: 4 }}>ELEMENT FILTER</label>
                            <select 
                                value={selectedElementType}
                                onChange={(e) => setSelectedElementType(e.target.value)}
                                style={{ width: '100%', padding: '6px', background: '#0d0e12', color: '#fff', border: '1px solid #333', borderRadius: 4, fontSize: 11 }}
                            >
                                <option value="PLAYER">Hero / Player Thread</option>
                                <option value="NPC">Monster / NPC Slayer</option>
                                <option value="TRAP">Trap Element</option>
                                <option value="CHEST">Loot Chest Element</option>
                            </select>
                        </div>

                        {/* Formulas Selector (12 equations) */}
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ display: 'block', fontSize: 10, color: '#888', marginBottom: 4 }}>WALK FORMULA (12 EQUATIONS)</label>
                            <select 
                                value={selectedFormula}
                                onChange={(e) => setSelectedFormula(e.target.value)}
                                style={{ width: '100%', padding: '6px', background: '#0d0e12', color: '#fff', border: '1px solid #333', borderRadius: 4, fontSize: 11 }}
                            >
                                <option value="slow_walk">Formula 1: Bezier Hop Leap (Crystal)</option>
                                <option value="slime_trail">Formula 2: Slither Sine wave (Toxic)</option>
                                <option value="teleport_dash">Formula 3: Quantum Warp implosion (Void)</option>
                                <option value="earth_glide">Formula 4: Druid Sinking Pop-up</option>
                                <option value="helix_drill">Formula 5: Helical Spiral Roll</option>
                                <option value="linear_dash">Formula 6: Constant Velocity Glide</option>
                                <option value="step_clamber">Formula 7: Discrete Height Stagger</option>
                                <option value="phase_fade">Formula 8: Linear Transparency Shift</option>
                                <option value="friction_brake">Formula 9: Decelerating Ease-Out Slide</option>
                                <option value="wind_drift">Formula 10: Random Jitter Turbulence</option>
                                <option value="charge_surge">Formula 11: Exponential Acceleration Spike</option>
                                <option value="entropy_decay">Formula 12: Shrinking Orbit Spiral</option>
                            </select>
                        </div>

                        {/* Variant Selection (30 variants) */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 10, color: '#888', marginBottom: 4 }}>
                                VARIANT MULTIPLIER (30 OPTIONS)
                            </label>
                            <input 
                                type="range" 
                                min="1" 
                                max="30" 
                                value={selectedVariant} 
                                onChange={(e) => setSelectedVariant(parseInt(e.target.value))}
                                style={{ width: '100%', accentColor: '#ffd700' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#ffd700', marginTop: 4 }}>
                                <span>Variant: #{selectedVariant}/30</span>
                                <span>Multiplier: {(selectedVariant * 0.5).toFixed(1)}x</span>
                            </div>
                        </div>

                        {/* Combinatorics stats */}
                        <div style={{ background: '#0d0e12', border: '1px solid #333', borderRadius: 6, padding: '10px', marginBottom: 16 }}>
                            <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', marginBottom: 6 }}>Combinatorics Summary</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: 11 }}>
                                <div>Formulas: <span style={{ color: '#fff', fontWeight: 'bold' }}>12</span></div>
                                <div>Variants: <span style={{ color: '#fff', fontWeight: 'bold' }}>30</span></div>
                                <div style={{ gridColumn: 'span 2', color: '#00eeff' }}>
                                    Total Instances: <span style={{ fontWeight: 'bold' }}>360 combinations</span>
                                </div>
                            </div>
                        </div>

                        {/* Calculated Keyframe Coordinates Table */}
                        <div style={{ flex: 1, minHeight: 180, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>GENERATED TIMELINE STEPS (12 KEYFRAMES)</div>
                            <div style={{ flex: 1, overflowY: 'auto', background: '#0d0e12', border: '1px solid #232733', borderRadius: 6, padding: '6px' }}>
                                <table style={{ width: '100%', fontSize: 9, fontFamily: 'monospace', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #333', color: '#ffd700' }}>
                                            <th style={{ textAlign: 'left', padding: '4px' }}>Time</th>
                                            <th style={{ textAlign: 'left', padding: '4px' }}>Coord Offset [X, Y, Z]</th>
                                            <th style={{ textAlign: 'right', padding: '4px' }}>Scale</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: 12 }).map((_, i) => {
                                            const t = i / 11;
                                            let x = 0, y = 0, z = 0, scale = 1.0;
                                            const mult = selectedVariant * 0.5;

                                            if (selectedFormula === 'slow_walk') {
                                                y = Math.sin(t * Math.PI) * 1.5 * mult;
                                                scale = 1.0 + Math.sin(t * Math.PI) * 0.15 * mult;
                                            } else if (selectedFormula === 'slime_trail') {
                                                x = Math.sin(t * Math.PI * 2 * 2.5) * 0.45 * mult;
                                            } else if (selectedFormula === 'teleport_dash') {
                                                y = Math.sin(t * Math.PI) * 0.2;
                                                scale = t < 0.2 ? (1.0 - t/0.2) : t > 0.8 ? (t - 0.8)/0.2 : 0;
                                            } else if (selectedFormula === 'earth_glide') {
                                                y = -Math.sin(t * Math.PI) * 0.9 * mult;
                                            } else if (selectedFormula === 'helix_drill') {
                                                x = Math.cos(t * Math.PI * 4) * 0.3 * mult;
                                                z = Math.sin(t * Math.PI * 4) * 0.3 * mult;
                                                y = t * mult;
                                            } else if (selectedFormula === 'linear_dash') {
                                                x = t * 4.0 * mult;
                                            } else if (selectedFormula === 'step_clamber') {
                                                y = Math.floor(t * 4) * 0.5 * mult;
                                            } else if (selectedFormula === 'phase_fade') {
                                                scale = 1.0 - t * 0.5 * mult;
                                            } else if (selectedFormula === 'friction_brake') {
                                                x = Math.sin(t * Math.PI / 2) * 3.0 * mult;
                                            } else if (selectedFormula === 'wind_drift') {
                                                x = (Math.random() - 0.5) * 0.3 * mult;
                                                z = (Math.random() - 0.5) * 0.3 * mult;
                                            } else if (selectedFormula === 'charge_surge') {
                                                x = Math.pow(t, 3) * 5.0 * mult;
                                            } else if (selectedFormula === 'entropy_decay') {
                                                x = Math.cos(t * 8) * (1 - t) * mult;
                                                z = Math.sin(t * 8) * (1 - t) * mult;
                                            }

                                            return (
                                                <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                                                    <td style={{ padding: '4px', color: '#888' }}>{(t * 100).toFixed(0)}%</td>
                                                    <td style={{ padding: '4px', color: '#fff' }}>
                                                        [{x.toFixed(2)}, {y.toFixed(2)}, {z.toFixed(2)}]
                                                    </td>
                                                    <td style={{ padding: '4px', textAlign: 'right', color: '#00ff00' }}>
                                                        {scale.toFixed(2)}x
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
