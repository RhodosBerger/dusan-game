# Štúdia: Zosúladenie Pravidiel Arény (Poslední kmen) s Architektúrou Sovereign Engine

Táto štúdia analyzuje oficiálnu knihu pravidiel hry **Poslední kmen** a popisuje, ako tieto pravidlá implementovať v bezstavovej (stateless) architektúre herného backendu. Zároveň sa zameriava na predchádzanie nebezpečným výpočtovým stavom a navrhuje brainstorming pre alternatívne mechaniky.

---

## 1. Analýza pravidiel a ich integrácia do bezstavového stavu (State Engine)

Oficiálne pravidlá zavádzajú zložité logické stavy, ktoré musíme presne mapovať v našom modeli `GameState` v súbore `EnginePipeline.ts`.

### A. Pravidlo shody pri dobírání (Koniec tahu)
*   **Pravidlo:** Ak si hráč na tahu doberie $N$ kariet, všetci ostatní si taktiež doberú $N$ kariet (do svojho limitu). Ak má niekto viac kariet než limit a nič si neberie, nikto iný si v tom kole nič neberie.
*   **Bezpečná implementácia (TypeScript):**
    Aby sme sa vyhli nekonečným slučkám pri dopĺňaní rúk viacerých hráčov, implementujeme čistú funkciu pre fázu konca tahu s explicitnými limitmi:
    ```typescript
    export function resolveEndTurnDrawing(threads: ThreadState[], activeThreadId: string, cardsDrawnByActive: number): ThreadState[] {
      return threads.map(thread => {
        const isPlayer = thread.type === 'PLAYER';
        if (!isPlayer) return thread;

        // Trvalý limit kariet (základ 4 + sebrané vlajky)
        const handLimit = thread.handLimit; 
        const currentHandSize = thread.currentBuffer.length;

        if (thread.id === activeThreadId) {
          // Hráč na tahu si doberie do limitu
          const drawAmount = Math.max(0, handLimit - currentHandSize);
          return { ...thread, currentBuffer: [...thread.currentBuffer, ...drawCards(drawAmount)] };
        } else {
          // Ostatní si doberú toľko isto ako aktívny, max do svojho limitu
          const drawAmount = Math.min(cardsDrawnByActive, Math.max(0, handLimit - currentHandSize));
          return { ...thread, currentBuffer: [...thread.currentBuffer, ...drawCards(drawAmount)] };
        }
      });
    }
    ```

### B. Prvé kolo: Bezpečný rozjezd (Ochrana Hrdinov)
*   **Pravidlo:** Hrdina nemôže prísť o životy, ale pomocníci (jednotky) v prvom kole normálne umierajú.
*   **Bezpečná implementácia:**
    Zavádzame stavový príznak `isFirstRound: boolean` v `GameState`. Pri vyhodnocovaní Ohmovho zákona v `resolveEngineState` pridáme kontrolu:
    ```typescript
    const isTargetHero = targetThread.type === 'PLAYER' && targetThread.ownerId === null; // Hrdina
    
    if (isFirstRound && isTargetHero) {
      // Ochrana Hrdinu v prvom kole -> Sémantická erózia (damage) sa neaplikuje
      // Avšak neúspech generuje trenie/teplo normálne
      if (current < 1.0) {
        nextState.systemHeat += Math.max(0, R - V);
      }
    } else {
      // Štandardné vyhodnotenie
      if (current >= 1.0) {
        targetThread.memoryIntegrity = Math.max(0, targetThread.memoryIntegrity - node.instruction.semanticErosion);
      } else {
        nextState.systemHeat += Math.max(0, R - V);
      }
    }
    ```

### C. Negatívne stavy a odhadzovanie stavov (`axiomaticFlags`)
Preklad stavov (Spomalenie, Zakorenenie, Odzbrojenie, Umlčanie) do bitových masiek (`bitmasks`) pre bezpečné a rýchle vyhodnocovanie v simulátore:

```typescript
export enum HeroStateFlags {
  NONE = 0,
  SLOWED = 1 << 0,      // Spomalenie: nemôže využiť volný pohyb, nemôže opustiť hex
  ROOTED = 1 << 1,      // Zakorenenie: nemôže hrať pohybové (žlté) karty
  DISARMED = 1 << 2,    // Odzbrojenie: nemôže hrať útočné (červené) karty
  SILENCED = 1 << 3     // Umlčanie: nemôže hrať modré (kúzelné) karty
}
```

*   **Bezpečná očista stavu:**
    Podľa pravidiel, odstránenie stavu stojí 1 akciu a vyžaduje odhodenie príslušnej karty (napr. pohybovej pri spomalení), avšak bez reálneho posunu na ploche. V bezúnikovej očiste iba vymažeme príslušný bit z vlajok hrdinu:
    ```typescript
    export function removeStateFlag(thread: ThreadState, flagToRemove: HeroStateFlags): ThreadState {
      return {
        ...thread,
        axiomaticFlags: thread.axiomaticFlags & ~flagToRemove
      };
    }
    ```

---

## 2. Vyriešenie konfliktu: Simultánne vyhodnotenie (Simultaneous Death)

*   **Konflikt:** 
    Simulátor `SovereignEngine` v pôvodnom stave vyhodnocoval uzly v akčnej sieti **sekvenčne** (jeden po druhom). Ak by v reťazci reakcií obaja hrdinovia klesli na 0 životov, ten, ktorý by bol vyhodnotený prvý, by okamžite prehral, čo je v rozpore s pravidlom remízy (simultánna smrť na konci reakčného reťazca).
*   **Unifikované riešenie: Deferred Diff Map (Odložená aplikácia zmien)**
    Namiesto okamžitého znižovania `memoryIntegrity` počas prechodu sieťou, engine spočíta celkové škody a zmeny tepla, a uplatní ich **naraz (simultánne)** na konci vyhodnocovacej fázy.

```typescript
export function resolveEngineStateSimultaneously(currentState: GameState): GameState {
  const nextState: GameState = JSON.parse(JSON.stringify(currentState));
  
  // Mapa odložených zmien: ThreadId -> Zníženie integrity
  const damageDiffMap = new Map<string, number>();
  let accumulatedHeat = 0;

  // 1. fáza: Výpočet prúdu a akumulácia škôd
  for (const node of nextState.actionNetwork) {
    if (node.instruction.type !== 'ACTION' || !node.targetId) continue;

    const targetThread = nextState.threads.find(t => t.id === node.targetId);
    if (!targetThread) continue;

    const V = node.instruction.voltage;
    const R = targetThread.resistance + calculateNodeResistance(node);
    const effectiveR = Math.max(0.1, R);
    const current = V / effectiveR;

    if (current >= 1.0) {
      const currentDamage = damageDiffMap.get(node.targetId) || 0;
      damageDiffMap.set(node.targetId, currentDamage + node.instruction.semanticErosion);
    } else {
      accumulatedHeat += Math.max(0, R - V);
    }
  }

  // 2. fáza: Simultánne uplatnenie škôd
  nextState.threads = nextState.threads.map(thread => {
    const damage = damageDiffMap.get(thread.id) || 0;
    if (damage > 0) {
      return {
        ...thread,
        memoryIntegrity: Math.max(0, thread.memoryIntegrity - damage)
      };
    }
    return thread;
  });

  // Aplikácia tepla
  nextState.systemHeat = Math.min(150, nextState.systemHeat + accumulatedHeat);
  nextState.actionNetwork = [];

  // 3. fáza: Vyhodnotenie podmienok konca hry (Remíza vs. Výhra)
  const deadPlayers = nextState.threads.filter(t => t.type === 'PLAYER' && t.memoryIntegrity <= 0);
  if (deadPlayers.length === 2) {
    nextState.state = 'GAME_OVER';
    console.log('[GAME_OVER] Simultánna eliminácia oboch Hrdinov. Zápas končí REMÍZOU.');
  } else if (deadPlayers.length === 1) {
    nextState.state = 'GAME_OVER';
    const winner = nextState.threads.find(t => t.type === 'PLAYER' && t.memoryIntegrity > 0);
    console.log(`[GAME_OVER] Hrdina ${winner?.id} zvíťazil.`);
  }

  return nextState;
}
```

---

## 3. Brainstorming a Alternatívne Adaptácie reakcií

Pravidlo Boja hovorí: *„Reagující hráč může v rámci jedné reakce zahrát přesně jednu akci.“* Zvážme rozšírenia tohto konceptu:

### Adaptácia A: Kooperatívne reakcie v hre 3 hráčov (Cooperative Reaction)
*   **Pravidlo:** Ak Hráč A útočí na Hráča B, Hráč C (spojenec alebo tretia strana) môže použiť svoju reakciu na to, aby priložil odpor ($R$) do vetvy Hráča B, čím zníži celkový prúd útočníka ($I < 1$).
*   **Architektonický dopad:** `ActionNode.reactions` môže obsahovať uzly od rôznych `sourceId`. Vyhodnotenie Ohmovho zákona zostáva rovnaké, čím je zachovaná modularita kódu.

### Adaptácia B: Sériovo-paralelné radenie reakcií (Series-Parallel Reaction Circuits)
*   **Pravidlo:** Reakcie sa nemusia radiť len ako stromová štruktúra (reakcia na reakciu). Hráči môžu zahrať paralelné reakcie (napríklad zablokovať útok viacerými pomocníkmi súčasne).
*   **Výpočet odporu:** Ak sú reakcie paralelné, celkový odpor vetvy klesá (podľa fyziky paralelných obvodov):
    $$\frac{1}{R_{total}} = \frac{1}{R_1} + \frac{1}{R_2}$$
    Tento prístup otvára obrovský priestor pre strategické ukladanie pomocníkov v Aréne.

---

## 4. Prevencia Out-of-Bounds (OOB) útokov na mriežke

Priestorové overenie dosahu útokov (`attackReach` a `spellReach`) a overenie úhybov na hexagonálnej sieti:
*   Pre výpočet vzdialenosti medzi hexagónmi používame axiálne súradnice $(q, r)$. Vzdialenosť je definovaná ako:
    $$dist(A, B) = \frac{|A.q - B.q| + |A.q + A.r - B.q - B.r| + |A.r - B.r|}{2}$$
*   Pred spracovaním akejkoľvek inštrukcie v sieti simulátor vykoná **bezpečnostnú kontrolu vzdialenosti** (Distance Validation Guard), aby sa zabránilo neplatným útokom mimo dosahu (OOB):
    ```typescript
    export function validateActionDistance(source: ThreadState, target: ThreadState, reach: number): boolean {
      if (source.position.meta === null || target.position.meta === null) return false;
      
      // Ak sú na inej metapozícii, musíme zohľadniť vzdialenosť makro-stredov
      const distance = calculateHexDistance(source.position, target.position);
      return distance <= reach;
    }
    ```
    *Ak kontrola vráti false, inštrukcia je označená ako neplatná a okamžite zahodená bez ovplyvnenia stavu.*
