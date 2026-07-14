import { SovereignEngine } from './models/SovereignEngine';
import { Thread } from './models/Thread';
import { Instruction } from './models/Instruction';
import { CardBase, CRYSTAL_CARDS_BASE, TOXIC_CARDS_BASE, VOID_CARDS_BASE } from '@dusan-game/shared';
import fs from 'fs';
import path from 'path';

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

import { DynamicDifficultyMapGenerator } from './models/DynamicDifficultyMapGenerator';

export function initializeSeedData(engine: SovereignEngine) {
  // 0. Procedurálne generovanie mapy na základe obtiažnosti 3 (vyvážená stredná úroveň)
  const generatorStats = DynamicDifficultyMapGenerator.generateTacticalBoard(engine.map, 3);
  console.log(`[MAP_GENERATOR] Procedurálna taktická mapa vytvorená. Štatistiky:`, JSON.stringify(generatorStats));

  // 1. Alokácia hrdinov klanov
  const kingAI = new Thread('thread_king_ai', 'PLAYER');
  kingAI.health = 15;
  kingAI.armor = 2;

  const hackerRoot = new Thread('thread_hacker_root', 'PLAYER');
  hackerRoot.health = 12;
  hackerRoot.armor = 1;

  const voidWeaver = new Thread('thread_void_weaver', 'PLAYER');
  voidWeaver.health = 14;
  voidWeaver.armor = 0;

  // Spawnovanie na mapu
  engine.spawnThread(kingAI, 0, 0);       // Crystal base at macro 0, hex 0
  engine.spawnThread(hackerRoot, 8, 6);   // Toxic base at macro 8, hex 6
  engine.spawnThread(voidWeaver, 5, 3);   // Void base at macro 5, hex 3

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

  // 3b. Void Deck Generation
  VOID_CARDS_BASE.forEach(card => {
    for (let i = 0; i < card.count; i++) {
      const inst = createInstructionFromCard(card);
      voidWeaver.drawPile.push(inst);
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
  shuffle(voidWeaver.drawPile);

  // 4. Rozdanie počiatočných kariet (handLimit = 4)
  for (let i = 0; i < 4; i++) {
    const cardA = kingAI.drawPile.pop();
    if (cardA) kingAI.currentBuffer.push(cardA);

    const cardB = hackerRoot.drawPile.pop();
    if (cardB) hackerRoot.currentBuffer.push(cardB);

    const cardC = voidWeaver.drawPile.pop();
    if (cardC) voidWeaver.currentBuffer.push(cardC);
  }

  // 5. Spawning Neutral AI Monsters (PvEvP) cez Fraktálnu Distribúciu
  if (!engine.isIslandCampaign) {
    generatorStats.npcSpawns.forEach((spawn, idx) => {
      // Nespaunujeme priamo v štartovacích zónach hráčov (M0 a M8) kvôli férovosti
      if (spawn.chunkId !== 0 && spawn.chunkId !== 8) {
        engine.spawnNPC(`thread_npc_fractal_${idx}`, `Fractal Glitch ${idx + 1}`, spawn.chunkId, spawn.blockId, 4);
      }
    });
  }
}

