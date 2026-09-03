# Štúdia: Bezpečné výpočty a alternatívne adaptácie Sovereign Engine

Tento dokument analyzuje nasadenie a používanie matematických konštruktov v projekte **dusan-game**. Zameriava sa na prevenciu nebezpečných výpočtových operácií (porovnanie s rizikami v jazyku C) a ponúka brainstorming pre alternatívne adaptácie rovnakého fyzikálneho kontextu.

---

## 1. Nasadenie zdokumentovaných konštruktov

V doterajšej architektúre sme zdokumentovali **Sovereign Engine V2**, ktorý reprezentuje hernú simuláciu ako elektrickú sieť. Vyhodnotenie akcií prebieha prostredníctvom prekladu kariet na inštrukcie (`voltage`, `resistance`, `semanticErosion`) a výpočtu prechádzajúceho prúdu:

$$I = \frac{V}{R_{target} + R_{reactions}}$$

Tento prístup úspešne spája mechaniku kartovej hry s deterministickým fyzikálnym modelom. Avšak, prenos tohto modelu do reálneho kódu so sebou prináša numerické riziká, ktoré musíme ošetriť.

---

## 2. Analýza rizikových výpočtov a ich prevencia (Safe Calculations vs. Raw C)

Pri nízkoúrovňových jazykoch (ako je surové C) môžu nevhodne navrhnuté aritmetické operácie viesť k nedefinovanému správaniu (Undefined Behavior - UB), zrúteniu programu alebo bezpečnostným zraniteľnostiam (napr. Buffer Overflow, Integer Underflow). V TypeScript/JavaScript prostredí musíme tieto riziká eliminovať pomocou bezpečných zapuzdrení.

### A. Riziko: Delenie nulou (Division by Zero)
*   **Problém v surovom C:** Ak je menovateľ ($R_{target} + R_{reactions}$) rovný nule, delenie celých čísel v C vyvolá signál `SIGFPE` (Floating Point Exception) a okamžite ukončí proces. Pri delení desatinných čísel (float/double) môže vzniknúť hodnota `Infinity` alebo `NaN` (Not-a-Number), čo pri následnom castovaní na integer spôsobí nedefinované správanie.
*   **Ošetrenie v Sovereign Engine:**
    V modeli musíme zabezpečiť, aby celkový odpor nikdy neklesol na nulu. Zavádzame tzv. **efektívny prah odporu** (`effectiveR`):
    ```typescript
    const V = node.instruction.voltage;
    const R = targetThread.resistance + calculateNodeResistance(node);

    // Division-by-zero guard (Safe Clamping)
    const effectiveR = Math.max(0.1, R); 
    const current = V / effectiveR;
    ```
    *Efektívny odpor s minimálnou hodnotou 0.1 zaručuje, že prúd nikdy nepresiahne desadnásobok napätia a delenie nulou je fyzicky nemožné.*

### B. Riziko: Podtečenie hodnôt (Underflow) a Záporné stavy
*   **Problém v surovom C:** Ak odčítame hodnotu od bezznamienkového celého čísla (`unsigned int`), ktoré je už na nule, dôjde k pretečeniu smerom nahor (`wrapping`), čím sa hodnota zmení na maximálne možné číslo (napr. `4294967295`). Pri znamienkových číslach (`signed int`) môže zdravie hrdinu klesnúť do záporných hodnôt, čo môže narušiť logiku herných podmienok.
*   **Ošetrenie v Sovereign Engine:**
    Každá zmena stavu integrity pamäte (`memoryIntegrity`) musí byť ohraničená pomocou saturačnej aritmetiky:
    ```typescript
    // memoryIntegrity nemôže klesnúť pod 0
    targetThread.memoryIntegrity = Math.max(0, targetThread.memoryIntegrity - damage);
    ```

### C. Riziko: Nekontrolovaná kumulácia tepla (Integer Overflow)
*   **Problém v surovom C:** Pri neustálom pripočítavaní trenia (`friction`) do `systemHeat` by mohlo dôjsť k pretečeniu premennej, čo by spôsobilo náhly skok tepla zo kladných hodnôt do záporných, čím by sa obišla termodynamická očista.
*   **Ošetrenie v Sovereign Engine:**
    Používame explicitné horné limity a automatické spúšťanie očisty (`ThermodynamicPurge`), ktoré udržiava systém v stabilných hraniciach:
    ```typescript
    nextState.systemHeat = Math.min(150, nextState.systemHeat + friction);
    ```

---

## 3. Brainstorming a alternatívne adaptácie fyzikálneho kontextu

Fyzikálny prístup vyhodnocovania akcií (Ohmov zákon) je možné adaptovať na iné zaujímavé kontexty s rôznou hrateľnosťou a pravidlami.

### Adaptácia A: Hydraulický prúdový model (Hydraulic Flow Model)
Namiesto elektriny simulujeme tlak vody v rúrach arény.
*   **Koncept:** Každá metapozícia je uzol s určitým hydro-tlakom ($P$ - Pressure). Hráčske inštrukcie predstavujú ventily a čerpadlá. Odpor ($R_H$) reprezentuje zanesenie potrubia (napr. toxickými rastlinami frakcie *Toxic*).
*   **Výpočet prietoku:**
    $$Q = \frac{P}{R_H}$$
    *   Ak prietok ($Q$) na cieľovom políčku presiahne limit, potrubie praskne (sémantická erózia).
    *   Prebytočný tlak sa nepremení na teplo, ale na **potopu (Flood Level)**, ktorá spomaľuje pohyb na susedných políčkach.

### Adaptácia B: Logické obvody a Booleanovská syntéza
Ideálne pre kyberpunkovú verziu hry, kde sa namiesto desatinných čísel prenášajú logické stavy.
*   **Koncept:** Inštrukcie (karty) fungujú ako hradlá (`AND`, `OR`, `XOR`, `NOT`). Vlákna sú vstupy a výstupy logického obvodu.
*   **Vyhodnotenie:** Akcia sa vykoná iba vtedy, ak logická syntéza celej siete akcií na cieľovom uzle vráti pravdivostnú hodnotu `TRUE`. Frakcia *Crystal* by mohla napríklad vytvárať hradlá `AND` (vyžaduje viacero zdrojov), zatiaľ čo *Toxic* by rušila signály pomocou hradiel `NOT`.

### Adaptácia C: Neurónová inferencia (Neural Network Combat)
Bojový systém založený na vážených sumách a aktivačných funkciách.
*   **Koncept:** Každé vlákno na ploche má priradenú aktivačnú prahovú hodnotu. Útoky sú vstupné neuróny s váhami ($w_i$).
*   **Vyhodnotenie:** Výsledný signál sa spočíta ako:
    $$Act = f\left(\sum (w_i \cdot x_i) - bias\right)$$
    Kde aktivačná funkcia $f(x)$ je napr. Sigmoid alebo ReLU. Ak výstupná hodnota $Act > 0.5$, cieľové vlákno je zasiahnuté. Tento model umožňuje komplexné nelineárne synergie medzi kartami.

---

## 4. Šablóna pre bezpečné výpočty (TypeScript SafeMath Blueprint)

Pre zamedzenie akýmkoľvek rizikám s desatinnou čiarkou, NaN alebo nekonečnom, definujeme nasledovný bezpečný balík pre výpočty v engine:

*   **Súbor:** `/packages/server/src/utils/SafeMath.ts`

```typescript
export class SafeMath {
  /**
   * Bezpečné delenie s ochranou proti deleniu nulou a NaN hodnotám.
   * V prípade zlyhania vráti predvolenú fallback hodnotu.
   */
  public static safeDivide(numerator: number, denominator: number, fallback: number = 0): number {
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
      return fallback;
    }
    
    // Ochrana pred delením nulou a extrémnym odporom
    if (Math.abs(denominator) < 0.001) {
      return fallback;
    }

    const result = numerator / denominator;
    return Number.isNaN(result) ? fallback : result;
  }

  /**
   * Orezanie (clamp) hodnoty do bezpečných min/max hraníc.
   */
  public static clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
  }

  /**
   * Bezpečné odčítanie s ochranou proti podtečeniu pod nulu (vhodné pre životy/integritu).
   */
  public static safeSubtractToZero(base: number, decrement: number): number {
    if (!Number.isFinite(base) || !Number.isFinite(decrement)) return Math.max(0, base);
    return Math.max(0, base - decrement);
  }
}
```

Tento pomocný modul [SafeMath](file:///packages/server/src/utils/SafeMath.ts) by mal byť prioritne nasadený vo všetkých výpočtoch stavového prechodu v súbore `EnginePipeline.ts` na zaistenie absolútnej výpočtovej bezpečnosti.
