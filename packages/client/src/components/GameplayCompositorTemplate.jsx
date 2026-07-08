// packages/client/src/components/GameplayCompositorTemplate.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

export default function GameplayCompositorTemplate({ activeThreadId = 'thread_king_ai' }) {
    const [heroDataset, setHeroDataset] = useState(null);
    const [marketData, setMarketData] = useState(null);
    const [selectedFaction, setSelectedFaction] = useState('crystal');
    const [roughnessOverride, setRoughnessOverride] = useState(0.9);
    const [bloomIntensity, setBloomIntensity] = useState(1.5);

    // Integration Diagnostics States
    const [activeTab, setActiveTab] = useState('compositor'); // 'compositor' | 'diagnostics' | 'ml_spawner' | 'database' | 'logic_console'
    const [goCoreStatus, setGoCoreStatus] = useState('CHECKING');
    const [expressStatus, setExpressStatus] = useState('CHECKING');
    const [telemetryLogs, setTelemetryLogs] = useState([]);
    const [tacticPrompt, setTacticPrompt] = useState('aggression');
    const [mlResult, setMlResult] = useState(null);
    const [mlLoading, setMlLoading] = useState(false);

    // Admin Logic Console States
    const [accessPoints, setAccessPoints] = useState([]);
    const [formula, setFormula] = useState('isRooted ^ lowHealth => dangerZone');
    const [propState, setPropState] = useState({
        isRooted: true,
        lowHealth: true,
        highEntropy: false,
        activeTurn: true,
        dangerZone: true
    });
    const [logicEvaluationResult, setLogicEvaluationResult] = useState(null);
    const [adminDocs, setAdminDocs] = useState('');
    const [showDocs, setShowDocs] = useState(false);

    const refreshDiagnostics = () => {
        setExpressStatus('CHECKING');
        setGoCoreStatus('CHECKING');
        
        fetch('http://localhost:3001/health')
            .then(() => setExpressStatus('ONLINE'))
            .catch(() => setExpressStatus('OFFLINE'));

        fetch('http://localhost:8081/')
            .then(() => setGoCoreStatus('ONLINE'))
            .catch(() => setGoCoreStatus('OFFLINE'));

        fetch('http://localhost:3001/api/telemetry')
            .then(res => res.json())
            .then(data => setTelemetryLogs(data.slice(0, 5)))
            .catch(() => {});
    };

    const fetchAccessPoints = () => {
        fetch(`http://localhost:3001/api/admin/access-points/${activeThreadId}`)
            .then(res => res.json())
            .then(data => setAccessPoints(data))
            .catch(() => {});
    };

    const handleOverrideSubmit = async (pointId, val) => {
        try {
            await fetch('http://localhost:3001/api/admin/access-points/override', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ threadId: activeThreadId, pointId, value: val })
            });
            fetchAccessPoints();
        } catch (e) {
            console.error('Failed override', e);
        }
    };

    const handleLogicEvaluate = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/admin/logic/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ formula, state: propState })
            });
            const data = await res.json();
            setLogicEvaluationResult(data);
        } catch (e) {
            console.error('Failed evaluate logic', e);
        }
    };

    const fetchAdminDocs = () => {
        fetch('http://localhost:3001/api/admin/documentation')
            .then(res => res.text())
            .then(data => setAdminDocs(data))
            .catch(() => {});
    };

    useEffect(() => {
        fetch('http://localhost:3001/api/scenarios/hero-graphics')
            .then(res => res.json())
            .then(data => setHeroDataset(data))
            .catch(err => console.warn('[COMPOSITOR] Failed to fetch hero dataset'));

        fetch(`http://localhost:3001/api/scenarios/market-prices/${activeThreadId}`)
            .then(res => res.json())
            .then(data => setMarketData(data))
            .catch(err => console.warn('[COMPOSITOR] Failed to fetch market data'));

        refreshDiagnostics();
        fetchAccessPoints();
        fetchAdminDocs();
    }, [activeThreadId]);

    const activeHero = useMemo(() => {
        if (!heroDataset) return null;
        return heroDataset.heroes.find(h => h.faction === selectedFaction) || null;
    }, [heroDataset, selectedFaction]);

    const triggerMlSpawn = async () => {
        setMlLoading(true);
        setMlResult(null);
        try {
            const res = await fetch('http://localhost:3001/api/scenarios/generate-tactical-instance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ threadId: activeThreadId, tacticPrompt })
            });
            const data = await res.json();
            setMlResult(data);
            
            // Refresh telemetry
            const telRes = await fetch('http://localhost:3001/api/telemetry');
            const telData = await telRes.json();
            setTelemetryLogs(telData.slice(0, 5));
        } catch (e) {
            setMlResult({ error: e.message, success: false });
        } finally {
            setMlLoading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row w-full h-[520px] bg-slate-950/90 border border-purple-500/30 rounded-xl overflow-hidden font-mono text-xs text-slate-300">
            {/* Left Control Panel: Multi-tab Diagnostic & Customization view */}
            <div className="w-full md:w-1/3 p-4 flex flex-col gap-3 bg-slate-900/60 border-r border-purple-500/20 overflow-y-auto">
                
                {/* Tab selector */}
                <div className="flex gap-1 border-b border-slate-800 pb-2">
                    {['compositor', 'diagnostics', 'ml_spawner', 'database', 'logic_console'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-1.5 py-1 rounded text-[9px] uppercase font-bold border transition-all ${
                                activeTab === tab 
                                    ? 'bg-purple-600 border-purple-400 text-white' 
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            {tab.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                {activeTab === 'compositor' && (
                    <>
                        <div>
                            <h3 className="text-purple-400 font-bold uppercase tracking-wider text-[10px] mb-1">🎭 Species & Faction</h3>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {['crystal', 'toxic', 'void', 'dru'].map((fac) => {
                                    const actualFac = fac === 'dru' ? 'druid' : fac;
                                    return (
                                        <button
                                            key={fac}
                                            onClick={() => setSelectedFaction(actualFac)}
                                            className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border transition-all ${
                                                selectedFaction === actualFac 
                                                    ? 'bg-purple-600 border-purple-400 text-white shadow-lg' 
                                                    : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-400'
                                            }`}
                                        >
                                            {fac}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {activeHero && (
                            <div className="bg-slate-950/40 p-2.5 border border-slate-800 rounded flex flex-col gap-1 text-[10px]">
                                <span className="text-cyan-400 font-bold uppercase tracking-wider">🔬 Surface Aesthetics</span>
                                <div className="flex justify-between">
                                    <span>Mesh Scale:</span>
                                    <span className="text-slate-200">{activeHero.meshScale}x</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Default Roughness:</span>
                                    <span className="text-slate-200">{activeHero.surfaceProps.roughness}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Base Emissive:</span>
                                    <span className="text-slate-200">{activeHero.surfaceProps.emissiveIntensity}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Animation:</span>
                                    <span className="text-purple-300 font-bold">{activeHero.animations.walk}</span>
                                </div>
                            </div>
                        )}

                        {/* Aesthetic Market Prices */}
                        <div>
                            <h3 className="text-[#00ffff] font-bold uppercase tracking-wider text-[10px] mb-1">🛒 Biome Trading Rates</h3>
                            {marketData ? (
                                <div className="flex flex-col gap-1 mt-1">
                                    <div className="text-[9px] text-slate-400 italic">
                                        Sector: Chunk {marketData.chunkId} ({marketData.biome})
                                    </div>
                                    {marketData.items.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center p-1 bg-slate-950/40 border border-slate-800 rounded">
                                            <span className="text-[9px] font-semibold text-slate-300">{item.name}</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[8px] px-1 rounded bg-slate-800 text-slate-400 font-bold">{item.priceModifier}x</span>
                                                <span className="text-yellow-400 font-bold">{item.currentPrice}g</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-[9px] text-slate-500 italic mt-1">Connecting to market pricing...</div>
                            )}
                        </div>

                        {/* Custom Shader Sliders */}
                        <div className="flex flex-col gap-2 mt-1 pt-2 border-t border-slate-800">
                            <span className="text-pink-400 font-bold uppercase tracking-wider text-[9px]">🎛️ Shader Overrides</span>
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-[9px] text-slate-400">
                                    <span>Matte Roughness:</span>
                                    <span>{roughnessOverride}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="1.0"
                                    step="0.05"
                                    value={roughnessOverride}
                                    onChange={(e) => setRoughnessOverride(parseFloat(e.target.value))}
                                    className="w-full h-1 bg-slate-800 rounded outline-none accent-purple-500"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-[9px] text-slate-400">
                                    <span>Bloom Intensity:</span>
                                    <span>{bloomIntensity}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="3.0"
                                    step="0.1"
                                    value={bloomIntensity}
                                    onChange={(e) => setBloomIntensity(parseFloat(e.target.value))}
                                    className="w-full h-1 bg-slate-800 rounded outline-none accent-purple-500"
                                />
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'diagnostics' && (
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <h3 className="text-purple-400 font-bold uppercase tracking-wider text-[10px]">🩺 Port Diagnostics</h3>
                            <button onClick={refreshDiagnostics} className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[9px] font-bold">🔄 Refresh</button>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <div className="p-2 bg-slate-950/60 border border-slate-850 rounded flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-[10px]">Express REST Server</div>
                                    <div className="text-[9px] text-slate-500">Port 3001 (Node.js API)</div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                    expressStatus === 'ONLINE' ? 'bg-green-950 text-green-400 border border-green-500/30' : 
                                    expressStatus === 'OFFLINE' ? 'bg-red-950 text-red-400 border border-red-500/30' : 'bg-yellow-950 text-yellow-400 border border-yellow-500/30'
                                }`}>
                                    {expressStatus}
                                </span>
                            </div>

                            <div className="p-2 bg-slate-950/60 border border-slate-850 rounded flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-[10px]">Go Core Engine</div>
                                    <div className="text-[9px] text-slate-500">Port 8081 (Batch Loader)</div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                    goCoreStatus === 'ONLINE' ? 'bg-green-950 text-green-400 border border-green-500/30' : 
                                    goCoreStatus === 'OFFLINE' ? 'bg-red-950 text-red-400 border border-red-500/30' : 'bg-yellow-950 text-yellow-400 border border-yellow-500/30'
                                }`}>
                                    {goCoreStatus}
                                </span>
                            </div>

                            <div className="p-2 bg-slate-950/60 border border-slate-850 rounded flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-[10px]">SQLite Database</div>
                                    <div className="text-[9px] text-slate-500">File: database.db</div>
                                </div>
                                <span className="px-2 py-0.5 bg-green-950 text-green-400 border border-green-500/30 rounded text-[9px] font-bold">
                                    ACTIVE
                                </span>
                            </div>
                        </div>

                        <div className="bg-slate-950/30 p-2.5 rounded border border-slate-800 text-[9px] text-slate-400 flex flex-col gap-1">
                            <span className="text-[#00ffff] font-bold uppercase tracking-wider text-[9px] mb-1">🔗 Integration Topology</span>
                            <span>Client (5173) ── WebSocket ── Server (3001)</span>
                            <span>Server (3001) ── HTTP Call ── Go Core (8081)</span>
                            <span>Server (3001) ── execSync ── python3 (ML Script)</span>
                            <span>Server (3001) ── node:sqlite ── database.db</span>
                        </div>
                    </div>
                )}

                {activeTab === 'ml_spawner' && (
                    <div className="flex flex-col gap-2.5">
                        <h3 className="text-purple-400 font-bold uppercase tracking-wider text-[10px]">🧠 ML Spawner Pipeline</h3>
                        <p className="text-[10px] text-slate-400">Adaptively spawns chests or traps using the Python ML script:</p>
                        
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] text-slate-400">Tactical Intent Prompt:</label>
                            <select 
                                value={tacticPrompt} 
                                onChange={(e) => setTacticPrompt(e.target.value)}
                                className="bg-slate-950 border border-slate-800 p-1.5 rounded text-[10px] text-white focus:outline-none focus:border-purple-500"
                            >
                                <option value="aggression">aggression (Spawns Trap/Slime)</option>
                                <option value="stealth">stealth (Spawns Camouflage Decoy)</option>
                                <option value="defense">defense (Spawns Protective Barrier)</option>
                            </select>
                        </div>

                        <button
                            onClick={triggerMlSpawn}
                            disabled={mlLoading}
                            className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 disabled:bg-slate-800 text-white rounded font-bold uppercase text-[10px] tracking-wider transition-all"
                        >
                            {mlLoading ? '🤖 Synthesizing...' : '🚀 Generate & Spawn'}
                        </button>

                        {mlResult && (
                            <div className="bg-slate-950/60 border border-slate-850 p-2 rounded text-[9px] overflow-x-auto flex flex-col gap-1">
                                <div className="font-bold uppercase text-[9px] text-pink-400">Response payload:</div>
                                <div className="flex justify-between">
                                    <span>Success:</span>
                                    <span className={mlResult.success ? 'text-green-400' : 'text-red-400'}>{String(mlResult.success)}</span>
                                </div>
                                {mlResult.actionType && (
                                    <>
                                        <div className="flex justify-between">
                                            <span>Action:</span>
                                            <span className="text-cyan-300 font-bold">{mlResult.actionType}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Target Hex:</span>
                                            <span>Chunk {mlResult.coordinates?.meta}, Hex {mlResult.coordinates?.hex}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Power Rating:</span>
                                            <span className="text-yellow-400 font-bold">{mlResult.powerRating?.toFixed(2)}</span>
                                        </div>
                                        <div className="text-slate-400 italic text-[9px] mt-1 pt-1 border-t border-slate-900">
                                            "{mlResult.description}"
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'database' && (
                    <div className="flex flex-col gap-2.5">
                        <div className="flex justify-between items-center">
                            <h3 className="text-purple-400 font-bold uppercase tracking-wider text-[10px]">📦 SQLite Telemetry Logs</h3>
                            <button onClick={refreshDiagnostics} className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[9px]">🔄 Sync</button>
                        </div>
                        <p className="text-[9px] text-slate-400">Stored active events inside database.db telemetry table:</p>
                        
                        <div className="flex flex-col gap-1.5">
                            {telemetryLogs.length > 0 ? (
                                telemetryLogs.map((log, index) => (
                                    <div key={index} className="p-1.5 bg-slate-950/60 border border-slate-850/60 rounded text-[9px] flex flex-col gap-0.5">
                                        <div className="flex justify-between text-slate-400 font-semibold text-[8px]">
                                            <span className="text-purple-400 uppercase">{log.eventType || 'Event'}</span>
                                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <div className="text-slate-200 break-words">{log.details || log.message}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-[10px] text-slate-500 italic text-center py-4">No active telemetry logs in SQLite database.</div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'logic_console' && (
                    <div className="flex flex-col gap-2.5">
                        <div className="flex justify-between items-center">
                            <h3 className="text-purple-400 font-bold uppercase tracking-wider text-[10px]">⚙️ Deterministic Logic Console</h3>
                            <button onClick={fetchAccessPoints} className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[9px]">🔄 Sync</button>
                        </div>
                        
                        {/* Access Points List */}
                        <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto border border-slate-800 p-1.5 rounded bg-slate-950/40">
                            <span className="text-cyan-400 font-bold uppercase tracking-wider text-[8px] mb-0.5">🔑 Administrator Access Points</span>
                            {accessPoints.map((pt) => (
                                <div key={pt.id} className="flex flex-col gap-1 bg-slate-950/60 p-1.5 border border-slate-900 rounded">
                                    <div className="flex justify-between text-[9px] font-bold">
                                        <span className="text-slate-200">{pt.name}</span>
                                        <span className="text-yellow-400">{String(pt.value)}</span>
                                    </div>
                                    <div className="text-[8px] text-slate-500">{pt.description}</div>
                                    
                                    {pt.canOverride && (
                                        <div className="flex gap-1.5 mt-1 items-center justify-between">
                                            <input 
                                                type="text" 
                                                placeholder="Override val..." 
                                                defaultValue={pt.value}
                                                onBlur={(e) => handleOverrideSubmit(pt.id, e.target.value)}
                                                className="bg-slate-900 border border-slate-750 px-1 py-0.5 rounded text-[8px] text-white w-2/3 focus:outline-none"
                                            />
                                            <span className="text-[7px] text-purple-400 uppercase select-none font-bold">Auto-Sync</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Propositional Logic Evaluator */}
                        <div className="flex flex-col gap-1.5 border border-slate-800 p-1.5 rounded bg-slate-950/40">
                            <span className="text-pink-400 font-bold uppercase tracking-wider text-[8px]">🧠 Propositional Logic Evaluator</span>
                            
                            <div className="flex flex-col gap-1">
                                <label className="text-[8px] text-slate-500">Logic Formula:</label>
                                <input 
                                    type="text" 
                                    value={formula}
                                    onChange={(e) => setFormula(e.target.value)}
                                    className="bg-slate-950 border border-slate-800 px-1 py-0.5 rounded text-[9px] text-white focus:outline-none"
                                />
                            </div>

                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {Object.keys(propState).map((key) => (
                                    <label key={key} className="flex items-center gap-1 text-[8px] select-none text-slate-400">
                                        <input 
                                            type="checkbox"
                                            checked={propState[key]}
                                            onChange={(e) => setPropState({ ...propState, [key]: e.target.checked })}
                                            className="accent-pink-500"
                                        />
                                        {key}
                                    </label>
                                ))}
                            </div>

                            <button
                                onClick={handleLogicEvaluate}
                                className="w-full py-1 bg-pink-900 hover:bg-pink-850 text-white rounded font-bold uppercase text-[9px] tracking-wider transition-all mt-1"
                            >
                                Deterministic Evaluation
                            </button>

                            {logicEvaluationResult && (
                                <div className="p-1.5 bg-slate-950 rounded border border-slate-850 text-[8px] font-mono mt-1">
                                    <div className="flex justify-between">
                                        <span>Result:</span>
                                        <span className={logicEvaluationResult.result ? 'text-green-400' : 'text-red-400'}>{String(logicEvaluationResult.result).toUpperCase()}</span>
                                    </div>
                                    <div className="text-slate-500 mt-0.5 break-words">{logicEvaluationResult.evaluatedSteps}</div>
                                </div>
                            )}
                        </div>

                        {/* System Documentation and Brainstorming */}
                        <div className="flex flex-col gap-1">
                            <button
                                onClick={() => { setShowDocs(!showDocs); if (!adminDocs) fetchAdminDocs(); }}
                                className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold text-[9px] uppercase tracking-wider transition-all"
                            >
                                {showDocs ? '📖 Hide System Specs' : '📖 View Brainstorming & Architecture Specs'}
                            </button>

                            {showDocs && adminDocs && (
                                <pre className="bg-slate-950 p-2 border border-slate-850 text-[7px] max-h-[100px] overflow-y-auto font-mono text-slate-400 leading-tight select-all">
                                    {adminDocs}
                                </pre>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* Right Panel: Interactive 3D Canvas Preview */}
            <div className="flex-1 relative bg-[#06060c]">
                <Canvas shadows camera={{ position: [0, 2, 4], fov: 45 }}>
                    <ambientLight intensity={0.4} />
                    <directionalLight position={[5, 10, 5]} intensity={1.5} />
                    <pointLight position={[-5, 5, -5]} intensity={0.5} color="#8800ff" />

                    {/* Preview 3D Matte Sphere representing selected species */}
                    <mesh castShadow receiveShadow>
                        <sphereGeometry args={[0.8, 32, 32]} />
                        <meshStandardMaterial
                            color={activeHero ? activeHero.colorPalette.primary : '#00eeff'}
                            roughness={roughnessOverride}
                            metalness={0.1}
                            emissive={activeHero ? activeHero.colorPalette.glow : '#00ffff'}
                            emissiveIntensity={activeHero ? activeHero.surfaceProps.emissiveIntensity * 0.4 : 0.5}
                        />
                    </mesh>

                    {/* Glowing Wireframe Outer Ring (Topology representation) */}
                    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}>
                        <ringGeometry args={[1.1, 1.2, 32]} />
                        <meshBasicMaterial color={activeHero ? activeHero.colorPalette.glow : '#00ffff'} side={2} />
                    </mesh>

                    <OrbitControls enableZoom={true} maxPolarAngle={Math.PI / 2} />

                    <EffectComposer>
                        <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} height={300} intensity={bloomIntensity} />
                    </EffectComposer>
                </Canvas>

                {/* Floating Aesthetic Overlay Tag */}
                <div className="absolute top-3 right-3 p-1.5 bg-slate-950/80 border border-[#00ffff]/20 rounded text-[9px] text-[#00ffff] font-mono font-bold tracking-wider uppercase select-none">
                    ✨ UNIFIED INTEGRATION CONSOLE
                </div>
            </div>
        </div>
    );
}
