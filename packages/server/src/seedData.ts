import { SovereignEngine } from './models/SovereignEngine';
import { Thread } from './models/Thread';
import { Instruction } from './models/Instruction';
import { CardBase, CRYSTAL_CARDS_BASE, TOXIC_CARDS_BASE } from '@dusan-game/shared';

declare var require: any;
declare var __dirname: string;
const fs = require('fs');
const path = require('path');

// Načítanie slovenských prekladov pre server
const skTranslationsPath = path.join(__dirname, '../../shared/src/translations/sk/cards.json');
let skCards: any = {};
if (fs.existsSync(skTranslationsPath)) {
  skCards = JSON.parse(fs.readFileSync(skTranslationsPath, 'utf8'));
}

export function createInstructionFromCard(card: CardBase): Instruction {
  const heroKey = card.heroId;
  const cardTrans = skCards[heroKey]?.[card.id];
  const name = cardTrans ? cardTrans.name : card.id;

  const type = card.isUnit ? 'HELPER' : 'ACTION';
  const inst = new Instruction(card.id, name, type);
  inst.isUltimate = card.isUltimate || false;

  // 1. Zranenie
  if (card.cardCategorization === 'attack') {
    if (card.id === 'snakeAttack') inst.damage = 4;
    else if (card.id === 'bearCleave') inst.damage = 6;
    else if (card.id === 'iceMeteor') inst.damage = 5;
    else if (card.id === 'iceShards') inst.damage = 5;
    else inst.damage = card.isUltimate ? 7 : 4;
  } else {
    inst.damage = 0;
  }

  // 2. Brnenie
  if (card.specifications.includes('block')) {
    inst.armor = card.isUltimate ? 5 : 3;
  } else {
    inst.armor = 0;
  }

  // 3. Liečenie
  if (card.specifications.includes('heal')) {
    inst.hpChange = card.isUltimate ? 3 : 1;
  } else {
    inst.hpChange = 0;
  }

  // 4. Energetická spotreba
  inst.energyCost = card.isUltimate ? 2 : 1;

  // 5. Efekty
  if (card.effect === 'slow') inst.effects.thermalThrottling = true;
  if (card.effect === 'root') inst.effects.chronoLock = true;
  if (card.effect === 'silence') inst.effects.syntaxMute = true;
  if (card.effect === 'disarm') inst.effects.threadIsolation = true;

  // 6. Pomocná jednotka
  if (card.isUnit) {
    inst.helperStats = {
      health: card.isUltimate ? 8 : 4,
      armor: card.unitType === 'tower' ? 3 : 0,
      attackReach: 1
    };
  }

  return inst;
}

export function initializeSeedData(engine: SovereignEngine) {
  // 1. Alokácia hrdinov klanov
  const kingAI = new Thread('thread_king_ai', 'PLAYER');
  kingAI.health = 15;
  kingAI.armor = 2;

  const hackerRoot = new Thread('thread_hacker_root', 'PLAYER');
  hackerRoot.health = 12;
  hackerRoot.armor = 1;

  // Spawnovanie na mapu
  engine.spawnThread(kingAI, 0, 0);       // Crystal base at macro 0, hex 0
  engine.spawnThread(hackerRoot, 8, 6);   // Toxic base at macro 8, hex 6

  // 2. Crystal Deck Generation
  CRYSTAL_CARDS_BASE.forEach(card => {
    // Vytvoríme inštrukciu pre každý výskyt karty (podľa card.count)
    for (let i = 0; i < card.count; i++) {
      const inst = createInstructionFromCard(card);
      kingAI.drawPile.push(inst);
    }
  });

  // 3. Toxic Deck Generation
  TOXIC_CARDS_BASE.forEach(card => {
    for (let i = 0; i < card.count; i++) {
      const inst = createInstructionFromCard(card);
      hackerRoot.drawPile.push(inst);
    }
  });

  // Pomocná funkcia na zamiešanie balíčka
  const shuffle = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };

  shuffle(kingAI.drawPile);
  shuffle(hackerRoot.drawPile);

  // 4. Rozdanie počiatočných kariet (handLimit = 4)
  for (let i = 0; i < 4; i++) {
    const cardA = kingAI.drawPile.pop();
    if (cardA) kingAI.currentBuffer.push(cardA);

    const cardB = hackerRoot.drawPile.pop();
    if (cardB) hackerRoot.currentBuffer.push(cardB);
  }

  // 5. Spawning Neutral AI Monsters (PvEvP)
  // Far from starting positions and safe town: Chunk 3 Block 3 and Chunk 5 Block 2
  engine.spawnNPC('thread_npc_glitch_01', 'Syntax Monster 1', 3, 3, 4);
  engine.spawnNPC('thread_npc_glitch_02', 'Syntax Monster 2', 5, 2, 4);
}

