/**
 * Render Pipeline Test Suite
 * Tests for adaptive rendering across hardware configurations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdaptiveRenderPipeline, createRenderPipeline, getRenderPipeline } from './AdaptiveRenderPipeline';
import { LODManager } from './LODManager';
import { TextureStreamingManager } from './TextureStreamingManager';
import * as THREE from 'three';

describe('AdaptiveRenderPipeline', () => {
  let canvas: HTMLCanvasElement;
  let mockRenderer: THREE.WebGLRenderer;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    mockRenderer = {
      getContext: vi.fn(() => ({
        getExtension: vi.fn(() => ({
          UNMASKED_RENDERER_WEBGL: 0x1F01
        })),
        getParameter: vi.fn(() => 'NVIDIA GeForce RTX 3080')
      })),
      setPixelRatio: vi.fn(),
      shadowMap: { enabled: false, type: THREE.BasicShadowMap }
    } as unknown as THREE.WebGLRenderer;

    // Mock THREE.WebGLRenderer
    vi.spyOn(THREE, 'WebGLRenderer').mockImplementation(() => mockRenderer);
  });

  describe('Hardware Detection', () => {
    it('should detect workstation tier for high-end GPU', () => {
      const pipeline = new AdaptiveRenderPipeline(canvas);
      expect(pipeline.getHardwareTier()).toBe('workstation');
    });

    it('should apply correct preset for detected tier', () => {
      const pipeline = new AdaptiveRenderPipeline(canvas);
      const config = pipeline.getConfig();
      
      expect(config.targetFPS).toBeGreaterThan(0);
      expect(config.maxDrawCalls).toBeGreaterThan(0);
      expect(config.textureQuality).toBeDefined();
    });

    it('should allow manual quality override', () => {
      const pipeline = new AdaptiveRenderPipeline(canvas);
      
      pipeline.setQualityPreset('low');
      expect(pipeline.getHardwareTier()).toBe('mobile-low');
      
      pipeline.setQualityPreset('ultra');
      expect(pipeline.getHardwareTier()).toBe('desktop-high');
    });
  });

  describe('Performance Monitoring', () => {
    it('should track FPS correctly', () => {
      const pipeline = new AdaptiveRenderPipeline(canvas);
      const monitor = (pipeline as any).performanceMonitor;
      
      // Simulate frame updates
      for (let i = 0; i < 10; i++) {
        monitor.update();
      }
      
      const fps = monitor.getCurrentFPS();
      expect(fps).toBeGreaterThanOrEqual(0);
    });

    it('should calculate stability score', () => {
      const pipeline = new AdaptiveRenderPipeline(canvas);
      const monitor = (pipeline as any).performanceMonitor;
      
      const stability = monitor.getStabilityScore();
      expect(stability).toBeGreaterThanOrEqual(0);
      expect(stability).toBeLessThanOrEqual(1);
    });
  });

  describe('Config History', () => {
    it('should maintain configuration history', () => {
      const pipeline = new AdaptiveRenderPipeline(canvas);
      
      pipeline.setQualityPreset('low');
      pipeline.setQualityPreset('medium');
      pipeline.setQualityPreset('high');
      
      const history = pipeline.getConfigHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history.length).toBeLessThanOrEqual(5);
    });
  });
});

describe('LODManager', () => {
  let scene: THREE.Scene;
  let camera: THREE.Camera;
  let lodManager: LODManager;

  beforeEach(() => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 10);
    lodManager = new LODManager(scene, camera, 'desktop-medium');
  });

  describe('LOD Registration', () => {
    it('should register LOD object', () => {
      const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshBasicMaterial();
      const mesh = new THREE.Mesh(geometry, material);
      
      const lod = lodManager.registerLOD('test-object', [{ mesh }]);
      
      expect(lod).toBeDefined();
      expect(lod.levels.length).toBeGreaterThan(0);
    });

    it('should limit LOD levels based on tier', () => {
      const lowTierManager = new LODManager(scene, camera, 'mobile-low');
      const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshBasicMaterial();
      const mesh = new THREE.Mesh(geometry, material);
      
      const lod = lowTierManager.registerLOD('test-object', [
        { mesh, distance: 0 },
        { mesh: mesh.clone(), distance: 20 },
        { mesh: mesh.clone(), distance: 50 },
        { mesh: mesh.clone(), distance: 100 }
      ]);
      
      // Mobile-low should have max 2 LOD levels
      expect(lod.levels.length).toBeLessThanOrEqual(3);
    });

    it('should provide statistics', () => {
      const stats = lodManager.getStats();
      
      expect(stats.totalLODs).toBe(0);
      expect(stats.activeLevels).toBe(0);
      expect(stats.avgDistance).toBe(0);
    });
  });
});

describe('TextureStreamingManager', () => {
  let renderer: THREE.WebGLRenderer;
  let streamer: TextureStreamingManager;

  beforeEach(() => {
    renderer = new THREE.WebGLRenderer({ canvas: document.createElement('canvas') });
    streamer = new TextureStreamingManager(renderer, 'desktop-medium');
  });

  describe('Texture Registration', () => {
    it('should register texture for streaming', () => {
      streamer.registerTexture('test-texture', '/textures/test.png', 5, 50);
      
      const stats = streamer.getStats();
      expect(stats.totalTextures).toBe(1);
    });

    it('should update visibility', () => {
      streamer.registerTexture('test-texture', '/textures/test.png');
      streamer.setVisibility('test-texture', false);
      streamer.setVisibility('test-texture', true);
      
      // Should not throw
      expect(() => streamer.setVisibility('non-existent', true)).not.toThrow();
    });

    it('should update distance', () => {
      streamer.registerTexture('test-texture', '/textures/test.png', 5, 10);
      streamer.updateDistance('test-texture', 100);
      
      // Should update internal state
      const stats = streamer.getStats();
      expect(stats.totalTextures).toBe(1);
    });

    it('should provide memory estimate', () => {
      const stats = streamer.getStats();
      
      expect(stats.memoryEstimate).toBeGreaterThanOrEqual(0);
      expect(typeof stats.memoryEstimate).toBe('number');
    });
  });

  describe('Hardware Tier Updates', () => {
    it('should update configuration when tier changes', () => {
      streamer.setHardwareTier('mobile-low');
      const stats1 = streamer.getStats();
      
      streamer.setHardwareTier('workstation');
      const stats2 = streamer.getStats();
      
      // Both should work without errors
      expect(stats1.totalTextures).toBe(stats2.totalTextures);
    });
  });

  describe('Cleanup', () => {
    it('should clear all textures', () => {
      streamer.registerTexture('test1', '/textures/test1.png');
      streamer.registerTexture('test2', '/textures/test2.png');
      
      streamer.clearAll();
      
      const stats = streamer.getStats();
      expect(stats.totalTextures).toBe(0);
      expect(stats.loadedTextures).toBe(0);
    });
  });
});

describe('Integration Tests', () => {
  it('should coordinate between pipeline and managers', () => {
    const canvas = document.createElement('canvas');
    const pipeline = createRenderPipeline(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    
    const tier = pipeline.getHardwareTier();
    const lodManager = new LODManager(scene, camera, tier);
    const textureStreamer = new TextureStreamingManager(pipeline.getRenderer(), tier);
    
    // Change quality preset
    pipeline.setQualityPreset('low');
    const newTier = pipeline.getHardwareTier();
    
    // Managers should be able to update
    lodManager.setHardwareTier(newTier);
    textureStreamer.setHardwareTier(newTier);
    
    expect(newTier).toBe('mobile-low');
  });

  it('should handle singleton pattern', () => {
    const canvas = document.createElement('canvas');
    
    const pipeline1 = createRenderPipeline(canvas);
    const pipeline2 = getRenderPipeline();
    
    expect(pipeline1).toBe(pipeline2);
  });
});
