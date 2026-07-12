// packages/server/src/models/EnginePipeline.ts

import { CompiledInstruction, Pathfinder, BiomeEngine } from '@dusan-game/shared';

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
    return total + rx.instruction.energyCost + calculateNodeResistance(rx);
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

    const sourceThread = nextState.threads.find(t => t.id === node.sourceId);

    // Vypočítame vzdialenosť
    let distance: number | null = null;
    if (sourceThread && sourceThread.position && sourceThread.position.meta !== null && sourceThread.position.hex !== null &&
        targetThread && targetThread.position && targetThread.position.meta !== null && targetThread.position.hex !== null) {
      const startCoords = BiomeEngine.getHexCoordinates(sourceThread.position.meta, sourceThread.position.hex);
      const targetCoords = BiomeEngine.getHexCoordinates(targetThread.position.meta, targetThread.position.hex);
      distance = Pathfinder.hexDistance(startCoords.q, startCoords.r, targetCoords.q, targetCoords.r);
    }

    // Fyzikálny prepočet Ohmovho zákona: I = V / (R_target + R_reactions)
    const V = node.instruction.damage; // voltage analog
    const R = targetThread.resistance + calculateNodeResistance(node); // resistance analog
    
    const effectiveR = Math.max(0.1, R);
    const current = V / effectiveR;

    if (current >= 1.0) {
      // Úspech -> Uplatnenie sémantickej erózie (damage/hpChange)
      targetThread.memoryIntegrity = Math.max(0, targetThread.memoryIntegrity - node.instruction.hpChange);

      // --- AKČNÝ RULESET PODĽA VZDIALENOSTI A TYPU ---
      if (distance !== null) {
        const cardId = node.instruction.id.toLowerCase();

        if (distance >= 3 && (cardId.includes('mortar') || cardId.includes('blast') || cardId.includes('meteor'))) {
          // 1. Aetheric Mortar AoE Blast: poškodenie susedných hexov
          const targetMeta = targetThread.position.meta!;
          const targetHex = targetThread.position.hex!;
          const targetCoords = BiomeEngine.getHexCoordinates(targetMeta, targetHex);

          const adjacentThreads = nextState.threads.filter(t => {
            if (t.id === targetThread.id) return false;
            if (t.position.meta === null || t.position.hex === null) return false;
            const tCoords = BiomeEngine.getHexCoordinates(t.position.meta, t.position.hex);
            const dist = Pathfinder.hexDistance(targetCoords.q, targetCoords.r, tCoords.q, tCoords.r);
            return dist === 1;
          });

          adjacentThreads.forEach(t => {
            t.memoryIntegrity = Math.max(0, t.memoryIntegrity - Math.ceil(node.instruction.hpChange / 2));
          });

          // Dlhá dráha vytvára vysoké trenie plynu arény
          nextState.systemHeat += 15;

        } else if (distance === 2 && (cardId.includes('arc') || cardId.includes('chain') || cardId.includes('surge'))) {
          // 2. Short-Circuit Arc: reťazenie na najbližší iný cieľ
          const otherThreads = nextState.threads.filter(t => t.id !== targetThread.id && t.id !== node.sourceId && t.position.meta !== null);
          if (otherThreads.length > 0) {
            let closestThread = otherThreads[0];
            let minDist = Infinity;
            const targetCoords = BiomeEngine.getHexCoordinates(targetThread.position.meta!, targetThread.position.hex!);
            
            otherThreads.forEach(t => {
              const tCoords = BiomeEngine.getHexCoordinates(t.position.meta!, t.position.hex!);
              const dist = Pathfinder.hexDistance(targetCoords.q, targetCoords.r, tCoords.q, tCoords.r);
              if (dist < minDist) {
                minDist = dist;
                closestThread = t;
              }
            });

            if (minDist <= 2) {
              closestThread.memoryIntegrity = Math.max(0, closestThread.memoryIntegrity - 1);
              closestThread.resistance = Math.max(0.5, closestThread.resistance - 0.2); // Zníženie odporu
            }
          }
        } else if (distance === 1 && (cardId.includes('overload') || cardId.includes('strike') || cardId.includes('melee'))) {
          // 3. Melee Overload: extra priamy fyzický bonus
          targetThread.memoryIntegrity = Math.max(0, targetThread.memoryIntegrity - 1);
        }
      }

    } else {
      // Zlyhanie -> Prebytočná energia vytvorí teplo (trenie)
      const friction = Math.max(0, R - V);
      nextState.systemHeat += friction;
    }
  }

  // Vyčistenie spracovanej Siete
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
