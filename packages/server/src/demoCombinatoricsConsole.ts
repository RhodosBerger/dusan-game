// packages/server/src/demoCombinatoricsConsole.ts
import { SovereignCombinatoricsRegistry } from './models/SovereignCombinatoricsRegistry';
import { RuleOfThreeSolver, AlgebraicActionTensor, CombinatoricProbabilityEngine } from '@dusan-game/shared';
declare var require: any;
declare var __dirname: string;
const fs = require('fs');
const path = require('path');

console.log("==================================================================");
console.log("   SOVEREIGN COMBINATORICS GAMEPLAY DEMONSTRATOR");
console.log("==================================================================");

function runDemo() {
  const reportPath = path.join(__dirname, 'demo_combinatorics_report.md');
  let md = `# 📊 Report: Kombinatorická Analýza Gameplay Synergií\n\n`;
  md += `Vygenerované dňa: ${new Date().toLocaleString()}\n`;
  md += `Tento report demonštruje, ako sa herné kombinácie (skúsenosti z gameplayu) spájajú s kombinatorickými možnosťami matematického enginu a Ohmovho zákona.\n\n`;

  // 1. Zobrazenie existujúcich šablón kombinácií z SQLite DB
  md += `## 1. Zoznam registrovaných šablón kombinácií (SQLite DB)\n\n`;
  md += `Nasledujúce kombinácie boli úspešne prečítané z perzistentnej databázy:\n\n`;
  md += `| Názov Kombinácie | Požadované Karty | Základná Úspešnosť | Ohmic Power Rating |\n`;
  md += `|:---|:---|:---|:---|\n`;

  const combos = SovereignCombinatoricsRegistry.listAllCombos();
  combos.forEach(c => {
    md += `| **${c.combo_name}** | \`${c.card_combination.join(', ')}\` | ${(c.base_success_rate * 100).toFixed(0)}% | ${c.power_rating} W |\n`;
  });
  md += `\n`;

  // 2. Simulácia herného priebehu a prechodu medzi levelmi (Experience)
  md += `## 2. Simulácia Gameplay Priebehu s vplyvom Skúseností (Hero Level)\n\n`;
  md += `Ukážeme si prepočet poškodenia pre kombináciu **Aetheric Current Burst** (\`voltage_surge, charge\`) pri rôznych leveloch hrdinu.\n`;
  md += `Základná sila kombinácie je upravená o level a exponenciálny útlm kombinatorického koeficientu.\n\n`;

  const targetCards = ['charge', 'voltage_surge'];
  const matchedCombo = SovereignCombinatoricsRegistry.detectComboPlayed(targetCards);

  if (matchedCombo) {
    md += `### Detegovaná synergia: **${matchedCombo.combo_name}**!\n`;
    md += `*   Základný power rating: \`${matchedCombo.power_rating} W\`\n`;
    md += `*   Efekty šablóny: \`${JSON.stringify(matchedCombo.effects)}\`\n\n`;

    const levels = [1, 3, 5];
    md += `| Level Hrdinu (XP) | Multiplikátor Levelu | Zníženie poškodenia (Armor = 2) | Finálne Poškodenie Kombinácie |\n`;
    md += `|:---|:---|:---|:---|\n`;

    levels.forEach(lvl => {
      // Lineárne navyšovanie základného poškodenia kombinácie (+10% za level)
      const lvlMultiplier = 1 + (lvl - 1) * 0.1;
      const baseDamage = matchedCombo.power_rating * 0.5; // conversion ratio
      const scaledDamage = baseDamage * lvlMultiplier;

      // Combinatoric probability engine - útlm poškodenia na základe dĺžky komba (2 karty)
      const damageFactor = CombinatoricProbabilityEngine.calculateComboDamageFactor(2, 2); // armor = 2, comboCount = 2
      const finalDmg = Math.round(scaledDamage * damageFactor);

      md += `| **Level ${lvl}** | ${(lvlMultiplier * 100).toFixed(0)}% | ${(damageFactor * 100).toFixed(1)}% | **${finalDmg} DMG** |\n`;
    });
  }
  md += `\n`;

  // 3. Spätná Inferencia Neznámych (Trojčlenka)
  md += `## 3. Výpočet Neznámych Parametrov pomocou Trojčlenky (Rule of Three Solver)\n\n`;
  md += `Pri komplexnej analýze potrebujeme vypočítať neznáme premenné. Používame Ohmov zákon a priamu úmeru:\n\n`;

  // Prípad A: Ohmov zákon - výpočet chýbajúceho odporu (V = 12, I = 3 -> R = ?)
  const resolvedOhm = RuleOfThreeSolver.solveOhm(12, null, 3);
  md += `*   **Prípad A (Ohmov zákon):** Máme Napätie $V = 12\\text{ V}$, Prúd $I = 3\\text{ A}$. Chýba nám Odpor $R$.\n`;
  md += `    *   Výsledok riešenia: Odpor $R = \\mathbf{${resolvedOhm.resistance}\\ \\Omega}$\n\n`;

  // Prípad B: Priama úmera (Trojčlenka) - výpočet potrebného XP levelu pre target damage 6
  // level 1 = 4 dmg, level X = 6 dmg => X = (1 * 6) / 4 ... atď.
  const targetDmg = 6.0;
  const baseDmg = 4.0;
  // damage = baseDmg * (1 + (level - 1)*0.1) => multiplier = target / base = 1.5 => level = (1.5 - 1)/0.1 + 1 = 6
  const inferLevel = AlgebraicActionTensor.inferUnknown('crystal_laser', {}, { damageApplied: targetDmg });
  md += `*   **Prípad B (Spätná inferencia):** Chceme dosiahnuť cieľové poškodenie \`${targetDmg} DMG\` s kartou \`crystal_laser\` (základné poškodenie \`${baseDmg} DMG\`).\n`;
  md += `    *   Systém spätne dopočítal potrebný level hrdinu pomocou tenzora: **Level ${inferLevel.requiredLevel}**\n\n`;

  // 4. Simulácia Loot Drop pravdepodobnosti podľa Entropy a Lucku
  md += `## 4. Analýza Loot Drop Pravdepodobnosti podľa Sigmoid modelu\n\n`;
  md += `Počas gameplayu sa pravdepodobnosť získania lepšieho obsahu dynamicky prispôsobuje stavu entropie arény a šťastia hráča:\n\n`;
  md += `| Globálna Entropia arény | Hráčovo Šťastie (Luck) | Obtiažnosť biómu | Pravdepodobnosť vzácneho Dropu |\n`;
  md += `|:---|:---|:---|:---|\n`;

  const simulations = [
    { entropy: 0.1, luck: 0.2, diff: 1.5 },
    { entropy: 0.5, luck: 0.5, diff: 1.0 },
    { entropy: 0.9, luck: 0.8, diff: 0.5 }
  ];

  simulations.forEach(sim => {
    const prob = CombinatoricProbabilityEngine.calculateLootDropProbability(sim.entropy, sim.luck, sim.diff);
    md += `| ${(sim.entropy * 100).toFixed(0)}% | ${sim.luck.toFixed(1)} | ${sim.diff.toFixed(1)} | **${(prob * 100).toFixed(1)}%** |\n`;
  });

  fs.writeFileSync(reportPath, md, 'utf8');
  console.log(md);
  console.log("==================================================================");
  console.log(`[DEMO SUCCESS] Standalone report saved to: ${reportPath}`);
  console.log("==================================================================");
}

runDemo();
