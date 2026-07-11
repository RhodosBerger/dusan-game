import React, { useState } from 'react';
import { TERRAIN_MAPS, DEFAULT_TERRAIN_MAP } from '../design/worldDesign';

export default function LobbyScreen({ onStartGame, onSearchMatch, isSearching }) {
    const [name, setName] = useState('');
    const [selectedHero, setSelectedHero] = useState('thread_king_ai');
    const [selectedMap, setSelectedMap] = useState(DEFAULT_TERRAIN_MAP);

    const handleSubmit = (e, isAI) => {
        e.preventDefault();
        const nickname = name.trim() || (selectedHero === 'thread_king_ai' ? 'King_AI_Player' : 'Root_Hacker_Player');
        if (isAI) {
            onStartGame({ name: nickname, hero: selectedHero, terrainMap: selectedMap, vsAI: true });
        } else {
            onSearchMatch({ name: nickname, hero: selectedHero, terrainMap: selectedMap });
        }
    };

    if (isSearching) {
        return (
            <div className="w-screen h-screen flex flex-col justify-center items-center bg-black text-white font-mono relative overflow-hidden">
                {/* Pozadie so štruktúrou */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(88,28,135,0.15),transparent_70%)]"></div>
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:16px_16px]"></div>
                
                {/* Animovaný skener */}
                <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping"></div>
                    <div className="absolute inset-2 rounded-full border-2 border-dashed border-purple-500/40 animate-spin" style={{ animationDuration: '8s' }}></div>
                    <div className="absolute inset-6 rounded-full border border-cyan-500/30 animate-pulse"></div>
                    <div className="text-cyan-400 font-bold text-center text-xs tracking-widest animate-pulse font-mono uppercase">
                        CONNECTING TO<br />SOVEREIGN GATEWAYS...
                    </div>
                </div>

                <div className="bg-[#0e0e16]/80 border border-cyan-500/40 p-6 rounded-2xl shadow-[0_0_30px_rgba(0,255,255,0.15)] text-center max-w-md z-10">
                    <h3 className="text-sm font-bold tracking-widest text-cyan-300 uppercase mb-2">Vyhľadávanie zápasu v PvP Sieti</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                        Systém analyzuje signály aktívnych klanov. Hneď ako nájde oponenta, budete automaticky teleportovaní do arény.
                    </p>
                    <div className="flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-screen h-screen flex justify-center items-center bg-black text-white font-mono relative overflow-y-auto p-4">
            {/* Pozadie */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.12),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.12),transparent_50%)]"></div>
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:24px_24px]"></div>
 
            <div className="bg-[#0e0e16]/80 border border-slate-800/80 p-5 md:p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] max-w-2xl w-full max-h-[90vh] overflow-y-auto z-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 relative">
                {/* Nadpis a logo */}
                <div className="md:col-span-2 text-center pb-2 border-b border-slate-800/60">
                    <h1 className="text-xl md:text-2xl font-bold tracking-widest bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent uppercase font-mono">
                        THE LAST TRIBE
                    </h1>
                    <p className="text-[9px] md:text-[10px] text-slate-500 tracking-wider uppercase mt-1">Sovereign Arena Lobby System v1.2</p>
                </div>

                {/* Stĺpec 1: Výber Hrdinu a Profil */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l-2 border-cyan-500 pl-2">1. Výber Hrdinu</h3>
                    
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div 
                            onClick={() => setSelectedHero('thread_king_ai')}
                            className={`p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all ${selectedHero === 'thread_king_ai' ? 'bg-cyan-950/40 border-cyan-500/80 shadow-[0_0_15px_rgba(0,255,255,0.15)]' : 'bg-slate-900/30 border-slate-800 hover:border-slate-700'}`}
                        >
                            <div className="text-[9px] sm:text-[10px] font-bold text-cyan-400 mb-1">CRYSTAL KING</div>
                            <div className="text-[8px] sm:text-[9px] text-slate-400">Pevný pancier, stabilná entropia a vysoké HP.</div>
                        </div>

                        <div 
                            onClick={() => setSelectedHero('thread_hacker_root')}
                            className={`p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all ${selectedHero === 'thread_hacker_root' ? 'bg-purple-950/40 border-purple-500/80 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'bg-slate-900/30 border-slate-800 hover:border-slate-700'}`}
                        >
                            <div className="text-[9px] sm:text-[10px] font-bold text-purple-400 mb-1">TOXIC HACKER</div>
                            <div className="text-[8px] sm:text-[9px] text-slate-400">Rýchly pohyb, odolnosť voči močiarom a loot bonusy.</div>
                        </div>
                    </div>

                    <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl text-[10px] text-slate-400 flex flex-col gap-2">
                        <div className="font-bold text-slate-300 uppercase tracking-wider">Vlastnosti triedy:</div>
                        {selectedHero === 'thread_king_ai' ? (
                            <ul className="list-disc pl-4 flex flex-col gap-1">
                                <li>Max HP: <span className="text-cyan-400">20 HP</span> (štartovacie)</li>
                                <li>Brnenie: <span className="text-cyan-400">1 Armor</span></li>
                                <li>Kombinatorika: Vyššia šanca na nájdenie Crystal shards.</li>
                            </ul>
                        ) : (
                            <ul className="list-disc pl-4 flex flex-col gap-1">
                                <li>Max HP: <span className="text-purple-400">15 HP</span></li>
                                <li>Pohyb: <span className="text-purple-400">+1 hex dosah</span> na klzkých plochách</li>
                                <li>Toxic immun: Imunita voči toxic-damage na swamp tileoch.</li>
                            </ul>
                        )}
                    </div>
                </div>

                {/* Stĺpec 2: Profil Hráča a Estetika */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l-2 border-purple-500 pl-2">2. Nastavenia a Estetika</h3>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-slate-400 uppercase">Meno Hráča:</label>
                        <input 
                            type="text" 
                            placeholder="Zadajte alias..." 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={15}
                            className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 text-cyan-300 font-bold"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-slate-400 uppercase">Bojové územie:</label>
                        <div className="grid grid-cols-2 gap-2">
                            {TERRAIN_MAPS.map(m => (
                                <div
                                    key={m.id}
                                    onClick={() => setSelectedMap(m.id)}
                                    className={`p-2 rounded-xl border cursor-pointer transition-all text-center ${selectedMap === m.id ? 'bg-cyan-950/40 border-cyan-500/80 shadow-[0_0_15px_rgba(0,255,255,0.15)]' : 'bg-slate-900/30 border-slate-800 hover:border-slate-700'}`}
                                >
                                    <div className="text-lg leading-none mb-1">{m.icon}</div>
                                    <div className="text-[9px] font-bold text-slate-300">{m.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Akčné tlačidlá */}
                    <div className="flex flex-col gap-2 mt-auto">
                        <button 
                            onClick={(e) => handleSubmit(e, false)}
                            className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold py-2.5 px-4 rounded-xl border border-cyan-400/40 text-xs uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2"
                        >
                            <span>⚔️</span> Vstúpiť do PvP Siete
                        </button>
                        
                        <button 
                            onClick={(e) => handleSubmit(e, true)}
                            className="w-full bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 py-2 px-4 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2"
                        >
                            <span>🤖</span> Trénovať proti AI
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
