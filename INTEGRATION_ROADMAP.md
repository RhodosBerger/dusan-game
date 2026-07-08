# Integračná a implementačná roadmapa: Od MVP k Big Data Telemetrii

Tento dokument slúži ako technická a architektonická mapa pre vývojárov. Obsahuje **presné kódy, rozhrania a šablóny funkcií**, ktoré definujú integráciu jednotlivých modulov. Architektúra je navrhnutá s dôrazom na **modularitu, bezstavovosť (statelessness) a dlhodobú udržateľnosť**.

---

## 📑 Prehľad modulárnych vrstiev

```
dusan-game/
 ├── packages/
 │    ├── shared/
 │    │    └── src/
 │    │         ├── core/
 │    │         │    ├── compiler.ts      <-- MODUL 1: Kompilátor kariet na inštrukcie
 │    │         │    └── events.ts        <-- MODUL 3: Schémy telemetrických udalostí
 │    ├── server/
 │    │    └── src/
 │    │         ├── models/
 │    │         │    └── EnginePipeline.ts <-- MODUL 2: Bezstavový výpočtový pipeline
 │    │         └── services/
 │    │              └── KBService.ts     <-- MODUL 4: Znalostná báza a rule registry
```

---

## 1. MODUL 1: Prepojenie Dátového Modelu (Shared Card Compiler)

Tento modul prekladá hernú kartu (`LocalizedCard` zo shared balíčka) na fyzikálnu inštrukciu (`Instruction` pre serverový simulátor). Zabezpečuje preklad RPG logiky na Ohmov zákon.

*   **Súbor:** `/packages/shared/src/core/compiler.ts`

```typescript
import { LocalizedCard, CardSpecification, CardEffect } from './types';

// Definícia serverovej inštrukcie tak, aby bola zhodná s backend simulátorom
export interface InstructionEffects {
  thermalThrottling: boolean;
  chronoLock: boolean;
  syntaxMute: boolean;
  threadIsolation: boolean;
}

export interface CompiledInstruction {
  id: string;
  name: string;
  type: 'ACTION' | 'HELPER';
  voltage: number;
  resistance: number;
  semanticErosion: number;
  effects: InstructionEffects;
  helperStats: any | null;
}

/**
 * Kompilátor: Prekladá hernú kartu na inštrukciu pre serverový fyzikálny simulátor.
 */
export function compileCardToInstruction(card: LocalizedCard): CompiledInstruction {
  const isHelper = card.isUnit && card.unitType !== 'trap' && card.unitType !== 'bomb';
  
  // Základné parametre kompilácie
  let voltage = 1;
  let resistance = 0;
  let semanticErosion = 1;
  
  // Priradenie hodnôt podľa kategorizácie karty
  switch (card.cardCategorization) {
    case 'attack':
      voltage = card.isUltimate ? 6 : 3;
      semanticErosion = card.isUltimate ? 3 : 2;
      break;
    case 'magic':
      voltage = card.isUltimate ? 4 : 2;
      resistance = card.isUltimate ? 3 : 1;
      semanticErosion = card.isUltimate ? 2 : 1;
      break;
    case 'movement':
      voltage = 1;
      resistance = 1;
      semanticErosion = 0;
      break;
    case 'enhancement':
      voltage = 0;
      resistance = 2;
      semanticErosion = 0;
      break;
  }

  // Preklad efektov na HW analógie (fyzikálne obmedzenia)
  const effects: InstructionEffects = {
    thermalThrottling: card.specifications.includes('aoe'),
    chronoLock: card.effect === 'slow' || card.effect === 'root',
    syntaxMute: card.effect === 'silence',
    threadIsolation: card.effect === 'disarm' || card.specifications.includes('block')
  };

  // Nastavenie pre jednotky/pomocníkov
  let helperStats = null;
  if (isHelper) {
    helperStats = {
      memoryIntegrity: card.isUltimate ? 8 : 4,
      resistance: card.isUltimate ? 4 : 2,
      attackReach: card.specifications.includes('rangeAttack') ? 2 : 1
    };
  }

  return {
    id: `inst_${card.id}`,
    name: card.name.toUpperCase().replace(/\s+/g, '_'),
    type: isHelper ? 'HELPER' : 'ACTION',
    voltage,
    resistance,
    semanticErosion,
    effects,
    helperStats
  };
}
```

---

## 2. MODUL 2: Bezstavový Výpočtový Engine (State Engine Pipeline)

Refaktoring OOP modelu `SovereignEngine` na čisté, side-effect-free funkcie transformácie stavu. Toto je základný kameň pre škálovateľnosť a Big Data.

*   **Súbor:** `/packages/server/src/models/EnginePipeline.ts`

```typescript
import { CompiledInstruction } from '@dusan-game/shared/src/core/compiler';

export interface Position {
  meta: number | null;
  hex: number | null;
}

export interface ThreadState {
  id: string;
  type: 'PLAYER' | 'HELPER';
  memoryIntegrity: number;
  resistance: number;
  position: Position;
  currentBuffer: string[]; // zoznam cardIds
}

export interface ActionNodeState {
  id: string;
  instruction: CompiledInstruction;
  sourceId: string;
  targetId: string | null;
  reactions: ActionNodeState[];
}

export interface GameState {
  state: 'WAITING_FOR_PLAYERS' | 'PLAYER_TURN' | 'INTERRUPT_WINDOW' | 'GAME_OVER';
  systemHeat: number;
  globalEntropy: number;
  threads: ThreadState[];
  actionNetwork: ActionNodeState[];
}

/**
 * Čistá funkcia na výpočet odporu reakčného reťazca
 */
export function calculateNodeResistance(node: ActionNodeState): number {
  return node.reactions.reduce((total, rx) => {
    return total + rx.instruction.resistance + calculateNodeResistance(rx);
  }, 0);
}

/**
 * PURE STATE TRANSITION: Spracuje celú sieť akcií a vráti nový stav hry bez mutácie vstupu.
 */
export function resolveEngineState(currentState: GameState): GameState {
  // Hlboká kópia pre zachovanie referenčnej transparentnosti
  const nextState: GameState = JSON.parse(JSON.stringify(currentState));
  
  for (const node of nextState.actionNetwork) {
    if (node.instruction.type !== 'ACTION') continue;

    const targetThread = nextState.threads.find(t => t.id === node.targetId);
    if (!targetThread) continue;

    // Fyzikálny prepočet Ohmovho zákona: I = V / (R_target + R_reactions)
    const V = node.instruction.voltage;
    const R = targetThread.resistance + calculateNodeResistance(node);
    
    const effectiveR = Math.max(0.1, R);
    const current = V / effectiveR;

    if (current >= 1.0) {
      // Úspech -> Uplatnenie sémantickej erózie (damage)
      targetThread.memoryIntegrity = Math.max(0, targetThread.memoryIntegrity - node.instruction.semanticErosion);
    } else {
      // Zlyhanie -> Prebytočná energia vytvorí teplo (trenie)
      const friction = Math.max(0, R - V);
      nextState.systemHeat += friction;
    }
  }

  // Vyčistenie spracovanej siete
  nextState.actionNetwork = [];

  // Spracovanie termodynamickej očisty pri prehriatí
  if (nextState.systemHeat > 100) {
    nextState.threads.sort((a, b) => a.memoryIntegrity - b.memoryIntegrity);
    if (nextState.threads.length > 0) {
      const weakest = nextState.threads[0];
      // Dealokácia (odstránenie) najslabšieho vlákna
      nextState.threads = nextState.threads.filter(t => t.id !== weakest.id);
      nextState.systemHeat = Math.max(0, nextState.systemHeat - 20);
    }
  }

  return nextState;
}
```

---

## 3. MODUL 3: Unifikovaný Telemetrický Event Bus (Event Sourcing)

Definuje dátové udalosti, ktoré sa generujú pri prechodoch stavov a slúžia pre Big Data telemetrickú analýzu pohybu na políčkach.

*   **Súbor:** `/packages/shared/src/core/events.ts`

```typescript
export type GameEventType = 'PLAYER_MOVED' | 'ACTION_RESOLVED' | 'THERMAL_PURGE';

export interface BaseGameEvent {
  eventId: string;
  matchId: string;
  timestamp: number;
  stepIndex: number;
  type: GameEventType;
}

export interface PlayerMovedEvent extends BaseGameEvent {
  type: 'PLAYER_MOVED';
  threadId: string;
  from: { meta: number | null; hex: number | null };
  to: { meta: number | null; hex: number | null };
}

export interface ActionResolvedEvent extends BaseGameEvent {
  type: 'ACTION_RESOLVED';
  sourceId: string;
  targetId: string;
  instructionId: string;
  voltage: number;
  resistance: number;
  current: number;
  success: boolean;
  damageInflicted: number;
  heatGenerated: number;
}

export interface ThermalPurgeEvent extends BaseGameEvent {
  type: 'THERMAL_PURGE';
  deallocatedThreadId: string;
  systemHeatBefore: number;
  systemHeatAfter: number;
}

export type GameEvent = PlayerMovedEvent | ActionResolvedEvent | ThermalPurgeEvent;
```

---

## 4. MODUL 4: Dynamický Rule Loader (Knowledge Base Registry)

Tento modul načítava preklady a statické karty a registruje kompilované pravidlá. Umožňuje hot-reload zmeny balansu (napríklad z databázy alebo JSON súboru) bez reštartu backendu.

*   **Súbor:** `/packages/server/src/services/KBService.ts`

```typescript
import { CardBase, LocalizedCard } from '@dusan-game/shared/src/data/base/types';
import { CompiledInstruction, compileCardToInstruction } from '@dusan-game/shared/src/core/compiler';

export class KnowledgeBaseService {
  private static instance: KnowledgeBaseService;
  private cardRegistry: Map<string, LocalizedCard>;
  private instructionRegistry: Map<string, CompiledInstruction>;

  private constructor() {
    this.cardRegistry = new Map();
    this.instructionRegistry = new Map();
  }

  public static getInstance(): KnowledgeBaseService {
    if (!this.instance) {
      this.instance = new KnowledgeBaseService();
    }
    return this.instance;
  }

  /**
   * Zaregistruje sadu kariet a preloží ich na inštrukcie pre herný engine.
   */
  public loadCards(cards: CardBase[], translations: Record<string, { name: string; description: string }>) {
    cards.forEach(base => {
      const trans = translations[base.id] || { name: base.id, description: '' };
      const localizedCard: LocalizedCard = {
        ...base,
        name: trans.name,
        description: trans.description
      };
      
      this.cardRegistry.set(base.id, localizedCard);
      
      // Kompilácia do HW/fyzikálneho formátu
      const instruction = compileCardToInstruction(localizedCard);
      this.instructionRegistry.set(base.id, instruction);
    });
    
    console.log(`[KnowledgeBase] Successfully registered and compiled ${this.cardRegistry.size} cards.`);
  }

  public getInstruction(cardId: string): CompiledInstruction | undefined {
    return this.instructionRegistry.get(cardId);
  }

  public getCard(cardId: string): LocalizedCard | undefined {
    return this.cardRegistry.get(cardId);
  }
}
```

---

## 🛠️ Záchytné body pre udržateľnosť kódu (Sustainability Guidelines)

1.  **Strict Event Contracts:** Akékoľvek nové pravidlo hry (napr. nová vlastnosť hrdinu) musí byť najskôr zadefinované v `packages/shared/src/core/events.ts` a zdokumentované. Tým sa predíde rozpadu Big Data pipeline.
2.  **No Direct State Mutations:** Serverová logika nesmie priamo upravovať (`mutate`) herný stav. Všetky zmeny sa musia diať cez `resolveEngineState`.
3.  **Strict Typing on Hex Math:** Akékoľvek priestorové mapovanie na mapových bunkách musí striktne rešpektovať axial/cube koordináty z `HexMath3D.js` kvôli kompatibilite s priestorovou ClickHouse databázou.
