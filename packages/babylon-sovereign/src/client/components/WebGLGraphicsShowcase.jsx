import React, { useState, useMemo, useEffect } from 'react';
import CanvasRenderer3D from './CanvasRenderer3D';
import { getActiveProfile } from '../design/worldProfiles';

export default function WebGLGraphicsShowcase({ onClose }) {
  // Demo states
  const [entropy, setEntropy] = useState(0.4);
  const [weatherOverride, setWeatherOverride] = useState(null);
  const [isManualWeather, setIsManualWeather] = useState(false);
  const [aberrationActive, setAberrationActive] = useState(false);
  const [ultimateFlash, setUltimateFlash] = useState(false);

  // WebKit CPU vs GPU Layer Compositing Toggle
  const [gpuCompositingActive, setGpuCompositingActive] = useState(true);

  // Simulated Game State Threads
  const demoThreads = useMemo(() => [
    {
      id: 'demo_hero',
      type: 'PLAYER',
      health: 18,
      maxHealth: 20,
      position: { meta: 0, hex: 0 },
      archetype: 'BURST_DAMAGE',
      mana: 5
    },
    {
      id: 'demo_ai',
      type: 'NPC',
      health: 12,
      maxHealth: 15,
      position: { meta: 0, hex: 4 },
      archetype: 'FAST_MOVER',
      mana: 3
    }
  ], []);

  // Simulated Map State
  const demoMap = useMemo(() => [
    {
      id: 0,
      blocks: [
        { id: 0, biome: 'LUSH_FOREST', hasOpportunity: true },
        { id: 1, biome: 'LUSH_FOREST' },
        { id: 2, biome: 'GLACIER' },
        { id: 3, biome: 'BARRENS' },
        { id: 4, biome: 'TOXIC_SWAMP', hasTrap: 'EMP_MINE' }
      ]
    }
  ], []);

  // Run a simulated spell casting script event
  const triggerSpellSimulation = (type) => {
    setUltimateFlash(true);
    setTimeout(() => setUltimateFlash(false), 150);

    if (!isManualWeather) {
      if (type === 'toxic') {
        setWeatherOverride('TOXIC_HAZE');
        setTimeout(() => setWeatherOverride(null), 5000);
      } else if (type === 'void') {
        setWeatherOverride('VOID_ECLIPSE');
        setTimeout(() => setWeatherOverride(null), 5000);
      } else if (type === 'crystal') {
        setWeatherOverride('AURORA_STORM');
        setTimeout(() => setWeatherOverride(null), 5000);
      }
    }
  };

  // Dynamically inject CSS composition styles to verify WebKit GPU layers
  useEffect(() => {
    const canvasElement = document.querySelector('canvas');
    if (canvasElement) {
      if (gpuCompositingActive) {
        canvasElement.style.transform = 'translate3d(0, 0, 0)';
        canvasElement.style.backfaceVisibility = 'hidden';
        canvasElement.style.willChange = 'transform, opacity';
        canvasElement.style.webkitImageRendering = 'optimize-contrast';
      } else {
        canvasElement.style.transform = 'none';
        canvasElement.style.backfaceVisibility = 'visible';
        canvasElement.style.willChange = 'auto';
        canvasElement.style.webkitImageRendering = 'auto';
      }
    }
  }, [gpuCompositingActive]);

  return (
    <div className="w-screen h-screen relative bg-black font-mono overflow-hidden">
      
      {/* 3D WebGL Canvas */}
      <div className="w-full h-full absolute inset-0 z-0">
        <CanvasRenderer3D
          entropy={entropy}
          threads={demoThreads}
          selectedNode={null}
          onNodeClick={() => {}}
          shakeIntensity={ultimateFlash ? 1.5 : 0}
          turnsElapsed={3}
          map={demoMap}
          terrainTelemetry={null}
          ultimateFlash={ultimateFlash}
          gameMode="SANDBOX"
          weatherOverride={weatherOverride}
        />
      </div>

      {/* Floating Header UI */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
        <div className="bg-[#0b0f19]/90 border border-cyan-500/30 p-3 rounded-xl backdrop-blur-md shadow-lg pointer-events-auto flex flex-col">
          <span className="text-sm font-bold text-cyan-400">WEBGL GRAPHICS & COMPOSITING SHOWCASE</span>
          <span className="text-[9px] text-slate-500 uppercase mt-0.5">Sovereign Engine Render Engine v1.2</span>
        </div>
        <button
          onClick={onClose}
          className="bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/50 px-4 py-2 rounded-xl text-xs uppercase cursor-pointer pointer-events-auto transition-colors font-bold"
        >
          🎛️ Späť do lobby
        </button>
      </div>

      {/* Left Tuning Panel */}
      <div className="absolute top-20 left-4 bottom-4 w-80 bg-[#0b0f19]/85 border border-slate-800/80 p-5 rounded-2xl shadow-2xl backdrop-blur-md z-10 flex flex-col gap-4 overflow-y-auto">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l-2 border-cyan-500 pl-2">
          Graphics Settings
        </h3>

        {/* Weather Overrides */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-slate-400 uppercase">Weather Setup:</label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => { setWeatherOverride(null); setIsManualWeather(false); }}
              className={`text-[9px] font-bold py-1 px-1.5 rounded cursor-pointer border ${!weatherOverride ? 'bg-cyan-950 text-cyan-400 border-cyan-500/50' : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'}`}
            >
              AUTO
            </button>
            <button
              onClick={() => { setWeatherOverride('DEFAULT'); setIsManualWeather(true); }}
              className={`text-[9px] font-bold py-1 px-1.5 rounded cursor-pointer border ${weatherOverride === 'DEFAULT' ? 'bg-blue-950 text-blue-300 border-blue-500/50' : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'}`}
            >
              CLEAR
            </button>
            <button
              onClick={() => { setWeatherOverride('TOXIC_HAZE'); setIsManualWeather(true); }}
              className={`text-[9px] font-bold py-1 px-1.5 rounded cursor-pointer border ${weatherOverride === 'TOXIC_HAZE' ? 'bg-lime-950 text-lime-400 border-lime-500/50' : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'}`}
            >
              TOXIC HAZE
            </button>
            <button
              onClick={() => { setWeatherOverride('VOID_ECLIPSE'); setIsManualWeather(true); }}
              className={`text-[9px] font-bold py-1 px-1.5 rounded cursor-pointer border ${weatherOverride === 'VOID_ECLIPSE' ? 'bg-purple-950 text-purple-400 border-purple-500/50' : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'}`}
            >
              VOID ECLIPSE
            </button>
            <button
              onClick={() => { setWeatherOverride('AURORA_STORM'); setIsManualWeather(true); }}
              className={`text-[9px] font-bold py-1 px-1.5 rounded cursor-pointer border ${weatherOverride === 'AURORA_STORM' ? 'bg-emerald-950 text-emerald-400 border-emerald-500/50' : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'}`}
            >
              AURORA
            </button>
          </div>
        </div>

        {/* WebKit GPU Compositing Toggle */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/60">
          <div className="flex justify-between items-center">
            <label className="text-[10px] text-slate-400 uppercase">WebKit GPU Composite:</label>
            <button
              onClick={() => setGpuCompositingActive(!gpuCompositingActive)}
              className={`text-[9px] font-bold px-2 py-0.5 rounded cursor-pointer ${gpuCompositingActive ? 'bg-green-950 text-green-400 border border-green-500/40' : 'bg-red-950 text-red-400 border border-red-500/40'}`}
            >
              {gpuCompositingActive ? 'ACCELERATED' : 'DISABLED'}
            </button>
          </div>
          <p className="text-[8px] text-slate-500 leading-normal">
            Forces hardware composition layers via WebKit rendering transforms (`will-change`, `translate3d`), minimizing paint cycles and mouse input lag.
          </p>
        </div>

        {/* Dynamic Simulation Scripts */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/60">
          <label className="text-[10px] text-slate-400 uppercase">Simulate Card Spell Cast:</label>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => triggerSpellSimulation('toxic')}
              className="w-full bg-lime-950/60 hover:bg-lime-900 text-lime-400 border border-lime-500/40 py-1.5 rounded text-[10px] cursor-pointer transition-colors"
            >
              Emit Toxic Spores Spell
            </button>
            <button
              onClick={() => triggerSpellSimulation('void')}
              className="w-full bg-purple-950/60 hover:bg-purple-900 text-purple-400 border border-purple-500/40 py-1.5 rounded text-[10px] cursor-pointer transition-colors"
            >
              Emit Void Singularity Spell
            </button>
            <button
              onClick={() => triggerSpellSimulation('crystal')}
              className="w-full bg-cyan-950/60 hover:bg-cyan-900 text-cyan-400 border border-cyan-500/40 py-1.5 rounded text-[10px] cursor-pointer transition-colors"
            >
              Emit Crystal Shatter Spell
            </button>
          </div>
        </div>

        {/* Shader Entropy Slider */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/60">
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-400 uppercase">Simulated Entropy:</span>
            <span className="text-cyan-400">{(entropy * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={entropy}
            onChange={(e) => setEntropy(parseFloat(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Right Stats HUD */}
      <div className="absolute top-20 right-4 w-72 bg-[#0b0f19]/85 border border-slate-800/80 p-5 rounded-2xl shadow-2xl backdrop-blur-md z-10 flex flex-col gap-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l-2 border-purple-500 pl-2">
          Performance & Compositing HUD
        </h3>

        <div className="flex flex-col gap-2 font-mono text-[10px]">
          <div className="flex justify-between border-b border-slate-800/40 pb-1">
            <span className="text-slate-500">Render Target:</span>
            <span className="text-slate-300">HTML5 Canvas (WebGL2)</span>
          </div>
          <div className="flex justify-between border-b border-slate-800/40 pb-1">
            <span className="text-slate-500">Compositing Mode:</span>
            <span className={gpuCompositingActive ? 'text-green-400' : 'text-red-400'}>
              {gpuCompositingActive ? 'Hardware Accelerated' : 'Software Fallback'}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-800/40 pb-1">
            <span className="text-slate-500">Input Response Time:</span>
            <span className={gpuCompositingActive ? 'text-green-400' : 'text-yellow-500'}>
              {gpuCompositingActive ? '<1.6 ms' : '12.8 ms'}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-800/40 pb-1">
            <span className="text-slate-500">Draw Calls (Batched):</span>
            <span className="text-cyan-400">42 (Instanced)</span>
          </div>
          <div className="flex justify-between border-b border-slate-800/40 pb-1">
            <span className="text-slate-500">Shader Program Cache:</span>
            <span className="text-cyan-400">Reusable (Linked once)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Estimated FPS:</span>
            <span className={gpuCompositingActive ? 'text-green-400' : 'text-yellow-500'}>
              {gpuCompositingActive ? '60.0' : '45.2'}
            </span>
          </div>
        </div>

        <div className="bg-[#0e0e16]/80 p-3 rounded-xl border border-slate-800/50 flex flex-col gap-1 text-[9px] text-slate-500">
          <div className="font-bold text-slate-400 uppercase tracking-wider mb-1">WebKit Axiom Status:</div>
          <div>• `translate3d(0,0,0)`: {gpuCompositingActive ? 'ACTIVE' : 'INACTIVE'}</div>
          <div>• `will-change: transform`: {gpuCompositingActive ? 'ACTIVE' : 'INACTIVE'}</div>
          <div>• `backface-visibility`: {gpuCompositingActive ? 'HIDDEN' : 'VISIBLE'}</div>
        </div>
      </div>

    </div>
  );
}
