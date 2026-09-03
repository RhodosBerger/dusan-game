/**
 * Adaptive Render Pipeline - Dynamic Quality Scaling
 * Automatically adjusts rendering quality based on hardware capabilities
 * Supports low-end mobile to high-end desktop configurations
 */

import * as THREE from 'three';

export interface RenderConfig {
  // Core settings
  pixelRatio: number;
  antialias: boolean;
  shadowMapEnabled: boolean;
  shadowMapType: THREE.PCFShadowMapType | THREE.PCFSoftShadowMapType | THREE.VSMShadowMapType;
  
  // Quality presets
  textureQuality: 'low' | 'medium' | 'high' | 'ultra';
  modelDetail: 'low' | 'medium' | 'high' | 'ultra';
  particleCount: number;
  postProcessingEnabled: boolean;
  
  // Advanced features
  ssaoEnabled: boolean;
  bloomEnabled: boolean;
  motionBlurEnabled: boolean;
  volumetricLightingEnabled: boolean;
  tessellationEnabled: boolean;
  
  // Performance targets
  targetFPS: number;
  maxDrawCalls: number;
  maxTextures: number;
  maxVertexCount: number;
}

export type HardwareTier = 'mobile-low' | 'mobile-high' | 'desktop-low' | 'desktop-medium' | 'desktop-high' | 'workstation';

export class AdaptiveRenderPipeline {
  private renderer: THREE.WebGLRenderer;
  private currentConfig: RenderConfig;
  private detectedTier: HardwareTier;
  private performanceMonitor: PerformanceMonitor;
  private configHistory: RenderConfig[] = [];
  
  // Preset configurations for different hardware tiers
  private static readonly PRESETS: Record<HardwareTier, RenderConfig> = {
    'mobile-low': {
      pixelRatio: 0.5,
      antialias: false,
      shadowMapEnabled: false,
      shadowMapType: THREE.BasicShadowMap,
      textureQuality: 'low',
      modelDetail: 'low',
      particleCount: 50,
      postProcessingEnabled: false,
      ssaoEnabled: false,
      bloomEnabled: false,
      motionBlurEnabled: false,
      volumetricLightingEnabled: false,
      tessellationEnabled: false,
      targetFPS: 30,
      maxDrawCalls: 200,
      maxTextures: 64,
      maxVertexCount: 50000
    },
    'mobile-high': {
      pixelRatio: 0.75,
      antialias: true,
      shadowMapEnabled: true,
      shadowMapType: THREE.PCFShadowMap,
      textureQuality: 'medium',
      modelDetail: 'medium',
      particleCount: 150,
      postProcessingEnabled: false,
      ssaoEnabled: false,
      bloomEnabled: false,
      motionBlurEnabled: false,
      volumetricLightingEnabled: false,
      tessellationEnabled: false,
      targetFPS: 45,
      maxDrawCalls: 400,
      maxTextures: 128,
      maxVertexCount: 100000
    },
    'desktop-low': {
      pixelRatio: 1.0,
      antialias: true,
      shadowMapEnabled: true,
      shadowMapType: THREE.PCFShadowMap,
      textureQuality: 'medium',
      modelDetail: 'medium',
      particleCount: 300,
      postProcessingEnabled: true,
      ssaoEnabled: false,
      bloomEnabled: true,
      motionBlurEnabled: false,
      volumetricLightingEnabled: false,
      tessellationEnabled: false,
      targetFPS: 60,
      maxDrawCalls: 800,
      maxTextures: 256,
      maxVertexCount: 200000
    },
    'desktop-medium': {
      pixelRatio: 1.0,
      antialias: true,
      shadowMapEnabled: true,
      shadowMapType: THREE.PCFSoftShadowMap,
      textureQuality: 'high',
      modelDetail: 'high',
      particleCount: 600,
      postProcessingEnabled: true,
      ssaoEnabled: true,
      bloomEnabled: true,
      motionBlurEnabled: false,
      volumetricLightingEnabled: false,
      tessellationEnabled: false,
      targetFPS: 60,
      maxDrawCalls: 1500,
      maxTextures: 512,
      maxVertexCount: 400000
    },
    'desktop-high': {
      pixelRatio: 1.25,
      antialias: true,
      shadowMapEnabled: true,
      shadowMapType: THREE.PCFSoftShadowMap,
      textureQuality: 'high',
      modelDetail: 'high',
      particleCount: 1000,
      postProcessingEnabled: true,
      ssaoEnabled: true,
      bloomEnabled: true,
      motionBlurEnabled: true,
      volumetricLightingEnabled: true,
      tessellationEnabled: false,
      targetFPS: 90,
      maxDrawCalls: 3000,
      maxTextures: 1024,
      maxVertexCount: 800000
    },
    'workstation': {
      pixelRatio: 1.5,
      antialias: true,
      shadowMapEnabled: true,
      shadowMapType: THREE.VSMShadowMap,
      textureQuality: 'ultra',
      modelDetail: 'ultra',
      particleCount: 2000,
      postProcessingEnabled: true,
      ssaoEnabled: true,
      bloomEnabled: true,
      motionBlurEnabled: true,
      volumetricLightingEnabled: true,
      tessellationEnabled: true,
      targetFPS: 120,
      maxDrawCalls: 6000,
      maxTextures: 2048,
      maxVertexCount: 2000000
    }
  };

  constructor(canvas: HTMLCanvasElement, initialConfig?: Partial<RenderConfig>) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: initialConfig?.antialias ?? true,
      powerPreference: 'high-performance'
    });
    
    this.performanceMonitor = new PerformanceMonitor();
    this.detectedTier = this.detectHardwareTier();
    this.currentConfig = this.loadConfig(initialConfig);
    
    this.applyConfig(this.currentConfig);
    this.startAdaptiveLoop();
  }

  /**
   * Detect hardware tier based on GPU, CPU, and memory
   */
  private detectHardwareTier(): HardwareTier {
    const gl = this.renderer.getContext() as WebGLRenderingContext;
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    
    let gpuScore = 0;
    let cpuScore = 0;
    let memoryScore = 0;
    
    // GPU Detection
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      gpuScore = this.evaluateGPU(renderer);
    }
    
    // Memory Detection
    const memory = (navigator as any).deviceMemory || 4;
    memoryScore = memory >= 8 ? 3 : memory >= 4 ? 2 : 1;
    
    // CPU Cores Detection
    const cpuCores = navigator.hardwareConcurrency || 4;
    cpuScore = cpuCores >= 8 ? 3 : cpuCores >= 4 ? 2 : 1;
    
    // Calculate overall score
    const totalScore = gpuScore + memoryScore + cpuScore;
    
    if (totalScore <= 3) return 'mobile-low';
    if (totalScore <= 5) return 'mobile-high';
    if (totalScore <= 7) return 'desktop-low';
    if (totalScore <= 8) return 'desktop-medium';
    if (totalScore <= 9) return 'desktop-high';
    return 'workstation';
  }

  private evaluateGPU(renderer: string): number {
    const rendererLower = renderer.toLowerCase();
    
    // Mobile GPUs
    if (rendererLower.includes('adreno')) {
      if (rendererLower.includes('640') || rendererLower.includes('650') || rendererLower.includes('660')) return 2;
      return 1;
    }
    if (rendererLower.includes('mali')) {
      if (rendererLower.includes('g7') || rendererLower.includes('g6')) return 2;
      return 1;
    }
    if (rendererLower.includes('powervr')) return 1;
    
    // Desktop GPUs
    if (rendererLower.includes('nvidia')) {
      if (rendererLower.includes('rtx 40') || rendererLower.includes('rtx 30')) return 3;
      if (rendererLower.includes('rtx 20') || rendererLower.includes('gtx 16')) return 2;
      return 1;
    }
    if (rendererLower.includes('amd') || rendererLower.includes('radeon')) {
      if (rendererLower.includes('rx 7') || rendererLower.includes('rx 6')) return 3;
      if (rendererLower.includes('rx 5')) return 2;
      return 1;
    }
    if (rendererLower.includes('intel')) {
      if (rendererLower.includes('arc')) return 2;
      return 1;
    }
    
    return 2; // Default medium
  }

  /**
   * Load configuration with override support
   */
  private loadConfig(override?: Partial<RenderConfig>): RenderConfig {
    const baseConfig = { ...AdaptiveRenderPipeline.PRESETS[this.detectedTier] };
    
    if (override) {
      Object.assign(baseConfig, override);
    }
    
    // Check localStorage for user preferences
    try {
      const saved = localStorage.getItem('render-config');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(baseConfig, parsed);
      }
    } catch (e) {
      console.warn('Could not load saved render config');
    }
    
    return baseConfig;
  }

  /**
   * Apply configuration to renderer
   */
  private applyConfig(config: RenderConfig): void {
    // Pixel ratio
    this.renderer.setPixelRatio(Math.min(config.pixelRatio, window.devicePixelRatio));
    
    // Shadow map
    if (config.shadowMapEnabled) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = config.shadowMapType;
    } else {
      this.renderer.shadowMap.enabled = false;
    }
    
    // Store current config
    this.currentConfig = config;
    
    // Dispatch event for other systems to react
    window.dispatchEvent(new CustomEvent('render-config-changed', { 
      detail: { config, tier: this.detectedTier } 
    }));
    
    console.log(`[Render Pipeline] Applied config for tier: ${this.detectedTier}`);
  }

  /**
   * Start adaptive performance monitoring loop
   */
  private startAdaptiveLoop(): void {
    setInterval(() => {
      const fps = this.performanceMonitor.getCurrentFPS();
      const frameTime = this.performanceMonitor.getAverageFrameTime();
      
      // Auto-adjust if performance drops below target
      if (fps < this.currentConfig.targetFPS * 0.8 && frameTime > 1000 / this.currentConfig.targetFPS * 1.2) {
        this.throttleDown();
      } else if (fps > this.currentConfig.targetFPS * 1.1 && frameTime < 1000 / this.currentConfig.targetFPS * 0.9) {
        this.throttleUp();
      }
    }, 2000); // Check every 2 seconds
  }

  /**
   * Reduce quality settings when performance drops
   */
  private throttleDown(): void {
    const currentIndex = this.getTierIndex(this.detectedTier);
    if (currentIndex <= 0) return; // Already at lowest
    
    const newTierIndex = currentIndex - 1;
    const tiers: HardwareTier[] = ['mobile-low', 'mobile-high', 'desktop-low', 'desktop-medium', 'desktop-high', 'workstation'];
    const newTier = tiers[newTierIndex];
    
    this.configHistory.push({ ...this.currentConfig });
    if (this.configHistory.length > 5) this.configHistory.shift();
    
    this.detectedTier = newTier;
    this.currentConfig = { ...AdaptiveRenderPipeline.PRESETS[newTier] };
    this.applyConfig(this.currentConfig);
    
    console.log(`[Render Pipeline] Throttled down to ${newTier} due to performance drop`);
  }

  /**
   * Increase quality settings when performance is good
   */
  private throttleUp(): void {
    const currentIndex = this.getTierIndex(this.detectedTier);
    if (currentIndex >= 5) return; // Already at highest
    
    const newTierIndex = currentIndex + 1;
    const tiers: HardwareTier[] = ['mobile-low', 'mobile-high', 'desktop-low', 'desktop-medium', 'desktop-high', 'workstation'];
    const newTier = tiers[newTierIndex];
    
    // Only upgrade if we've been stable for a while
    if (this.performanceMonitor.getStabilityScore() > 0.9) {
      this.detectedTier = newTier;
      this.currentConfig = { ...AdaptiveRenderPipeline.PRESETS[newTier] };
      this.applyConfig(this.currentConfig);
      
      console.log(`[Render Pipeline] Throttled up to ${newTier} due to good performance`);
    }
  }

  private getTierIndex(tier: HardwareTier): number {
    const tiers: HardwareTier[] = ['mobile-low', 'mobile-high', 'desktop-low', 'desktop-medium', 'desktop-high', 'workstation'];
    return tiers.indexOf(tier);
  }

  /**
   * Manual override for user settings
   */
  public setQualityPreset(preset: 'low' | 'medium' | 'high' | 'ultra'): void {
    const mapping: Record<string, HardwareTier> = {
      'low': 'mobile-low',
      'medium': 'desktop-low',
      'high': 'desktop-medium',
      'ultra': 'desktop-high'
    };
    
    this.detectedTier = mapping[preset];
    this.currentConfig = { ...AdaptiveRenderPipeline.PRESETS[this.detectedTier] };
    this.applyConfig(this.currentConfig);
    
    // Save to localStorage
    try {
      localStorage.setItem('render-config', JSON.stringify(this.currentConfig));
    } catch (e) {
      console.warn('Could not save render config');
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): RenderConfig {
    return { ...this.currentConfig };
  }

  /**
   * Get detected hardware tier
   */
  public getHardwareTier(): HardwareTier {
    return this.detectedTier;
  }

  /**
   * Get renderer instance
   */
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Get configuration history for debugging
   */
  public getConfigHistory(): RenderConfig[] {
    return [...this.configHistory];
  }
}

/**
 * Performance Monitor - Tracks FPS, frame times, and stability
 */
class PerformanceMonitor {
  private fps: number = 0;
  private frameTimes: number[] = [];
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private stabilitySamples: number[] = [];

  constructor() {
    this.lastFrameTime = performance.now();
  }

  public update(): void {
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    
    this.frameTimes.push(deltaTime);
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift();
    }
    
    this.frameCount++;
    
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
      
      // Track stability
      const avgFrameTime = this.getAverageFrameTime();
      const variance = this.calculateVariance(avgFrameTime);
      const stability = Math.max(0, 1 - (variance / avgFrameTime));
      this.stabilitySamples.push(stability);
      if (this.stabilitySamples.length > 10) {
        this.stabilitySamples.shift();
      }
    }
  }

  private calculateVariance(avg: number): number {
    if (this.frameTimes.length === 0) return 0;
    const squaredDiffs = this.frameTimes.map(t => Math.pow(t - avg, 2));
    const sumSquaredDiffs = squaredDiffs.reduce((a, b) => a + b, 0);
    return sumSquaredDiffs / this.frameTimes.length;
  }

  public getCurrentFPS(): number {
    return this.fps;
  }

  public getAverageFrameTime(): number {
    if (this.frameTimes.length === 0) return 0;
    return this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
  }

  public getStabilityScore(): number {
    if (this.stabilitySamples.length === 0) return 1;
    return this.stabilitySamples.reduce((a, b) => a + b, 0) / this.stabilitySamples.length;
  }

  public getMinFPS(): number {
    if (this.frameTimes.length === 0) return 0;
    const maxFrameTime = Math.max(...this.frameTimes);
    return Math.floor(1000 / maxFrameTime);
  }

  public getMaxFPS(): number {
    if (this.frameTimes.length === 0) return 0;
    const minFrameTime = Math.min(...this.frameTimes);
    return Math.floor(1000 / minFrameTime);
  }
}

// Export singleton instance helper
let renderPipelineInstance: AdaptiveRenderPipeline | null = null;

export function createRenderPipeline(canvas: HTMLCanvasElement, config?: Partial<RenderConfig>): AdaptiveRenderPipeline {
  if (!renderPipelineInstance) {
    renderPipelineInstance = new AdaptiveRenderPipeline(canvas, config);
  }
  return renderPipelineInstance;
}

export function getRenderPipeline(): AdaptiveRenderPipeline | null {
  return renderPipelineInstance;
}
