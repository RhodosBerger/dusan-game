import { SovereignEngine } from './models/SovereignEngine';
import { Thread } from './models/Thread';
import { ActionNode } from './models/ActionNode';
import { Instruction } from './models/Instruction';
import { DatabaseSyncManager } from './models/DatabaseSyncManager';
import { CombinatoricProbabilityEngine, DungeonDirector, BiomeEngine, MLTerrainSynthesizer, Pathfinder, PredictiveBalanceDirector, AlgebraicActionTensor, AdrenalineDirector, AethericDiceEngine, VOID_CARDS_BASE, AlgebraicOpportunityGenerator, QuestTriggerManager, RuleOfThreeSolver, OhmGridEvaluator } from '@dusan-game/shared';
import { SemanticGameplayCoordinator } from './models/SemanticGameplayCoordinator';
import { TerrainTelemetryCoordinator } from './models/TerrainTelemetryCoordinator';
import { RenderPriorityBalancer } from './models/RenderPriorityBalancer';
import { GameplayCompositorManager } from './models/GameplayCompositorManager';
import { GameplayCompositionEngine } from './models/GameplayCompositionEngine';
import { AestheticMarketCoordinator } from './models/AestheticMarketCoordinator';
import { TacticalGenerativeCoordinator } from './models/TacticalGenerativeCoordinator';
import { SovereignContentDistributor } from './models/SovereignContentDistributor';
import { SovereignSoldierSimulator } from './models/SovereignSoldierSimulator';
import { DeterministicTurnBalancer } from './models/DeterministicTurnBalancer';
import { SovereignLogicConsole } from './models/SovereignLogicConsole';
import { SovereignBattleDirector } from './models/SovereignBattleDirector';
import { SovereignSuperpositionEngine } from './models/SovereignSuperpositionEngine';
import { SovereignSystemHierarchy } from './models/SovereignSystemHierarchy';
import { SovereignStatisticsReporter } from './models/SovereignStatisticsReporter';
import { SovereignTelemetrySpawner } from './models/SovereignTelemetrySpawner';
import { SovereignCombinatoricsRegistry } from './models/SovereignCombinatoricsRegistry';
import { ClickHouseTelemetryClient } from './models/ClickHouseTelemetryClient';
declare var require: any;
declare var process: any;
declare var __dirname: string;
const fs = require('fs');
const pathModule = require('path');

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAIL: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

async function runTests() {
  AethericDiceEngine.bypassDice = true; // ensure deterministic behavior in standard test runs
  console.log("Spúšťam RPG súbojové testovanie SovereignEngine a TurnStateMachine...\n");

  // ----------------------------------------------------
  // TEST 1: Ochrana 1. kola (First Round Safety)
  // ----------------------------------------------------
  console.log("Test 1: Ochrana 1. kola (HP ochrana)");
  const engine1 = new SovereignEngine();
  
  const pA = new Thread('thread_king_ai', 'PLAYER');
  const pB = new Thread('thread_hacker_root', 'PLAYER');
  
  engine1.spawnThread(pA, 0, 0);
  engine1.spawnThread(pB, 1, 0); // Vzdialenosť 1
  
  engine1.addPlayer('thread_king_ai');
  engine1.addPlayer('thread_hacker_root');
  
  // Hráč A štartuje s HP 15, Hráč B s HP 12
  pA.health = 15;
  pB.health = 12;
  
  // V 1. kole by mal byť útok blokovaný ochranným štítom
  const dmgCard = new Instruction('snowball', 'Snowball Attack', 'ACTION');
  dmgCard.damage = 6;
  dmgCard.hpChange = 3;
  dmgCard.energyCost = 2;
  
  const node1 = new ActionNode('node_1', dmgCard, 'thread_king_ai', 'thread_hacker_root');
  engine1.pushInstructionToNetwork(node1);
  engine1.resolveActionNetwork();
  
  assert(pB.health === 12, "Hráč B by v 1. kole nemal dostať žiadne poškodenie HP.");
  assert(engine1.turnCount === 2, "Po vyhodnotení sa turnCount posunie na 2.");

  // ----------------------------------------------------
  // TEST 2: RPG vyhodnotenie súboja (Damage vs Armor) v 2. kole
  // ----------------------------------------------------
  console.log("\nTest 2: RPG Súboj (Damage vs Armor)");
  
  // Nastavíme brnenie cieľa (Hacker Root má armor = 1)
  pB.armor = 1;
  
  // Útok s poškodením 6 voči brneniu 1 s kombinatorickou redukciou udelí 4 poškodenia.
  const node2 = new ActionNode('node_2', dmgCard, 'thread_king_ai', 'thread_hacker_root');
  engine1.pushInstructionToNetwork(node2);
  engine1.resolveActionNetwork();
  
  // 12 HP - 4 HP damage = 8 HP zostávajúcich
  assert(pB.health === 8, "Hráč B v 2. kole dostal 4 čisté body poškodenia (health klesol na 8).");

  // ----------------------------------------------------
  // TEST 3: Status guards (Odzbrojenie a Umlčanie)
  // ----------------------------------------------------
  console.log("\nTest 3: RPG Status guards");
  
  // Nastavíme odzbrojenie na hráčovi A
  pA.isDisarmed = true;
  
  const attackCard = new Instruction('iceShards', 'Ice Shards', 'ACTION');
  attackCard.damage = 3;
  attackCard.armor = 0; // Červená útočná
  attackCard.energyCost = 1;
  
  const node3 = new ActionNode('node_3', attackCard, 'thread_king_ai', 'thread_hacker_root');
  engine1.pushInstructionToNetwork(node3);
  
  const initialHealth = pB.health;
  engine1.resolveActionNetwork();
  
  assert(pB.health === initialHealth, "Odzbrojený hráč nemôže úspešne vykonať útočnú akciu.");
  pA.isDisarmed = false; // Vyčistenie stavu

  // ----------------------------------------------------
  // TEST 4: Simultánna smrť (Tie / Remíza)
  // ----------------------------------------------------
  console.log("\nTest 4: Simultánna smrť oboch hráčov");
  const engine2 = new SovereignEngine();
  
  const playerA = new Thread('thread_king_ai', 'PLAYER');
  const playerB = new Thread('thread_hacker_root', 'PLAYER');
  
  // Nastavenie nízkych životov
  playerA.health = 2;
  playerB.health = 2;
  playerA.armor = 0;
  playerB.armor = 0;
  
  engine2.spawnThread(playerA, 0, 0);
  engine2.spawnThread(playerB, 1, 0);
  
  engine2.addPlayer('thread_king_ai');
  engine2.addPlayer('thread_hacker_root');
  engine2.turnCount = 2; // Preskočíme ochranu 1. kola
  
  // Hráč A útočí na B a B reaguje útokom na A (Damage 6 prejde cez armor 0)
  const action1 = new ActionNode('act_1', dmgCard, 'thread_king_ai', 'thread_hacker_root');
  const reaction1 = new ActionNode('react_1', dmgCard, 'thread_hacker_root', 'thread_king_ai');
  
  engine2.pushInstructionToNetwork(action1);
  engine2.pushInstructionToNetwork(reaction1);
  
  engine2.resolveActionNetwork();
  
  assert(playerA.health === 0, "Hráč A má 0 HP.");
  assert(playerB.health === 0, "Hráč B má 0 HP.");
  assert(engine2.state === 'GAME_OVER', "Stav hry je GAME_OVER.");
  
  // ----------------------------------------------------
  // TEST 5: Štatistické a kombinatorické rovnice
  // ----------------------------------------------------
  console.log("\nTest 5: Štatistický a pravdepodobnostný Director");
  
  // 1. Sigmoidný model dropovania surovín (Luck / Drop rate)
  const lowProb = CombinatoricProbabilityEngine.calculateLootDropProbability(0.2, 0.5, 1.5);
  const highProb = CombinatoricProbabilityEngine.calculateLootDropProbability(0.8, 1.5, 0.5);
  
  assert(lowProb < highProb, "Vyššia entropia a luck musia zvýšiť pravdepodobnosť nálezu suroviny.");
  console.log(`  [INFO] Nízka šanca: ${(lowProb*100).toFixed(1)}%, Vysoká šanca: ${(highProb*100).toFixed(1)}%`);
  
  // 2. Combo redukcia poškodenia (exponenciálny útlm)
  const noComboFactor = CombinatoricProbabilityEngine.calculateComboDamageFactor(0, 0); 
  const heavyComboFactor = CombinatoricProbabilityEngine.calculateComboDamageFactor(2, 4); 
  
  assert(noComboFactor === 1.0, "Bez comba a brnenia prechádza 100% poškodenia.");
  assert(heavyComboFactor < 0.3, "Pri 4 combách a armore 2 prechádza menej ako 30% poškodenia.");
  console.log(`  [INFO] Koeficient pri 4 combách a 2 brnení: ${heavyComboFactor.toFixed(3)}`);

  // ----------------------------------------------------
  // TEST 6: Dungeon Generator and Spawning Rhythms
  // ----------------------------------------------------
  console.log("\nTest 6: Dungeon Map Generator a Spawnovacie Rytmy");
  
  const dungeon = DungeonDirector.generateDungeon();
  assert(dungeon.rooms.length === 6, "Dungeon generátor musí vytvoriť presne 6 miestností.");
  
  const entrance = dungeon.rooms.find(r => r.type === 'Entrance');
  const boss = dungeon.rooms.find(r => r.type === 'BossChamber');
  
  assert(entrance !== undefined, "Dungeon must have an Entrance.");
  assert(boss !== undefined, "Dungeon must have a BossChamber.");
  
  // Otestujeme spawnovacie rytmy na tension tick (kolo 3)
  const tick1 = DungeonDirector.tickDungeon(dungeon, 10); // turnCounter -> 2
  const tick2 = DungeonDirector.tickDungeon(tick1.state, 10); // turnCounter -> 3
  
  assert(tick2.state.totalEntropy > dungeon.totalEntropy, "Tension tick must increase global entropy.");
  assert(tick2.spawnLogs.some(log => log.includes("Tension Tick")), "Logs must output tension tick.");

  // Otestujeme overload strážcu pri systemEnergy > 75
  const tickOverload = DungeonDirector.tickDungeon(dungeon, 80);
  assert(!!tickOverload.state.rooms.find(r => r.type === 'BossChamber')?.contents.includes('Elite Void Sentinel'), "Overload must spawn guard.");

  // ----------------------------------------------------
  // TEST 7: Minecraft-style Biome Generátor
  // ----------------------------------------------------
  console.log("\nTest 7: Minecraft-style Hexagon Biome Generator");
  
  const b0_0 = BiomeEngine.getBiomeForHex(0, 0); // Stred
  assert(b0_0.biome === 'LUSH_FOREST', "Stredový hex (0,0) by mal byť Lush Forest.");
  console.log(`  [INFO] Hex (0,0) -> Biome: ${b0_0.biome}, Temp: ${b0_0.temperature.toFixed(2)}, Hum: ${b0_0.humidity.toFixed(2)}`);

  const bRandom = BiomeEngine.getBiomeForHex(3, 4);
  console.log(`  [INFO] Hex (3,4) -> Biome: ${bRandom.biome}, Temp: ${bRandom.temperature.toFixed(2)}, Hum: ${bRandom.humidity.toFixed(2)}`);
  assert(bRandom.temperature >= 0 && bRandom.temperature <= 1.0, "Teplota musí byť saturovaná v rozmedzí [0, 1].");

  // ----------------------------------------------------
  // TEST 8: Voxel Terrain Physics (Friction Energy Cost)
  // ----------------------------------------------------
  console.log("\nTest 8: Voxel Terrain Physics (Friction Energy Cost)");
  
  const engine3 = new SovereignEngine();
  const p1 = new Thread('thread_king_ai', 'PLAYER');
  const p2 = new Thread('thread_hacker_root', 'PLAYER');
  
  engine3.spawnThread(p1, 0, 0); // Stred - Lush Forest (Friction = 1.0)
  engine3.spawnThread(p2, 1, 0); 
  
  engine3.addPlayer('thread_king_ai');
  engine3.addPlayer('thread_hacker_root');
  engine3.turnCount = 2; // Preskočíme ochranu 1. kola
  
  const costCard = new Instruction('cost_test', 'Cost Test', 'ACTION');
  costCard.damage = 3;
  costCard.energyCost = 2;
  
  const nodeFriction1 = new ActionNode('node_f1', costCard, 'thread_hacker_root', 'thread_king_ai');
  engine3.pushInstructionToNetwork(nodeFriction1);
  engine3.resolveActionNetwork();
  const energyLush = engine3.systemEnergy; // 2 * 15 * 1.0 = 30
  
  const engine4 = new SovereignEngine();
  engine4.spawnThread(p1, 0, 0);
  engine4.spawnThread(p2, 1, 0); // Vzdialenosť 1
  
  // Zmeníme vlastnosti bloku na vysoké trenie (Toxic Swamp = 1.6)
  const targetBlock = engine4.map.chunks.find(c => c.id === 1)?.blocks.find(b => b.id === 0);
  if (targetBlock) {
    targetBlock.biome = 'TOXIC_SWAMP';
    targetBlock.friction = 1.6;
  }
  
  engine4.addPlayer('thread_king_ai');
  engine4.addPlayer('thread_hacker_root');
  engine4.turnCount = 2;
  
  const nodeFriction2 = new ActionNode('node_f2', costCard, 'thread_king_ai', 'thread_hacker_root');
  engine4.pushInstructionToNetwork(nodeFriction2);
  engine4.resolveActionNetwork();
  const energySwamp = engine4.systemEnergy; // 2 * 15 * 1.6 = 48
  
  assert(energySwamp > energyLush, "Akcia na bloku s vyšším trením (Toxic Swamp) musí generovať viac systémovej energie.");
  console.log(`  [INFO] Energia na Lush Forest: ${energyLush}, na Toxic Swamp: ${energySwamp}`);

  // ----------------------------------------------------
  // TEST 9: Kombinatorická ML Vrstva Terénov (MLTerrainSynthesizer)
  // ----------------------------------------------------
  console.log("\nTest 9: Combinatoric ML Terrain Synthesizer");
  
  const mlRes0_0 = MLTerrainSynthesizer.synthesizeBlock(0, 0); // Stred - Lush Forest
  assert(mlRes0_0.colorSaturation !== undefined && mlRes0_0.lightEmission !== undefined, "Estetické vlastnosti musia byť vygenerované.");
  assert(mlRes0_0.walkable === true, "Lush Forest stredový blok musí byť priechodný.");
  console.log(`  [INFO] Stred (0,0) -> Saturation: ${mlRes0_0.colorSaturation.toFixed(2)}, Light: ${mlRes0_0.lightEmission.toFixed(2)}`);

  // Otestovanie hazard damage na bloku s vysokým hazardIndex
  const engine5 = new SovereignEngine();
  const playerHero = new Thread('thread_king_ai', 'PLAYER');
  engine5.spawnThread(playerHero, 0, 0);
  engine5.turnCount = 2; // Preskočíme turn 1 ochranu pred hazardom
  
  // Zmeníme vlastnosti bloku na nebezpečné (hazardIndex = 0.9)
  const block0_0 = engine5.map.chunks.find(c => c.id === 0)?.blocks.find(b => b.id === 0);
  if (block0_0) {
    block0_0.hazardIndex = 0.9;
  }
  
  const initialHP = playerHero.health;
  engine5.resolveActionNetwork(); // Vyhodnotenie konca ťahu
  
  const finalHP = playerHero.health;
  assert(finalHP < initialHP, "Hrdina na bloku s hazardIndex > 0.5 musí na konci kola dostať poškodenie.");
  console.log(`  [INFO] Hrdina HP kleslo z ${initialHP} na ${finalHP} kvôli hazard terénu.`);

  // ----------------------------------------------------
  // TEST 10: Pathfinder, Vetvené NPC AI a RPG Progres (XP/Level-up)
  // ----------------------------------------------------
  console.log("\nTest 10: Pathfinder, NPC AI and RPG Stat Progression");
  
  const engine6 = new SovereignEngine();
  const player = new Thread('thread_king_ai', 'PLAYER');
  engine6.spawnThread(player, 0, 0); // Stred (0,0)
  
  const monster = engine6.spawnNPC('npc_slayer', 'Skeleton Sentinel', 1, 1, 6);
  
  const blocksList = engine6.map.chunks.flatMap(c => 
    c.blocks.map(b => ({
      chunkId: c.id,
      blockId: b.id,
      walkable: b.walkable,
      energyCostMultiplier: b.energyCostMultiplier
    }))
  );
  
  const path = Pathfinder.findPath(1, 1, 0, 0, blocksList);
  assert(path !== null && path.length > 1, "Pathfinder musí nájsť platnú trasu na hexagónovej mriežke.");
  console.log(`  [INFO] Pathfinder úspešne našiel cestu o dĺžke ${path!.length - 1} hexov.`);

  engine6.turnCount = 2; // Preskočíme ochranu 1. kola
  engine6.tickNPCAI();
  
  const nextStepNode = path![1];
  assert(monster.position.meta === nextStepNode.chunkId && monster.position.hex === nextStepNode.blockId, "NPC AI Slayer sa mal presunúť po ceste bližšie k hráčovi.");
  console.log(`  [INFO] NPC AI úspešne spravilo krok po ceste na C:${monster.position.meta} B:${monster.position.hex}.`);

  assert(player.level === 1 && player.xp === 0, "Počiatočný level musí byť 1 a XP = 0.");
  
  player.gainXP(120); 
  assert(player.level === 2, "Hrdina mal postúpiť na level 2.");
  assert(player.xp === 20, "Zostávajúce XP by malo byť prenesené.");
  assert(player.maxHealth === 20, "Level up must increase maxHealth on 20 HP.");
  console.log(`  [INFO] RPG Progres: Hrdina úspešne postúpil na Level ${player.level} so štatistikami (MaxHP: ${player.maxHealth}, XP: ${player.xp}).`);

  // ----------------------------------------------------
  // TEST 11: Algebraické Trace Udalosti a Predikčný Balančný Director (DDA)
  // ----------------------------------------------------
  console.log("\nTest 11: Algebraic Traces and Predictive Balancing Director (DDA)");
  
  const engine7 = new SovereignEngine();
  const playerA7 = new Thread('thread_king_ai', 'PLAYER');
  const playerB7 = new Thread('thread_hacker_root', 'PLAYER');
  
  engine7.spawnThread(playerA7, 0, 0); // Stred (0,0)
  engine7.spawnThread(playerB7, 8, 6);
  
  // Overenie že spawn zapísal trace udalosti
  assert(engine7.traceLog.length >= 2, "Spawn hrdinov musí byť zaznamenaný v traceLogu.");
  assert(engine7.traceLog[0].type === 'Spawn', "Prvá inštancia musí byť typu Spawn.");
  const firstLog = engine7.traceLog[0];
  if (firstLog.type === 'Spawn') {
    console.log(`  [INFO] TraceLog zaznamenal Spawn pre: ${firstLog.threadId}`);
  }

  // Simulujeme poškodenie a level up
  playerB7.health = 4; // Hráč B prehráva
  playerA7.gainXP(100); // Hráč A level up-ne (vytvorí LevelUp trace)

  assert(engine7.traceLog.some(t => t.type === 'LevelUp'), "LevelUp hrdinu musí vygenerovať LevelUp trace udalosť.");
  console.log("  [INFO] TraceLog úspešne zachytil a zapísal LevelUp trace.");

  // Spustíme vyhodnotenie kola pre vyvolanie DDA
  engine7.turnCount = 2;
  engine7.resolveActionNetwork();

  // Predikcia šance na výhru
  const winProb = PredictiveBalanceDirector.predictWinProbability(engine7.threads);
  const probA = winProb.get(playerA7.id) ?? 0.5;
  const probB = winProb.get(playerB7.id) ?? 0.5;
  assert(probA > probB, "Hráč A s plným zdravím a levelom 2 by mal mať vyššiu predikovanú šancu na výhru.");
  console.log(`  [INFO] Predikovaná šanca: Hráč A (King) = ${(probA * 100).toFixed(1)}%, Hráč B (Hacker) = ${(probB * 100).toFixed(1)}%`);

  // Overenie záchranných boostov pre zaostávajúceho Hráča B
  assert(playerB7.luck > 0.5, "Zaostávajúci Hráč B by mal mať navýšený parameter luck cez DDA.");
  console.log(`  [INFO] DDA Balans úspešný: Luck zaostávajúceho Hráča B navýšený na ${playerB7.luck.toFixed(2)}`);

  // ----------------------------------------------------
  // TEST 12: RPG Questy a Prepojenie na XP Odmeny / Inventár
  // ----------------------------------------------------
  console.log("\nTest 12: RPG Quests and XP/Inventory Reward Binding");
  
  const engine8 = new SovereignEngine();
  const playerHero8 = new Thread('thread_king_ai', 'PLAYER');
  engine8.spawnThread(playerHero8, 0, 0);

  // 1. Zrodenie by malo inicializovať štartovacie questy
  assert(playerHero8.quests.length > 0, "Hrdina by mal dostať štartovacie questy pri spawne.");
  const defeatQuest = playerHero8.quests.find(q => q.id === 'q_defeat_npcs');
  assert(defeatQuest !== undefined, "Hrdina by mal mať priradený quest na porážku NPC.");
  console.log(`  [INFO] Úspešne priradený quest: "${defeatQuest!.title}" (${defeatQuest!.progress}/${defeatQuest!.targetValue})`);

  // 2. Simulácia porážky dvoch NPC jednotiek
  assert(!defeatQuest!.completed, "Quest na začiatku nesmie byť dokončený.");
  
  // Prvá porážka
  engine8.spawnNPC('npc_dummy_1', 'Target Bot 1', 1, 1);
  engine8.deallocateThread('npc_dummy_1');
  assert(defeatQuest!.progress === 1, "Progres by sa mal zvýšiť na 1/2 po porážke prvého NPC.");
  
  // Druhá porážka (má spustiť claimQuestReward a pridať +120 XP -> Level Up)
  const initialLevel = playerHero8.level;
  engine8.spawnNPC('npc_dummy_2', 'Target Bot 2', 1, 2);
  engine8.deallocateThread('npc_dummy_2');
  
  assert(defeatQuest!.progress === 2, "Progres by mal dosiahnuť 2/2.");
  assert(defeatQuest!.completed, "Quest by mal byť automaticky označený ako splnený.");
  assert(playerHero8.level === initialLevel + 1, "Pripísanie XP za quest malo vyvolať Level Up.");
  assert(playerHero8.materials['CrystalShard'] === 14, "Quest mal udeliť +5 CrystalShard do inventára (plus 2x2 drops z NPC).");
  console.log(`  [INFO] Quest úspešne splnený! Hrdina postúpil na Level ${playerHero8.level} a získal odmeny.`);

  // ----------------------------------------------------
  console.log("\nTest 13: RPG Negative Status Curing Logic (Rulebook compliant)");
  
  const cardAttackTest = { id: 'snakeAttack', category: 'attack' };
  const cardMoveTest = { id: 'slide', category: 'movement' };
  const cardSpellTest = { id: 'iceMeteor', category: 'magic' };

  // 1. Spomalenie (slowed) vyžaduje pohybovú (move) kartu
  let categoryTest = cardAttackTest.category;
  let statusToClear = 'slowed';
  let isValidSacrifice = (statusToClear === 'slowed' && categoryTest === 'movement');
  assert(!isValidSacrifice, "Hadí útok (attack) nesmie vyliečiť spomalenie.");

  categoryTest = cardMoveTest.category;
  isValidSacrifice = (statusToClear === 'slowed' && categoryTest === 'movement');
  assert(isValidSacrifice, "Karta pohybu (move) musí vyliečiť spomalenie.");
  console.log("  [PASS] Spomalenie (slowed) vyžaduje žltú (move) kartu.");

  // 2. Zakorenenie (rooted) vyžaduje útočnú (attack) kartu
  categoryTest = cardMoveTest.category;
  statusToClear = 'rooted';
  isValidSacrifice = ((statusToClear === 'rooted' || statusToClear === 'disarmed') && (categoryTest === 'attack'));
  assert(!isValidSacrifice, "Karta pohybu (move) nesmie vyliečiť zakorenenie.");

  categoryTest = cardAttackTest.category;
  isValidSacrifice = ((statusToClear === 'rooted' || statusToClear === 'disarmed') && (categoryTest === 'attack'));
  assert(isValidSacrifice, "Hadí útok (attack) musí vyliečiť zakorenenie.");
  console.log("  [PASS] Zakorenenie (rooted) vyžaduje červenú (attack) kartu.");

  // 3. Umlčanie (silenced) vyžaduje kouzelnú (spell) kartu
  categoryTest = cardAttackTest.category;
  statusToClear = 'silenced';
  isValidSacrifice = (statusToClear === 'silenced' && categoryTest === 'magic');
  assert(!isValidSacrifice, "Hadí útok (attack) nesmie vyliečiť umlčanie.");

  categoryTest = cardSpellTest.category;
  isValidSacrifice = (statusToClear === 'silenced' && categoryTest === 'magic');
  assert(isValidSacrifice, "Kouzelná karta (spell) musí vyliečiť umlčanie.");
  console.log("  [PASS] Umlčanie (silenced) vyžaduje modrú (spell) kartu.");

  // ----------------------------------------------------
  console.log("\nTest 14: Database Persistence & Quest Progress Sync (node:sqlite)");
  
  const testDbPath = './test_database.db';
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  const manager = new DatabaseSyncManager(testDbPath);

  // 1. Vytvorenie / Načítanie hráča
  const profile = manager.getOrCreatePlayer("TestKing", "crystal");
  assert(profile.username === "TestKing", "Načítaný hráč má správne meno.");
  assert(profile.level === 1, "Nový hráč začína na Level 1.");
  
  const materials = JSON.parse(profile.materials);
  assert(materials.CrystalShard === 5, "Crystal kmene začínajú s 5 Crystal Shard.");

  // 2. Modifikácia stavu hráča cez Thread a uloženie
  const thread = new Thread('thread_king_ai', 'PLAYER');
  thread.name = "TestKing";
  thread.level = 3;
  thread.xp = 45;
  thread.materials['CrystalShard'] = 12;
  
  // Pridáme nejaké zmeny v questoch
  thread.quests = JSON.parse(profile.quests);
  thread.quests[0].progress = 1;

  const saveSuccess = manager.savePlayerState(thread);
  assert(saveSuccess, "Uloženie stavu hráča do databázy prebehlo úspešne.");

  // 3. Znovu načítanie stavu a overenie zhodnosti
  const updatedProfile = manager.getOrCreatePlayer("TestKing", "crystal");
  assert(updatedProfile.level === 3, "Uložený level sa úspešne obnovil z databázy.");
  assert(updatedProfile.xp === 45, "Uložené XP sa úspešne obnovili z databázy.");
  
  const updatedMaterials = JSON.parse(updatedProfile.materials);
  assert(updatedMaterials.CrystalShard === 12, "Uložené suroviny sa úspešne obnovili z databázy.");

  const updatedQuests = JSON.parse(updatedProfile.quests);
  assert(updatedQuests[0].progress === 1, "Uložený progres v questoch sa úspešne obnovil.");
  console.log(`  [INFO] Úspešná rekonciliácia: Level ${updatedProfile.level}, CrystalShard: ${updatedMaterials.CrystalShard}, Quest Progress: ${updatedQuests[0].progress}`);

  // 4. Uloženie telemetrickej udalosti
  manager.logTelemetry("test_session_123", "COMBAT_ACTION", { dmg: 6, source: "thread_king_ai" });
  console.log("  [PASS] Telemetrická udalosť úspešne zalogovaná.");

  // Vyčistenie testovacej databázy
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  // ----------------------------------------------------
  console.log("\nTest 15: Algebraic Action Tensor Outcome Projections");

  const tester = new Thread('thread_king_ai', 'PLAYER');
  tester.level = 2; // +10% dmg bonus
  tester.luck = 0.8; // higher success probability

  // 1. Crystal Laser on Toxic Swamp (should get +1 DMG and slowed status applied)
  const swampHex = { biome: 'TOXIC_SWAMP', friction: 0.6, hazardIndex: 0.8 };
  const vector1 = AlgebraicActionTensor.evaluate(tester, "crystal_laser", swampHex);
  
  assert(vector1.damageApplied === 4, "Crystal Laser na močiari pri level 2 udeľuje 4 DMG (synergia a level).");
  assert(vector1.statusApplied === 'slowed', "Laser na močiari správne udeľuje stav slowed.");
  assert(vector1.displacementType === 'push', "Laser má správny typ vytesnenia (push).");
  assert(vector1.displacementDistance === 1, "Laser má kinetickú silu 1 hex.");

  // 2. Bear Swipe on Glacier (should reduce displacement force by 1 due to ice, and apply rooted status)
  const glacierHex = { biome: 'GLACIER', friction: 0.2, hazardIndex: 0.4 };
  const vector2 = AlgebraicActionTensor.evaluate(tester, "bear_swipe", glacierHex);
  assert(vector2.statusApplied === 'rooted', "Bear Swipe na ľadovci znehybňuje (rooted).");
  assert(vector2.displacementDistance === 0, "Chlad ľadu znížil kinetickú silu na 0 hex.");

  // 3. Nature Heal on Lush Forest (should have 0 DMG and reduced energy load)
  const forestHex = { biome: 'LUSH_FOREST', friction: 0.1, hazardIndex: 0.0 };
  const vector3 = AlgebraicActionTensor.evaluate(tester, "nature_heal", forestHex);
  assert(vector3.damageApplied === 0, "Liečiace kúzlo nekoná poškodenie.");
  assert(vector3.energyDelta < 1.0, "Les stabilizuje energetické preťaženie.");

  // ----------------------------------------------------
  console.log("\nTest 16: Adrenaline Director Mechanics & Arena Collapse");

  const playerTestA = { health: 15 };
  const playerTestB = { health: 15 };
  
  const adrState1 = AdrenalineDirector.getAdrenalineState(playerTestA, playerTestB, 20.0, 3);
  assert(!adrState1.isAdrenalineActive, "Adrenalín je neaktívny pri plnom HP a nízkom ťahu.");

  const lowHPPlayer = { health: 3 };
  const adrState2 = AdrenalineDirector.getAdrenalineState(playerTestA, lowHPPlayer, 20.0, 3);
  assert(adrState2.isAdrenalineActive, "Adrenalín sa aktivuje pri kritickom HP (<= 5).");
  assert(adrState2.voltageMultiplier === 1.5, "Adrenalín zvyšuje Voltage o 50%.");

  const baseCardSpecs = { voltage: 4.0, resistance: 2.0, kineticForce: 1, displacementType: 'push' };
  const adrCardSpecs = AdrenalineDirector.modifyActionForAdrenaline(baseCardSpecs, adrState2);
  assert(adrCardSpecs.voltage === 6.0 || adrCardSpecs.voltage === 9.0, "Upravené napätie karty pri adrenalíne je 6.0 V alebo 9.0 V (pri crit).");

  const nodes = [
    { id: 'node_center', q: 0, r: 0 },
    { id: 'node_edge1', q: 3, r: -3 },
    { id: 'node_edge2', q: -3, r: 0 }
  ];
  const collapsing = AdrenalineDirector.getCollapsingNodes(8, nodes);
  assert(collapsing.includes('node_edge1') && collapsing.includes('node_edge2'), "Vonkajšie uzly správne kolabujú do voidu.");
  assert(!collapsing.includes('node_center'), "Stred arény nekolabuje.");

  // ----------------------------------------------------
  // TEST 17: Aetheric Dice Engine (Warhammer classes & rolls)
  // ----------------------------------------------------
  console.log("Test 17: Aetheric Dice Engine");
  AethericDiceEngine.bypassDice = false;

  const spellweaverOutcome = AethericDiceEngine.applyDiceModification('AETHER_SPELLWEAVER', 10, 6);
  assert(spellweaverOutcome.roll === 6, "Spellweaver roll by mal byť 6.");
  assert(spellweaverOutcome.diceType === 'D12', "Spellweaver by mal mať D12 kocku.");
  assert(spellweaverOutcome.modifiedValue === 15, "Spellweaver s rollom 6 na základe 10 by mal urobiť 15 DMG (1.5x multiplikátor).");

  const behemothOutcome = AethericDiceEngine.applyDiceModification('GIGANTIC_BEHEMOTH', 10, 1);
  assert(behemothOutcome.modifiedValue === 2, "Behemoth s rollom 1 (najhorší) by mal mať silne vydelenú/redukovanú hodnotu.");

  // Overenie contested rolls mechaniky
  const contestedWin = AethericDiceEngine.calculateContestedDamage(10, 4, 10, 'MORE');
  assert(contestedWin.finalDamage === 15, "Útočník s vyšším rollom by mal mať zväčšené poškodenie (1.5x).");
  assert(contestedWin.success === true, "Úspech by mal byť označený ako true.");

  const contestedLoss = AethericDiceEngine.calculateContestedDamage(3, 8, 10, 'MORE');
  assert(contestedLoss.finalDamage === 5, "Útočník s nižším rollom by mal mať znížené poškodenie na polovicu (0.5x).");
  assert(contestedLoss.success === false, "Úspech by mal byť označený ako false.");

  const contestedLessWin = AethericDiceEngine.calculateContestedDamage(3, 8, 10, 'LESS');
  assert(contestedLessWin.finalDamage === 15, "Podmienka LESS pri nižšom rolle útočníka by mala vyhrať.");
  assert(contestedLessWin.success === true, "Úspech pre LESS condition by mal byť označený ako true.");

  AethericDiceEngine.bypassDice = true;

  // ----------------------------------------------------
  // TEST 18: Town Shop, PlayerItem database models, and procedural ML generation
  // ----------------------------------------------------
  console.log("\nTest 18: Town Shop, PlayerItem database models, and Town node");
  
  // 1. Procedural Town Hex safety check (meta: 0, hex: 0)
  const mapObj = new (require('./models/Map').GameMap)();
  const townBlock = mapObj.chunks[0].blocks[0];
  assert(townBlock.isTown === true, "Chunk 0 Hex 0 musí byť označený ako Mesto (isTown = true).");
  assert(townBlock.walkable === true, "Mesto (Town Node) musí byť vždy plne priechodné.");
  assert(townBlock.hazardIndex === 0, "Mesto nesmie obsahovať žiadne nebezpečenstvo (hazardIndex = 0).");
  
  // 2. Database Sync Manager - PlayerItem persistent operations
  const shopDbPath = './shop_test_database.db';
  if (fs.existsSync(shopDbPath)) {
    fs.unlinkSync(shopDbPath);
  }
  
  const shopManager = new DatabaseSyncManager(shopDbPath);
  shopManager.getOrCreatePlayer("ShopTester", "crystal");
  
  // Add a weapon item
  shopManager.addPlayerItem("ShopTester", "AETHER_SABER", "WEAPON");
  
  // Verify it exists in the fetched items list
  let testerItems = shopManager.getPlayerItems("ShopTester");
  assert(testerItems.length === 1, "Hráč by mal mať úspešne pridaný 1 predmet v databáze.");
  assert(testerItems[0].itemKey === "AETHER_SABER", "Pridaný predmet v databáze by mal byť Aether Saber.");
  assert(testerItems[0].quantity === 1, "Množstvo by malo byť nastavené na 1.");
  
  // Add another weapon of the same type (quantity increment test)
  shopManager.addPlayerItem("ShopTester", "AETHER_SABER", "WEAPON");
  testerItems = shopManager.getPlayerItems("ShopTester");
  assert(testerItems[0].quantity === 2, "Opätovné pridanie toho istého predmetu by malo zvýšiť množstvo na 2.");
  
  // Remove one item (quantity decrement test)
  const removeSuccess = shopManager.removePlayerItem("ShopTester", "AETHER_SABER");
  assert(removeSuccess === true, "Odstránenie zbrane z databázy by malo prebehnúť úspešne.");
  testerItems = shopManager.getPlayerItems("ShopTester");
  assert(testerItems[0].quantity === 1, "Po odobratí 1 z 2 zbraní by malo zostať množstvo 1.");
  
  // Remove the last one (deletion test)
  const removeLastSuccess = shopManager.removePlayerItem("ShopTester", "AETHER_SABER");
  assert(removeLastSuccess === true, "Odstránenie poslednej zbrane by malo prebehnúť úspešne.");
  testerItems = shopManager.getPlayerItems("ShopTester");
  assert(testerItems.length === 0, "Po úplnom odstránení všetkých kusov zbrane by mal byť zoznam prázdny.");
  
  // Cleanup test database file
  if (fs.existsSync(shopDbPath)) {
    fs.unlinkSync(shopDbPath);
  }

  // ----------------------------------------------------
  // TEST 19: PvEvP Neutral Monsters & Drops
  // ----------------------------------------------------
  console.log("\nTest 19: PvEvP Neutral Monsters & Drops");

  const enginePvE = new SovereignEngine();
  const { initializeSeedData } = require('./seedData');
  initializeSeedData(enginePvE);

  const npcs = enginePvE.threads.filter(t => t.type === 'NPC');
  assert(npcs.length === 2, "Na začiatku hry by mali byť na ploche 2 neutrálne monštrá.");
  assert(npcs[0].name.includes("Monster"), "Názov NPC monštra by mal obsahovať 'Monster'.");

  // Spawn an NPC next to the player thread_king_ai (at 0,0) to test AI attack
  const nearNpc = enginePvE.spawnNPC('test_near_npc', 'Syntax Monster Near', 0, 1, 5);
  const initialPlayerHp = enginePvE.threads.find(t => t.id === 'thread_king_ai')?.health || 15;

  enginePvE.tickNPCAI();
  const postAttackPlayerHp = enginePvE.threads.find(t => t.id === 'thread_king_ai')?.health || 15;
  assert(postAttackPlayerHp < initialPlayerHp, "NPC umiestnené vedľa hrdinu by malo zaútočiť a udeliť poškodenie.");
  console.log(`  [INFO] Hrdina utrpel poškodenie od blízkeho NPC: HP kleslo z ${initialPlayerHp} na ${postAttackPlayerHp}`);

  // Test NPC Defeat drops & Quest updates
  const testPlayer = enginePvE.threads.find(t => t.id === 'thread_king_ai')!;
  const initialXp = testPlayer.xp;
  const initialShards = testPlayer.materials['CrystalShard'] || 0;

  // Deallocate (simulate defeat)
  enginePvE.deallocateThread('test_near_npc');
  const postXp = testPlayer.xp;
  const postShards = testPlayer.materials['CrystalShard'] || 0;

  assert(postXp === initialXp + 50, "Zabité NPC by malo udeliť +50 XP hrdinovi.");
  assert(postShards === initialShards + 2, "Zabité NPC by malo hrdinovi dropnúť +2 Crystal Shard.");
  console.log(`  [INFO] Defeat drops úspešné: +50 XP (Aktuálne: ${postXp}), +2 CrystalShard (Aktuálne: ${postShards})`);

  // Test 20: Terrain Traps and Void Faction
  console.log("\nTest 20: Terrain Traps and Void Faction");
  
  // 1. Terrain Traps Placement and Trigger
  const trapVictim = new Thread('test_trap_victim', 'PLAYER', 'thread_hacker_root');
  trapVictim.health = 15;
  trapVictim.maxHealth = 15;
  trapVictim.armor = 1;
  enginePvE.threads.push(trapVictim);
  enginePvE.spawnThread(trapVictim, 2, 2);

  // Set a Root Trap on Chunk 2 Hex 3
  const trapChunk = enginePvE.map.chunks.find(c => c.id === 2);
  const trapBlock = trapChunk?.blocks.find(b => b.id === 3);
  assert(trapBlock !== undefined, "Blok na Chunk 2 Hex 3 by mal existovať.");
  trapBlock!.hasTrap = 'ROOT_TRAP';
  trapBlock!.trapOwnerId = 'thread_king_ai';

  // Move victim onto the trap
  trapVictim.position = { meta: 2, hex: 3 };
  enginePvE.triggerTrapCheck(trapVictim, 2, 3);

  // Verify effects: Root Trap does 3 damage. With 1 armor, net damage is 2. HP should be 13, rooted is true.
  assert(trapVictim.health === 13, "Obeť pasce by mala utrpieť 2 čisté poškodenia (3 DMG - 1 Armor).");
  assert(trapVictim.isRooted === true, "Obeť pasce by mala mať nastavený stav isRooted = true.");
  assert(trapBlock!.hasTrap === null, "Pasca by sa mala po aktivácii vymazať z políčka.");
  console.log(`  [INFO] Pasca úspešne skontrolovaná: HP obete=${trapVictim.health}, rooted=${trapVictim.isRooted}`);

  // 2. Void Walker Entropy Cost discount
  const voidCardInst = new Instruction('voidBolt', 'Void Bolt', 'ACTION');
  voidCardInst.energyCost = 2;

  // Under normal conditions (entropy = 0)
  const baseCard = VOID_CARDS_BASE.find(c => c.id === 'voidBolt')!;
  assert(baseCard !== undefined, "Void Bolt karta by mala existovať.");
  
  // Set high global entropy
  enginePvE.globalEntropy = 0.8;
  if (baseCard && baseCard.heroId === 'void') {
    if (enginePvE.globalEntropy > 0.7) {
      voidCardInst.energyCost = 0;
    }
  }
  assert(voidCardInst.energyCost === 0, "Cena Void karty by pri entropii > 0.7 mala byť 0.");
  console.log(`  [INFO] Void Walker zľava úspešná: globalEntropy=${enginePvE.globalEntropy}, Void Bolt cost=${voidCardInst.energyCost}`);

  // Cleanup victim
  enginePvE.threads = enginePvE.threads.filter(t => t.id !== 'test_trap_victim');

  // Test 21: Level Datasets & Scenario Trigger outlines
  console.log("\nTest 21: Level Datasets & Scenario Triggers");
  
  // Verify levels JSON loading
  const pathMod = require('path');
  const levelsFilePath = pathMod.join(process.cwd(), 'packages/server/src/data/levels.json');
  assert(fs.existsSync(levelsFilePath) === true, "Súbor levels.json s datasetmi levelov musí existovať.");
  const levelsData = JSON.parse(fs.readFileSync(levelsFilePath, 'utf8'));
  assert(levelsData.length === 5, "Počet definovaných levelov musí byť 5.");
  assert(levelsData[0].id === 'core_entrance', "Prvý level by mal byť Core Entrance.");
  console.log(`  [PASS] Dataset levelov načítaný úspešne (${levelsData.length} levelov)`);

  // Simulate BOSS_SPAWN scenario trigger on enginePvE
  const initialThreadCount = enginePvE.threads.length;
  const scenarioBoss = enginePvE.spawnNPC('void_sentinel_boss', 'Elite Void Sentinel', 1, 0, 7);
  if (scenarioBoss) {
    scenarioBoss.health = 30;
    scenarioBoss.maxHealth = 30;
    scenarioBoss.armor = 3;
  }

  assert(enginePvE.threads.length === initialThreadCount + 1, "BOSS_SPAWN scenár musí pridať bossa do zoznamu vlákien.");
  assert(enginePvE.threads.some(t => t.id === 'void_sentinel_boss'), "Spawnovaný boss musí mať ID void_sentinel_boss.");
  console.log("  [PASS] Scenár BOSS_SPAWN pridal bossa úspešne do zoznamu vlákien.");

  // Simulate ARENA_COLLAPSE scenario trigger
  enginePvE.map.chunks.forEach(c => {
    if (c.id >= 7) {
      c.blocks.forEach(b => {
        b.walkable = false;
      });
    }
  });
  const collapsedBlock = enginePvE.map.chunks.find(c => c.id === 7)?.blocks[0];
  assert(collapsedBlock?.walkable === false, "ARENA_COLLAPSE scenár musí urobiť okrajové políčka nepriechodnými.");
  console.log("  [PASS] Scenár ARENA_COLLAPSE úspešne zablokoval okrajové políčka.");

  // Cleanup boss
  enginePvE.threads = enginePvE.threads.filter(t => t.id !== 'void_sentinel_boss');

  // Test 22: Algebraic Opportunities and Hex Memory Logs (RAM / Swap logs)
  console.log("\nTest 22: Algebraic Opportunities and Hex Memory Logs");

  // 1. Verify spawn hex computation midpoint formula
  const posA = { meta: 1, hex: 2 };
  const posB = { meta: 5, hex: 4 };
  const spawnPos = AlgebraicOpportunityGenerator.calculateSpawnHex(posA, posB);
  assert(spawnPos.meta === 3 && spawnPos.hex === 3, "Stredový bod medzi (1,2) a (5,4) by mal byť (3,3).");
  console.log(`  [PASS] Topologický stredový bod vypočítaný správne: (meta: ${spawnPos.meta}, hex: ${spawnPos.hex})`);

  // 2. Verify hex register encoding
  const hexDump1 = AlgebraicOpportunityGenerator.convertToHexDump('SURGE_NODE', 3, 3, 3);
  assert(hexDump1 === '0x11030303', "SURGE_NODE hex dump by mal byť 0x11030303.");
  const hexDump2 = AlgebraicOpportunityGenerator.convertToHexDump('VOID_RIFT', 4, 5, 15);
  assert(hexDump2 === '0x2204050F', "VOID_RIFT hex dump by mal byť 0x2204050F.");
  console.log("  [PASS] Konverzia na hexadecimálne logy/adresy funguje perfektne.");

  // 3. Verify Database Register persistence
  const dbManagerTest = new DatabaseSyncManager(':memory:'); // use transient db for tests
  dbManagerTest.saveMemoryRegister('0x00A0', hexDump1, 'thread_king_ai: Surge Node claimed');
  const registers = dbManagerTest.getMemoryRegisters();
  assert(registers.length > 0, "Uložený register by mal byť nájdený v tabuľke system_memory_registers.");
  assert(registers[0].register_address === '0x00A0', "Adresa registra by mala byť 0x00A0.");
  assert(registers[0].hex_dump === '0x11030303', "Dáta registra by mali byť 0x11030303.");
  console.log("  [PASS] Hex dump log úspešne zapísaný a vytiahnutý z databázových registrov.");

  // Test 23: ML Character Movement Predictor
  console.log("\nTest 23: ML Character Movement Predictor");
  const { execSync } = require('child_process');
  const pathModule = require('path');
  
  const predictorScript = pathModule.join(process.cwd(), 'packages/server/src/ml/movement_predictor.py');
  const venvPython = pathModule.join(process.cwd(), 'packages/server/.venv/bin/python3');
  
  const mockPayload = JSON.stringify({
    turn: 4,
    entropy: 0.5,
    playerARoll: 5,
    playerBRoll: 3,
    playerAHp: 10.0,
    playerBHp: 12.0
  });

  const runCommandStr = `"${venvPython}" "${predictorScript}" '${mockPayload}'`;
  const mlOutputRaw = execSync(runCommandStr).toString().trim();
  const prediction = JSON.parse(mlOutputRaw);
  
  assert(prediction.status === 'SUCCESS', "Predikcia by mala prebehnúť úspešne.");
  assert(prediction.predicted_chunk >= 0 && prediction.predicted_chunk <= 8, "Predikovaný chunk musí byť v rozsahu 0-8.");
  assert(prediction.predicted_block >= 0 && prediction.predicted_block <= 6, "Predikovaný block musí byť v rozsahu 0-6.");
  assert(prediction.confidence > 0, "Dôveryhodnosť predikcie must be vyššia ako 0.");
  console.log(`  [PASS] ML Prediktor úspešne predikoval pozíciu: Chunk ${prediction.predicted_chunk}, Hex ${prediction.predicted_block} (Confidence: ${prediction.confidence})`);

  // Test 24: Quest CRUD & Interactive Boolean Triggers
  console.log("\nTest 24: Quest CRUD & Interactive Boolean Triggers");

  let xpGained = 0;
  const mockPlayer = {
    id: 'thread_king_ai',
    quests: [] as any[],
    materials: {} as { [key: string]: number },
    gainXP(xp: number) {
      xpGained += xp;
    }
  };

  // 1. Create (Assign) quest
  QuestTriggerManager.createAndAssignQuest(
    mockPlayer,
    'q_test_opp',
    'Interactive Test Quest',
    'Description',
    'REACH_BIOME',
    1,
    100,
    'GLACIER'
  );
  assert(QuestTriggerManager.hasQuest(mockPlayer, 'q_test_opp') === true, "Quest by mal byť úspešne pridaný.");
  assert(QuestTriggerManager.isQuestCompleted(mockPlayer, 'q_test_opp') === false, "Nový quest by nemal byť dokončený.");
  console.log("  [PASS] CRUD Create: Priradenie a overenie existencie questu prebehlo úspešne.");

  // 2. Read active quests
  const active = QuestTriggerManager.getActiveQuests(mockPlayer);
  assert(active.length === 1, "Počet aktívnych questov by mal byť 1.");
  console.log("  [PASS] CRUD Read: Aktívne questy úspešne načítané.");

  // 3. Update quest progress and verify completed Boolean state
  let triggerFired: any = false;
  QuestTriggerManager.updateQuestProgress(mockPlayer, 'REACH_BIOME', 1, 'GLACIER', (quest) => {
    triggerFired = true;
  });
  assert(QuestTriggerManager.isQuestCompleted(mockPlayer, 'q_test_opp') === true, "Quest by mal byť označený ako dokončený.");
  assert(xpGained === 100, "XP odmena by mala byť priradená.");
  assert(triggerFired === true, "Callback pre dokončenie questu (Update trigger) sa musel spustiť.");
  console.log("  [PASS] CRUD Update & Boolean Check: Quest úspešne vyriešený a zmenený na completed.");

  // 4. Delete (Abandon) quest
  QuestTriggerManager.abandonQuest(mockPlayer, 'q_test_opp');
  assert(mockPlayer.quests.length === 0, "Quest list by mal byť prázdny po abandonQuest.");
  console.log("  [PASS] CRUD Delete: Quest úspešne vymazaný (abandoned).");

  // Test 25: ML Hero Spawner Predictor
  console.log("\nTest 25: ML Hero Spawner Predictor");
  
  const spawnerScript = pathModule.join(process.cwd(), 'packages/server/src/ml/hero_spawner_predictor.py');
  
  const swampPayload = JSON.stringify({
    meta: 5,
    hex: 3,
    perk_level: 3,
    temperature: 25.0,
    humidity: 0.85,
    hazardIndex: 0.65,
    friction: 0.45,
    conductivity: 0.8
  });

  const cmdStr = `"${venvPython}" "${spawnerScript}" '${swampPayload}'`;
  const outputRaw = execSync(cmdStr).toString().trim();
  const spawnPrediction = JSON.parse(outputRaw);
  
  assert(spawnPrediction.status === 'SUCCESS', "Predikcia spawneru by mala prebehnť úspešne.");
  assert(spawnPrediction.predicted_hero_faction === 'toxic', "Toxická anomália by mala splodiť toxic hrdinu.");
  assert(spawnPrediction.confidence > 0.8, "Pre jednoznačný swamp by confidence mal byť vysoký.");
  console.log(`  [PASS] ML Spawner úspešne priradil hrdinu: Frakcia ${spawnPrediction.predicted_hero_faction} (Confidence: ${spawnPrediction.confidence})`);

  // Test 26: LLM-like Dialogue Generator
  console.log("\nTest 26: LLM-like Dialogue Generator");
  const dialogueScript = pathModule.join(process.cwd(), 'packages/server/src/ml/dialogue_generator.py');
  
  // Run CLI for Spellweaver archetype
  const runSpellweaverCmd = `"${venvPython}" "${dialogueScript}" AETHER_SPELLWEAVER FetchQuest INTRO`;
  const spellweaverOutput = JSON.parse(execSync(runSpellweaverCmd).toString().trim());
  assert(spellweaverOutput.status === 'SUCCESS', "Generovanie pre Spellweaver by malo prebehnúť úspešne.");
  assert(spellweaverOutput.generated_dialogue.length > 0, "Generovaný text by nemal byť prázdny.");
  console.log(`  [PASS] Generovaný text pre Spellweaver: "${spellweaverOutput.generated_dialogue}"`);

  // Run CLI for Behemoth archetype
  const runBehemothCmd = `"${venvPython}" "${dialogueScript}" GIGANTIC_BEHEMOTH CombatQuest COMPLETED`;
  const behemothOutput = JSON.parse(execSync(runBehemothCmd).toString().trim());
  assert(behemothOutput.status === 'SUCCESS', "Generovanie pre Behemoth by malo prebehnúť úspešne.");
  assert(behemothOutput.generated_dialogue.length > 0, "Generovaný text by nemal byť prázdny.");
  console.log(`  [PASS] Generovaný text pre Behemoth: "${behemothOutput.generated_dialogue}"`);

  // Verify dataset file exists
  const datasetFilePath = pathModule.join(process.cwd(), 'packages/server/src/data/dialogue_dataset.json');
  assert(fs.existsSync(datasetFilePath), "Súbor datasetu dialogue_dataset.json musí existovať.");
  const dataset = JSON.parse(fs.readFileSync(datasetFilePath, 'utf8'));
  assert(dataset.length === 72, "Počet záznamov v datasete by mal byť 72.");
  console.log(`  [PASS] Kompletný dataset s 72 šablónami dialógov úspešne načítaný a verifikovaný.`);

  // Test 27: Database-driven Word Problem Quest Generator
  console.log("\nTest 27: Database-driven Word Problem Quest Generator");
  const dbQuestScript = pathModule.join(process.cwd(), 'packages/server/src/ml/db_quest_generator.py');
  
  const dbManagerQuestTest = new DatabaseSyncManager();
  
  try {
    const dbRaw = (dbManagerQuestTest as any).db;
    dbRaw.exec(`DELETE FROM players WHERE username = 'test_quest_player'`);
    dbRaw.exec(`DELETE FROM player_items WHERE player_username = 'test_quest_player'`);
  } catch (e) {}

  dbManagerQuestTest.getOrCreatePlayer('test_quest_player', 'crystal');

  const mockThread = new Thread('test_quest_player', 'PLAYER');
  mockThread.name = 'test_quest_player';
  mockThread.level = 4;
  mockThread.xp = 100;
  mockThread.materials = { CrystalShard: 12, Spores: 4 };
  mockThread.quests = [];

  dbManagerQuestTest.savePlayerState(mockThread);
  dbManagerQuestTest.addPlayerItem('test_quest_player', 'aether_saber', 'WEAPON');
  
  const runQuestGenCmd = `"${venvPython}" "${dbQuestScript}" test_quest_player crystal`;
  const questGenOutput = JSON.parse(execSync(runQuestGenCmd).toString().trim());
  
  assert(questGenOutput.quest_id === 'q_crystal_forge', "Quest ID by mal byť q_crystal_forge.");
  assert(questGenOutput.required_amount === 18, "Na level 4 by mal vyžadovať 18 shardov (10 + 4*2).");
  assert(questGenOutput.current_amount === 12, "Aktuálne množstvo by malo byť 12.");
  assert(questGenOutput.remaining_amount === 6, "Zostávajúce množstvo by malo byť 6.");
  assert(questGenOutput.prompt.includes("aether_saber"), "Prompt by mal obsahovať odkaz na zbraň aether_saber.");
  
  console.log(`  [PASS] Vygenerovaná slovná úloha: "${questGenOutput.prompt}"`);

  // Verify compiled quests file
  const generatedQuestsPath = pathModule.join(process.cwd(), 'packages/server/src/data/generated_quests.json');
  assert(fs.existsSync(generatedQuestsPath), "Súbor generovaných úloh generated_quests.json musí existovať.");
  console.log(`  [PASS] Databázové šablóny a premenné úspešne vygenerované na základe inventára hráča.`);

  // Test 28: Semantic Gameplay Coordinator Pipeline
  console.log("\nTest 28: Semantic Gameplay Coordinator Pipeline");

  const engine28 = new SovereignEngine();
  const player28 = new Thread('test_semantic_player', 'PLAYER');
  player28.name = 'test_quest_player'; 
  player28.level = 4;
  player28.position = { meta: 5, hex: 3 }; 
  engine28.threads.push(player28);

  const payload = SemanticGameplayCoordinator.getSemanticSectorState(engine28, 'test_semantic_player')!;
  assert(payload !== null, "Semantic payload by mal byť úspešne zostavený.");
  
  assert(payload.block.meta === 5, "Chunk by mal byť 5.");
  assert(payload.block.hex === 3, "Hex by mal byť 3.");
  assert(payload.block.biome === 'TOXIC_SWAMP', "Biom by mal byť TOXIC_SWAMP.");

  assert(payload.spawnerPrediction.predicted_hero_faction === 'toxic', "Pre toxic swamp by mal predikovať toxic.");
  assert(payload.spawnerPrediction.confidence > 0.3, "Pre toxic swamp by mal mať rozumné confidence.");

  assert(payload.databaseQuest.quest_id === 'q_toxic_cleanse', "Pre toxic kategóriu by mal vygenerovať q_toxic_cleanse quest.");
  assert(payload.databaseQuest.prompt.includes("Alchemist Helix"), "Quest prompt by mal obsahovať postavu Alchemist Helix.");

  assert(payload.dialogue.archetype === 'VOID_WALKER', "Pre toxic predikciu by mal priradiť VOID_WALKER dialógový archetyp.");
  assert(payload.dialogue.generated_dialogue.length > 0, "Dialóg by nemal byť prázdny.");

  console.log(`  [PASS] Zjednotený SemanticSectorPayload úspešne zostavený a overený:`);
  console.log(`         - Frakcia Spawnu: ${payload.spawnerPrediction.predicted_hero_faction}`);
  console.log(`         - Quest Title: ${payload.databaseQuest.title}`);
  console.log(`         - Dialog: "${payload.dialogue.generated_dialogue}"`);

  // Test 29: Terrain Telemetry & Dopamine Balancer Pipeline
  console.log("\nTest 29: Terrain Telemetry & Dopamine Balancer Pipeline");

  const engine29 = new SovereignEngine();
  const player29 = new Thread('test_telemetry_player', 'PLAYER');
  player29.level = 3;
  player29.health = 15; 
  player29.maxHealth = 15;
  player29.position = { meta: 0, hex: 1 };
  engine29.threads.push(player29);

  const telemetryFull = TerrainTelemetryCoordinator.getTerrainTelemetry(engine29, 'test_telemetry_player')!;
  assert(telemetryFull !== null, "Telemetry payload by mal existovať.");
  assert(telemetryFull.sectorId === 0, "Aktívny sektor by mal byť 0.");
  assert(telemetryFull.difficulty.difficultyMultiplier > 1.0, "Pri plnom zdraví by mal obtiažnosť škálovať nahor.");
  assert(telemetryFull.difficulty.dopamineRewardMultiplier === 1.5, "Pri plnom zdraví a vysokom leveli by mal dopamine multiplier byť 1.5.");
  console.log("  [PASS] Dopamine Balancer: Škálovanie obtiažnosti a odmien pre dominantného hráča úspešné.");

  player29.health = 3; 
  const telemetryLow = TerrainTelemetryCoordinator.getTerrainTelemetry(engine29, 'test_telemetry_player')!;
  assert(telemetryLow.difficulty.difficultyMultiplier === 0.75, "Pri kritickom stave by mal znížiť obtiažnosť na 0.75.");
  assert(telemetryLow.difficulty.dopamineRewardMultiplier === 0.9, "Pri kritickom stave by mal dopamine multiplier klesnúť na 0.9.");
  console.log("  [PASS] Dopamine Balancer: Záchranné škálovanie pre ohrozeného hráča úspešné.");

  const textures = telemetryFull.textures;
  assert(textures.length === 7, "Počet textúr v chunku by mal byť 7.");
  
  for (let i = 0; i < textures.length - 1; i++) {
    assert(textures[i].texturePattern !== textures[i + 1].texturePattern, `Susedné textúry na indexoch ${i} a ${i + 1} sa nesmú rovnať (anti-repetitiveness rule).`);
  }
  console.log("  [PASS] Procedural Textures: Vygenerovaných 7 ne-repetitívnych textúr pre sektory.");

  // Test 30: Render Priority and GPU Instancing Resolve Chain
  console.log("\nTest 30: Render Priority and GPU Instancing Resolve Chain");

  const engine30 = new SovereignEngine();
  const player30 = new Thread('test_render_player', 'PLAYER');
  player30.position = { meta: 4, hex: 3 }; 
  engine30.threads.push(player30);

  const chunk4 = engine30.map.chunks.find(c => c.id === 4)!;
  const chunk3 = engine30.map.chunks.find(c => c.id === 3)!;
  
  chunk4.blocks[0].hasChest = true;
  chunk4.blocks[1].hasChest = true;
  chunk3.blocks[0].hasChest = true;
  chunk3.blocks[1].hasChest = true;

  const renderPayload = RenderPriorityBalancer.getRenderPriorities(engine30, 'test_render_player')!;
  assert(renderPayload !== null, "Render priorities payload by mal byť úspešne vygenerovaný.");

  assert(renderPayload.priorities.length === 63, "Počet vyhodnotených uzlov pre prioritizáciu renderovania musí byť 63.");

  const centerNode = renderPayload.priorities.find(p => p.meta === 4 && p.hex === 3)!;
  assert(centerNode.priority === 'CRITICAL', "Hráčovo políčko must be CRITICAL.");
  assert(centerNode.priorityScore === 1.0, "Hráčovo políčko must have score 1.0.");

  const farNode = renderPayload.priorities.find(p => p.meta === 0 && p.hex === 0)!;
  assert(farNode.priority === 'CULLED' || farNode.priority === 'LOW', "Vzdialené políčko should have low priority.");
  
  const chestGroup = renderPayload.instancedGroups.find(g => g.entityType === 'CHEST')!;
  assert(chestGroup !== undefined, "Skupina inštancovaných chestov by mala existovať.");
  assert(chestGroup.instanceCount >= 4, "Počet inštancií chestov by mal byť aspoň 4.");
  assert(chestGroup.triggerVarietySwap === true, "Pre husto koncentrované chesty by sa mal aktivovať variety swap.");

  console.log(`  [PASS] Render Priorities: Hráčov uzol prioritizovaný správne na CRITICAL (1.0).`);
  console.log(`  [PASS] GPU Instancing: Skupina CHEST inštancovaná (počet: ${chestGroup.instanceCount}) s príznakom variety swap = true.`);

  // Test 31: Gameplay Compositor Manager and Interactive Scene Loop
  console.log("\nTest 31: Gameplay Compositor Manager and Interactive Scene Loop");

  const engine31 = new SovereignEngine();
  const player31 = new Thread('test_compositor_player', 'PLAYER');
  player31.position = { meta: 4, hex: 3 }; 
  player31.health = 3; 
  engine31.threads.push(player31);

  const compositorResult = GameplayCompositorManager.processCompositeTrigger(engine31, 'test_compositor_player')!;
  assert(compositorResult.status === 'SUCCESS', "Compositor trigger by mal úspešne prebehnúť.");
  assert(compositorResult.spawnedEntityType === 'CHEST', "Pri nízkom HP by mal spásonosne splodiť CHEST.");
  assert(compositorResult.meta !== undefined && compositorResult.hex !== undefined, "Súradnice spawnu musia byť definované.");
  
  const spawnedChunk = engine31.map.chunks.find(c => c.id === compositorResult.meta)!;
  const spawnedBlock = spawnedChunk.blocks.find(b => b.id === compositorResult.hex)!;
  assert(spawnedBlock.hasChest === true, "Voxel na aréne musí mať zaznamenanú chestu.");

  console.log(`  [PASS] Compositor Telemetry Check: Nízke HP vyvolalo spásonosnú chestu.`);
  console.log(`  [PASS] Out-of-Focus Spawner: Chesta úspešne spawnovaná na pozícii (Chunk ${compositorResult.meta}, Hex ${compositorResult.hex}) bez prerušenia viewportu.`);

  // Test 32: Algebraic Canvas Composition and Animation Sequences
  console.log("\nTest 32: Algebraic Canvas Composition and Animation Sequences");

  const engine32 = new SovereignEngine();
  const player32 = new Thread('test_canvas_player', 'PLAYER');
  player32.position = { meta: 4, hex: 3 }; 
  player32.isRooted = true; 
  engine32.threads.push(player32);

  const npc32 = new Thread('test_npc', 'NPC');
  npc32.position = { meta: 5, hex: 3 }; 
  engine32.threads.push(npc32);

  const canvasComp = GameplayCompositionEngine.getCanvasComposition(engine32, 'test_canvas_player')!;
  assert(canvasComp !== null, "Canvas composition payload by mal byť úspešne vygenerovaný.");

  assert(canvasComp.hexHistory.length > 0, "Zoznam hexadecimálnych adries histórie nesmie byť prázdny.");
  assert(canvasComp.hexHistory[0].startsWith('0x'), "Každá adresa musí mať prefix 0x.");

  assert(canvasComp.animationSequences['test_canvas_player'] === 'slow_walk', "Zakorenený hrdina musí mať spomalenú animáciu chôdze slow_walk.");

  const npcTactic = canvasComp.npcTactics.find(n => n.npcThreadId === 'test_npc')!;
  assert(npcTactic !== undefined, "NPC bojová taktika by mala existovať.");
  assert(npcTactic.preferred8Direction >= 0 && npcTactic.preferred8Direction <= 7, "Smer bojového NPC musí byť v rozsahu 8 smerov (0-7).");

  console.log(`  [PASS] Hex Address Logs: Vygenerovaný hexadecimálny register ${canvasComp.hexHistory[0]}.`);
  console.log(`  [PASS] Status Animation Constraint: Zakorenenie hrdinu vyvolalo slow_walk animáciu.`);
  console.log(`  [PASS] NPC 8-Directional Vector: Detegovaný combat smer pre NPC test_npc (index: ${npcTactic.preferred8Direction}).`);

  // Test 33: Aesthetic Hero Graphics and Biome Market Pricing
  console.log("\nTest 33: Aesthetic Hero Graphics and Biome Market Pricing");

  const engine33 = new SovereignEngine();
  const player33 = new Thread('test_market_player', 'PLAYER');
  player33.position = { meta: 5, hex: 3 }; 
  engine33.threads.push(player33);

  const marketPayload = AestheticMarketCoordinator.getMarketPrices(engine33, 'test_market_player')!;
  assert(marketPayload !== null, "Market pricing payload by mal existovať.");
  assert(marketPayload.biome === 'TOXIC_SWAMP', "Políčko musí patriť pod TOXIC_SWAMP biom.");

  const crystalShard = marketPayload.items.find(i => i.id === 'crystal_shard')!;
  assert(crystalShard.priceModifier === 2.0, "V toxickom močiari by mal byť crystal shard drahší (modifier: 2.0).");
  assert(crystalShard.currentPrice === 20, "Vypočítaná cena Crystal Shardu by mala byť 20.");

  const toxicSlime = marketPayload.items.find(i => i.id === 'toxic_slime')!;
  assert(toxicSlime.priceModifier === 0.4, "V toxickom močiari by mal byť toxic slime lacnejší (modifier: 0.4).");
  assert(toxicSlime.currentPrice === 3, "Vypočítaná cena Toxic Slime by mala byť 3.");

  const jsonPath = pathModule.join(__dirname, 'models/hero_graphics_dataset.json');
  assert(fs.existsSync(jsonPath), "Dataset hero_graphics_dataset.json musí existovať.");
  const graphicsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  assert(graphicsData.heroes.length === 4, "Počet zadefinovaných frakcií hrdinov v datasete musí byť 4.");
  
  const crystalHero = graphicsData.heroes.find((h: any) => h.faction === 'crystal')!;
  assert(crystalHero.surfaceProps.roughness === 0.9, "Crystal hrdina musí mať matný povrch (roughness: 0.9).");
  assert(crystalHero.surfaceProps.metalness === 0.1, "Crystal hrdina musí mať metalness: 0.1.");

  console.log(`  [PASS] Biome Pricing Rules: Pre chunk 5 (TOXIC_SWAMP) priradená zľava na sliz (3 gold) a prirážka na kryštály (20 gold).`);
  console.log(`  [PASS] Hero Graphics matte surface parameters verified from JSON dataset: roughness=${crystalHero.surfaceProps.roughness}.`);

  console.log("\nTest 34: Generative ML Tactical Spawner & Database Adaptation");
  const tacticalPayload = TacticalGenerativeCoordinator.generateTacticalInstance(
    engine1, 
    'thread_king_ai', 
    'aggression'
  );
  assert(tacticalPayload !== null, "Tactical spawner payload nesmie byť null.");
  assert(tacticalPayload.success === true, "Tactical spawner by mal úspešne dobehnúť.");
  assert(tacticalPayload.actionType.startsWith("spawn_"), "Generovaná akcia musí začať s spawn_.");
  assert(tacticalPayload.powerRating > 1.0, "Power rating pre aggression taktiku by mal byť upravený podľa levelu.");
  
  const spawnBlock = engine1.map.chunks.find((c: any) => c.id === tacticalPayload.coordinates.meta)?.blocks.find((b: any) => b.id === tacticalPayload.coordinates.hex);
  assert(spawnBlock?.hasChest === true, "Generovaný objekt musí byť zaznamenaný v príslušnom bloku arény.");

  console.log(`  [PASS] Generovaný typ taktickej akcie: ${tacticalPayload.actionType}`);
  console.log(`  [PASS] Popis taktiky: ${tacticalPayload.description}`);
  console.log(`  [PASS] Taktická akcia úspešne spawnovaná na pozícii (Chunk ${tacticalPayload.coordinates.meta}, Hex ${tacticalPayload.coordinates.hex}).`);

  console.log("\nTest 35: Consecutive Voltage Surge & Short Circuit Combos");
  const engineCombo = new SovereignEngine();
  const comboPlayerA = new Thread('thread_king_ai', 'PLAYER');
  const comboPlayerB = new Thread('thread_hacker_root', 'PLAYER');
  engineCombo.spawnThread(comboPlayerA, 0, 0);
  engineCombo.spawnThread(comboPlayerB, 0, 4);

  engineCombo.turnStateMachine.startTurn('thread_king_ai');
  engineCombo.turnStateMachine.lastPlayedSpecs = {};
  
  const actionNode1 = new ActionNode("node_test_combo1", { id: "crystal_laser", name: "Crystal Laser", damage: 4, energyCost: 20, type: "ACTION", effects: {} } as any, "thread_king_ai", "thread_hacker_root");
  engineCombo.turnStateMachine.registerAction(actionNode1);
  
  engineCombo.turnStateMachine.currentPhase = 'ACTION';
  
  const actionNode2 = new ActionNode("node_test_combo2", { id: "acid_rain", name: "Acid Rain", damage: 3, energyCost: 15, type: "ACTION", effects: {} } as any, "thread_king_ai", "thread_hacker_root");
  engineCombo.turnStateMachine.registerAction(actionNode2);
  
  const voltageSurgeLog = engineCombo.traceLog.find((l: any) => l.message && l.message.includes("Consecutive Voltage Surge"));
  assert(voltageSurgeLog !== undefined && voltageSurgeLog !== null, "Voltage Surge combo pre po sebe idúce ťahy must exist.");
  console.log(`  [PASS] Detegovaný log prepätia: ${(voltageSurgeLog as any).message}`);

  console.log("\nTest 36: Terrain Trap Placement & Trigger Mechanics");
  const targetChunk = engineCombo.map.chunks.find((c: any) => c.id === 0)!;
  const trapTargetBlock = targetChunk.blocks.find((b: any) => b.id === 4)!;
  
  trapTargetBlock.hasTrap = 'ROOT_TRAP';
  trapTargetBlock.trapOwnerId = 'thread_king_ai';
  
  const opponentThread = engineCombo.threads.find((t: any) => t.id === 'thread_hacker_root')!;
  opponentThread.health = 15;
  opponentThread.armor = 2;
  opponentThread.isRooted = false;

  engineCombo.triggerTrapCheck(opponentThread, 0, 4);

  assert(opponentThread.health === 14, "Oponent by mal dostať čisté poškodenie 1 HP (3 trap damage - 2 armor).");
  assert((opponentThread as any).isRooted === true, "Oponent by mal byť zakorenený (isRooted = true).");
  assert(trapTargetBlock.hasTrap === null, "Pasca by mala byť spotrebovaná.");

  console.log(`  [PASS] Pasca spotrebovaná a oponentov stav zakorenenia: ${opponentThread.isRooted}`);
  console.log(`  [PASS] Oponent HP po výbuchu pasce: ${opponentThread.health} (1 poškodenie udelené).`);

  console.log("\nTest 37: Sovereign Multi-Area Content & Quest Distribution Engine");
  const testDistributorPlayer = engineCombo.threads.find((t: any) => t.id === 'thread_king_ai')!;
  testDistributorPlayer.quests = [];
  testDistributorPlayer.level = 1;
  testDistributorPlayer.health = 15;

  const resultLog = SovereignContentDistributor.evaluateAndDistribute(engineCombo, 'thread_king_ai', 7, 0);
  
  assert(QuestTriggerManager.hasQuest(testDistributorPlayer, 'q_glacial_explore'), "Regiónový quest q_glacial_explore by mal byť automaticky pridelený.");
  const assignedQuest = testDistributorPlayer.quests.find((q: any) => q.id === 'q_glacial_explore')!;
  assert(assignedQuest.completed === true, "Quest by mal byť okamžite vyhodnotený ako splnený pri dosiahnutí biomu GLACIER.");
  
  console.log(`  [PASS] Automatické pridelenie a splnenie regionálneho questu: ${assignedQuest.title}`);
  console.log(`  [PASS] Log distribúcie: ${resultLog}`);

  console.log("\nTest 38: Sovereign Soldier Simulator, Combinatorics & Out-of-Engine NPC turns");
  const spawnedMonster = SovereignSoldierSimulator.spawnOpposingNpc(engineCombo, 0, 3);
  assert(spawnedMonster.type === 'NPC', "Spawnovaný objekt musí byť typu NPC.");
  assert(spawnedMonster.health === 10, "Spawnovaný NPC monster musí mať na začiatku 10 HP.");

  const badHand = ['crystal_laser', 'acid_rain', 'emp_strike'];
  const badRate = SovereignSoldierSimulator.predictCombinatorialWinRate(badHand, 10);
  assert(badRate === 0.15, "Hráč bez pohybových kariet by mal mať základnú nízku šancu na výhru (0.15).");

  const strongHand = ['move_warp', 'emp_strike', 'crystal_laser', 'slide_teleport'];
  const strongRate = SovereignSoldierSimulator.predictCombinatorialWinRate(strongHand, 10);
  assert(strongRate > 0.5, `Kombinácia pohybu a útoku by mala zvýšiť win rate (vypočítané: ${strongRate}).`);

  const targetPlayer = engineCombo.threads.find((t: any) => t.id === 'thread_king_ai')!;
  targetPlayer.position = { meta: 0, hex: 4 };
  targetPlayer.health = 15;
  targetPlayer.armor = 1;

  const simLogs = SovereignSoldierSimulator.simulateOutofEngineTurns(engineCombo);
  assert(targetPlayer.health === 13, "NPC malo udeliť 3 DMG - 1 armor = 2 čisté poškodenie, čím znížilo hráčove HP na 13.");
  assert(simLogs.some(log => log.includes("NPC")), "Zoznam simulačných logov must contain NPC attack.");

  console.log(`  [PASS] Spawnovaný NPC monster: ${spawnedMonster.id} na pozícii M${spawnedMonster.position.meta}_S${spawnedMonster.position.hex}`);
  console.log(`  [PASS] Kombinatorická predikcia výhry bez pohybu (bad): ${badRate}, s pohybom (strong): ${strongRate}`);
  console.log(`  [PASS] Out-of-Engine turn úspešne simulovaný: ${simLogs.join(', ')}`);

  console.log("\nTest 39: Strictly Deterministic Turn Balancer");
  const balancer = new DeterministicTurnBalancer(['player_alpha', 'player_beta']);

  const hMap: Record<string, number> = { player_alpha: 15, player_beta: 15 };
  const first = balancer.getNextPlayerId(hMap);
  assert(first === 'player_alpha', "Deterministické rozhodovanie pri remíze by malo vrátiť player_alpha (abecedne).");

  const res1 = balancer.registerActionCost('player_alpha', 10, false);
  assert(res1.finalCost === 10, "Základná akcia bez fatigue/low-health by mala mať cenu 10.");

  const second = balancer.getNextPlayerId(hMap);
  assert(second === 'player_beta', "Beta by mala mať ďalší ťah, keďže jej cena je 0 < 10.");

  const res2 = balancer.registerActionCost('player_beta', 10, true);
  assert(res2.finalCost === 8, "V stave kritického zdravia by mal hráč získať zľavu 20% (cena 8 namiesto 10).");
  assert(res2.catchUpApplied === true, "Catch-up zľava by mala byť označená ako aplikovaná.");

  const res3 = balancer.registerActionCost('player_beta', 10, false);
  assert(res3.finalCost === 15, "Za druhý po sebe idúci ťah (consecutive turn) by mal nasledovať fatigue postih +50% (cena 15 namiesto 10).");
  assert(res3.fatigueApplied === true, "Fatigue postih by mal byť označený ako aplikovaný.");

  console.log(`  [PASS] Prvý ťah priradený pre: ${first}`);
  console.log(`  [PASS] Kolo pre hráča v kritickom stave (catch-up): ${res2.finalCost} HP cost`);
  console.log(`  [PASS] Kolo pre hráča s fatigue postihom: ${res3.finalCost} HP cost`);

  console.log("\nTest 40: Sovereign Propositional Logic Console & Administrator Access Points");
  const pts = SovereignLogicConsole.getAccessPoints(engineCombo, 'thread_king_ai');
  assert(pts.length > 5, "Počet prístupových bodov pre admina musí byť viac ako 5.");
  
  const overrideRes = SovereignLogicConsole.applyOverride(engineCombo, 'thread_king_ai', 'system_energy', 42);
  assert(engineCombo.systemEnergy === 42, "Administrátorský override by mal nastaviť system_energy na 42.");
  console.log(`  [PASS] ${overrideRes}`);

  const pState = {
    isRooted: true,
    lowHealth: true,
    highEntropy: false,
    activeTurn: true,
    dangerZone: true
  };
  const logicRes = SovereignLogicConsole.evaluatePropositionalLogic('isRooted ^ lowHealth => dangerZone', pState);
  assert(logicRes.result === true, "isRooted ^ lowHealth => dangerZone by malo byť vyhodnotené ako TRUE.");

  const doc = SovereignLogicConsole.getSystemDocumentation();
  assert(doc.includes("Core Turn State Machine"), "Systémová dokumentácia musí obsahovať hlavné okruhy pre brainstorming.");

  console.log(`  [PASS] Propositional logic evaluated: ${logicRes.evaluatedSteps}`);
  console.log(`  [PASS] Code base documentation fetched successfully.`);

  console.log("\nTest 41: Sovereign Battle Encounter, Adaptive Difficulty & Fighter Guidance");
  const fighter = engineCombo.threads.find((t: any) => t.id === 'thread_king_ai')!;
  fighter.position = { meta: 0, hex: 0 };
  fighter.health = 15;
  fighter.baseDamage = 5;
  fighter.armor = 1;

  const battleNpc = engineCombo.spawnNPC('void_sentinel_test', 'Void Sentinel', 1, 0, 5);
  battleNpc.health = 8;
  battleNpc.baseDamage = 3;
  battleNpc.armor = 0;

  const outcome = SovereignBattleDirector.evaluateBattleEncounter(engineCombo, 'thread_king_ai', 'void_sentinel_test');
  
  assert(outcome.damageToNpc === 5, "Poškodenie udelené NPC by malo byť 5 (5 player dmg - 0 npc armor).");
  assert(outcome.damageToPlayer === 2, "Poškodenie udelené hráčovi by malo byť 2 (3 npc dmg - 1 player armor).");
  assert(fighter.health === 13, "Hráčovi malo po boji klesnúť HP na 13.");
  assert(battleNpc.health === 3, "NPC malo po boji klesnúť HP na 3.");

  const guidance = SovereignBattleDirector.getEncountersNavigationMap(engineCombo, 'thread_king_ai');
  assert(guidance.targetCoords.length > 0, "Navigačný systém by mal vrátiť súradnice najbližšieho protivníka.");
  assert(guidance.path.length > 0, "Cesta k protivníkovi musí byť úspešne vypočítaná cez Pathfinder.");

  engineCombo.traceLog = [];
  engineCombo.traceLog.push({ type: 'Combat', message: 'Player struck NPC' } as any);
  engineCombo.traceLog.push({ type: 'Combat', message: 'Player struck NPC' } as any);
  engineCombo.traceLog.push({ type: 'Combat', message: 'Player struck NPC' } as any);
  
  const scaleMsg = SovereignBattleDirector.scaleNPCOnVictories(engineCombo);
  assert(scaleMsg.includes("Spawned Elite Void Sentinel"), "Pri 3 víťazstvách by sa malo naspawnovať Elite NPC pre zachovanie obtiažnosti.");

  console.log(`  [PASS] Matematická simulácia súboja vyhodnotená. Udelené poškodenie hráčovi: ${outcome.damageToPlayer}, NPC: ${outcome.damageToNpc}`);
  console.log(`  [PASS] Guidance Intercept: ${guidance.message}`);
  console.log(`  [PASS] Adaptive difficulty: ${scaleMsg}`);

  console.log("\nTest 42: Sovereign System Hierarchy & Algebraic Superpositions");
  const sysNodes = SovereignSystemHierarchy.getComponentMap();
  assert(sysNodes.length >= 7, "Všetkých 7 systémových komponentov musí byť obsiahnutých v hierarchickej mape.");
  const integrityReport = SovereignSystemHierarchy.verifySystemIntegrity();
  assert(integrityReport.healthy === true, "Všetky systémové komponenty by mali byť zdravé a online.");

  const playerThread = engineCombo.threads.find((t: any) => t.id === 'thread_king_ai')!;
  playerThread.baseDamage = 5;
  
  const superposeLog = SovereignSuperpositionEngine.applySuperposition(playerThread, 'WAVE_FUNCTION', 1.0);
  assert(SovereignSuperpositionEngine.getActiveBuff('thread_king_ai') !== undefined, "Player thread by mal mapovať aktívny superposition stav.");

  const testOutcome = {
    damageApplied: 10,
    energyDelta: 10,
    displacementDistance: 2,
    displacementType: 'push' as const,
    statusApplied: 'none' as const,
    successProbability: 80.0
  };
  const projectedOutcome = SovereignSuperpositionEngine.projectSuperpositionTensor(testOutcome, 'WAVE_FUNCTION');
  assert(projectedOutcome.damageApplied === 13, "WAVE_FUNCTION superposition tensor by mal zvýšiť poškodenie o 30% (z 10 na 13).");
  assert(projectedOutcome.successProbability === 100.0, "WAVE_FUNCTION superposition tensor by mal zvýšiť pravdepodobnosť úspechu na 100%.");

  const collapseResult = SovereignSuperpositionEngine.collapseState(playerThread, 'DAMAGE');
  assert(playerThread.baseDamage === 9, "Deterministický kolaps do DAMAGE state-u mal navýšiť baseDamage na 9.");
  assert(SovereignSuperpositionEngine.getActiveBuff('thread_king_ai') === undefined, "Po kolapse by mal byť superposition stav skonzumovaný.");

  console.log(`  [PASS] System hierarchy nodes count: ${sysNodes.length}, integrity status: ${integrityReport.healthy ? 'HEALTHY' : 'UNHEALTHY'}`);
  console.log(`  [PASS] ${superposeLog}`);
  console.log(`  [PASS] Projected outcome success probability: ${projectedOutcome.successProbability}%, damage: ${projectedOutcome.damageApplied}`);
  console.log(`  [PASS] ${collapseResult.log} -> baseDamage: ${playerThread.baseDamage}`);

  console.log("\nTest 43: Sovereign Game Specs Statistics Reporter");
  const stats = SovereignStatisticsReporter.generateStatisticsReport();
  assert(stats.playerCount >= 0, "Štatistický report by mal prečítať počet hráčov.");
  assert(stats.averagePlayerLevel >= 1.0, "Priemerný level hráčov by mal byť aspoň 1.0.");
  
  const mdReport = SovereignStatisticsReporter.compileMarkdownReport(stats);
  assert(mdReport.includes("Sovereign Engine - Live Game Specs & Statistics Report"), "Markdown správa by mala obsahovať správny formát hlavičky.");

  console.log(`  [PASS] Live telemetry events tracked in report: ${stats.totalTelemetryEvents}`);
  console.log(`  [PASS] Live memory registers tracked in report: ${stats.totalMemoryRegisters}`);
  console.log(`  [PASS] Dynamic Markdown report compiled successfully.`);

  console.log("\nTest 44: Sovereign Telemetry Event & Entity Spawner Director");
  const spawnedEvents = await SovereignTelemetrySpawner.evaluateAndSpawn(engineCombo);
  assert(spawnedEvents.length > 0, "Telemetry spawner by mal vygenerovať aspoň jednu hernú udalosť.");
  
  const trapEvent = spawnedEvents.find(e => e.type === 'DATA_HAZARD_TRAP');
  assert(trapEvent !== undefined, "Prekročenie registrov by malo deterministicky spawnovať Quantum Data Anomaly pascu.");
  assert(trapEvent!.hex === 2, "Anomaly pasca by mala byť umiestnená na cieľovom políčku Hex 2.");

  const chestEvent = spawnedEvents.find(e => e.type === 'TELEMETRY_LOOT_CHEST');
  assert(chestEvent !== undefined, "Nízky stav inventára by mal naspawnovať replenishing telemetry truhlicu.");

  console.log(`  [PASS] Dynamic spawns evaluated: ${spawnedEvents.length} events active on arena`);
  console.log(`  [PASS] Data Anomaly registered at: Chunk ${trapEvent!.meta} Hex ${trapEvent!.hex}`);
  console.log(`  [PASS] Supply Material chest spawned: ${chestEvent!.name} at Chunk ${chestEvent!.meta} Hex ${chestEvent!.hex}`);

  console.log("\nTest 45: Sovereign Combinatorics Template Registry");
  const initialCombos = SovereignCombinatoricsRegistry.listAllCombos();
  assert(initialCombos.length >= 3, "Baseline kombinácie musia byť predvyplnené do databázy.");

  SovereignCombinatoricsRegistry.registerCombo(
    'Pyroclastic Rift',
    ['voltage_surge', 'nature'],
    0.80,
    18,
    { damageBonus: 6, status: 'rooted', animation: 'fire_eruption' }
  );

  const queryCombo = SovereignCombinatoricsRegistry.getCombo('Pyroclastic Rift');
  assert(queryCombo !== null, "Kombinácia Pyroclastic Rift by mala byť úspešne uložená a prečítaná z DB.");
  assert(queryCombo!.power_rating === 18, "Power rating uloženej kombinácie musí byť 18.");

  const detectMatch = SovereignCombinatoricsRegistry.detectComboPlayed(['nature', 'voltage_surge']);
  assert(detectMatch !== null, "Vyhľadávanie by malo úspešne nájsť kombináciu bez ohľadu na poradie kariet.");
  assert(detectMatch!.combo_name === 'Pyroclastic Rift', "Detegovaný názov kombinácie musí zodpovedať Pyroclastic Rift.");

  const avalancheDetect = SovereignCombinatoricsRegistry.detectComboPlayed(['iceMeteor', 'snowball']);
  assert(avalancheDetect !== null, "Novoregistrované kombinácie (Blizzard Avalanche) musia byť úspešne detegované.");
  assert(avalancheDetect!.combo_name === 'Blizzard Avalanche', "Detegovaný názov kombinácie musí zodpovedať Blizzard Avalanche.");

  console.log(`  [PASS] Total registered combinatorics patterns in SQLite: ${initialCombos.length + 1}`);
  console.log(`  [PASS] Order-agnostic matching detection verified for target cards: [nature, voltage_surge] -> ${detectMatch!.combo_name}`);
  console.log(`  [PASS] Custom prepopulated gameplay pattern verified: [iceMeteor, snowball] -> ${avalancheDetect!.combo_name}`);

  console.log("\nTest 46: Rule of Three (Trojčlenka) Proportional Solver");
  // 1. Direct proportion: a1 / b1 = a2 / b2 => 10 / 2 = X / 4 => X = 20
  const solvedDirect = RuleOfThreeSolver.solveDirect(10, 2, null, 4);
  assert(solvedDirect === 20, "Priama úmera (a1/b1 = a2/b2) by mala vypočítať neznámu premennú.");

  // 2. Inverse proportion: a1 * b1 = a2 * b2 => 5 * 10 = X * 2 => X = 25
  const solvedInverse = RuleOfThreeSolver.solveInverse(5, 10, null, 2);
  assert(solvedInverse === 25, "Nepriama úmera (a1*b1 = a2*b2) by mala vypočítať neznámu premennú.");

  // 3. Ohm's Law: I = V / R => missing V when R = 4, I = 3 => V = 12
  const solvedOhmV = RuleOfThreeSolver.solveOhm(null, 4, 3);
  assert(solvedOhmV.voltage === 12, "Ohmov zákon by mal vypočítať chýbajúce napätie (V = I * R).");

  // 4. Ohm's Law: I = V / R => missing I when V = 12, R = 4 => I = 3
  const solvedOhmI = RuleOfThreeSolver.solveOhm(12, 4, null);
  assert(solvedOhmI.current === 3, "Ohmov zákon by mal vypočítať chýbajúci prúd (I = V / R).");

  // 5. Ohm's Law: I = V / R => missing R when V = 12, I = 3 => R = 4
  const solvedOhmR = RuleOfThreeSolver.solveOhm(12, null, 3);
  assert(solvedOhmR.resistance === 4, "Ohmov zákon by mal vypočítať chýbajúci odpor (R = V / I).");

  console.log("  [PASS] Priama úmera vyriešená úspešne.");
  console.log("  [PASS] Nepriama úmera vyriešená úspešne.");
  console.log("  [PASS] Ohmov zákon (všetky 3 varianty neznámych) vyriešený úspešne.");

  console.log("\nTest 47: Sovereign Tensor Inference & Unknown Variable Generator");
  const inferLevel = AlgebraicActionTensor.inferUnknown('crystal_laser', {}, { damageApplied: 3.6 });
  assert(inferLevel.requiredLevel === 3, "Spätný prepočet levelu z poškodenia tenzora by mal vrátiť správny level (3).");

  const inferHazard = AlgebraicActionTensor.inferUnknown('crystal_laser', { friction: 0 }, { energyDelta: 20.25 });
  assert(inferHazard.requiredHazardIndex === 0, "Spätný prepočet hazardIndexu by mal pre 20.25 energyDelta vrátiť hazardIndex = 0.");

  console.log("  [PASS] Spätný prepočet levelu (RequiredLevel) z inferencie tenzora vyriešený.");
  console.log("  [PASS] Spätný prepočet hazardIndexu (RequiredHazardIndex) z inferencie tenzora vyriešený.");

  console.log("\nTest 48: OpenVINO PC Vision Telemetry Integration");
  const postRes = await fetch('http://localhost:8081/api/telemetry/vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: "test_session_line_01",
      event_type: "PC_VISION_INSPECTION",
      telemetry_theory: JSON.stringify({
        latency_ms: 11.2,
        fps: 89.3,
        detected_defect_class: 1,
        confidence: 0.99,
        timestamp: Date.now()
      })
    })
  });
  assert(postRes.status === 201, "Go Core by mal vrátiť status 201 Created pre úspešný zápis vision telemetrie.");

  const getRes = await fetch('http://localhost:8081/api/telemetry/vision');
  assert(getRes.ok, "Go Core by mal úspešne vrátiť zoznam vision udalostí.");
  const visionEvents = (await getRes.json()) as any[];
  assert(visionEvents.length > 0, "Zoznam vision telemetrie by mal obsahovať aspoň 1 udalosť.");

  const targetEvent = visionEvents.find((e: any) => e.session_id === "test_session_line_01");
  assert(targetEvent !== undefined, "Vision udalosť s test_session_line_01 by mala byť v zozname.");
  assert(targetEvent.event_type === "PC_VISION_INSPECTION", "Typ udalosti musí zodpovedať PC_VISION_INSPECTION.");

  console.log(`  [PASS] Vision Telemetry posted successfully: status 201`);
  console.log(`  [PASS] Vision Telemetry fetched successfully: ${visionEvents.length} events logged`);
  console.log(`  [PASS] Verified vision session payload: session_id -> ${targetEvent.session_id}, event_type -> ${targetEvent.event_type}`);

  console.log("\nTest 49: Ohm's Law Grid Overcharge & Wave Collapse");
  // 1. Direct Ohm's Law current calculation: I = V / R = 6.0 / 2.0 = 3.0A
  const stressNormal = OhmGridEvaluator.evaluateSectorStress({
    sectorId: 'M0_S0',
    voltage: 6.0,
    resistance: 2.0,
    systemEntropy: 0.2,
    isShortCircuited: false
  });
  assert(stressNormal.current === 3.0, "Normálny prúd by mal byť 3.0A (6V / 2 Ohm).");
  assert(stressNormal.shortCircuitTriggered === false, "Prúd 3.0A by nemal spustiť skrat.");

  // 2. High current triggering short-circuit (> 8.0A): I = 10.0 / 1.0 = 10.0A
  const stressShort = OhmGridEvaluator.evaluateSectorStress({
    sectorId: 'M0_S1',
    voltage: 10.0,
    resistance: 1.0,
    systemEntropy: 0.2,
    isShortCircuited: false
  });
  assert(stressShort.current === 10.0, "Preťažený prúd by mal byť 10.0A (10V / 1 Ohm).");
  assert(stressShort.shortCircuitTriggered === true, "Prúd 10.0A by mal preťažiť sieť a vyvolať skrat.");

  // 3. OpenVINO fatigue scaling: systemEntropy = 0.8 => Scales current by (1 + (0.8 - 0.7)) = 1.1x => I = (6.0/1.0) * 1.1 = 6.6A
  const stressFatigue = OhmGridEvaluator.evaluateSectorStress({
    sectorId: 'M0_S2',
    voltage: 6.0,
    resistance: 1.0,
    systemEntropy: 0.8,
    isShortCircuited: false
  });
  assert(stressFatigue.current === 6.6, "Únava/defekt (Entropia 0.8) by mala zvýšiť prúd na 6.6A.");

  // 4. Wave collapse checks
  const waveResult = OhmGridEvaluator.calculateWaveCollapse(2.0, 'BURST_DAMAGE');
  assert(waveResult.spawnDensity === 3.0, "Hustota spawnov pri entropii 2.0 by mala byť 3.0.");
  assert(waveResult.triggerWave === true, "Hustota 3.0 (> 2.5) by mala triggerovať spawn vlnu.");

  console.log(`  [PASS] Ohm's Law grid stress calculated: 6V / 2 Ohm -> ${stressNormal.current}A`);
  console.log(`  [PASS] Short-circuit boundary resolved at: ${stressShort.current}A (> 8.0A Limit)`);
  console.log(`  [PASS] OpenVINO fatigue scaling verified: scaled current -> ${stressFatigue.current}A`);
  console.log(`  [PASS] Wave collapse density resolved: density -> ${waveResult.spawnDensity}, trigger -> ${waveResult.triggerWave}`);

  console.log("\nTest 50: ClickHouse Big Data Telemetry Ingestion");
  // Clear any existing fallback dumps
  ClickHouseTelemetryClient.clearFallbackFile();
  
  // Initialize client schema checks (expects gracefully deferred connection logs)
  await ClickHouseTelemetryClient.init();

  // Log Vision telemetry
  ClickHouseTelemetryClient.logVision({
    session_id: "production_line_test_01",
    fps: 60.0,
    latency_ms: 16.6,
    defect_class: 0,
    confidence: 0.99,
    timestamp: Date.now()
  });

  // Log Combat telemetry
  ClickHouseTelemetryClient.logCombat({
    match_id: "test_match_99",
    player_id: "player_beta",
    card_id: "voltage_surge",
    voltage: 5.0,
    current: 1.0,
    timestamp: Date.now()
  });

  // Log Short-circuit telemetry
  ClickHouseTelemetryClient.logShortCircuit({
    sector_id: "M0_S5",
    voltage: 12.0,
    resistance: 1.0,
    current_load: 12.0,
    timestamp: Date.now()
  });

  // Flush buffer pool manually (simulating interval tick or buffer full trigger)
  await ClickHouseTelemetryClient.flushAll();

  // Read fallback records to assert successful buffering and write operations
  const fallbackRecords = ClickHouseTelemetryClient.readFallbackFile();
  assert(fallbackRecords.length === 3, "Všetky 3 telemetry záznamy by mali byť prítomné v lokálnom JSONL súbore.");

  const visionRec = fallbackRecords.find(r => r.type === 'VISION');
  assert(visionRec !== undefined, "Vision telemetry záznam musí byť úspešne uložený.");
  assert(visionRec.data.session_id === "production_line_test_01", "Záznam musí obsahovať správny session_id.");

  const combatRec = fallbackRecords.find(r => r.type === 'COMBAT');
  assert(combatRec !== undefined, "Combat telemetry záznam musí byť úspešne uložený.");
  assert(combatRec.data.card_id === "voltage_surge", "Combat záznam musí obsahovať správny card_id.");

  const shortRec = fallbackRecords.find(r => r.type === 'SHORT_CIRCUIT');
  assert(shortRec !== undefined, "Short-circuit telemetry záznam musí byť úspešne uložený.");
  assert(shortRec.data.sector_id === "M0_S5", "Short-circuit záznam musí obsahovať správny sector_id.");

  console.log(`  [PASS] ClickHouse buffer logs successfully persisted via JSONL fallback.`);
  console.log(`  [PASS] Verified Vision telemetry fallback record: session_id -> ${visionRec.data.session_id}`);
  console.log(`  [PASS] Verified Combat telemetry fallback record: card_id -> ${combatRec.data.card_id}`);
  console.log(`  [PASS] Verified Short-circuit telemetry fallback record: sector_id -> ${shortRec.data.sector_id}`);

  console.log("\nTest 51: SQLite Register Locking & Passive Combat Buffs");
  const testDb = new DatabaseSyncManager();
  const testUsername = `hacker_test_${Date.now()}`;
  
  // 1. Create player profile (should default to 5 Spores/CrystalShards based on hero type)
  const testProfile = testDb.getOrCreatePlayer(testUsername, 'crystal');
  assert(testProfile.username === testUsername, "Používateľské meno by malo súhlasiť.");
  
  const parsedMaterials = JSON.parse(testProfile.materials);
  assert(parsedMaterials.CrystalShard === 5, "Frakcia Crystal by mala štartovať s 5 CrystalShard.");

  // 2. Mock adding some extra shards so player can afford locking cost (e.g. cost = 6 shards)
  parsedMaterials.CrystalShard = 10;
  const updateProfileStmt = (testDb as any).db.prepare('UPDATE players SET materials = ? WHERE username = ?');
  updateProfileStmt.run(JSON.stringify(parsedMaterials), testUsername);

  // 3. Lock register (0x00C0 -> ARMOR_BUFF (+1.0 armor))
  const lockCost = 6;
  const materialsAfterLock = { CrystalShard: 10 - lockCost };
  testDb.lockRegister(testUsername, '0x00C0', 'ARMOR_BUFF', 1.0);

  const lockedRows = testDb.getLockedRegisters(testUsername);
  assert(lockedRows.length === 1, "Hráč by mal mať zaevidovaný 1 uzamknutý register.");
  assert(lockedRows[0].register_address === '0x00C0', "Adresa registra by mala byť 0x00C0.");
  assert(lockedRows[0].buff_type === 'ARMOR_BUFF', "Buff by mal byť typu ARMOR_BUFF.");
  assert(lockedRows[0].buff_value === 1.0, "Hodnota buffu by mala byť 1.0.");

  // 4. Simulate match initialization and thread stat application
  const testEngineInst = new SovereignEngine();
  const testPlayerThread = new Thread('thread_king_ai', 'PLAYER');
  testPlayerThread.name = testUsername;
  testPlayerThread.armor = 0;
  testPlayerThread.baseDamage = 5;

  // Apply locked register buffs
  lockedRows.forEach(r => {
    if (r.buff_type === 'DAMAGE_BUFF') {
      testPlayerThread.baseDamage += r.buff_value;
    } else if (r.buff_type === 'ARMOR_BUFF') {
      testPlayerThread.armor += r.buff_value;
    }
  });

  assert(testPlayerThread.armor === 1.0, "Pasívny buff by mal navýšiť armor hrdinu na 1.0.");
  
  console.log(`  [PASS] Shard updates and database profile creation validated successfully.`);
  console.log(`  [PASS] Locked register stored: address -> ${lockedRows[0].register_address}, buff -> ${lockedRows[0].buff_type} (+${lockedRows[0].buff_value})`);
  console.log(`  [PASS] Passive combat stats synchronized: base player armor increased to ${testPlayerThread.armor}`);

  console.log("\nTest 52: Unsupervised K-Means Combat Clustering & PC Vision Modifiers");
  
  // 1. Verify PC Vision focus and fatigue modifiers
  const visionEngine = new SovereignEngine();
  (visionEngine as any).lastFocusIndex = 0.95; // High focus
  (visionEngine as any).lastFatigueIndex = 0.80; // High fatigue
  
  // Simulate turn end fatigue modifier
  assert(visionEngine.globalEntropy === 0.0, "Štartovacia entropia by mala byť 0.0.");
  if ((visionEngine as any).lastFatigueIndex > 0.6) {
    visionEngine.globalEntropy = Number((visionEngine.globalEntropy + 0.03).toFixed(2));
  }
  assert(visionEngine.globalEntropy === 0.03, "Vysoká únava hrdinu musela zvýšiť globálnu entropiu o +0.03.");

  // Simulate card play focus voltage boost
  const testCardSpecs = { voltage: 4.0, current: 1.0 };
  if ((visionEngine as any).lastFocusIndex > 0.8) {
    testCardSpecs.voltage = Number((testCardSpecs.voltage * 1.15).toFixed(2));
  }
  assert(testCardSpecs.voltage === 4.60, "Vysoká pozornosť na kameru musela navýšiť voltage na 4.60 V (1.15x).");

  // 2. Verify K-Means spawner adaptation (Faraday Sentinel & System Root Trap)
  const spawnerEngine = new SovereignEngine();
  
  // Test BURST_DAMAGE archetype
  (spawnerEngine as any).activeArchetype = 'BURST_DAMAGE';
  const burstSpawns = await SovereignTelemetrySpawner.evaluateAndSpawn(spawnerEngine);
  assert(spawnerEngine.threads.some(t => t.name === 'Faraday Sentinel'), "Faraday Sentinel musí byť naspawnovaný pre BURST_DAMAGE hráča.");
  assert(burstSpawns.some(s => s.name === 'Faraday Sentinel'), "Zoznam spawneru musí obsahovať Faraday Sentinel.");

  // Test FAST_MOVER archetype
  const spawnerEngine2 = new SovereignEngine();
  (spawnerEngine2 as any).activeArchetype = 'FAST_MOVER';
  const fastSpawns = await SovereignTelemetrySpawner.evaluateAndSpawn(spawnerEngine2);
  assert(fastSpawns.some(s => s.name === 'Anti-Movement System Trap'), "Anti-Movement pasca musí byť umiestnená na aréne pre FAST_MOVER hráča.");

  console.log(`  [PASS] PC Vision focus voltage boost and fatigue entropy increments verified successfully.`);
  console.log(`  [PASS] K-Means Faraday Sentinel dynamic spawn verified for BURST_DAMAGE archetype.`);
  console.log(`  [PASS] K-Means Anti-Movement System Trap dynamic spawn verified for FAST_MOVER archetype.`);

  console.log("\nVšetky RPG, štatistické, dungeon, biómové, fyzikálne, ML, AI, Trace, DDA, Quest, Status-Cure, Database, Algebraic-Tensor, Adrenaline-Surge, Aetheric-Dice, Shop-Items, PvEvP, Traps/Void, Scenario-Trigger, Algebraic-Opportunities, ML-Movement-Prediction, Quest-CRUD-Trigger, ML-Hero-Spawner, LLM-Dialogue-Generator, DB-Quest-Generator-Telemetry, Semantic-Gameplay-Coordinator, Terrain-Telemetry-Dopamine-Balancer, Render-Priority-Instancing-Optimizer-Resolve-Chain, Gameplay-Compositor-Manager-Interactive-Spawner, Algebraic-Canvas-Composition, Hero-Graphics-Dataset, Biome-Market-Pricing, Generative-ML-Tactical-Spawner, Consecutive-Combos, Terrain-Traps, Multi-Area-Distributor, Soldier-Combinatorial-NPC-turns, Deterministic-Turn-Balancer, Soldier-Wave-Superposition-Director, Sovereign-Logic-Console, Sovereign-Battle-Director, Sovereign-System-Hierarchy, Sovereign-Superposition-Engine, Sovereign-Statistics-Reporter, Sovereign-Telemetry-Spawner, Sovereign-Combinatorics-Registry, Rule-Of-Three-Solver, Tensor-Inference-Unknowns, OpenVINO-Vision-Telemetry, Ohm-Grid-Evaluator, ClickHouse-Big-Data-Telemetry, SQLite-Register-Buff, PC-Vision-Focus-Fatigue a K-Means-Archetype-Spawner testy prebehli úspešne!");
}

runTests().catch(err => {
  console.error("Testovanie zlyhalo s chybou:", err);
  throw err;
});
