import React from 'react';

export default function TelemetryDashboard({ onClose }) {
    const [activeTab, setActiveTab] = React.useState('registers');
    const [registers, setRegisters] = React.useState([]);
    const [players, setPlayers] = React.useState([]);
    const [goTelemetry, setGoTelemetry] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState('');

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true);
            const regRes = await fetch('/api/db/registers');
            const regData = await regRes.json();
            setRegisters(Array.isArray(regData) ? regData : []);

            const playRes = await fetch('/api/db/players');
            const playData = await playRes.json();
            setPlayers(Array.isArray(playData) ? playData : []);

            const goRes = await fetch('http://localhost:8081/api/telemetry/analytics');
            const goData = await goRes.json();
            setGoTelemetry(goData);
        } catch (err) {
            console.error('[TELEMETRY] Failed to fetch live data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 4000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const filteredRegisters = registers.filter(reg => 
        reg.register_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // SVG radial breakdown variables
    const getMannerPieData = () => {
        if (!goTelemetry?.mannerDistribution) return { attack: 33, defense: 33, spell: 34 };
        const { attack = 0, defense = 0, spell = 0 } = goTelemetry.mannerDistribution;
        const total = attack + defense + spell;
        if (total === 0) return { attack: 33, defense: 33, spell: 34 };
        return {
            attack: (attack / total) * 100,
            defense: (defense / total) * 100,
            spell: (spell / total) * 100
        };
    };

    const pie = getMannerPieData();

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl h-[85vh] bg-[#05050b]/95 border border-purple-500/40 rounded-3xl flex flex-col overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.25)] text-white font-mono pointer-events-auto">
                {/* Header */}
                <div className="p-5 border-b border-purple-500/20 bg-purple-950/20 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg md:text-xl font-extrabold uppercase tracking-widest text-purple-400 flex items-center gap-2">
                            <span>📊</span> Sovereign Telemetria & SQLite Registry
                        </h2>
                        <p className="text-[10px] text-slate-400 mt-0.5">&gt; LIVE SYSTEM REGISTERS AND DYNAMIC ANALYTICS</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={fetchData} 
                            className="bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 text-purple-300 text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                            🔄 Obnoviť
                        </button>
                        <button 
                            onClick={onClose} 
                            className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1 cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-purple-500/10 bg-slate-950/40 text-xs md:text-sm">
                    <button 
                        onClick={() => setActiveTab('registers')}
                        className={`flex-1 py-3 text-center border-b-2 font-bold cursor-pointer transition-all ${activeTab === 'registers' ? 'border-purple-500 text-purple-300 bg-purple-950/10' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                    >
                        📜 Systémové Registre ({registers.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('players')}
                        className={`flex-1 py-3 text-center border-b-2 font-bold cursor-pointer transition-all ${activeTab === 'players' ? 'border-purple-500 text-purple-300 bg-purple-950/10' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                    >
                        👤 Hráčske Profily ({players.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('gocore')}
                        className={`flex-1 py-3 text-center border-b-2 font-bold cursor-pointer transition-all ${activeTab === 'gocore' ? 'border-purple-500 text-purple-300 bg-purple-950/10' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                    >
                        ⚡ Go Core Analytika
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    {loading && registers.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                            Načítavam dáta z databázy...
                        </div>
                    ) : (
                        <>
                            {/* Tab 1: Registers */}
                            {activeTab === 'registers' && (
                                <div className="flex flex-col gap-4">
                                    <div className="flex gap-2">
                                        <input 
                                            type="text"
                                            placeholder="Vyhľadať register podľa adresy alebo popisu..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-[#0a0a14] border border-purple-500/20 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500/50"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2.5">
                                        {filteredRegisters.length === 0 ? (
                                            <div className="text-slate-500 text-xs py-8 text-center border border-slate-800/40 rounded-2xl">Žiadne registre nezodpovedajú vyhľadávaniu.</div>
                                        ) : (
                                            filteredRegisters.map((reg) => (
                                                <div key={reg.id} className="bg-[#0b0b14]/75 border border-slate-800/80 p-3.5 rounded-xl flex flex-col md:flex-row justify-between gap-3 items-start md:items-center hover:border-purple-500/30 transition-colors">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="bg-purple-950 text-purple-300 border border-purple-500/30 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">{reg.register_address}</span>
                                                            <span className="text-[10px] text-slate-400 font-mono">{new Date(reg.timestamp).toLocaleString()}</span>
                                                        </div>
                                                        <div className="text-xs text-slate-200 mt-1">{reg.description}</div>
                                                    </div>
                                                    <div className="w-full md:w-auto bg-black/60 border border-slate-900 px-3 py-1.5 rounded font-mono text-[9px] text-green-400 max-h-16 overflow-y-auto overflow-x-auto whitespace-pre select-all">
                                                        {reg.hex_dump || '0x00'}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Tab 2: Players */}
                            {activeTab === 'players' && (
                                <div className="flex flex-col gap-4">
                                    <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="bg-purple-950/20 border-b border-slate-800 text-purple-300 font-bold uppercase tracking-wider">
                                                    <th className="p-3.5">Užívateľské meno</th>
                                                    <th className="p-3.5">Level</th>
                                                    <th className="p-3.5">XP</th>
                                                    <th className="p-3.5">Max HP</th>
                                                    <th className="p-3.5">Armor</th>
                                                    <th className="p-3.5">Suroviny</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {players.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="6" className="p-6 text-center text-slate-500">Žiadne zaregistrované hráčske profily.</td>
                                                    </tr>
                                                ) : (
                                                    players.map((p) => {
                                                        const mats = JSON.parse(p.materials || '{}');
                                                        return (
                                                            <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-950/50 transition-colors">
                                                                <td className="p-3.5 font-bold text-slate-200">{p.username}</td>
                                                                <td className="p-3.5 text-cyan-400 font-bold">{p.level}</td>
                                                                <td className="p-3.5 text-slate-400">{p.xp}</td>
                                                                <td className="p-3.5 text-rose-400 font-bold">{p.max_health} HP</td>
                                                                <td className="p-3.5 text-emerald-400 font-bold">+{p.armor}</td>
                                                                <td className="p-3.5 text-[10px] text-slate-400">
                                                                    {Object.entries(mats).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Tab 3: Go Core */}
                            {activeTab === 'gocore' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Stats Card */}
                                    <div className="bg-[#0b0b14]/75 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4">
                                        <h3 className="text-xs font-extrabold uppercase text-purple-400 tracking-wider font-bold">Metriky Súbojov (Ohmic metrics)</h3>
                                        
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between text-xs border-b border-slate-800/50 pb-2">
                                                <span className="text-slate-400">Celkový počet bojov:</span>
                                                <span className="text-white font-bold font-mono">{goTelemetry?.totalCombatEvents || 0}</span>
                                            </div>
                                            <div className="flex justify-between text-xs border-b border-slate-800/50 pb-2">
                                                <span className="text-slate-400">Priemerné napätie ($V_{avg}$):</span>
                                                <span className="text-cyan-400 font-bold font-mono">{(goTelemetry?.avgMagnitude || 0).toFixed(2)} V</span>
                                            </div>
                                            <div className="flex justify-between text-xs border-b border-slate-800/50 pb-2">
                                                <span className="text-slate-400">Detegované anomálie:</span>
                                                <span className="text-red-400 font-bold font-mono animate-pulse">{goTelemetry?.anomalyAlertsCount || 0}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">Posledný prepočet:</span>
                                                <span className="text-slate-500 font-mono">Práve teraz</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Interactive SVG Pie/Donut Chart */}
                                    <div className="bg-[#0b0b14]/75 border border-slate-800 p-5 rounded-2xl flex flex-col items-center gap-4">
                                        <h3 className="text-xs font-extrabold uppercase text-purple-400 tracking-wider w-full text-left font-bold">Rozdelenie Akčných Slučiek</h3>
                                        
                                        <div className="relative w-36 h-36 flex items-center justify-center">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                                {/* Attack Slice */}
                                                <circle 
                                                    cx="50" cy="50" r="40" 
                                                    className="stroke-red-500 fill-transparent" 
                                                    strokeWidth="10" 
                                                    strokeDasharray={`${2.51 * pie.attack} 251.2`} 
                                                    strokeDashoffset="0"
                                                />
                                                {/* Defense Slice */}
                                                <circle 
                                                    cx="50" cy="50" r="40" 
                                                    className="stroke-emerald-500 fill-transparent" 
                                                    strokeWidth="10" 
                                                    strokeDasharray={`${2.51 * pie.defense} 251.2`} 
                                                    strokeDashoffset={`-${2.51 * pie.attack}`}
                                                />
                                                {/* Spell Slice */}
                                                <circle 
                                                    cx="50" cy="50" r="40" 
                                                    className="stroke-cyan-500 fill-transparent" 
                                                    strokeWidth="10" 
                                                    strokeDasharray={`${2.51 * pie.spell} 251.2`} 
                                                    strokeDashoffset={`-${2.51 * (pie.attack + pie.defense)}`}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                                <span className="text-[10px] text-slate-400">Celkom</span>
                                                <span className="text-sm font-bold text-white">{(goTelemetry?.mannerDistribution?.attack || 0) + (goTelemetry?.mannerDistribution?.defense || 0) + (goTelemetry?.mannerDistribution?.spell || 0)}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 text-[9px] font-mono mt-1">
                                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-500 rounded"></span> Útok ({pie.attack.toFixed(0)}%)</span>
                                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded"></span> Obrana ({pie.defense.toFixed(0)}%)</span>
                                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-cyan-500 rounded"></span> Kúzlo ({pie.spell.toFixed(0)}%)</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
