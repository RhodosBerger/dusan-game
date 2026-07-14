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
import { SSAO2RenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline';
import neonMatrixTexUrl from '../../assets/neon_matrix_grid.png';
import brushedMetalTexUrl from '../../assets/brushed_metal_tech.png';
import { SpatialGuidanceSystem } from '../../../../shared/src/index';

const WORLD_PROFILES = {
  DEFAULT: {
    ambientColor: new Color3(0.48, 0.53, 0.66),
    ambientIntensity: 0.35,
    keyColor: new Color3(1.0, 0.96, 0.88),
    keyIntensity: 1.3,
    fogColor: new Color3(0.03, 0.04, 0.05),
    fogNear: 35.0,
    fogFar: 160.0
  },
  TOXIC_HAZE: {
    ambientColor: new Color3(0.13, 0.16, 0.08),
    ambientIntensity: 0.3,
    keyColor: new Color3(0.82, 0.95, 0.65),
    keyIntensity: 0.9,
    fogColor: new Color3(0.03, 0.05, 0.02),
    fogNear: 20.0,
    fogFar: 100.0
  },
  VOID_ECLIPSE: {
    ambientColor: new Color3(0.07, 0.05, 0.12),
    ambientIntensity: 0.15,
    keyColor: new Color3(0.18, 0.04, 0.31),
    keyIntensity: 0.5,
    fogColor: new Color3(0.01, 0.01, 0.02),
    fogNear: 15.0,
    fogFar: 70.0
  },
  AURORA_STORM: {
    ambientColor: new Color3(0.11, 0.05, 0.17),
    ambientIntensity: 0.5,
    keyColor: new Color3(0.22, 1.0, 0.08),
    keyIntensity: 1.1,
    fogColor: new Color3(0.02, 0.04, 0.06),
    fogNear: 30.0,
    fogFar: 140.0
  }
};

const getActiveProfile = (weatherOverride: string | null | undefined, entropy: number) => {
  if (weatherOverride && WORLD_PROFILES[weatherOverride as keyof typeof WORLD_PROFILES]) {
    return WORLD_PROFILES[weatherOverride as keyof typeof WORLD_PROFILES];
  }
  if (entropy >= 0.6) {
    return WORLD_PROFILES.VOID_ECLIPSE;
  }
  if (entropy >= 0.3) {
    return WORLD_PROFILES.AURORA_STORM;
  }
  return WORLD_PROFILES.DEFAULT;
};

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
  weatherOverride?: string | null;
  ultimateFlash?: boolean;
  scorchedTiles?: string[];
  surgeTile?: any;
  entropy?: number;
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
  socket,
  weatherOverride = 'CLEAR',
  ultimateFlash = false,
  scorchedTiles = [],
  surgeTile = null,
  entropy = 0.2
}: BabylonCanvasRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shuffleTriggerRef = useRef<{ time: number }>({ time: 0 });

  const weatherOverrideRef = useRef(weatherOverride);
  const ultimateFlashRef = useRef(ultimateFlash);
  const scorchedTilesRef = useRef(scorchedTiles);
  const surgeTileRef = useRef(surgeTile);
  const entropyRef = useRef(entropy);
  const selectedCardRef = useRef(selectedCard);
  const hoveredNodeRef = useRef(hoveredNode);

  const [hudConfig, setHudConfig] = React.useState<any>(null);
  const hudConfigRef = useRef<any>(null);
  hudConfigRef.current = hudConfig;

  useEffect(() => {
    const handleUpdate = (e: any) => {
      setHudConfig(e.detail);
    };
    window.addEventListener('spatial_guidance_update', handleUpdate);
    return () => window.removeEventListener('spatial_guidance_update', handleUpdate);
  }, []);

  // Keep refs updated
  useEffect(() => { weatherOverrideRef.current = weatherOverride; }, [weatherOverride]);
  useEffect(() => { ultimateFlashRef.current = ultimateFlash; }, [ultimateFlash]);
  useEffect(() => { scorchedTilesRef.current = scorchedTiles; }, [scorchedTiles]);
  useEffect(() => { surgeTileRef.current = surgeTile; }, [surgeTile]);
  useEffect(() => { entropyRef.current = entropy; }, [entropy]);
  useEffect(() => { selectedCardRef.current = selectedCard; }, [selectedCard]);
  useEffect(() => { hoveredNodeRef.current = hoveredNode; }, [hoveredNode]);

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

    // Tracks character move transitions
    const transitions = new Map<string, {
      startX: number,
      startZ: number,
      startY: number,
      targetX: number,
      targetZ: number,
      targetY: number,
      progress: number,
      formula: string,
      variant: number
    }>();

    // Adaptive rendering profile variables
    let activeQuality = 'ULTRA_FIDELITY';
    let frameTimesCount = 0;
    let totalFrameTime = 0;

    // 1. Initialize Engine and Scene
    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.04, 0.04, 0.06, 1.0);
    scene.ambientColor = new Color3(0.15, 0.2, 0.35);

    // Volumetric/fog setup (Clear Painted Realm default)
    scene.fogMode = Scene.FOGMODE_LINEAR;
    scene.fogColor = new Color3(0.03, 0.04, 0.05);
    scene.fogStart = 35.0;
    scene.fogEnd = 160.0;

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

    // SSAO post-processing (SSAO Rendering Pipeline with WebGL availability guards)
    let ssao: any = null;
    try {
      ssao = new SSAO2RenderingPipeline("ssao", scene, { ssaoRatio: 0.5, blurRatio: 0.5 }, [camera]);
      ssao.radius = 2.0;
      ssao.totalStrength = 1.0;
      ssao.expensiveBlur = false;
      scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("ssao", camera);
    } catch (e) {
      console.warn("[CANVAS] SSAO pipeline failed to initialize, bypassing.", e);
    }

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

    // Helper to create faction-specific thread meshes (Pillar 3 & Section 2)
    const createThreadMesh = (threadId: string) => {
      const threadGroup = MeshBuilder.CreateBox(threadId, { size: 0.01 }, scene);
      threadGroup.setEnabled(true);

      const isPlayer = threadId === myThreadId;
      const isAi = threadId.includes('ai') || threadId.includes('hacker') || threadId.includes('root');
      const isVoid = threadId.includes('void') || threadId.includes('weaver');
      const isHelper = threadId.includes('tower') || threadId.includes('flag') || threadId.includes('sample');
      const isFlag = threadId.includes('flag');

      // Resolve Faction colors and types
      let faction = 'crystal';
      let factionColor = new Color3(0, 0.8, 1);
      if (threadId.includes('hacker') || threadId.includes('toxic') || threadId.includes('root')) {
        faction = 'toxic';
        factionColor = new Color3(0.2, 0.9, 0.2);
      } else if (threadId.includes('void') || threadId.includes('weaver')) {
        faction = 'void';
        factionColor = new Color3(0.7, 0, 0.9);
      } else if (threadId.includes('druid') || threadId.includes('warden')) {
        faction = 'druid';
        factionColor = new Color3(0.9, 0.6, 0);
      }
      const isNPC = !isPlayer && !isAi && !isVoid && !isHelper;
      if (isNPC) {
        faction = 'npc';
        factionColor = new Color3(1, 0.2, 0.2);
      }

      // 1. Base pedestal
      const basePedestal = MeshBuilder.CreateCylinder('pedestal', { diameterTop: 0.8, diameterBottom: 0.9, height: 0.1, tessellation: 16 }, scene);
      basePedestal.parent = threadGroup;
      basePedestal.position.y = 0.05;
      const pedestalMat = new StandardMaterial('pedestalMat_' + threadId, scene);
      pedestalMat.diffuseColor = isNPC ? new Color3(0.16, 0.02, 0.04) : new Color3(0.1, 0.1, 0.1);
      pedestalMat.roughness = 0.9;
      pedestalMat.metallic = 0.1;
      basePedestal.material = pedestalMat;
      shadowGenerator.addShadowCaster(basePedestal);
      basePedestal.receiveShadows = true;

      // 2. Base neon glow ring
      const glowRing = MeshBuilder.CreateTorus('glowRing', { diameter: 0.84, thickness: 0.06, tessellation: 24 }, scene);
      glowRing.parent = threadGroup;
      glowRing.position.y = 0.08;
      const ringMat = new StandardMaterial('ringMat_' + threadId, scene);
      ringMat.emissiveColor = factionColor;
      ringMat.disableLighting = true;
      glowRing.material = ringMat;

      if (isFlag) {
        // Flagpole (Iron/Carbon)
        const pole = MeshBuilder.CreateCylinder('pole', { diameter: 0.05, height: 1.8, tessellation: 8 }, scene);
        pole.parent = threadGroup;
        pole.position.y = 0.9;
        const poleMat = new StandardMaterial('poleMat_' + threadId, scene);
        poleMat.diffuseColor = new Color3(0.27, 0.27, 0.33);
        poleMat.metallic = 0.8;
        poleMat.roughness = 0.3;
        pole.material = poleMat;
        shadowGenerator.addShadowCaster(pole);

        // Flag Banner
        const flagBanner = MeshBuilder.CreateBox('flagBanner', { width: 0.6, height: 0.35, depth: 0.02 }, scene);
        flagBanner.parent = threadGroup;
        flagBanner.position.x = 0.3;
        flagBanner.position.y = 1.4;
        const flagMat = new StandardMaterial('flagMat_' + threadId, scene);
        flagMat.diffuseColor = factionColor;
        flagMat.roughness = 0.8;
        flagBanner.material = flagMat;
        shadowGenerator.addShadowCaster(flagBanner);

        // Floating Faction Sigil Ornament
        let ornament: AbstractMesh;
        if (faction === 'crystal') {
          ornament = MeshBuilder.CreatePolyhedron('ornament', { type: 1, size: 0.08 }, scene); // Octahedron
        } else if (faction === 'toxic') {
          ornament = MeshBuilder.CreateBox('ornament', { size: 0.08 }, scene);
        } else {
          ornament = MeshBuilder.CreateSphere('ornament', { diameter: 0.07 }, scene);
        }
        ornament.parent = threadGroup;
        ornament.position.x = 0.3;
        ornament.position.y = 1.4;
        ornament.position.z = 0.02;
        ornament.rotation.z = Math.PI / 4;
        const whiteMat = new StandardMaterial('whiteMat_' + threadId, scene);
        whiteMat.emissiveColor = new Color3(1, 1, 1);
        whiteMat.disableLighting = true;
        ornament.material = whiteMat;

        // Tip
        const tip = MeshBuilder.CreateSphere('tip', { diameter: 0.1 }, scene);
        tip.parent = threadGroup;
        tip.position.y = 1.82;
        tip.material = ringMat;
      }
      else if (isHelper) {
        // Tower Base
        const towerBase = MeshBuilder.CreateCylinder('towerBase', { diameterTop: 0.6, diameterBottom: 0.9, height: 0.2, tessellation: 6 }, scene);
        towerBase.parent = threadGroup;
        towerBase.position.y = 0.1;
        const towerBaseMat = new StandardMaterial('towerBaseMat_' + threadId, scene);
        towerBaseMat.diffuseColor = new Color3(0.18, 0.18, 0.25);
        towerBaseMat.metallic = 0.8;
        towerBaseMat.roughness = 0.3;
        towerBase.material = towerBaseMat;
        shadowGenerator.addShadowCaster(towerBase);

        // Tower Trunk
        const towerTrunk = MeshBuilder.CreateCylinder('towerTrunk', { diameterTop: 0.36, diameterBottom: 0.44, height: 0.8, tessellation: 6 }, scene);
        towerTrunk.parent = threadGroup;
        towerTrunk.position.y = 0.6;
        const trunkMat = new StandardMaterial('trunkMat_' + threadId, scene);
        trunkMat.diffuseColor = new Color3(0.1, 0.1, 0.14);
        trunkMat.metallic = 0.9;
        trunkMat.roughness = 0.2;
        towerTrunk.material = trunkMat;
        shadowGenerator.addShadowCaster(towerTrunk);

        // Floating Energy Ring
        const floatingRing = MeshBuilder.CreateTorus('floatingRing', { diameter: 0.7, thickness: 0.06, tessellation: 24 }, scene);
        floatingRing.parent = threadGroup;
        floatingRing.position.y = 0.6;
        floatingRing.rotation.x = Math.PI / 2;
        floatingRing.material = ringMat;

        // Cap / Emitter Head
        const emitterHead = MeshBuilder.CreateSphere('emitterHead', { diameter: 0.44 }, scene);
        emitterHead.parent = threadGroup;
        emitterHead.position.y = 1.1;
        emitterHead.material = towerBaseMat;
        shadowGenerator.addShadowCaster(emitterHead);

        // Cone emitter lens
        const lens = MeshBuilder.CreateCylinder('lens', { diameterTop: 0, diameterBottom: 0.16, height: 0.16, tessellation: 8 }, scene);
        lens.parent = threadGroup;
        lens.position.y = 1.1;
        lens.position.z = 0.18;
        lens.rotation.x = Math.PI / 2;
        lens.material = ringMat;
      }
      else if (isNPC) {
        // Crimson pulsing Glitch Core
        const core = MeshBuilder.CreatePolyhedron('core', { type: 1, size: 0.35 }, scene); // Octahedron
        core.parent = threadGroup;
        core.position.y = 0.6;
        const coreMat = new StandardMaterial('coreMat_' + threadId, scene);
        coreMat.diffuseColor = new Color3(0.2, 0.02, 0.05);
        coreMat.emissiveColor = new Color3(1, 0.02, 0.33);
        coreMat.disableLighting = false;
        core.material = coreMat;
        shadowGenerator.addShadowCaster(core);
      }
      else {
        // Torso
        const torso = MeshBuilder.CreateCylinder('torso', { diameterTop: 0.4, diameterBottom: 0.3, height: 0.5, tessellation: 6 }, scene);
        torso.parent = threadGroup;
        torso.position.y = 0.4;
        const torsoMat = new StandardMaterial('torsoMat_' + threadId, scene);
        torsoMat.diffuseColor = new Color3(0.1, 0.1, 0.1);
        torsoMat.roughness = 0.9;
        torsoMat.metallic = 0.1;
        torso.material = torsoMat;
        shadowGenerator.addShadowCaster(torso);

        // Head
        const head = MeshBuilder.CreateSphere('head', { diameter: 0.36 }, scene);
        head.parent = threadGroup;
        head.position.y = 0.78;
        head.material = torsoMat;
        shadowGenerator.addShadowCaster(head);

        // Eyes
        const eyes = MeshBuilder.CreateBox('eyes', { width: 0.24, height: 0.04, depth: 0.04 }, scene);
        eyes.parent = threadGroup;
        eyes.position.y = 0.83;
        eyes.position.z = 0.14;
        const eyesMat = new StandardMaterial('eyesMat_' + threadId, scene);
        eyesMat.emissiveColor = factionColor;
        eyesMat.disableLighting = true;
        eyes.material = eyesMat;

        // Limbs - Left Arm
        const leftArm = MeshBuilder.CreateCylinder('leftArm', { diameter: 0.1, height: 0.28 }, scene);
        leftArm.parent = threadGroup;
        leftArm.position.x = -0.28;
        leftArm.position.y = 0.45;
        const armorMat = new StandardMaterial('armorMat_' + threadId, scene);
        armorMat.diffuseColor = factionColor;
        armorMat.roughness = 0.5;
        armorMat.metallic = 0.8;
        leftArm.material = armorMat;

        // Right Arm
        const rightArm = MeshBuilder.CreateCylinder('rightArm', { diameter: 0.1, height: 0.28 }, scene);
        rightArm.parent = threadGroup;
        rightArm.position.x = 0.28;
        rightArm.position.y = 0.45;
        rightArm.material = armorMat;

        // Floating Aetheric Dice
        const isD12 = faction === 'void' || faction === 'crystal';
        const dice = MeshBuilder.CreatePolyhedron('dice', { type: isD12 ? 2 : 1, size: 0.12 }, scene);
        dice.parent = threadGroup;
        dice.position.y = 1.25;
        const diceMat = new StandardMaterial('diceMat_' + threadId, scene);
        diceMat.emissiveColor = factionColor;
        diceMat.wireframe = true;
        diceMat.disableLighting = true;
        dice.material = diceMat;

        // Neon Sword Weapon
        const swordBlade = MeshBuilder.CreateBox('swordBlade', { width: 0.04, height: 0.45, depth: 0.02 }, scene);
        swordBlade.parent = threadGroup;
        swordBlade.position.x = 0.45;
        swordBlade.position.y = 0.65;
        swordBlade.position.z = 0.1;
        swordBlade.rotation.z = Math.PI / 6;
        const bladeMat = new StandardMaterial('bladeMat_' + threadId, scene);
        bladeMat.emissiveColor = factionColor;
        bladeMat.disableLighting = true;
        swordBlade.material = bladeMat;
        shadowGenerator.addShadowCaster(swordBlade);
      }

      return threadGroup;
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

    // Scorched material for Short Circuit degradation (Rule 5 & Section 2)
    const scorchedMaterial = new StandardMaterial('scorchedMaterial', scene);
    scorchedMaterial.diffuseColor = new Color3(0.15, 0.15, 0.15);
    scorchedMaterial.emissiveColor = new Color3(0.85, 0.18, 0.05); // red ember glow
    scorchedMaterial.roughness = 0.9;

    // Shared SpellFlashBeam mesh (VFX overlay)
    const spellBeam = MeshBuilder.CreateCylinder('spellBeam', { height: 9.0, diameterTop: 0.05, diameterBottom: 0.5, tessellation: 8 }, scene);
    spellBeam.setEnabled(false);
    const beamMat = new StandardMaterial('beamMat', scene);
    beamMat.disableLighting = true;
    spellBeam.material = beamMat;

    let activeTrajLine: any = null;

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
        const nodeKey = `m${chunk.id}_s${block.id}`;
        const isScorched = scorchedTilesRef.current && scorchedTilesRef.current.includes(nodeKey);

        let biomeColor = new Color4(0.5, 0.5, 0.5, 1.0);
        if (isScorched) {
          biomeColor = new Color4(0.12, 0.12, 0.12, 1.0); // charcoal black base
        } else if (block.biome === 'LUSH_FOREST') {
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
        innerInstance.material = isScorched
          ? scorchedMaterial
          : (biomeMaterials.get(block.biome) || innerPlateMat);

        // Highlight/outline edge renderer (Gravity Well Overdrive edge glows)
        let edgeColor = new Color4(0, 0.8, 1, 0.35);
        if (block.biome === 'LUSH_FOREST') {
          edgeColor = new Color4(0.22, 1.0, 0.08, 0.35);
        } else if (block.biome === 'TOXIC_SWAMP') {
          edgeColor = new Color4(0.5, 0.9, 0.0, 0.35);
        } else if (block.biome === 'GLACIER') {
          edgeColor = new Color4(0.0, 0.8, 1.0, 0.35);
        } else if (block.biome === 'DESERT') {
          edgeColor = new Color4(1.0, 0.6, 0.0, 0.35);
        } else if (block.biome === 'BARRENS') {
          edgeColor = new Color4(0.8, 0.4, 0.1, 0.35);
        } else if (block.biome === 'SCORCHED') {
          edgeColor = new Color4(1.0, 0.15, 0.15, 0.35);
        }

        baseInstance.enableEdgesRendering();
        baseInstance.edgesWidth = 3.0;
        baseInstance.edgesColor = edgeColor;

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
            baseInstance.edgesColor = edgeColor;
          })
        );

        // Click trigger routing
        baseInstance.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnLeftPickTrigger, () => {
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

        hexNodes.push({ chunkId: chunk.id, blockId: block.id, mesh: baseInstance, innerPlate: innerInstance, baseEdgeColor: edgeColor });
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
            const targetX = targetNode.mesh.position.x;
            const targetZ = targetNode.mesh.position.z;
            const targetY = targetNode.mesh.position.y + 0.8;

            let trans = transitions.get(t.id);

            if (!trans) {
              transitions.set(t.id, {
                startX: targetX,
                startZ: targetZ,
                startY: targetY,
                targetX,
                targetZ,
                targetY,
                progress: 1.0,
                formula: 'slow_walk',
                variant: 2
              });
              trans = transitions.get(t.id);
            } else if (trans.targetX !== targetX || trans.targetZ !== targetZ || trans.targetY !== targetY) {
              const formulaObj = (window as any).activeSovereignFormulas?.[t.actorType] || {
                formula: t.actorType === 'PLAYER' ? 'slow_walk' : t.actorType === 'NPC' ? 'slime_trail' : 'linear_dash',
                variant: 2
              };
              transitions.set(t.id, {
                startX: targetMesh.position.x,
                startZ: targetMesh.position.z,
                startY: targetMesh.position.y,
                targetX,
                targetZ,
                targetY,
                progress: 0.0,
                formula: formulaObj.formula,
                variant: formulaObj.variant
              });
              trans = transitions.get(t.id);
            }

            let xOff = 0;
            let yOff = 0;
            let zOff = 0;
            let scaleVal = 1.0;
            let alphaVal = 1.0;

            if (trans && trans.progress < 1.0) {
              const dt = engine.getDeltaTime() / 1000;
              trans.progress = Math.min(1.0, trans.progress + dt * 1.5);

              const p = trans.progress;
              targetMesh.position.x = trans.startX + (trans.targetX - trans.startX) * p;
              targetMesh.position.z = trans.startZ + (trans.targetZ - trans.startZ) * p;
              targetMesh.position.y = trans.startY + (trans.targetY - trans.startY) * p;

              const mult = trans.variant * 0.5;
              const formula = trans.formula;

              if (formula === 'slow_walk') {
                yOff = Math.sin(p * Math.PI) * 0.8 * mult;
                scaleVal = 1.0 + Math.sin(p * Math.PI) * 0.15 * mult;
              } else if (formula === 'slime_trail') {
                xOff = Math.sin(p * Math.PI * 2 * 2.5) * 0.35 * mult;
              } else if (formula === 'teleport_dash') {
                alphaVal = p < 0.2 ? (1.0 - p / 0.2) : p > 0.8 ? ((p - 0.8) / 0.2) : 0.0;
                scaleVal = alphaVal;
              } else if (formula === 'earth_glide') {
                yOff = -Math.sin(p * Math.PI) * 0.6 * mult;
              } else if (formula === 'helix_drill') {
                xOff = Math.cos(p * Math.PI * 4) * 0.3 * mult;
                zOff = Math.sin(p * Math.PI * 4) * 0.3 * mult;
                targetMesh.rotation.y += 0.05;
              } else if (formula === 'step_clamber') {
                yOff = Math.floor(p * 4) * 0.2 * mult;
              } else if (formula === 'phase_fade') {
                alphaVal = 1.0 - p * 0.5 * mult;
              } else if (formula === 'friction_brake') {
                const easeOut = 1.0 - Math.pow(1.0 - p, 3);
                targetMesh.position.x = trans.startX + (trans.targetX - trans.startX) * easeOut;
                targetMesh.position.z = trans.startZ + (trans.targetZ - trans.startZ) * p;
              } else if (formula === 'wind_drift') {
                xOff = (Math.random() - 0.5) * 0.15 * mult;
                zOff = (Math.random() - 0.5) * 0.15 * mult;
              } else if (formula === 'charge_surge') {
                const easeIn = Math.pow(p, 3);
                targetMesh.position.x = trans.startX + (trans.targetX - trans.startX) * easeIn;
                targetMesh.position.z = trans.startZ + (trans.targetZ - trans.startZ) * easeIn;
              } else if (formula === 'entropy_decay') {
                xOff = Math.cos(p * 8) * (1 - p) * mult;
                zOff = Math.sin(p * 8) * (1 - p) * mult;
              }
            } else {
              targetMesh.position.x = targetX;
              targetMesh.position.z = targetZ;
              targetMesh.position.y = targetY;
            }

            targetMesh.position.x += xOff;
            targetMesh.position.y += yOff;
            targetMesh.position.z += zOff;
            targetMesh.scaling.set(scaleVal, scaleVal, scaleVal);
            
            targetMesh.getChildMeshes().forEach(child => {
              if (child.material) {
                child.material.alpha = alphaVal;
              }
            });

            const hoverOffset = Math.sin(Date.now() * 0.003 + t.id.charCodeAt(0)) * 0.06;
            targetMesh.position.y += hoverOffset;
            targetMesh.rotation.y += 0.015;

            targetMesh.getChildMeshes().forEach(child => {
              if (child.name.includes('dice')) {
                child.rotation.y += 0.04;
                child.rotation.x += 0.02;
                child.position.y = 1.25 + Math.sin(Date.now() * 0.004 + t.id.charCodeAt(0)) * 0.08;
              } else if (child.name.includes('floatingRing')) {
                child.rotation.z += 0.03;
                child.position.y = 0.6 + Math.sin(Date.now() * 0.0025 + t.id.charCodeAt(0)) * 0.08;
              } else if (child.name.includes('emitterHead')) {
                child.rotation.y += 0.015;
              } else if (child.name.includes('flagBanner') || child.name.includes('ornament')) {
                child.rotation.y = Math.sin(Date.now() * 0.0035 + t.id.charCodeAt(0)) * 0.08;
              } else if (child.name.includes('core')) {
                const pulseScale = 1.0 + Math.sin(Date.now() * 0.008) * 0.15;
                child.scaling.set(pulseScale, pulseScale, pulseScale);
              }
            });
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

      const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;

      // 1. Resolve active weather profile (Section 1 & 2)
      const currentProfile = getActiveProfile(weatherOverrideRef.current, entropyRef.current || 0.2);
      
      // 2. Smoothly LERP lighting and fog attributes (real-time LERP transitions)
      scene.ambientColor = Color3.Lerp(scene.ambientColor, currentProfile.ambientColor, 0.05);
      scene.fogColor = Color3.Lerp(scene.fogColor, currentProfile.fogColor, 0.05);
      scene.fogStart = lerp(scene.fogStart, currentProfile.fogNear, 0.05);
      scene.fogEnd = lerp(scene.fogEnd, currentProfile.fogFar, 0.05);

      if (light) {
        light.diffuse = Color3.Lerp(light.diffuse, currentProfile.keyColor, 0.05);
        light.intensity = lerp(light.intensity, currentProfile.keyIntensity, 0.05);
      }

      // 3. Dynamic weather-based terrain texture rendering modifiers (Section 1 & 2)
      biomeMaterials.forEach((mat) => {
        let targetRoughness = 0.65;
        let targetSpecular = new Color3(0.1, 0.1, 0.1);
        let targetEmissive = new Color3(0, 0, 0);

        if (weatherOverrideRef.current === 'TOXIC_HAZE') {
          targetRoughness = 0.85;
          targetSpecular = new Color3(0.02, 0.02, 0.02);
          targetEmissive = new Color3(0.05, 0.12, 0.05);
        } else if (weatherOverrideRef.current === 'VOID_ECLIPSE') {
          targetRoughness = 0.95;
          targetSpecular = new Color3(0.0, 0.0, 0.0);
          targetEmissive = new Color3(0.08, 0.02, 0.12);
        } else if (weatherOverrideRef.current === 'AURORA_STORM') {
          targetRoughness = 0.35;
          targetSpecular = new Color3(0.6, 0.6, 0.6);
          targetEmissive = new Color3(0.05, 0.15, 0.2);
        }

        mat.roughness = lerp(mat.roughness, targetRoughness, 0.05);
        mat.specularColor = Color3.Lerp(mat.specularColor, targetSpecular, 0.05);
        mat.emissiveColor = Color3.Lerp(mat.emissiveColor, targetEmissive, 0.05);
      });

      // 4. Update SpellFlashBeam card VFX (Section 1 & 2)
      let activeBeamTarget = null as any;
      let activeBeamColor = new Color3(0, 1, 1);

      if (currentAiFrame) {
        const targetNode = hexNodes.find(n => n.chunkId === currentAiFrame.targetChunk && n.blockId === currentAiFrame.targetHex);
        if (targetNode) {
          activeBeamTarget = targetNode.mesh;
          activeBeamColor = currentAiFrame.isThrottled ? new Color3(1.0, 0.9, 0) : new Color3(1.0, 0, 1.0);
        }
      } else if (selectedCardRef.current && hoveredNodeRef.current) {
        const targetNode = hexNodes.find(n => n.chunkId === hoveredNodeRef.current.macroIndex && n.blockId === hoveredNodeRef.current.subIndex);
        if (targetNode) {
          activeBeamTarget = targetNode.mesh;
          activeBeamColor = selectedCardRef.current.type === 'VOID' ? new Color3(0.7, 0, 0.9) : new Color3(0, 1.0, 0.8);
        }
      }

      if (activeBeamTarget) {
        spellBeam.position.x = activeBeamTarget.position.x;
        spellBeam.position.z = activeBeamTarget.position.z;
        spellBeam.position.y = activeBeamTarget.position.y + 4.5;
        beamMat.emissiveColor = activeBeamColor;
        
        const pulse = 0.45 + 0.25 * Math.sin(Date.now() * 0.015);
        beamMat.alpha = pulse;
        spellBeam.setEnabled(true);
      } else {
        spellBeam.setEnabled(false);
      }

      // 8-Directional Vector Guidance Line Overlay (Goal 5)
      const currentHudConfig = hudConfigRef.current;
      if (currentHudConfig && currentHudConfig.targetType === '8direction') {
        const srcThread = threads.find(t => t.id === (currentHudConfig.sourceId || myThreadId));
        if (srcThread && srcThread.position?.meta !== undefined) {
          const sourceNode = hexNodes.find(n => n.chunkId === srcThread.position.meta && n.blockId === srcThread.position.hex);
          if (sourceNode) {
            const startP = sourceNode.mesh.position;
            const srcPos = SpatialGuidanceSystem.resolveCartesian(srcThread.position.meta, srcThread.position.hex);
            const projectedTarget = SpatialGuidanceSystem.resolveEightDirectionTarget(srcPos, currentHudConfig.eightDDir, currentHudConfig.eightDDist);
            
            let closestNode = hexNodes[0];
            let minDistance = Infinity;
            hexNodes.forEach(node => {
              const dx = node.mesh.position.x - projectedTarget.x;
              const dz = node.mesh.position.z - projectedTarget.z;
              const d = dx*dx + dz*dz;
              if (d < minDistance) {
                minDistance = d;
                closestNode = node;
              }
            });
            const endP = closestNode.mesh.position;
            
            if (activeTrajLine) {
              activeTrajLine.dispose();
            }
            
            activeTrajLine = MeshBuilder.CreateLines('activeTrajLine', {
              points: [
                new Vector3(startP.x, startP.y + 0.8, startP.z),
                new Vector3(endP.x, endP.y + 0.8, endP.z)
              ]
            }, scene);
            activeTrajLine.color = new Color3(1, 0.84, 0); // Gold glow
          }
        }
      } else {
        if (activeTrajLine) {
          activeTrajLine.dispose();
          activeTrajLine = null;
        }
      }

      // 5. Ultimate Flash & Shake effect
      if (ultimateFlashRef.current) {
        if (light) {
          light.intensity = 5.0;
        }
        camera.target.x += (Math.random() - 0.5) * 0.4;
        camera.target.z += (Math.random() - 0.5) * 0.4;
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
      } else if (selectedCardRef.current && hoveredNodeRef.current) {
        const targetNode = hexNodes.find(n => n.chunkId === hoveredNodeRef.current.macroIndex && n.blockId === hoveredNodeRef.current.subIndex);
        if (targetNode) {
          formulaPlane.position.x = targetNode.mesh.position.x;
          formulaPlane.position.z = targetNode.mesh.position.z;
          formulaPlane.position.y = targetNode.mesh.position.y + 2.0;
          formulaPlane.setEnabled(true);

          const voltage = selectedCardRef.current.cost * 2.0 + 1.0;
          const resistance = 1.0 + hoveredNodeRef.current.friction;
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
        const isHov = hoveredNodeRef.current && hoveredNodeRef.current.macroIndex === nodeWrapper.chunkId && hoveredNodeRef.current.subIndex === nodeWrapper.blockId;
        const isAiTarget = currentAiFrame && currentAiFrame.targetChunk === nodeWrapper.chunkId && currentAiFrame.targetHex === nodeWrapper.blockId;
        const isSurge = surgeTileRef.current && surgeTileRef.current.meta === nodeWrapper.chunkId && surgeTileRef.current.hex === nodeWrapper.blockId;
        
        let targetY = -0.6;
        if (isSurge) {
          targetY = 0.6; // rises high (Pillar 1 height deformation)
        } else if (isAiTarget) {
          targetY = 0.4; // rises when targeted by AI
        } else if (isSel || isHov) {
          targetY = -0.3; // rises slightly when selected/hovered
        }

        // Apply outline border highlights (Gravity Well Overdrive)
        if (isAiTarget) {
          nodeWrapper.mesh.edgesColor = currentAiFrame.isThrottled 
            ? new Color4(1, 0.9, 0, 1.0) // Throttled Yellow
            : new Color4(1, 0, 0.5, 1.0); // Neon Magenta
        } else if (isHov) {
          nodeWrapper.mesh.edgesColor = new Color4(0.2, 1.0, 0.8, 1.0); // Active Hover Cyan
        } else if (isSurge) {
          nodeWrapper.mesh.edgesColor = new Color4(0.2, 1.0, 0.8, 1.0); // Surge Highlight
        } else {
          nodeWrapper.mesh.edgesColor = nodeWrapper.baseEdgeColor; // Revert to biome-specific neon outline color
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
