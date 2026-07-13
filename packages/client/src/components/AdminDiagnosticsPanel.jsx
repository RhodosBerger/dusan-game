import React, { useState } from 'react';
import { VercelCMSHelper } from '../utils/VercelCMSHelper';

export default function AdminDiagnosticsPanel({ onClose, initialEntropy = 0.4, onUpdateEntropy }) {
    const [entropy, setEntropy] = useState(initialEntropy);
    const [combatDmgFactor, setCombatDmgFactor] = useState(1.0);
    const [hazardThreshold, setHazardThreshold] = useState(0.7);
    const [consoleOutput, setConsoleOutput] = useState([]);

    const logToConsole = (msg, data = null) => {
        const timestamp = new Date().toLocaleTimeString();
        const logMsg = `[${timestamp}] ${msg} ${data ? JSON.stringify(data) : ''}`;
        setConsoleOutput(prev => [logMsg, ...prev]);
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
        <div style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            width: '420px',
            height: 'calc(100vh - 120px)',
            background: '#0d0d13e6',
            border: '1px solid #3c3c4e',
            borderRadius: '16px',
            padding: '24px',
            boxSizing: 'border-box',
            color: '#ececf1',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'monospace',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #242435', paddingBottom: '12px', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: '#00ffff', fontSize: '15px', tracking: '0.05em' }}>🛠️ ADMIN DIAGNOSTICS</h3>
                <button 
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
                >
                    ✕
                </button>
            </div>

            {/* Slider Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0 }}>
                {/* Global Entropy Slider */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                        <span>GLOBAL ENTROPY (Void Scaling)</span>
                        <span style={{ color: '#a855f7', fontWeight: 'bold' }}>{entropy.toFixed(2)}</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.0" 
                        max="1.0" 
                        step="0.05"
                        value={entropy} 
                        onChange={(e) => handleEntropyChange(parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: '#a855f7', cursor: 'pointer' }}
                    />
                </div>

                {/* Combat Multiplier */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                        <span>COMBAT DAMAGE COEF</span>
                        <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{combatDmgFactor.toFixed(1)}x</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.5" 
                        max="3.0" 
                        step="0.1"
                        value={combatDmgFactor} 
                        onChange={(e) => setCombatDmgFactor(parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: '#ef4444', cursor: 'pointer' }}
                    />
                </div>

                {/* Hazard Stress Threshold */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                        <span>HAZARD STRESS LIMIT</span>
                        <span style={{ color: '#ffd700', fontWeight: 'bold' }}>{hazardThreshold.toFixed(2)}</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.1" 
                        max="1.0" 
                        step="0.05"
                        value={hazardThreshold} 
                        onChange={(e) => setHazardThreshold(parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: '#ffd700', cursor: 'pointer' }}
                    />
                </div>
            </div>

            <hr style={{ border: 'none', borderBottom: '1px solid #242435', margin: '20px 0', flexShrink: 0 }} />

            {/* Diagnostics Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#888' }}>RUN DIAGNOSTIC TESTS</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <button 
                        onClick={runPathfinderDiagnostics}
                        style={{ padding: '10px', background: '#1c1c28', color: '#00ffff', border: '1px solid #00ffff50', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        ⚡ Test Pathfinder
                    </button>
                    <button 
                        onClick={simulatePhysicsCost}
                        style={{ padding: '10px', background: '#1c1c28', color: '#a855f7', border: '1px solid #a855f750', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        🌌 Calculate AP Cost
                    </button>
                </div>
            </div>

            {/* Output console log */}
            <div style={{ flex: 1, marginTop: '20px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <span style={{ fontSize: '11px', color: '#888', marginBottom: '8px', display: 'block' }}>DIAGNOSTICS LOG OUTPUT</span>
                <div style={{
                    flex: 1,
                    background: '#07070a',
                    border: '1px solid #1c1c28',
                    borderRadius: '8px',
                    padding: '12px',
                    overflowY: 'auto',
                    fontSize: '10px',
                    lineHeight: '1.4',
                    color: '#a3a3c2',
                    boxSizing: 'border-box'
                }}>
                    {consoleOutput.length > 0 ? (
                        consoleOutput.map((log, idx) => (
                            <div key={idx} style={{ marginBottom: '8px', borderBottom: '1px solid #13131c', paddingBottom: '4px' }}>{log}</div>
                        ))
                    ) : (
                        <div style={{ opacity: 0.4, textAlign: 'center', marginTop: '30px' }}>No logs generated yet. Run diagnostic tests above.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
