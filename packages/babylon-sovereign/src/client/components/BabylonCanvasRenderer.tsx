import React, { useEffect, useRef } from 'react';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import '@babylonjs/core/Rendering/edgesRenderer';
import '@babylonjs/core/Culling/ray';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { ActionManager } from '@babylonjs/core/Actions/actionManager';
import { ExecuteCodeAction } from '@babylonjs/core/Actions/directActions';
import { Scalar } from '@babylonjs/core/Maths/math.scalar';
import { CustomMaterial } from '@babylonjs/materials';
import neonMatrixTexUrl from '../../assets/neon_matrix_grid.png';
import brushedMetalTexUrl from '../../assets/brushed_metal_tech.png';

interface Node {
  id: number;
  macroIndex: number;
  subIndex: number;
  walkable: boolean;
  biome: string;
  friction: number;
  hazardIndex: number;
}

interface BabylonCanvasRendererProps {
  gridData: any;
  threads: any[];
  myThreadId: string;
  selectedNode: any;
  selectedCard: any;
  onNodeClick: (node: any) => void;
  onMoveHero: (node: any) => void;
  hoveredNode: any;
  setHoveredNode: (node: any) => void;
  socket: any;
}

export default function BabylonCanvasRenderer({
  gridData,
  threads,
  myThreadId,
  selectedNode,
  selectedCard,
  onNodeClick,
  onMoveHero,
  hoveredNode,
  setHoveredNode,
  socket
}: BabylonCanvasRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shuffleTriggerRef = useRef<{ time: number }>({ time: 0 });

  useEffect(() => {
    const handleShuffle = () => {
      shuffleTriggerRef.current = { time: Date.now() };
    };
    window.addEventListener('grid_shuffle_pulse', handleShuffle);
    return () => window.removeEventListener('grid_shuffle_pulse', handleShuffle);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    // AI Keyframe sequence triggers
    const activeTimelineRef = { current: null as any };
    const timelineStartRef = { current: 0 };

    if (socket) {
      const handleAiSequence = (data: any) => {
        console.log("[CANVAS] AI Sequence timeline received:", data.timeline);
        activeTimelineRef.current = data.timeline;
        timelineStartRef.current = Date.now();
      };
      socket.on('ai_sequence_triggered', handleAiSequence);
    }

    // Adaptive rendering profile variables
    let activeQuality = 'ULTRA_FIDELITY';
    let frameTimesCount = 0;
    let totalFrameTime = 0;

    // 1. Initialize Engine and Scene
    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.04, 0.04, 0.06, 1.0);
    scene.ambientColor = new Color3(0.15, 0.2, 0.35);

    // 2. Camera Setup (Fixed 2.5D RTS Camera)
    const camera = new ArcRotateCamera(
      'rtsCamera',
      Math.PI / 4, // Yaw (alpha)
      1.05,        // Pitch (beta)
      35,          // Radius
      new Vector3(0, 0, 0),
      scene
    );
    camera.attachControl(canvasRef.current, true);

    // Lock camera angles to disable obliqeness rotations (Rule 8)
    camera.lowerAlphaLimit = Math.PI / 4;
    camera.upperAlphaLimit = Math.PI / 4;
    camera.lowerBetaLimit = 1.05;
    camera.upperBetaLimit = 1.05;
    camera.lowerRadiusLimit = 15;
    camera.upperRadiusLimit = 80;

    // 3. Lighting & Shadows (TDP Power-Safety soft shadowing)
    const light = new DirectionalLight('dirLight', new Vector3(-1, -2, -1), scene);
    light.position = new Vector3(15, 30, 15);
    light.intensity = 1.5;

    const fillLight = new DirectionalLight('fillLight', new Vector3(1, 1, 1), scene);
    fillLight.intensity = 0.45;
    fillLight.diffuse = new Color3(0.4, 0.55, 0.8);

    const shadowGenerator = new ShadowGenerator(1024, light);
    shadowGenerator.usePercentageCloserFiltering = true;

    // 4. Custom PBR Shader Materials
    const baseTex = new Texture(neonMatrixTexUrl, scene);
    const techTex = new Texture(brushedMetalTexUrl, scene);

    const cellMaterial = new CustomMaterial('pbrCellShader', scene);
    cellMaterial.roughness = 0.15;
    cellMaterial.metallic = 0.85;
    cellMaterial.diffuseTexture = baseTex;

    // Quantized GLSL Cell Shading Injection
    cellMaterial.Fragment_Before_FragColor(`
      float brightness = (color.r + color.g + color.b) / 3.0;
      if (brightness > 0.01) {
        float quantized = brightness;
        if (brightness < 0.22) { quantized = 0.08; }
        else if (brightness < 0.45) { quantized = 0.33; }
        else if (brightness < 0.70) { quantized = 0.58; }
        else { quantized = 0.88; }
        color.rgb *= (quantized / brightness);
      }
    `);

    // Load biome textures
    const textures = {
      LUSH_FOREST: new Texture('/textures/lush_forest_tile.png', scene),
      TOXIC_SWAMP: new Texture('/textures/toxic_swamp_tile.png', scene),
      GLACIER: new Texture('/textures/glacier_tile.png', scene),
      DESERT: new Texture('/textures/desert_tile.png', scene),
      BARRENS: new Texture('/textures/barrens_tile.png', scene),
      SCORCHED: new Texture('/textures/scorched_tile.png', scene)
    };

    Object.values(textures).forEach(tex => {
      tex.wrapU = Texture.WRAP_ADDRESSMODE;
      tex.wrapV = Texture.WRAP_ADDRESSMODE;
      tex.uScale = 3.0;
      tex.vScale = 3.0;
    });

    const biomeMaterials = new Map<string, StandardMaterial>();
    const biomes = ['LUSH_FOREST', 'TOXIC_SWAMP', 'GLACIER', 'DESERT', 'BARRENS', 'SCORCHED'];
    biomes.forEach((b) => {
      const mat = new StandardMaterial('mat_' + b, scene);
      mat.diffuseTexture = textures[b as keyof typeof textures] || techTex;
      mat.specularColor = new Color3(0.1, 0.1, 0.1);
      mat.roughness = 0.65;
      biomeMaterials.set(b, mat);
    });

    // Helper to spawn dynamic 3D Loot Chests (Pillar 3)
    const createLootChest = (posX: number, posY: number, posZ: number) => {
      const chestGroup = MeshBuilder.CreateBox('chestGroup', { size: 0.01 }, scene);
      chestGroup.position = new Vector3(posX, posY + 0.65, posZ);
      
      const baseMesh = MeshBuilder.CreateBox('chestBase', { width: 0.45, height: 0.35, depth: 0.22 }, scene);
      baseMesh.parent = chestGroup;
      baseMesh.position.y = 0;
      const baseMat = new StandardMaterial('chestBaseMat', scene);
      baseMat.diffuseColor = new Color3(0.1, 0.1, 0.15);
      baseMat.metallic = 0.8;
      baseMat.roughness = 0.3;
      baseMesh.material = baseMat;
      shadowGenerator.addShadowCaster(baseMesh);

      const lidMesh = MeshBuilder.CreateBox('chestLid', { width: 0.47, height: 0.1, depth: 0.24 }, scene);
      lidMesh.parent = chestGroup;
      lidMesh.position.y = 0.2;
      const lidMat = new StandardMaterial('chestLidMat', scene);
      lidMat.diffuseColor = new Color3(0.8, 0.6, 0.1);
      lidMat.emissiveColor = new Color3(0.4, 0.3, 0.05);
      lidMat.metallic = 0.9;
      lidMat.roughness = 0.2;
      lidMesh.material = lidMat;
      shadowGenerator.addShadowCaster(lidMesh);

      const lockMesh = MeshBuilder.CreateSphere('chestLock', { diameter: 0.1 }, scene);
      lockMesh.parent = chestGroup;
      lockMesh.position.y = 0.1;
      lockMesh.position.z = -0.12;
      const lockMat = new StandardMaterial('chestLockMat', scene);
      lockMat.emissiveColor = new Color3(0, 1, 0.8);
      lockMesh.material = lockMat;

      return chestGroup;
    };

    // Helper to spawn dynamic 3D Traps (Pillar 3)
    const createTrap = (posX: number, posY: number, posZ: number, type: string) => {
      const trapGroup = MeshBuilder.CreateBox('trapGroup', { size: 0.01 }, scene);
      trapGroup.position = new Vector3(posX, posY + 0.6, posZ);

      // Pulse ring
      const ringMesh = MeshBuilder.CreateTorus('trapRing', { diameter: 0.4, thickness: 0.08, tessellation: 8 }, scene);
      ringMesh.parent = trapGroup;
      ringMesh.rotation.x = Math.PI / 2;
      
      const ringMat = new StandardMaterial('trapRingMat', scene);
      ringMat.emissiveColor = type === 'ROOT_TRAP' ? new Color3(0.98, 0.57, 0.24) : new Color3(0.94, 0.27, 0.27);
      ringMesh.material = ringMat;

      // Central core spike
      const spikeMesh = MeshBuilder.CreateCylinder('trapSpike', { height: 0.3, diameterTop: 0, diameterBottom: 0.15 }, scene);
      spikeMesh.parent = trapGroup;
      spikeMesh.position.y = 0.1;
      spikeMesh.material = ringMat;

      return trapGroup;
    };

    // Helper to create faction-specific thread meshes
    const createThreadMesh = (threadId: string) => {
      let mesh: AbstractMesh;
      const isPlayer = threadId === myThreadId;
      const isAi = threadId.includes('ai') || threadId.includes('hacker') || threadId.includes('root');
      const isVoid = threadId.includes('void') || threadId.includes('weaver');

      if (isPlayer) {
        // Crystal Faction
        mesh = MeshBuilder.CreateIcosahedron(threadId, { radius: 0.42 }, scene);
        const mat = new StandardMaterial(threadId + '_mat', scene);
        mat.diffuseColor = new Color3(0.1, 0.45, 0.5);
        mat.specularColor = new Color3(0.8, 1, 1);
        mat.emissiveColor = new Color3(0, 0.8, 1);
        mesh.material = mat;
      } else if (isAi) {
        // Toxic Faction
        mesh = MeshBuilder.CreateTorusKnot(threadId, { radius: 0.32, tube: 0.1 }, scene);
        const mat = new StandardMaterial(threadId + '_mat', scene);
        mat.diffuseColor = new Color3(0.1, 0.4, 0.15);
        mat.specularColor = new Color3(0.5, 1, 0.5);
        mat.emissiveColor = new Color3(0.2, 0.9, 0.2);
        mesh.material = mat;
      } else if (isVoid) {
        // Void Faction
        mesh = MeshBuilder.CreatePolyhedron(threadId, { type: 1, size: 0.38 }, scene);
        const mat = new StandardMaterial(threadId + '_mat', scene);
        mat.diffuseColor = new Color3(0.2, 0.05, 0.3);
        mat.emissiveColor = new Color3(0.7, 0, 0.9);
        mesh.material = mat;
      } else {
        // Other NPC / Druid / Sentinel
        mesh = MeshBuilder.CreateCylinder(threadId, { height: 0.7, diameter: 0.5 }, scene);
        const mat = new StandardMaterial(threadId + '_mat', scene);
        mat.diffuseColor = new Color3(0.5, 0.4, 0.1);
        mat.emissiveColor = new Color3(0.9, 0.6, 0);
        mesh.material = mat;
      }

      shadowGenerator.addShadowCaster(mesh);
      return mesh;
    };

    // 5. Build Hexagonal Mesh Grid
    // Template mesh (Zero-allocation template caching)
    const baseHex = MeshBuilder.CreateCylinder(
      'templateHex',
      {
        diameter: 2.2,
        height: 1.2,
        tessellation: 6
      },
      scene
    );
    baseHex.material = cellMaterial;
    baseHex.setEnabled(false);

    // Register instanced color buffer to support unique biome tints (Rule 1 & Rule 5 optimization)
    baseHex.registerInstancedBuffer("color", 4);
    baseHex.instancedBuffers.color = new Color4(1, 1, 1, 1);

    // Inner plate mesh
    const innerPlateMat = new StandardMaterial('plateMat', scene);
    innerPlateMat.diffuseTexture = techTex;
    innerPlateMat.specularColor = new Color3(0.8, 0.9, 1.0);
    innerPlateMat.roughness = 0.08;

    const innerHex = MeshBuilder.CreateCylinder(
      'templateInnerHex',
      {
        diameter: 1.8,
        height: 0.2,
        tessellation: 6
      },
      scene
    );
    innerHex.material = innerPlateMat;
    innerHex.setEnabled(false);

    // Dynamic node mapping logic
    const hexNodes: any[] = [];
    const hexMeshInstances: AbstractMesh[] = [];

    // Metaposition grid offset mappings
    const META_COORDS = [
      { x: -7, z: -7 }, { x: 0, z: -7 }, { x: 7, z: -7 },
      { x: -7, z: 0 },  { x: 0, z: 0 },  { x: 7, z: 0 },
      { x: -7, z: 7 },  { x: 0, z: 7 },  { x: 7, z: 7 }
    ];

    gridData.forEach((chunk: any) => {
      const offset = META_COORDS[chunk.id] || { x: 0, z: 0 };
      
      chunk.blocks.forEach((block: any) => {
        // Hexagonal spacing calculations
        const angle = (block.id * Math.PI) / 3;
        const radius = 2.4;
        const posX = offset.x + Math.cos(angle) * radius;
        const posZ = offset.z + Math.sin(angle) * radius;

        // Create instanced base hex (Zero allocation replication)
        const baseInstance = baseHex.createInstance(`hex_${chunk.id}_${block.id}`);
        baseInstance.position = new Vector3(posX, -0.6, posZ);
        baseInstance.setEnabled(true);
        shadowGenerator.addShadowCaster(baseInstance);
        baseInstance.receiveShadows = true;

        // Assign instanced color based on biome (Pillar 2: Material Distribution)
        let biomeColor = new Color4(0.5, 0.5, 0.5, 1.0);
        if (block.biome === 'LUSH_FOREST') {
          biomeColor = new Color4(0.20, 0.55, 0.35, 1.0);
        } else if (block.biome === 'TOXIC_SWAMP') {
          biomeColor = new Color4(0.35, 0.45, 0.15, 1.0);
        } else if (block.biome === 'GLACIER') {
          biomeColor = new Color4(0.40, 0.70, 0.85, 1.0);
        } else if (block.biome === 'DESERT') {
          biomeColor = new Color4(0.75, 0.60, 0.30, 1.0);
        } else if (block.biome === 'BARRENS') {
          biomeColor = new Color4(0.65, 0.35, 0.15, 1.0);
        } else if (block.biome === 'SCORCHED') {
          biomeColor = new Color4(0.15, 0.15, 0.18, 1.0);
        }
        baseInstance.instancedBuffers.color = biomeColor;

        // Create instanced inner tech plate
        const innerInstance = innerHex.createInstance(`inner_${chunk.id}_${block.id}`);
        innerInstance.position = new Vector3(posX, 0.1, posZ);
        innerInstance.parent = baseInstance;
        innerInstance.setEnabled(true);
        innerInstance.material = biomeMaterials.get(block.biome) || innerPlateMat;

        // Highlight/outline edge renderer
        baseInstance.enableEdgesRendering();
        baseInstance.edgesWidth = 3.0;
        baseInstance.edgesColor = new Color4(0, 0.8, 1, 0.35);

        // Set action manager for click and hover behaviors
        baseInstance.actionManager = new ActionManager(scene);

        // Hover event listeners
        baseInstance.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
            setHoveredNode({ id: `${chunk.id}_${block.id}`, macroIndex: chunk.id, subIndex: block.id, type: block.biome, walkable: block.walkable, friction: block.friction, hazardIndex: block.hazardIndex });
            baseInstance.edgesColor = new Color4(0.2, 1.0, 0.8, 1.0);
          })
        );

        baseInstance.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
            setHoveredNode(null);
            baseInstance.edgesColor = new Color4(0, 0.8, 1, 0.35);
          })
        );

        // Click trigger routing
        baseInstance.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPointerDownTrigger, () => {
            onNodeClick({ id: `${chunk.id}_${block.id}`, macroIndex: chunk.id, subIndex: block.id, type: block.biome, walkable: block.walkable, friction: block.friction, hazardIndex: block.hazardIndex });
          })
        );

        // Spawn Chests and Traps if defined on target hex (Collision-Free Spawner Guard)
        if (block.hasChest) {
          const chestMesh = createLootChest(posX, -0.6, posZ);
          hexMeshInstances.push(chestMesh);
        }
        if (block.hasTrap) {
          const trapMesh = createTrap(posX, -0.6, posZ, block.hasTrap);
          hexMeshInstances.push(trapMesh);
        }

        hexNodes.push({ chunkId: chunk.id, blockId: block.id, mesh: baseInstance, innerPlate: innerInstance });
        hexMeshInstances.push(baseInstance);
      });
    });

    // 6. Spawn Thread Player Entities (Dynamic Faction-Themed Models)
    const threadMeshes = new Map<string, AbstractMesh>();
    threads.forEach((t) => {
      threadMeshes.set(t.id, createThreadMesh(t.id));
    });

    // 6.5. Floating 3D HUD billboard for Ohmic Equation context (Layer 60)
    const formulaPlane = MeshBuilder.CreatePlane('formulaPlane', { width: 3.6, height: 1.2 }, scene);
    formulaPlane.billboardMode = AbstractMesh.BILLBOARDMODE_ALL;
    formulaPlane.setEnabled(false);

    const dynamicTexture = new DynamicTexture("dynamicTexture", { width: 512, height: 170 }, scene);
    const planeMaterial = new StandardMaterial("planeMaterial", scene);
    planeMaterial.diffuseTexture = dynamicTexture;
    planeMaterial.emissiveColor = new Color3(1, 1, 1);
    formulaPlane.material = planeMaterial;

    const drawOhmicFormula = (voltage: number, resistance: number, current: number, heat: number, isSuccess: boolean) => {
      const ctx = dynamicTexture.getContext();
      ctx.clearRect(0, 0, 512, 170);
      
      // Draw background
      ctx.fillStyle = "rgba(11, 11, 18, 0.85)";
      ctx.fillRect(0, 0, 512, 170);
      ctx.strokeStyle = isSuccess ? "rgba(34, 211, 238, 0.8)" : "rgba(239, 68, 68, 0.8)";
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, 508, 166);

      // Draw header
      ctx.font = "bold 20px monospace";
      ctx.fillStyle = "#a855f7"; // Neon purple
      ctx.fillText("🎛️ OHMIC CONTEXT: I = V / R", 20, 40);

      // Draw formula details
      ctx.font = "18px monospace";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`${voltage.toFixed(1)}V / ${resistance.toFixed(1)}Ω = ${current.toFixed(2)}A`, 20, 85);

      // Draw status & KCL/Heat
      ctx.font = "bold 16px monospace";
      if (isSuccess) {
        ctx.fillStyle = "#22c55e"; // Success green
        ctx.fillText("STATUS: SUCCESS (100% CURRENT FLOW)", 20, 135);
      } else {
        ctx.fillStyle = "#ef4444"; // Warning red
        ctx.fillText(`BLOCKED (HEAT: +${heat.toFixed(0)}°C) | KCL: FAIL`, 20, 135);
      }

      dynamicTexture.update();
    };

    // 7. Render Loop with active radial height animations
    scene.registerBeforeRender(() => {
      // Synchronize positions of threads and apply custom animations
      threads.forEach((t) => {
        const meta = t.position.meta;
        const hex = t.position.hex;
        const targetNode = hexNodes.find((n) => n.chunkId === meta && n.blockId === hex);
        if (targetNode) {
          const targetMesh = threadMeshes.get(t.id);
          if (targetMesh) {
            targetMesh.position.x = targetNode.mesh.position.x;
            targetMesh.position.z = targetNode.mesh.position.z;
            targetMesh.position.y = targetNode.mesh.position.y + 0.8;
            
            // Add custom idle animation (Rule 5 & Section 2)
            const hoverOffset = Math.sin(Date.now() * 0.003 + t.id.charCodeAt(0)) * 0.06;
            targetMesh.position.y += hoverOffset;
            targetMesh.rotation.y += 0.015;
          }
        }
      });

      // Animate active chests and traps (Pillar 2/3 and Section 2)
      scene.meshes.forEach((mesh) => {
        if (mesh.name === 'chestGroup') {
          mesh.rotation.y += 0.02;
          const elapsedSec = Date.now() * 0.001;
          mesh.position.y = 0.05 + Math.sin(elapsedSec * 2.2) * 0.08;
        } else if (mesh.name === 'trapGroup') {
          const scale = 1.0 + Math.sin(Date.now() * 0.008) * 0.12;
          mesh.scaling.x = scale;
          mesh.scaling.z = scale;
        }
      });

      // 6.7. Adaptive Rendering Quality Profiles (Rule 5)
      frameTimesCount++;
      totalFrameTime += engine.getDeltaTime();
      if (frameTimesCount >= 60) {
        const avgFrameTime = totalFrameTime / frameTimesCount;
        const newQuality = avgFrameTime > 16.6 ? 'POWER_SAVE' : 'ULTRA_FIDELITY';
        if (newQuality !== activeQuality) {
          activeQuality = newQuality;
          console.log(`[CANVAS] Adaptive Render Quality profile shifted to: ${activeQuality} (Avg Frame: ${avgFrameTime.toFixed(1)}ms)`);
          
          const shadowMap = shadowGenerator.getShadowMap();
          if (shadowMap) {
            shadowMap.refreshRate = activeQuality === 'POWER_SAVE' ? 0 : 1;
          }
        }
        frameTimesCount = 0;
        totalFrameTime = 0;
      }

      // 6.8. AI Keyframe Sequence Player
      let currentAiFrame = null as any;
      if (activeTimelineRef.current) {
        const elapsed = (Date.now() - timelineStartRef.current) / 1000;
        const timeline = activeTimelineRef.current;
        
        currentAiFrame = timeline.timelineFrames.find((f: any) => elapsed >= f.time && elapsed < f.time + 0.4);
        
        if (elapsed > timeline.totalTime + 1.0) {
          activeTimelineRef.current = null;
          console.log("[CANVAS] AI keyframe simulation sequence playback finished.");
        }
      }

      // Update Floating 3D HUD billboard based on hoveredNode/selectedCard or active AI Keyframe
      if (currentAiFrame) {
        const targetNode = hexNodes.find(n => n.chunkId === currentAiFrame.targetChunk && n.blockId === currentAiFrame.targetHex);
        if (targetNode) {
          formulaPlane.position.x = targetNode.mesh.position.x;
          formulaPlane.position.z = targetNode.mesh.position.z;
          formulaPlane.position.y = targetNode.mesh.position.y + 2.0;
          formulaPlane.setEnabled(true);

          const voltage = 5.0;
          const difficulty = 3.0;
          const resistance = Math.max(0.1, 2.5 - difficulty * 0.2);
          const current = voltage / resistance;
          
          drawOhmicFormula(voltage, resistance, current, currentAiFrame.projectedHeat, !currentAiFrame.isThrottled);
        } else {
          formulaPlane.setEnabled(false);
        }
      } else if (selectedCard && hoveredNode) {
        const targetNode = hexNodes.find(n => n.chunkId === hoveredNode.macroIndex && n.blockId === hoveredNode.subIndex);
        if (targetNode) {
          formulaPlane.position.x = targetNode.mesh.position.x;
          formulaPlane.position.z = targetNode.mesh.position.z;
          formulaPlane.position.y = targetNode.mesh.position.y + 2.0;
          formulaPlane.setEnabled(true);

          const voltage = selectedCard.cost * 2.0 + 1.0;
          const resistance = 1.0 + hoveredNode.friction;
          const current = voltage / resistance;
          const isSuccess = current >= 1.0;
          const heat = isSuccess ? 0.0 : (1.0 - current) * 40.0;

          drawOhmicFormula(voltage, resistance, current, heat, isSuccess);
        } else {
          formulaPlane.setEnabled(false);
        }
      } else {
        formulaPlane.setEnabled(false);
      }

      // Height selection highlight
      hexNodes.forEach((nodeWrapper) => {
        const isSel = selectedNode && selectedNode.macroIndex === nodeWrapper.chunkId && selectedNode.subIndex === nodeWrapper.blockId;
        const isHov = hoveredNode && hoveredNode.macroIndex === nodeWrapper.chunkId && hoveredNode.subIndex === nodeWrapper.blockId;
        const isAiTarget = currentAiFrame && currentAiFrame.targetChunk === nodeWrapper.chunkId && currentAiFrame.targetHex === nodeWrapper.blockId;
        
        let targetY = -0.6;
        if (isSel || isHov) {
          targetY = -0.3;
        } else if (isAiTarget) {
          targetY = 0.4;
        }

        // Apply outline border highlights
        if (isAiTarget) {
          nodeWrapper.mesh.edgesColor = currentAiFrame.isThrottled 
            ? new Color4(1, 0.9, 0, 1.0) // Throttled Yellow
            : new Color4(1, 0, 0.5, 1.0); // Neon Magenta
        } else if (isHov) {
          nodeWrapper.mesh.edgesColor = new Color4(0.2, 1.0, 0.8, 1.0);
        } else {
          nodeWrapper.mesh.edgesColor = new Color4(0, 0.8, 1, 0.35);
        }

        // Apply radial ripple animation from card shuffles (Rule 9 waves)
        const shuffleTime = shuffleTriggerRef.current.time;
        if (shuffleTime > 0) {
          const elapsed = (Date.now() - shuffleTime) / 1000;
          if (elapsed < 0.8) {
            const distance = Math.sqrt(
              nodeWrapper.mesh.position.x * nodeWrapper.mesh.position.x +
              nodeWrapper.mesh.position.z * nodeWrapper.mesh.position.z
            );
            const waveDelay = distance * 0.05;
            const progress = elapsed - waveDelay;
            if (progress > 0) {
              targetY += Math.sin(progress * 8.0) * 0.25;
            }
          }
        }

        nodeWrapper.mesh.position.y = Scalar.Lerp(
          nodeWrapper.mesh.position.y,
          targetY,
          0.15
        );
      });
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        const myThread = threads.find(t => t.id === myThreadId);
        if (myThread) {
          const targetNode = hexNodes.find(n => n.chunkId === myThread.position.meta && n.blockId === myThread.position.hex);
          if (targetNode) {
            camera.target = targetNode.mesh.position.clone();
            console.log("[CANVAS] Reset camera target to player anchor via Spacebar.");
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      if (socket) {
        socket.off('ai_sequence_triggered');
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      engine.dispose();
    };
  }, [gridData, threads, myThreadId, selectedNode, hoveredNode, selectedCard]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block cursor-pointer"
      style={{ touchAction: 'none' }}
    />
  );
}
