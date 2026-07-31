import React, { useState, useEffect, useMemo, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import BabylonCanvasRenderer from './components/BabylonCanvasRenderer';
import ArenaUIOverlay from './components/ArenaUIOverlay';
import LobbyScreen from './components/LobbyScreen';
import SovereignBoardComposer from './components/SovereignBoardComposer';
import AdminDiagnosticsPanel from './components/AdminDiagnosticsPanel';
import SovereignB2BPortal from './components/SovereignB2BPortal';
import SovereignBuilderCMS from './components/SovereignBuilderCMS';
import TelemetryDashboard from './components/TelemetryDashboard';
import CombinatoricsSandbox from './components/CombinatoricsSandbox';
import RPGClassBoard from './components/RPGClassBoard';
import MetacognitiveArchitectureHub from './components/MetacognitiveArchitectureHub';
import AdrenalineVignette from './components/AdrenalineVignette';
import CorporateSimulationPanel from './components/CorporateSimulationPanel';
import RealityCompositorPanel from './components/RealityCompositorPanel';

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [selectedCards, setSelectedCards] = useState<any[]>([]);
  const selectedCard = selectedCards[0] || null;
  const setSelectedCard = (card: any) => {
    if (!card) {
      setSelectedCards([]);
      return;
    }
    setSelectedCards(prev => {
      const exists = prev.find(c => c.id === card.id);
      if (exists) {
        return prev.filter(c => c.id !== card.id);
      }
      if (prev.length < 2) {
        return [...prev, card];
      }
      return [prev[1], card];
    });
  };
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [myThreadId] = useState<string>('thread_king_ai');

  // Staging Layout views & Modal states
  const [matchId, setMatchId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [gameMode, setGameMode] = useState<string>('PVP');
  const [activeLayoutView, setActiveLayoutView] = useState<string>('LOBBY'); // LOBBY, GAME, COMPOSER, B2B, BUILDER
  const [isGraphicsShowcaseOpen, setIsGraphicsShowcaseOpen] = useState<boolean>(false);

  // Floating Modal States
  const [isCombinatoricsSandboxOpen, setIsCombinatoricsSandboxOpen] = useState<boolean>(false);
  const [isTelemetryDashboardOpen, setIsTelemetryDashboardOpen] = useState<boolean>(false);
  const [isRPGClassBoardOpen, setIsRPGClassBoardOpen] = useState<boolean>(false);
  const [isAdminDiagnosticsOpen, setIsAdminDiagnosticsOpen] = useState<boolean>(false);
  const [isMetaHubOpen, setIsMetaHubOpen] = useState<boolean>(false);
  const [isCorpSimOpen, setIsCorpSimOpen] = useState<boolean>(false);
  const [isRealityCompositorOpen, setIsRealityCompositorOpen] = useState<boolean>(false);

  // Combat VFX & Telemetry States
  const [entropy, setEntropy] = useState<number>(0.2);
  const [semanticSector, setSemanticSector] = useState<any>(null);
  const [terrainTelemetry, setTerrainTelemetry] = useState<any>(null);
  const [devopsTelemetry, setDevopsTelemetry] = useState<any>(null);
  const [weatherOverride, setWeatherOverride] = useState<string>('CLEAR');
  const [isManualWeather, setIsManualWeather] = useState<boolean>(false);
  const [actionLogs, setActionLogs] = useState<string[]>([]);
  const [scorchedTiles, setScorchedTiles] = useState<string[]>([]);
  const [surgeTile, setSurgeTile] = useState<any>(null);
  const [ultimateFlash, setUltimateFlash] = useState<boolean>(false);
  const [shakeIntensity, setShakeIntensity] = useState<number>(0);
  const [realityPhase, setRealityPhase] = useState<string>('STANDARD');

  useEffect(() => {
    // Connect socket using Vite dev-server proxy route
    const socketInstance = io();
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('[SOCKET] Connected to Sovereign Engine');
    });

    socketInstance.on('match_state_updated', (data: any) => {
      console.log('[SOCKET] Match state updated:', data.gameState);
      setGameState(data.gameState);
    });

    socketInstance.on('match_started', (payload: any) => {
      console.log('[SOCKET] Match started payload received:', payload);
      setMatchId(payload.matchId);
      setGameState(payload.gameState);
      setIsSearching(false);
      if (payload.mode) {
        setGameMode(payload.mode);
      }
    });

    socketInstance.on('voltage_surge', (payload: any) => {
      console.log('[SOCKET] Voltage Surge combo:', payload);
      setActionLogs(prev => [`⚡ VOLTAGE SURGE: ${payload.message}`, ...prev]);
      setUltimateFlash(true);
      setTimeout(() => setUltimateFlash(false), 800);
      if (payload.targetHex) {
        setSurgeTile(payload.targetHex);
        setTimeout(() => setSurgeTile(null), 1500);
      }
    });

    socketInstance.on('short_circuit', (payload: any) => {
      console.log('[SOCKET] Short Circuit combo:', payload);
      setActionLogs(prev => [`💥 SHORT CIRCUIT: ${payload.message}`, ...prev]);
      setShakeIntensity(4.0);
      setTimeout(() => setShakeIntensity(0), 1000);
      if (payload.targetHex) {
        const key = `m${payload.targetHex.meta}_s${payload.targetHex.hex}`;
        setScorchedTiles(prev => [...prev, key]);
      }
    });

    socketInstance.on('reality_phase_changed', (payload: any) => {
      setRealityPhase(payload.realityPhase);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Lobby actions
  const handleStartGame = (mode: string = 'PVP') => {
    if (socket) {
      console.log('[SOCKET] Starting singleplayer or custom match with mode:', mode);
      socket.emit('start_match', { mode });
    }
  };

  const handleSearchMatch = () => {
    if (socket) {
      console.log('[SOCKET] Registering matchmaking search...');
      setIsSearching(true);
      socket.emit('join_match');
    }
  };

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
  };

  const handleMoveHero = (node: any) => {
    if (socket && gameState && !selectedCard) {
      socket.emit('move_hero', {
        playerId: myThreadId,
        targetMeta: node.macroIndex,
        targetHex: node.subIndex
      });
      setSelectedNode(null);
    }
  };

  const handleExecuteAction = () => {
    if (socket && selectedCard && selectedNode) {
      if (selectedCard.type === 'TRAP') {
        socket.emit('place_trap', {
          playerId: myThreadId,
          trapType: 'ROOT_TRAP',
          targetMeta: selectedNode.macroIndex,
          targetHex: selectedNode.subIndex
        });
      } else {
        socket.emit('execute_action', {
          playerId: myThreadId,
          cardId: selectedCard.id,
          targetMeta: selectedNode.macroIndex,
          targetHex: selectedNode.subIndex
        });
      }
      setSelectedCards([]);
      setSelectedNode(null);
    }
  };

  const handleFuseCards = () => {
    if (selectedCards.length === 2) {
      fetch('/api/cards/fuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId1: selectedCards[0].id,
          cardId2: selectedCards[1].id,
          playerId: myThreadId,
          matchId
        })
      })
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (data && data.success) {
            setGameState(data.gameState);
            setSelectedCards([]);
            setSelectedNode(null);
            console.log('[FUSION] Cards fused successfully!');
          }
        })
        .catch(err => console.error('[FUSION] Failed to fuse cards:', err));
    }
  };

  const handleEndTurn = () => {
    if (socket) {
      socket.emit('end_turn', { playerId: myThreadId });
      setSelectedCard(null);
      setSelectedNode(null);
    }
  };

  const handleResetSimulation = () => {
    if (socket) {
      socket.emit('reset_match');
    }
  };

  const handleEvolveScene = () => {
    console.log('[HUD] Evolving environment variables...');
    setEntropy(prev => Math.min(1.0, prev + 0.15));
  };

  const handleBuyItem = (item: any) => {
    if (socket) {
      socket.emit('buy_item', { playerId: myThreadId, itemId: item.id });
    }
  };

  const handleSellItem = (item: any) => {
    if (socket) {
      socket.emit('sell_item', { playerId: myThreadId, itemId: item.id });
    }
  };

  const handleCureStatus = (statusName: string) => {
    if (socket) {
      socket.emit('cure_status', { playerId: myThreadId, statusName });
    }
  };

  const handlePassReaction = () => {
    console.log('[HUD] Pass combat reaction queue');
  };

  const handleToggleStealth = () => {
    if (socket) {
      socket.emit('toggle_stealth', { playerId: myThreadId });
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Escape') {
        setSelectedCard(null);
        setSelectedNode(null);
      } else if (e.code === 'Space') {
        if (selectedCard && selectedNode) {
          e.preventDefault();
          handleExecuteAction();
        }
      } else if (e.code === 'KeyE') {
        e.preventDefault();
        handleEndTurn();
      } else if (e.code.startsWith('Digit')) {
        const digit = parseInt(e.code.replace('Digit', ''), 10);
        if (digit >= 1 && digit <= 9) {
          const localThread = gameState?.threads?.find((t: any) => t.id === myThreadId);
          const hand = localThread?.currentBuffer || [];
          const cardIndex = digit - 1;
          if (hand[cardIndex]) {
            e.preventDefault();
            setSelectedCard(hand[cardIndex]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, selectedCard, selectedNode]);

  // Sync cards hand
  const cards = useMemo(() => {
    const thread = gameState?.threads?.find((t: any) => t.id === myThreadId);
    return thread?.currentBuffer || [];
  }, [gameState, myThreadId]);

  // Periodic Telemetry Ingestions
  useEffect(() => {
    if (!gameState) return;
    const fetchTelemetry = () => {
      fetch(`/api/scenarios/semantic-sector/${myThreadId}`)
        .then(res => (res.ok ? res.json() : null))
        .then(data => { if (data) setSemanticSector(data); })
        .catch(() => console.warn('[TELEMETRY] Semantic Sector offline'));

      fetch(`/api/scenarios/terrain-telemetry/${myThreadId}`)
        .then(res => (res.ok ? res.json() : null))
        .then(data => { if (data && data.difficulty) setTerrainTelemetry(data); })
        .catch(() => console.warn('[TELEMETRY] Terrain Telemetry offline'));

      fetch(`/api/devops/telemetry`)
        .then(res => (res.ok ? res.json() : null))
        .then(data => { if (data) setDevopsTelemetry(data); })
        .catch(() => console.warn('[TELEMETRY] DevOps Telemetry offline'));
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Layout View Switching
  if (activeLayoutView === 'BUILDER') {
    return (
      <div className="relative w-full h-screen">
        <button 
          onClick={() => setActiveLayoutView('LOBBY')}
          className="absolute top-4 right-4 z-50 px-4 py-2 bg-slate-900/90 text-cyan-400 border border-cyan-500/50 hover:bg-slate-800 text-xs font-bold font-mono tracking-wider rounded-xl cursor-pointer"
        >
          ← Späť do Lobby
        </button>
        <SovereignBuilderCMS />
      </div>
    );
  }

  if (activeLayoutView === 'COMPOSER') {
    return (
      <div className="relative w-full h-screen">
        <button 
          onClick={() => setActiveLayoutView('LOBBY')}
          className="absolute top-4 right-4 z-50 px-4 py-2 bg-slate-900/90 text-yellow-400 border border-yellow-500/50 hover:bg-slate-800 text-xs font-bold font-mono tracking-wider rounded-xl cursor-pointer"
        >
          ← Späť do Lobby
        </button>
        <SovereignBoardComposer />
      </div>
    );
  }

  if (activeLayoutView === 'B2B') {
    return (
      <div className="relative w-full h-screen">
        <button 
          onClick={() => setActiveLayoutView('LOBBY')}
          className="absolute top-4 right-4 z-50 px-4 py-2 bg-slate-900/90 text-emerald-400 border border-emerald-500/50 hover:bg-slate-800 text-xs font-bold font-mono tracking-wider rounded-xl cursor-pointer"
        >
          ← Späť do Lobby
        </button>
        <SovereignB2BPortal 
          onLoadDataset={(ds: any) => {
            setEntropy(ds.entropy);
            if (gameState?.map) {
              const updatedMap = {
                ...gameState.map,
                blocks: gameState.map.blocks.map((b: any) => ({
                  ...b,
                  hazardIndex: ds.hazard,
                  friction: ds.friction
                }))
              };
              setGameState((prev: any) => ({
                ...prev,
                globalEntropy: ds.entropy,
                map: updatedMap
              }));
            }
          }}
          onApplyCSS={(css: string) => {
            let styleTag = document.getElementById('b2b-dynamic-styles');
            if (!styleTag) {
              styleTag = document.createElement('style');
              styleTag.id = 'b2b-dynamic-styles';
              document.head.appendChild(styleTag);
            }
            styleTag.innerHTML = css;
          }}
        />
      </div>
    );
  }

  // If match hasn't started yet, render the Lobby screen
  if (!matchId || !gameState) {
    return (
      <LobbyScreen 
        onStartGame={handleStartGame}
        onSearchMatch={handleSearchMatch}
        isSearching={isSearching}
        onOpenGraphicsDemo={() => setIsGraphicsShowcaseOpen(true)}
        onOpenBuilder={() => setActiveLayoutView('BUILDER')}
        onOpenComposer={() => setActiveLayoutView('COMPOSER')}
        onOpenB2B={() => setActiveLayoutView('B2B')}
      />
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-black overflow-hidden relative">
      {/* Top 70% Viewport: Zoomable BabylonJS Grid World */}
      <div className="w-full h-[70vh] relative overflow-hidden">
        <BabylonCanvasRenderer
          gridData={gameState.map}
          threads={gameState.threads}
          myThreadId={myThreadId}
          selectedNode={selectedNode}
          selectedCard={selectedCard}
          onNodeClick={handleNodeClick}
          onMoveHero={handleMoveHero}
          hoveredNode={hoveredNode}
          setHoveredNode={setHoveredNode}
          socket={socket}
          weatherOverride={weatherOverride}
          ultimateFlash={ultimateFlash}
          scorchedTiles={scorchedTiles}
          surgeTile={surgeTile}
          entropy={entropy}
          lastComboEvent={gameState?.lastComboEvent}
          devopsTelemetry={devopsTelemetry}
        />
      </div>

      {/* Bottom 30% Viewport: Translucent Action & Cards Panel underlay */}
      <div className="w-full h-[30vh] relative bg-[#090a10] border-t border-cyan-500/20 overflow-hidden" />

      {/* Translucent UI Overlay - Absolute HUD */}
      <ArenaUIOverlay
        realityPhase={realityPhase}
        setRealityPhase={setRealityPhase}
        gameState={gameState}
        entropy={entropy}
        setEntropy={setEntropy}
        cards={cards}
        selectedCard={selectedCard}
        selectedCards={selectedCards}
        setSelectedCard={setSelectedCard}
        selectedNode={selectedNode}
        setSelectedNode={setSelectedNode}
        hoveredNode={hoveredNode}
        onMoveHero={handleMoveHero}
        onExecuteAction={handleExecuteAction}
        onFuseCards={handleFuseCards}
        onEndTurn={handleEndTurn}
        onResetSimulation={handleResetSimulation}
        onEvolveScene={handleEvolveScene}
        isSandbox={false}
        setIsSandbox={() => {}}
        actionLogs={actionLogs}
        onCureStatus={handleCureStatus}
        onBuyItem={handleBuyItem}
        onSellItem={handleSellItem}
        onPassReaction={handlePassReaction}
        onToggleStealth={handleToggleStealth}
        semanticSector={semanticSector}
        terrainTelemetry={terrainTelemetry}
        weatherOverride={weatherOverride}
        setWeatherOverride={setWeatherOverride}
        isManualWeather={isManualWeather}
        setIsManualWeather={setIsManualWeather}
        myThreadId={myThreadId}
      />

      {/* Vignettes and overlays */}
      <AdrenalineVignette
        gameState={gameState}
        localPlayerId={myThreadId}
      />

      {ultimateFlash && (
        <div className="fixed inset-0 bg-white pointer-events-none z-50 animate-pulse" style={{ animationDuration: '0.15s' }} />
      )}

      {/* Game Over modal */}
      {gameState.state === 'GAME_OVER' && (() => {
        const alivePlayers = (gameState.threads || []).filter((t: any) => t.type === 'PLAYER' && t.health > 0);
        const winner = alivePlayers.length === 1 ? alivePlayers[0] : null;
        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] pointer-events-auto">
            <div className="bg-[#0b0b12]/95 border border-cyan-500/40 rounded-2xl px-10 py-8 text-center shadow-[0_0_60px_rgba(6,182,212,0.25)] flex flex-col items-center gap-4">
              <div className="text-4xl">{winner ? '🏆' : '⚖️'}</div>
              <h2 className="text-2xl font-bold text-white uppercase tracking-widest font-mono">Koniec hry</h2>
              <p className="text-sm font-mono text-cyan-300">
                {winner ? `Víťaz: ${winner.name}` : 'Remíza — obaja hrdinovia padli.'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-400/50 text-cyan-300 font-mono font-bold text-sm px-6 py-2.5 rounded-lg cursor-pointer transition-all uppercase tracking-wider"
              >
                ↺ Späť do lobby
              </button>
            </div>
          </div>
        );
      })()}

      {/* Floating utility buttons at top */}
      <div className="fixed top-4 left-[240px] z-50 flex items-center gap-3">
        <button 
          onClick={() => setIsCombinatoricsSandboxOpen(true)}
          className="bg-slate-900/85 hover:bg-slate-800 border border-cyan-500/40 text-cyan-400 text-xs font-mono px-3.5 py-1.5 rounded-lg shadow-lg hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer transition-all uppercase tracking-wider"
        >
          🧪 Sandbox Kombinatoriky
        </button>
        <button 
          onClick={() => setIsTelemetryDashboardOpen(true)}
          className="bg-slate-900/85 hover:bg-slate-800 border border-purple-500/40 text-purple-400 text-xs font-mono px-3.5 py-1.5 rounded-lg shadow-lg hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] cursor-pointer transition-all uppercase tracking-wider"
        >
          📊 Telemetry & DB
        </button>
        <button 
          onClick={() => setIsRPGClassBoardOpen(true)}
          className="bg-slate-900/85 hover:bg-slate-800 border border-amber-500/40 text-amber-400 text-xs font-mono px-3.5 py-1.5 rounded-lg shadow-lg hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer transition-all tracking-wider"
        >
          👑 RPG Class Board
        </button>
        <button 
          onClick={() => setIsAdminDiagnosticsOpen(true)}
          className="bg-slate-900/85 hover:bg-slate-800 border border-emerald-500/40 text-emerald-400 text-xs font-mono px-3.5 py-1.5 rounded-lg shadow-lg hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer transition-all tracking-wider"
        >
          🛠️ Admin Diagnostics
        </button>
        <button 
          onClick={() => setIsMetaHubOpen(true)}
          className="bg-slate-900/85 hover:bg-slate-800 border border-cyan-500/40 text-cyan-400 text-xs font-mono px-3.5 py-1.5 rounded-lg shadow-lg hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer transition-all tracking-wider"
        >
          🧠 Metacognitive Hub
        </button>
        <button 
          onClick={() => setIsCorpSimOpen(true)}
          className="bg-slate-900/85 hover:bg-slate-800 border border-purple-500/40 text-purple-400 text-xs font-mono px-3.5 py-1.5 rounded-lg shadow-lg hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] cursor-pointer transition-all tracking-wider"
        >
          🏢 Corp Simulation
        </button>
        <button 
          onClick={() => setIsRealityCompositorOpen(true)}
          className="bg-slate-900/85 hover:bg-slate-800 border border-cyan-500/40 text-cyan-400 text-xs font-mono px-3.5 py-1.5 rounded-lg shadow-lg hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer transition-all tracking-wider"
        >
          💠 Reality Compositor
        </button>
      </div>

      {/* Float Panels Modals */}
      {isCombinatoricsSandboxOpen && (
        <CombinatoricsSandbox onClose={() => setIsCombinatoricsSandboxOpen(false)} />
      )}
      {isTelemetryDashboardOpen && (
        <TelemetryDashboard onClose={() => setIsTelemetryDashboardOpen(false)} />
      )}
      {isRPGClassBoardOpen && (
        <RPGClassBoard onClose={() => setIsRPGClassBoardOpen(false)} />
      )}
      {isAdminDiagnosticsOpen && (
        <AdminDiagnosticsPanel 
          initialEntropy={entropy}
          onUpdateEntropy={(val: number) => setEntropy(val)}
          gameState={gameState}
          onClose={() => setIsAdminDiagnosticsOpen(false)} 
        />
      )}
      {isMetaHubOpen && (
        <MetacognitiveArchitectureHub onClose={() => setIsMetaHubOpen(false)} />
      )}
      {isCorpSimOpen && (
        <CorporateSimulationPanel onClose={() => setIsCorpSimOpen(false)} />
      )}
      {isRealityCompositorOpen && (
        <RealityCompositorPanel isOpen={isRealityCompositorOpen} onClose={() => setIsRealityCompositorOpen(false)} />
      )}
    </div>
  );
}
