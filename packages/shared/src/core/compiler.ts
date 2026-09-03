import type { Card } from './types';

export interface CompiledInstruction {
  id: string;
  type: 'ACTION' | 'REACTION' | 'PASSIVE';
  damage: number;
  armor: number;
  hpChange: number;
  energyCost: number;
  effect: 'slow' | 'disarm' | 'silence' | 'root' | 'none';
  reach: number;
  isUltimate: boolean;
  isUnit: boolean;
  unitType?: 'trap' | 'bomb' | 'watcher' | 'tower';
}

/**
 * Card Compiler
 * Prekladá statickú kartu na vykonateľnú inštrukciu pre Sovereign Engine (RPG mechaniky).
 */
export function compileCardToInstruction(card: Card): CompiledInstruction {
  const isUltimate = card.isUltimate || false;
  let damage = 0;
  let armor = 0;
  let hpChange = 0;
  let energyCost = 1; // Predvolená cena v energii
  let reach = 1; // Predvolená susedná vzdialenosť 1 hex

  // 1. Mapovanie dosahu (reach) na záklase špecifikácií
  if (card.specifications.includes('rangeAttack') || card.specifications.includes('rangeMagic') || card.specifications.includes('rangeCast')) {
    reach = 2; // Dosah na vzdialenosť 2
  } else if (card.specifications.includes('yourPosition')) {
    reach = 0; // Pôsobí len na vlastnom políčku
  }

  // 2. Mapovanie RPG štatistík podľa kategórie karty
  switch (card.cardCategorization) {
    case 'attack':
      damage = isUltimate ? 6 : 3;
      armor = 0;
      hpChange = isUltimate ? 3 : 2;
      energyCost = isUltimate ? 3 : 1;
      break;

    case 'magic':
      damage = isUltimate ? 4 : 2;
      armor = isUltimate ? 3 : 1;
      hpChange = isUltimate ? 2 : 1;
      energyCost = isUltimate ? 2 : 1;
      break;

    case 'movement':
      damage = 0;
      armor = isUltimate ? 6 : 4;
      hpChange = 0;
      energyCost = 1;
      break;

    case 'enhancement':
      damage = isUltimate ? 2 : 1;
      armor = 0;
      hpChange = 0;
      energyCost = 1;
      reach = 1;
      break;

    default:
      damage = 1;
      armor = 1;
      hpChange = 0;
      energyCost = 1;
      break;
  }

  // Bezpečnostná saturácia
  damage = Math.max(0, damage);
  armor = Math.max(0, armor);
  hpChange = Math.max(0, hpChange);

  return {
    id: card.id,
    type: card.cardCategorization === 'movement' ? 'REACTION' : 'ACTION',
    damage,
    armor,
    hpChange,
    energyCost,
    effect: card.effect || 'none',
    reach,
    isUltimate,
    isUnit: card.isUnit || false,
    unitType: card.unitType
  };
}
