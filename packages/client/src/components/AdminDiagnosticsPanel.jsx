import React, { useState, useEffect } from 'react';
import { VercelCMSHelper } from '../utils/VercelCMSHelper';

export default function AdminDiagnosticsPanel({ onClose, initialEntropy = 0.4, onUpdateEntropy, gameState }) {
    const [entropy, setEntropy] = useState(initialEntropy);
    const [combatDmgFactor, setCombatDmgFactor] = useState(1.0);
    const [hazardThreshold, setHazardThreshold] = useState(0.7);
    const [consoleOutput, setConsoleOutput] = useState([]);

    // DDA, look-ahead, culling parameters
    const [winChance, setWinChance] = useState(0.65);
    const [stepsAhead, setStepsAhead] = useState(3);
    const [cullingDistance, setCullingDistance] = useState(8);
    const [proceduralSpawnsEnabled, setProceduralSpawnsEnabled] = useState(true);

    // Leaderboard/telemetry entries
    const [leaderboard, setLeaderboard] = useState([]);

    // Derived active phase information
    const currentPhase = gameState?.turnStateMachine?.currentPhase || 'PREPARATION';
    const activePlayerId = gameState?.turnStateMachine?.activePlayerId || '';

    const [selectedPhase, setSelectedPhase] = useState(currentPhase);
    const [selectedPlayer, setSelectedPlayer] = useState(activePlayerId || 'thread_king_ai');

    const logToConsole = (msg, data = null) => {
        const timestamp = new Date().toLocaleTimeString();
        const logMsg = `[${timestamp}] ${msg} ${data ? JSON.stringify(data) : ''}`;
        setConsoleOutput(prev => [logMsg, ...prev]);
    };

    // Load initial configs and leaderboard telemetry on mount
    useEffect(() => {
        const fetchConfigsAndTelemetry = async () => {
            try {
                const ddaRes = await fetch('/api/admin/dda/config');
                if (ddaRes.ok) {
                    const ddaData = await ddaRes.json();
                    setWinChance(ddaData.winChance ?? 0.65);
                    setStepsAhead(ddaData.stepsAhead ?? 3);
                    setCullingDistance(ddaData.cullingDistance ?? 8);
                    setProceduralSpawnsEnabled(ddaData.proceduralSpawnsEnabled ?? true);
                }

                const leadRes = await fetch('/api/leaderboard');
                if (leadRes.ok) {
                    const leadData = await leadRes.json();
                    setLeaderboard(leadData);
                }
            } catch (err) {
                logToConsole("Failed to load DDA configs or leaderboard data.");
            }
        };

        fetchConfigsAndTelemetry();
    }, []);

    // Save DDA/Geometry configs
    const saveDdaConfig = async (updatedFields) => {
        const payload = {
            winChance,
            stepsAhead,
            cullingDistance,
            proceduralSpawnsEnabled,
            ...updatedFields
        };

        try {
            const res = await fetch('/api/admin/dda/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const data = await res.json();
                logToConsole("DDA Config synced successfully:", data.config);
            }
        } catch (err) {
            logToConsole("Failed to sync DDA config to server.");
        }
    };

    const handleForcePhaseOverride = async () => {
        logToConsole(`Overriding phase machine: Phase -> ${selectedPhase}, Player -> ${selectedPlayer}`);
        try {
            const res = await fetch('/api/admin/phase/override', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phase: selectedPhase, activePlayerId: selectedPlayer })
            });
            if (res.ok) {
                const data = await res.json();
                logToConsole("State machine override successful:", data);
            } else {
                logToConsole("State machine override failed.");
            }
        } catch (err) {
            logToConsole("Network error during phase override.");
        }
    };

    // Trigger Serverless Go Core pathfinder diagnostics
    const runPathfinderDiagnostics = async () => {
        logToConsole("Starting Go Core serverless A* diagnostics...");
        try {
            const start = [0, 0];
            const end = [2, 2];
            const path = await VercelCMSHelper.calculateGoPath(start, end);
            logToConsole("Path calculation succeeded. Coordinates traversed:", path);
        } catch (err) {
            logToConsole("Pathfinder query failed. Falling back to local TS interpolator.");
        }
    };

    // Tweak local physics cost simulation
    const simulatePhysicsCost = () => {
        logToConsole("Simulating physics AP grid cost...");
        const baseCost = 10;
        const multiplier = entropy > 0.7 ? 0.5 : 1.5;
        const cost = Math.round(baseCost * 15 * multiplier);
        logToConsole(` AP Cost resolved (Entropy: ${entropy.toFixed(2)}):`, { baseCost, multiplier, finalCost: cost });
    };

    const handleEntropyChange = (val) => {
        setEntropy(val);
        if (onUpdateEntropy) {
            onUpdateEntropy(val);
        }
    };

    return (
        <div className="fixed top-20 right-5 w-[420px] h-[calc(100vh-120px)] bg-[#0d0d13]/90 border border-slate-700/80 rounded-2xl p-6 box-border text-[#ececf1] z-50 flex flex-col font-mono backdrop-blur-md shadow-2xl overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-5 flex-shrink-0">
                <h3 className="m-0 text-cyan-400 text-sm tracking-wider font-bold">🛠️ ADMIN DIAGNOSTICS</h3>
                <button 
                    onClick={onClose}
                    className="background-none border-none text-red-500 hover:text-red-400 cursor-pointer text-base font-bold transition-colors"
                >
                    ✕
                </button>
            </div>

            {/* Slider Controls */}
            <div className="flex flex-col gap-4 flex-shrink-0">
                {/* Global Entropy Slider */}
                <div>
                    <div className="flex justify-between text-[11px] mb-1.5 text-slate-400">
                        <span>GLOBAL ENTROPY (Void Scaling)</span>
                        <span className="text-purple-400 font-bold">{entropy.toFixed(2)}</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.0" 
                        max="1.0" 
                        step="0.05"
                        value={entropy} 
                        onChange={(e) => handleEntropyChange(parseFloat(e.target.value))}
                        className="w-full accent-purple-500 cursor-pointer"
                    />
                </div>

                {/* Combat Multiplier */}
                <div>
                    <div className="flex justify-between text-[11px] mb-1.5 text-slate-400">
                        <span>COMBAT DAMAGE COEF</span>
                        <span className="text-red-400 font-bold">{combatDmgFactor.toFixed(1)}x</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.5" 
                        max="3.0" 
                        step="0.1"
                        value={combatDmgFactor} 
                        onChange={(e) => setCombatDmgFactor(parseFloat(e.target.value))}
                        className="w-full accent-red-500 cursor-pointer"
                    />
                </div>

                {/* Hazard Stress Threshold */}
                <div>
                    <div className="flex justify-between text-[11px] mb-1.5 text-slate-400">
                        <span>HAZARD STRESS LIMIT</span>
                        <span className="text-amber-400 font-bold">{hazardThreshold.toFixed(2)}</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.1" 
                        max="1.0" 
                        step="0.05"
                        value={hazardThreshold} 
                        onChange={(e) => setHazardThreshold(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer"
                    />
                </div>
            </div>

            {/* DDA & GEOMETRY TUNING */}
            <div className="flex flex-col gap-4 flex-shrink-0 mt-4 border-t border-slate-800 pt-4">
                <h4 className="m-0 text-[11px] text-cyan-400 font-bold">🎮 DDA & GEOMETRY CONFIG</h4>
                
                {/* Win Chance */}
                <div>
                    <div className="flex justify-between text-[10px] mb-1.5 text-slate-400">
                        <span>DDA TARGET WIN PROBABILITY</span>
                        <span className="text-cyan-400 font-bold">{Math.round(winChance * 100)}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.1" 
                        max="1.0" 
                        step="0.05"
                        value={winChance} 
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setWinChance(val);
                            saveDdaConfig({ winChance: val });
                        }}
                        className="w-full accent-cyan-500 cursor-pointer"
                    />
                </div>

                {/* Geometry Look-Ahead Steps */}
                <div>
                    <div className="flex justify-between text-[10px] mb-1.5 text-slate-400">
                        <span>GEOMETRY LOOK-AHEAD STEPS</span>
                        <span className="text-cyan-400 font-bold">{stepsAhead} steps</span>
                    </div>
                    <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        step="1"
                        value={stepsAhead} 
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setStepsAhead(val);
                            saveDdaConfig({ stepsAhead: val });
                        }}
                        className="w-full accent-cyan-500 cursor-pointer"
                    />
                </div>

                {/* Chunk Culling Distance */}
                <div>
                    <div className="flex justify-between text-[10px] mb-1.5 text-slate-400">
                        <span>CHUNK CULLING DISTANCE</span>
                        <span className="text-cyan-400 font-bold">{cullingDistance} chunks</span>
                    </div>
                    <input 
                        type="range" 
                        min="4" 
                        max="12" 
                        step="1"
                        value={cullingDistance} 
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setCullingDistance(val);
                            saveDdaConfig({ cullingDistance: val });
                        }}
                        className="w-full accent-cyan-500 cursor-pointer"
                    />
                </div>

                {/* Procedural Spawns Toggle */}
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>PROCEDURAL RENDER / SPAWNS</span>
                    <input 
                        type="checkbox" 
                        checked={proceduralSpawnsEnabled}
                        onChange={(e) => {
                            const val = e.target.checked;
                            setProceduralSpawnsEnabled(val);
                            saveDdaConfig({ proceduralSpawnsEnabled: val });
                        }}
                        className="w-4 h-4 cursor-pointer accent-cyan-500"
                    />
                </div>
            </div>

            {/* INTEGRATION TELEMETRY PROGRESS BARS */}
            <div className="flex flex-col gap-3 flex-shrink-0 mt-4 border-t border-slate-800 pt-4">
                <h4 className="m-0 text-[11px] text-purple-400 font-bold">📊 INTEGRATION VICTORY TELEMETRY</h4>
                {leaderboard.length > 0 ? (
                    leaderboard.map((entry, idx) => {
                        const npcRate = entry.npc_matches > 0 ? Math.round((entry.npc_wins / entry.npc_matches) * 100) : 0;
                        const aiRate = entry.ai_matches > 0 ? Math.round((entry.ai_wins / entry.ai_matches) * 100) : 0;
                        const pvpRate = entry.player_matches > 0 ? Math.round((entry.player_wins / entry.player_matches) * 100) : 0;

                        return (
                            <div key={idx} className="bg-[#13131c] rounded-xl p-3 border border-slate-800">
                                <div className="text-[10px] font-bold text-slate-300 mb-2">Player: {entry.player_id}</div>
                                
                                {/* NPC wins */}
                                <div className="mb-2">
                                    <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                                        <span>NPC Victory Rate</span>
                                        <span>{npcRate}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${npcRate}%` }} />
                                    </div>
                                </div>

                                {/* AI wins */}
                                <div className="mb-2">
                                    <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                                        <span>Sovereign AI Victory Rate</span>
                                        <span>{aiRate}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${aiRate}%` }} />
                                    </div>
                                </div>

                                {/* Real player wins */}
                                <div>
                                    <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                                        <span>PvP Victory Rate</span>
                                        <span>{pvpRate}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${pvpRate}%` }} />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-[9px] text-slate-500 text-center py-2">No leaderboard telemetry recorded.</div>
                )}
            </div>

            {/* Phase State Machine Debugger */}
            <div className="flex flex-col gap-2 flex-shrink-0 mt-4 border-t border-slate-800 pt-4">
                <h4 className="m-0 text-[11px] text-amber-400 font-bold">🔄 STATE MACHINE PHASE INSPECTOR</h4>
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span>Current Phase: <strong className="text-cyan-400">{currentPhase}</strong></span>
                    <span>Active: <strong className="text-purple-400">{activePlayerId || 'None'}</strong></span>
                </div>
                
                <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 uppercase font-bold">TARGET PHASE</label>
                        <select 
                            value={selectedPhase} 
                            onChange={(e) => setSelectedPhase(e.target.value)}
                            className="bg-[#1c1c28] text-white border border-slate-700 rounded-lg p-1.5 text-[10px] outline-none cursor-pointer"
                        >
                            <option value="MULLIGAN">MULLIGAN</option>
                            <option value="PREPARATION">PREPARATION</option>
                            <option value="ACTION">ACTION</option>
                            <option value="INTERRUPT_WINDOW">INTERRUPT</option>
                            <option value="RESOLVE_NETWORK">RESOLVE_NETWORK</option>
                            <option value="END_TURN">END_TURN</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 uppercase font-bold">ACTIVE PLAYER</label>
                        <select 
                            value={selectedPlayer} 
                            onChange={(e) => setSelectedPlayer(e.target.value)}
                            className="bg-[#1c1c28] text-white border border-slate-700 rounded-lg p-1.5 text-[10px] outline-none cursor-pointer"
                        >
                            <option value="thread_king_ai">Crystal King</option>
                            <option value="thread_hacker_root">Toxic Hacker</option>
                            <option value="thread_void_weaver">Void Weaver</option>
                        </select>
                    </div>
                </div>

                <button 
                    onClick={handleForcePhaseOverride}
                    className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-bold cursor-pointer mt-1.5 w-full transition-colors"
                >
                    ⚠️ Force State Phase Override
                </button>
            </div>

            <hr className="border-none border-b border-slate-800 my-5 flex-shrink-0" />

            {/* Diagnostics Actions */}
            <div className="flex flex-col gap-2.5 flex-shrink-0">
                <h4 className="m-0 text-[11px] text-slate-500 uppercase font-bold">RUN DIAGNOSTIC TESTS</h4>
                <div className="grid grid-cols-2 gap-2.5">
                    <button 
                        onClick={runPathfinderDiagnostics}
                        className="p-2.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                    >
                        ⚡ Test Pathfinder
                    </button>
                    <button 
                        onClick={simulatePhysicsCost}
                        className="p-2.5 bg-slate-900 hover:bg-slate-800 text-purple-400 border border-purple-500/30 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                    >
                        🌌 Calculate AP Cost
                    </button>
                </div>
            </div>

            {/* Output console log */}
            <div className="flex-1 mt-5 flex flex-col min-h-0">
                <span className="text-[11px] text-slate-500 mb-2 block font-bold">DIAGNOSTICS LOG OUTPUT</span>
                <div className="flex-1 bg-[#07070a] border border-slate-800 rounded-xl p-3 overflow-y-auto text-[10px] leading-relaxed text-[#a3a3c2] box-border custom-scrollbar">
                    {consoleOutput.length > 0 ? (
                        consoleOutput.map((log, idx) => (
                            <div key={idx} className="mb-2 border-b border-[#13131c] pb-1">{log}</div>
                        ))
                    ) : (
                        <div className="opacity-40 text-center mt-8">No logs generated yet. Run diagnostic tests above.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
