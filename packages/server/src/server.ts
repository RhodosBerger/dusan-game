import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { SovereignEngine } from './models/SovereignEngine';
import { startBackoffice } from './backoffice';
import { AIOpponentDirector } from './models/AIOpponentDirector';
import { initializeSeedData } from './seedData';
import { DailyQuestEngine } from './models/DailyQuestEngine';
import { ActionNode } from './models/ActionNode';
import { Instruction } from './models/Instruction';
import { TacticalAssembler } from './models/TacticalAssembler';
import { Thread } from './models/Thread';
import { BiomeEngine, CRYSTAL_CARDS_BASE, TOXIC_CARDS_BASE, DRUID_CARDS_BASE, VOID_CARDS_BASE, getPhysicsSpecs, AdrenalineDirector, ITEMS_CATALOG, OhmGridEvaluator, SpatialGuidanceSystem } from '@dusan-game/shared';
import { SemanticGameplayCoordinator } from './models/SemanticGameplayCoordinator';
import { TerrainTelemetryCoordinator } from './models/TerrainTelemetryCoordinator';
import { RenderPriorityBalancer } from './models/RenderPriorityBalancer';
import { GameplayCompositorManager } from './models/GameplayCompositorManager';
import { GameplayCompositionEngine } from './models/GameplayCompositionEngine';
import { AestheticMarketCoordinator } from './models/AestheticMarketCoordinator';
import { TacticalGenerativeCoordinator } from './models/TacticalGenerativeCoordinator';
import { SovereignContentDistributor } from './models/SovereignContentDistributor';
import { SovereignLogicConsole } from './models/SovereignLogicConsole';
import { SovereignBattleDirector } from './models/SovereignBattleDirector';
import { SovereignSuperpositionEngine } from './models/SovereignSuperpositionEngine';
import { SovereignSystemHierarchy } from './models/SovereignSystemHierarchy';
import { SovereignStatisticsReporter } from './models/SovereignStatisticsReporter';
import { SovereignTelemetrySpawner } from './models/SovereignTelemetrySpawner';
import { SovereignCombinatoricsRegistry } from './models/SovereignCombinatoricsRegistry';
import { ClickHouseTelemetryClient } from './models/ClickHouseTelemetryClient';

const allBases = [...CRYSTAL_CARDS_BASE, ...TOXIC_CARDS_BASE, ...DRUID_CARDS_BASE, ...VOID_CARDS_BASE];

dotenv.config();

const GO_CORE_URL = process.env.GO_CORE_URL || 'http://localhost:8081';

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

const defaultEngine = new SovereignEngine();

// Inicializácia dát pre predvolený sandbox
initializeSeedData(defaultEngine);

interface WaitingPlayer {
  socketId: string;
  socket: any;
  name: string;
  hero: string;
  theme: string;
}

const socketToThread = new Map<string, string>();
const matchmakingQueue: WaitingPlayer[] = [];
const activeMatches = new Map<string, { engine: SovereignEngine; players: string[]; interval: NodeJS.Timeout; aiDirector?: AIOpponentDirector; aiThreadId?: string }>();

import { DatabaseSyncManager } from './models/DatabaseSyncManager';

const dbSync = new DatabaseSyncManager('./database.db');

const getEngineContext = (sock: any) => {
  const matchId = sock.data.matchId;
  if (matchId && activeMatches.has(matchId)) {
    const match = activeMatches.get(matchId)!;
    return {
      engine: match.engine,
      targetEmit: (event: string, payload: any) => io.to(`room_${matchId}`).emit(event, payload),
      matchId
    };
  }
  return {
    engine: defaultEngine,
    targetEmit: (event: string, payload: any) => io.emit(event, payload),
    matchId: 'default_match'
  };
};

const saveEngineState = (engine: SovereignEngine, matchId: string) => {
  for (const thread of engine.threads) {
    if (thread.type === 'PLAYER') {
      dbSync.savePlayerState(thread);
    }
  }

  if (engine.traceLog.length > 0) {
    const lastEvent = engine.traceLog[engine.traceLog.length - 1];
    dbSync.logTelemetry(matchId, lastEvent.type, lastEvent);
  }
};

// Spustenie časovača ticking pre reakcie každú sekundu
setInterval(() => {
  if (defaultEngine.turnStateMachine.currentPhase === 'INTERRUPT_WINDOW') {
    defaultEngine.turnStateMachine.tickTimer();
    io.emit('state_resolved', defaultEngine.getState());
  }
}, 1000);


io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Priradenie klientskeho ID k threadu v predvolenom sandboxe.
  // Do playerIds patrí thread ID hrdinu (engine ním validuje ťahy), nie socket ID.
  let sandboxThreadId: string | null = null;
  if (defaultEngine.playerIds.length === 0) {
    sandboxThreadId = 'thread_king_ai';
  } else if (defaultEngine.playerIds.length === 1) {
    sandboxThreadId = 'thread_hacker_root';
  }

  if (sandboxThreadId && defaultEngine.addPlayer(sandboxThreadId)) {
    socketToThread.set(socket.id, sandboxThreadId);
    console.log(`${socket.id} joined the default game as ${sandboxThreadId}.`);
  } else {
    console.log(`${socket.id} joined as spectator.`);
  }
  socket.emit('initial_map', defaultEngine.getStaticMapState());
  socket.emit('state_resolved', defaultEngine.getState());

  // Registrácia pre PvP Matchmaking
  socket.on('join_matchmaking', (payload: { name: string; hero: string; theme: string }) => {
    console.log(`[LOBBY] Player ${payload.name} (${socket.id}) entered queue. Hero: ${payload.hero}`);
    matchmakingQueue.push({
      socketId: socket.id,
      socket,
      name: payload.name,
      hero: payload.hero,
      theme: payload.theme
    });

    if (matchmakingQueue.length >= 2) {
      const p1 = matchmakingQueue.shift()!;
      const p2 = matchmakingQueue.shift()!;
      const matchId = `match_${Date.now()}`;
      const roomName = `room_${matchId}`;

      p1.socket.join(roomName);
      p2.socket.join(roomName);
      p1.socket.data.matchId = matchId;
      p2.socket.data.matchId = matchId;

      const matchEngine = new SovereignEngine();
      initializeSeedData(matchEngine);

      const t1 = matchEngine.threads.find(t => t.id === 'thread_king_ai');
      if (t1) {
        t1.name = p1.name;
        const profile1 = dbSync.getOrCreatePlayer(p1.name, 'crystal');
        t1.loadProfile({
          level: profile1.level,
          xp: profile1.xp,
          maxHealth: profile1.maxHealth,
          armor: profile1.armor,
          luck: profile1.luck,
          materials: JSON.parse(profile1.materials),
          quests: DailyQuestEngine.parseQuestsForThread(profile1.quests)
        });
        const dbItems1 = dbSync.getPlayerItems(p1.name);
        t1.items = dbItems1;
        dbItems1.forEach(item => {
          const catalogItem = ITEMS_CATALOG[item.itemKey];
          if (catalogItem) {
            if (catalogItem.category === 'WEAPON' && catalogItem.statBonus?.damage) {
              t1.baseDamage += catalogItem.statBonus.damage * item.quantity;
            } else if (catalogItem.category === 'MAGIC') {
              if (catalogItem.statBonus?.damage) {
                t1.baseDamage += catalogItem.statBonus.damage * item.quantity;
              }
              if (catalogItem.statBonus?.spellReach) {
                t1.spellReach = (t1.spellReach || 2) + catalogItem.statBonus.spellReach * item.quantity;
              }
            }
          }
        });
        const dbArtifacts1 = dbSync.getPlayerArtifacts(p1.name);
        t1.artifacts = dbArtifacts1.map((art: any) => ({
          id: art.id,
          artifactKey: art.artifact_key,
          category: art.category,
          heroClass: art.hero_class,
          spellReachBonus: art.spell_reach_bonus,
          damageBonus: art.damage_bonus
        }));
        dbArtifacts1.forEach(art => {
          if (art.damage_bonus) {
            t1.baseDamage += art.damage_bonus;
          }
          if (art.spell_reach_bonus) {
            t1.spellReach = (t1.spellReach || 2) + art.spell_reach_bonus;
          }
        });
        const lockedRegisters1 = dbSync.getLockedRegisters(p1.name);
        lockedRegisters1.forEach(r => {
          if (r.buff_type === 'DAMAGE_BUFF') {
            t1.baseDamage += r.buff_value;
          } else if (r.buff_type === 'ARMOR_BUFF') {
            t1.armor += r.buff_value;
          } else if (r.buff_type === 'LUCK_BUFF') {
            t1.luck += r.buff_value;
          }
        });
        matchEngine.playerIds.push('thread_king_ai');
      }
      const t2 = matchEngine.threads.find(t => t.id === 'thread_hacker_root');
      if (t2) {
        t2.name = p2.name;
        const profile2 = dbSync.getOrCreatePlayer(p2.name, 'toxic');
        t2.loadProfile({
          level: profile2.level,
          xp: profile2.xp,
          maxHealth: profile2.maxHealth,
          armor: profile2.armor,
          luck: profile2.luck,
          materials: JSON.parse(profile2.materials),
          quests: DailyQuestEngine.parseQuestsForThread(profile2.quests)
        });
        const dbItems2 = dbSync.getPlayerItems(p2.name);
        t2.items = dbItems2;
        dbItems2.forEach(item => {
          const catalogItem = ITEMS_CATALOG[item.itemKey];
          if (catalogItem) {
            if (catalogItem.category === 'WEAPON' && catalogItem.statBonus?.damage) {
              t2.baseDamage += catalogItem.statBonus.damage * item.quantity;
            } else if (catalogItem.category === 'MAGIC') {
              if (catalogItem.statBonus?.damage) {
                t2.baseDamage += catalogItem.statBonus.damage * item.quantity;
              }
              if (catalogItem.statBonus?.spellReach) {
                t2.spellReach = (t2.spellReach || 2) + catalogItem.statBonus.spellReach * item.quantity;
              }
            }
          }
        });
        const dbArtifacts2 = dbSync.getPlayerArtifacts(p2.name);
        t2.artifacts = dbArtifacts2.map((art: any) => ({
          id: art.id,
          artifactKey: art.artifact_key,
          category: art.category,
          heroClass: art.hero_class,
          spellReachBonus: art.spell_reach_bonus,
          damageBonus: art.damage_bonus
        }));
        dbArtifacts2.forEach(art => {
          if (art.damage_bonus) {
            t2.baseDamage += art.damage_bonus;
          }
          if (art.spell_reach_bonus) {
            t2.spellReach = (t2.spellReach || 2) + art.spell_reach_bonus;
          }
        });
        const lockedRegisters2 = dbSync.getLockedRegisters(p2.name);
        lockedRegisters2.forEach(r => {
          if (r.buff_type === 'DAMAGE_BUFF') {
            t2.baseDamage += r.buff_value;
          } else if (r.buff_type === 'ARMOR_BUFF') {
            t2.armor += r.buff_value;
          } else if (r.buff_type === 'LUCK_BUFF') {
            t2.luck += r.buff_value;
          }
        });
        matchEngine.playerIds.push('thread_hacker_root');
      }

      socketToThread.set(p1.socketId, 'thread_king_ai');
      socketToThread.set(p2.socketId, 'thread_hacker_root');

      // Automaticky spustíme hru po pridaní oboch hráčov
      matchEngine.startGame();

      const matchInterval = setInterval(() => {
        if (matchEngine.turnStateMachine.currentPhase === 'INTERRUPT_WINDOW') {
          matchEngine.turnStateMachine.tickTimer();
          io.to(roomName).emit('state_resolved', matchEngine.getState());
        }
      }, 1000);

      activeMatches.set(matchId, {
        engine: matchEngine,
        players: [p1.socketId, p2.socketId],
        interval: matchInterval
      });

      io.to(roomName).emit('match_started', { matchId, theme: p1.theme, mode: 'PVP' });
      io.to(roomName).emit('initial_map', matchEngine.getStaticMapState());
      io.to(roomName).emit('state_resolved', matchEngine.getState());
      console.log(`[LOBBY] PvP Match ${matchId} started between ${p1.name} and ${p2.name}.`);
    }
  });

  // Registrácia pre tréning proti AI
  socket.on('join_ai_match', (payload: { name: string; hero: string; theme: string }) => {
    console.log(`[LOBBY] Player ${payload.name} (${socket.id}) started AI match. Hero: ${payload.hero}`);
    const matchId = `match_${Date.now()}`;
    const roomName = `room_${matchId}`;

    socket.join(roomName);
    socket.data.matchId = matchId;

    const matchEngine = new SovereignEngine();
    initializeSeedData(matchEngine);

    const chosenHero = payload.hero;
    const aiHero = chosenHero === 'thread_king_ai' ? 'thread_hacker_root' : 'thread_king_ai';

    const pThread = matchEngine.threads.find(t => t.id === chosenHero);
    if (pThread) {
      pThread.name = payload.name;
      const dbHeroType = chosenHero === 'thread_king_ai' ? 'crystal' : chosenHero === 'thread_hacker_root' ? 'toxic' : 'void';
      const profile = dbSync.getOrCreatePlayer(payload.name, dbHeroType);
      pThread.loadProfile({
        level: profile.level,
        xp: profile.xp,
        maxHealth: profile.maxHealth,
        armor: profile.armor,
        luck: profile.luck,
        materials: JSON.parse(profile.materials),
        quests: DailyQuestEngine.parseQuestsForThread(profile.quests)
      });
      const dbItemsAI = dbSync.getPlayerItems(payload.name);
      pThread.items = dbItemsAI;
      dbItemsAI.forEach(item => {
        const catalogItem = ITEMS_CATALOG[item.itemKey];
        if (catalogItem) {
          if (catalogItem.category === 'WEAPON' && catalogItem.statBonus?.damage) {
            pThread.baseDamage += catalogItem.statBonus.damage * item.quantity;
          } else if (catalogItem.category === 'MAGIC') {
            if (catalogItem.statBonus?.damage) {
              pThread.baseDamage += catalogItem.statBonus.damage * item.quantity;
            }
            if (catalogItem.statBonus?.spellReach) {
              pThread.spellReach = (pThread.spellReach || 2) + catalogItem.statBonus.spellReach * item.quantity;
            }
          }
        }
      });
      const dbArtifactsAI = dbSync.getPlayerArtifacts(payload.name);
      pThread.artifacts = dbArtifactsAI.map((art: any) => ({
        id: art.id,
        artifactKey: art.artifact_key,
        category: art.category,
        heroClass: art.hero_class,
        spellReachBonus: art.spell_reach_bonus,
        damageBonus: art.damage_bonus
      }));
      dbArtifactsAI.forEach(art => {
        if (art.damage_bonus) {
          pThread.baseDamage += art.damage_bonus;
        }
        if (art.spell_reach_bonus) {
          pThread.spellReach = (pThread.spellReach || 2) + art.spell_reach_bonus;
        }
      });
      const lockedRegistersAI = dbSync.getLockedRegisters(payload.name);
      lockedRegistersAI.forEach(r => {
        if (r.buff_type === 'DAMAGE_BUFF') {
          pThread.baseDamage += r.buff_value;
        } else if (r.buff_type === 'ARMOR_BUFF') {
          pThread.armor += r.buff_value;
        } else if (r.buff_type === 'LUCK_BUFF') {
          pThread.luck += r.buff_value;
        }
      });
      // Engine porovnáva activePlayerId s ID hrdinov, preto sem patrí thread ID (nie socket ID)
      matchEngine.playerIds.push(chosenHero);
    }
    const aiThread = matchEngine.threads.find(t => t.id === aiHero);
    if (aiThread) {
      aiThread.name = "Sovereign AI";
      matchEngine.playerIds.push(aiHero);
    }

    socketToThread.set(socket.id, chosenHero);

    // Automaticky spustíme hru
    matchEngine.startGame();

    const aiDirector = new AIOpponentDirector(matchEngine, aiHero);

    const matchInterval = setInterval(() => {
      if (matchEngine.turnStateMachine.currentPhase === 'INTERRUPT_WINDOW') {
        matchEngine.turnStateMachine.tickTimer();
        io.to(roomName).emit('state_resolved', matchEngine.getState());
      }

      // AI protivník: max. 1 akcia za sekundu, nech má ťah čitateľné tempo
      if (aiDirector.tick()) {
        saveEngineState(matchEngine, matchId);
        io.to(roomName).emit('state_resolved', matchEngine.getState());
      }
    }, 1000);

    activeMatches.set(matchId, {
      engine: matchEngine,
      players: [socket.id],
      interval: matchInterval,
      aiDirector,
      aiThreadId: aiHero
    });

    socket.emit('match_started', { matchId, theme: payload.theme, mode: 'AI' });
    io.to(roomName).emit('initial_map', matchEngine.getStaticMapState());
    saveEngineState(matchEngine, matchId);
    io.to(roomName).emit('state_resolved', matchEngine.getState());
    console.log(`[LOBBY] AI Match ${matchId} started for player ${payload.name}.`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    socketToThread.delete(socket.id);
    
    // Odstránenie z queue ak sa odpojil pred spustením zápasu
    const qIndex = matchmakingQueue.findIndex(p => p.socketId === socket.id);
    if (qIndex !== -1) {
      matchmakingQueue.splice(qIndex, 1);
    }
    
    // Vyčistenie inštancie pri odpojení všetkých hráčov
    const matchId = socket.data.matchId;
    if (matchId && activeMatches.has(matchId)) {
      const match = activeMatches.get(matchId)!;
      clearInterval(match.interval);
      activeMatches.delete(matchId);
      console.log(`[LOBBY] Zápas ${matchId} vyčistený po odpojení hráča.`);
    }
  });

  // Hráč zahrá inštrukciu
  socket.on('execute_instruction', (payload) => {
    const { engine, targetEmit, matchId } = getEngineContext(socket);
    console.log('Instruction received:', payload);
    
    const sourceThread = engine.threads.find(t => t.id === payload.sourceId);
    if (!sourceThread) return;
    
    const instructionIndex = sourceThread.currentBuffer.findIndex(c => c.id === payload.instructionId);
    if (instructionIndex === -1) return;

    const instruction = sourceThread.currentBuffer[instructionIndex];
    sourceThread.currentBuffer.splice(instructionIndex, 1);

    const nodeId = `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const actionNode = new ActionNode(nodeId, instruction, payload.sourceId, payload.targetId);

    if (engine.turnStateMachine.currentPhase === 'INTERRUPT_WINDOW') {
      engine.turnStateMachine.registerReaction(actionNode);
    } else {
      engine.turnStateMachine.registerAction(actionNode);
    }

    saveEngineState(engine, matchId);
    targetEmit('state_resolved', engine.getState());
  });

  // Udalosť playCard odosielaná z 3D klientu
  socket.on('playCard', (payload: { cardId: string; targetHex: { meta: number; hex: number } }) => {
    const { engine, targetEmit, matchId } = getEngineContext(socket);
    console.log('playCard received:', payload);
    const activePlayerId = engine.activePlayerId || 'thread_king_ai';
    const activePlayerThread = engine.threads.find(t => t.id === activePlayerId);
    if (!activePlayerThread) return;

    const instructionIndex = activePlayerThread.currentBuffer.findIndex(c => c.id === payload.cardId);
    if (instructionIndex === -1) return;

    const instruction = activePlayerThread.currentBuffer[instructionIndex];
    const baseCard = allBases.find(c => c.id === payload.cardId);

    // Range guard on card play
    if (activePlayerThread.position.meta !== null) {
      const isAttackNode = instruction.damage > 0 || (baseCard?.cardCategorization === 'attack');
      const reach = isAttackNode ? activePlayerThread.attackReach : activePlayerThread.spellReach;
      const targetMeta = payload.targetHex.meta;
      
      const coords = [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
        { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
        { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }
      ];
      const c1 = coords[activePlayerThread.position.meta] || { x: 0, y: 0 };
      const c2 = coords[targetMeta] || { x: 0, y: 0 };
      const metaDist = Math.abs(c1.x - c2.x) + Math.abs(c1.y - c2.y);

      if (reach === 0) {
        if (metaDist > 0) {
          console.log(`[BLOK] Karta ${payload.cardId} odmietnutá: Dosah je 0, cieľ musí byť na rovnakej metapozícii.`);
          return;
        }
      } else {
        if (metaDist > reach) {
          console.log(`[BLOK] Karta ${payload.cardId} odmietnutá: Cieľ je mimo dosahu (vzdialenosť ${metaDist} > ${reach}).`);
          return;
        }
      }
    }

    activePlayerThread.currentBuffer.splice(instructionIndex, 1);
    
    // Každá zahraná karta sa presunie do odkladacieho balíčka
    activePlayerThread.discardPile.push(instruction);

    // ── Void Walker Entropy Check ──────────────────────────────────────────
    if (baseCard && baseCard.heroId === 'void') {
      if (engine.globalEntropy > 0.7) {
        instruction.energyCost = 0;
        console.log(`[VOID_WALKER] Global entropy is high (${engine.globalEntropy.toFixed(2)} > 0.7). Void card ${instruction.id} is FREE to cast!`);
      }
    }

    // Adapt movement cards
    if (baseCard && baseCard.cardCategorization === 'movement') {
      const oldPos = { ...activePlayerThread.position };
      activePlayerThread.position = { meta: payload.targetHex.meta, hex: payload.targetHex.hex };
      engine.map.placeThread(activePlayerId, payload.targetHex.meta, payload.targetHex.hex);
      
      engine.traceLog.push({
        type: 'Move',
        threadId: activePlayerId,
        from: oldPos,
        to: { meta: payload.targetHex.meta, hex: payload.targetHex.hex },
        cost: 0.0,
        timestamp: Date.now()
      } as any);

      engine.triggerTrapCheck(activePlayerThread, payload.targetHex.meta, payload.targetHex.hex);
      engine.triggerOpportunityCheck(activePlayerThread, payload.targetHex.meta, payload.targetHex.hex);
    }

    const nodeId = `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const targetThread = engine.threads.find(
      t => t.position && t.position.meta === payload.targetHex.meta && t.position.hex === payload.targetHex.hex
    );
    const targetId = targetThread ? targetThread.id : 'environment';

    const actionNode = new ActionNode(nodeId, instruction, activePlayerId, targetId);

    const isAttack = baseCard?.cardCategorization === 'attack';

    // Differentiate Helper play vs Action play
    if (instruction.type === 'HELPER') {
      const isTrap = instruction.id === 'snowGround' || instruction.id === 'snakes' || instruction.id === 'snakesForward' || instruction.id === 'rootTrap';
      if (isTrap) {
        const targetChunk = engine.map.chunks.find(c => c.id === payload.targetHex.meta);
        const targetBlock = targetChunk?.blocks.find(b => b.id === payload.targetHex.hex);
        if (targetBlock) {
          targetBlock.hasTrap = (instruction.id.includes('snow') || instruction.id.includes('root')) ? 'ROOT_TRAP' : 'EMP_MINE';
          targetBlock.trapOwnerId = activePlayerId;
          console.log(`[TRAP_PLACED] Player ${activePlayerId} placed ${targetBlock.hasTrap} at M${payload.targetHex.meta}_S${payload.targetHex.hex}`);
        }
      } else {
        // Spawn helper unit
        const helperId = `helper_${Date.now()}_${instruction.id}`;
        const helperThread = new Thread(helperId, 'HELPER', activePlayerId);
        helperThread.name = instruction.name;
        helperThread.health = instruction.isUltimate ? 8 : 4;
        engine.spawnThread(helperThread, payload.targetHex.meta, payload.targetHex.hex);
      }
      
      // Útoční pomocníci vyvolajú prepnutie ťahu na reakciu
      if (isAttack) {
        engine.turnStateMachine.registerAction(actionNode);
      }
    } else {
      if (engine.turnStateMachine.currentPhase === 'INTERRUPT_WINDOW') {
        engine.turnStateMachine.registerReaction(actionNode);
      } else {
        engine.turnStateMachine.registerAction(actionNode);
      }
    }

    // Check if a combo was registered in the trace log
    const lastLogs = engine.traceLog.slice(-3);
    for (const log of lastLogs) {
      if (log.type === 'Combo') {
        if (log.message.includes('Voltage Surge')) {
          targetEmit('voltage_surge', {
            playerId: log.threadId,
            message: log.message,
            targetHex: payload.targetHex
          });
        } else if (log.message.includes('Short Circuit')) {
          targetEmit('short_circuit', {
            playerId: log.threadId,
            message: log.message,
            targetHex: payload.targetHex
          });
        }
      }
    }

    const pSpecs = getPhysicsSpecs(payload.cardId);
    const opponentId = activePlayerId === 'thread_king_ai' ? 'thread_hacker_root' : 'thread_king_ai';
    const opponentThread = engine.threads.find(t => t.id === opponentId);
    const adrState = AdrenalineDirector.getAdrenalineState(activePlayerThread, opponentThread, engine.systemEnergy, engine.turnStateMachine.turnNumber || 1);
    const finalSpecs = AdrenalineDirector.modifyActionForAdrenaline(pSpecs, adrState);

    // Webcam-based Gaze focus modifier
    if ((engine as any).lastFocusIndex !== undefined && (engine as any).lastFocusIndex > 0.8) {
      finalSpecs.voltage = Number((finalSpecs.voltage * 1.15).toFixed(2));
      console.log(`[OPENVINO FOCUS BONUS] High focus detected (${(engine as any).lastFocusIndex.toFixed(2)} > 0.8). Card voltage boosted to ${finalSpecs.voltage}V!`);
    }

    const isCardUltimate = baseCard ? (baseCard.isUltimate || false) : false;

    targetEmit('card_played_effect', {
      cardId: payload.cardId,
      targetHex: payload.targetHex,
      voltage: finalSpecs.voltage,
      current: finalSpecs.current,
      isUltimate: isCardUltimate,
      damage: Math.round(finalSpecs.voltage * 1.2)
    });

    // ── Log Combat Telemetry to Go Core (GPS/Magnitude/Manner) ───────────────
    if (payload.targetHex) {
      const chunkId = payload.targetHex.meta;
      const hexId = payload.targetHex.hex;
      const chunk = engine.map.chunks.find(c => c.id === chunkId);
      const block = chunk?.blocks.find(b => b.id === hexId);

      if (block) {
        const resistance = block.conductivity > 0 ? (1.0 / block.conductivity) : 4.0;
        const evaluation = OhmGridEvaluator.evaluateSectorStress({
          sectorId: `M${chunkId}_S${hexId}`,
          voltage: finalSpecs.voltage,
          resistance: resistance,
          systemEntropy: engine.globalEntropy,
          isShortCircuited: block.hasTrap === 'ROOT_TRAP'
        });

        console.log(`[GRID_STRESS] Sector M${chunkId}_S${hexId} Current: ${evaluation.current}A`);

        // Log Combat parameters to ClickHouse buffer
        ClickHouseTelemetryClient.logCombat({
          match_id: matchId || 'local_simulation',
          player_id: activePlayerId || 'unknown_player',
          card_id: payload.cardId,
          voltage: finalSpecs.voltage,
          current: evaluation.current,
          timestamp: Date.now()
        });

        if (evaluation.shortCircuitTriggered) {
          // Log Short Circuit parameters to ClickHouse buffer
          ClickHouseTelemetryClient.logShortCircuit({
            sector_id: `M${chunkId}_S${hexId}`,
            voltage: finalSpecs.voltage,
            resistance: resistance,
            current_load: evaluation.current,
            timestamp: Date.now()
          });

          block.hasTrap = 'ROOT_TRAP';
          block.trapOwnerId = activePlayerId;

          engine.traceLog.push({
            type: 'System',
            threadId: activePlayerId || 'SYSTEM',
            chunkId,
            blockId: hexId,
            timestamp: Date.now(),
            message: `[SHORT_CIRCUIT] Grid overload detected at Sector M${chunkId}_S${hexId}. Current: ${evaluation.current}A (Threshold: 8.0A).`
          } as any);

          targetEmit('grid_short_circuit', {
            chunkId,
            hexId,
            current: evaluation.current,
            message: `SKRAT: Preťaženie siete na sektore M${chunkId}_S${hexId} (${evaluation.current}A)!`
          });
        }
      }

      const baseCard = allBases.find(c => c.id === payload.cardId);
      const manner = baseCard?.cardCategorization === 'attack' ? 'attack' : 
                     (baseCard?.cardCategorization === 'movement' ? 'defense' : 'spell');
      fetch(`${GO_CORE_URL}/api/telemetry/combat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: matchId || 'local_simulation',
          playerId: activePlayerId,
          actionType: manner,
          cardId: payload.cardId,
          magnitude: finalSpecs.voltage,
          chunkId: payload.targetHex.meta,
          hexId: payload.targetHex.hex
        })
      }).catch(err => {
        console.warn('[TELEMETRY] Go Core telemetry not available:', err.message);
      });
    }
    
    saveEngineState(engine, matchId);
    targetEmit('state_resolved', engine.getState());
  });

  // Pasovanie
  socket.on('action_pass', (payload) => {
    const { engine, targetEmit, matchId } = getEngineContext(socket);
    console.log(`Player passed: ${payload.playerId}`);
    engine.turnStateMachine.pass(payload.playerId);
    saveEngineState(engine, matchId);
    targetEmit('state_resolved', engine.getState());
  });

  // Výroba pomocnej jednotky (Craft Helper)
  socket.on('craft_helper', (payload) => {
    const { engine, targetEmit, matchId } = getEngineContext(socket);
    console.log('Craft helper request:', payload);
    const sourceThread = engine.threads.find(t => t.id === payload.sourceId);
    if (!sourceThread) return;

    try {
      const helperType = TacticalAssembler.assemble(sourceThread, payload.recipeId);
      const helperId = `helper_${Date.now()}_${helperType}`;
      const helperThread = new Thread(helperId, 'HELPER', payload.sourceId);
      
      helperThread.health = helperType === 'tower' ? 5 : 1;
      helperThread.armor = helperType === 'tower' ? 2 : 0;

      const success = engine.spawnThread(helperThread, payload.metaId, payload.hexId);
      if (success) {
        console.log(`[CRAFTING] Vyrobený a nasadený ${helperType} na pozíciu M${payload.metaId}_S${payload.hexId}.`);
      } else {
        console.log(`[CRAFTING] Nepodarilo sa nasadiť pomocníka na vybranú pozíciu.`);
      }
    } catch (e: any) {
      console.log(`[CRAFTING CHYBA] ${e.message}`);
    }

    saveEngineState(engine, matchId);
    targetEmit('state_resolved', engine.getState());
  });

  // Pohyb a cestovanie hrdinu
  socket.on('move_character', (payload: { playerId: string; targetHex: { meta: number; hex: number } }) => {
    const { engine, targetEmit, matchId } = getEngineContext(socket);
    console.log('move_character request received:', payload);
    const activePlayerId = engine.activePlayerId || 'thread_king_ai';
    
    if (payload.playerId !== activePlayerId) {
      console.log(`[POHYB BLOK] Pokus o ťah mimo poradia: ${payload.playerId}`);
      return;
    }

    const thread = engine.threads.find(t => t.id === payload.playerId);
    if (!thread) return;

    if (thread.isRooted) {
      console.log(`[POHYB BLOK] Hrdina ${thread.id} je zakorenený.`);
      return;
    }

    if (thread.freeMovementUsed) {
      console.log(`[POHYB BLOK] Bezplatný pohyb už bol v tomto ťahu vyčerpaný. Ďalší pohyb je možný len pomocou pohybových kariet.`);
      return;
    }

    if (thread.position.meta !== null && thread.position.hex !== null) {
      const coords = [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
        { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
        { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }
      ];
      const c1 = coords[thread.position.meta] || { x: 0, y: 0 };
      const c2 = coords[payload.targetHex.meta] || { x: 0, y: 0 };
      const metaDist = Math.abs(c1.x - c2.x) + Math.abs(c1.y - c2.y);
      if (metaDist > 1) {
        const energyCost = (metaDist - 1) * 3;
        if (engine.systemEnergy >= energyCost) {
          engine.systemEnergy -= energyCost;
          console.log(`[POHYB JUMP] Long range jump to M${payload.targetHex.meta} cost ${energyCost} energy. System energy left: ${engine.systemEnergy}`);
        } else {
          console.log(`[POHYB BLOK] Príliš ďaleko (vzdialenosť metapozícií ${metaDist} > 1) a nedostatočná energia (potrebné ${energyCost}, k dispozícii ${engine.systemEnergy}).`);
          return;
        }
      }
    }

    const cellOccupied = engine.threads.some(t => 
      t.position && t.position.meta === payload.targetHex.meta && t.position.hex === payload.targetHex.hex
    );
    if (cellOccupied) {
      console.log(`[POHYB BLOK] Políčko je už obsadené.`);
      return;
    }

    // Set free movement used
    thread.freeMovementUsed = true;

    const oldPos = { ...thread.position };
    thread.position = { meta: payload.targetHex.meta, hex: payload.targetHex.hex };
    console.log(`[POHYB] Hrdina ${thread.id} sa presunul na M${payload.targetHex.meta}_S${payload.targetHex.hex}.`);

    // Multi-Region Content and Quest Distribution
    const distributionLog = SovereignContentDistributor.evaluateAndDistribute(
      engine,
      thread.id,
      payload.targetHex.meta,
      payload.targetHex.hex
    );
    console.log(distributionLog);

    engine.traceLog.push({
      type: 'Move',
      threadId: thread.id,
      from: oldPos as any,
      to: { meta: payload.targetHex.meta, hex: payload.targetHex.hex },
      cost: 1.0,
      timestamp: Date.now()
    });

    // ── Claim Loot Chest if present on target hex ───────────────────────────
    const targetChunk = engine.map.chunks.find(c => c.id === payload.targetHex.meta);
    const targetBlock = targetChunk?.blocks.find(b => b.id === payload.targetHex.hex);
    if (targetBlock && targetBlock.hasChest) {
      targetBlock.hasChest = false; // consume
      
      const materialToGive = thread.id === 'thread_king_ai' ? 'CrystalShard' : 'Spores';
      thread.materials[materialToGive] = (thread.materials[materialToGive] || 0) + 1;
      thread.xp = (thread.xp || 0) + 50;
      
      console.log(`[CHEST CLAIM] Player ${thread.id} claimed loot chest. +1 ${materialToGive}, +50 XP!`);
      
      // RPG Level Up check: each level requires level * 100 XP
      const nextLevelXp = (thread.level || 1) * 100;
      if (thread.xp >= nextLevelXp) {
        thread.level = (thread.level || 1) + 1;
        thread.xp -= nextLevelXp;
        thread.armor += 2;
        thread.health = thread.maxHealth || 15; // full heal
        console.log(`[LEVEL UP] Player ${thread.id} reached level ${thread.level}! HP fully healed, armor +2.`);
      }

      engine.traceLog.push({
        type: 'ChestClaim',
        threadId: thread.id,
        message: `Loot chest claimed! +1 ${materialToGive}, +50 XP`,
        timestamp: Date.now()
      } as any);
    }

    const biomeDetails = BiomeEngine.getBiomeForHex(payload.targetHex.meta, payload.targetHex.hex);
    if (biomeDetails && biomeDetails.biome === 'TOXIC_SWAMP') {
      thread.updateQuestProgress('REACH_BIOME', 1, 'TOXIC_SWAMP');
    }

    // Trigger trap check for moved player!
    engine.triggerTrapCheck(thread, payload.targetHex.meta, payload.targetHex.hex);
    engine.triggerOpportunityCheck(thread, payload.targetHex.meta, payload.targetHex.hex);

    saveEngineState(engine, matchId);
    targetEmit('state_resolved', engine.getState());
  });

  // Prepnúť stealth režim hrdinu
  socket.on('toggle_stealth', (payload: { playerId: string }) => {
    const { engine, targetEmit, matchId } = getEngineContext(socket);
    console.log('toggle_stealth request received:', payload);
    const activePlayerId = engine.activePlayerId || 'thread_king_ai';
    
    if (payload.playerId !== activePlayerId) {
      console.log(`[STEALTH BLOK] Pokus o zmenu mimo poradia: ${payload.playerId}`);
      return;
    }

    const thread = engine.threads.find(t => t.id === payload.playerId);
    if (!thread) return;

    thread.isStealthed = !thread.isStealthed;
    console.log(`[STEALTH] Hrdina ${thread.id} zmenil stav stealth na: ${thread.isStealthed}`);

    engine.traceLog.push({
      type: 'StatusEffect',
      threadId: thread.id,
      message: `Stealth mode toggled to ${thread.isStealthed ? 'ON' : 'OFF'} for ${thread.id}.`,
      timestamp: Date.now()
    } as any);

    saveEngineState(engine, matchId);
    targetEmit('state_resolved', engine.getState());
  });

  // Liečenie negatívneho stavu
  socket.on('clear_status', (payload: { playerId: string; cardId: string; statusToClear: 'slowed' | 'rooted' | 'disarmed' | 'silenced' }) => {
    const { engine, targetEmit, matchId } = getEngineContext(socket);
    console.log('clear_status request received:', payload);
    const activePlayerId = engine.activePlayerId || 'thread_king_ai';
    
    // 1. Validácia ťahu
    if (payload.playerId !== activePlayerId) {
      console.log(`[CURE BLOK] Pokus o liečenie mimo poradia: ${payload.playerId}`);
      return;
    }

    const thread = engine.threads.find(t => t.id === payload.playerId);
    if (!thread) return;

    // 2. Nájsť kartu v ruke hráča
    const cardIndex = thread.currentBuffer.findIndex(c => c.id === payload.cardId);
    if (cardIndex === -1) {
      console.log(`[CURE BLOK] Karta ${payload.cardId} sa nenachádza v ruke.`);
      return;
    }

    const card = thread.currentBuffer[cardIndex];

    // 3. Validácia typu karty podľa pravidiel (z translations alebo base kartičky)
    const cardBase = allBases.find(c => c.id === card.id);
    const category = cardBase ? cardBase.cardCategorization : '';

    let isValidSacrifice = false;
    if (payload.statusToClear === 'slowed' && category === 'movement') {
      isValidSacrifice = true;
    } else if ((payload.statusToClear === 'rooted' || payload.statusToClear === 'disarmed') && (category === 'attack' || (cardBase && cardBase.isUnit))) {
      isValidSacrifice = true;
    } else if (payload.statusToClear === 'silenced' && category === 'magic') {
      isValidSacrifice = true;
    }

    if (!isValidSacrifice) {
      console.log(`[CURE BLOK] Neplatná obeta: Karta kategórie "${category}" nemôže vyliečiť stav "${payload.statusToClear}".`);
      return;
    }

    // 4. Vykonanie liečenia
    thread.currentBuffer.splice(cardIndex, 1); // obetovanie karty
    
    if (payload.statusToClear === 'slowed') thread.isSlowed = false;
    else if (payload.statusToClear === 'rooted') thread.isRooted = false;
    else if (payload.statusToClear === 'disarmed') thread.isDisarmed = false;
    else if (payload.statusToClear === 'silenced') thread.isSilenced = false;

    console.log(`[CURE] Hrdina ${thread.id} sa vyliečil zo stavu ${payload.statusToClear} obetovaním karty ${card.id}.`);

    engine.traceLog.push({
      type: 'CureStatus' as any,
      threadId: thread.id,
      status: payload.statusToClear,
      timestamp: Date.now()
    } as any);

    saveEngineState(engine, matchId);
    targetEmit('state_resolved', engine.getState());
  });

  // ── Buy Item in Town Shop ──────────────────────────────────────────
  socket.on('buy_item', async (payload: { playerId: string; itemKey: string }) => {
    const { engine, targetEmit, matchId } = getEngineContext(socket);
    const thread = engine.threads.find(t => t.id === payload.playerId);
    if (!thread) return;

    if (thread.position.meta !== 0 || thread.position.hex !== 0) {
      socket.emit('error_message', { message: 'Musíte byť v meste (M0_S0) pre nákup itemov!' });
      return;
    }

    const item = ITEMS_CATALOG[payload.itemKey];
    if (!item) return;

    const costMat = item.buyCost.material;
    const costAmt = item.buyCost.amount;
    const currentAmt = thread.materials[costMat] || 0;

    if (currentAmt < costAmt) {
      socket.emit('error_message', { message: `Nedostatok ${costMat}! Vyžaduje sa ${costAmt}.` });
      return;
    }

    thread.materials[costMat] = currentAmt - costAmt;

    try {
      if (item.category === 'MAGIC' && item.heroClass) {
        dbSync.addPlayerArtifact(
          thread.name,
          item.key,
          item.category,
          item.heroClass,
          item.statBonus?.spellReach ?? 0,
          item.statBonus?.damage ?? 0
        );
        thread.artifacts = dbSync.getPlayerArtifacts(thread.name).map((art: any) => ({
          id: art.id,
          artifactKey: art.artifact_key,
          category: art.category,
          heroClass: art.hero_class,
          spellReachBonus: art.spell_reach_bonus,
          damageBonus: art.damage_bonus
        }));
      } else {
        dbSync.addPlayerItem(thread.name, item.key, item.category);
        thread.items = dbSync.getPlayerItems(thread.name);
      }

      if (item.category === 'WEAPON' && item.statBonus?.damage) {
        thread.baseDamage += item.statBonus.damage;
      } else if (item.category === 'MAGIC') {
        if (item.statBonus?.damage) {
          thread.baseDamage += item.statBonus.damage;
        }
        if (item.statBonus?.spellReach) {
          thread.spellReach = (thread.spellReach || 2) + item.statBonus.spellReach;
        }
      }

      console.log(`[SHOP] Player ${thread.name} bought ${item.name} for ${costAmt} ${costMat}.`);
      engine.traceLog.push({
        type: 'ShopPurchase',
        threadId: thread.id,
        message: `Kúpené: ${item.name} za ${costAmt} ${costMat}`,
        timestamp: Date.now()
      } as any);
    } catch (e) {
      console.error('[SHOP ERROR] Failed to purchase item:', e);
    }

    saveEngineState(engine, matchId);
    targetEmit('state_resolved', engine.getState());
  });

  // ── Sell Item in Town Shop ─────────────────────────────────────────
  socket.on('sell_item', async (payload: { playerId: string; itemKey: string }) => {
    const { engine, targetEmit, matchId } = getEngineContext(socket);
    const thread = engine.threads.find(t => t.id === payload.playerId);
    if (!thread) return;

    if (thread.position.meta !== 0 || thread.position.hex !== 0) {
      socket.emit('error_message', { message: 'Musíte byť v meste (M0_S0) pre predaj itemov!' });
      return;
    }

    const item = ITEMS_CATALOG[payload.itemKey];
    if (!item) return;

    try {
      let removed = false;
      if (item.category === 'MAGIC' && item.heroClass) {
        removed = dbSync.removePlayerArtifact(thread.name, item.key);
        thread.artifacts = dbSync.getPlayerArtifacts(thread.name).map((art: any) => ({
          id: art.id,
          artifactKey: art.artifact_key,
          category: art.category,
          heroClass: art.hero_class,
          spellReachBonus: art.spell_reach_bonus,
          damageBonus: art.damage_bonus
        }));
      } else {
        removed = dbSync.removePlayerItem(thread.name, item.key);
        thread.items = dbSync.getPlayerItems(thread.name);
      }

      if (!removed) {
        socket.emit('error_message', { message: 'Tento item nevlastníte!' });
        return;
      }
      const sellMat = item.sellValue.material;
      const sellAmt = item.sellValue.amount;
      thread.materials[sellMat] = (thread.materials[sellMat] || 0) + sellAmt;

      if (item.category === 'WEAPON' && item.statBonus?.damage) {
        thread.baseDamage = Math.max(5, thread.baseDamage - item.statBonus.damage);
      } else if (item.category === 'MAGIC') {
        if (item.statBonus?.damage) {
          thread.baseDamage = Math.max(5, thread.baseDamage - item.statBonus.damage);
        }
        if (item.statBonus?.spellReach) {
          thread.spellReach = Math.max(1, (thread.spellReach || 2) - item.statBonus.spellReach);
        }
      }

      console.log(`[SHOP] Player ${thread.name} sold ${item.name} for ${sellAmt} ${sellMat}.`);
      engine.traceLog.push({
        type: 'ShopSale',
        threadId: thread.id,
        message: `Predané: ${item.name} za ${sellAmt} ${sellMat}`,
        timestamp: Date.now()
      } as any);
    } catch (e) {
      console.error('[SHOP ERROR] Failed to sell item:', e);
    }

    saveEngineState(engine, matchId);
    targetEmit('state_resolved', engine.getState());
  });

  // Koniec kola
  socket.on('end_turn', async () => {
    const { engine, targetEmit, matchId } = getEngineContext(socket);
    console.log('End turn request received');

    // V AI zápase nemôže hráč ukončiť ťah, keď je na ťahu AI (preskočil by jej celý ťah)
    const match = activeMatches.get(matchId);
    if (match?.aiThreadId && engine.turnStateMachine.activePlayerId === match.aiThreadId) {
      console.log('[END_TURN BLOK] Na ťahu je AI, požiadavka hráča ignorovaná.');
      return;
    }

    engine.turnStateMachine.endTurn();
    
    // Webcam-based fatigue index penalty
    if ((engine as any).lastFatigueIndex !== undefined && (engine as any).lastFatigueIndex > 0.6) {
      engine.globalEntropy = Number((engine.globalEntropy + 0.03).toFixed(2));
      console.log(`[OPENVINO FATIGUE PENALTY] High fatigue detected (${(engine as any).lastFatigueIndex.toFixed(2)} > 0.6). Global entropy increased to ${engine.globalEntropy}!`);
    }

    // Evaluate and spawn dynamic telemetry events (traps/chests) on turn end
    await SovereignTelemetrySpawner.evaluateAndSpawn(engine);

    saveEngineState(engine, matchId);
    targetEmit('state_resolved', engine.getState());
  });
});

const PORT = process.env.PORT || 3001;

app.get('/api/telemetry', (req, res) => {
  try {
    res.status(200).json({
      threads: defaultEngine.threads.map(t => ({
        id: t.id,
        name: t.name,
        type: t.type,
        health: t.health,
        maxHealth: t.maxHealth,
        armor: t.armor,
        level: t.level,
        xp: t.xp,
        luck: t.luck,
        materials: t.materials,
        position: t.position,
        quests: t.quests
      })),
      systemEnergy: defaultEngine.systemEnergy,
      turnCount: defaultEngine.turnCount,
      currentPhase: defaultEngine.turnStateMachine.currentPhase,
      traceLog: defaultEngine.traceLog,
      globalEntropy: defaultEngine.dungeonState.totalEntropy
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/telemetry/vision', async (req, res) => {
  try {
    const response = await fetch(`${GO_CORE_URL}/api/telemetry/vision`);
    if (!response.ok) {
       res.status(response.status).json({ error: 'Failed to fetch vision telemetry from Go Core' });
       return;
    }
    const data = await response.json();
    res.status(200).json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/telemetry/vision', async (req, res) => {
  try {
    const payload = req.body;
    let details: any = {};
    if (typeof payload.telemetry_theory === 'string') {
      details = JSON.parse(payload.telemetry_theory);
    } else {
      details = payload.telemetry_theory || {};
    }

    const focusVal = details.focus_index !== undefined ? details.focus_index : 0.85;
    const fatigueVal = details.fatigue_index !== undefined ? details.fatigue_index : 0.15;
    (defaultEngine as any).lastFocusIndex = focusVal;
    (defaultEngine as any).lastFatigueIndex = fatigueVal;

    ClickHouseTelemetryClient.logVision({
      session_id: payload.session_id || 'unknown_session',
      fps: details.fps || 0,
      latency_ms: details.latency_ms || 0,
      defect_class: details.detected_defect_class || 0,
      confidence: details.confidence || 0,
      timestamp: details.timestamp || Date.now()
    });

    const response = await fetch(`${GO_CORE_URL}/api/telemetry/vision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
       res.status(response.status).json({ error: 'Failed to proxy vision telemetry to Go Core' });
       return;
    }
    const data = await response.json();
    res.status(201).json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/ml/archetype/adapt', (req, res) => {
  const { username, archetype } = req.body;
  if (!username || !archetype) {
     res.status(400).json({ error: 'Username and archetype are required.' });
     return;
  }
  (defaultEngine as any).activeArchetype = archetype;
  console.log(`[ML ARCHETYPE ADAPT] Player ${username} classified as ${archetype}. Spawner probability adjusted.`);
  res.status(200).json({ success: true, message: `Successfully updated player archetype to ${archetype}` });
});

app.get('/api/db/registers', (req, res) => {
  try {
    const registers = dbSync.getMemoryRegisters();
    res.status(200).json(registers);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/db/registers/lock', (req, res) => {
  try {
    const { username, registerAddress, shardCost } = req.body;
    if (!username || !registerAddress || !shardCost) {
      res.status(400).json({ error: 'Missing required parameters: username, registerAddress, shardCost' });
      return;
    }

    const profile = dbSync.getOrCreatePlayer(username, 'crystal');
    const materials = JSON.parse(profile.materials || '{}');

    const currentShards = materials.CrystalShard || 0;
    if (currentShards < shardCost) {
      res.status(400).json({ error: `Insufficient CrystalShards. Required: ${shardCost}, Available: ${currentShards}` });
      return;
    }

    materials.CrystalShard = currentShards - shardCost;
    
    let buffType = 'LUCK_BUFF';
    let buffValue = 0.1;
    if (registerAddress === '0x00A0') {
      buffType = 'DAMAGE_BUFF';
      buffValue = 2.0;
    } else if (registerAddress === '0x00C0') {
      buffType = 'ARMOR_BUFF';
      buffValue = 1.0;
    }

    dbSync.lockRegister(username, registerAddress, buffType, buffValue);

    const playerThread = defaultEngine.threads.find(t => t.name === username);
    if (playerThread) {
      playerThread.materials = materials;
      if (buffType === 'DAMAGE_BUFF') {
        playerThread.baseDamage = (playerThread.baseDamage || 5) + buffValue;
      } else if (buffType === 'ARMOR_BUFF') {
        playerThread.armor = (playerThread.armor || 0) + buffValue;
      } else if (buffType === 'LUCK_BUFF') {
        playerThread.luck = (playerThread.luck || 0.5) + buffValue;
      }
      dbSync.savePlayerState(playerThread);
    } else {
      const stmt = (dbSync as any).db.prepare('UPDATE players SET materials = ? WHERE username = ?');
      stmt.run(JSON.stringify(materials), username);
    }

    res.status(200).json({
      success: true,
      message: `Successfully locked register ${registerAddress} for player ${username}. Granted ${buffType} (+${buffValue}).`,
      buffType,
      buffValue,
      remainingShards: materials.CrystalShard
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/db/registers/locked', (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      res.status(400).json({ error: 'Missing username parameter' });
      return;
    }
    const locked = dbSync.getLockedRegisters(username as string);
    res.status(200).json(locked);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/db/players', (req, res) => {
  try {
    const players = dbSync.getAllPlayers();
    res.status(200).json(players);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/scenarios/semantic-sector/:threadId', (req, res) => {
  try {
    const threadId = req.params.threadId;
    const targetEngine = defaultEngine;
    const payload = SemanticGameplayCoordinator.getSemanticSectorState(targetEngine, threadId);
    if (!payload) {
       res.status(404).json({ error: `Player thread ${threadId} or matching block not found.` });
       return;
    }
    res.json(payload);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/scenarios/terrain-telemetry/:threadId', (req, res) => {
  try {
    const threadId = req.params.threadId;
    const targetEngine = defaultEngine;
    const payload = TerrainTelemetryCoordinator.getTerrainTelemetry(targetEngine, threadId);
    if (!payload) {
       res.status(404).json({ error: `Player thread ${threadId} or matching block not found.` });
       return;
    }
    res.json(payload);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/scenarios/render-priorities/:threadId', (req, res) => {
  try {
    const threadId = req.params.threadId;
    const targetEngine = defaultEngine;
    const payload = RenderPriorityBalancer.getRenderPriorities(targetEngine, threadId);
    if (!payload) {
       res.status(404).json({ error: `Player thread ${threadId} not found.` });
       return;
    }
    res.json(payload);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/scenarios/composite-trigger', (req, res) => {
  try {
    const { threadId } = req.body;
    const targetEngine = defaultEngine;
    const result = GameplayCompositorManager.processCompositeTrigger(targetEngine, threadId);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/scenarios/canvas-composition/:threadId', (req, res) => {
  try {
    const threadId = req.params.threadId;
    const targetEngine = defaultEngine;
    const result = GameplayCompositionEngine.getCanvasComposition(targetEngine, threadId);
    if (!result) {
       res.status(404).json({ error: `Player thread ${threadId} not found.` });
       return;
    }
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/scenarios/market-prices/:threadId', (req, res) => {
  try {
    const threadId = req.params.threadId;
    const targetEngine = defaultEngine;
    const result = AestheticMarketCoordinator.getMarketPrices(targetEngine, threadId);
    if (!result) {
       res.status(404).json({ error: `Player thread ${threadId} not found.` });
       return;
    }
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/scenarios/hero-graphics', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'models/hero_graphics_dataset.json');
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Hero graphics dataset not found.' });
      return;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/scenarios/realities', (req, res) => {
  try {
    const list = dbSync.getRealityTemplates();
    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/scenarios/realities', (req, res) => {
  try {
    const { id, name, priority, speciesAllowed, proceduralRules, combinatoricsMultiplier } = req.body;
    dbSync.saveRealityTemplate({
      id: id || `reality_${Date.now()}`,
      name,
      priority: Number(priority),
      speciesAllowed: typeof speciesAllowed === 'string' ? speciesAllowed : JSON.stringify(speciesAllowed),
      proceduralRules: typeof proceduralRules === 'string' ? proceduralRules : JSON.stringify(proceduralRules),
      combinatoricsMultiplier: Number(combinatoricsMultiplier)
    });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/scenarios/realities/:id', (req, res) => {
  try {
    const { id } = req.params;
    dbSync.deleteRealityTemplate(id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/scenarios/realities/active', (req, res) => {
  try {
    const { phase } = req.body;
    (defaultEngine as any).realityPhase = phase || 'STANDARD';
    io.emit('reality_phase_changed', { realityPhase: (defaultEngine as any).realityPhase });
    res.json({ success: true, activeRealityPhase: (defaultEngine as any).realityPhase });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/scenarios/spatial-guidance/calculations', (req, res) => {
  try {
    const targetEngine = defaultEngine;
    const threadPositions = targetEngine.threads.map(t => {
      const pos = t.position && t.position.meta !== null ? SpatialGuidanceSystem.resolveCartesian(t.position.meta, t.position.hex!) : { x: 0, y: 0, z: 0 };
      return {
        id: t.id,
        name: t.name,
        type: t.type,
        meta: t.position?.meta,
        hex: t.position?.hex,
        x: pos.x,
        y: pos.y,
        z: pos.z
      };
    });

    const objects: any[] = [];
    targetEngine.map.chunks.forEach(c => {
      c.blocks.forEach(b => {
        if (b.hasChest || b.hasTrap || b.isTown) {
          const pos = SpatialGuidanceSystem.resolveCartesian(c.id, b.id);
          objects.push({
            type: b.hasChest ? 'CHEST' : b.hasTrap ? 'TRAP' : 'TOWN',
            meta: c.id,
            hex: b.id,
            x: pos.x,
            y: pos.y,
            z: pos.z
          });
        }
      });
    });

    res.json({
      threads: threadPositions,
      objects
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/scenarios/spatial-guidance/inject', (req, res) => {
  try {
    const { script, meta, hex, description } = req.body;
    dbSync.saveComposition({
      id: `script_inj_${Date.now()}`,
      prompt: script,
      actionType: 'SPATIAL_GUIDANCE_TRAJECTORY',
      metaId: Number(meta || 0),
      hexId: Number(hex || 0),
      powerRating: 1.0,
      description: description || 'Cartesian Guidance system trajectory inject',
      created_at: Date.now()
    });
    res.json({ success: true, message: 'Trajectory script successfully injected into database.' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/documentation', (req, res) => {
  res.send(SovereignLogicConsole.getSystemDocumentation());
});

app.get('/api/admin/access-points/:threadId', (req, res) => {
  const { threadId } = req.params;
  const targetEngine = defaultEngine;
  const pts = SovereignLogicConsole.getAccessPoints(targetEngine, threadId);
  res.json(pts);
});

app.post('/api/admin/access-points/override', (req, res) => {
  const { threadId, pointId, value } = req.body;
  const targetEngine = defaultEngine;
  const log = SovereignLogicConsole.applyOverride(targetEngine, threadId, pointId, value);
  res.json({ success: true, message: log });
});

app.post('/api/admin/logic/evaluate', (req, res) => {
  const { formula, state } = req.body;
  const evaluation = SovereignLogicConsole.evaluatePropositionalLogic(formula, state);
  res.json(evaluation);
});

app.post('/api/admin/compositions', (req, res) => {
  try {
    const inst = req.body;
    dbSync.saveComposition(inst);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/compositions', (req, res) => {
  try {
    const list = dbSync.getCompositions();
    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/admin/compositions/:id', (req, res) => {
  try {
    const { id } = req.params;
    dbSync.deleteComposition(id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/craft', (req, res) => {
  try {
    const { username, recipeId } = req.body;
    if (!username || !recipeId) {
      return res.status(400).json({ error: 'Chýba meno hráča (username) alebo ID receptu (recipeId).' });
    }

    const profile = dbSync.getOrCreatePlayer(username, 'crystal');
    const materials = JSON.parse(profile.materials || '{}');

    if (recipeId === 'GRAVITY_HARVESTER') {
      const shardCost = 10;
      const coreCost = 3;
      const shardAmount = materials.CrystalShard ?? 0;
      const coreAmount = materials.VoidCore ?? 0;

      if (shardAmount >= shardCost && coreAmount >= coreCost) {
        materials.CrystalShard = shardAmount - shardCost;
        materials.VoidCore = coreAmount - coreCost;

        dbSync.updatePlayerMaterials(username, materials);
        dbSync.addPlayerItem(username, 'GRAVITY_HARVESTER', 'TOOL');

        return res.json({
          success: true,
          message: 'Položka GRAVITY_HARVESTER bola úspešne vyrobená.',
          materials
        });
      } else {
        return res.status(400).json({
          error: `Nedostatok surovín. Potrebné: ${shardCost} CrystalShard, ${coreCost} VoidCore. K dispozícii: ${shardAmount} CrystalShard, ${coreAmount} VoidCore.`
        });
      }
    } else if (recipeId === 'AETHER_SABER') {
      const shardCost = 5;
      const coreCost = 1;
      const shardAmount = materials.CrystalShard ?? 0;
      const coreAmount = materials.VoidCore ?? 0;

      if (shardAmount >= shardCost && coreAmount >= coreCost) {
        materials.CrystalShard = shardAmount - shardCost;
        materials.VoidCore = coreAmount - coreCost;

        dbSync.updatePlayerMaterials(username, materials);
        dbSync.addPlayerItem(username, 'AETHER_SABER', 'WEAPON');

        return res.json({
          success: true,
          message: 'Položka AETHER_SABER bola úspešne vyrobená.',
          materials
        });
      } else {
        return res.status(400).json({
          error: `Nedostatok surovín. Potrebné: ${shardCost} CrystalShard, ${coreCost} VoidCore. K dispozícii: ${shardAmount} CrystalShard, ${coreAmount} VoidCore.`
        });
      }
    } else {
      return res.status(400).json({ error: `Neznámy recept pre crafting: ${recipeId}.` });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/battle/resolve', (req, res) => {
  try {
    const { playerId, npcId } = req.body;
    const targetEngine = defaultEngine;
    const outcome = SovereignBattleDirector.evaluateBattleEncounter(targetEngine, playerId, npcId);
    res.json(outcome);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/battle/scale-difficulty', (req, res) => {
  try {
    const targetEngine = defaultEngine;
    const log = SovereignBattleDirector.scaleNPCOnVictories(targetEngine);
    res.json({ success: true, message: log });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/battle/guidance/:threadId', (req, res) => {
  try {
    const { threadId } = req.params;
    const targetEngine = defaultEngine;
    const guidance = SovereignBattleDirector.getEncountersNavigationMap(targetEngine, threadId);
    res.json(guidance);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/system/hierarchy', (req, res) => {
  const map = SovereignSystemHierarchy.getComponentMap();
  res.json(map);
});

app.get('/api/system/integrity', (req, res) => {
  const integrity = SovereignSystemHierarchy.verifySystemIntegrity();
  res.json(integrity);
});

app.post('/api/superposition/apply', (req, res) => {
  const { threadId, type } = req.body;
  const targetEngine = defaultEngine;
  const thread = targetEngine.threads.find(t => t.id === threadId);
  if (!thread) {
    res.status(404).json({ error: 'Player thread not found.' });
    return;
  }
  const log = SovereignSuperpositionEngine.applySuperposition(thread, type);
  res.json({ success: true, message: log });
});

app.post('/api/superposition/collapse', (req, res) => {
  const { threadId, choice } = req.body;
  const targetEngine = defaultEngine;
  const thread = targetEngine.threads.find(t => t.id === threadId);
  if (!thread) {
    res.status(404).json({ error: 'Player thread not found.' });
    return;
  }
  const result = SovereignSuperpositionEngine.collapseState(thread, choice);
  res.json({ success: true, ...result });
});

app.get('/api/system/statistics-report', (req, res) => {
  try {
    const stats = SovereignStatisticsReporter.generateStatisticsReport();
    const md = SovereignStatisticsReporter.compileMarkdownReport(stats);
    const reportPath = '/home/rhoddos_berger/.gemini/antigravity-ide/brain/066f6b59-4305-46f4-ade5-f62df6b096b7/game_specs_statistics_report.md';
    fs.writeFileSync(reportPath, md, 'utf8');
    res.json(stats);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/telemetry/evaluate-spawn', async (req, res) => {
  try {
    const FASTAPI_URL = 'http://127.0.0.1:8000';
    const combatHistory = req.body.history || [];

    const mlResponse = await fetch(`${FASTAPI_URL}/api/ml/combat/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ combat_history: combatHistory })
    });

    if (!mlResponse.ok) {
      throw new Error(`ML Service responded with status: ${mlResponse.status}`);
    }
    const data: any = await mlResponse.json();
    
    // Update defaultEngine with the dominant archetype returned from microservice
    (defaultEngine as any).activeArchetype = data.dominant_archetype;

    res.json({ success: true, archetype: data.dominant_archetype });
  } catch (error: any) {
    console.warn('[FASTAPI_FALLBACK] Microservice unavailable. Defaulting to FAST_MOVER.', error.message);
    res.json({ success: true, archetype: 'FAST_MOVER', fallback: true });
  }
});

app.get('/api/telemetry/active-spawns', (req, res) => {
  try {
    const spawns = SovereignTelemetrySpawner.getActiveEvents();
    res.json(spawns);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/combinatorics/list', (req, res) => {
  try {
    const list = SovereignCombinatoricsRegistry.listAllCombos();
    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/combinatorics/register', (req, res) => {
  try {
    const { name, cards, successRate, power, effects } = req.body;
    SovereignCombinatoricsRegistry.registerCombo(name, cards, successRate, power, effects);
    res.json({ success: true, message: `Successfully registered combinatorial combo: ${name}` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/combinatorics/detect', (req, res) => {
  try {
    const { playedCards } = req.body;
    const combo = SovereignCombinatoricsRegistry.detectComboPlayed(playedCards);
    res.json({ match: combo !== null, combo });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/scenarios/generate-tactical-instance', async (req, res) => {
  try {
    const { threadId, tacticPrompt } = req.body;
    const targetEngine = defaultEngine;
    const result = await TacticalGenerativeCoordinator.generateTacticalInstance(
      targetEngine, 
      threadId, 
      tacticPrompt || 'stealth'
    );

    // Auto-save to SQLite compositions if successful
    if (result.success) {
      dbSync.saveComposition({
        id: `comp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        prompt: tacticPrompt || 'stealth',
        actionType: result.actionType,
        coordinates: result.coordinates,
        powerRating: result.powerRating,
        description: result.description,
        timestamp: Date.now()
      });
    }

    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/scenarios/trigger', (req, res) => {
  const { scenarioType, matchId } = req.body;
  const targetEngine = defaultEngine;
  
  console.log(`[SCENARIO API] Triggering scenario ${scenarioType} for match ${matchId || 'default'}`);
  
  try {
    if (scenarioType === 'BOSS_SPAWN') {
      const boss = targetEngine.spawnNPC('void_sentinel_boss', 'Elite Void Sentinel', 1, 0, 7);
      boss.health = 30;
      boss.maxHealth = 30;
      boss.armor = 3;
      targetEngine.traceLog.push({
        type: 'Combat',
        attackerId: 'SYSTEM',
        targetId: 'void_sentinel_boss',
        damage: 0,
        armor: 0,
        timestamp: Date.now(),
        message: 'Elite Void Sentinel has spawned near the gate!'
      } as any);
    } else if (scenarioType === 'ARENA_COLLAPSE') {
      targetEngine.map.chunks.forEach(c => {
        if (c.id >= 6) {
          c.blocks.forEach(b => {
            b.walkable = false;
          });
        }
      });
      targetEngine.traceLog.push({
        type: 'Combat',
        attackerId: 'SYSTEM',
        targetId: 'environment',
        damage: 0,
        armor: 0,
        timestamp: Date.now(),
        message: 'CRITICAL ALERT: Outer rings of the arena are collapsing!'
      } as any);
    } else if (scenarioType === 'SYSTEM_OVERLOAD') {
      targetEngine.systemEnergy = 100;
      targetEngine.traceLog.push({
        type: 'Combat',
        attackerId: 'SYSTEM',
        targetId: 'environment',
        damage: 0,
        armor: 0,
        timestamp: Date.now(),
        message: 'SYSTEM OVERLOAD: System energy maxed out!'
      } as any);
    } else if (scenarioType === 'HAZARD_ERUPTION') {
      let count = 0;
      for (let i = 0; i < 50; i++) {
        const randomChunk = targetEngine.map.chunks[Math.floor(Math.random() * 9)];
        const randomBlock = randomChunk.blocks[Math.floor(Math.random() * 7)];
        if (!randomBlock.isTown && randomBlock.walkable) {
          randomBlock.hazardIndex = 0.8;
          randomBlock.biome = 'TOXIC_SWAMP';
          count++;
          if (count >= 3) break;
        }
      }
      targetEngine.traceLog.push({
        type: 'Combat',
        attackerId: 'SYSTEM',
        targetId: 'environment',
        damage: 0,
        armor: 0,
        timestamp: Date.now(),
        message: 'HAZARD ERUPTION: Volcanic spores erupted in 3 random zones!'
      } as any);
    } else {
      return res.status(400).json({ error: `Unknown scenarioType: ${scenarioType}` });
    }
    
    io.emit('state_resolved', targetEngine.getState());
    saveEngineState(targetEngine, matchId || 'default');
    res.status(200).json({ success: true, scenarioType });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/end-turn', (req, res) => {
  try {
    defaultEngine.turnStateMachine.endTurn();

    // Webcam-based fatigue index penalty
    if ((defaultEngine as any).lastFatigueIndex !== undefined && (defaultEngine as any).lastFatigueIndex > 0.6) {
      defaultEngine.globalEntropy = Number((defaultEngine.globalEntropy + 0.03).toFixed(2));
      console.log(`[OPENVINO FATIGUE PENALTY] High fatigue detected (${(defaultEngine as any).lastFatigueIndex.toFixed(2)} > 0.6). Global entropy increased to ${defaultEngine.globalEntropy}!`);
    }

    io.emit('state_resolved', defaultEngine.getState());
    res.status(200).json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/match/mulligan', (req, res) => {
  try {
    const { playerId, cardIds } = req.body;
    defaultEngine.turnStateMachine.executeMulligan(playerId, cardIds || []);
    io.emit('state_resolved', defaultEngine.getState());
    res.status(200).json({ success: true, state: defaultEngine.getState() });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (req, res) => {
  res.redirect('/goal');
});

app.get('/goal', (req, res) => {
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
            <p class="text-xs text-slate-500 font-mono mt-1">&gt; LIVE SYSTEM TELEMETRY INTEGRITY</p>
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
        <div class="glass-card p-6 rounded-3xl flex flex-col">
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
              document.getElementById('crystal-lvl').innerText = 'LVL ' + crystal.level;
              document.getElementById('crystal-hp-txt').innerText = crystal.health + ' / ' + crystal.maxHealth;
              document.getElementById('crystal-hp-bar').style.width = ((crystal.health / crystal.maxHealth) * 100) + '%';
              document.getElementById('crystal-xp-txt').innerText = crystal.xp + ' / ' + (crystal.level * 100);
              document.getElementById('crystal-xp-bar').style.width = ((crystal.xp / (crystal.level * 100)) * 100) + '%';
              document.getElementById('crystal-luck').innerText = crystal.luck.toFixed(2);
              renderQuests(crystal.quests, 'crystal-quests');
            }

            if (toxic) {
              document.getElementById('toxic-lvl').innerText = 'LVL ' + toxic.level;
              document.getElementById('toxic-hp-txt').innerText = toxic.health + ' / ' + toxic.maxHealth;
              document.getElementById('toxic-hp-bar').style.width = ((toxic.health / toxic.maxHealth) * 100) + '%';
              document.getElementById('toxic-xp-txt').innerText = toxic.xp + ' / ' + (toxic.level * 100);
              document.getElementById('toxic-xp-bar').style.width = ((toxic.xp / (toxic.level * 100)) * 100) + '%';
              document.getElementById('toxic-luck').innerText = toxic.luck.toFixed(2);
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

          // Preložíme algebraické traces do prehľadných stringov (defined as strings that describes)
          container.innerHTML = traceLog.map(t => {
            const time = new Date(t.timestamp).toLocaleTimeString();
            let desc = '';
            let color = 'text-slate-400';

            if (t.type === 'Spawn') {
              desc = \`[ALOKÁCIA] Vlákno <strong class="text-cyan-400 font-bold">\${t.threadId}</strong> bolo nasadené v sektore M\${t.chunkId}_S\${t.blockId}.\`;
              color = 'text-cyan-400/80';
            } else if (t.type === 'Move') {
              desc = \`[POHYB] NPC/Hráč <strong class="text-purple-400 font-bold">\${t.threadId}</strong> prešiel zo súradníc M\${t.from.meta}_S\${t.from.hex} do M\${t.to.meta}_S\${t.to.hex}.\`;
              color = 'text-purple-400/80';
            } else if (t.type === 'Combat') {
              desc = \`[BOJ] Zdroj <strong class="text-red-400 font-bold">\${t.attackerId}</strong> udelil poškodenie <strong class="text-red-500">-\${t.damage} HP</strong> terču <strong class="text-slate-200 font-bold">\${t.targetId}</strong> (Armor: \${t.armor}).\`;
              color = 'text-red-400/80';
            } else if (t.type === 'LevelUp') {
              desc = \`[LEVEL_UP] Vlákno <strong class="text-green-400 font-bold">\${t.threadId}</strong> postúpilo na <strong class="text-green-400 uppercase font-bold">LEVEL \${t.level}</strong>! Všetky štatistiky boli zvýšené a HP vyliečené.\`;
              color = 'text-green-400/80';
            }

            return \`
              <div class="py-1 border-b border-slate-900/60 flex justify-between gap-4">
                <span class="\${color}">\${desc}</span>
                <span class="text-slate-600 font-mono text-[10px]">\${time}</span>
              </div>
            \`;
          }).reverse().join('');
        }

        async function triggerEndTurn() {
          const res = await fetch('/api/end-turn', { method: 'POST' });
          if (res.ok) {
            fetchTelemetry();
          }
        }

        // Poll telemetry every second
        setInterval(fetchTelemetry, 1000);
        fetchTelemetry();
      </script>
    </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.status(200).send('Server is healthy');
});

server.listen(PORT, async () => {
  console.log(`SovereignEngine listening on port ${PORT}`);
  try {
     await ClickHouseTelemetryClient.init();
  } catch (err: any) {
     console.warn('[CLICKHOUSE] Initialization skipped/deferred:', err.message);
  }

  // Launch the backoffice telemetry server on port 3005
  try {
    startBackoffice(defaultEngine);
  } catch (err: any) {
    console.warn('[BACKOFFICE] Failed to start backoffice server:', err.message);
  }
});
