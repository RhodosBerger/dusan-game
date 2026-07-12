import { ActionNode } from './ActionNode';
import { SovereignEngine } from './SovereignEngine';
import { CombinatoricProbabilityEngine, getPhysicsSpecs } from '@dusan-game/shared';

export type TurnPhase = 'PREPARATION' | 'ACTION' | 'INTERRUPT_WINDOW' | 'RESOLVE_NETWORK' | 'END_TURN';

export class TurnStateMachine {
  activePlayerId: string;
  baseActivePlayerId: string;
  currentPhase: TurnPhase;
  timerLeft: number; // Zostávajúci čas v sekundách
  currentAction: ActionNode | null;
  turnNumber: number;

  lastPlayedSpecs: Record<string, { voltage: number; resistance: number }> = {};

  constructor(private engine: SovereignEngine) {
    this.activePlayerId = '';
    this.baseActivePlayerId = '';
    this.currentPhase = 'PREPARATION';
    this.timerLeft = 0;
    this.currentAction = null;
    this.turnNumber = 1;
    this.lastPlayedSpecs = {};
  }

  /**
   * Spustí nové kolo pre daného hráča
   */
  startTurn(playerId: string): void {
    this.activePlayerId = playerId;
    this.baseActivePlayerId = playerId;
    this.currentPhase = 'PREPARATION';
    this.timerLeft = 0;
    this.currentAction = null;

    // 1. Fáza PREPARATION: Príprava pomocníkov (Tower) a reset clock cycles
    const playerThread = this.engine.threads.find(t => t.id === playerId);
    if (playerThread) {
      playerThread.hasFreeClockCycle = true;
      // Reset spomalenia / oslabenia na začiatku kola
      playerThread.isSlowed = false;
      playerThread.freeMovementUsed = false;
    }

    console.log(`[STATE_MACHINE] Spustené kolo pre hráča ${playerId}. Fáza PREPARATION dokončená.`);
    this.currentPhase = 'ACTION';
  }

  /**
   * Zaregistruje hlavnú akciu hráča na ťahu
   */
  registerAction(node: ActionNode): void {
    if (this.currentPhase !== 'ACTION') {
      console.log(`[STATE_MACHINE] Varovanie: Akciu nie je možné vykonať mimo fázy ACTION (aktuálna: ${this.currentPhase}).`);
      return;
    }

    const isAttackOrMagic = node.instruction.damage > 0;

    // Evaluate consecutive turn combos before registering the action details
    this.evaluateConsecutiveCombo(node.sourceId, node.instruction.id);

    if (isAttackOrMagic) {
      // Útoky spúšťajú reakčné okno prerušenia (Interrupt Window)
      this.currentAction = node;
      this.currentPhase = 'INTERRUPT_WINDOW';
      this.timerLeft = 3; // 3-sekundové okno na reakciu
      
      // Prepnutie ťahu na obrancu na reakciu. Reagovať môže len HRÁČ — pri útoku
      // na jednotku/NPC dostáva reakčné okno jej majiteľ (jednotka nemá ruku kariet
      // a klient by sa pokúšal pracovať s ID jednotky ako s aktívnym hráčom).
      let opponentId = (node.targetId && node.targetId !== 'environment') ? node.targetId : '';
      const targetThread = opponentId ? this.engine.threads.find(t => t.id === opponentId) : undefined;
      if (!targetThread || targetThread.type !== 'PLAYER') {
        opponentId = targetThread?.ownerId && this.engine.threads.some(t => t.id === targetThread.ownerId && t.type === 'PLAYER')
          ? targetThread.ownerId!
          : (node.sourceId === 'thread_king_ai' ? 'thread_hacker_root' : 'thread_king_ai');
      }
      this.activePlayerId = opponentId;
      
      console.log(`[STATE_MACHINE] Útok zaregistrovaný. Prechod do fázy INTERRUPT_WINDOW. Aktívny hráč prepnutý na ${opponentId} pre reakciu. Čas: ${this.timerLeft}s.`);
    } else {
      // Pohyby a pomocné akcie sa vyhodnotia okamžite bez prerušenia
      this.engine.pushInstructionToNetwork(node);
      this.engine.resolveActionNetwork();
      console.log(`[STATE_MACHINE] Nekontaktná akcia ${node.instruction.id} vyhodnotená okamžite.`);
    }
  }

  evaluateConsecutiveCombo(playerId: string, cardId: string): void {
    try {
      const currentSpecs = getPhysicsSpecs(cardId);
      const lastSpecs = this.lastPlayedSpecs[playerId];
      
      if (lastSpecs) {
        const v1 = lastSpecs.voltage;
        const r1 = lastSpecs.resistance;
        const v2 = currentSpecs.voltage;
        const r2 = currentSpecs.resistance;

        // Voltage Surge: V1 + V2 >= 8.0 -> Trigger +2 damage
        if (v1 + v2 >= 8.0) {
          console.log(`[CONSECUTIVE COMBO] Voltage Surge activated! (V1+V2 = ${(v1 + v2).toFixed(1)} >= 8.0).`);
          if (this.currentAction && this.currentAction.sourceId === playerId) {
            this.currentAction.instruction.damage += 2;
          }
          this.engine.traceLog.push({
            type: 'Combo',
            threadId: playerId,
            message: 'Consecutive Voltage Surge! +2 DMG & screen flash',
            timestamp: Date.now()
          } as any);
        }

        // Short Circuit: R1 * R2 <= 1.0 -> Discard 1 card from opponent hand
        if (r1 * r2 <= 1.0) {
          console.log(`[CONSECUTIVE COMBO] Short Circuit activated! (R1*R2 = ${(r1 * r2).toFixed(2)} <= 1.0).`);
          const opponentId = playerId === 'thread_king_ai' ? 'thread_hacker_root' : 'thread_king_ai';
          const opponentThread = this.engine.threads.find(t => t.id === opponentId);
          if (opponentThread && opponentThread.currentBuffer.length > 0) {
            const removedCard = opponentThread.currentBuffer.pop();
            this.engine.traceLog.push({
              type: 'Combo',
              threadId: opponentId,
              message: `Consecutive Short Circuit! Discarded ${removedCard?.id || 'card'}`,
              timestamp: Date.now()
            } as any);
          }
        }
      }

      // Record this action
      this.lastPlayedSpecs[playerId] = {
        voltage: currentSpecs.voltage,
        resistance: currentSpecs.resistance
      };
    } catch (e) {
      console.warn('[COMBO_WARN] Failed evaluating consecutive combo:', e);
    }
  }

  /**
   * Zaregistruje reakciu druhého hráča
   */
  registerReaction(node: ActionNode): void {
    if (this.currentPhase !== 'INTERRUPT_WINDOW' || !this.currentAction) {
      console.log(`[STATE_MACHINE] Varovanie: Reakciu nie je možné vykonať (aktuálna fáza: ${this.currentPhase}).`);
      return;
    }

    // Pridanie reakcie do reťazca (stromová štruktúra reakcií)
    this.currentAction.reactions.push(node);
    
    // Reset reakčného časovača na 3 sekundy pre prípadnú proti-reakciu
    this.timerLeft = 3;
    console.log(`[STATE_MACHINE] Reakcia ${node.instruction.id} pridaná do reťazca. Časovač resetovaný na ${this.timerLeft}s.`);
  }

  /**
   * Tiknutie časovača (volá server každú sekundu)
   */
  tickTimer(): void {
    if (this.currentPhase !== 'INTERRUPT_WINDOW') return;

    this.timerLeft--;
    if (this.timerLeft <= 0) {
      console.log(`[STATE_MACHINE] Čas na reakciu vypršal. Automatické spustenie vyhodnotenia.`);
      this.resolveChain();
    }
  }

  /**
   * Pasovanie (predčasné ukončenie časovača)
   */
  pass(playerId: string): void {
    if (this.currentPhase !== 'INTERRUPT_WINDOW') return;

    // Pasovať môže len brániaci sa hráč — počas reakčného okna je aktívny práve obranca
    if (playerId === this.activePlayerId) {
      console.log(`[STATE_MACHINE] Hráč ${playerId} pasoval. Okamžité vyhodnotenie reťazca.`);
      this.resolveChain();
    }
  }

  /**
   * Vyhodnotí celý reakčný reťazec
   */
  private resolveChain(): void {
    if (!this.currentAction) return;

    this.currentPhase = 'RESOLVE_NETWORK';

    // ── Combo Chain Detection ───────────────────────────────────────────────
    try {
      const mainCardId = this.currentAction.instruction.id;
      const mainSpecs = getPhysicsSpecs(mainCardId);

      this.currentAction.reactions.forEach(reaction => {
        const rxCardId = reaction.instruction.id;
        const rxSpecs = getPhysicsSpecs(rxCardId);

        const v1 = mainSpecs.voltage;
        const r1 = mainSpecs.resistance;
        const v2 = rxSpecs.voltage;
        const r2 = rxSpecs.resistance;

        // Voltage Surge: V1 + V2 >= 8.0 -> +2 DMG
        if (v1 + v2 >= 8.0) {
          console.log(`[COMBO] Voltage Surge activated! (V1+V2 = ${(v1 + v2).toFixed(1)} >= 8.0). +2 DMG.`);
          this.currentAction!.instruction.damage += 2;
          this.engine.traceLog.push({
            type: 'Combo',
            threadId: this.currentAction!.sourceId,
            message: 'Voltage Surge! +2 DMG & screen flash',
            timestamp: Date.now()
          } as any);
        }

        // Short Circuit: R1 * R2 <= 1.0 -> Discard 1 card from opponent hand
        if (r1 * r2 <= 1.0) {
          console.log(`[COMBO] Short Circuit activated! (R1*R2 = ${(r1 * r2).toFixed(2)} <= 1.0). Discard 1 opponent card.`);
          const opponentId = this.currentAction!.sourceId === 'thread_king_ai' ? 'thread_hacker_root' : 'thread_king_ai';
          const opponentThread = this.engine.threads.find(t => t.id === opponentId);
          if (opponentThread && opponentThread.currentBuffer.length > 0) {
            const removedCard = opponentThread.currentBuffer.pop();
            this.engine.traceLog.push({
              type: 'Combo',
              threadId: opponentId,
              message: `Short Circuit! Discarded ${removedCard?.id || 'card'}`,
              timestamp: Date.now()
            } as any);
          }
        }
      });
    } catch (e) {
      console.error('[COMBO ERROR] Failed to calculate combos:', e);
    }

    // Poslanie celej zloženej štruktúry do enginu
    this.engine.pushInstructionToNetwork(this.currentAction);
    this.engine.resolveActionNetwork();

    // Reset stavu po vyhodnotení
    this.currentAction = null;
    this.timerLeft = 0;
    this.currentPhase = 'ACTION';

    // Vrátenie aktívneho hráča na začatý ťah
    this.activePlayerId = this.baseActivePlayerId;
    console.log(`[STATE_MACHINE] Súboj vyhodnotený. Aktívny hráč vrátený na ${this.activePlayerId}.`);
  }

  /**
   * Ukončí ťah aktívneho hráča
   */
  endTurn(): void {
    this.currentPhase = 'END_TURN';
    
    // 1. Pravdepodobnostný drop suroviny pre aktívneho hráča na konci ťahu
    const activeThread = this.engine.threads.find(t => t.id === this.activePlayerId);
    if (activeThread && activeThread.type === 'PLAYER') {
      // Hľadanie itemov závisí od entropie arény, lucku (1.0) a hernej obtiažnosti (0.4)
      const rolledLoot = CombinatoricProbabilityEngine.rollLootDrop(this.engine.globalEntropy, 1.0, 0.4);
      if (rolledLoot) {
        const materialToGive = this.activePlayerId === 'thread_king_ai' ? 'CrystalShard' : 'Spores';
        activeThread.materials[materialToGive] = (activeThread.materials[materialToGive] || 0) + 1;
        console.log(`[LOOT DROP] Hráč ${this.activePlayerId} získal 1x ${materialToGive} na základe kombinatorického rollu.`);
      }
    }

    // 2. Loot Chest Spawning (15% chance per turn end)
    if (Math.random() < 0.15) {
      const emptyBlocks: { chunkId: number; block: any }[] = [];
      this.engine.map.chunks.forEach(chunk => {
        chunk.blocks.forEach(block => {
          if (block.walkable && !block.hasChest) {
            const occupied = this.engine.threads.some(t =>
              t.position && t.position.meta === chunk.id && t.position.hex === block.id
            );
            if (!occupied) {
              emptyBlocks.push({ chunkId: chunk.id, block });
            }
          }
        });
      });

      if (emptyBlocks.length > 0) {
        const selected = emptyBlocks[Math.floor(Math.random() * emptyBlocks.length)];
        selected.block.hasChest = true;
        console.log(`[CHEST SPAWN] Loot chest spawned at chunk ${selected.chunkId}, hex ${selected.block.id}`);
        this.engine.traceLog.push({
          type: 'ChestSpawn',
          threadId: 'system',
          message: `Loot chest spawned at M${selected.chunkId}_S${selected.block.id}`,
          timestamp: Date.now()
        } as any);
      }
    }

    const drawCard = (thread: any) => {
      if (thread.drawPile.length === 0) {
        if (thread.discardPile.length > 0) {
          thread.drawPile = [...thread.discardPile];
          thread.discardPile = [];
          for (let i = thread.drawPile.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [thread.drawPile[i], thread.drawPile[j]] = [thread.drawPile[j], thread.drawPile[i]];
          }
          console.log(`[DECK_RECYCLE] Recycled and shuffled discard pile of thread ${thread.id} into draw pile.`);
        }
      }
      return thread.drawPile.pop();
    };

    // Dobratie kariet pre aktívneho hráča na konci ťahu
    const drawingActiveThread = this.engine.threads.find(t => t.id === this.baseActivePlayerId);
    let cardsDrawnByActive = 0;
    if (drawingActiveThread && drawingActiveThread.type === 'PLAYER') {
      const drawAmount = Math.max(0, drawingActiveThread.handLimit - drawingActiveThread.currentBuffer.length);
      for (let i = 0; i < drawAmount; i++) {
        const card = drawCard(drawingActiveThread);
        if (card) {
          drawingActiveThread.currentBuffer.push(card);
          cardsDrawnByActive++;
        }
      }
      console.log(`[RULE_OF_SHODA] Aktivny hrac ${drawingActiveThread.id} dobral ${cardsDrawnByActive} kariet.`);
    }

    // Ostatní hráči si doberú presne rovnaký počet kariet (cardsDrawnByActive), maximálne však do svojho limitu
    this.engine.threads.forEach(t => {
      if (t.type === 'PLAYER' && t.id !== this.baseActivePlayerId) {
        const spaceInHand = Math.max(0, t.handLimit - t.currentBuffer.length);
        const drawAmount = Math.min(cardsDrawnByActive, spaceInHand);
        for (let i = 0; i < drawAmount; i++) {
          const card = drawCard(t);
          if (card) {
            t.currentBuffer.push(card);
          }
        }
        if (drawAmount > 0) {
          console.log(`[RULE_OF_SHODA] Oponent hrac ${t.id} dobral ${drawAmount} kariet na zaklade shody.`);
        }
      }
    });

    // Zmena aktívneho hráča
    const nextPlayerId = this.baseActivePlayerId === 'thread_king_ai' ? 'thread_hacker_root' : 'thread_king_ai';
    if (nextPlayerId === 'thread_king_ai') {
      this.turnNumber++;
    }
    this.startTurn(nextPlayerId);
  }

  /**
   * Získanie stavových dát pre klientov
   */
  getState(): any {
    return {
      activePlayerId: this.activePlayerId,
      baseActivePlayerId: this.baseActivePlayerId,
      currentPhase: this.currentPhase,
      timerLeft: this.timerLeft,
      hasActiveChain: this.currentAction !== null,
      turnNumber: this.turnNumber
    };
  }
}
