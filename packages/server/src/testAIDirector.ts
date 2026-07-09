import { SovereignEngine } from './models/SovereignEngine';
import { Thread } from './models/Thread';
import { ActionNode } from './models/ActionNode';
import { Instruction } from './models/Instruction';
import { AIOpponentDirector } from './models/AIOpponentDirector';
import { AethericDiceEngine } from '@dusan-game/shared';

declare var process: any;

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAIL: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

function makeDamageCard(id: string): Instruction {
  const card = new Instruction(id, `Test ${id}`, 'ACTION');
  card.damage = 4;
  card.energyCost = 1;
  return card;
}

async function runTests() {
  AethericDiceEngine.bypassDice = true;
  console.log('Spúšťam testy AIOpponentDirector...\n');

  // ----------------------------------------------------
  // TEST 1: AI zaútočí, keď je súper v dosahu
  // ----------------------------------------------------
  console.log('Test 1: Útok v dosahu');
  {
    const engine = new SovereignEngine();
    const ai = new Thread('thread_king_ai', 'PLAYER');
    const player = new Thread('thread_hacker_root', 'PLAYER');
    engine.spawnThread(ai, 0, 0);
    engine.spawnThread(player, 1, 0); // metavzdialenosť 1 <= attackReach

    engine.addPlayer('thread_king_ai'); // AI začína
    engine.addPlayer('thread_hacker_root');

    ai.currentBuffer.push(makeDamageCard('snowball'));

    const director = new AIOpponentDirector(engine, 'thread_king_ai');
    const acted = director.tick();

    assert(acted, 'AI vykonala akciu.');
    assert(engine.turnStateMachine.currentPhase === 'INTERRUPT_WINDOW', 'Útok otvoril reakčné okno.');
    assert(ai.currentBuffer.length === 0, 'Útočná karta odišla z ruky.');
    assert(ai.discardPile.length === 1, 'Útočná karta skončila v odhadzovacom balíčku.');
    assert(engine.turnStateMachine.activePlayerId === 'thread_hacker_root', 'Na reakciu je aktívny obranca.');
  }

  // ----------------------------------------------------
  // TEST 2: AI sa priblíži, keď je súper mimo dosahu
  // ----------------------------------------------------
  console.log('\nTest 2: Pohyb k súperovi');
  {
    const engine = new SovereignEngine();
    const ai = new Thread('thread_king_ai', 'PLAYER');
    const player = new Thread('thread_hacker_root', 'PLAYER');
    engine.spawnThread(ai, 0, 0);
    engine.spawnThread(player, 8, 6); // metavzdialenosť 4 > dosah

    engine.addPlayer('thread_king_ai');
    engine.addPlayer('thread_hacker_root');

    ai.currentBuffer.push(makeDamageCard('snowball'));

    const director = new AIOpponentDirector(engine, 'thread_king_ai');
    const distBefore = Math.abs(0 % 3 - 8 % 3) + Math.abs(Math.floor(0 / 3) - Math.floor(8 / 3));
    const acted = director.tick();
    const m = ai.position.meta!;
    const distAfter = Math.abs(m % 3 - 8 % 3) + Math.abs(Math.floor(m / 3) - Math.floor(8 / 3));

    assert(acted, 'AI vykonala akciu.');
    assert(engine.turnStateMachine.currentPhase === 'ACTION', 'Pohyb neotvoril reakčné okno.');
    assert(distAfter === distBefore - 1, `AI sa priblížila o 1 metapozíciu (z ${distBefore} na ${distAfter}).`);
    assert(ai.freeMovementUsed, 'Voľný pohyb je vyčerpaný.');
  }

  // ----------------------------------------------------
  // TEST 3: AI ukončí ťah, keď nemá čo robiť
  // ----------------------------------------------------
  console.log('\nTest 3: Koniec ťahu');
  {
    const engine = new SovereignEngine();
    const ai = new Thread('thread_king_ai', 'PLAYER');
    const player = new Thread('thread_hacker_root', 'PLAYER');
    engine.spawnThread(ai, 0, 0);
    engine.spawnThread(player, 8, 6);

    engine.addPlayer('thread_king_ai');
    engine.addPlayer('thread_hacker_root');

    // Žiadna útočná karta, pohyb už vyčerpaný -> jediná možnosť je koniec ťahu
    ai.freeMovementUsed = true;

    const director = new AIOpponentDirector(engine, 'thread_king_ai');
    const acted = director.tick();

    assert(acted, 'AI vykonala akciu.');
    assert(engine.turnStateMachine.activePlayerId === 'thread_hacker_root', 'Ťah prešiel na súpera.');
  }

  // ----------------------------------------------------
  // TEST 4: AI pasuje ako obranca v reakčnom okne
  // ----------------------------------------------------
  console.log('\nTest 4: Pas v reakčnom okne');
  {
    const engine = new SovereignEngine();
    const ai = new Thread('thread_king_ai', 'PLAYER');
    const player = new Thread('thread_hacker_root', 'PLAYER');
    engine.spawnThread(ai, 0, 0);
    engine.spawnThread(player, 1, 0);

    engine.addPlayer('thread_hacker_root'); // hráč začína
    engine.addPlayer('thread_king_ai');

    // Hráč zaútočí na AI
    const card = makeDamageCard('snakeAttack');
    const node = new ActionNode('node_p1', card, 'thread_hacker_root', 'thread_king_ai');
    engine.turnStateMachine.registerAction(node);
    assert(engine.turnStateMachine.currentPhase === 'INTERRUPT_WINDOW', 'Hráčov útok otvoril reakčné okno.');
    assert(engine.turnStateMachine.activePlayerId === 'thread_king_ai', 'AI je aktívna ako obranca.');

    const director = new AIOpponentDirector(engine, 'thread_king_ai');
    const acted = director.tick();

    assert(acted, 'AI vykonala akciu (pas).');
    assert(engine.turnStateMachine.currentPhase === 'ACTION', 'Reťazec sa vyhodnotil, hra pokračuje.');
    assert(engine.turnStateMachine.activePlayerId === 'thread_hacker_root', 'Ťah sa vrátil útočníkovi.');
  }

  // ----------------------------------------------------
  // TEST 5: AI nekoná, keď nie je na ťahu
  // ----------------------------------------------------
  console.log('\nTest 5: AI čaká mimo svojho ťahu');
  {
    const engine = new SovereignEngine();
    const ai = new Thread('thread_king_ai', 'PLAYER');
    const player = new Thread('thread_hacker_root', 'PLAYER');
    engine.spawnThread(ai, 0, 0);
    engine.spawnThread(player, 1, 0);

    engine.addPlayer('thread_hacker_root'); // hráč je na ťahu
    engine.addPlayer('thread_king_ai');

    ai.currentBuffer.push(makeDamageCard('snowball'));

    const director = new AIOpponentDirector(engine, 'thread_king_ai');
    const acted = director.tick();

    assert(!acted, 'AI nevykonala žiadnu akciu mimo svojho ťahu.');
    assert(engine.turnStateMachine.activePlayerId === 'thread_hacker_root', 'Na ťahu zostal hráč.');
  }

  // ----------------------------------------------------
  // TEST 6: Útok na jednotku presmeruje reakčné okno na jej majiteľa
  // ----------------------------------------------------
  console.log('\nTest 6: Reakčné okno pri útoku na jednotku');
  {
    const engine = new SovereignEngine();
    const ai = new Thread('thread_king_ai', 'PLAYER');
    const player = new Thread('thread_hacker_root', 'PLAYER');
    engine.spawnThread(ai, 0, 0);
    engine.spawnThread(player, 1, 0);

    engine.addPlayer('thread_king_ai');
    engine.addPlayer('thread_hacker_root');

    // Obranca (hacker) má postavenú jednotku; útočník na ňu útočí
    const helper = new Thread('helper_test_unit', 'HELPER', 'thread_hacker_root');
    engine.spawnThread(helper, 1, 1);

    const card = makeDamageCard('snowball');
    const node = new ActionNode('node_h1', card, 'thread_king_ai', 'helper_test_unit');
    engine.turnStateMachine.registerAction(node);

    assert(engine.turnStateMachine.currentPhase === 'INTERRUPT_WINDOW', 'Útok na jednotku otvoril reakčné okno.');
    assert(
      engine.turnStateMachine.activePlayerId === 'thread_hacker_root',
      `Reakčné okno dostal majiteľ jednotky, nie jednotka (activePlayerId=${engine.turnStateMachine.activePlayerId}).`
    );
  }

  console.log('\n✅ Všetky testy AIOpponentDirector prešli.');
  process.exit(0);
}

runTests().catch(err => {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
});
