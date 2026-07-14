// Web Worker for multi-threaded combat physics simulation using Go WASM / JS fallbacks.
import { UniversalWasmBridge } from '@dusan-game/shared';

const bridge = new UniversalWasmBridge();
let wasmExports: any = null;

// Listen for messages from the main thread
self.addEventListener('message', async (e: MessageEvent) => {
  const { action, iterations, wasmUrl } = e.data;

  if (action === 'START_SIMULATION') {
    try {
      // 1. Initialize WASM module if not loaded yet
      if (!wasmExports && wasmUrl) {
        console.log(`[WORKER] Fetching Go Core WASM from ${wasmUrl}...`);
        const response = await fetch(wasmUrl);
        if (response.ok) {
          const wasmBuffer = await response.arrayBuffer();
          wasmExports = await bridge.loadModule(wasmBuffer);
          console.log('[WORKER] Go Core WASM loaded successfully inside worker thread.');
        } else {
          console.warn('[WORKER] Failed to fetch WASM binary, falling back to TypeScript math.');
          wasmExports = bridge.getTsFallbacks();
        }
      } else if (!wasmExports) {
        wasmExports = bridge.getTsFallbacks();
      }

      // 2. Run simulation loop
      const startTime = performance.now();
      let totalDamage = 0;
      let totalHeat = 0;
      let successfulRounds = 0;
      let blockedRounds = 0;

      const logLines: string[] = [];

      for (let i = 0; i < iterations; i++) {
        // Random combat parameters
        const voltage = Math.random() * 8 + 1; // 1V - 9V
        const armor = Math.random() * 4 + 1;   // 1 - 5 armor
        const reactions = Math.random() * 2;   // 0 - 2 reactions
        const baseDamage = Math.random() * 10 + 5; // 5 - 15 base damage

        // Solve Ohmic current using WASM kernel if available
        // WASM resolveCombatDamage: (damage, armor, reactions) => final damage
        const finalDamage = wasmExports.resolveCombatDamage
          ? wasmExports.resolveCombatDamage(baseDamage, armor, reactions)
          : Math.round(baseDamage * 0.7); // Simple local fallback

        // Calculate KCL-equivalent current flow
        const resistance = armor + reactions * 0.5;
        const current = voltage / Math.max(0.1, resistance);

        if (current >= 1.0) {
          successfulRounds++;
          totalDamage += finalDamage;
        } else {
          blockedRounds++;
          const heatDissipated = (1.0 - current) * 40;
          totalHeat += heatDissipated;
        }

        if (i < 5) {
          logLines.push(
            `Round ${i + 1}: V=${voltage.toFixed(1)}V, R=${resistance.toFixed(1)}Ω -> I=${current.toFixed(2)}A | Status: ${
              current >= 1.0 ? `SUCCESS (DMG: ${finalDamage})` : `BLOCKED (HEAT: +${heatDissipated.toFixed(1)}C)`
            }`
          );
        }
      }

      const duration = performance.now() - startTime;
      
      // Post results back
      self.postMessage({
        status: 'SUCCESS',
        duration,
        totalDamage: Math.round(totalDamage),
        totalHeat: Math.round(totalHeat),
        successfulRounds,
        blockedRounds,
        sampleLogs: logLines,
        isWasm: !!wasmExports.resolveCombatDamage
      });
    } catch (err: any) {
      self.postMessage({
        status: 'ERROR',
        error: err.message
      });
    }
  }
});
