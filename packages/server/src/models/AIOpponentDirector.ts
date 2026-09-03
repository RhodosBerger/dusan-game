import { ActionNode } from './ActionNode';
import { SovereignEngine } from './SovereignEngine';
import { Thread } from './Thread';
import { CRYSTAL_CARDS_BASE, TOXIC_CARDS_BASE, DRUID_CARDS_BASE, VOID_CARDS_BASE } from '@dusan-game/shared';

const ALL_BASES = [...CRYSTAL_CARDS_BASE, ...TOXIC_CARDS_BASE, ...DRUID_CARDS_BASE, ...VOID_CARDS_BASE];

// Rovnaká mriežka metapozícií 3x3 ako v server.ts (playCard / move_character)
const META_COORDS = [
  { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
  { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
  { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }
];

const metaDistance = (metaA: number, metaB: number): number => {
  const a = META_COORDS[metaA] || { x: 0, y: 0 };
  const b = META_COORDS[metaB] || { x: 0, y: 0 };
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
};

/**
 * Základný AI protivník pre tréningový režim.
 *
 * Volá sa z 1-sekundového intervalu zápasu; každý tik vykoná najviac jednu
 * akciu, aby mal ťah AI čitateľné tempo:
 *   1. útok, ak je súper v dosahu a AI má útočnú kartu,
 *   2. inak voľný pohyb o 1 metapozíciu smerom k súperovi,
 *   3. inak koniec ťahu.
 * Počas reakčného okna po hráčovom útoku AI pasuje.
 */
export class AIOpponentDirector {
  private attackedOnTurn = -1;

  constructor(private engine: SovereignEngine, private aiThreadId: string) {}

  /** Vykoná najviac jednu akciu. Vráti true, ak sa herný stav zmenil. */
  tick(): boolean {
    const engine = this.engine;
    if (engine.state === 'GAME_OVER') return false;

    const sm = engine.turnStateMachine;
    const ai = engine.threads.find(t => t.id === this.aiThreadId);
    if (!ai || ai.health <= 0) return false;

    if (sm.currentPhase === 'INTERRUPT_WINDOW') {
      // AI je obranca (aktívny hráč počas okna) -> pasuje, nech hra odsýpa
      if (sm.activePlayerId === this.aiThreadId && sm.baseActivePlayerId !== this.aiThreadId) {
        sm.pass(this.aiThreadId);
        return true;
      }
      return false;
    }

    if (sm.currentPhase !== 'ACTION' || sm.activePlayerId !== this.aiThreadId) {
      return false;
    }

    const opponent = engine.threads.find(t => t.type === 'PLAYER' && t.id !== this.aiThreadId);
    if (!opponent || opponent.position.meta === null) {
      return false;
    }

    if (this.attackedOnTurn !== sm.turnNumber && this.tryAttack(ai, opponent)) {
      this.attackedOnTurn = sm.turnNumber;
      return true;
    }

    if (this.tryMoveTowards(ai, opponent)) {
      return true;
    }

    // Ruka bez zahrateľnej útočnej karty by sa nikdy neobmenila (dober dopĺňa len
    // do limitu) — odhodenie jednej karty umožní balíčku cyklovať.
    if (this.attackedOnTurn !== sm.turnNumber && ai.currentBuffer.length > 0) {
      const discarded = ai.currentBuffer.shift()!;
      ai.discardPile.push(discarded);
      console.log(`[AI_DIRECTOR] ${this.aiThreadId} nemá použiteľný útok, odhadzuje kartu ${discarded.id}.`);
    }

    console.log(`[AI_DIRECTOR] ${this.aiThreadId} ukončuje ťah ${sm.turnNumber}.`);
    sm.endTurn();
    return true;
  }

  /** Zahrá prvú útočnú kartu z ruky, ak je súper v dosahu (zrkadlí guardy a tok z playCard). */
  private tryAttack(ai: Thread, opponent: Thread): boolean {
    if (ai.isDisarmed || ai.position.meta === null) return false;

    // Útočné sú aj HELPER jednotky s poškodením (hadie bomby, veže...) — hrajú sa
    // rovnako ako v playCard: jednotka sa položí a útok sa registruje do siete.
    const card = ai.currentBuffer.find(c => {
      const base = ALL_BASES.find(b => b.id === c.id);
      return c.damage > 0 || base?.cardCategorization === 'attack';
    });
    if (!card) return false;

    const dist = metaDistance(ai.position.meta, opponent.position.meta!);
    const base = ALL_BASES.find(b => b.id === card.id);
    const isAttackNode = card.damage > 0 || base?.cardCategorization === 'attack';
    const reach = isAttackNode ? ai.attackReach : ai.spellReach;
    if (reach === 0 ? dist > 0 : dist > reach) return false;

    const cardIndex = ai.currentBuffer.indexOf(card);
    ai.currentBuffer.splice(cardIndex, 1);
    ai.discardPile.push(card);

    if (card.type === 'HELPER') {
      // Rovnaké pravidlá ako playCard: pasce sa kladú na políčko cieľa, jednotky na mapu
      const isTrap = card.id === 'snowGround' || card.id === 'snakes' || card.id === 'snakesForward' || card.id === 'rootTrap';
      if (isTrap) {
        const targetChunk = this.engine.map.chunks.find(c => c.id === opponent.position.meta);
        const targetBlock = targetChunk?.blocks.find(b => b.id === opponent.position.hex);
        if (targetBlock) {
          targetBlock.hasTrap = (card.id.includes('snow') || card.id.includes('root')) ? 'ROOT_TRAP' : 'EMP_MINE';
          targetBlock.trapOwnerId = this.aiThreadId;
          console.log(`[AI_DIRECTOR] ${this.aiThreadId} položil pascu ${card.id} na M${opponent.position.meta}_S${opponent.position.hex}.`);
        }
      } else {
        const helperThread = new Thread(`helper_${Date.now()}_${card.id}`, 'HELPER', this.aiThreadId);
        helperThread.name = card.name;
        helperThread.health = card.isUltimate ? 8 : 4;
        const chunk = this.engine.map.chunks.find(c => c.id === ai.position.meta);
        const freeBlock = chunk?.blocks.find(block =>
          block.walkable &&
          !this.engine.threads.some(t => t.position && t.position.meta === ai.position.meta && t.position.hex === block.id)
        );
        if (freeBlock) {
          this.engine.spawnThread(helperThread, ai.position.meta, freeBlock.id);
        }
      }
    }

    const nodeId = `node_ai_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const actionNode = new ActionNode(nodeId, card, this.aiThreadId, opponent.id);
    console.log(`[AI_DIRECTOR] ${this.aiThreadId} útočí kartou ${card.id} na ${opponent.id} (vzdialenosť ${dist}, dosah ${reach}).`);
    this.engine.turnStateMachine.registerAction(actionNode);
    return true;
  }

  /** Voľný pohyb o 1 metapozíciu smerom k súperovi (zrkadlí guardy z move_character). */
  private tryMoveTowards(ai: Thread, opponent: Thread): boolean {
    if (ai.isRooted || ai.freeMovementUsed) return false;
    if (ai.position.meta === null || opponent.position.meta === null) return false;

    const currentDist = metaDistance(ai.position.meta, opponent.position.meta);
    if (currentDist === 0) return false; // sme na mieste, pohyb nič nezlepší

    // Kandidátne metapozície: susedné (vzdialenosť 1) a bližšie k súperovi
    const candidateMetas = META_COORDS
      .map((_, metaId) => metaId)
      .filter(metaId =>
        metaDistance(ai.position.meta!, metaId) === 1 &&
        metaDistance(metaId, opponent.position.meta!) < currentDist
      );

    for (const metaId of candidateMetas) {
      const chunk = this.engine.map.chunks.find(c => c.id === metaId);
      if (!chunk) continue;

      const freeBlock = chunk.blocks.find(block =>
        block.walkable &&
        !this.engine.threads.some(t =>
          t.position && t.position.meta === metaId && t.position.hex === block.id
        )
      );
      if (!freeBlock) continue;

      ai.freeMovementUsed = true;
      const oldPos = { ...ai.position };
      ai.position = { meta: metaId, hex: freeBlock.id };
      console.log(`[AI_DIRECTOR] ${this.aiThreadId} sa presunul z M${oldPos.meta}_S${oldPos.hex} na M${metaId}_S${freeBlock.id}.`);

      this.engine.traceLog.push({
        type: 'Move',
        threadId: this.aiThreadId,
        from: oldPos,
        to: { meta: metaId, hex: freeBlock.id },
        cost: 1.0,
        timestamp: Date.now()
      } as any);

      this.engine.triggerTrapCheck(ai, metaId, freeBlock.id);
      this.engine.triggerOpportunityCheck(ai, metaId, freeBlock.id);
      return true;
    }

    return false;
  }
}
