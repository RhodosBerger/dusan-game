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

    // Placement Editor states
    const [placedHelpers, setPlacedHelpers] = useState([
        { id: 'helper_1', type: 'TOWER', chunkId: 0, blockId: 3, altitude: 'STANDARD_HEX', yPos: 0.0 },
        { id: 'helper_2', type: 'FLAG', chunkId: 1, blockId: 5, altitude: 'HIGH_OVERCLOCK', yPos: 2.0 }
    ]);
    const [selectedHelperType, setSelectedHelperType] = useState('TOWER');
    const [selectedAltitude, setSelectedAltitude] = useState('STANDARD_HEX');
    const [isStaggeredLoading, setIsStaggeredLoading] = useState(false);

    // Engine regulators state (Goal 6/Handoff)
    const [enabledDraco, setEnabledDraco] = useState(true);
    const [enabledTurnBalancer, setEnabledTurnBalancer] = useState(true);
    const [enabledTransparency, setEnabledTransparency] = useState(true);
    const [enabledGodRays, setEnabledGodRays] = useState(true);
    const [enabledItemLoaders, setEnabledItemLoaders] = useState(true);
    const [enabledOpenVINO, setEnabledOpenVINO] = useState(true);
    const [enabledDeltaCompression, setEnabledDeltaCompression] = useState(true);

    // Timeline Cutting Strip states
    const [selectedFrame, setSelectedFrame] = useState(0); // 0 to 11 (12 keyframes)

    // Node Composer & Texture Department Simulation states (Department Simulation)
    const [selectedDept, setSelectedDept] = useState('ART_ASSETS');
    const [selectedTexture, setSelectedTexture] = useState('moss_base');
    const [textureBoost, setTextureBoost] = useState(true);
    const [textureBevel, setTextureBevel] = useState(false);
    const [textureSpecular, setTextureSpecular] = useState(true);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            window.activeSovereignFormulas = window.activeSovereignFormulas || {};
            window.activeSovereignFormulas[selectedElementType] = {
                formula: selectedFormula,
                variant: selectedVariant
            };
        }
    }, [selectedFormula, selectedVariant, selectedElementType]);

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
                            padding: '12px 4px',
                            background: activeRightTab === 'files' ? 'transparent' : '#15171e',
                            color: activeRightTab === 'files' ? '#00eeff' : '#888',
                            border: 'none',
                            borderBottom: activeRightTab === 'files' ? '2px solid #00eeff' : 'none',
                            fontSize: 10,
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        📂 FILES
                    </button>
                    <button 
                        onClick={() => setActiveRightTab('keyframes')}
                        style={{
                            flex: 1,
                            padding: '12px 4px',
                            background: activeRightTab === 'keyframes' ? 'transparent' : '#15171e',
                            color: activeRightTab === 'keyframes' ? '#ffd700' : '#888',
                            border: 'none',
                            borderBottom: activeRightTab === 'keyframes' ? '2px solid #ffd700' : 'none',
                            fontSize: 10,
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        🎬 KEYFRAMES
                    </button>
                    <button 
                        onClick={() => setActiveRightTab('placement')}
                        style={{
                            flex: 1,
                            padding: '12px 4px',
                            background: activeRightTab === 'placement' ? 'transparent' : '#15171e',
                            color: activeRightTab === 'placement' ? '#ff4757' : '#888',
                            border: 'none',
                            borderBottom: activeRightTab === 'placement' ? '2px solid #ff4757' : 'none',
                            fontSize: 10,
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        🏗️ PLACEMENT
                    </button>
                    <button 
                        onClick={() => setActiveRightTab('timeline_strip')}
                        style={{
                            flex: 1,
                            padding: '12px 4px',
                            background: activeRightTab === 'timeline_strip' ? 'transparent' : '#15171e',
                            color: activeRightTab === 'timeline_strip' ? '#ffa500' : '#888',
                            border: 'none',
                            borderBottom: activeRightTab === 'timeline_strip' ? '2px solid #ffa500' : 'none',
                            fontSize: 10,
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        🎞️ TIMELINE
                    </button>
                    <button 
                        onClick={() => setActiveRightTab('node_composer')}
                        style={{
                            flex: 1,
                            padding: '12px 4px',
                            background: activeRightTab === 'node_composer' ? 'transparent' : '#15171e',
                            color: activeRightTab === 'node_composer' ? '#a855f7' : '#888',
                            border: 'none',
                            borderBottom: activeRightTab === 'node_composer' ? '2px solid #a855f7' : 'none',
                            fontSize: 10,
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        🎨 NODES
                    </button>
                </div>

                {activeRightTab === 'files' && (
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
                )}
                {activeRightTab === 'keyframes' && (
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
                {activeRightTab === 'placement' && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px', overflowY: 'auto' }}>
                        <div style={{ marginBottom: 16 }}>
                            <h3 style={{ margin: 0, fontSize: 14, color: '#ff4757' }}>🏗️ HELPER PLACEMENT & VPC SNAP</h3>
                            <span style={{ fontSize: 10, opacity: 0.6 }}>Low-Poly Snapping & Staggered Initialization</span>
                        </div>

                        {/* Helper Configuration */}
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ display: 'block', fontSize: 10, color: '#888', marginBottom: 4 }}>HELPER TYPE</label>
                            <select 
                                value={selectedHelperType}
                                onChange={(e) => setSelectedHelperType(e.target.value)}
                                style={{ width: '100%', padding: '6px', background: '#0d0e12', color: '#fff', border: '1px solid #333', borderRadius: 4, fontSize: 11 }}
                            >
                                <option value="TOWER">Low-Poly Defense Tower</option>
                                <option value="FLAG">Tactical Flag Indicator</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <label style={{ display: 'block', fontSize: 10, color: '#888', marginBottom: 4 }}>VPC ALTITUDE SNAP PROFILE</label>
                            <select 
                                value={selectedAltitude}
                                onChange={(e) => setSelectedAltitude(e.target.value)}
                                style={{ width: '100%', padding: '6px', background: '#0d0e12', color: '#fff', border: '1px solid #333', borderRadius: 4, fontSize: 11 }}
                            >
                                <option value="LOW_GROUND">LOW_GROUND (y = -2.0)</option>
                                <option value="STANDARD_HEX">STANDARD_HEX (y = 0.0)</option>
                                <option value="HIGH_OVERCLOCK">HIGH_OVERCLOCK (y = +2.0)</option>
                            </select>
                        </div>

                        {/* Action buttons */}
                        <div style={{ marginBottom: 16 }}>
                            <button
                                onClick={() => {
                                    if (!selectedNode) {
                                        setLogMessages(prev => ['[CMS ERROR] Select a hex node first to snap place.', ...prev]);
                                        return;
                                    }
                                    const yVal = selectedAltitude === 'LOW_GROUND' ? -2.0 : (selectedAltitude === 'HIGH_OVERCLOCK' ? 2.0 : 0.0);
                                    const newHelper = {
                                        id: `helper_${Date.now()}`,
                                        type: selectedHelperType,
                                        chunkId: selectedNode.macroIndex,
                                        blockId: selectedNode.subIndex,
                                        altitude: selectedAltitude,
                                        yPos: yVal
                                    };
                                    setPlacedHelpers(prev => [...prev, newHelper]);
                                    setLogMessages(prev => [`[CMS] Placed ${selectedHelperType} at M${selectedNode.macroIndex}_S${selectedNode.subIndex} snapped to ${selectedAltitude} (${yVal.toFixed(1)}).`, ...prev]);
                                    
                                    // Trigger staggered 3-frame initialization cycle simulation
                                    setIsStaggeredLoading(true);
                                    setLogMessages(prev => ['[RENDER] Frame 1: Initializing Hero mesh...', ...prev]);
                                    requestAnimationFrame(() => {
                                        setLogMessages(prev => ['[RENDER] Frame 2: Initializing Grid base mesh...', ...prev]);
                                        requestAnimationFrame(() => {
                                            setLogMessages(prev => ['[RENDER] Frame 3: Initializing Props & Helpers (Towers/Flags)... Render complete.', ...prev]);
                                            setIsStaggeredLoading(false);
                                        });
                                    });
                                }}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    background: '#ff4757',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 4,
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontSize: 11
                                }}
                            >
                                Place & Snap to Altitudes
                            </button>
                        </div>

                        {/* Placed helpers list */}
                        <div>
                            <label style={{ display: 'block', fontSize: 10, color: '#888', marginBottom: 4 }}>PLACED PROPS ({placedHelpers.length})</label>
                            <div style={{ background: '#0d0e12', borderRadius: 4, padding: '8px', maxHeight: 200, overflowY: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                                    <thead>
                                        <tr style={{ color: '#888', borderBottom: '1px solid #333' }}>
                                            <th style={{ textAlign: 'left', padding: '4px' }}>TYPE</th>
                                            <th style={{ textAlign: 'left', padding: '4px' }}>COORD</th>
                                            <th style={{ textAlign: 'right', padding: '4px' }}>ALTITUDE (Y)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {placedHelpers.map((h, i) => (
                                            <tr key={h.id} style={{ borderBottom: '1px solid #222' }}>
                                                <td style={{ padding: '4px', color: '#ff4757', fontWeight: 'bold' }}>{h.type}</td>
                                                <td style={{ padding: '4px', color: '#fff' }}>M{h.chunkId}_S{h.blockId}</td>
                                                <td style={{ padding: '4px', textAlign: 'right', color: '#00ff00' }}>{h.yPos.toFixed(1)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
                {activeRightTab === 'timeline_strip' && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px', overflowY: 'auto' }}>
                        <div style={{ marginBottom: 16 }}>
                            <h3 style={{ margin: 0, fontSize: 14, color: '#ffa500' }}>🎞️ SOVEREIGN TIMELINE CMS</h3>
                            <span style={{ fontSize: 10, opacity: 0.6 }}>Synchronized Canvas & Cutting Strip Regulator</span>
                        </div>

                        {/* Feature Regulators List (Selectable/Clickable) */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 10, color: '#888', marginBottom: 6 }}>AUTOMATED ENGINE REGULATORS</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {[
                                    { label: 'Draco 3D Character Models', val: enabledDraco, set: setEnabledDraco },
                                    { label: 'Strategic Turn Balancer', val: enabledTurnBalancer, set: setEnabledTurnBalancer },
                                    { label: 'Hexagon Transparency & Reflections', val: enabledTransparency, set: setEnabledTransparency },
                                    { label: 'Volumetric Atmosphere (God Rays)', val: enabledGodRays, set: setEnabledGodRays },
                                    { label: '3D Item Loaders (Chests/Traps/Nodes)', val: enabledItemLoaders, set: setEnabledItemLoaders },
                                    { label: 'OpenVINO Fatigue & Blink Analytics', val: enabledOpenVINO, set: setEnabledOpenVINO },
                                    { label: 'AWS WS Delta Compression', val: enabledDeltaCompression, set: setEnabledDeltaCompression }
                                ].map((item, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => item.set(!item.val)}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            background: '#0d0e12',
                                            border: item.val ? '1px solid #ffa500' : '1px solid #232733',
                                            borderRadius: 6,
                                            padding: '8px 10px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <span style={{ fontSize: 10, color: item.val ? '#fff' : '#888' }}>{item.label}</span>
                                        <span style={{ 
                                            fontSize: 9, 
                                            fontWeight: 'bold', 
                                            color: item.val ? '#ffa500' : '#888',
                                            background: item.val ? 'rgba(255, 165, 0, 0.15)' : '#1a1d26',
                                            padding: '2px 6px',
                                            borderRadius: 4
                                        }}>
                                            {item.val ? 'ACTIVE' : 'STANDBY'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Film Timeline Cutting Strip */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 10, color: '#888', marginBottom: 6 }}>INTERACTIVE CUTTING STRIP TIMELINE</label>
                            
                            {/* sprocket holes container */}
                            <div style={{ background: '#07070a', borderRadius: 8, padding: '12px 6px', border: '1px solid #232733', overflow: 'hidden' }}>
                                {/* Top Sprockets */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px', marginBottom: 8 }}>
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <div key={i} style={{ width: 6, height: 6, background: '#1a1d26', borderRadius: 1 }} />
                                    ))}
                                </div>

                                {/* Film Frames */}
                                <div style={{ display: 'flex', gap: 4 }}>
                                    {Array.from({ length: 12 }).map((_, i) => {
                                        const isActive = selectedFrame === i;
                                        return (
                                            <div 
                                                key={i}
                                                onClick={() => {
                                                    setSelectedFrame(i);
                                                    setLogMessages(prev => [`[CMS] Jumped to Timeline Frame #${i} (${(i / 11 * 100).toFixed(0)}%).`, ...prev]);
                                                }}
                                                style={{
                                                    flex: 1,
                                                    height: 36,
                                                    background: isActive ? '#ffa500' : '#111319',
                                                    border: '1px solid #333',
                                                    borderRadius: 3,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    cursor: 'pointer',
                                                    color: isActive ? '#000' : '#ffd700',
                                                    fontSize: 9,
                                                    fontWeight: 'bold',
                                                    boxShadow: isActive ? '0 0 8px rgba(255, 165, 0, 0.4)' : 'none',
                                                    transition: 'all 0.15s ease'
                                                }}
                                            >
                                                <span>F{i}</span>
                                                <span style={{ fontSize: 7, opacity: 0.7 }}>{((i / 11) * 100).toFixed(0)}%</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Bottom Sprockets */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px', marginTop: 8 }}>
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <div key={i} style={{ width: 6, height: 6, background: '#1a1d26', borderRadius: 1 }} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Selected Keyframe Inspector & Equation Sync */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ background: '#0d0e12', border: '1px solid #232733', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                                <div style={{ fontSize: 10, color: '#ffa500', textTransform: 'uppercase', marginBottom: 8, fontWeight: 'bold' }}>
                                    Frame #{selectedFrame} Keyframe Parameters
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 10, color: '#888' }}>
                                    <div>Time: <span style={{ color: '#fff' }}>{(selectedFrame / 11).toFixed(2)}s ({(selectedFrame / 11 * 100).toFixed(0)}%)</span></div>
                                    <div>Active Formula: <span style={{ color: '#fff' }}>{selectedFormula}</span></div>
                                    <div>Multiplier: <span style={{ color: '#ffd700' }}>{(selectedVariant * 0.5).toFixed(1)}x</span></div>
                                    <div>Type: <span style={{ color: '#00eeff' }}>{selectedElementType}</span></div>
                                </div>
                            </div>

                            {/* Sync to Canvas trigger button */}
                            <button
                                onClick={() => {
                                    setIsSyncing(true);
                                    setTimeout(() => {
                                        setIsSyncing(false);
                                        const newConfig = {
                                            enabledDraco,
                                            enabledTurnBalancer,
                                            enabledTransparency,
                                            enabledGodRays,
                                            enabledItemLoaders,
                                            enabledOpenVINO,
                                            enabledDeltaCompression,
                                            lastSyncTime: Date.now()
                                        };
                                        setVirtualFiles(prev => ({
                                            ...prev,
                                            "game_content/configs/gameplay_rules.json": JSON.stringify(newConfig, null, 2)
                                        }));
                                        setLogMessages(prev => [
                                            `[CMS] Synchronized all ${placedHelpers.length + 1} elements (Canvas + Cutting Strip) with active gameplay loop config!`,
                                            ...prev
                                        ]);
                                    }, 600);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    background: isSyncing ? '#333' : '#ffa500',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: 6,
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    boxShadow: '0 0 12px rgba(255, 165, 0, 0.3)',
                                    fontSize: 11
                                }}
                                disabled={isSyncing}
                            >
                                {isSyncing ? 'Synchronizing...' : 'Sync Timeline with Canvas'}
                    </div>
                )}
                {activeRightTab === 'node_composer' && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px', overflowY: 'auto' }}>
                        <div style={{ marginBottom: 16 }}>
                            <h3 style={{ margin: 0, fontSize: 14, color: '#a855f7' }}>🎨 DEPARTMENTS & NODE COMPOSER</h3>
                            <span style={{ fontSize: 10, opacity: 0.6 }}>Industrial Standard Texture & Surface Simulation</span>
                        </div>

                        {/* 1. Department Simulation Selector */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 10, color: '#888', marginBottom: 6 }}>CREATIVE DEPARTMENTS</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {[
                                    { id: 'ART_ASSETS', label: '🎨 Art & Assets', tool: 'Substance Designer', standard: '4K Tex / 2.0 PBR' },
                                    { id: 'VFX_ENVIRONMENT', label: '⚡ VFX & Env', tool: 'R3F / ShaderLab', standard: 'Volumetric God Rays' },
                                    { id: 'DESIGN_SYSTEMS', label: '⚙️ Design & Sys', tool: 'Ohmic Engine / SJF', standard: 'Turn initiative costs' },
                                    { id: 'QA_TELEMETRY', label: '📊 QA & Telemetry', tool: 'OpenVINO / Gaze SDK', standard: '60fps GPU ceiling' }
                                ].map(dept => {
                                    const isSel = selectedDept === dept.id;
                                    return (
                                        <div 
                                            key={dept.id}
                                            onClick={() => {
                                                setSelectedDept(dept.id);
                                                setLogMessages(prev => [`[DEPT] Active workspace switched to ${dept.label}.`, ...prev]);
                                            }}
                                            style={{
                                                flex: '1 1 45%',
                                                padding: '6px 8px',
                                                background: isSel ? 'rgba(168, 85, 247, 0.15)' : '#0d0e12',
                                                border: isSel ? '1px solid #a855f7' : '1px solid #232733',
                                                borderRadius: 6,
                                                cursor: 'pointer',
                                                fontSize: 9,
                                                color: isSel ? '#fff' : '#888',
                                                textAlign: 'center',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            {dept.label}
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Selected Department Details */}
                            <div style={{ background: '#07070a', border: '1px solid #1a1d26', borderRadius: 6, padding: 8, marginTop: 6, fontSize: 9, color: '#888' }}>
                                {selectedDept === 'ART_ASSETS' && <div>Tool: <span style={{ color: '#fff' }}>Substance Designer PBR</span> | Standard: <span style={{ color: '#a855f7' }}>4K texture arrays / 0.85 metalness limit</span></div>}
                                {selectedDept === 'VFX_ENVIRONMENT' && <div>Tool: <span style={{ color: '#fff' }}>Three.js Volumetric Shader</span> | Standard: <span style={{ color: '#a855f7' }}>3 volumetric light shafts max</span></div>}
                                {selectedDept === 'DESIGN_SYSTEMS' && <div>Tool: <span style={{ color: '#fff' }}>Deterministic Turn Balancer</span> | Standard: <span style={{ color: '#a855f7' }}>SJF priority queueing under 2ms</span></div>}
                                {selectedDept === 'QA_TELEMETRY' && <div>Tool: <span style={{ color: '#fff' }}>OpenVINO Eye Gaze SDK</span> | Standard: <span style={{ color: '#a855f7' }}>Debounced 10Hz SQLite WAL telemetry</span></div>}
                            </div>
                        </div>

                        {/* 2. SVG Node Editor Simulation */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 10, color: '#888', marginBottom: 6 }}>TEXTURE INTERPRETATION NODE EDITOR</label>
                            <div style={{ position: 'relative', width: '100%', height: 110, background: '#07070a', border: '1px solid #232733', borderRadius: 8, overflow: 'hidden' }}>
                                {/* SVG connection lines */}
                                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                                    <path d="M 50 30 Q 95 30 110 55" stroke="#a855f7" strokeWidth="1.5" fill="none" strokeDasharray="3,3" />
                                    <path d="M 50 80 Q 95 80 110 55" stroke="#a855f7" strokeWidth="1.5" fill="none" strokeDasharray="3,3" />
                                    <path d="M 180 55 H 220" stroke="#00eeff" strokeWidth="1.8" fill="none" />
                                    <path d="M 270 55 H 290" stroke="#00eeff" strokeWidth="1.8" fill="none" />
                                </svg>

                                {/* Nodes Layout */}
                                {/* Input Node 1 */}
                                <div style={{ position: 'absolute', top: 12, left: 10, width: 45, height: 26, background: '#111319', border: '1px solid #444', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff' }}>
                                    Texture
                                </div>
                                {/* Input Node 2 */}
                                <div style={{ position: 'absolute', top: 62, left: 10, width: 45, height: 26, background: '#111319', border: '1px solid #444', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff' }}>
                                    Modifiers
                                </div>
                                {/* Middle Parser Node */}
                                <div style={{ position: 'absolute', top: 38, left: 100, width: 80, height: 32, background: 'rgba(168, 85, 247, 0.2)', border: '1px solid #a855f7', borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff' }}>
                                    <span style={{ fontWeight: 'bold' }}>Semantic Parser</span>
                                    <span style={{ fontSize: 6, color: '#a855f7' }}>[Name -> Spec]</span>
                                </div>
                                {/* Modifiers Node */}
                                <div style={{ position: 'absolute', top: 38, left: 210, width: 60, height: 32, background: '#111319', border: '1px solid #00eeff', borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff' }}>
                                    <span style={{ fontWeight: 'bold' }}>Toner</span>
                                    <span style={{ fontSize: 6, color: '#00eeff' }}>
                                        {textureBoost ? '+Boost' : ''} {textureSpecular ? '+Glow' : ''}
                                    </span>
                                </div>
                                {/* Output Node */}
                                <div style={{ position: 'absolute', top: 40, left: 285, width: 28, height: 28, background: '#00ff00', border: '1px solid #fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#000', fontWeight: 'bold' }}>
                                    OUT
                                </div>
                            </div>
                        </div>

                        {/* 3. Texture input selection */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 10, color: '#888', marginBottom: 4 }}>SELECT TEXTURE TEMPLATE</label>
                            <select 
                                value={selectedTexture}
                                onChange={(e) => {
                                    setSelectedTexture(e.target.value);
                                    setLogMessages(prev => [`[NODE] Loaded texture '${e.target.value}'. Parsing semantics...`, ...prev]);
                                }}
                                style={{ width: '100%', padding: '6px', background: '#0d0e12', color: '#fff', border: '1px solid #333', borderRadius: 4, fontSize: 11 }}
                            >
                                <option value="moss_base">moss_base (Lush Biome / soft matte / 1.0 friction)</option>
                                <option value="glacier_fracture">glacier_fracture (Ice Biome / reflective / 0.8 friction)</option>
                                <option value="toxic_sludge">toxic_sludge (Swamp Biome / specular purp / 1.6 friction)</option>
                                <option value="sand_dunes">sand_dunes (Desert Biome / orange matte / 1.2 friction)</option>
                                <option value="slag_plates">slag_plates (Barrens Biome / slate gray PBR / 1.0 friction)</option>
                            </select>
                        </div>

                        {/* 4. Modifier switches */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 10, color: '#888', marginBottom: 6 }}>NODE MODIFIERS</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => setTextureBoost(prev => !prev)}
                                    style={{
                                        flex: 1,
                                        padding: '6px',
                                        fontSize: 9,
                                        background: textureBoost ? '#a855f7' : '#0d0e12',
                                        color: textureBoost ? '#000' : '#888',
                                        border: '1px solid #232733',
                                        borderRadius: 4,
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Boost Color
                                </button>
                                <button
                                    onClick={() => setTextureBevel(prev => !prev)}
                                    style={{
                                        flex: 1,
                                        padding: '6px',
                                        fontSize: 9,
                                        background: textureBevel ? '#a855f7' : '#0d0e12',
                                        color: textureBevel ? '#000' : '#888',
                                        border: '1px solid #232733',
                                        borderRadius: 4,
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Apply Bevel
                                </button>
                                <button
                                    onClick={() => setTextureSpecular(prev => !prev)}
                                    style={{
                                        flex: 1,
                                        padding: '6px',
                                        fontSize: 9,
                                        background: textureSpecular ? '#a855f7' : '#0d0e12',
                                        color: textureSpecular ? '#000' : '#888',
                                        border: '1px solid #232733',
                                        borderRadius: 4,
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Specular Glow
                                </button>
                            </div>
                        </div>

                        {/* 5. Semantic attributes inspector */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ background: '#0d0e12', border: '1px solid #232733', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                                <div style={{ fontSize: 10, color: '#a855f7', textTransform: 'uppercase', marginBottom: 8, fontWeight: 'bold' }}>
                                    Surface Simulation Attributes
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 10, color: '#888' }}>
                                    {/* Compute properties dynamically based on name */}
                                    {selectedTexture === 'moss_base' && (
                                        <>
                                            <div>Elastic Modulus (E): <span style={{ color: '#fff' }}>0.01 GPa (highly compliant)</span></div>
                                            <div>Thermal Conductivity (k): <span style={{ color: '#fff' }}>0.06 W/m·K (insulating)</span></div>
                                            <div>Friction Coefficient (μs): <span style={{ color: '#ffd700' }}>{textureBoost ? '0.55' : '0.45'}</span></div>
                                            <div>Heat Capacity (cp): <span style={{ color: '#00ff00', fontWeight: 'bold' }}>1920 J/kg·K</span></div>
                                            <div>TDP Compliance: <span style={{ color: '#00ff00' }}>PASSED (Optimal)</span></div>
                                        </>
                                    )}
                                    {selectedTexture === 'glacier_fracture' && (
                                        <>
                                            <div>Elastic Modulus (E): <span style={{ color: '#fff' }}>9.00 GPa (brittle solid)</span></div>
                                            <div>Thermal Conductivity (k): <span style={{ color: '#fff' }}>2.22 W/m·K (highly conductive)</span></div>
                                            <div>Friction Coefficient (μs): <span style={{ color: '#ffd700' }}>{textureBoost ? '0.25' : '0.15'}</span></div>
                                            <div>Heat Capacity (cp): <span style={{ color: '#00eeff', fontWeight: 'bold' }}>2090 J/kg·K</span></div>
                                            <div>TDP Compliance: <span style={{ color: '#00ff00' }}>PASSED (Optimal)</span></div>
                                        </>
                                    )}
                                    {selectedTexture === 'toxic_sludge' && (
                                        <>
                                            <div>Elastic Modulus (E): <span style={{ color: '#fff' }}>0.005 GPa (fluid-like compliance)</span></div>
                                            <div>Thermal Conductivity (k): <span style={{ color: '#fff' }}>0.58 W/m·K (aqueous)</span></div>
                                            <div>Friction Coefficient (μs): <span style={{ color: '#ffd700' }}>{textureBoost ? '0.90' : '0.75'}</span></div>
                                            <div>Heat Capacity (cp): <span style={{ color: '#d946ef', fontWeight: 'bold' }}>4184 J/kg·K</span></div>
                                            <div>TDP Compliance: <span style={{ color: '#00ff00' }}>PASSED (Optimal)</span></div>
                                        </>
                                    )}
                                    {selectedTexture === 'sand_dunes' && (
                                        <>
                                            <div>Elastic Modulus (E): <span style={{ color: '#fff' }}>0.05 GPa (granular displacement)</span></div>
                                            <div>Thermal Conductivity (k): <span style={{ color: '#fff' }}>0.27 W/m·K (diffusive)</span></div>
                                            <div>Friction Coefficient (μs): <span style={{ color: '#ffd700' }}>{textureBoost ? '0.65' : '0.55'}</span></div>
                                            <div>Heat Capacity (cp): <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>830 J/kg·K</span></div>
                                            <div>TDP Compliance: <span style={{ color: '#00ff00' }}>PASSED (Optimal)</span></div>
                                        </>
                                    )}
                                    {selectedTexture === 'slag_plates' && (
                                        <>
                                            <div>Elastic Modulus (E): <span style={{ color: '#fff' }}>50.00 GPa (dense slate basalt)</span></div>
                                            <div>Thermal Conductivity (k): <span style={{ color: '#fff' }}>1.80 W/m·K (rock transfer)</span></div>
                                            <div>Friction Coefficient (μs): <span style={{ color: '#ffd700' }}>{textureBoost ? '0.95' : '0.80'}</span></div>
                                            <div>Heat Capacity (cp): <span style={{ color: '#708090', fontWeight: 'bold' }}>750 J/kg·K</span></div>
                                            <div>TDP Compliance: <span style={{ color: '#00ff00' }}>PASSED (Optimal)</span></div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Sync to Canvas trigger button */}
                            <button
                                onClick={() => {
                                    setIsSyncing(true);
                                    setTimeout(() => {
                                        setIsSyncing(false);
                                        const newConfig = {
                                            selectedTexture,
                                            textureBoost,
                                            textureBevel,
                                            textureSpecular,
                                            lastSyncTime: Date.now()
                                        };
                                        setVirtualFiles(prev => ({
                                            ...prev,
                                            "game_content/configs/gameplay_rules.json": JSON.stringify(newConfig, null, 2)
                                        }));
                                        setLogMessages(prev => [
                                            `[CMS] Node Editor synchronized texture specs for '${selectedTexture}' successfully with Active WebGL Compositor!`,
                                            ...prev
                                        ]);
                                    }, 600);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    background: isSyncing ? '#333' : '#a855f7',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: 6,
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    boxShadow: '0 0 12px rgba(168, 85, 247, 0.3)',
                                    fontSize: 11
                                }}
                                disabled={isSyncing}
                            >
                                {isSyncing ? 'Synchronizing...' : 'Sync Texture with WebGL Canvas'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
