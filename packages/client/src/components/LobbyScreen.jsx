import React, { useState } from 'react';

function CrystalKingAvatar() {
    return (
        <svg viewBox="0 0 100 100" className="w-12 h-12 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] animate-pulse">
            <defs>
                <linearGradient id="crystalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#0891b2" />
                </linearGradient>
            </defs>
            <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" fill="none" stroke="#22d3ee" strokeWidth="1.5" opacity="0.3" />
            <polygon points="50,25 65,45 50,55 35,45" fill="url(#crystalGrad)" />
            <polygon points="50,25 75,35 65,45" fill="#0891b2" opacity="0.8" />
            <polygon points="50,25 25,35 35,45" fill="#22d3ee" opacity="0.9" />
            <polygon points="50,55 65,45 80,60 50,75" fill="url(#crystalGrad)" opacity="0.75" />
            <polygon points="50,55 35,45 20,60 50,75" fill="url(#crystalGrad)" opacity="0.75" />
            <circle cx="50" cy="45" r="4" fill="#ffffff" className="animate-ping" style={{ animationDuration: '2s' }} />
        </svg>
    );
}

function ToxicHackerAvatar() {
    return (
        <svg viewBox="0 0 100 100" className="w-12 h-12 drop-shadow-[0_0_8px_rgba(57,255,20,0.6)]">
            <defs>
                <linearGradient id="toxicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#39ff14" />
                    <stop offset="100%" stopColor="#059669" />
                </linearGradient>
            </defs>
            <line x1="20" y1="20" x2="80" y2="80" stroke="#39ff14" strokeWidth="0.5" opacity="0.2" />
            <line x1="80" y1="20" x2="20" y2="80" stroke="#39ff14" strokeWidth="0.5" opacity="0.2" />
            <path d="M50,15 C30,15 25,35 25,50 C25,65 35,75 50,75 C65,75 75,65 75,50 C75,35 70,15 50,15 Z" fill="none" stroke="url(#toxicGrad)" strokeWidth="2.5" />
            <polygon points="30,45 70,45 65,58 35,58" fill="#000000" stroke="#39ff14" strokeWidth="1" />
            <rect x="38" y="49" width="6" height="2" fill="#39ff14" />
            <rect x="56" y="49" width="6" height="2" fill="#39ff14" />
            <text x="18" y="30" fill="#39ff14" fontSize="8" fontFamily="monospace" opacity="0.4" className="animate-pulse">1</text>
            <text x="75" y="40" fill="#39ff14" fontSize="8" fontFamily="monospace" opacity="0.3">0</text>
            <text x="22" y="70" fill="#39ff14" fontSize="8" fontFamily="monospace" opacity="0.3">0</text>
            <text x="72" y="75" fill="#39ff14" fontSize="8" fontFamily="monospace" opacity="0.5" className="animate-pulse">1</text>
        </svg>
    );
}

function VoidWeaverAvatar() {
    return (
        <svg viewBox="0 0 100 100" className="w-12 h-12 drop-shadow-[0_0_8px_rgba(217,70,239,0.6)]">
            <defs>
                <linearGradient id="voidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d946ef" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#4a044e" stopOpacity="0.9" />
                </linearGradient>
            </defs>
            <ellipse cx="50" cy="50" rx="35" ry="12" fill="none" stroke="#d946ef" strokeWidth="1" transform="rotate(30, 50, 50)" opacity="0.4" className="animate-spin" style={{ animationDuration: '10s' }} />
            <ellipse cx="50" cy="50" rx="35" ry="12" fill="none" stroke="#a855f7" strokeWidth="1" transform="rotate(-30, 50, 50)" opacity="0.4" className="animate-spin" style={{ animationDuration: '6s' }} />
            <circle cx="50" cy="50" r="16" fill="url(#voidGrad)" />
            <circle cx="50" cy="50" r="14" fill="#000000" />
            <circle cx="50" cy="50" r="8" fill="url(#voidGrad)" className="animate-ping" style={{ animationDuration: '3s' }} />
            <polygon points="50,15 52,30 50,32 48,30" fill="#d946ef" />
            <polygon points="50,85 52,70 50,68 48,70" fill="#d946ef" />
            <polygon points="15,50 30,52 32,50 30,48" fill="#d946ef" />
            <polygon points="85,50 70,52 68,50 70,48" fill="#d946ef" />
        </svg>
    );
}

export default function LobbyScreen({ onStartGame, onSearchMatch, isSearching, onOpenGraphicsDemo, onOpenBuilder, onOpenComposer, onOpenB2B }) {
    const [name, setName] = useState('');
    const [selectedHero, setSelectedHero] = useState('thread_king_ai');
    const [mashupMode, setMashupMode] = useState('STANDARD');

    const handleSubmit = (e, isAI) => {
        e.preventDefault();
        const nickname = name.trim() || (selectedHero === 'thread_king_ai' ? 'King_AI_Player' : 'Root_Hacker_Player');
        if (isAI) {
            onStartGame({ name: nickname, hero: selectedHero, vsAI: true, mode: mashupMode });
        } else {
            onSearchMatch({ name: nickname, hero: selectedHero, mode: mashupMode });
        }
    };

    if (isSearching) {
        return (
            <div className="w-screen h-screen flex flex-col justify-center items-center bg-black text-white font-mono relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(88,28,135,0.15),transparent_70%)]"></div>
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:16px_16px]"></div>
                
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
        <div className="w-screen h-screen flex justify-center items-center bg-black text-white relative overflow-y-auto p-4 font-sans">
            {/* Cyber Grid background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.18),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.18),transparent_50%)]"></div>
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_95%,rgba(45,211,241,0.3)_95%),linear-gradient(90deg,rgba(18,16,16,0)_95%,rgba(45,211,241,0.3)_95%)] [background-size:32px_32px]"></div>
 
            {/* AAA Glass Panel Container with Cyber Decor */}
            <div className="glass-panel-heavy scanline-effect p-6 md:p-8 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] max-w-2xl w-full max-h-[92vh] overflow-y-auto z-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 relative border border-cyan-500/30">
                {/* Tech crosshairs */}
                <div className="absolute top-2 left-2 text-cyan-500/40 font-mono text-[8px] select-none pointer-events-none">SYS_READY // LOBBY</div>
                <div className="absolute bottom-2 right-2 text-purple-500/40 font-mono text-[8px] select-none pointer-events-none">SECURE_GATEWAY_V2</div>

                <div className="md:col-span-2 text-center pb-3 border-b border-slate-800/80">
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-widest bg-gradient-to-r from-cyan-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent uppercase font-heading glow-text-cyan">
                        POSLEDNÝ KMEN
                    </h1>
                    <div className="flex justify-center items-center gap-2 mt-1.5">
                        <span className="h-[1px] w-8 bg-cyan-500/30"></span>
                        <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">SOVEREIGN NETWORK INTERFACE</span>
                        <span className="h-[1px] w-8 bg-cyan-500/30"></span>
                    </div>
                </div>
 
                <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-l-2 border-cyan-400 pl-2 font-heading">1. Výber Hrdinu</h3>
                    
                    <div className="grid grid-cols-3 gap-2.5">
                        {/* Crystal King */}
                        <div 
                            onClick={() => setSelectedHero('thread_king_ai')}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col items-center text-center relative ${selectedHero === 'thread_king_ai' ? 'bg-cyan-950/30 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.25)] scale-[1.03]' : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/20'}`}
                        >
                            <div className="w-12 h-12 bg-slate-950/70 rounded-lg flex items-center justify-center mb-2 border border-slate-800/60">
                                <CrystalKingAvatar />
                            </div>
                            <div className="text-[10px] font-bold text-cyan-400 mb-0.5 font-heading">CRYSTAL</div>
                            <div className="text-[8px] text-slate-400 leading-tight">Vysoké HP & Pevný pancier</div>
                        </div>
 
                        {/* Toxic Hacker */}
                        <div 
                            onClick={() => setSelectedHero('thread_hacker_root')}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col items-center text-center relative ${selectedHero === 'thread_hacker_root' ? 'bg-purple-950/30 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.25)] scale-[1.03]' : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/20'}`}
                        >
                            <div className="w-12 h-12 bg-slate-950/70 rounded-lg flex items-center justify-center mb-2 border border-slate-800/60">
                                <ToxicHackerAvatar />
                            </div>
                            <div className="text-[10px] font-bold text-purple-400 mb-0.5 font-heading">TOXIC</div>
                            <div className="text-[8px] text-slate-400 leading-tight">Rýchly pohyb & Korózia</div>
                        </div>
 
                        {/* Void Weaver */}
                        <div 
                            onClick={() => setSelectedHero('thread_void_weaver')}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col items-center text-center relative ${selectedHero === 'thread_void_weaver' ? 'bg-fuchsia-950/30 border-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.25)] scale-[1.03]' : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/20'}`}
                        >
                            <div className="w-12 h-12 bg-slate-950/70 rounded-lg flex items-center justify-center mb-2 border border-slate-800/60">
                                <VoidWeaverAvatar />
                            </div>
                            <div className="text-[10px] font-bold text-fuchsia-400 mb-0.5 font-heading">VOID</div>
                            <div className="text-[8px] text-slate-400 leading-tight">Entropy kúzla & Zadarmo cast</div>
                        </div>
                    </div>
 
                    {/* Class Details Panel */}
                    <div className="bg-slate-950/60 border border-slate-800/60 p-4 rounded-xl text-xs text-slate-400 flex gap-4 items-center">
                        <div className="w-14 h-14 bg-slate-900/80 rounded-xl border border-slate-850 flex items-center justify-center flex-shrink-0 shadow-inner">
                            {selectedHero === 'thread_king_ai' && <CrystalKingAvatar />}
                            {selectedHero === 'thread_hacker_root' && <ToxicHackerAvatar />}
                            {selectedHero === 'thread_void_weaver' && <VoidWeaverAvatar />}
                        </div>
                        <div className="flex flex-col gap-1 flex-1 font-mono">
                            <div className="font-bold text-slate-200 uppercase tracking-wider text-[10px] font-heading">Class Matrix Specs:</div>
                            {selectedHero === 'thread_king_ai' ? (
                                <ul className="list-none pl-0 flex flex-col gap-0.5 text-[10px]">
                                    <li>- Max HP: <span className="text-cyan-400 font-bold">20 HP</span></li>
                                    <li>- Armor: <span className="text-cyan-400 font-bold">1 Armor</span></li>
                                    <li>- Mastery: Zvýšený výskyt Crystal Shards.</li>
                                </ul>
                            ) : selectedHero === 'thread_hacker_root' ? (
                                <ul className="list-none pl-0 flex flex-col gap-0.5 text-[10px]">
                                    <li>- Max HP: <span className="text-purple-400 font-bold">15 HP</span></li>
                                    <li>- Rýchlosť: <span className="text-purple-400 font-bold">+1 hex</span> na spórových plochách</li>
                                    <li>- Mastery: Imunita voči toxic-hazard škodám.</li>
                                </ul>
                            ) : (
                                <ul className="list-none pl-0 flex flex-col gap-0.5 text-[10px]">
                                    <li>- Max HP: <span className="text-fuchsia-400 font-bold">14 HP</span></li>
                                    <li>- Spells: Bezplatné kúzlenie pri entropii &gt; 0.70</li>
                                    <li>- Mastery: Void kúzla nespôsobujú prepätie mriežky.</li>
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
 
                {/* Column 2: Player Profile & Operations */}
                <div className="flex flex-col gap-4 justify-between">
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-l-2 border-purple-400 pl-2 font-heading">2. Konfigurácia</h3>
 
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-slate-400 uppercase font-heading">Alias Vlákna (Meno):</label>
                            <input 
                                type="text" 
                                placeholder="Zadajte sieťový alias..." 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                maxLength={15}
                                className="bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 text-cyan-300 font-bold transition-all placeholder-slate-600 font-mono"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5 mt-2">
                            <label className="text-[10px] text-slate-400 uppercase font-heading">Herné pravidlá (Mashup):</label>
                            <select 
                                value={mashupMode}
                                onChange={(e) => setMashupMode(e.target.value)}
                                className="bg-slate-950/70 border border-slate-850 rounded-xl px-4 py-2 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-550 font-mono"
                            >
                                <option value="STANDARD">Standard Arena Rules</option>
                                <option value="VOLTAGE_GLACIER">Mashup: Voltage Overload & Frost Friction</option>
                                <option value="VOID_TOXIC">Mashup: Void Rift & Toxic Corrosion</option>
                            </select>
                        </div>
                    </div>
 
                    {/* Action buttons */}
                    <div className="flex flex-col gap-2.5 mt-6">
                        <button 
                            onClick={(e) => handleSubmit(e, false)}
                            className="w-full cyber-btn bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold py-3 px-4 text-xs uppercase tracking-wider cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 border-0"
                            style={{ color: '#020617' }}
                        >
                            <span>⚔️</span> Vstúpiť do PvP Arény
                        </button>
                        
                        <button 
                            onClick={(e) => handleSubmit(e, true)}
                            className="w-full cyber-btn bg-slate-950/60 hover:bg-slate-900 border border-purple-500/50 text-purple-300 font-bold py-2.5 px-4 text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
                        >
                            <span>🤖</span> Trénovať proti AI
                        </button>
 
                        <button 
                            onClick={onOpenGraphicsDemo}
                            className="w-full cyber-btn bg-slate-950/40 hover:bg-slate-900 border border-slate-800/80 text-slate-400 hover:text-slate-200 font-bold py-2.5 px-4 text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
                        >
                            <span>🌌</span> WebGL Graphics Showcase
                        </button>

                        <button 
                            onClick={onOpenBuilder}
                            className="w-full cyber-btn bg-slate-950/40 hover:bg-slate-900 border border-cyan-800/80 text-cyan-400 hover:text-cyan-200 font-bold py-2.5 px-4 text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
                        >
                            <span>🛠️</span> Sovereign Builder CMS
                        </button>

                        <button 
                            onClick={onOpenComposer}
                            className="w-full cyber-btn bg-slate-950/40 hover:bg-slate-900 border border-yellow-800/80 text-yellow-400 hover:text-yellow-200 font-bold py-2.5 px-4 text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
                        >
                            <span>📋</span> Board Composer
                        </button>

                        <button 
                            onClick={onOpenB2B}
                            className="w-full cyber-btn bg-slate-950/40 hover:bg-slate-900 border border-emerald-800/80 text-emerald-400 hover:text-emerald-200 font-bold py-2.5 px-4 text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
                        >
                            <span>💼</span> B2B Backoffice Portal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
