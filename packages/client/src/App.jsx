import { useEffect, useState, useMemo, useRef } from 'react';
import { io } from 'socket.io-client';
import CanvasRenderer3D from './components/CanvasRenderer3D';
import ArenaUIOverlay from './components/ArenaUIOverlay';
import SovereignBuilderCMS from './components/SovereignBuilderCMS';
import SovereignBoardComposer from './components/SovereignBoardComposer';
import AdminDiagnosticsPanel from './components/AdminDiagnosticsPanel';
import SovereignB2BPortal from './components/SovereignB2BPortal';
import MetacognitiveArchitectureHub from './components/MetacognitiveArchitectureHub';
import { EvolutionarySceneGenerator, ConnectionEngine, CRYSTAL_CARDS_BASE, TOXIC_CARDS_BASE, DRUID_CARDS_BASE, VOID_CARDS_BASE } from '../../shared/src/index';
import LobbyScreen from './components/LobbyScreen';
import AdrenalineVignette from './components/AdrenalineVignette';
import CombinatoricsSandbox from './components/CombinatoricsSandbox';
import TelemetryDashboard from './components/TelemetryDashboard';
import RPGClassBoard from './components/RPGClassBoard';
import WebGLGraphicsShowcase from './components/WebGLGraphicsShowcase';
import { generate3DGrid } from './utils/HexMath3D';
import { arenaAudio } from './utils/ArenaAudio';
import './App.css';

// Socket.io klient
const socket = io('http://localhost:3001', { autoConnect: false });

function App() {
  const [activeLayoutView, setActiveLayoutView] = useState('LOBBY');
  const [isSandbox, setIsSandbox] = useState(true);
  const [isCombinatoricsSandboxOpen, setIsCombinatoricsSandboxOpen] = useState(false);
  const [isTelemetryDashboardOpen, setIsTelemetryDashboardOpen] = useState(false);
  const [isAdminDiagnosticsOpen, setIsAdminDiagnosticsOpen] = useState(false);
  const [isRPGClassBoardOpen, setIsRPGClassBoardOpen] = useState(false);
  const [isGraphicsShowcaseOpen, setIsGraphicsShowcaseOpen] = useState(false);
  const [isMetaHubOpen, setIsMetaHubOpen] = useState(false);
  const [entropy, setEntropy] = useState(0.4);
  const [realityPhase, setRealityPhase] = useState('STANDARD');
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [gameMode, setGameMode] = useState('SANDBOX');
  const [matchId, setMatchId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  
  // Audio state trackers using refs to prevent infinite loop (Goal 9)
  const lastActivePlayerIdRef = useRef(null);
  const lastHandCountRef = useRef(0);
  const gameEndedRef = useRef(false);
  const [ultimateFlash, setUltimateFlash] = useState(false);
  const [weatherOverride, setWeatherOverride] = useState(null);
  const [isManualWeather, setIsManualWeather] = useState(false);
  
  const gridData = useMemo(() => generate3DGrid(), []);

  // Zoznam telemetrických správ
  const [actionLogs, setActionLogs] = useState([]);

  // Jediná inštancia Connection Engine
  const connectionEngine = useMemo(() => new ConnectionEngine(true), []);

  const [gameState, setGameState] = useState(null);
  const [semanticSector, setSemanticSector] = useState(null);
  const [terrainTelemetry, setTerrainTelemetry] = useState(null);

  const myThreadId = useMemo(() => {
    return socket.id || gameState?.threads?.find(t => t.type === 'PLAYER' && t.name !== 'Sovereign AI')?.id || gameState?.threads?.[0]?.id;
  }, [gameState, socket.id]);
  const [activeTransitions, setActiveTransitions] = useState([]);
  const [lastPosition, setLastPosition] = useState({ meta: null, hex: null });
  const [surgeTile, setSurgeTile] = useState(null);
  const [scorchedTiles, setScorchedTiles] = useState([]);

  // Pripojenie a synchronizácia cez Connection Engine
  useEffect(() => {
    connectionEngine.bindSocket(socket);

    // Odber stavu hry
    const unsubscribeState = connectionEngine.subscribeToState((state) => {
      setGameState(state);
      if (state.globalEntropy !== undefined) {
        setEntropy(state.globalEntropy);
      }
    });

    // Odber telemetrických logov
    const unsubscribeLogs = connectionEngine.subscribeToLogs((logEvent) => {
      setActionLogs(prev => [logEvent.message, ...prev]);
    });

    // Odber stavu pripojenia
    const unsubscribeConn = connectionEngine.subscribeToConnection((connState) => {
      const sandbox = connState === 'SANDBOX_FALLBACK' || connState === 'DISCONNECTED';
      setIsSandbox(sandbox);
      if (sandbox) {
        setGameMode('SANDBOX');
      }
    });

    // Pripojenie socketu pri štarte (ak sme v live režime)
    if (!isSandbox) {
      socket.connect();
    }

    const handleMatchStarted = (payload) => {
      console.log('Match started payload received:', payload);
      setMatchId(payload.matchId);
      setIsSearching(false);
      if (payload.mode) {
        setGameMode(payload.mode);
      }
    };

    const handleVoltageSurge = (payload) => {
      console.log('Voltage Surge combo payload:', payload);
      setActionLogs(prev => [`⚡ VOLTAGE SURGE: ${payload.message}`, ...prev]);
      setUltimateFlash(true);
      setTimeout(() => setUltimateFlash(false), 800);
      arenaAudio.playSpellFeedback(2.5, 6.0, true);
      if (payload.targetHex) {
        setSurgeTile(payload.targetHex);
        setTimeout(() => setSurgeTile(null), 1500);
      }
    };

    const handleShortCircuit = (payload) => {
      console.log('Short Circuit combo payload:', payload);
      setActionLogs(prev => [`💥 SHORT CIRCUIT: ${payload.message}`, ...prev]);
      setShakeIntensity(4.0);
      setTimeout(() => setShakeIntensity(0), 1000);
      arenaAudio.playSpellFeedback(1.0, 1.0, false);
      if (payload.targetHex) {
        const key = `m${payload.targetHex.meta}_s${payload.targetHex.hex}`;
        setScorchedTiles(prev => [...prev, key]);
      }
    };

    const handleRealityPhaseChanged = (payload) => {
      setRealityPhase(payload.realityPhase);
    };

    const handleWeatherChanged = (payload) => {
      setWeatherOverride(payload.weather === 'TOXIC_STORM' ? 'TOXIC_HAZE' : payload.weather === 'BLIZZARD' ? 'VOID_ECLIPSE' : null);
      setActionLogs(prev => [`🌧️ WEATHER TENSOR EFFECT: Mutated environment to ${payload.weather}!`, ...prev]);
    };

    socket.on('match_started', handleMatchStarted);
    socket.on('voltage_surge', handleVoltageSurge);
    socket.on('short_circuit', handleShortCircuit);
    socket.on('reality_phase_changed', handleRealityPhaseChanged);
    socket.on('weather_change', handleWeatherChanged);

    // ── Audio + VFX wire-up ─────────────────────────────────────────────────
    const handleCardEffect = (e) => {
      const { voltage = 2, current = 1, isUltimate = false, damage = 3, targetHex, sourceId } = e.detail;
      // Play Audio feedback
      arenaAudio.playSpellFeedback(current, voltage, isUltimate);
      // Trigger Camera Shake — stronger for ultimates or high damage
      const intensity = isUltimate ? 1.6 : Math.min(1.2, damage * 0.18);
      setShakeIntensity(intensity);
      setTimeout(() => setShakeIntensity(0), 80);

      // Trigger 150ms ultimate white flash
      if (isUltimate) {
        setUltimateFlash(true);
        setTimeout(() => setUltimateFlash(false), 150);
      }

      // Trigger 3D attack animation
      const attackerId = sourceId || gameState?.activePlayerId;
      if (attackerId) {
        window.dispatchEvent(new CustomEvent('hero_attack_start', { detail: { playerId: attackerId } }));
      }

      // Update ambient biome based on target hex biome (if grid data available)
      if (targetHex && gridData.length > 0) {
        const node = gridData.find(n => n.macroIndex === targetHex.meta && n.subIndex === targetHex.hex);
        if (node?.biome) arenaAudio.startAmbient(node.biome);
      }
    };
    window.addEventListener('card_played_effect', handleCardEffect);

    return () => {
      unsubscribeState();
      unsubscribeLogs();
      unsubscribeConn();
      socket.off('match_started', handleMatchStarted);
      socket.off('voltage_surge', handleVoltageSurge);
      socket.off('short_circuit', handleShortCircuit);
      socket.off('reality_phase_changed', handleRealityPhaseChanged);
      socket.off('weather_change', handleWeatherChanged);
      window.removeEventListener('card_played_effect', handleCardEffect);
    };
  }, [connectionEngine, isSandbox]);

  // Klávesové skratky pre zjednodušenie ovládania a gameplay plynulosť
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
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
          const localThread = gameState?.threads?.find(t => t.id === 'thread_king_ai');
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

  // Sledovanie zmeny/miešania/výmeny kariet pre vysielanie animácií na mriežku
  const currentHand = useMemo(() => {
    const activePlayerId = gameState?.activePlayerId || 'thread_king_ai';
    return gameState?.threads?.find(t => t.id === activePlayerId)?.currentBuffer || [];
  }, [gameState, gameState?.activePlayerId]);

  const lastCardsStr = useRef('');
  useEffect(() => {
    const cardsStr = currentHand.map(c => c.id).join(',');
    if (lastCardsStr.current && lastCardsStr.current !== cardsStr) {
      window.dispatchEvent(new CustomEvent('grid_shuffle_pulse'));
    }
    lastCardsStr.current = cardsStr;
  }, [currentHand]);

  // Načítanie semantických sektorov a telemetrie prostredia
  useEffect(() => {
    if (!gameState) return;
    const activePlayerId = gameState.activePlayerId || 'thread_king_ai';

    const fetchTelemetry = () => {
      // res.ok guard: 404/500 vracia JSON s chybou — uložený ako dáta by zhodil
      // renderovanie (napr. terrainTelemetry.difficulty je undefined)
      fetch(`http://localhost:3001/api/scenarios/semantic-sector/${activePlayerId}`)
        .then(res => (res.ok ? res.json() : null))
        .then(data => { if (data) setSemanticSector(data); })
        .catch(err => console.warn('[TELEMETRY] Semantic Sector offline'));

      fetch(`http://localhost:3001/api/scenarios/terrain-telemetry/${activePlayerId}`)
        .then(res => (res.ok ? res.json() : null))
        .then(data => { if (data && data.difficulty) setTerrainTelemetry(data); })
        .catch(err => console.warn('[TELEMETRY] Terrain Telemetry offline'));
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, [gameState?.activePlayerId, gameState?.threads?.find(t => t.id === 'thread_king_ai')?.position?.meta, gameState?.threads?.find(t => t.id === 'thread_king_ai')?.position?.hex]);

  // Watch game state changes for audio feedback (Turns, Draws, Warnings, Game Over)
  useEffect(() => {
    if (!gameState) return;

    // 1. Turn Start Chime
    if (gameState.activePlayerId && gameState.activePlayerId !== lastActivePlayerIdRef.current) {
      const faction = gameState.activePlayerId === 'thread_king_ai' 
        ? 'crystal' 
        : gameState.activePlayerId === 'thread_hacker_root' 
        ? 'toxic' 
        : 'void';
      arenaAudio.playTurnStart(faction);
      lastActivePlayerIdRef.current = gameState.activePlayerId;
    }

    // 2. Card Draw Sound
    const myThreadId = socket.id || gameState.threads?.[0]?.id;
    const localThread = gameState.threads?.find(t => t.id === myThreadId) || gameState.threads?.find(t => t.type === 'PLAYER' && t.name !== 'Sovereign AI');
    const localHandCount = localThread?.currentBuffer?.length || 0;
    if (localHandCount > lastHandCountRef.current) {
      arenaAudio.playCardDraw();
    }
    lastHandCountRef.current = localHandCount;

    // 3. Collapse Warning Drone
    if (gameState.turnsElapsed >= 8) {
      arenaAudio.startCollapseAlarm();
    } else {
      // Stop/reset alarm if new/reset game
        if (gameState.turnsElapsed < 8 && arenaAudio.isCollapseAlarmPlaying) {
          arenaAudio.stopAmbient();
          const activeThread = gameState?.threads?.find(t => t.id === gameState?.activePlayerId);
          if (activeThread && activeThread.position) {
            const chunk = gameState.map?.find(c => c.id === activeThread.position.meta);
            const block = chunk?.blocks?.find(b => b.id === activeThread.position.hex);
            if (block?.biome) arenaAudio.startAmbient(block.biome);
          }
        }
    }

    // 4. End Game Fanfare
    const kingHp = gameState.threads?.find(t => t.id === 'thread_king_ai')?.health ?? 15;
    const hackerHp = gameState.threads?.find(t => t.id === 'thread_hacker_root')?.health ?? 15;
    if ((kingHp <= 0 || hackerHp <= 0) && !gameEndedRef.current) {
      const winner = kingHp <= 0 ? 'thread_hacker_root' : 'thread_king_ai';
      arenaAudio.playEndGame(winner);
      gameEndedRef.current = true;
    } else if (kingHp > 0 && hackerHp > 0 && gameEndedRef.current) {
      gameEndedRef.current = false;
    }

  }, [gameState]);

  // Biome Transition VFX triggers on local player movement
  useEffect(() => {
    if (!gameState || !gridData || gridData.length === 0) return;
    const localThread = gameState.threads?.find(t => t.id === myThreadId) || gameState.threads?.find(t => t.type === 'PLAYER' && t.name !== 'Sovereign AI');
    if (!localThread || !localThread.position || localThread.position.meta === null) return;

    const newMeta = localThread.position.meta;
    const newHex = localThread.position.hex;

    if (lastPosition.meta !== null && (lastPosition.meta !== newMeta || lastPosition.hex !== newHex)) {
      const node = gridData.find(n => n.macroIndex === newMeta && n.subIndex === newHex);
      if (node) {
        const BIOME_COLORS = {
          GLACIER: '#00eeff',
          TOXIC_SWAMP: '#39ff14',
          DESERT: '#f97316',
          BARRENS: '#eab308',
          LUSH_FOREST: '#22c55e'
        };
        const biome = node.biome || 'BARRENS';
        const color = BIOME_COLORS[biome] || '#38bdf8';
        const transId = `trans_${Date.now()}_${Math.random()}`;

        setActiveTransitions(prev => [
          ...prev,
          { id: transId, position: node.position, color }
        ]);
      }
    }

    setLastPosition({ meta: newMeta, hex: newHex });
  }, [gameState, gridData, lastPosition]);

  // Handler pre kliknutie na uzol v 3D aréne
  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  // Reštart lokálneho sandboxu
  const handleResetSimulation = () => {
    connectionEngine.resetSandbox();
    setSelectedCard(null);
    setSelectedNode(null);
  };

  // Evolučné vygenerovanie scény (Genetický algoritmus)
  const handleEvolveScene = () => {
    try {
      const generator = new EvolutionarySceneGenerator({
        populationSize: 50,
        generations: 40,
        mutationRate: 0.2
      });
      const bestScene = generator.evolveScene('thread_king_ai', 'thread_hacker_root');
      
      const current = connectionEngine.getGameState();
      if (!current) return;

      const nextState = JSON.parse(JSON.stringify(current));
      
      // Priradenie optimalizovaných pozícií pre hrdinov
      nextState.threads = nextState.threads.map(t => {
        if (t.id === 'thread_king_ai') {
          return { ...t, position: bestScene.playerAPosition };
        }
        if (t.id === 'thread_hacker_root') {
          return { ...t, position: bestScene.playerBPosition };
        }
        return t;
      });

      // Vytvorenie pomocných NPC jednotiek na základe vygenerovaných spawnov
      const spawnedHelpers = bestScene.helpers.map((h, idx) => ({
        id: `helper_${idx}_${h.type}`,
        name: `${h.type.toUpperCase()} (${h.ownerId === 'thread_king_ai' ? 'Crystal' : 'Toxic'})`,
        type: 'NPC',
        health: 1,
        armor: h.type === 'tower' ? 2 : 0,
        position: h.position,
        currentBuffer: [],
        handLimit: 0
      }));

      // Prepojenie hrdinov a pomocníkov do nového stavu
      nextState.threads = [...nextState.threads.filter(t => t.type === 'PLAYER'), ...spawnedHelpers];
      nextState.systemEnergy = 0;

      // Zápis do lokálneho engine
      connectionEngine.setLocalGameState(nextState);
      
      setSelectedCard(null);
      setSelectedNode(null);
      setActionLogs(prev => [
        `[Evolúcia] Scéna úspešne vygenerovaná! Najlepšia fitness: ${bestScene.fitnessScore?.toFixed(1)}/100.`,
        ...prev
      ]);
    } catch (e) {
      console.error(e);
      setActionLogs(prev => [`[Chyba] Evolúcia scény zlyhala: ${e.message}`, ...prev]);
    }
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData("text/plain");
    if (!cardId) return;

    const allBases = [...CRYSTAL_CARDS_BASE, ...TOXIC_CARDS_BASE, ...DRUID_CARDS_BASE, ...VOID_CARDS_BASE];
    const card = allBases.find(c => c.id === cardId);
    if (!card) return;

    if (hoveredNode) {
      if (!isManualWeather) {
        const cId = card.id.toLowerCase();
        if (cId.includes('toxic') || cId.includes('acid') || cId.includes('swamp') || cId.includes('poison')) {
          setWeatherOverride('TOXIC_HAZE');
          setTimeout(() => setWeatherOverride(null), 5000);
        } else if (cId.includes('void') || cId.includes('collapse') || cId.includes('darkness') || cId.includes('purge')) {
          setWeatherOverride('VOID_ECLIPSE');
          setTimeout(() => setWeatherOverride(null), 5000);
        } else if (cId.includes('crystal') || cId.includes('laser') || cId.includes('beam') || cId.includes('shatter')) {
          setWeatherOverride('AURORA_STORM');
          setTimeout(() => setWeatherOverride(null), 5000);
        }
      }

      // Trigger Hearthstone casting transition before playing!
      window.dispatchEvent(new CustomEvent('card_drag_cast', { detail: { cardId: card.id } }));

      setTimeout(() => {
        connectionEngine.playCard(
          card.id,
          hoveredNode.macroIndex,
          hoveredNode.subIndex
        );
      }, 300);

      arenaAudio.playSpellCast();
      setActionLogs(prev => [
        `[DragDrop] Played ${card.name} on Sector ${hoveredNode.macroIndex} Tile ${hoveredNode.subIndex}`,
        ...prev
      ]);

      setSelectedCard(null);
      setSelectedNode(null);
    }
  };

  // Spustenie / vyhodnotenie akcie cez Connection Engine
  const handleExecuteAction = () => {
    if (!selectedCard || !selectedNode) return;

    if (selectedCard.isUltimate) {
      setUltimateFlash(true);
      setTimeout(() => setUltimateFlash(false), 150);
    }

    // Dynamic Weather Spell Shift based on Played Card Faction
    if (!isManualWeather) {
      const cardId = selectedCard.id.toLowerCase();
      if (cardId.includes('toxic') || cardId.includes('acid') || cardId.includes('swamp') || cardId.includes('poison')) {
        setWeatherOverride('TOXIC_HAZE');
        setTimeout(() => setWeatherOverride(null), 5000);
      } else if (cardId.includes('void') || cardId.includes('collapse') || cardId.includes('darkness') || cardId.includes('purge')) {
        setWeatherOverride('VOID_ECLIPSE');
        setTimeout(() => setWeatherOverride(null), 5000);
      } else if (cardId.includes('crystal') || cardId.includes('laser') || cardId.includes('beam') || cardId.includes('shatter')) {
        setWeatherOverride('AURORA_STORM');
        setTimeout(() => setWeatherOverride(null), 5000);
      }
    }

    connectionEngine.playCard(
      selectedCard.id,
      selectedNode.macroIndex,
      selectedNode.subIndex
    );

    setSelectedCard(null);
    setSelectedNode(null);
  };

  // Ukončenie kola
  const handleEndTurn = () => {
    connectionEngine.endTurn();
    setSelectedCard(null);
    setSelectedNode(null);
  };

  // Presun hrdinu
  const handleMoveHero = (targetNode) => {
    if (!gameState) return;
    const activePlayerId = gameState.activePlayerId || 'thread_king_ai';
    console.log('Sending move_character command:', activePlayerId, targetNode);
    connectionEngine.socket.emit('move_character', {
      playerId: activePlayerId,
      targetHex: {
        meta: targetNode.macroIndex,
        hex: targetNode.subIndex
      }
    });
    setSelectedNode(null);
  };

  const handleCureStatus = (statusToClear) => {
    if (!selectedCard) {
      alert("Najprv označte kartu v ruke, ktorú chcete obetovať na vyliečenie stavu!");
      return;
    }
    const activePlayerId = gameState?.activePlayerId || 'thread_king_ai';
    console.log('Sending clear_status command:', activePlayerId, selectedCard.id, statusToClear);
    connectionEngine.socket.emit('clear_status', {
      playerId: activePlayerId,
      cardId: selectedCard.id,
      statusToClear
    });
    setSelectedCard(null);
  };

  const handleBuyItem = (itemKey) => {
    if (!gameState) return;
    const activePlayerId = gameState.activePlayerId || 'thread_king_ai';
    console.log('Sending buy_item command:', activePlayerId, itemKey);
    connectionEngine.socket.emit('buy_item', {
      playerId: activePlayerId,
      itemKey
    });
  };

  const handleSellItem = (itemKey) => {
    if (!gameState) return;
    const activePlayerId = gameState.activePlayerId || 'thread_king_ai';
    console.log('Sending sell_item command:', activePlayerId, itemKey);
    connectionEngine.socket.emit('sell_item', {
      playerId: activePlayerId,
      itemKey
    });
  };

  const handlePassReaction = () => {
    if (!gameState) return;
    const activePlayerId = gameState.activePlayerId || 'thread_king_ai';
    console.log('Sending action_pass command:', activePlayerId);
    connectionEngine.socket.emit('action_pass', {
      playerId: activePlayerId
    });
  };

  const handleToggleStealth = () => {
    if (!gameState) return;
    const activePlayerId = gameState.activePlayerId || 'thread_king_ai';
    console.log('Sending toggle_stealth command:', activePlayerId);
    connectionEngine.socket.emit('toggle_stealth', {
      playerId: activePlayerId
    });
  };

  const handleSearchMatch = ({ name, hero, theme }) => {
    setIsSearching(true);
    setIsSandbox(false);
    socket.connect();
    setTimeout(() => {
      socket.emit('join_matchmaking', { name, hero, theme });
    }, 500);
  };

  const handleStartGame = ({ name, hero, theme }) => {
    setIsSandbox(false);
    socket.connect();
    setTimeout(() => {
      socket.emit('join_ai_match', { name, hero, theme });
    }, 500);
  };

  if (isGraphicsShowcaseOpen) {
    return <WebGLGraphicsShowcase onClose={() => setIsGraphicsShowcaseOpen(false)} />;
  }

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
          onLoadDataset={(ds) => {
            setEntropy(ds.entropy);
            if (gameState?.map) {
              const updatedMap = {
                ...gameState.map,
                blocks: gameState.map.blocks.map(b => ({
                  ...b,
                  hazardIndex: ds.hazard,
                  friction: ds.friction
                }))
              };
              setGameState(prev => ({
                ...prev,
                globalEntropy: ds.entropy,
                map: updatedMap
              }));
            }
          }}
          onApplyCSS={(css) => {
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

  if (!matchId) {
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

  const isOverlayActive = useMemo(() => {
    return gameState?.state === 'MULLIGAN' || gameState?.state === 'GAME_OVER';
  }, [gameState?.state]);

  return (
    <div 
      className="w-full h-screen relative bg-black overflow-hidden"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleCanvasDrop}
    >
      {/* Fullscreen 3D Viewport: Zoomable Hexagon World */}
      <div className="absolute inset-0 w-full h-full z-0">
        <CanvasRenderer3D 
          entropy={entropy} 
          threads={gameState?.threads || []}
          myThreadId={myThreadId}
          selectedNode={selectedNode}
          onNodeClick={handleNodeClick}
          selectedCard={selectedCard}
          onExecuteAction={handleExecuteAction}
          onMoveHero={handleMoveHero}
          shakeIntensity={shakeIntensity}
          turnsElapsed={gameState?.turnsElapsed || 1}
          map={gameState?.map}
          terrainTelemetry={terrainTelemetry}
          ultimateFlash={ultimateFlash}
          gameMode={gameMode}
          weatherOverride={weatherOverride}
          activeTransitions={activeTransitions}
          onTransitionComplete={(id) => setActiveTransitions(prev => prev.filter(t => t.id !== id))}
          surgeTile={surgeTile}
          scorchedTiles={scorchedTiles}
          hoveredNode={hoveredNode}
          setHoveredNode={setHoveredNode}
          realityPhase={realityPhase}
          isOverlayActive={isOverlayActive}
        />
      </div>
      
      {/* Cyber-Glassmorphism Tailwind UI */}
      <ArenaUIOverlay 
        realityPhase={realityPhase}
        setRealityPhase={setRealityPhase}
        gameState={gameState} 
        entropy={entropy}
        setEntropy={setEntropy}
        selectedCard={selectedCard}
        setSelectedCard={setSelectedCard}
        selectedNode={selectedNode}
        onExecuteAction={handleExecuteAction}
        onEndTurn={handleEndTurn}
        onMoveHero={handleMoveHero}
        onResetSimulation={handleResetSimulation}
        onEvolveScene={handleEvolveScene}
        isSandbox={isSandbox}
        setIsSandbox={setIsSandbox}
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
        hoveredNode={hoveredNode}
      />
      {/* Adrenaline vignette overlay — purely CSS, no 3D cost */}
      <AdrenalineVignette
        gameState={gameState}
        localPlayerId={socket.id || gameState?.threads?.[0]?.id}
      />
      {/* Fullscreen white flash overlay for Ultimate actions */}
      {ultimateFlash && (
        <div className="fixed inset-0 bg-white pointer-events-none z-50 animate-pulse" style={{ animationDuration: '0.15s' }}></div>
      )}
      {/* Koniec hry — výsledok a návrat do lobby */}
      {gameState?.state === 'GAME_OVER' && (() => {
        const alivePlayers = (gameState.threads || []).filter(t => t.type === 'PLAYER' && t.health > 0);
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
      {/* Desktop Top-Left Unified Dev Tools Bar */}
      <div className="hidden lg:flex justify-start gap-2 pointer-events-auto z-40 absolute top-4 left-4 glass-panel-heavy p-2 rounded-xl border border-cyan-500/20 shadow-lg">
        <span className="text-[9px] text-cyan-400 font-mono font-bold self-center px-2 border-r border-cyan-500/25 mr-1 uppercase tracking-widest">DEV CONTROL</span>
        <button 
          onClick={() => setIsCombinatoricsSandboxOpen(true)}
          className="cyber-btn px-2.5 py-1.5 border border-cyan-500/40 text-cyan-400 bg-slate-900/60 hover:bg-slate-800 text-[10px] font-heading font-bold rounded-lg cursor-pointer transition-all uppercase tracking-wider shadow-sm hover:shadow-[0_0_10px_rgba(6,182,212,0.3)] btn-springy"
        >
          🧪 Sandbox
        </button>
        <button 
          onClick={() => setIsTelemetryDashboardOpen(true)}
          className="cyber-btn px-2.5 py-1.5 border border-purple-500/40 text-purple-400 bg-slate-900/60 hover:bg-slate-800 text-[10px] font-heading font-bold rounded-lg cursor-pointer transition-all uppercase tracking-wider shadow-sm hover:shadow-[0_0_10px_rgba(168,85,247,0.3)] btn-springy"
        >
          📊 Telemetria DB
        </button>
        <button 
          onClick={() => setIsRPGClassBoardOpen(true)}
          className="cyber-btn px-2.5 py-1.5 border border-amber-500/40 text-amber-400 bg-slate-900/60 hover:bg-slate-800 text-[10px] font-heading font-bold rounded-lg cursor-pointer transition-all uppercase tracking-wider shadow-sm hover:shadow-[0_0_10px_rgba(245,158,11,0.3)] btn-springy"
        >
          👑 Class Board
        </button>
        <button 
          onClick={() => setIsAdminDiagnosticsOpen(true)}
          className="cyber-btn px-2.5 py-1.5 border border-emerald-500/40 text-emerald-400 bg-slate-900/60 hover:bg-slate-800 text-[10px] font-heading font-bold rounded-lg cursor-pointer transition-all uppercase tracking-wider shadow-sm hover:shadow-[0_0_10px_rgba(16,185,129,0.3)] btn-springy"
        >
          🛠️ Diagnostika
        </button>
        <button 
          onClick={() => setIsMetaHubOpen(true)}
          className="cyber-btn px-2.5 py-1.5 border border-cyan-500/40 text-cyan-400 bg-slate-900/60 hover:bg-slate-800 text-[10px] font-heading font-bold rounded-lg cursor-pointer transition-all uppercase tracking-wider shadow-sm hover:shadow-[0_0_10px_rgba(6,182,212,0.3)] btn-springy"
        >
          🧠 Meta Hub
        </button>
      </div>
      {/* Interaktívny Sandbox Modul */}
      {isCombinatoricsSandboxOpen && (
        <CombinatoricsSandbox onClose={() => setIsCombinatoricsSandboxOpen(false)} />
      )}
      {/* Interaktívna Telemetrická Doska */}
      {isTelemetryDashboardOpen && (
        <TelemetryDashboard onClose={() => setIsTelemetryDashboardOpen(false)} />
      )}
      {/* Interaktívny RPG Class Board */}
      {isRPGClassBoardOpen && (
        <RPGClassBoard onClose={() => setIsRPGClassBoardOpen(false)} />
      )}
      {/* Interaktívny Admin Diagnostics Panel */}
      {isAdminDiagnosticsOpen && (
        <AdminDiagnosticsPanel 
          initialEntropy={entropy}
          onUpdateEntropy={(val) => setEntropy(val)}
          gameState={gameState}
          onClose={() => setIsAdminDiagnosticsOpen(false)} 
        />
      )}
      {/* Metakognitívny Architektonický Hub */}
      {isMetaHubOpen && (
        <MetacognitiveArchitectureHub 
          onClose={() => setIsMetaHubOpen(false)} 
          gameState={gameState}
        />
      )}
    </div>
  );
}

export default App;



