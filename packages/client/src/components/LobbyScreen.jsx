import React, { useState, useEffect, useRef } from 'react';
import { preloadAllHeroModels } from './HeroModel3D';

function CyberGridBackground() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.45;
                this.vy = (Math.random() - 0.5) * 0.45;
                this.radius = Math.random() * 1.5 + 0.5;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
                ctx.fill();
            }
        }

        const count = Math.min(50, Math.floor((canvas.width * canvas.height) / 22000));
        const particles = Array.from({ length: count }, () => new Particle());

        const drawGrid = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.1)';
            ctx.lineWidth = 0.5;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const actualDist = Math.sqrt(dx * dx + dy * dy);
                    if (actualDist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            particles.forEach(p => {
                p.update();
                p.draw();
            });

            ctx.strokeStyle = 'rgba(6, 182, 212, 0.02)';
            ctx.lineWidth = 1;
            const gridSize = 45;
            for (let x = 0; x < canvas.width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            for (let y = 0; y < canvas.height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            animationFrameId = requestAnimationFrame(drawGrid);
        };

        drawGrid();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" style={{ opacity: 0.65 }} />;
}

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

    useEffect(() => {
        preloadAllHeroModels();
    }, []);

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
        <div className="w-screen h-screen flex justify-center items-center bg-[#150f0a] text-white relative overflow-y-auto p-4 font-sans">
            {/* Warm dark medieval radial gradient background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,38,24,0.3)_0%,#0e0a07_100%)]"></div>
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(rgba(212,175,55,0.2)_1px,transparent_1px)] [background-size:20px_20px]"></div>
 
            {/* AAA Glass Panel Container with Medieval Trim */}
            <div className="glass-panel-heavy p-6 md:p-8 rounded-2xl shadow-[0_12px_60px_rgba(0,0,0,0.95)] max-w-2xl w-full max-h-[92vh] overflow-y-auto z-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 relative border border-[#bd9b60]/50">
                {/* Decorative medieval corner text */}
                <div className="absolute top-3 left-3 text-[#bd9b60]/60 font-mono text-[7px] select-none pointer-events-none tracking-widest">WAR_COUNCIL // LOBBY</div>
                <div className="absolute bottom-3 right-3 text-[#bd9b60]/60 font-mono text-[7px] select-none pointer-events-none tracking-widest">SOVEREIGN_GATEWAY_V2</div>

                <div className="md:col-span-2 text-center pb-3 border-b border-[#3d2f23]">
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-widest bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent uppercase font-heading drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        POSLEDNÝ KMEN
                    </h1>
                    <div className="flex justify-center items-center gap-2 mt-1.5">
                        <span className="h-[1px] w-8 bg-[#bd9b60]/30"></span>
                        <span className="text-[10px] text-[#c5bba8] font-mono tracking-widest uppercase">WARLORD COMMAND GATEWAY</span>
                        <span className="h-[1px] w-8 bg-[#bd9b60]/30"></span>
                    </div>
                </div>
 
                <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-l-2 border-[#bd9b60] pl-2 font-heading">1. Výber Hrdinu</h3>
                             <div className="grid grid-cols-3 gap-2.5">
                        {/* Crystal King */}
                        <div 
                            onClick={() => setSelectedHero('thread_king_ai')}
                            className={`hs-card h-52 w-full p-2 flex flex-col justify-between cursor-pointer relative ${selectedHero === 'thread_king_ai' ? 'active' : ''}`}
                        >
                            <div className="hs-card-cost-badge">1</div>
                            <div className="hs-card-art-frame">
                                <div className="hs-card-art-inner hs-art-crystal">
                                    <div className="absolute inset-0 flex items-center justify-center p-2">
                                        <CrystalKingAvatar />
                                    </div>
                                </div>
                            </div>
                            <div className="hs-card-name-banner">
                                <div className="hs-card-title">CRYSTAL</div>
                            </div>
                            <div className="hs-card-desc-box">
                                <p className="hs-card-desc-text">Vysoké HP & Pevný pancier</p>
                            </div>
                            <div className="hs-card-stat-badge hs-attack" title="Max HP">20</div>
                            <div className="hs-card-stat-badge hs-defense" title="Armor">1</div>
                        </div>

                        {/* Toxic Hacker */}
                        <div 
                            onClick={() => setSelectedHero('thread_hacker_root')}
                            className={`hs-card h-52 w-full p-2 flex flex-col justify-between cursor-pointer relative ${selectedHero === 'thread_hacker_root' ? 'active' : ''}`}
                        >
                            <div className="hs-card-cost-badge">2</div>
                            <div className="hs-card-art-frame">
                                <div className="hs-card-art-inner hs-art-toxic">
                                    <div className="absolute inset-0 flex items-center justify-center p-2">
                                        <ToxicHackerAvatar />
                                    </div>
                                </div>
                            </div>
                            <div className="hs-card-name-banner">
                                <div className="hs-card-title">TOXIC</div>
                            </div>
                            <div className="hs-card-desc-box">
                                <p className="hs-card-desc-text">Rýchly pohyb & Korózia</p>
                            </div>
                            <div className="hs-card-stat-badge hs-attack" title="Max HP">15</div>
                            <div className="hs-card-stat-badge hs-defense" title="Armor">0</div>
                        </div>

                        {/* Void Weaver */}
                        <div 
                            onClick={() => setSelectedHero('thread_void_weaver')}
                            className={`hs-card h-52 w-full p-2 flex flex-col justify-between cursor-pointer relative ${selectedHero === 'thread_void_weaver' ? 'active' : ''}`}
                        >
                            <div className="hs-card-cost-badge">3</div>
                            <div className="hs-card-art-frame">
                                <div className="hs-card-art-inner hs-art-void">
                                    <div className="absolute inset-0 flex items-center justify-center p-2">
                                        <VoidWeaverAvatar />
                                    </div>
                                </div>
                            </div>
                            <div className="hs-card-name-banner">
                                <div className="hs-card-title">VOID</div>
                            </div>
                            <div className="hs-card-desc-box">
                                <p className="hs-card-desc-text">Entropy & Zadarmo cast</p>
                            </div>
                            <div className="hs-card-stat-badge hs-attack" title="Max HP">14</div>
                            <div className="hs-card-stat-badge hs-defense" title="Armor">0</div>
                        </div>
                    </div>
 
                    {/* Class Details Panel (Dota 2 themed) */}
                    <div className="glass-panel-heavy p-4 rounded-xl text-xs text-slate-400 flex gap-4 items-center">
                        <div className="w-14 h-14 bg-slate-900/80 rounded-xl border border-[#4a3b2c] flex items-center justify-center flex-shrink-0 shadow-inner">
                            {selectedHero === 'thread_king_ai' && <CrystalKingAvatar />}
                            {selectedHero === 'thread_hacker_root' && <ToxicHackerAvatar />}
                            {selectedHero === 'thread_void_weaver' && <VoidWeaverAvatar />}
                        </div>
                        <div className="flex flex-col gap-1 flex-1 font-sans">
                            <div className="font-bold text-slate-200 uppercase tracking-wider text-[10px] font-heading">Class Matrix Specs:</div>
                            {selectedHero === 'thread_king_ai' ? (
                                <ul className="list-none pl-0 flex flex-col gap-0.5 text-[10px]">
                                    <li>- Max HP: <span className="text-yellow-500 font-bold">20 HP</span></li>
                                    <li>- Armor: <span className="text-yellow-500 font-bold">1 Armor</span></li>
                                    <li>- Mastery: Zvýšený výskyt Crystal Shards.</li>
                                </ul>
                            ) : selectedHero === 'thread_hacker_root' ? (
                                <ul className="list-none pl-0 flex flex-col gap-0.5 text-[10px]">
                                    <li>- Max HP: <span className="text-yellow-500 font-bold">15 HP</span></li>
                                    <li>- Rýchlosť: <span className="text-yellow-500 font-bold">+1 hex</span> na spórových plochách</li>
                                    <li>- Mastery: Imunita voči toxic-hazard škodám.</li>
                                </ul>
                            ) : (
                                <ul className="list-none pl-0 flex flex-col gap-0.5 text-[10px]">
                                    <li>- Max HP: <span className="text-yellow-500 font-bold">14 HP</span></li>
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
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-l-2 border-[#bd9b60] pl-2 font-heading">2. Konfigurácia</h3>
 
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-slate-400 uppercase font-heading">Alias Vlákna (Meno):</label>
                            <input 
                                type="text" 
                                placeholder="Zadajte sieťový alias..." 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                maxLength={15}
                                className="bg-[#1c140d]/80 border border-[#4a3b2c] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/30 text-[#f5f2eb] font-bold transition-all placeholder-slate-600 font-sans"
                            />
                        </div>
 
                        <div className="flex flex-col gap-1.5 mt-2">
                            <label className="text-[10px] text-slate-400 uppercase font-heading">Herné pravidlá (Mashup):</label>
                            <select 
                                value={mashupMode}
                                onChange={(e) => setMashupMode(e.target.value)}
                                className="bg-[#1c140d]/80 border border-[#4a3b2c] rounded-xl px-4 py-2 text-xs text-[#f5f2eb] font-bold focus:outline-none focus:border-[#d4af37] font-sans"
                            >
                                <option value="STANDARD">Standard Arena Rules</option>
                                <option value="VOLTAGE_GLACIER">Mashup: Voltage Overload & Frost Friction</option>
                                <option value="VOID_TOXIC">Mashup: Void Rift & Toxic Corrosion</option>
                            </select>
                        </div>
 
                        {/* Dusan's Customized Mazak Model Grid Preview */}
                        <div className="flex flex-col gap-1.5 mt-2.5">
                            <label className="text-[10px] text-slate-400 uppercase font-heading">
                                Dusan's Customized Mazak Arena Model:
                            </label>
                            <div className="grid grid-cols-3 gap-1 w-32 bg-[#1c140d]/80 p-1.5 rounded-lg border border-[#4a3b2c]/80">
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                                    const weights = { 0: 0.8, 1: 0.5, 2: 0.8, 3: 0.5, 4: 1.0, 5: 0.5, 6: 0.8, 7: 0.5, 8: 0.8 };
                                    const w = weights[i];
                                    return (
                                        <div 
                                            key={i} 
                                            className="h-6 rounded flex items-center justify-center text-[7px] font-bold font-mono transition-all duration-300 hover:scale-105"
                                            style={{
                                                background: w === 1.0 
                                                    ? 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)' 
                                                    : w === 0.8 
                                                    ? 'rgba(184, 134, 11, 0.25)' 
                                                    : 'rgba(74, 59, 44, 0.3)',
                                                border: w === 1.0 
                                                    ? '1px solid #d4af37' 
                                                    : w === 0.8 
                                                    ? '1px solid rgba(184, 134, 11, 0.4)' 
                                                    : '1px solid rgba(255, 255, 255, 0.02)',
                                                color: w === 1.0 ? '#ffffff' : '#bd9b60'
                                            }}
                                            title={`Sector ${i} Weight: ${w}`}
                                        >
                                            {w.toFixed(1)}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
 
                    {/* Action buttons */}
                    <div className="flex flex-col gap-2.5 mt-6">
                        <button 
                            onClick={(e) => handleSubmit(e, false)}
                            className="w-full bg-gradient-to-r from-red-800 via-red-700 to-red-900 hover:from-red-700 hover:to-red-800 text-amber-100 font-bold py-3 px-4 text-xs uppercase tracking-wider cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.6)] flex items-center justify-center gap-2 border border-[#bd9b60] rounded-xl btn-springy font-heading"
                        >
                            <span>⚔️</span> Vstúpiť do PvP Arény
                        </button>
                        
                        <button 
                            onClick={(e) => handleSubmit(e, true)}
                            className="w-full bg-[#1c140d]/80 hover:bg-[#2c2017] border border-[#bd9b60]/50 text-amber-100 font-bold py-2.5 px-4 text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 rounded-xl btn-springy font-heading"
                        >
                            <span>🤖</span> Trénovať proti AI
                        </button>
  
                        <button 
                            onClick={onOpenGraphicsDemo}
                            className="w-full bg-[#1c140d]/40 hover:bg-[#2c2017] border border-[#4a3b2c] text-slate-400 hover:text-slate-200 font-bold py-2.5 px-4 text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 rounded-xl btn-springy font-heading"
                        >
                            <span>🌌</span> WebGL Graphics Showcase
                        </button>
 
                        <button 
                            onClick={onOpenBuilder}
                            className="w-full bg-[#1c140d]/40 hover:bg-[#2c2017] border border-[#4a3b2c] text-[#bd9b60] hover:text-amber-300 font-bold py-2.5 px-4 text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 rounded-xl btn-springy font-heading"
                        >
                            <span>🛠️</span> Sovereign Builder CMS
                        </button>
 
                        <button 
                            onClick={onOpenComposer}
                            className="w-full bg-[#1c140d]/40 hover:bg-[#2c2017] border border-[#4a3b2c] text-[#bd9b60] hover:text-amber-300 font-bold py-2.5 px-4 text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 rounded-xl btn-springy font-heading"
                        >
                            <span>📋</span> Board Composer
                        </button>
 
                        <button 
                            onClick={onOpenB2B}
                            className="w-full bg-[#1c140d]/40 hover:bg-[#2c2017] border border-[#4a3b2c] text-[#bd9b60] hover:text-amber-300 font-bold py-2.5 px-4 text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 rounded-xl btn-springy font-heading"
                        >
                            <span>💼</span> B2B Backoffice Portal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
