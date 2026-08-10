import React, { useState, useEffect, useRef, useMemo } from 'react';

/**
 * FPS Counter with Frame Time Graph
 * Displays real-time performance metrics for the rendering engine
 */
export function FPSCounter() {
  const [fps, setFps] = useState(0);
  const [frameTime, setFrameTime] = useState(0);
  const [frameHistory, setFrameHistory] = useState(new Array(60).fill(0));
  const lastTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);
  const lastUpdateRef = useRef(performance.now());

  useEffect(() => {
    let animationFrameId;

    const measureFPS = (currentTime) => {
      frameCountRef.current++;

      const elapsed = currentTime - lastUpdateRef.current;
      if (elapsed >= 500) { // Update every 500ms
        const currentFps = Math.round((frameCountRef.current * 1000) / elapsed);
        const currentFrameTime = elapsed / frameCountRef.current;
        
        setFps(currentFps);
        setFrameTime(currentFrameTime.toFixed(2));
        
        setFrameHistory(prev => {
          const newHistory = [...prev.slice(1), currentFps];
          return newHistory;
        });

        frameCountRef.current = 0;
        lastUpdateRef.current = currentTime;
      }

      animationFrameId = requestAnimationFrame(measureFPS);
    };

    animationFrameId = requestAnimationFrame(measureFPS);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const getFPSColor = (currentFps) => {
    if (currentFps >= 55) return '#39ff14'; // Green - Good
    if (currentFps >= 30) return '#ffd700'; // Yellow - Acceptable
    return '#ff4500'; // Red - Poor
  };

  const maxFPS = Math.max(...frameHistory, 60);

  return (
    <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm p-3 rounded-lg border border-gray-700 z-50">
      <div className="flex items-center gap-3 mb-2">
        <div 
          className="text-2xl font-bold font-mono"
          style={{ color: getFPSColor(fps) }}
        >
          {fps}
        </div>
        <div className="text-xs text-gray-400">
          <div>FPS</div>
          <div>{frameTime}ms</div>
        </div>
      </div>
      
      {/* Mini frame time graph */}
      <div className="flex items-end gap-[1px]" style={{ width: '120px', height: '30px' }}>
        {frameHistory.map((value, index) => {
          const heightPercent = (value / maxFPS) * 100;
          const barColor = value >= 55 ? '#39ff14' : value >= 30 ? '#ffd700' : '#ff4500';
          
          return (
            <div
              key={index}
              style={{
                flex: 1,
                height: `${heightPercent}%`,
                backgroundColor: barColor,
                opacity: 0.7,
                borderRadius: '1px 1px 0 0'
              }}
            />
          );
        })}
      </div>
      
      {/* Reference lines */}
      <div className="relative h-1 mt-1">
        <div className="absolute left-0 w-[50%] h-full border-l border-green-500/50" />
        <div className="absolute left-[50%] w-0 h-full border-l border-yellow-500/50" />
      </div>
    </div>
  );
}

/**
 * Memory Usage Monitor
 * Tracks heap size and entity counts
 */
export function MemoryMonitor({ entityCount = 0 }) {
  const [memoryUsage, setMemoryUsage] = useState({
    usedJSHeapSize: 0,
    totalJSHeapSize: 0
  });

  useEffect(() => {
    const updateMemory = () => {
      if (performance.memory) {
        setMemoryUsage({
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize
        });
      }
    };

    updateMemory();
    const interval = setInterval(updateMemory, 2000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const memoryPercent = memoryUsage.totalJSHeapSize > 0 
    ? (memoryUsage.usedJSHeapSize / memoryUsage.totalJSHeapSize) * 100 
    : 0;

  return (
    <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm p-3 rounded-lg border border-gray-700 z-50 min-w-[180px]">
      <div className="text-xs uppercase tracking-widest text-gray-400 mb-2 font-semibold">
        Memory & Entities
      </div>
      
      <div className="space-y-2 text-xs font-mono">
        <div className="flex justify-between">
          <span className="text-gray-400">Heap:</span>
          <span className={memoryPercent > 80 ? 'text-red-400' : 'text-cyan-400'}>
            {formatBytes(memoryUsage.usedJSHeapSize)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Total:</span>
          <span className="text-gray-300">
            {formatBytes(memoryUsage.totalJSHeapSize)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Entities:</span>
          <span className="text-purple-400">{entityCount}</span>
        </div>

        {/* Memory usage bar */}
        <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
          <div 
            className={`h-1.5 rounded-full transition-all duration-500 ${
              memoryPercent > 80 ? 'bg-red-500' : memoryPercent > 60 ? 'bg-yellow-500' : 'bg-cyan-500'
            }`}
            style={{ width: `${Math.min(memoryPercent, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Render Statistics Display
 * Shows draw calls, triangle count, and other Three.js stats
 */
export function RenderStats({ renderer }) {
  const [stats, setStats] = useState({
    drawCalls: 0,
    triangles: 0,
    points: 0,
    textures: 0
  });

  useEffect(() => {
    if (!renderer) return;

    const interval = setInterval(() => {
      const info = renderer.info;
      setStats({
        drawCalls: info.render.calls,
        triangles: info.render.triangles,
        points: info.render.points,
        textures: info.memory.textures
      });
    }, 500);

    return () => clearInterval(interval);
  }, [renderer]);

  return (
    <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm p-3 rounded-lg border border-gray-700 z-50">
      <div className="text-xs uppercase tracking-widest text-gray-400 mb-2 font-semibold">
        Render Statistics
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
        <div className="flex justify-between">
          <span className="text-gray-400">Draw Calls:</span>
          <span className="text-blue-400">{stats.drawCalls}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Triangles:</span>
          <span className="text-green-400">{stats.triangles.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Points:</span>
          <span className="text-yellow-400">{stats.points.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Textures:</span>
          <span className="text-purple-400">{stats.textures}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Biome Transition Logger
 * Tracks and displays recent biome changes
 */
export function BiomeLogger() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const handleBiomeChange = (event) => {
      const { biome, entropy, timestamp } = event.detail;
      setLogs(prev => {
        const newLog = {
          id: Date.now(),
          biome,
          entropy: entropy.toFixed(2),
          time: new Date(timestamp).toLocaleTimeString()
        };
        return [newLog, ...prev].slice(0, 5);
      });
    };

    window.addEventListener('biome:change', handleBiomeChange);
    return () => window.removeEventListener('biome:change', handleBiomeChange);
  }, []);

  const getBiomeColor = (biome) => {
    const colors = {
      'LUSH_FOREST': '#22c55e',
      'TOXIC_SWAMP': '#a3e635',
      'DESERT': '#fbbf24',
      'GLACIER': '#67e8f9',
      'BARRENS': '#a8a29e'
    };
    return colors[biome] || '#ffffff';
  };

  return (
    <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm p-3 rounded-lg border border-gray-700 z-50 w-64">
      <div className="text-xs uppercase tracking-widest text-gray-400 mb-2 font-semibold">
        Biome Transitions
      </div>
      
      <div className="space-y-1">
        {logs.length === 0 ? (
          <div className="text-xs text-gray-500 italic">No transitions yet</div>
        ) : (
          logs.map(log => (
            <div 
              key={log.id}
              className="flex justify-between items-center text-xs font-mono py-1 border-b border-gray-800 last:border-0"
            >
              <span style={{ color: getBiomeColor(log.biome) }}>
                {log.biome}
              </span>
              <span className="text-gray-500">{log.time}</span>
              <span className="text-gray-400">η={log.entropy}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Main Debug Overlay Component
 * Combines all debug information displays
 */
export default function DebugOverlay({ 
  showFPS = true, 
  showMemory = true, 
  showRenderStats = false,
  showBiomeLogger = true,
  renderer = null,
  entityCount = 0 
}) {
  const [isVisible, setIsVisible] = useState(true);

  // Toggle with F3 key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F3') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="absolute top-2 left-2 z-50 bg-black/50 hover:bg-black/80 text-white px-2 py-1 rounded text-xs"
      >
        Show Debug (F3)
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 left-2 z-50 bg-black/50 hover:bg-black/80 text-white px-2 py-1 rounded text-xs"
      >
        Hide Debug (F3)
      </button>

      {showFPS && <FPSCounter />}
      
      {showMemory && (
        <MemoryMonitor entityCount={entityCount} />
      )}
      
      {showRenderStats && renderer && (
        <RenderStats renderer={renderer} />
      )}
      
      {showBiomeLogger && <BiomeLogger />}
    </>
  );
}
