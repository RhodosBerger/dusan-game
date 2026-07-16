import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { 
  Pathfinder, 
  SpatialGuidanceSystem, 
  AlgebraicActionTensor,
  CRYSTAL_CARDS_BASE,
  TOXIC_CARDS_BASE,
  DRUID_CARDS_BASE,
  VOID_CARDS_BASE,
  GoCoreMediator,
  SovereignGenerativeOrchestrator,
  SovereignRealityMatrix,
  SovereignLIFOArbiter,
  SovereignPredictiveGenerator,
  SovereignKeyframeInterpreter,
  getPhysicsSpecs,
  SovereignFailoverGateway,
  SovereignPhraseGenerator
} from '@dusan-game/shared';

import { AIOpponentDirector } from './models/AIOpponentDirector';
import { DevOpsTelemetryWatcher } from './utils/devopsTelemetryWatcher';

dotenv.config();

const goMediator = new GoCoreMediator('http://localhost:8081');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3005;

// Mock database registry state
let dbRegisters = [
  { registerId: 'REG_DDA_LUCK', value: 1.25, lastModified: new Date() },
  { registerId: 'REG_CURRENT_AMP', value: 1.05, lastModified: new Date() }
];

// Faction base cards catalog
const allBaseCards = [...CRYSTAL_CARDS_BASE, ...TOXIC_CARDS_BASE, ...DRUID_CARDS_BASE, ...VOID_CARDS_BASE];

// Initial game state
let activeRealityPhase = 'STANDARD';
// Per-turn combo accumulator — reset on end_turn
let turnComboTracker = {
  voltagePlayedThisTurn: 0,
  lastResistancePlayed: 0,
  cardsPlayedThisTurn: 0
};

let matchState: any = {
  traceLog: [] as any[],
  state: 'MULLIGAN', // MULLIGAN, RUNNING, GAME_OVER
  turnsElapsed: 1,
  activePlayerId: 'thread_king_ai',
  systemEnergy: 50,
  entropy: 0.35,
  lastComboEvent: null as 'VOLTAGE_SURGE' | 'SHORT_CIRCUIT' | null,
  lastComboPlayerId: null as string | null,
  turnStateMachine: {
    currentPhase: 'MULLIGAN',
    mulliganComplete: {
      thread_king_ai: false,
      thread_hacker_root: false
    }
  },
  threads: [
    {
      id: 'thread_king_ai',
      name: 'Crystal AI (Knight)',
      type: 'PLAYER',
      health: 15,
      maxHealth: 15,
      attackReach: 2,
      spellReach: 3,
      movementBase: 2,
      handLimit: 5,
      axiomaticFlags: 0,
      drawPileCount: 20,
      discardPileCount: 0,
      freeMovementUsed: false,
      materials: { CrystalShard: 10, Spores: 0, Essence: 5 },
      items: [],
      position: { meta: 0, hex: 0 }, // Starting chunk 0, block 0
      currentBuffer: [
        { id: 'crystal_laser_01', type: 'MAGIC', cost: 1, name: 'Laser Charge', desc: 'Direct beam strike' },
        { id: 'crystal_shield_01', type: 'MAGIC', cost: 2, name: 'Glass Shield', desc: 'Absorbs 5 DMG' },
        { id: 'crystal_move_01', type: 'MOVE', cost: 1, name: 'Blink Shift', desc: 'Teleport 1 hex' },
        { id: 'crystal_attack_01', type: 'ATTACK', cost: 2, name: 'Prism Sword', desc: 'Deals 3 physical DMG' }
      ]
    },
    {
      id: 'thread_hacker_root',
      name: 'Toxic Hacker Root (Rebel)',
      type: 'PLAYER',
      health: 15,
      maxHealth: 15,
      attackReach: 1,
      spellReach: 4,
      movementBase: 2,
      handLimit: 5,
      axiomaticFlags: 0,
      drawPileCount: 18,
      discardPileCount: 0,
      freeMovementUsed: false,
      materials: { CrystalShard: 0, Spores: 15, Essence: 5 },
      items: [],
      position: { meta: 2, hex: 2 }, // Starting chunk 2, block 2
      currentBuffer: [
        { id: 'toxic_snake_01', type: 'ATTACK', cost: 2, name: 'Viper Strike', desc: 'Deals 2 DMG + poison' },
        { id: 'toxic_acid_01', type: 'MAGIC', cost: 3, name: 'Corrosive Spray', desc: 'Sinks target hexagon' },
        { id: 'toxic_move_01', type: 'MOVE', cost: 1, name: 'Slime Slide', desc: 'Dash 2 hexes' }
      ]
    }
  ],
  map: Array.from({ length: 9 }).map((_, macroId) => ({
    id: macroId,
    blocks: Array.from({ length: 7 }).map((_, subId) => ({
      id: subId,
      walkable: true,
      biome: macroId % 2 === 0 ? 'LUSH_FOREST' : 'TOXIC_SWAMP',
      friction: macroId % 2 === 0 ? 0.25 : 0.65,
      hazardIndex: macroId % 3 === 0 ? 0.15 : 0.45,
      hasChest: subId === 3 && macroId === 4,
      hasTrap: subId === 5 ? 'spikes' : null,
      energyCostMultiplier: 1.0
    }))
  }))
};

// REST API Endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'OK', engine: 'BabylonSovereign', version: '3.0.0' });
});

// Telemetry and calculations
app.get('/api/telemetry', (req, res) => {
  res.json({
    kclSolverStatus: 'OPTIMAL',
    averageGridVoltage: 12.5,
    entropyCoefficient: matchState.entropy,
    systemUptimeMs: Date.now(),
    systemEnergy: matchState.systemEnergy || 0,
    turnCount: matchState.turnsElapsed || 1,
    currentPhase: matchState.turnStateMachine?.currentPhase || 'PREPARATION',
    globalEntropy: matchState.entropy || 0.2,
    threads: matchState.threads || [],
    traceLog: matchState.traceLog || []
  });
});

const devopsWatcher = new DevOpsTelemetryWatcher('../../database.db');

app.get('/api/devops/telemetry', (req, res) => {
  try {
    const metrics = devopsWatcher.scan();
    res.json(metrics);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/predict', (req, res) => {
  try {
    const meta = parseInt(req.query.meta as string || '0', 10);
    const hex = parseInt(req.query.hex as string || '0', 10);
    const verb = (req.query.verb as string || 'DEPLOY').toUpperCase();
    const prediction = SovereignPredictiveGenerator.predictNextState(meta, hex, verb);
    res.json(prediction);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/predict/log', (req, res) => {
  try {
    const { session = 'default', verb = 'DEPLOY', impact = {} } = req.body;
    SovereignPredictiveGenerator.writeImpactLog(session, verb, impact);
    res.json({ success: true, logs: SovereignPredictiveGenerator.getImpactLogs() });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/cards/fuse', (req, res) => {
  try {
    const { cardId1, cardId2, playerId } = req.body;
    const player = matchState.threads.find((t: any) => t.id === playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player thread not found.' });
    }

    const c1Index = player.currentBuffer.findIndex((c: any) => c.id === cardId1);
    const c2Index = player.currentBuffer.findIndex((c: any) => c.id === cardId2);

    if (c1Index === -1 || c2Index === -1 || cardId1 === cardId2) {
      return res.status(400).json({ error: 'One or both cards not found in hand.' });
    }

    const c1 = player.currentBuffer[c1Index];
    const c2 = player.currentBuffer[c2Index];

    const c1Cost = c1.cost !== undefined ? c1.cost : (c1.energyCost !== undefined ? c1.energyCost : 1);
    const c2Cost = c2.cost !== undefined ? c2.cost : (c2.energyCost !== undefined ? c2.energyCost : 1);
    const avgCost = Math.ceil((c1Cost + c2Cost) / 2);
    const fusedType = c1.type === c2.type ? c1.type : 'HYBRID';
    
    // Generate prediction for fused card visual structure
    const visualProfile = SovereignPredictiveGenerator.predictNextState(0, 0, c1.id + c2.id);

    const fusedCard = {
      id: `fused_${c1.id}_${c2.id}_${Date.now()}`,
      name: `${c1.name.split(' ')[0]} ${c2.name.split(' ').slice(-1)[0]}`,
      type: fusedType === 'HYBRID' ? 'ACTION' : fusedType, // Map strictly to valid engine Instruction type if needed, or keep type
      cost: avgCost,
      energyCost: avgCost,
      damage: Math.max(c1.damage || 1, c2.damage || 1),
      armor: Math.max(c1.armor || 0, c2.armor || 0),
      hpChange: Math.max(c1.hpChange || 1, c2.hpChange || 1),
      isUltimate: false,
      effects: {
        thermalThrottling: false,
        chronoLock: false,
        syntaxMute: false,
        threadIsolation: false
      },
      desc: `FUSED: ${c1.desc || ''} + ${c2.desc || ''}`,
      visualProfile,
      parentTypes: [c1.type, c2.type]
    };

    // Remove the fused cards and append the new one
    player.currentBuffer = player.currentBuffer.filter((_: any, idx: number) => idx !== c1Index && idx !== c2Index);
    player.currentBuffer.push(fusedCard);

    io.emit('match_state_updated', { gameState: matchState });
    res.json({ success: true, fusedCard, gameState: matchState });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/health/go-core', async (req, res) => {
  try {
    const online = await SovereignFailoverGateway.verifyHealth('http://localhost:8081');
    res.json({ online });
  } catch (e: any) {
    res.json({ online: false, error: e.message });
  }
});

app.post('/api/simulation/geometry-nodes', (req, res) => {
  try {
    const { verb = 'DEFORM', target = 'HEX' } = req.body;
    const stats = SovereignPhraseGenerator.compilePhrase(verb, target);
    res.json(stats);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});


app.post('/api/end-turn', (req, res) => {
  // Force toggle turn via admin/dashboard
  matchState.activePlayerId = matchState.activePlayerId === 'thread_king_ai' ? 'thread_hacker_root' : 'thread_king_ai';
  matchState.turnsElapsed += 1;
  matchState.systemEnergy = Math.min(100, matchState.systemEnergy + 15);
  io.emit('match_state_updated', { gameState: matchState });
  res.json({ success: true, gameState: matchState });
});
app.get('/', (req, res) => {
  res.redirect('/goal');
});app.get('/goal', (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="sk">
    <head>
      <meta charset="UTF-8">
      <title>Dušan Game - Diagnostic Dashboard</title>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=JetBrains+Mono&display=swap" rel="stylesheet">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body {
          font-family: 'Outfit', sans-serif;
          background-color: #05050a;
          background-image: radial-gradient(circle at 50% 0%, #100b20 0%, #05050a 70%);
        }
        .neon-glow {
          text-shadow: 0 0 10px rgba(0, 255, 255, 0.4);
        }
        .glass-card {
          background: rgba(15, 15, 25, 0.7);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
      </style>
    </head>
    <body class="text-slate-300 min-h-screen p-8 flex flex-col items-center">
      <div class="max-w-6xl w-full flex flex-col gap-6">
        
        <!-- Header HUD -->
        <header class="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h1 class="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span class="text-cyan-400 neon-glow">Dušan Game</span>
              <span class="text-slate-500 font-light">| Diagnostics Dashboard</span>
            </h1>
            <p class="text-xs text-slate-500 font-mono mt-1">&gt; LIVE SYSTEM TELEMETITY INTEGRITY</p>
          </div>
          <button onclick="triggerEndTurn()" class="bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-400 px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all shadow-lg hover:shadow-red-500/10 cursor-pointer">
            UKONČIŤ KOLO (FORCE END TURN)
          </button>
        </header>

        <!-- Main Live Metrics Grid -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="glass-card p-5 rounded-2xl flex flex-col justify-between">
            <span class="text-[10px] tracking-widest text-slate-500 uppercase font-bold">Systémová Energia</span>
            <div id="system-energy-val" class="text-3xl font-extrabold text-amber-400 mt-2">0.0%</div>
            <div class="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-2">
              <div id="system-energy-bar" class="h-full bg-amber-500 transition-all duration-300" style="width: 0%"></div>
            </div>
          </div>
          <div class="glass-card p-5 rounded-2xl">
            <span class="text-[10px] tracking-widest text-slate-500 uppercase font-bold">Počet Kôl (Turn Count)</span>
            <div id="turn-count-val" class="text-3xl font-extrabold text-cyan-400 mt-2">1</div>
            <span class="text-[10px] text-slate-600 font-mono mt-1 block">&gt; TICK CYCLES</span>
          </div>
          <div class="glass-card p-5 rounded-2xl">
            <span class="text-[10px] tracking-widest text-slate-500 uppercase font-bold">Fáza State Machine</span>
            <div id="current-phase-val" class="text-xl font-extrabold text-purple-400 mt-3 uppercase tracking-wider font-mono">PREPARATION</div>
          </div>
          <div class="glass-card p-5 rounded-2xl flex flex-col justify-between">
            <span class="text-[10px] tracking-widest text-slate-500 uppercase font-bold">Dungeon Entropy Stress</span>
            <div id="entropy-stress-val" class="text-3xl font-extrabold text-purple-500 mt-2">0.0%</div>
            <div class="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-2">
              <div id="entropy-stress-bar" class="h-full bg-purple-500 transition-all duration-300" style="width: 0%"></div>
            </div>
          </div>
        </div>

        <!-- Clans & RPG Stats & Quests Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- King AI (Crystal) Card -->
          <div class="glass-card p-6 rounded-3xl border-l-2 border-cyan-500/40">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-bold text-white tracking-wide uppercase flex items-center gap-2">
                <span class="w-2.5 h-2.5 bg-cyan-500 rounded-full inline-block animate-pulse"></span>
                CLAN CRYSTAL (King AI)
              </h2>
              <span id="crystal-lvl" class="text-xs font-mono bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 font-bold">LVL 1</span>
            </div>
            <!-- HP Bar -->
            <div class="mb-3">
              <div class="flex justify-between text-xs font-mono mb-1">
                <span>VITALITY HP</span>
                <span id="crystal-hp-txt">15 / 15</span>
              </div>
              <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div id="crystal-hp-bar" class="bg-cyan-500 h-full transition-all duration-300" style="width: 100%"></div>
              </div>
            </div>
            <!-- XP Bar -->
            <div class="mb-4">
              <div class="flex justify-between text-xs font-mono mb-1">
                <span>EXPERIENCE XP</span>
                <span id="crystal-xp-txt">0 / 100</span>
              </div>
              <div class="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div id="crystal-xp-bar" class="bg-purple-600 h-full transition-all duration-300" style="width: 0%"></div>
              </div>
            </div>
            <!-- Luck -->
            <div class="text-xs font-mono text-slate-500 flex justify-between mb-4 pb-2 border-b border-slate-800">
              <span>DDA LUCK ADJUSTMENT:</span>
              <span id="crystal-luck" class="text-white font-bold">0.50</span>
            </div>
            <!-- Quests -->
            <div>
              <h3 class="text-xs tracking-wider text-slate-400 font-bold uppercase mb-2 font-mono">&gt; AKTÍVNE ÚLOHY (QUESTS)</h3>
              <div id="crystal-quests" class="flex flex-col gap-2 font-mono text-xs text-slate-400">
                <!-- Dynamic Quests -->
              </div>
            </div>
          </div>

          <!-- Hacker Root (Toxic) Card -->
          <div class="glass-card p-6 rounded-3xl border-l-2 border-purple-500/40">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-bold text-white tracking-wide uppercase flex items-center gap-2">
                <span class="w-2.5 h-2.5 bg-purple-500 rounded-full inline-block animate-pulse"></span>
                CLAN TOXIC (Hacker Root)
              </h2>
              <span id="toxic-lvl" class="text-xs font-mono bg-purple-950 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 font-bold">LVL 1</span>
            </div>
            <!-- HP Bar -->
            <div class="mb-3">
              <div class="flex justify-between text-xs font-mono mb-1">
                <span>VITALITY HP</span>
                <span id="toxic-hp-txt">12 / 12</span>
              </div>
              <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div id="toxic-hp-bar" class="bg-purple-500 h-full transition-all duration-300" style="width: 100%"></div>
              </div>
            </div>
            <!-- XP Bar -->
            <div class="mb-4">
              <div class="flex justify-between text-xs font-mono mb-1">
                <span>EXPERIENCE XP</span>
                <span id="toxic-xp-txt">0 / 100</span>
              </div>
              <div class="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div id="toxic-xp-bar" class="bg-purple-600 h-full transition-all duration-300" style="width: 0%"></div>
              </div>
            </div>
            <!-- Luck -->
            <div class="text-xs font-mono text-slate-500 flex justify-between mb-4 pb-2 border-b border-slate-800">
              <span>DDA LUCK ADJUSTMENT:</span>
              <span id="toxic-luck" class="text-white font-bold">0.50</span>
            </div>
            <!-- Quests -->
            <div>
              <h3 class="text-xs tracking-wider text-slate-400 font-bold uppercase mb-2 font-mono">&gt; AKTÍVNE ÚLOHY (QUESTS)</h3>
              <div id="toxic-quests" class="flex flex-col gap-2 font-mono text-xs text-slate-400">
                <!-- Dynamic Quests -->
              </div>
            </div>
          </div>

        </div>

        <!-- Trace Logs section (Functional Application String descriptions) -->
        <div class="glass-card p-6 rounded-3xl border-slate-800">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span class="w-2.5 h-2.5 bg-green-500 rounded-full inline-block animate-ping"></span>
              ALGEBRAICKÁ TELEMETRIA (CHARACTER TRACE INSTANCES)
            </h2>
            <span id="log-count" class="text-xs text-slate-500 font-mono">0 udalostí</span>
          </div>
          <div id="trace-logs" class="flex flex-col gap-2 max-h-80 overflow-y-auto pr-2 font-mono text-xs">
            <div class="text-slate-500 italic">&gt; Načítavam dáta zo Sovereign Engine...</div>
          </div>
        </div>

      </div>

      <script>
        async function fetchTelemetry() {
          try {
            const res = await fetch('/api/telemetry');
            if (!res.ok) return;
            const data = await res.json();

            // Update Header Stats
            document.getElementById('system-energy-val').innerText = data.systemEnergy.toFixed(1) + '%';
            document.getElementById('system-energy-bar').style.width = Math.min(100, data.systemEnergy) + '%';
            if (data.systemEnergy > 80) {
              document.getElementById('system-energy-val').className = 'text-3xl font-extrabold text-red-500 animate-pulse mt-2';
            } else {
              document.getElementById('system-energy-val').className = 'text-3xl font-extrabold text-amber-400 mt-2';
            }

            document.getElementById('turn-count-val').innerText = data.turnCount;
            document.getElementById('current-phase-val').innerText = data.currentPhase;
            document.getElementById('entropy-stress-val').innerText = (data.globalEntropy * 100).toFixed(1) + '%';
            document.getElementById('entropy-stress-bar').style.width = (data.globalEntropy * 100) + '%';

            // Find Clans
            const crystal = data.threads.find(t => t.id === 'thread_king_ai');
            const toxic = data.threads.find(t => t.id === 'thread_hacker_root');

            if (crystal) {
              document.getElementById('crystal-lvl').innerText = 'LVL ' + (crystal.level || 1);
              document.getElementById('crystal-hp-txt').innerText = crystal.health + ' / ' + crystal.maxHealth;
              document.getElementById('crystal-hp-bar').style.width = ((crystal.health / crystal.maxHealth) * 100) + '%';
              document.getElementById('crystal-xp-txt').innerText = (crystal.xp || 0) + ' / ' + ((crystal.level || 1) * 100);
              document.getElementById('crystal-xp-bar').style.width = (((crystal.xp || 0) / ((crystal.level || 1) * 100)) * 100) + '%';
              document.getElementById('crystal-luck').innerText = (crystal.luck || 0.5).toFixed(2);
              renderQuests(crystal.quests, 'crystal-quests');
            }

            if (toxic) {
              document.getElementById('toxic-lvl').innerText = 'LVL ' + (toxic.level || 1);
              document.getElementById('toxic-hp-txt').innerText = toxic.health + ' / ' + toxic.maxHealth;
              document.getElementById('toxic-hp-bar').style.width = ((toxic.health / toxic.maxHealth) * 100) + '%';
              document.getElementById('toxic-xp-txt').innerText = (toxic.xp || 0) + ' / ' + ((toxic.level || 1) * 100);
              document.getElementById('toxic-xp-bar').style.width = (((toxic.xp || 0) / ((toxic.level || 1) * 100)) * 100) + '%';
              document.getElementById('toxic-luck').innerText = (toxic.luck || 0.5).toFixed(2);
              renderQuests(toxic.quests, 'toxic-quests');
            }

            // Render trace Log translated as strings
            renderTraceLog(data.traceLog);

          } catch (e) {
            console.error('Telemetry error:', e);
          }
        }

        function renderQuests(quests, containerId) {
          const container = document.getElementById(containerId);
          if (!quests || quests.length === 0) {
            container.innerHTML = '<div class="text-slate-600 italic">Žiadne aktívne úlohy.</div>';
            return;
          }
          container.innerHTML = quests.map(q => {
            let objectiveBadge = '';
            switch (q.objectiveType) {
              case 'DEFEAT_NPC':
                objectiveBadge = '<span class="text-[7.5px] bg-red-950/80 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20 font-bold uppercase mr-1">⚔️ NPC Defeat</span>';
                break;
              case 'HARVEST_MATERIAL':
                objectiveBadge = '<span class="text-[7.5px] bg-amber-950/80 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold uppercase mr-1">⛏️ Collect</span>';
                break;
              case 'REACH_BIOME':
                objectiveBadge = '<span class="text-[7.5px] bg-blue-950/80 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 font-bold uppercase mr-1">🗺️ Explore</span>';
                break;
              case 'REACH_LEVEL':
                objectiveBadge = '<span class="text-[7.5px] bg-emerald-950/80 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold uppercase mr-1">📈 Level Up</span>';
                break;
              default:
                objectiveBadge = '<span class="text-[7.5px] bg-indigo-950/80 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20 font-bold uppercase mr-1">🎯 Objective</span>';
            }

            const targetMarkup = q.targetName 
              ? '<div class="text-[8px] text-slate-400 mt-1 flex items-center gap-1 font-mono">' +
                '  <span class="text-slate-500 uppercase font-semibold text-[7px]">Target:</span>' +
                '  <span class="bg-slate-950 border border-slate-800 text-slate-300 px-1 rounded text-[7px] font-bold">' + q.targetName + '</span>' +
                ' </div>'
              : '';

            const compBadge = q.completed ? '<span class="text-[8px] bg-green-950 text-green-400 px-1 rounded font-bold">SPLNENÉ</span>' : '';

            return '<div class="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/40">' +
                   '  <div class="flex flex-wrap gap-1 items-center mb-1">' +
                   '    ' + objectiveBadge +
                   '    ' + compBadge +
                   '  </div>' +
                   '  <div class="flex justify-between items-center">' +
                   '    <span class="' + (q.completed ? 'text-green-400 line-through font-semibold' : 'text-slate-300 font-semibold') + '">' + q.title + '</span>' +
                   '  </div>' +
                   '  <div class="text-[10px] text-slate-500 mt-0.5">' + q.description + '</div>' +
                   '  ' + targetMarkup +
                   '  <div class="mt-2 flex items-center justify-between text-[9px]">' +
                   '    <div class="w-2/3 bg-slate-950 h-1 rounded-full overflow-hidden mr-2">' +
                   '      <div class="h-full ' + (q.completed ? 'bg-green-500' : 'bg-purple-500') + '" style="width: ' + ((q.progress / q.targetValue) * 100) + '%"></div>' +
                   '    </div>' +
                   '    <span>' + q.progress + ' / ' + q.targetValue + '</span>' +
                   '  </div>' +
                   '</div>';
          }).join('');
        }

        function renderTraceLog(traceLog) {
          const container = document.getElementById('trace-logs');
          document.getElementById('log-count').innerText = traceLog.length + ' udalostí';
          
          if (!traceLog || traceLog.length === 0) {
            container.innerHTML = '<div class="text-slate-600 italic">&gt; Zápas zatiaľ nemá žiadne zaznamenané stavové traces.</div>';
            return;
          }

          container.innerHTML = traceLog.map(function(t) {
            const time = new Date(t.timestamp).toLocaleTimeString();
            let desc = '';
            let color = 'text-slate-400';

            if (t.type === 'Spawn') {
              desc = '[ALOKÁCIA] Vlákno <strong class="text-cyan-400 font-bold">' + t.threadId + '</strong> bolo nasadené v sektore M' + t.chunkId + '_S' + t.blockId + '.';
              color = 'text-cyan-400/80';
            } else if (t.type === 'Move') {
              desc = '[POHYB] NPC/Hráč <strong class="text-purple-400 font-bold">' + t.threadId + '</strong> prešiel zo súradníc M' + t.from.meta + '_S' + t.from.hex + ' do M' + t.to.meta + '_S' + t.to.hex + '.';
              color = 'text-purple-400/80';
            } else if (t.type === 'Combat') {
              desc = '[BOJ] Zdroj <strong class="text-red-400 font-bold">' + t.attackerId + '</strong> udelil poškodenie <strong class="text-red-500">-' + t.damage + ' HP</strong> terču <strong class="text-slate-200 font-bold">' + t.targetId + '</strong> (Armor: ' + t.armor + ').';
              color = 'text-red-400/80';
            } else if (t.type === 'LevelUp') {
              desc = '[LEVEL_UP] Vlákno <strong class="text-green-400 font-bold">' + t.threadId + '</strong> postúpilo na <strong class="text-green-400 uppercase font-bold">LEVEL ' + t.level + '</strong>! Všetky štatistiky boli zvýšené a HP vyliečené.';
              color = 'text-green-400/80';
            }

            return '<div class="py-1 border-b border-slate-900/60 flex justify-between gap-4">' +
                   '  <span class="' + color + '">' + desc + '</span>' +
                   '  <span class="text-slate-600 font-mono text-[10px]">' + time + '</span>' +
                   '</div>';
          }).reverse().join('');
        }

        async function triggerEndTurn() {
          const res = await fetch('/api/end-turn', { method: 'POST' });
          if (res.ok) {
            fetchTelemetry();
          }
        }

        setInterval(fetchTelemetry, 1000);
        fetchTelemetry();
      </script>
    </body>
    </html>
  `);
});

app.get('/api/scenarios/semantic-sector/:threadId', (req, res) => {
  res.json({
    threadId: req.params.threadId,
    sectors: ['Alpha_Sector_01', 'Gamma_Portal_Core'],
    stabilityScore: 0.94
  });
});

app.get('/api/scenarios/terrain-telemetry/:threadId', (req, res) => {
  res.json({
    threadId: req.params.threadId,
    recommendedFrictionMultiplier: 1.15,
    adrenalineDopamineLevel: 0.88,
    activeGridWaveFrequency: 10
  });
});

app.get('/api/scenarios/realities', (req, res) => {
  res.json([
    { id: 'STANDARD', name: 'Standard Mode', roughness: 0.8, metalness: 0.1 },
    { id: 'SURGE', name: 'Voltage Surge Overdrive', roughness: 0.3, metalness: 0.8 },
    { id: 'GLITCH', name: 'System Collapse Glitch', roughness: 0.95, metalness: 0.05 }
  ]);
});

app.get('/api/scenarios/realities/active', (req, res) => {
  res.json({ activeRealityPhase });
});

app.post('/api/scenarios/realities/active', (req, res) => {
  const { phase } = req.body;
  activeRealityPhase = phase || 'STANDARD';
  io.emit('reality_phase_changed', { phase: activeRealityPhase });
  res.json({ success: true, activeRealityPhase });
});

app.get('/api/scenarios/spatial-guidance/calculations', (req, res) => {
  res.json({
    reachPenaltiesApplied: 0,
    optimalTargetDistance: 4.8,
    vectorCalculationsStatus: 'READY'
  });
});

app.get('/api/admin/compositions', (req, res) => {
  res.json([
    { id: 'comp_01', name: 'Voxel Spikes Island Configuration' },
    { id: 'comp_02', name: 'Void Walker Portal Assembly' }
  ]);
});

app.get('/api/scenarios/market-prices/:threadId', (req, res) => {
  res.json({
    threadId: req.params.threadId,
    shardsValue: 12,
    sporesValue: 8,
    essenceValue: 45
  });
});

app.get('/api/scenarios/hero-graphics', (req, res) => {
  res.json({
    resolutionProfile: 'HIGH_FIDELITY_VOXEL',
    anisotropyRating: 16,
    ambientOcclusionEnabled: true
  });
});

app.get('/api/db/registers', (req, res) => {
  res.json(dbRegisters);
});

// Mulligan endpoint
app.post('/api/match/mulligan', (req, res) => {
  const { playerId, cardIds } = req.body;
  const thread = matchState.threads.find((t: any) => t.id === playerId);
  if (thread && thread.currentBuffer) {
    // Keep cards not selected for mulligan, and draw replacement base cards
    const retained = thread.currentBuffer.filter((c: any) => !cardIds.includes(c.id));
    const drawn: any[] = [];
    while (retained.length + drawn.length < thread.handLimit) {
      const idx = Math.floor(Math.random() * allBaseCards.length);
      const c = allBaseCards[idx];
      const cost = c.isUltimate ? 2 : 1;
      const name = c.id.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const desc = `Tactical action: ${c.cardCategorization}`;
      drawn.push({ id: c.id + '_' + Date.now(), type: c.cardCategorization.toUpperCase(), cost, name, desc });
    }
    thread.currentBuffer = [...retained, ...drawn];
    matchState.turnStateMachine.mulliganComplete[playerId as 'thread_king_ai' | 'thread_hacker_root'] = true;
    
    // Check if both players completed mulligan
    if (matchState.turnStateMachine.mulliganComplete.thread_king_ai && matchState.turnStateMachine.mulliganComplete.thread_hacker_root) {
      matchState.state = 'RUNNING';
      matchState.turnStateMachine.currentPhase = 'ACTION_WINDOW';
      io.emit('match_started', { gameState: matchState });
    } else {
      io.emit('match_state_updated', { gameState: matchState });
    }
    res.json({ success: true, currentBuffer: thread.currentBuffer });
  } else {
    res.status(404).json({ error: 'Player thread not found' });
  }
});

const aiDirector = new AIOpponentDirector('thread_hacker_root');
let lastAiTimelineTurn = -1;

// Periodically tick AI opponent director (1 second interval)
setInterval(() => {
  if (matchState.state === 'RUNNING' && matchState.activePlayerId === 'thread_hacker_root') {
    if (lastAiTimelineTurn !== matchState.turnsElapsed) {
      lastAiTimelineTurn = matchState.turnsElapsed;
      const timeline = SovereignKeyframeInterpreter.evaluateSimulationTimeline('cyberpunk_infiltration', 45);
      io.emit('ai_sequence_triggered', { timeline });
      console.log(`[SERVER] Broadcasted AI keyframe simulation timeline for turn ${matchState.turnsElapsed}.`);
    }
    aiDirector.tick(matchState, io, goMediator);
  }
}, 1000);

// WebSocket Events
io.on('connection', (socket) => {
  console.log('[SOCKET] Client connected:', socket.id);

  socket.on('join_match', () => {
    socket.emit('match_state_updated', { gameState: matchState });
  });

  socket.on('start_match', (data) => {
    const { mode } = data;
    console.log(`[SERVER] Starting match with mode: ${mode}`);
    
    // Reset matchState
    matchState.state = 'MULLIGAN';
    matchState.turnsElapsed = 1;
    matchState.activePlayerId = 'thread_king_ai';
    matchState.systemEnergy = 50;
    matchState.lastComboEvent = null;
    matchState.lastComboPlayerId = null;
    turnComboTracker = { voltagePlayedThisTurn: 0, lastResistancePlayed: 0, cardsPlayedThisTurn: 0 };
    
    // Reset mulligan states
    matchState.turnStateMachine.mulliganComplete.thread_king_ai = false;
    matchState.turnStateMachine.mulliganComplete.thread_hacker_root = (mode === 'AI'); // Auto-complete for AI!
    
    // Reset threads health/position
    const p1 = matchState.threads.find((t: any) => t.id === 'thread_king_ai')!;
    p1.health = 15;
    p1.position = { meta: 0, hex: 0 };
    p1.freeMovementUsed = false;
    
    // Re-draw initial hand for human
    p1.currentBuffer = [
      { id: 'crystal_laser_01', type: 'MAGIC', cost: 1, name: 'Laser Charge', desc: 'Direct beam strike' },
      { id: 'crystal_trap_01', type: 'TRAP', cost: 2, name: 'Electro Spike', desc: 'Lays a root trap' },
      { id: 'crystal_move_01', type: 'MOVE', cost: 1, name: 'Blink Shift', desc: 'Teleport 1 hex' },
      { id: 'crystal_attack_01', type: 'ATTACK', cost: 2, name: 'Prism Sword', desc: 'Deals 3 physical DMG' }
    ];
    
    const p2 = matchState.threads.find((t: any) => t.id === 'thread_hacker_root')!;
    p2.health = 15;
    p2.position = { meta: 2, hex: 2 };
    p2.freeMovementUsed = false;
    p2.currentBuffer = [
      { id: 'toxic_snake_01', type: 'ATTACK', cost: 2, name: 'Viper Strike', desc: 'Deals 2 DMG + poison' },
      { id: 'toxic_acid_01', type: 'MAGIC', cost: 3, name: 'Corrosive Spray', desc: 'Sinks target hexagon' },
      { id: 'toxic_move_01', type: 'MOVE', cost: 1, name: 'Slime Slide', desc: 'Dash 2 hexes' }
    ];
    
    io.emit('match_started', { matchId: 'sovereign_match_01', gameState: matchState, mode });
  });

  socket.on('execute_action', (data) => {
    const { playerId, cardId, targetMeta, targetHex } = data;
    const player = matchState.threads.find((t: any) => t.id === playerId);
    
    if (player && player.currentBuffer) {
      // Find card in hand
      const cardIdx = player.currentBuffer.findIndex((c: any) => c.id === cardId);
      if (cardIdx !== -1) {
        const card = player.currentBuffer[cardIdx];
        
        // Remove card from hand
        player.currentBuffer.splice(cardIdx, 1);
        player.discardPileCount += 1;

        // Draw card up to hand limit
        if (player.currentBuffer.length < player.handLimit) {
          const idx = Math.floor(Math.random() * allBaseCards.length);
          const c = allBaseCards[idx];
          const cost = c.isUltimate ? 2 : 1;
          const name = c.id.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          const desc = `Tactical action: ${c.cardCategorization}`;
          player.currentBuffer.push({
            id: c.id + '_' + Date.now(),
            type: c.cardCategorization.toUpperCase(),
            cost,
            name,
            desc
          });
        }

        // Dynamically resolve card specs (Rule 3 and Rule 6 boundaries)
        const baseCardId = cardId.split('_')[0];
        const isVoidCard = VOID_CARDS_BASE.some(c => c.id === baseCardId);
        
        let cardCost = card.cost;
        if (isVoidCard && matchState.entropy > 0.7) {
          cardCost = 0;
          console.log(`[VOID_WALKER] High entropy (${matchState.entropy.toFixed(2)} > 0.7) detected. Void card ${baseCardId} cost reduced to 0.`);
        }
        matchState.systemEnergy = Math.max(0, matchState.systemEnergy - cardCost);

        // --- COMBO TRACKER (Goal 1a + 1b) ---
        // Physics specs drive voltage (cost) and resistance (1/cost floor 0.1)
        const cardVoltage = card.cost || 1;
        const cardResistance = Math.max(0.1, 1 / (card.cost || 1));
        turnComboTracker.voltagePlayedThisTurn += cardVoltage;
        turnComboTracker.cardsPlayedThisTurn++;

        // Reset combo event from previous card before evaluating new one
        matchState.lastComboEvent = null;
        matchState.lastComboPlayerId = null;

        if (turnComboTracker.cardsPlayedThisTurn >= 2) {
          // Goal 1a: Voltage Surge — combined voltage >= 8.0
          if (turnComboTracker.voltagePlayedThisTurn >= 8.0) {
            matchState.lastComboEvent = 'VOLTAGE_SURGE';
            matchState.lastComboPlayerId = playerId;
            console.log(`[COMBO] VOLTAGE_SURGE triggered by ${playerId}! Total V=${turnComboTracker.voltagePlayedThisTurn.toFixed(1)}`);
          }
          // Goal 1b: Short Circuit — R1 * R2 <= 1.0
          if (turnComboTracker.lastResistancePlayed > 0 &&
              turnComboTracker.lastResistancePlayed * cardResistance <= 1.0) {
            matchState.lastComboEvent = 'SHORT_CIRCUIT';
            matchState.lastComboPlayerId = playerId;
            console.log(`[COMBO] SHORT_CIRCUIT triggered by ${playerId}! R product=${(turnComboTracker.lastResistancePlayed * cardResistance).toFixed(2)}`);
          }
        }
        turnComboTracker.lastResistancePlayed = cardResistance;

        let cardDamage = 3;
        let isSnakeOrStealth = false;
        try {
          const specs = getPhysicsSpecs(baseCardId);
          if (specs) {
            if (typeof specs.damage === 'number') {
              cardDamage = specs.damage;
            }
            if (baseCardId.toLowerCase().includes('snake') || baseCardId.toLowerCase().includes('stealth')) {
              isSnakeOrStealth = true;
            }
          }
        } catch (e) {
          console.warn('[SERVER] Failed to retrieve physics specs for card:', baseCardId, e);
        }

        // Voltage Surge bonus damage (+2) — Goal 1a
        if (matchState.lastComboEvent === 'VOLTAGE_SURGE') {
          cardDamage += 2;
          console.log(`[COMBO] Voltage Surge bonus: +2 damage applied (total: ${cardDamage})`);
        }

        // Short Circuit — opponent discards 1 random card — Goal 1b
        const opponent = matchState.threads.find((t: any) => t.id !== playerId);
        if (matchState.lastComboEvent === 'SHORT_CIRCUIT' && opponent && opponent.currentBuffer && opponent.currentBuffer.length > 0) {
          const discardIdx = Math.floor(Math.random() * opponent.currentBuffer.length);
          const discarded = opponent.currentBuffer.splice(discardIdx, 1)[0];
          console.log(`[COMBO] SHORT_CIRCUIT: ${opponent.id} forced to discard '${discarded.name}'`);
        }

        // Solve combat damage via Go Core (Rule 6 boundary routing with local TS fallback)
        if (opponent) {
          const defenderArmor = opponent.items.length * 2;
          goMediator.resolveCombatDamage({
            damage: cardDamage,
            attackerHeroId: playerId,
            defenderHeroId: opponent.id,
            defenderArmor: defenderArmor,
            reactionsCount: 1,
            isSnakeOrStealth: isSnakeOrStealth
          }).then((combatRes) => {
            opponent.health = Math.max(0, opponent.health - combatRes.finalDamage);
            console.log(`[COMBAT RESOLUTION] ${combatRes.log}`);

            if (opponent.health <= 0) {
              matchState.state = 'GAME_OVER';
            }

            io.emit('match_state_updated', { gameState: matchState });
            io.emit('card_played_effect', {
              targetHex: { meta: targetMeta, hex: targetHex },
              sourceHex: player.position
            });
          });
        } else {
          io.emit('match_state_updated', { gameState: matchState });
          io.emit('card_played_effect', {
            targetHex: { meta: targetMeta, hex: targetHex },
            sourceHex: player.position
          });
        }
      }
    }
  });

  socket.on('move_hero', (data) => {
    const { playerId, targetMeta, targetHex } = data;
    const player = matchState.threads.find((t: any) => t.id === playerId);

    if (player && !player.freeMovementUsed) {
      player.position = { meta: targetMeta, hex: targetHex };
      player.freeMovementUsed = true;
      matchState.systemEnergy = Math.max(0, matchState.systemEnergy - 5);

      // --- TRAP TRIGGER CHECK (Goal 2 server-side) ---
      const chunk = matchState.map.find((c: any) => c.id === targetMeta);
      if (chunk) {
        const block = chunk.blocks.find((b: any) => b.id === targetHex);
        if (block && block.hasTrap && block.trapOwnerId !== playerId) {
          if (block.hasTrap === 'ROOT_TRAP') {
            player.isRooted = true;
            console.log(`[TRAP] ROOT_TRAP triggered on ${playerId} at (${targetMeta},${targetHex})`);
          } else if (block.hasTrap === 'EMP_MINE') {
            player.health = Math.max(0, player.health - 3);
            console.log(`[TRAP] EMP_MINE triggered on ${playerId}: -3 HP`);
          }
          // Consume trap after trigger
          block.hasTrap = null;
          block.trapOwnerId = null;
        }
      }
      
      io.emit('match_state_updated', { gameState: matchState });
    }
  });

  // Place trap (Goal 2 — card-triggered placement)
  socket.on('place_trap', (data) => {
    const { playerId, trapType, targetMeta, targetHex } = data;
    const chunk = matchState.map.find((c: any) => c.id === targetMeta);
    if (chunk) {
      const block = chunk.blocks.find((b: any) => b.id === targetHex);
      if (block && block.walkable && !block.hasTrap) {
        block.hasTrap = trapType || 'ROOT_TRAP';
        block.trapOwnerId = playerId;
        console.log(`[TRAP] ${trapType || 'ROOT_TRAP'} placed by ${playerId} at (${targetMeta},${targetHex})`);
        io.emit('match_state_updated', { gameState: matchState });
      }
    }
  });

  socket.on('end_turn', (data) => {
    const { playerId } = data;
    if (matchState.activePlayerId === playerId) {
      // Toggle active player
      matchState.activePlayerId = playerId === 'thread_king_ai' ? 'thread_hacker_root' : 'thread_king_ai';
      matchState.turnsElapsed += 1;

      // Reset movement
      matchState.threads.forEach((t: any) => {
        t.freeMovementUsed = false;
      });

      // Reset combo tracker for new turn
      turnComboTracker = { voltagePlayedThisTurn: 0, lastResistancePlayed: 0, cardsPlayedThisTurn: 0 };
      matchState.lastComboEvent = null;
      matchState.lastComboPlayerId = null;

      // Increase energy slightly
      matchState.systemEnergy = Math.min(100, matchState.systemEnergy + 15);

      // --- LOOT CHEST SPAWN (Goal 3 — 15% chance per turn) ---
      if (Math.random() < 0.15) {
        const eligibleBlocks: { chunk: any; block: any }[] = [];
        matchState.map.forEach((chunk: any) => {
          chunk.blocks.forEach((block: any) => {
            if (block.walkable && !block.hasChest && !block.hasTrap) {
              // Verify no thread is standing on this block
              const occupied = matchState.threads.some(
                (t: any) => t.position.meta === chunk.id && t.position.hex === block.id
              );
              if (!occupied) eligibleBlocks.push({ chunk, block });
            }
          });
        });
        if (eligibleBlocks.length > 0) {
          const pick = eligibleBlocks[Math.floor(Math.random() * eligibleBlocks.length)];
          pick.block.hasChest = true;
          console.log(`[LOOT] Chest spawned at chunk ${pick.chunk.id}, block ${pick.block.id}`);
        }
      }

      io.emit('match_state_updated', { gameState: matchState });
    }
  });

  socket.on('disconnect', () => {
    console.log('[SOCKET] Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`[SOVEREIGN_SERVER] Running on http://localhost:${PORT}`);
});
