import { GameMap } from './Map';
import { Thread } from './Thread';
import { ActionNode } from './ActionNode';
import { TurnStateMachine } from './TurnStateMachine';
import { DatabaseSyncManager } from './DatabaseSyncManager';
import { SovereignSpawningPlanner } from './SovereignSpawningPlanner';
import { SovereignNeuralMathResolver } from './SovereignNeuralMathResolver';
import { CombinatoricProbabilityEngine, DungeonDirector, DungeonState, NPCScriptDirector, CharacterTraceInstance, PredictiveBalanceDirector, AethericDiceEngine, AlgebraicOpportunityGenerator, QuestTriggerManager, VOID_CARDS_BASE, SovereignSignalMediator } from '@dusan-game/shared';

export class SovereignEngine {
  map: GameMap;
  threads: Thread[];
  traceLog: CharacterTraceInstance[];
  
  state: string;
  playerIds: string[];

  // Aktívny hráč žije v TurnStateMachine; engine ho len zrkadlí,
  // aby všetky handlery videli aktuálny stav aj po zmene ťahu.
  get activePlayerId(): string | null {
    return this.turnStateMachine?.activePlayerId || this.playerIds[0] || null;
  }

  systemEnergy: number;
  globalEntropy: number;
  actionNetwork: ActionNode[];
  turnStateMachine: TurnStateMachine;
  dungeonState: DungeonState;
  spawningPlanner: SovereignSpawningPlanner;

  constructor() {
    this.map = new GameMap();
    this.threads = [];
    this.traceLog = [];
    
    this.state = 'WAITING_FOR_PLAYERS';
    this.playerIds = [];

    this.systemEnergy = 0;
    this.globalEntropy = 0;
    this.actionNetwork = [];
    this.turnStateMachine = new TurnStateMachine(this);
    this.dungeonState = DungeonDirector.generateDungeon();
    this.spawningPlanner = new SovereignSpawningPlanner();
    
    // Asynchrónne načítanie z Go Core (ak je mikroslužba online)
    this.map.initializeWithGoCore();

    // Registrácia modulov do SovereignSignalMediator pre prenos výpočtov a správ (Sovereign Signal Mediator Integration)
    const mediator = SovereignSignalMediator.getInstance();
    
    // PHYSICS_RESOLVER: Poskytuje prepočty prostredia a biómov
    mediator.registerModule('PHYSICS_RESOLVER', (requestType, payload) => {
      if (requestType === 'GET_ENERGY_COST') {
        const { baseCost, chunkId, blockId } = payload;
        let costMultiplier = 1.0;
        if (chunkId !== null && blockId !== null) {
          const chunk = this.map.chunks.find(c => c.id === chunkId);
          const block = chunk?.blocks.find(b => b.id === blockId);
          if (block) {
            costMultiplier = block.energyCostMultiplier;
          }
        }
        return { cost: Math.round(baseCost * 15 * costMultiplier), costMultiplier };
      }
      return null;
    });

    // NEURAL_MATH_RESOLVER: Poskytuje vyhodnotenie matematických a fyzikálnych grid telemetrií
    mediator.registerModule('NEURAL_MATH_RESOLVER', async (requestType, payload) => {
      if (requestType === 'RESOLVE_GAMEPLAY_MATH') {
        const { voltage, current, resistance, entropy, playerHealth, npcHealth } = payload;
        return await SovereignNeuralMathResolver.resolveGameplayMath(
          voltage, current, resistance, entropy, playerHealth, npcHealth
        );
      }
      return null;
    });

    // COMBAT_ENGINE: Poskytuje vyhodnotenie súbojového poškodenia s vplyvom Aetheric Dice a brnenia
    mediator.registerModule('COMBAT_ENGINE', (requestType, payload) => {
      if (requestType === 'RESOLVE_COMBAT') {
        const { node, source, target } = payload;
        const dmg = node.instruction.damage;
        const baseArmor = target.armor + node.calculateTotalArmor();
        
        // Výpočet faktoru poškodenia cez kombinatorickú redukciu
        const comboFactor = CombinatoricProbabilityEngine.calculateComboDamageFactor(baseArmor, node.reactions.length);
        const netDamage = Math.round(dmg * comboFactor);

        // Aetheric Contested Dice Roll logic
        const attackerCategory = AethericDiceEngine.getCategoryByHero(source.id);
        const defenderCategory = AethericDiceEngine.getCategoryByHero(target.id);
        const attackerSides = attackerCategory === 'SWIFT_HARBINGER' ? 6 : 12;
        const defenderSides = defenderCategory === 'SWIFT_HARBINGER' ? 6 : 12;
        const attackerRoll = AethericDiceEngine.rollDie(attackerSides);
        const defenderRoll = AethericDiceEngine.rollDie(defenderSides);

        const condition = (node.instruction.id.includes('snake') || node.instruction.id.includes('stealth')) ? 'LESS' : 'MORE';
        const contestedResult = AethericDiceEngine.calculateContestedDamage(attackerRoll, defenderRoll, netDamage, condition);

        return {
          finalDamage: contestedResult.finalDamage,
          baseArmor,
          log: contestedResult.log
        };
      }
      return null;
    });

    // Database telemetry logger subscriber
    mediator.subscribe('COMBAT_RESOLVED', (data) => {
      try {
        const dbManager = new DatabaseSyncManager();
        dbManager.saveMemoryRegister('0x00E0', `COMBAT_LOG_${data.timestamp}`, `Attacker: ${data.attackerId}, Target: ${data.targetId}, Damage: ${data.damage}`);
      } catch (e) {
        console.warn('[MEDIATOR DB SYNC FAILED]', e);
      }
    });
  }

  addPlayer(playerId: string): boolean {
    if (this.playerIds.length < 2) {
      this.playerIds.push(playerId);
      if (this.playerIds.length === 2) {
        this.startGame();
      }
      return true;
    }
    return false;
  }

  startGame(): void {
    this.state = 'PLAYER_TURN';
    this.turnStateMachine.startTurn(this.playerIds[0]);
  }

  initializeStartingQuests(thread: Thread): void {
    // Quest 1: Poraziť nepriateľov (DEFEAT_NPC)
    thread.addQuest({
      id: 'q_defeat_npcs',
      title: 'Lov na procesory',
      description: 'Poraz 2 NPC Slayer jednotky v aréne.',
      objectiveType: 'DEFEAT_NPC',
      targetValue: 2,
      progress: 0,
      completed: false,
      xpReward: 120,
      materialReward: { type: 'CrystalShard', amount: 5 }
    });

    // Quest 2: Preskúmať bióm (REACH_BIOME)
    thread.addQuest({
      id: 'q_reach_swamp',
      title: 'Prieskum Toxických Hlbín',
      description: 'Vstúp na políčko Toxic Swamp na preskúmanie anomálie.',
      objectiveType: 'REACH_BIOME',
      targetValue: 1,
      targetName: 'TOXIC_SWAMP',
      progress: 0,
      completed: false,
      xpReward: 80,
      materialReward: { type: 'Spores', amount: 3 }
    });
  }

  spawnThread(thread: Thread, metaId: number, hexId: number): boolean {
    if (this.map.placeThread(thread.id, metaId, hexId)) {
      thread.position = { meta: metaId, hex: hexId };
      
      // Naviazanie spatnej vazby pre traceLog a questy
      thread.onLevelUp = (level) => {
        this.traceLog.push({
          type: 'LevelUp',
          threadId: thread.id,
          level,
          timestamp: Date.now()
        });
        QuestTriggerManager.updateQuestProgress(thread, 'REACH_LEVEL', level, undefined, (quest) => {
          QuestTriggerManager.triggerInteractiveContent(this, thread, quest);
        });
      };

      if (thread.type === 'PLAYER' && thread.quests.length === 0) {
        this.initializeStartingQuests(thread);
      }

      this.threads.push(thread);

      // Záznam o Spawne
      this.traceLog.push({
        type: 'Spawn',
        threadId: thread.id,
        chunkId: metaId,
        blockId: hexId,
        timestamp: Date.now()
      });

      return true;
    }
    return false;
  }

  turnCount: number = 1;

  pushInstructionToNetwork(node: ActionNode): void {
    this.actionNetwork.push(node);
  }

  resolveActionNetwork(): void {
    const mediator = SovereignSignalMediator.getInstance();
    const damageDiffMap = new Map<string, number>();
    let accumulatedEnergy = 0;

    for (const node of this.actionNetwork) {
      if (node.instruction.type !== 'ACTION') continue;

      const source = this.threads.find(t => t.id === node.sourceId);
      const target = this.threads.find(t => t.id === node.targetId);
      if (!source || !target) continue;

      // 1. Overenie statusových obmedzení (RPG status guards)
      if (source.isDisarmed && node.instruction.damage > 0 && node.instruction.armor === 0) {
        console.log(`[BLOK] Akcia odmietnutá: Hráč ${source.id} je odzbrojený.`);
        continue;
      }
      if (source.isSilenced && node.instruction.damage > 0 && node.instruction.armor > 0) {
        console.log(`[BLOK] Akcia odmietnutá: Hráč ${source.id} je umlčaný.`);
        continue;
      }
      if (source.isRooted && node.instruction.armor > 0 && node.instruction.damage === 0) {
        console.log(`[BLOK] Akcia odmietnutá: Hráč ${source.id} je zakorenený.`);
        continue;
      }

      // 2. Kontrola dosahu (Reach & Metaposition distance guard)
      if (source.position.meta !== null && target.position.meta !== null) {
        const coords = [
          { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
          { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
          { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }
        ];
        const c1 = coords[source.position.meta] || { x: 0, y: 0 };
        const c2 = coords[target.position.meta] || { x: 0, y: 0 };
        const metaDist = Math.abs(c1.x - c2.x) + Math.abs(c1.y - c2.y);
        
        const isAttackNode = node.instruction.damage > 0;
        const reach = isAttackNode ? source.attackReach : source.spellReach;

        if (reach === 0) {
          if (metaDist > 0) {
            console.log(`[BLOK] Akcia odmietnutá: Dosah je 0, cieľ musí byť na rovnakej metapozícii.`);
            continue;
          }
        } else {
          if (metaDist > reach) {
            console.log(`[BLOK] Akcia odmietnutá: Cieľ ${target.id} je mimo dosahu metapozícií (vzdialenosť ${metaDist} > ${reach}).`);
            continue;
          }
        }
      }

      // 3. Súbojový skript: Poškodenie vs Brnenie a Combo-Rezistencia vyriešená cez Mediátor
      const combatResult = mediator.request('COMBAT_ENGINE', 'RESOLVE_COMBAT', { node, source, target });

      const finalDamage = combatResult.finalDamage;
      const baseArmor = combatResult.baseArmor;
      const combatLog = combatResult.log;

      if (finalDamage > 0) { 
        // Prvé kolo: Bezpečný rozjazd (Hrdinovia neberú poškodenie)
        const isTargetHero = target.type === 'PLAYER';
        if (this.turnCount === 1 && isTargetHero) {
          console.log(`[BEZPEČNOSŤ] Kolo 1: Hrdina ${target.id} je chránený pred poškodením.`);
        } else {
          const currentDamage = damageDiffMap.get(target.id) || 0;
          damageDiffMap.set(target.id, currentDamage + finalDamage);

          // Logovanie algebraického combat eventu
          this.traceLog.push({
            type: 'Combat',
            attackerId: source.id,
            targetId: target.id,
            damage: finalDamage,
            armor: baseArmor,
            timestamp: Date.now(),
            message: combatLog
          });

          // Aplikácia negatívnych stavov
          if (node.instruction.effects.chronoLock) target.isRooted = true;
          if (node.instruction.effects.thermalThrottling) target.isSlowed = true;
          if (node.instruction.effects.syntaxMute) target.isSilenced = true;
          if (node.instruction.effects.threadIsolation) target.isDisarmed = true;

          // Publikovanie udalosti do systému pre SQLite telemetrický zápis
          mediator.publish('COMBAT_RESOLVED', {
            attackerId: source.id,
            targetId: target.id,
            damage: finalDamage,
            armor: baseArmor,
            timestamp: Date.now()
          });
        }
      }
      
      // ML Synthesizer Fyzika vyriešená cez PHYSICS_RESOLVER v Mediátore
      let energyCostInfo = { cost: Math.round(node.instruction.energyCost * 15), costMultiplier: 1.0 };
      try {
        energyCostInfo = mediator.request('PHYSICS_RESOLVER', 'GET_ENERGY_COST', {
          baseCost: node.instruction.energyCost,
          chunkId: target.position.meta,
          blockId: target.position.hex
        });
      } catch (e) {
        console.warn('[MEDIATOR PHYSICS RESOLVE FAILED]', e);
      }

      const costMultiplier = energyCostInfo.costMultiplier;
      const isVoidCard = VOID_CARDS_BASE.some(c => c.id === node.instruction.id);
      if (isVoidCard) {
        const entropyDelta = node.instruction.energyCost * 0.05 * costMultiplier;
        this.globalEntropy = Math.min(1.0, this.globalEntropy + entropyDelta);
        console.log(`[VOID_ENERGY] Void card ${node.instruction.id} played: added ${entropyDelta.toFixed(2)} to globalEntropy (current: ${this.globalEntropy.toFixed(2)}).`);
      } else {
        accumulatedEnergy += energyCostInfo.cost;
      }

      // Aplikovanie liečenia negatívnych stavov pri úspešnom zahraní akcie (Action auto-curing)
      if (node.instruction.damage > 0 && node.instruction.armor === 0) {
        if (source.isRooted || source.isDisarmed) {
          console.log(`[CURE] Útok úspešne vyliečil stav rooted/disarmed pre hrdinu ${source.id}.`);
          source.isRooted = false;
          source.isDisarmed = false;
        }
      } else if (node.instruction.damage > 0 && node.instruction.armor > 0) {
        if (source.isSilenced) {
          console.log(`[CURE] Spell úspešne vyliečil stav silenced pre hrdinu ${source.id}.`);
          source.isSilenced = false;
        }
      } else if (node.instruction.armor > 0 && node.instruction.damage === 0) {
        if (source.isSlowed) {
          console.log(`[CURE] Pohyb úspešne vyliečil stav slowed pre hrdinu ${source.id}.`);
          source.isSlowed = false;
        }
      }
    }

    // Aplikovanie odložených poškodení (Simultaneous Combat Death)
    damageDiffMap.forEach((damage, targetId) => {
      const thread = this.threads.find(t => t.id === targetId);
      if (thread) {
        thread.applySemanticErosion(damage);
        console.log(`[DAMAGE] Thread ${thread.id} utrpel -${damage} HP poškodenia.`);
      }
    });

    this.systemEnergy += accumulatedEnergy;
    this.actionNetwork = [];

    // Vyhodnotenie víťaza
    const deadPlayers = this.threads.filter(t => t.type === 'PLAYER' && t.isDeallocated());
    if (deadPlayers.length === 2) {
      this.state = 'GAME_OVER';
      console.log('[SIMULTANEOUS DEATH] Zápas končí REMÍZOU (obaja hrdinovia klesli na 0 HP v rovnakom cykle).');
    } else if (deadPlayers.length === 1) {
      this.state = 'GAME_OVER';
      const winner = this.threads.find(t => t.type === 'PLAYER' && !t.isDeallocated());
      console.log(`[GAME_OVER] Hrdina ${winner?.id} zvíťazil!`);
    }

    if (this.systemEnergy > 100) {
      this.triggerEnergyOverloadPurge();
    }

    // DDA: Vyhodnotenie predikčného vyvažovania na konci každého cyklu
    const winProbabilities = PredictiveBalanceDirector.predictWinProbability(this.threads);
    for (const thread of this.threads) {
      if (thread.type === 'PLAYER') {
        const buffs = PredictiveBalanceDirector.calculateBalancingBuffs(thread.id, winProbabilities);
        
        // Zvýšenie lucku pre zaostávajúceho hráča
        thread.luck = 0.5 + buffs.luckBonus; // base luck (0.5) + záchranný bonus
        
        console.log(`[DDA] Balans pre ${thread.id}: WinChance=${((winProbabilities.get(thread.id) ?? 0.5) * 100).toFixed(1)}%, LuckBonus=+${buffs.luckBonus.toFixed(2)}, HazardMult=${buffs.hazardDamageMultiplier.toFixed(2)}`);
      }
    }

    // Sledovanie Questov pre dosiahnutie biomu na konci kola
    for (const thread of this.threads) {
      if (thread.type === 'PLAYER' && thread.position && thread.position.meta !== null && thread.position.hex !== null) {
        const chunk = this.map.chunks.find(c => c.id === thread.position.meta);
        const block = chunk?.blocks.find(b => b.id === thread.position.hex);
        if (block) {
          QuestTriggerManager.updateQuestProgress(thread, 'REACH_BIOME', 1, block.biome, (quest) => {
            QuestTriggerManager.triggerInteractiveContent(this, thread, quest);
          });
        }
      }
    }

    // ML Synthesizer: Vyhodnotenie nebezpečenstva terénu (Hazard Index)
    if (this.turnCount > 1) {
      for (const thread of this.threads) {
        if (thread.position && thread.position.meta !== null && thread.position.hex !== null) {
          const chunk = this.map.chunks.find(c => c.id === thread.position.meta);
          const block = chunk?.blocks.find(b => b.id === thread.position.hex);
          if (block && block.hazardIndex > 0.5) {
            const buffs = thread.type === 'PLAYER'
              ? PredictiveBalanceDirector.calculateBalancingBuffs(thread.id, winProbabilities)
              : { hazardDamageMultiplier: 1.0 };

            const baseDamage = Math.round(block.hazardIndex * 6);
            const hazardDamage = Math.round(baseDamage * buffs.hazardDamageMultiplier);

            thread.applySemanticErosion(hazardDamage);
            console.log(`[HAZARD] Vlákno ${thread.id} utrpelo -${hazardDamage} HP poškodenia od nebezpečného terénu (${block.biome}).`);
          }
        }
      }
    }

    // Tikovanie a posun dungeon cyklov
    const dungeonTick = DungeonDirector.tickDungeon(this.dungeonState, this.systemEnergy);
    this.dungeonState = dungeonTick.state;
    if (dungeonTick.spawnLogs.length > 0) {
      dungeonTick.spawnLogs.forEach(log => console.log(log));
    }

    // Ticking spawn checks every 4 turns: spawn new monster if active NPCs < 3
    if (this.turnCount % 4 === 0) {
      const activeNPCs = this.threads.filter(t => t.type === 'NPC' && !t.isDeallocated());
      if (activeNPCs.length < 3) {
        // Find a vacant walkable hex (excluding the safe Town at meta 0, hex 0)
        const vacantBlocks = [];
        for (const chunk of this.map.chunks) {
          for (const block of chunk.blocks) {
            const occupied = this.threads.some(t => t.position && t.position.meta === chunk.id && t.position.hex === block.id);
            const isTown = chunk.id === 0 && block.id === 0;
            if (block.walkable && !occupied && !isTown) {
              vacantBlocks.push({ chunkId: chunk.id, blockId: block.id });
            }
          }
        }
        
        if (vacantBlocks.length > 0) {
          const randIdx = Math.floor(Math.random() * vacantBlocks.length);
          const spawnPt = vacantBlocks[randIdx];
          const newNpcId = `thread_npc_glitch_spawn_${Date.now()}`;
          this.spawnNPC(newNpcId, `Syntax Monster Spawned`, spawnPt.chunkId, spawnPt.blockId, 4);
          
          this.traceLog.push({
            type: 'Spawn',
            threadId: newNpcId,
            chunkId: spawnPt.chunkId,
            blockId: spawnPt.blockId,
            timestamp: Date.now()
          });
          console.log(`[NPC_SPAWNER] Spawned new Syntax Monster ${newNpcId} at Chunk ${spawnPt.chunkId} Hex ${spawnPt.blockId}`);
        }
      }
    }

    // Spawnovanie príležitostí každé 3 kolá (Algebraic Topology Generator)
    if (this.turnCount % 3 === 0) {
      const playerA = this.threads.find(t => t.id === 'thread_king_ai');
      const playerB = this.threads.find(t => t.id === 'thread_hacker_root');
      if (playerA && playerB && playerA.position && playerB.position) {
        const spawnPos = AlgebraicOpportunityGenerator.calculateSpawnHex(
          { meta: playerA.position.meta!, hex: playerA.position.hex! },
          { meta: playerB.position.meta!, hex: playerB.position.hex! }
        );

        const targetChunk = this.map.chunks.find(c => c.id === spawnPos.meta);
        const targetBlock = targetChunk?.blocks.find(b => b.id === spawnPos.hex);
        if (targetBlock && !targetBlock.isTown && !targetBlock.hasOpportunity) {
          const type = AlgebraicOpportunityGenerator.getOpportunityTypeByEntropy(this.globalEntropy);
          targetBlock.hasOpportunity = type;
          console.log(`[OPPORTUNITY_SPAWN] Spawned ${type} at Chunk ${spawnPos.meta} Hex ${spawnPos.hex} via Algebraic Topology Generator.`);
          
          this.traceLog.push({
            type: 'Spawn',
            threadId: `opp_${type.toLowerCase()}`,
            chunkId: spawnPos.meta,
            blockId: spawnPos.hex,
            timestamp: Date.now()
          });
        }
      }
    }

    // Vyhodnotenie NPC AI a ich pohybu/útoku po poliach
    this.tickNPCAI();

    // Vyhodnotenie odloženého plánu spawnovania
    this.spawningPlanner.tick(this);

    this.turnCount++;
  }

  triggerEnergyOverloadPurge(): void {
    // Hrdinovia (PLAYER) sa nikdy neuvoľňujú — zápas končí výhradne cez GAME_OVER
    // pri 0 HP. Purge odstraňuje len pomocné jednotky a NPC.
    const purgeable = this.threads.filter(t => t.type !== 'PLAYER');
    this.systemEnergy = Math.max(0, this.systemEnergy - 25);

    if (purgeable.length === 0) {
      console.log('[ENERGY_OVERLOAD_PURGE] Žiadne uvoľniteľné vlákno (len hrdinovia). Energia odvetraná.');
      return;
    }

    purgeable.sort((a, b) => a.health - b.health);
    const weakestThread = purgeable[0];

    this.deallocateThread(weakestThread.id);
    console.log(`[ENERGY_OVERLOAD_PURGE] Uvoľnené najslabšie vlákno: ${weakestThread.id}.`);
  }

  deallocateThread(threadId: string): void {
    const threadToDealloc = this.threads.find(t => t.id === threadId);
    if (threadToDealloc && threadToDealloc.type === 'NPC') {
      // Porazenie NPC udelí XP všetkým aktívnym hráčom a posunie questy
      this.threads.forEach(t => {
        if (t.type === 'PLAYER') {
          t.gainXP(50); // 50 XP za porazenie
          QuestTriggerManager.updateQuestProgress(t, 'DEFEAT_NPC', 1, threadToDealloc.id, (quest) => {
            QuestTriggerManager.triggerInteractiveContent(this, t, quest);
          });

          // Grant +2 materials as drops
          const matType = t.id === 'thread_king_ai' ? 'CrystalShard' : 'Spores';
          t.materials[matType] = (t.materials[matType] || 0) + 2;
          console.log(`[NPC_LOOT] Player ${t.id} received +2 ${matType} as drop from defeated NPC ${threadId}.`);
        }
      });

      // Záznam o porážke v traceLogu
      this.traceLog.push({
        type: 'Combat',
        attackerId: 'SYSTEM',
        targetId: threadId,
        damage: 99,
        armor: 0,
        timestamp: Date.now()
      });
    }
    this.map.removeThread(threadId);
    this.threads = this.threads.filter(t => t.id !== threadId);
  }

  spawnNPC(id: string, name: string, chunkId: number, blockId: number, baseDamage: number = 5): Thread {
    const npc = new Thread(id, 'NPC');
    npc.name = name;
    npc.baseDamage = baseDamage;
    this.spawnThread(npc, chunkId, blockId);
    return npc;
  }

  triggerTrapCheck(thread: Thread, chunkId: number, blockId: number): void {
    const chunk = this.map.chunks.find(c => c.id === chunkId);
    const block = chunk?.blocks.find(b => b.id === blockId);
    if (block && block.hasTrap) {
      const trapType = block.hasTrap;
      const ownerId = block.trapOwnerId;
      block.hasTrap = null;
      block.trapOwnerId = null;

      console.log(`[TRAP_TRIGGER] Thread ${thread.id} stepped on a trap ${trapType} owned by ${ownerId}!`);

      if (trapType === 'ROOT_TRAP') {
        const dmg = 3;
        const netDmg = Math.max(0, dmg - thread.armor);
        thread.applySemanticErosion(netDmg);
        thread.isRooted = true; // root player
        this.traceLog.push({
          type: 'Combat',
          attackerId: ownerId || 'SYSTEM',
          targetId: thread.id,
          damage: netDmg,
          armor: thread.armor,
          timestamp: Date.now()
        });
      } else if (trapType === 'EMP_MINE') {
        const dmg = 5;
        const netDmg = Math.max(0, dmg - thread.armor);
        thread.applySemanticErosion(netDmg);
        thread.isSlowed = true; // slow player
        this.traceLog.push({
          type: 'Combat',
          attackerId: ownerId || 'SYSTEM',
          targetId: thread.id,
          damage: netDmg,
          armor: thread.armor,
          timestamp: Date.now()
        });
      }
    }
  }

  tickNPCAI(): void {
    const npcs = this.threads.filter(t => t.type === 'NPC' && !t.isDeallocated());
    
    // Zostavíme zoznam všetkých blokov pre Pathfinder
    const blocksList = this.map.chunks.flatMap(c => 
      c.blocks.map(b => ({
        chunkId: c.id,
        blockId: b.id,
        walkable: b.walkable && b.threadId === null, // priechodný ak na ňom nikto nestojí
        energyCostMultiplier: b.energyCostMultiplier,
        lootProbability: b.lootProbability,
        hazardIndex: b.hazardIndex
      }))
    );

    for (const npc of npcs) {
      const npcComp = {
        id: npc.id,
        name: npc.name,
        position: (npc.position.meta !== null && npc.position.hex !== null)
          ? { meta: npc.position.meta, hex: npc.position.hex }
          : null
      };
      
      const threadsComp = this.threads.map(t => ({
        id: t.id,
        type: t.type,
        position: (t.position.meta !== null && t.position.hex !== null)
          ? { meta: t.position.meta, hex: t.position.hex }
          : null
      }));

      const decision = NPCScriptDirector.evaluateAI(npcComp, threadsComp, blocksList);
      console.log(`[NPC_AI] ${decision.log}`);

      if (decision.action === 'MOVE' && decision.targetChunkId !== undefined && decision.targetBlockId !== undefined) {
        const from = npc.position.meta !== null && npc.position.hex !== null
          ? { meta: npc.position.meta, hex: npc.position.hex }
          : { meta: 0, hex: 0 };

        this.map.placeThread(npc.id, decision.targetChunkId, decision.targetBlockId);
        npc.position = { meta: decision.targetChunkId, hex: decision.targetBlockId };

        // Logovanie algebraického presunu postavy
        this.traceLog.push({
          type: 'Move',
          threadId: npc.id,
          from,
          to: { meta: decision.targetChunkId, hex: decision.targetBlockId },
          cost: 1.0,
          timestamp: Date.now()
        });

        // Trigger trap check for NPC!
        this.triggerTrapCheck(npc, decision.targetChunkId, decision.targetBlockId);
        this.triggerOpportunityCheck(npc, decision.targetChunkId, decision.targetBlockId);
      } else if (decision.action === 'ATTACK' && decision.targetThreadId) {
        const target = this.threads.find(t => t.id === decision.targetThreadId);
        if (target) {
          const netDamage = Math.max(0, npc.baseDamage - target.armor);
          target.applySemanticErosion(netDamage);
          console.log(`[NPC_ATTACK] NPC ${npc.id} zaútočil na ${target.id} za -${netDamage} HP.`);
          
          // Logovanie algebraického combat eventu
          this.traceLog.push({
            type: 'Combat',
            attackerId: npc.id,
            targetId: target.id,
            damage: netDamage,
            armor: target.armor,
            timestamp: Date.now()
          });

          if (target.isDeallocated()) {
            if (target.type === 'PLAYER') {
              // Hrdina zostáva v zápase s 0 HP — koniec hry rieši GAME_OVER,
              // nie tiché odstránenie vlákna (klient by stratil hráča zo stavu).
              this.state = 'GAME_OVER';
              const winner = this.threads.find(t => t.type === 'PLAYER' && !t.isDeallocated());
              console.log(`[GAME_OVER] Hrdina ${target.id} padol pod náporom NPC. Víťaz: ${winner ? winner.id : 'REMÍZA'}.`);
            } else {
              this.deallocateThread(target.id);
            }
          }
        }
      }
    }
  }

  triggerOpportunityCheck(thread: Thread, chunkId: number, blockId: number): void {
    const chunk = this.map.chunks.find(c => c.id === chunkId);
    const block = chunk?.blocks.find(b => b.id === blockId);
    if (block && block.hasOpportunity) {
      const oppType = block.hasOpportunity;
      block.hasOpportunity = null; // consume

      let val = 0;
      let desc = '';
      let address = '';

      if (oppType === 'SURGE_NODE') {
        val = 3;
        this.systemEnergy = Math.min(100, this.systemEnergy + val);
        desc = `Surge Node claimed. +${val} system energy.`;
        address = '0x00A0';
        console.log(`[OPPORTUNITY_CLAIMED] Player ${thread.id} claimed SURGE_NODE. +${val} system energy.`);
      } else if (oppType === 'VOID_RIFT') {
        val = 15;
        this.globalEntropy = Math.min(1.0, this.globalEntropy + 0.15);
        desc = `Void Rift claimed. +15% global entropy.`;
        address = '0x00B0';
        console.log(`[OPPORTUNITY_CLAIMED] Player ${thread.id} claimed VOID_RIFT. +15% global entropy.`);
      } else if (oppType === 'REPAIR_KIT') {
        val = 4;
        thread.health = Math.min(thread.maxHealth || 15, thread.health + val);
        desc = `Repair Kit claimed. Healed +${val} HP.`;
        address = '0x00C0';
        console.log(`[OPPORTUNITY_CLAIMED] Player ${thread.id} claimed REPAIR_KIT. Healed +${val} HP.`);
      }

      // Convert to hex dump for system RAM/swap logs
      const hexDump = AlgebraicOpportunityGenerator.convertToHexDump(oppType, chunkId, blockId, val);
      
      // Save hex log to database representing memory registers/swap
      const dbManager = new DatabaseSyncManager();
      dbManager.saveMemoryRegister(address, hexDump, `${thread.id}: ${desc}`);
      
      this.traceLog.push({
        type: 'ChestClaim',
        threadId: thread.id,
        message: `${oppType} claimed! ${desc} Hex log saved to register ${address} (${hexDump}).`,
        timestamp: Date.now()
      } as any);
    }
  }

  getStaticMapState(): any {
    return this.map.chunks;
  }

  getState(): any {
    return {
      state: this.state,
      activePlayerId: this.activePlayerId,
      systemEnergy: this.systemEnergy,
      globalEntropy: this.globalEntropy,
      turnsElapsed: this.turnStateMachine.turnNumber,
      threads: this.threads.map(t => t.toNetworkState()),
      actionNetwork: this.actionNetwork,
      turnStateMachine: this.turnStateMachine.getState(),
      dungeonState: this.dungeonState,
      map: this.getStaticMapState()
    };
  }
}

