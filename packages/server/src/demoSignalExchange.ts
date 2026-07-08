// packages/server/src/demoSignalExchange.ts
import { SovereignSignalMediator } from '@dusan-game/shared';
declare var require: any;
declare var __dirname: string;
const fs = require('fs');
const path = require('path');

console.log("==================================================================");
console.log("   SOVEREIGN SIGNAL MEDIATOR DEMONSTRATOR");
console.log("==================================================================");

function runDemo() {
  const mediator = SovereignSignalMediator.getInstance();
  mediator.clear();

  // 1. Zaregistrujeme modul "PHYSICS_RESOLVER" (poskytovateľ fyzikálnych výpočtov)
  mediator.registerModule('PHYSICS_RESOLVER', (requestType, payload) => {
    if (requestType === 'CALCULATE_OHMIC_LOAD') {
      const { voltage, resistance } = payload;
      const current = voltage / resistance;
      const power = voltage * current;
      return { current, power };
    }
    if (requestType === 'GET_BIOME_FRICTION') {
      const { biome } = payload;
      // Mock biómového trenia
      const friction = biome === 'TOXIC_SWAMP' ? 0.9 : 0.4;
      return { friction };
    }
    return null;
  });

  // 2. Zaregistrujeme modul "COMBAT_ENGINE"
  mediator.registerModule('COMBAT_ENGINE', (requestType, payload) => {
    if (requestType === 'RESOLVE_ATTACK') {
      const { attackerId, targetId, baseDamage } = payload;
      
      // Vyžiadame si dáta z iného modulu (PHYSICS_RESOLVER) cez Mediátor
      const { friction } = mediator.request('PHYSICS_RESOLVER', 'GET_BIOME_FRICTION', { biome: 'TOXIC_SWAMP' });
      
      // Výpočet poškodenia s vplyvom trenia
      const finalDamage = Math.round(baseDamage * (1 - friction * 0.5));
      
      // Publikujeme udalosť do celého systému
      mediator.publish('ATTACK_COMPLETED', { attackerId, targetId, finalDamage, friction });
      
      return { finalDamage };
    }
    return null;
  });

  // 3. Prihlásime globálneho odberateľa na logovanie telemetrie (Pub-Sub)
  const systemLogs: string[] = [];
  mediator.subscribe('ATTACK_COMPLETED', (data) => {
    const logMsg = `[SYSTEM LOG] Hráč ${data.attackerId} úspešne zaútočil na ${data.targetId}. Finálne poškodenie: ${data.finalDamage} HP (Trenie biómu: ${data.friction * 100}%).`;
    console.log(logMsg);
    systemLogs.push(logMsg);
  });

  // 4. Vykonáme operáciu (Simulovaný útok)
  console.log("[SIMULATION] Spúšťa sa simulovaný bojový konflikt...");
  const combatResult = mediator.request('COMBAT_ENGINE', 'RESOLVE_ATTACK', {
    attackerId: 'player_alpha',
    targetId: 'void_stalker_npc',
    baseDamage: 10
  });
  console.log(`[SIMULATION] Výsledok útoku: ${combatResult.finalDamage} DMG.`);

  // 5. Zápis trace logu signálov do markdown súboru
  const logPath = path.join(__dirname, 'signal_exchange_log.md');
  let md = `# 🛰️ Log: Výmena Signálov a Správ v Systéme\n\n`;
  md += `Vygenerované dňa: ${new Date().toLocaleString()}\n`;
  md += `Tento súbor ukazuje, ako si jednotlivé operácie a moduly vymieňajú informácie asynchrónne aj synchrónne bez priamej väzby.\n\n`;

  md += `## 1. Priebeh Správ v Mediátore\n\n`;
  md += `| Čas (relatívne) | Odosielateľ | Udalosť | Detail prenosu |\n`;
  md += `|:---|:---|:---|:---|\n`;

  const traceLog = mediator.getTraceHistory();
  const startTime = traceLog.length > 0 ? traceLog[0].timestamp : 0;

  traceLog.forEach(t => {
    const elapsed = t.timestamp - startTime;
    md += `| \`+${elapsed}ms\` | **${t.from}** | \`${t.event}\` | ${t.detail} |\n`;
  });
  md += `\n`;

  md += `## 2. Zachytené Systémové Telemetrické Udalosti (Pub-Sub)\n\n`;
  systemLogs.forEach(log => {
    md += `*   \`${log}\`\n`;
  });

  fs.writeFileSync(logPath, md, 'utf8');
  console.log("==================================================================");
  console.log(`[DEMO SUCCESS] Standalone message log saved to: ${logPath}`);
  console.log("==================================================================");
}

runDemo();
