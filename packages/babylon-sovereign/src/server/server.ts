import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { 
  Pathfinder, 
  SpatialGuidanceSystem, 
  AlgebraicActionTensor,
  CRYSTAL_CARDS_BASE,
  TOXIC_CARDS_BASE,
  DRUID_CARDS_BASE,
  VOID_CARDS_BASE,
  GoCoreMediator,
  SovereignKeyframeInterpreter,
  getPhysicsSpecs
} from '@dusan-game/shared';

import { AIOpponentDirector } from './models/AIOpponentDirector';

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
    systemUptimeMs: Date.now()
  });
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
      { id: 'crystal_shield_01', type: 'MAGIC', cost: 2, name: 'Glass Shield', desc: 'Absorbs 5 DMG' },
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
