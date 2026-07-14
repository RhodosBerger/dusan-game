// Stateless AI Opponent Director for training matches
import { CRYSTAL_CARDS_BASE, TOXIC_CARDS_BASE } from '@dusan-game/shared';

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

export class AIOpponentDirector {
  constructor(private aiThreadId: string) {}

  /**
   * Ticks the AI logic against the current matchState.
   * Returns true if an action was executed (e.g. attack, move, or pass).
   */
  public tick(matchState: any, io: any, goMediator: any): boolean {
    if (matchState.state !== 'RUNNING' || matchState.activePlayerId !== this.aiThreadId) {
      return false;
    }

    const ai = matchState.threads.find((t: any) => t.id === this.aiThreadId);
    const opponent = matchState.threads.find((t: any) => t.id !== this.aiThreadId);

    if (!ai || ai.health <= 0 || !opponent || opponent.health <= 0) {
      return false;
    }

    const dist = metaDistance(ai.position.meta, opponent.position.meta);

    // 1. Attack Option
    const attackCard = ai.currentBuffer.find((c: any) => c.type === 'ATTACK' || c.type === 'MAGIC');
    if (attackCard) {
      const reach = attackCard.type === 'ATTACK' ? ai.attackReach : ai.spellReach;
      if (dist <= reach) {
        // Play the card
        const cardIndex = ai.currentBuffer.indexOf(attackCard);
        ai.currentBuffer.splice(cardIndex, 1);
        ai.discardPileCount += 1;

        // Draw replacement card to hand
        const allBaseCards = [...CRYSTAL_CARDS_BASE, ...TOXIC_CARDS_BASE];
        const idx = Math.floor(Math.random() * allBaseCards.length);
        const replacement = allBaseCards[idx];
        const cost = replacement.isUltimate ? 2 : 1;
        const name = replacement.id.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        ai.currentBuffer.push({
          id: replacement.id + '_' + Date.now(),
          type: replacement.cardCategorization.toUpperCase(),
          cost,
          name,
          desc: `AI action: ${replacement.cardCategorization}`
        });

        // Resolve combat damage via Go Core fallback mediator
        const defenderArmor = opponent.items.length * 2;
        goMediator.resolveCombatDamage({
          damage: attackCard.type === 'ATTACK' ? 3 : 4,
          attackerHeroId: this.aiThreadId,
          defenderHeroId: opponent.id,
          defenderArmor: defenderArmor,
          reactionsCount: 1,
          isSnakeOrStealth: false
        }).then((combatRes: any) => {
          opponent.health = Math.max(0, opponent.health - combatRes.finalDamage);
          console.log(`[AI COMBAT RESOLUTION] ${combatRes.log}`);

          if (opponent.health <= 0) {
            matchState.state = 'GAME_OVER';
          }

          io.emit('match_state_updated', { gameState: matchState });
          io.emit('card_played_effect', {
            targetHex: opponent.position,
            sourceHex: ai.position
          });
        });

        console.log(`[AI_DIRECTOR] ${this.aiThreadId} played ${attackCard.name} targeting ${opponent.id}`);
        return true;
      }
    }

    // 2. Movement Option (Advance towards opponent)
    if (!ai.freeMovementUsed && dist > 0) {
      const candidates = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(metaId => 
        metaDistance(ai.position.meta, metaId) === 1 &&
        metaDistance(metaId, opponent.position.meta) < dist
      );

      if (candidates.length > 0) {
        const nextMeta = candidates[0];
        const oldPos = { ...ai.position };
        ai.position = { meta: nextMeta, hex: 0 }; // Move to center of chunk
        ai.freeMovementUsed = true;
        matchState.systemEnergy = Math.max(0, matchState.systemEnergy - 5);

        console.log(`[AI_DIRECTOR] ${this.aiThreadId} moved from M${oldPos.meta} to M${nextMeta}`);
        io.emit('match_state_updated', { gameState: matchState });
        return true;
      }
    }

    // 3. Pass Option (End Turn)
    matchState.activePlayerId = opponent.id;
    matchState.turnsElapsed += 1;
    matchState.threads.forEach((t: any) => {
      t.freeMovementUsed = false;
    });
    matchState.systemEnergy = Math.min(100, matchState.systemEnergy + 15);

    console.log(`[AI_DIRECTOR] ${this.aiThreadId} ended their turn.`);
    io.emit('match_state_updated', { gameState: matchState });
    return true;
  }
}
