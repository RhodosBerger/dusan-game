// packages/server/src/models/GameplayCompositionEngine.ts
import { SovereignEngine } from './SovereignEngine';

export interface CanvasCompositionPayload {
  hexHistory: string[]; // Hexadecimal addresses from memory logs (e.g., 0x11030303)
  animationSequences: { [threadId: string]: 'slow_walk' | 'walk' | 'hover_idle' | 'attack_pose' };
  npcTactics: {
    npcThreadId: string;
    targetLocation: { meta: number; hex: number };
    preferred8Direction: number; // 0-7 compass directions
    tacticalWeight: number; // calculated weights
  }[];
}

export class GameplayCompositionEngine {
  /**
   * Generates the canvas composition dataset mapping algebraic physics sequences,
   * hexadecimal memory keys, and character/NPC animations.
   */
  static getCanvasComposition(engine: SovereignEngine, threadId: string): CanvasCompositionPayload | null {
    const activeThread = engine.threads.find(t => t.id === threadId);
    if (!activeThread) return null;

    // 1. Generate hexadecimal path memory log strings (like in Test 22)
    // Format: 0x [MacroIndex: 2 hex chars] [SubIndex: 2 hex chars] [Energy/Status: 4 hex chars]
    const hexHistory: string[] = [];
    engine.traceLog.slice(-5).forEach((log: any) => {
      let chunkId = 4;
      let blockId = 3;
      if (log.to) {
        chunkId = log.to.meta;
        blockId = log.to.hex;
      } else if (log.chunkId !== undefined) {
        chunkId = log.chunkId;
        blockId = log.blockId;
      }
      const hexStr = '0x' + 
        chunkId.toString(16).padStart(2, '0') + 
        blockId.toString(16).padStart(2, '0') + 
        '0303'; // Status/physics suffix padding
      hexHistory.push(hexStr);
    });

    // Fallback if history is empty
    if (hexHistory.length === 0) {
      const posMeta = activeThread.position.meta ?? 4;
      const posHex = activeThread.position.hex ?? 3;
      hexHistory.push('0x' + posMeta.toString(16).padStart(2, '0') + posHex.toString(16).padStart(2, '0') + '0303');
    }

    // 2. Generate animation mappings based on status effects (Slowed/Rooted walk speed penalty)
    const animationSequences: CanvasCompositionPayload['animationSequences'] = {};
    engine.threads.forEach((thread) => {
      const isSlowed = thread.isSlowed || thread.isRooted;
      const isCritical = thread.health <= 3;
      
      if (isSlowed) {
        animationSequences[thread.id] = 'slow_walk';
      } else if (isCritical) {
        animationSequences[thread.id] = 'hover_idle';
      } else {
        animationSequences[thread.id] = 'walk';
      }
    });

    // 3. Map NPC 8-directional combat tactics vectors
    const npcTactics: CanvasCompositionPayload['npcTactics'] = [];
    engine.threads.forEach((thread) => {
      if (thread.type === 'NPC' || thread.id.includes('boss')) {
        // Map target direction using 3x3 layout distance diffs
        const dx = (activeThread.position.meta ?? 4) - (thread.position.meta ?? 4);
        const dy = (activeThread.position.hex ?? 3) - (thread.position.hex ?? 3);
        
        // Calculate 8-direction index (0 to 7) based on angle
        const angle = Math.atan2(dy, dx);
        let dirIndex = Math.round(((angle + Math.PI) / (Math.PI / 4))) % 8;

        npcTactics.push({
          npcThreadId: thread.id,
          targetLocation: { meta: activeThread.position.meta ?? 4, hex: activeThread.position.hex ?? 3 },
          preferred8Direction: dirIndex,
          tacticalWeight: Math.min(1.0, Number((0.5 + Math.random() * 0.5).toFixed(2)))
        });
      }
    });

    return {
      hexHistory,
      animationSequences,
      npcTactics
    };
  }
}
