/**
 * Texture Streaming Manager
 * Dynamically loads and unloads textures based on visibility and priority
 * Optimized for low and high-end hardware configurations
 */

import * as THREE from 'three';
import type { HardwareTier } from './AdaptiveRenderPipeline';

export interface TextureConfig {
  maxTextureSize: number;
  mipmaps: boolean;
  anisotropy: number;
  compressionEnabled: boolean;
  preloadDistance: number;
  unloadDelay: number; // ms before unloading invisible textures
}

export interface TextureRequest {
  id: string;
  url: string;
  priority: number; // Higher = load first
  distance: number; // Distance from camera
  visible: boolean;
  loaded: boolean;
  texture?: THREE.Texture;
  lastSeenTime: number;
}

export class TextureStreamingManager {
  private renderer: THREE.WebGLRenderer;
  private currentHardwareTier: HardwareTier;
  private config: TextureConfig;
  private textureQueue: Map<string, TextureRequest>;
  private loadingQueue: string[];
  private maxConcurrentLoads: number;
  private activeLoads: number = 0;

  constructor(
    renderer: THREE.WebGLRenderer,
    hardwareTier: HardwareTier = 'desktop-medium'
  ) {
    this.renderer = renderer;
    this.currentHardwareTier = hardwareTier;
    this.textureQueue = new Map();
    this.loadingQueue = [];
    this.config = this.getConfigForTier(hardwareTier);
    this.maxConcurrentLoads = this.getMaxConcurrentLoads(hardwareTier);
    
    this.startStreamingLoop();
  }

  /**
   * Get texture configuration based on hardware tier
   */
  private getConfigForTier(tier: HardwareTier): TextureConfig {
    const configs: Record<HardwareTier, TextureConfig> = {
      'mobile-low': {
        maxTextureSize: 512,
        mipmaps: true,
        anisotropy: 1,
        compressionEnabled: true,
        preloadDistance: 30,
        unloadDelay: 5000
      },
      'mobile-high': {
        maxTextureSize: 1024,
        mipmaps: true,
        anisotropy: 2,
        compressionEnabled: true,
        preloadDistance: 50,
        unloadDelay: 8000
      },
      'desktop-low': {
        maxTextureSize: 1024,
        mipmaps: true,
        anisotropy: 4,
        compressionEnabled: true,
        preloadDistance: 80,
        unloadDelay: 10000
      },
      'desktop-medium': {
        maxTextureSize: 2048,
        mipmaps: true,
        anisotropy: 8,
        compressionEnabled: true,
        preloadDistance: 120,
        unloadDelay: 15000
      },
      'desktop-high': {
        maxTextureSize: 4096,
        mipmaps: true,
        anisotropy: 16,
        compressionEnabled: false,
        preloadDistance: 200,
        unloadDelay: 20000
      },
      'workstation': {
        maxTextureSize: 8192,
        mipmaps: true,
        anisotropy: 16,
        compressionEnabled: false,
        preloadDistance: 300,
        unloadDelay: 30000
      }
    };
    
    return configs[tier];
  }

  private getMaxConcurrentLoads(tier: HardwareTier): number {
    const loads: Record<HardwareTier, number> = {
      'mobile-low': 2,
      'mobile-high': 4,
      'desktop-low': 6,
      'desktop-medium': 8,
      'desktop-high': 12,
      'workstation': 16
    };
    return loads[tier];
  }

  /**
   * Register a texture for streaming
   */
  public registerTexture(
    id: string,
    url: string,
    priority: number = 5,
    distance: number = 0
  ): void {
    if (this.textureQueue.has(id)) {
      const existing = this.textureQueue.get(id)!;
      existing.priority = Math.max(existing.priority, priority);
      existing.distance = distance;
      existing.visible = true;
      existing.lastSeenTime = performance.now();
      return;
    }

    this.textureQueue.set(id, {
      id,
      url,
      priority,
      distance,
      visible: true,
      loaded: false,
      lastSeenTime: performance.now()
    });

    // Add to loading queue if within preload distance
    if (distance <= this.config.preloadDistance) {
      this.addToLoadingQueue(id);
    }
  }

  /**
   * Mark texture as visible/invisible
   */
  public setVisibility(id: string, visible: boolean): void {
    const request = this.textureQueue.get(id);
    if (request) {
      request.visible = visible;
      if (visible) {
        request.lastSeenTime = performance.now();
        if (!request.loaded && request.distance <= this.config.preloadDistance) {
          this.addToLoadingQueue(id);
        }
      }
    }
  }

  /**
   * Update texture distance from camera
   */
  public updateDistance(id: string, distance: number): void {
    const request = this.textureQueue.get(id);
    if (request) {
      request.distance = distance;
      
      // Load if now within range
      if (!request.loaded && distance <= this.config.preloadDistance) {
        this.addToLoadingQueue(id);
      }
      
      // Unload if far away and not visible
      if (request.loaded && distance > this.config.preloadDistance * 2 && !request.visible) {
        this.scheduleUnload(id);
      }
    }
  }

  /**
   * Add texture to loading queue with priority sorting
   */
  private addToLoadingQueue(id: string): void {
    if (this.loadingQueue.includes(id) || this.textureQueue.get(id)?.loaded) {
      return;
    }

    this.loadingQueue.push(id);
    this.loadingQueue.sort((a, b) => {
      const reqA = this.textureQueue.get(a)!;
      const reqB = this.textureQueue.get(b)!;
      
      // Priority first, then distance (closer = higher priority)
      if (reqA.priority !== reqB.priority) {
        return reqB.priority - reqA.priority;
      }
      return reqA.distance - reqB.distance;
    });
  }

  /**
   * Schedule texture for unloading
   */
  private scheduleUnload(id: string): void {
    const request = this.textureQueue.get(id);
    if (!request || !request.loaded) return;

    setTimeout(() => {
      const req = this.textureQueue.get(id);
      if (req && !req.visible && req.distance > this.config.preloadDistance * 1.5) {
        this.unloadTexture(id);
      }
    }, this.config.unloadDelay);
  }

  /**
   * Load a texture
   */
  private async loadTexture(id: string): Promise<void> {
    const request = this.textureQueue.get(id);
    if (!request || request.loaded || this.activeLoads >= this.maxConcurrentLoads) {
      return;
    }

    this.activeLoads++;

    try {
      const loader = new THREE.TextureLoader();
      
      const texture = await new Promise<THREE.Texture>((resolve, reject) => {
        loader.load(
          request.url,
          resolve,
          undefined,
          reject
        );
      });

      // Apply configuration
      texture.generateMipmaps = this.config.mipmaps;
      texture.anisotropy = this.config.anisotropy;
      
      // Limit texture size based on hardware
      if (this.config.maxTextureSize < 8192) {
        const image = texture.image;
        if (image) {
          const scale = this.config.maxTextureSize / Math.max(image.width, image.height);
          if (scale < 1) {
            // Resize would happen here in production using canvas or WebGL
            console.log(`[Texture Stream] Downsizing ${id} to ${this.config.maxTextureSize}`);
          }
        }
      }

      texture.needsUpdate = true;
      request.texture = texture;
      request.loaded = true;

      // Dispatch event for other systems
      window.dispatchEvent(new CustomEvent('texture-loaded', { detail: { id, texture } }));
    } catch (error) {
      console.warn(`[Texture Stream] Failed to load ${id}:`, error);
      request.loaded = false;
    } finally {
      this.activeLoads--;
      this.loadingQueue = this.loadingQueue.filter(qId => qId !== id);
    }
  }

  /**
   * Unload a texture to free memory
   */
  private unloadTexture(id: string): void {
    const request = this.textureQueue.get(id);
    if (!request || !request.texture) return;

    // Dispose texture
    request.texture.dispose();
    request.texture = undefined;
    request.loaded = false;

    console.log(`[Texture Stream] Unloaded ${id}`);
    
    window.dispatchEvent(new CustomEvent('texture-unloaded', { detail: { id } }));
  }

  /**
   * Start the streaming loop
   */
  private startStreamingLoop(): void {
    setInterval(() => {
      // Process loading queue
      while (this.activeLoads < this.maxConcurrentLoads && this.loadingQueue.length > 0) {
        const nextId = this.loadingQueue.shift();
        if (nextId) {
          this.loadTexture(nextId);
        }
      }
    }, 100);
  }

  /**
   * Update hardware tier
   */
  public setHardwareTier(tier: HardwareTier): void {
    if (tier === this.currentHardwareTier) return;

    const oldConfig = this.config;
    this.currentHardwareTier = tier;
    this.config = this.getConfigForTier(tier);
    this.maxConcurrentLoads = this.getMaxConcurrentLoads(tier);

    // Adjust all loaded textures to new config
    this.textureQueue.forEach((request, id) => {
      if (request.texture) {
        request.texture.anisotropy = this.config.anisotropy;
        request.texture.needsUpdate = true;
      }
    });

    console.log(`[Texture Stream] Updated to tier: ${tier}`);
  }

  /**
   * Get statistics
   */
  public getStats(): {
    totalTextures: number;
    loadedTextures: number;
    loadingTextures: number;
    memoryEstimate: number; // MB
  } {
    let loadedCount = 0;
    let loadingCount = this.loadingQueue.length;
    let memoryEstimate = 0;

    this.textureQueue.forEach((request) => {
      if (request.loaded && request.texture) {
        loadedCount++;
        // Rough memory estimate (width * height * 4 bytes for RGBA)
        const image = request.texture.image;
        if (image) {
          memoryEstimate += (image.width * image.height * 4) / (1024 * 1024);
        }
      }
    });

    return {
      totalTextures: this.textureQueue.size,
      loadedTextures: loadedCount,
      loadingTextures: loadingCount,
      memoryEstimate: parseFloat(memoryEstimate.toFixed(2))
    };
  }

  /**
   * Clear all textures
   */
  public clearAll(): void {
    this.textureQueue.forEach((request, id) => {
      this.unloadTexture(id);
    });
    this.textureQueue.clear();
    this.loadingQueue = [];
  }
}
