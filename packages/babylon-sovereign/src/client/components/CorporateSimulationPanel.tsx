import React, { useState, useEffect } from 'react';

interface SimulationResult {
  duration: number;
  totalDamage: number;
  totalHeat: number;
  successfulRounds: number;
  blockedRounds: number;
  sampleLogs: string[];
  isWasm: boolean;
}

interface ThreadState {
  id: number;
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'ERROR';
  duration?: number;
  throughput?: number; // iterations / ms
}

interface CorporateSimulationPanelProps {
  onClose: () => void;
}

export default function CorporateSimulationPanel({ onClose }: CorporateSimulationPanelProps) {
  const [iterations, setIterations] = useState<number>(10000);
  const [threadCount, setThreadCount] = useState<number>(4);
  const [threads, setThreads] = useState<ThreadState[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Aggregated results
  const [aggregateResult, setAggregateResult] = useState<{
    totalDuration: number;
    avgThroughput: number;
    totalDamage: number;
    totalHeat: number;
    totalRounds: number;
    usingWasm: boolean;
  } | null>(null);

  useEffect(() => {
    // Initialize thread slots
    const initialThreads = Array.from({ length: threadCount }, (_, i) => ({
      id: i + 1,
      status: 'IDLE' as const
    }));
    setThreads(initialThreads);
  }, [threadCount]);

  const handleRunSimulation = async () => {
    setIsRunning(true);
    setLogs(['[SIMULATION] Spúšťam distribuovanú simuláciu...', `[SIMULATION] Spawnuje sa ${threadCount} paralelných jadier (Web Workers)...`]);
    setAggregateResult(null);

    const iterationsPerThread = Math.floor(iterations / threadCount);
    const startSimTime = performance.now();

    // Spawning workers concurrently
    const workerPromises = Array.from({ length: threadCount }, (_, threadIdx) => {
      return new Promise<SimulationResult>((resolve, reject) => {
        setThreads(prev => 
          prev.map(t => t.id === threadIdx + 1 ? { ...t, status: 'RUNNING' } : t)
        );

        // Instantiate worker via Vite native URL loader
        const worker = new Worker(
          new URL('../simulation.worker.ts', import.meta.url),
          { type: 'module' }
        );

        worker.onmessage = (e) => {
          if (e.data.status === 'SUCCESS') {
            const threadDuration = e.data.duration;
            const throughput = iterationsPerThread / threadDuration;
            
            setThreads(prev => 
              prev.map(t => t.id === threadIdx + 1 ? { 
                ...t, 
                status: 'COMPLETED',
                duration: threadDuration,
                throughput
              } : t)
            );

            // Log details
            setLogs(prev => [
              ...prev,
              `[Vlákno #${threadIdx + 1}] Dokončené v čase ${threadDuration.toFixed(1)}ms (${throughput.toFixed(1)} iterácií/ms)`,
              ...e.data.sampleLogs.map((l: string) => `  ↳ [Vlákno #${threadIdx + 1}] ${l}`)
            ]);

            worker.terminate();
            resolve(e.data);
          } else {
            worker.terminate();
            reject(new Error(e.data.error || 'Neznáma chyba vo workerovi'));
          }
        };

        worker.onerror = (err) => {
          setThreads(prev => 
            prev.map(t => t.id === threadIdx + 1 ? { ...t, status: 'ERROR' } : t)
          );
          worker.terminate();
          reject(err);
        };

        // Post task to worker. Vite serves the go_core.wasm from root public directory.
        worker.postMessage({
          action: 'START_SIMULATION',
          iterations: iterationsPerThread,
          wasmUrl: '/go_core.wasm'
        });
      });
    });

    try {
      const results = await Promise.all(workerPromises);
      const totalDuration = performance.now() - startSimTime;

      // Aggregate outputs
      let totalDamage = 0;
      let totalHeat = 0;
      let totalRounds = 0;
      let usingWasm = true;

      results.forEach(res => {
        totalDamage += res.totalDamage;
        totalHeat += res.totalHeat;
        totalRounds += res.successfulRounds + res.blockedRounds;
        if (!res.isWasm) usingWasm = false;
      });

      const avgThroughput = totalRounds / totalDuration;

      setAggregateResult({
        totalDuration,
        avgThroughput,
        totalDamage,
        totalHeat,
        totalRounds,
        usingWasm
      });

      setLogs(prev => [
        `[SIMULATION] Úspešne dokončená simulácia pre celkovo ${totalRounds.toLocaleString()} kôl!`,
        `[SIMULATION] Celkový čas výpočtu: ${totalDuration.toFixed(1)}ms. Priemerný výkon: ${avgThroughput.toFixed(1)} iterácií/ms.`,
        ...prev
      ]);
    } catch (err: any) {
      console.error(err);
      setLogs(prev => [...prev, `[CHYBA] Simulácia zlyhala: ${err.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-[70] pointer-events-auto p-4">
      <div className="bg-[#0b0b12]/95 border-2 border-purple-500/40 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(168,85,247,0.25)]">
        
        {/* Header */}
        <div className="p-5 border-b border-purple-500/20 flex items-center justify-between bg-purple-950/20">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏢</span>
            <div>
              <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wider">Multi-Threaded Sovereign Simulation</h2>
              <p className="text-xs text-purple-400 font-mono">Autoritatívny výpočtový model pomocou Go WebAssembly</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white font-mono font-bold text-sm bg-slate-900/80 px-3 py-1.5 rounded-lg border border-purple-500/20 hover:bg-purple-900/50 cursor-pointer"
          >
            Zavrieť [ESC]
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col md:flex-row gap-6">
          
          {/* Left panel: Controls & Stats */}
          <div className="flex-1 space-y-6">
            
            {/* Control Form */}
            <div className="bg-slate-950/60 border border-purple-500/10 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-mono text-purple-300 uppercase tracking-widest border-b border-purple-500/10 pb-2">Nastavenie simulácie</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-mono uppercase">Počet kôl (Iterácie)</label>
                  <select 
                    value={iterations}
                    onChange={(e) => setIterations(Number(e.target.value))}
                    disabled={isRunning}
                    className="w-full bg-[#0d0d18] border border-purple-500/30 text-white font-mono text-xs rounded-lg p-2 focus:outline-none focus:border-purple-400"
                  >
                    <option value={1000}>1,000</option>
                    <option value={10000}>10,000</option>
                    <option value={50000}>50,000</option>
                    <option value={100000}>100,000</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-mono uppercase">Paralelné jadrá (Workers)</label>
                  <select 
                    value={threadCount}
                    onChange={(e) => setThreadCount(Number(e.target.value))}
                    disabled={isRunning}
                    className="w-full bg-[#0d0d18] border border-purple-500/30 text-white font-mono text-xs rounded-lg p-2 focus:outline-none focus:border-purple-400"
                  >
                    <option value={1}>1 jadro (Single-thread)</option>
                    <option value={2}>2 jadrá</option>
                    <option value={4}>4 jadrá</option>
                    <option value={8}>8 jadier</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleRunSimulation}
                disabled={isRunning}
                className="w-full bg-purple-900 hover:bg-purple-800 disabled:bg-purple-950/50 border border-purple-400/50 text-white font-mono font-bold py-2.5 rounded-lg tracking-wider transition-all uppercase cursor-pointer text-xs"
              >
                {isRunning ? '⏳ Simulácia beží...' : '⚡ Spustiť paralelnú WASM simuláciu'}
              </button>
            </div>

            {/* Core utilization view */}
            <div className="bg-slate-950/60 border border-purple-500/10 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-mono text-purple-300 uppercase tracking-widest border-b border-purple-500/10 pb-2">Status vlákien CPU</h3>
              <div className="grid grid-cols-2 gap-3">
                {threads.map((t) => (
                  <div key={t.id} className="bg-[#0b0b12] border border-slate-900 p-2.5 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        t.status === 'RUNNING' ? 'bg-amber-400 animate-pulse' :
                        t.status === 'COMPLETED' ? 'bg-emerald-500' :
                        t.status === 'ERROR' ? 'bg-red-500' : 'bg-slate-700'
                      }`} />
                      <span className="text-[10px] text-slate-300 font-mono">Core #{t.id}</span>
                    </div>
                    {t.throughput && (
                      <span className="text-[9px] text-purple-400 font-mono">
                        {t.throughput.toFixed(0)} iter/ms
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Economic hosting block */}
            <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 space-y-2">
              <h4 className="text-[10px] text-emerald-400 font-mono uppercase font-bold">🏢 Výhoda pre Hosting (Corporate Economics)</h4>
              <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
                Prenesením výpočtov do multi-threaded Web Workers v klientskom prehliadači sme zredukovali serverové nároky na nulu. 
                Hra beží v natívnom <strong>Go WebAssembly (WASM)</strong> priamo na klientskych procesoroch, čo eliminuje nutnosť platiť za drahé cloudové hostingové CPU servery.
              </p>
            </div>

          </div>

          {/* Right panel: Aggregated Results & Live Logs */}
          <div className="flex-1 flex flex-col space-y-4 max-h-[50vh] md:max-h-none">
            
            {/* Aggregated results */}
            {aggregateResult && (
              <div className="bg-[#0f111a]/80 border border-purple-500/20 rounded-xl p-4 space-y-3 shadow-md">
                <h3 className="text-xs font-mono text-emerald-400 uppercase tracking-widest border-b border-purple-500/10 pb-2 font-bold">Zjednotené výsledky výpočtu</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block uppercase">Celkové trvanie</span>
                    <span className="text-base text-white font-mono font-bold">{aggregateResult.totalDuration.toFixed(1)}ms</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block uppercase">Celkový výkon</span>
                    <span className="text-base text-emerald-400 font-mono font-bold">{(aggregateResult.avgThroughput * 1000).toLocaleString(undefined, {maximumFractionDigits:0})} / s</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block uppercase">Simulovaný Damage</span>
                    <span className="text-sm text-cyan-400 font-mono font-bold">{aggregateResult.totalDamage.toLocaleString()} HP</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block uppercase">Odstredivé Teplo</span>
                    <span className="text-sm text-red-400 font-mono font-bold">{aggregateResult.totalHeat.toLocaleString()} °C</span>
                  </div>
                </div>
                <div className="text-[9px] text-slate-400 font-mono pt-1 text-center bg-slate-950/30 rounded py-1">
                  Režim jadra: {aggregateResult.usingWasm ? '⚡ Natívne Go WebAssembly (authoritative)' : '🔧 TypeScript Fallback'}
                </div>
              </div>
            )}

            {/* Diagnostic Logs console */}
            <div className="flex-1 flex flex-col min-h-[200px] bg-black border border-purple-500/10 rounded-xl overflow-hidden font-mono text-xs">
              <div className="bg-slate-950 border-b border-purple-500/10 p-2.5 flex items-center justify-between text-slate-400 text-[10px] uppercase">
                <span>Vývojová konzola diagnostiky</span>
                <button 
                  onClick={() => setLogs([])}
                  className="hover:text-white bg-slate-900 border border-slate-800 px-2 py-0.5 rounded cursor-pointer"
                >
                  Vyčistiť
                </button>
              </div>
              <div className="flex-1 p-3 overflow-y-auto space-y-1.5 text-slate-300 font-mono text-[11px] h-[25vh]">
                {logs.length === 0 ? (
                  <div className="text-slate-600 text-center pt-8">Čakám na spustenie simulácie...</div>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className="whitespace-pre-wrap leading-relaxed border-l-2 border-purple-500/20 pl-2">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
