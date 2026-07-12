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

export default function LobbyScreen({ onStartGame, onSearchMatch, isSearching, onOpenGraphicsDemo }) {
    const [name, setName] = useState('');
    const [selectedHero, setSelectedHero] = useState('thread_king_ai');

    const handleSubmit = (e, isAI) => {
        e.preventDefault();
        const nickname = name.trim() || (selectedHero === 'thread_king_ai' ? 'King_AI_Player' : 'Root_Hacker_Player');
        if (isAI) {
            onStartGame({ name: nickname, hero: selectedHero, vsAI: true });
        } else {
            onSearchMatch({ name: nickname, hero: selectedHero });
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
        <div className="w-screen h-screen flex justify-center items-center bg-black text-white font-mono relative overflow-y-auto p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.12),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.12),transparent_50%)]"></div>
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:24px_24px]"></div>
 
            <div className="bg-[#0e0e16]/80 border border-slate-800/80 p-5 md:p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] max-w-2xl w-full max-h-[90vh] overflow-y-auto z-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 relative">
                <div className="md:col-span-2 text-center pb-2 border-b border-slate-800/60">
                    <h1 className="text-xl md:text-2xl font-bold tracking-widest bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent uppercase font-mono">
                        THE LAST TRIBE
                    </h1>
                    <p className="text-[9px] md:text-[10px] text-slate-500 tracking-wider uppercase mt-1">Sovereign Arena Lobby System v1.2</p>
                </div>

                <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l-2 border-cyan-500 pl-2">1. Výber Hrdinu</h3>
                    
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <div 
                            onClick={() => setSelectedHero('thread_king_ai')}
                            className={`p-2 rounded-xl border cursor-pointer transition-all flex flex-col items-center text-center ${selectedHero === 'thread_king_ai' ? 'bg-cyan-950/40 border-cyan-500/80 shadow-[0_0_15px_rgba(0,255,255,0.2)]' : 'bg-slate-900/30 border-slate-800 hover:border-slate-700'}`}
                        >
                            <div className="w-12 h-12 bg-black/60 rounded-lg flex items-center justify-center mb-2 border border-slate-800/80">
                                <CrystalKingAvatar />
                            </div>
                            <div className="text-[9px] font-bold text-cyan-400 mb-1">CRYSTAL KING</div>
                            <div className="text-[7px] text-slate-400 leading-tight">Vysoké HP a pevný pancier.</div>
                        </div>

                        <div 
                            onClick={() => setSelectedHero('thread_hacker_root')}
                            className={`p-2 rounded-xl border cursor-pointer transition-all flex flex-col items-center text-center ${selectedHero === 'thread_hacker_root' ? 'bg-purple-950/40 border-purple-500/80 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'bg-slate-900/30 border-slate-800 hover:border-slate-700'}`}
                        >
                            <div className="w-12 h-12 bg-black/60 rounded-lg flex items-center justify-center mb-2 border border-slate-800/80">
                                <ToxicHackerAvatar />
                            </div>
                            <div className="text-[9px] font-bold text-purple-400 mb-1">TOXIC HACKER</div>
                            <div className="text-[7px] text-slate-400 leading-tight">Rýchly pohyb a loot bonusy.</div>
                        </div>

                        <div 
                            onClick={() => setSelectedHero('thread_void_weaver')}
                            className={`p-2 rounded-xl border cursor-pointer transition-all flex flex-col items-center text-center ${selectedHero === 'thread_void_weaver' ? 'bg-fuchsia-950/40 border-fuchsia-500/80 shadow-[0_0_15px_rgba(217,70,239,0.2)]' : 'bg-slate-900/30 border-slate-800 hover:border-slate-700'}`}
                        >
                            <div className="w-12 h-12 bg-black/60 rounded-lg flex items-center justify-center mb-2 border border-slate-800/80">
                                <VoidWeaverAvatar />
                            </div>
                            <div className="text-[9px] font-bold text-fuchsia-400 mb-1">VOID WEAVER</div>
                            <div className="text-[7px] text-slate-400 leading-tight">Kúzla a kontrola Entropie.</div>
                        </div>
                    </div>

                    <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl text-[10px] text-slate-400 flex gap-4 items-center">
                        <div className="w-14 h-14 bg-black/75 rounded-xl border border-slate-800 flex items-center justify-center flex-shrink-0">
                            {selectedHero === 'thread_king_ai' && <CrystalKingAvatar />}
                            {selectedHero === 'thread_hacker_root' && <ToxicHackerAvatar />}
                            {selectedHero === 'thread_void_weaver' && <VoidWeaverAvatar />}
                        </div>
                        <div className="flex flex-col gap-1 flex-1">
                            <div className="font-bold text-slate-300 uppercase tracking-wider">Vlastnosti triedy:</div>
                            {selectedHero === 'thread_king_ai' ? (
                                <ul className="list-disc pl-4 flex flex-col gap-0.5">
                                    <li>Max HP: <span className="text-cyan-400 font-bold">20 HP</span></li>
                                    <li>Brnenie: <span className="text-cyan-400 font-bold">1 Armor</span></li>
                                    <li>Drop: Zvýšená šanca na Crystal shards.</li>
                                </ul>
                            ) : selectedHero === 'thread_hacker_root' ? (
                                <ul className="list-disc pl-4 flex flex-col gap-0.5">
                                    <li>Max HP: <span className="text-purple-400 font-bold">15 HP</span></li>
                                    <li>Rýchlosť: <span className="text-purple-400 font-bold">+1 hex</span> na klzkých plochách</li>
                                    <li>Swamp: Imunita voči toxic-damage.</li>
                                </ul>
                            ) : (
                                <ul className="list-disc pl-4 flex flex-col gap-0.5">
                                    <li>Max HP: <span className="text-fuchsia-400 font-bold">14 HP</span></li>
                                    <li>Kúzla: <span className="text-fuchsia-400 font-bold">Lacnejšie karty</span> pri entropii &gt; 0.7</li>
                                    <li>Stabilita: Void karty nezvyšujú napätie.</li>
                                </ul>
                            )}
                        </div>
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

                        <button 
                            onClick={onOpenGraphicsDemo}
                            className="w-full bg-slate-900/60 hover:bg-slate-800 border border-slate-700/40 text-slate-300 py-2 px-4 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2"
                        >
                            <span>🌌</span> WebGL Graphics Showcase
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
