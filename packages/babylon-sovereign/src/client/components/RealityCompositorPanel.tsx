import React, { useState, useEffect, useRef } from 'react';
import { Engine, Scene, Vector3, Color3, HemisphericLight, DirectionalLight, ShadowGenerator, MeshBuilder, StandardMaterial, ArcRotateCamera } from '@babylonjs/core';

interface RealityCompositorPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RealityCompositorPanel({ isOpen, onClose }: RealityCompositorPanelProps) {
  const [selectedVerb, setSelectedVerb] = useState<string>('DEFORM');
  const [selectedTarget, setSelectedTarget] = useState<string>('HEX');
  const [simulationData, setSimulationData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const previewMeshRef = useRef<any>(null);

  // Continuous Rotation Ref (Rule 10)
  const anglesRef = useRef({ x: 0.0, y: 0.0 });

  const verbs = ['DEFORM', 'COMPILE', 'ACTIVATE', 'HARVEST'];
  const targets = ['HEX', 'GEAR', 'CRYSTAL', 'TOWER'];

  // Debounced API fetch to coexist with OS governor (Rule 5 & 10)
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetch('/api/simulation/geometry-nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verb: selectedVerb, target: selectedTarget })
      })
        .then(res => res.json())
        .then(data => {
          setSimulationData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('[COMPOSER] Failed to fetch simulation stats:', err);
          setLoading(false);
        });
    }, 150); // 150ms debounce window

    return () => clearTimeout(delayDebounceFn);
  }, [selectedVerb, selectedTarget, isOpen]);

  // BabylonJS Canvas Lifecycle Hook
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    // 1. Initialize Engine & Scene
    const engine = new Engine(canvasRef.current, true);
    engineRef.current = engine;
    const scene = new Scene(engine);
    sceneRef.current = scene;
    scene.clearColor = new Color3(0.04, 0.04, 0.07).toColor4(1.0);

    // 2. Setup Camera
    const camera = new ArcRotateCamera('previewCamera', -Math.PI / 2, Math.PI / 3, 4.0, Vector3.Zero(), scene);
    camera.attachControl(canvasRef.current, true);
    camera.lowerRadiusLimit = 2.5;
    camera.upperRadiusLimit = 6.0;

    // 3. Setup Lights
    const hemiLight = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.55;
    hemiLight.groundColor = new Color3(0.15, 0.1, 0.2);

    const dirLight = new DirectionalLight('dir', new Vector3(-1, -2, -1), scene);
    dirLight.position = new Vector3(3, 6, 3);
    dirLight.intensity = 0.8;

    // 4. Setup Shadow Generator
    const shadowGenerator = new ShadowGenerator(1024, dirLight);
    shadowGenerator.useBlurExponentialShadowMap = true;

    // 5. Render Loop with Persistent Rotation (Rule 10)
    engine.runRenderLoop(() => {
      if (scene) {
        scene.render();
      }
    });

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.dispose();
      engineRef.current = null;
      sceneRef.current = null;
    };
  }, [isOpen]);

  // Procedural geometry instantiation driven by simulation parameters
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !simulationData) return;

    // Clean up previous mesh
    if (previewMeshRef.current) {
      previewMeshRef.current.dispose();
      previewMeshRef.current = null;
    }

    const { target, colorHex, heightMultiplier, bevelOffset, rotationSpeed, teethCount } = simulationData;

    // 1. Create root node group
    const root = MeshBuilder.CreateBox('root', { size: 0.01 }, scene);
    
    // Restore previous rotation angles (Rule 10 - Continuous Rotation Refs)
    root.rotation.x = anglesRef.current.x;
    root.rotation.y = anglesRef.current.y;

    const color = Color3.FromHexString(colorHex);
    const mat = new StandardMaterial('composerMat', scene);
    mat.diffuseColor = color;
    mat.emissiveColor = color.scale(0.3);
    mat.roughness = 1.0 - bevelOffset;
    mat.metallic = bevelOffset * 2.0;

    // 2. Build template geometry based on target
    if (target === 'HEX') {
      const hex = MeshBuilder.CreateCylinder('hex', { diameter: 1.4, height: heightMultiplier, tessellation: 6 }, scene);
      hex.parent = root;
      hex.material = mat;
    } else if (target === 'GEAR') {
      const baseGear = MeshBuilder.CreateCylinder('gearBase', { diameter: 1.1, height: 0.25, tessellation: 12 }, scene);
      baseGear.parent = root;
      baseGear.material = mat;

      // Procedural teeth generator based on teethCount parameter
      for (let i = 0; i < teethCount; i++) {
        const angle = (i * Math.PI * 2) / teethCount;
        const tooth = MeshBuilder.CreateBox('tooth', { width: 0.15, height: 0.25, depth: 0.25 }, scene);
        tooth.position = new Vector3(Math.cos(angle) * 0.58, 0, Math.sin(angle) * 0.58);
        tooth.rotation.y = -angle;
        tooth.parent = baseGear;
        tooth.material = mat;
      }
    } else if (target === 'CRYSTAL') {
      const crystal = MeshBuilder.CreateCylinder('crystal', { diameterTop: 0, diameterBottom: 0.8, height: heightMultiplier, tessellation: 6 }, scene);
      crystal.parent = root;
      crystal.material = mat;
    } else if (target === 'TOWER') {
      const base = MeshBuilder.CreateCylinder('base', { diameter: 0.9, height: heightMultiplier * 0.6, tessellation: 8 }, scene);
      base.parent = root;
      base.position.y = -0.3;
      base.material = mat;

      const top = MeshBuilder.CreateBox('top', { width: 0.5, height: heightMultiplier * 0.4, depth: 0.5 }, scene);
      top.parent = root;
      top.position.y = heightMultiplier * 0.3;
      top.material = mat;
    }

    previewMeshRef.current = root;

    // 3. Register frame tick observer to animate and save intermediate angles (Rule 10)
    const observer = scene.onBeforeRenderObservable.add(() => {
      if (root && !root.isDisposed()) {
        root.rotation.y += rotationSpeed;
        root.rotation.x = Math.sin(Date.now() * 0.001) * 0.12;

        // Save active rotation coordinates to ref
        anglesRef.current.x = root.rotation.x;
        anglesRef.current.y = root.rotation.y;
      }
    });

    return () => {
      scene.onBeforeRenderObservable.remove(observer);
    };
  }, [simulationData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[70] flex items-center justify-center pointer-events-auto p-4">
      <div className="bg-[#0b0b14]/95 border border-cyan-500/35 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col md:flex-row overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)] font-mono text-xs text-white">
        
        {/* Left Side: Parameters Select Panel */}
        <div className="w-full md:w-2/5 p-6 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between bg-slate-950/30">
          <div>
            <div className="flex justify-between items-center border-b border-cyan-500/20 pb-2 mb-4">
              <span className="text-cyan-400 font-bold uppercase tracking-wider text-[11px]">Procedural Reality Compositor</span>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer text-sm font-bold">✕</button>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed mb-4 font-sans">
              Zvoľte sémantické tagy (Sloveso + Cieľ) pre procedurálne zostavenie geometrických Meshov a simuláciu ich vlastností na Go Core.
            </p>

            {/* Verb Select */}
            <div className="mb-4">
              <label className="text-[10px] text-purple-400 font-bold uppercase mb-1.5 block">Sémantické Sloveso (Verb)</label>
              <div className="grid grid-cols-2 gap-2">
                {verbs.map(v => (
                  <button
                    key={v}
                    onClick={() => setSelectedVerb(v)}
                    className={`py-2 px-3 border rounded text-[10px] uppercase font-bold cursor-pointer transition-all ${
                      selectedVerb === v
                        ? 'bg-purple-950/40 border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                        : 'border-slate-800 hover:border-slate-600 bg-slate-900/30 text-slate-400'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Select */}
            <div className="mb-4">
              <label className="text-[10px] text-cyan-400 font-bold uppercase mb-1.5 block">Cieľový Mesh (Target)</label>
              <div className="grid grid-cols-2 gap-2">
                {targets.map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTarget(t)}
                    className={`py-2 px-3 border rounded text-[10px] uppercase font-bold cursor-pointer transition-all ${
                      selectedTarget === t
                        ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                        : 'border-slate-800 hover:border-slate-600 bg-slate-900/30 text-slate-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Telemetry output */}
          <div className="bg-[#08080f]/90 border border-slate-800 rounded-xl p-3.5 mt-4">
            <span className="text-yellow-400 font-bold uppercase tracking-wider block border-b border-slate-800 pb-1 mb-2 text-[9px]">
              📊 Výstupné Telemetrické Parametre
            </span>
            {loading ? (
              <div className="py-6 text-center text-slate-500 text-[10px] animate-pulse">Načítavam simuláciu z Go Core...</div>
            ) : simulationData ? (
              <div className="space-y-1.5 font-mono text-[10px] text-slate-300">
                <div className="flex justify-between">
                  <span>Mierka Výšky:</span>
                  <span className="text-white font-bold">{simulationData.heightMultiplier.toFixed(2)}x</span>
                </div>
                <div className="flex justify-between">
                  <span>Skosenie (Bevel):</span>
                  <span className="text-white font-bold">{simulationData.bevelOffset.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vodivosť:</span>
                  <span className="text-green-400 font-bold">{(simulationData.conductivity * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Riziko Kolapsu (Hazard):</span>
                  <span className="text-red-400 font-bold">{(simulationData.hazardIndex * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Predpovedaná Farba:</span>
                  <span style={{ color: simulationData.colorHex }} className="font-bold">{simulationData.colorHex}</span>
                </div>
                <div className="flex justify-between">
                  <span>Teeth Count:</span>
                  <span className="text-purple-400 font-bold">{simulationData.teethCount}</span>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 italic py-6 text-center">Vyberte tagy pre spustenie simulácie.</div>
            )}
          </div>
        </div>

        {/* Right Side: 3D Previewer Canvas */}
        <div className="w-full md:w-3/5 h-full relative bg-[#040408]">
          <canvas ref={canvasRef} className="w-full h-full block outline-none" />
          <div className="absolute bottom-4 left-4 bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded font-mono text-[9px] text-slate-400 pointer-events-none">
            WebGL Viewport: 3D Gear / Mesh Synthesis Previewer
          </div>
        </div>
      </div>
    </div>
  );
}
