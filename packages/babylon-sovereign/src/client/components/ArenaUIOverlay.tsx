import React, { useState } from 'react';

interface ArenaUIOverlayProps {
  gameState: any;
  cards: any[];
  selectedCard: any;
  selectedCards: any[];
  setSelectedCard: (card: any) => void;
  selectedNode: any;
  setSelectedNode: (node: any) => void;
  hoveredNode: any;
  onMoveHero: (node: any) => void;
  onExecuteAction: () => void;
  onFuseCards: () => void;
  onEndTurn: () => void;
  myThreadId: string;
}

export default function ArenaUIOverlay({
  gameState,
  cards,
  selectedCard,
  selectedCards,
  setSelectedCard,
  selectedNode,
  setSelectedNode,
  hoveredNode,
  onMoveHero,
  onExecuteAction,
  onFuseCards,
  onEndTurn,
  myThreadId
}: ArenaUIOverlayProps) {
  const [selectedMulliganCardIds, setSelectedMulliganCardIds] = useState<string[]>([]);
  const [mulliganSubmitted, setMulliganSubmitted] = useState<boolean>(false);
  const [isStealthed, setIsStealthed] = useState<boolean>(false);

  const activePlayer = gameState?.threads?.find((t: any) => t.id === myThreadId);
  const activeOpponent = gameState?.threads?.find((t: any) => t.id !== myThreadId);

  // Physics Spectrometer calculations
  const voltage = selectedCard ? 2.0 : 0.0;
  const resistance = hoveredNode?.friction ? (1.0 + hoveredNode.friction) : 1.5;
  const current = voltage / resistance;
  const power = voltage * current;

  const handleMulliganToggle = (cardId: string) => {
    if (mulliganSubmitted) return;
    setSelectedMulliganCardIds((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  };

  const submitMulligan = () => {
    setMulliganSubmitted(true);
    fetch('/api/match/mulligan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: myThreadId, cardIds: selectedMulliganCardIds })
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('[MULLIGAN COMPLETED]', data);
      });
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 z-10 font-sans">
      {/* FULLSCREEN MULLIGAN OVERLAY */}
      {gameState.state === 'MULLIGAN' && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center pointer-events-auto p-4 md:p-8">
          <div className="text-center max-w-xl mb-6">
            <h2 className="text-2xl font-extrabold uppercase tracking-widest text-[#a855f7] drop-shadow-[0_0_15px_rgba(168,85,247,0.4)] mb-2">
              🃏 Mulligan Phase 🃏
            </h2>
            <p className="text-slate-400 text-xs">
              Vyberte ľubovoľný počet kariet na výmenu pred začatím hry.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mb-6">
            {cards.map((card, idx) => {
              const isSelected = selectedMulliganCardIds.includes(card.id);
              return (
                <div
                  key={card.id + '_' + idx}
                  onClick={() => handleMulliganToggle(card.id)}
                  className={`relative w-40 h-56 border rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-all duration-300 select-none ${
                    isSelected
                      ? 'scale-105 border-red-500 bg-red-950/30 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                      : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:scale-102'
                  }`}
                >
                  <div className="flex flex-col gap-1 text-left">
                    <span className="font-bold text-xs tracking-tight text-white">{card.name}</span>
                    <span className="text-[9px] uppercase tracking-wider font-mono text-purple-400 mt-1">
                      {card.type} | {card.cost}W
                    </span>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-2 italic">
                      {card.desc}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="absolute inset-0 bg-red-950/50 rounded-xl flex items-center justify-center backdrop-blur-[1px]">
                      <span className="bg-red-600 text-white font-mono text-[9px] font-bold px-2 py-1 rounded uppercase">
                        🔄 VYMENIŤ
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col items-center gap-2">
            {mulliganSubmitted ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-400 text-xs font-mono">
                  Čaká sa na oponenta...
                </span>
              </div>
            ) : (
              <button
                onClick={submitMulligan}
                className="bg-purple-600 hover:bg-purple-700 border border-purple-400 text-white font-mono text-xs font-bold px-6 py-2.5 rounded-lg cursor-pointer transition-all uppercase tracking-wider shadow-lg"
              >
                Potvrdiť výber kariet
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top HUD Row - Turn and Score */}
      <div className="w-full flex justify-between items-start pointer-events-none">
        <div className="glass-panel-heavy p-3 rounded-xl border border-cyan-500/25 pointer-events-auto text-left">
          <div className="text-[9px] text-slate-400 tracking-wider uppercase font-mono">
            Sovereign Engine v3.0 (BabylonJS)
          </div>
          <div className="text-sm font-bold text-white font-mono mt-0.5">
            Turn: {gameState.turnsElapsed} | Active Phase: {gameState.turnStateMachine.currentPhase}
          </div>
        </div>

        <div className="glass-panel-heavy p-3 rounded-xl border border-cyan-500/25 pointer-events-auto text-right font-mono text-xs flex gap-4">
          <div>
            <span className="text-cyan-400 font-bold">CRYSTAL HP:</span> {activePlayer?.health}/{activePlayer?.maxHealth}
          </div>
          <div>
            <span className="text-red-400 font-bold">TOXIC HP:</span> {activeOpponent?.health}/{activeOpponent?.maxHealth}
          </div>
          <div>
            <span className="text-yellow-400 font-bold">SYSTEM ENERGY:</span> {gameState.systemEnergy}%
          </div>
        </div>
      </div>

      {/* Bottom HUD - 30% Viewport Height overlay */}
      <div className="w-full h-[30vh] flex flex-col items-center justify-center gap-2 pointer-events-auto bg-slate-950/20 backdrop-blur-md border-t border-cyan-500/25 px-6 py-2 mt-auto">
        
        {/* Spectrometer & Node Actions */}
        {selectedCards.length === 2 && (
          <div className="flex gap-4 items-stretch justify-center max-w-full mb-1">
            <div className="glass-panel-heavy text-white px-4 py-2 rounded-xl shadow-xl text-xs font-mono text-center flex flex-col justify-center min-w-[260px] border border-purple-400/40">
              <div>
                Syntéza: <span className="text-purple-400 font-bold">{selectedCards[0].name}</span> + <span className="text-cyan-400 font-bold">{selectedCards[1].name}</span>
              </div>
              <div className="mt-1.5">
                <button
                  onClick={onFuseCards}
                  className="bg-purple-950 hover:bg-purple-900 border border-purple-400 text-purple-200 px-4 py-1.5 rounded font-bold transition-all cursor-pointer text-[10px] mt-1 shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse uppercase tracking-wider"
                >
                  ⚡ Spojiť Karty (Fuse)
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedCard && selectedCards.length < 2 && (
          <div className="flex gap-4 items-stretch justify-center max-w-full mb-1">
            {/* Card Dock */}
            <div className="glass-panel-heavy text-white px-4 py-2 rounded-xl shadow-xl text-xs font-mono text-center flex flex-col justify-center min-w-[260px] border border-cyan-400/30">
              <div>
                Vybratá karta: <span className="text-cyan-400 font-bold">{selectedCard.name}</span>
              </div>
              {selectedNode ? (
                <div className="mt-1.5">
                  Cieľový hexagón: <span className="text-yellow-400 font-bold">{selectedNode.id}</span>
                  <div className="mt-1">
                    <button
                      onClick={onExecuteAction}
                      className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-400 text-cyan-200 px-3 py-1 rounded font-bold transition-colors cursor-pointer text-[10px] mt-1"
                    >
                      Spustiť akciu
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 italic mt-1">
                  Vyberte cieľ na 3D aréne
                </div>
              )}
            </div>

            {/* Spectrometer */}
            <div className="bg-[#0e0e16]/90 border border-purple-500/40 text-slate-300 p-2.5 rounded-xl shadow-lg backdrop-blur-md text-[9px] font-mono flex flex-col gap-1 min-w-[260px]">
              <div className="text-purple-400 font-bold uppercase tracking-wider text-center border-b border-purple-500/20 pb-0.5">
                📊 Taktický Spektrometer
              </div>
              <div className="grid grid-cols-2 gap-x-2 text-left mt-1">
                <div>Napätie (V): <span className="text-cyan-400 font-bold">{voltage.toFixed(1)} V</span></div>
                <div>Odpor (R): <span className="text-yellow-400 font-bold">{resistance.toFixed(1)} Ω</span></div>
                <div>Prúd (I): <span className="text-green-400 font-bold">{current.toFixed(2)} A</span></div>
                <div>Výkon (P): <span className="text-purple-400 font-bold">{power.toFixed(2)} W</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Move hero preview */}
        {selectedCards.length === 0 && selectedNode && (
          <div className="bg-slate-900 border border-slate-700 text-white px-4 py-1.5 rounded-xl text-xs font-mono text-center flex flex-col gap-1 min-w-[250px] mb-1">
            <div>
              Vybrané políčko: <span className="text-yellow-400 font-bold">{selectedNode.id}</span>
            </div>
            <button
              onClick={() => onMoveHero(selectedNode)}
              className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-400 text-cyan-200 px-3 py-1 rounded font-bold transition-colors cursor-pointer text-[10px] w-full"
            >
              🚶 Presunúť hrdinu sem
            </button>
          </div>
        )}

        {/* Cards hand slider */}
        <div className="flex gap-3 max-w-full overflow-x-auto custom-scrollbar p-1">
          {cards.map((card, idx) => {
            const isSelected = selectedCards.some(c => c.id === card.id);
            return (
              <div
                key={`${card.id}_${idx}`}
                onClick={() => setSelectedCard(card)}
                className={`w-20 h-28 flex-shrink-0 bg-gradient-to-b from-[#181824] to-[#0b0b11] border rounded-xl p-2 flex flex-col justify-between text-white cursor-pointer transition-all duration-200 relative ${
                  isSelected ? 'border-cyan-400 -translate-y-2 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'border-slate-800 hover:-translate-y-1'
                }`}
              >
                <div className="absolute -top-1.5 -left-1.5 bg-[#14141e] border border-cyan-400 text-cyan-400 text-[8px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-lg">
                  {idx + 1}
                </div>
                <div className="text-[7px] font-mono text-purple-400 uppercase tracking-wider">{card.type}</div>
                <div className="text-[9px] font-bold text-center mt-1 text-slate-200 truncate">{card.name}</div>
                <div className="text-[7px] text-slate-400 text-center font-mono leading-tight line-clamp-3">{card.desc}</div>
                <div className="bg-[#121620] text-[7px] text-center font-mono text-cyan-400 py-0.5 rounded border border-cyan-500/20">
                  {card.cost}W
                </div>
              </div>
            );
          })}

          <button
            onClick={() => setIsStealthed(!isStealthed)}
            className={`h-28 w-12 flex-shrink-0 border text-[9px] font-bold [writing-mode:vertical-lr] uppercase tracking-widest cursor-pointer rounded-xl transition-all ${
              isStealthed
                ? 'bg-cyan-400/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isStealthed ? 'Stealth ON' : 'Stealth OFF'}
          </button>

          <button
            onClick={onEndTurn}
            className="h-28 w-12 flex-shrink-0 bg-red-950/50 border border-red-500/80 hover:bg-red-900/60 text-red-400 hover:text-red-200 flex items-center justify-center text-[9px] font-bold [writing-mode:vertical-lr] uppercase tracking-widest cursor-pointer rounded-xl shadow-lg"
          >
            End Turn [E]
          </button>
        </div>
      </div>
    </div>
  );
}
