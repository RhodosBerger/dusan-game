import React, { useState, useEffect, useMemo } from 'react';
import { ITEMS_CATALOG } from '../../../shared/src/index';

// RPG Classes and their base attributes
const CLASS_PRESETS = {
  AETHER_SPELLWEAVER: {
    name: "Aether Spellweaver",
    faction: "crystal",
    baseVoltage: 6.0,
    baseResistance: 1.2,
    baseReach: 2,
    description: "Channels raw aetheric voltages through glass crystals. Low defense, high kinetic output.",
    color: "#06b6d4" // Cyan
  },
  GIGANTIC_BEHEMOTH: {
    name: "Gigantic Behemoth",
    faction: "toxic",
    baseVoltage: 8.0,
    baseResistance: 3.0,
    baseReach: 1,
    description: "Heavy vanguard mech with massive copper resistances. High defense, slow close-range strikes.",
    color: "#f59e0b" // Amber
  },
  MYRMIDON_SENTINEL: {
    name: "Myrmidon Sentinel",
    faction: "druid",
    baseVoltage: 4.0,
    baseResistance: 2.0,
    baseReach: 1,
    description: "Balanced combat warden using biological conduits. High shield efficiency and ground control.",
    color: "#10b981" // Emerald
  },
  SWIFT_HARBINGER: {
    name: "Swift Harbinger",
    faction: "void",
    baseVoltage: 3.0,
    baseResistance: 0.8,
    baseReach: 3,
    description: "High-speed scout executing phase-rift maneuvers. Longest range, lowest system resistance.",
    color: "#a855f7" // Purple
  },
  SOVEREIGN_EXEMPLAR: {
    name: "Sovereign Exemplar",
    faction: "crystal",
    baseVoltage: 5.0,
    baseResistance: 1.0,
    baseReach: 2,
    description: "Elite commander coordinating combat cells. Boosted by consecutive combination actions.",
    color: "#3b82f6" // Blue
  }
};

export default function RPGClassBoard({ onClose }) {
  const [activeClass, setActiveClass] = useState("AETHER_SPELLWEAVER");
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState("test_wizard");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Custom Ohm's Law settings
  const [customVoltage, setCustomVoltage] = useState(5.0);
  const [customResistance, setCustomResistance] = useState(1.5);

  const addLog = (msg) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 18)]);
  };

  // Prefetch player attributes on mount
  useEffect(() => {
    const prefetchData = async () => {
      setLoading(true);
      addLog("Initializing prefetch for RPG player attributes...");
      try {
        const response = await fetch('/api/db/players');
        if (response.ok) {
          const data = await response.json();
          setPlayers(data);
          if (data.length > 0) {
            setSelectedPlayer(data[0].username);
            addLog(`✓ Prefetched ${data.length} profiles from SQLite: ${data.map(p => p.username).join(', ')}`);
          } else {
            addLog("✓ SQLite prefetch empty. Ready to register new players.");
          }
        } else {
          addLog("⚠️ Server replied with error. Falling back to sandbox memory.");
        }
      } catch (err) {
        addLog("⚠️ Network unavailable. Initialized local offline cache.");
      } finally {
        setLoading(false);
      }
    };
    prefetchData();
  }, []);

  // Find active player profile
  const playerProfile = useMemo(() => {
    return players.find(p => p.username === selectedPlayer) || {
      username: selectedPlayer,
      heroClass: activeClass,
      materials: '{"CrystalShard": 5, "Spores": 2, "Essence": 10}'
    };
  }, [players, selectedPlayer, activeClass]);

  const materials = useMemo(() => {
    try {
      return JSON.parse(playerProfile.materials || '{}');
    } catch {
      return { CrystalShard: 5, Spores: 2, Essence: 10 };
    }
  }, [playerProfile]);

  // Compute stats including catalog bonuses
  const computedStats = useMemo(() => {
    const preset = CLASS_PRESETS[activeClass];
    let damageBonus = 0;
    let reachBonus = 0;
    
    // Scan catalog items matching active class
    Object.values(ITEMS_CATALOG).forEach(item => {
      if (item.heroClass === activeClass && item.statBonus) {
        damageBonus += item.statBonus.damage || 0;
        reachBonus += item.statBonus.spellReach || 0;
      }
    });

    const finalVoltage = preset.baseVoltage + damageBonus;
    const finalReach = preset.baseReach + reachBonus;

    // Ohm's physics calculation: I = V / R, P = V * I
    const current = finalVoltage / preset.baseResistance;
    const power = finalVoltage * current;

    return {
      baseVoltage: preset.baseVoltage,
      baseResistance: preset.baseResistance,
      baseReach: preset.baseReach,
      damageBonus,
      reachBonus,
      finalVoltage,
      finalReach,
      current,
      power,
      color: preset.color,
      name: preset.name,
      description: preset.description
    };
  }, [activeClass]);

  // System Operations: Predefined functions
  const handleLockRegister = async (address) => {
    addLog(`Invoking system lock operation at ${address}...`);
    try {
      const response = await fetch('/api/db/registers/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: playerProfile.username,
          registerAddress: address,
          shardCost: 1
        })
      });
      const data = await response.json();
      if (response.ok) {
        addLog(`✓ Operation Success: Applied ${data.buffType} (+${data.buffValue}) at register ${address}`);
        // Refetch players
        const refetch = await fetch('/api/db/players');
        if (refetch.ok) setPlayers(await refetch.json());
      } else {
        addLog(`⚠️ Operation Refused: ${data.error}`);
      }
    } catch (err) {
      addLog("⚠️ Network Timeout: Simulated register locked in memory.");
    }
  };

  const handleSimulateOverload = () => {
    const V = parseFloat(customVoltage);
    const R = parseFloat(customResistance);
    const I = V / R;
    const P = V * I;
    addLog(`⚙️ Calculated Friction: V=${V}V, R=${R}Ω → I=${I.toFixed(2)}A, P=${P.toFixed(2)}W`);
    if (I > 6.0) {
      addLog("🔥 [WARNING] Current exceeds 6.0A ceiling! Micro-thermal throttling active.");
    } else {
      addLog("❄️ [INFO] Thermodynamics operating within nominal 65°C governor limits.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 text-slate-100 font-sans">
      <div className="relative w-full max-w-4xl bg-slate-900/90 border border-cyan-500/30 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-slate-950/80 border-b border-cyan-500/20">
          <div className="flex items-center gap-2">
            <span className="text-xl">👑</span>
            <h2 className="text-lg font-bold font-mono tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              RPG CLASS BOARD & SYSTEM OPERATIONS
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer text-sm font-mono border border-slate-800 hover:border-slate-500 px-3 py-1 rounded"
          >
            [Close ESC]
          </button>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Class Presets Selector & Description */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
              🧬 Faction Class Registry
            </h3>
            <div className="flex flex-col gap-2">
              {Object.keys(CLASS_PRESETS).map((key) => {
                const preset = CLASS_PRESETS[key];
                const isActive = activeClass === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveClass(key);
                      addLog(`Selected archetype class: ${preset.name}`);
                    }}
                    style={{ borderColor: isActive ? preset.color : 'rgba(255,255,255,0.05)' }}
                    className={`p-3 bg-slate-950/50 hover:bg-slate-950/80 border rounded-lg text-left transition-all cursor-pointer flex flex-col`}
                  >
                    <div className="text-xs font-mono font-bold" style={{ color: preset.color }}>
                      {preset.name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                      Base V: {preset.baseVoltage}V | R: {preset.baseResistance}Ω
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected class details */}
            <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-lg">
              <h4 className="text-xs font-bold text-slate-300 font-mono">Archetype Specifications</h4>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                {computedStats.description}
              </p>
            </div>
          </div>

          {/* Column 2: Live Physics & Attribute Calculations */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
              📊 Attribute Projections
            </h3>

            <div className="bg-slate-950/60 p-4 border border-slate-800/80 rounded-lg space-y-4">
              
              {/* Voltage Stat */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Total Spell Voltage (Damage)</span>
                  <span className="text-cyan-400 font-mono font-bold">{computedStats.finalVoltage.toFixed(1)} V</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${(computedStats.finalVoltage / 12) * 100}%`, backgroundColor: computedStats.color }}
                  />
                </div>
                <span className="text-[9px] text-slate-500">Base: {computedStats.baseVoltage}V | Artifact bonus: +{computedStats.damageBonus}V</span>
              </div>

              {/* Resistance Stat */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Total Grid Resistance</span>
                  <span className="text-amber-400 font-mono font-bold">{computedStats.baseResistance.toFixed(2)} Ω</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-amber-500 transition-all duration-500" 
                    style={{ width: `${(computedStats.baseResistance / 4) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-500">Static internal resistance representing combat heat load.</span>
              </div>

              {/* Reach Stat */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Tactical Spell Reach</span>
                  <span className="text-purple-400 font-mono font-bold">{computedStats.finalReach} Hex</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-purple-500 transition-all duration-500" 
                    style={{ width: `${(computedStats.finalReach / 5) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-500">Base reach: {computedStats.baseReach} | Artifact bonus: +{computedStats.reachBonus}</span>
              </div>

              {/* Simulated Current Outcome */}
              <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-900 p-2 rounded">
                  <div className="text-[10px] text-slate-500">Current (I = V/R)</div>
                  <div className="text-sm font-mono font-bold text-emerald-400">{computedStats.current.toFixed(2)}A</div>
                </div>
                <div className="bg-slate-900 p-2 rounded">
                  <div className="text-[10px] text-slate-500">Power (P = V*I)</div>
                  <div className="text-sm font-mono font-bold text-cyan-400">{computedStats.power.toFixed(1)}W</div>
                </div>
              </div>

            </div>

            {/* Profile Prefetched Section */}
            <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-lg">
              <h4 className="text-xs font-bold text-slate-300 font-mono flex justify-between">
                <span>👤 Active Player:</span>
                <span className="text-amber-400">{playerProfile.username}</span>
              </h4>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                  <div className="text-[8px] text-slate-500">Shards</div>
                  <div className="text-xs font-mono font-bold text-cyan-400">{materials.CrystalShard || 0}</div>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                  <div className="text-[8px] text-slate-500">Spores</div>
                  <div className="text-xs font-mono font-bold text-purple-400">{materials.Spores || 0}</div>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                  <div className="text-[8px] text-slate-500">Essence</div>
                  <div className="text-xs font-mono font-bold text-amber-500">{materials.Essence || 0}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Predefined System Operations & Real-Time Log */}
          <div className="space-y-4 flex flex-col justify-between h-full">
            <div className="space-y-3">
              <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
                ⚙️ Predefined Operations
              </h3>

              {/* Buff Locks */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleLockRegister('0x00A0')}
                  className="w-full py-2 px-3 bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 rounded text-left text-xs font-mono cursor-pointer transition-all flex justify-between items-center"
                >
                  <span>🔒 Deploy 0x00A0 (Damage Buff)</span>
                  <span className="text-[9px] bg-slate-900 px-1 py-0.5 rounded text-slate-400">Cost: 1 Shard</span>
                </button>

                <button
                  onClick={() => handleLockRegister('0x00C0')}
                  className="w-full py-2 px-3 bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 rounded text-left text-xs font-mono cursor-pointer transition-all flex justify-between items-center"
                >
                  <span>🔒 Deploy 0x00C0 (Armor Buff)</span>
                  <span className="text-[9px] bg-slate-900 px-1 py-0.5 rounded text-slate-400">Cost: 1 Shard</span>
                </button>
              </div>

              {/* Dynamic Overload Calculator */}
              <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-lg space-y-3">
                <h4 className="text-[10px] font-mono text-slate-300 uppercase tracking-widest">⚡ Simulate Friction Overload</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-500 block">Voltage (V)</label>
                    <input 
                      type="number" 
                      value={customVoltage}
                      onChange={(e) => setCustomVoltage(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 block">Resistance (R)</label>
                    <input 
                      type="number" 
                      value={customResistance}
                      onChange={(e) => setCustomResistance(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-white"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSimulateOverload}
                  className="w-full py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-500/30 rounded text-xs font-mono cursor-pointer transition-all"
                >
                  Calculate Physics Friction
                </button>
              </div>
            </div>

            {/* Terminal Live logs */}
            <div className="flex-1 mt-4 min-h-[140px] flex flex-col justify-end">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[9px] leading-relaxed text-emerald-400 h-[140px] overflow-y-auto flex flex-col-reverse">
                {logs.map((log, index) => (
                  <div key={index} className="truncate">{log}</div>
                ))}
                {loading && <div className="text-slate-500 animate-pulse">Fetching active db registers...</div>}
                <div className="text-slate-500">--- Live Operational Log ---</div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
