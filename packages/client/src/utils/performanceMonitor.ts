/**
 * Performance Monitor Utility
 * Tracks and reports rendering performance metrics
 */

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangleCount: number;
  memoryUsage: number;
  textureCount: number;
}

export interface PerformanceThresholds {
  minFPS: number;
  maxFrameTime: number;
  maxDrawCalls: number;
  maxMemoryMB: number;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  minFPS: 30,
  maxFrameTime: 33.33, // ~30 FPS
  maxDrawCalls: 500,
  maxMemoryMB: 500
};

class PerformanceMonitorClass {
  private metrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    triangleCount: 0,
    memoryUsage: 0,
    textureCount: 0
  };

  private thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS;
  private listeners: Map<string, Set<(metrics: PerformanceMetrics) => void>> = new Map();
  private frameCount = 0;
  private lastTime = performance.now();
  private animationFrameId: number | null = null;
  private isRunning = false;

  /**
   * Start monitoring performance
   */
  public start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.frameCount = 0;
    
    const measure = () => {
      const currentTime = performance.now();
      this.frameCount++;
      
      // Update metrics every 500ms
      if (currentTime - this.lastTime >= 500) {
        this.metrics.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
        this.metrics.frameTime = (currentTime - this.lastTime) / this.frameCount;
        
        // Memory tracking (if available)
        if ('memory' in performance) {
          const mem = (performance as any).memory;
          this.metrics.memoryUsage = mem.usedJSHeapSize / (1024 * 1024); // Convert to MB
        }
        
        this.emit('update', this.metrics);
        this.checkThresholds();
        
        this.frameCount = 0;
        this.lastTime = currentTime;
      }
      
      if (this.isRunning) {
        this.animationFrameId = requestAnimationFrame(measure);
      }
    };
    
    this.animationFrameId = requestAnimationFrame(measure);
  }

  /**
   * Stop monitoring
   */
  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Update renderer-specific metrics
   */
  public updateRendererStats(renderer: any) {
    if (!renderer || !renderer.info) return;
    
    const info = renderer.info;
    this.metrics.drawCalls = info.render.calls;
    this.metrics.triangleCount = info.render.triangles;
    this.metrics.textureCount = info.memory.textures;
  }

  /**
   * Subscribe to metric updates
   */
  public on(event: string, callback: (metrics: PerformanceMetrics) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from updates
   */
  public off(event: string, callback: (metrics: PerformanceMetrics) => void) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  /**
   * Get current metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Set custom performance thresholds
   */
  public setThresholds(thresholds: Partial<PerformanceThresholds>) {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Check if current metrics exceed thresholds
   */
  private checkThresholds() {
    const warnings: string[] = [];
    
    if (this.metrics.fps < this.thresholds.minFPS) {
      warnings.push(`Low FPS: ${this.metrics.fps}`);
      this.emit('warning', { type: 'low_fps', value: this.metrics.fps });
    }
    
    if (this.metrics.frameTime > this.thresholds.maxFrameTime) {
      warnings.push(`High frame time: ${this.metrics.frameTime.toFixed(2)}ms`);
    }
    
    if (this.metrics.drawCalls > this.thresholds.maxDrawCalls) {
      warnings.push(`High draw calls: ${this.metrics.drawCalls}`);
      this.emit('warning', { type: 'high_draw_calls', value: this.metrics.drawCalls });
    }
    
    if (this.metrics.memoryUsage > this.thresholds.maxMemoryMB) {
      warnings.push(`High memory usage: ${this.metrics.memoryUsage.toFixed(0)}MB`);
      this.emit('warning', { type: 'high_memory', value: this.metrics.memoryUsage });
    }
    
    if (warnings.length > 0) {
      console.warn('[PerformanceMonitor]', warnings.join(', '));
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[PerformanceMonitor] Error in listener:', error);
        }
      });
    }
  }

  /**
   * Generate performance report
   */
  public generateReport(): string {
    return `
=== Performance Report ===
FPS: ${this.metrics.fps}
Frame Time: ${this.metrics.frameTime.toFixed(2)}ms
Draw Calls: ${this.metrics.drawCalls}
Triangles: ${this.metrics.triangleCount.toLocaleString()}
Textures: ${this.metrics.textureCount}
Memory: ${this.metrics.memoryUsage.toFixed(1)}MB
========================
    `.trim();
  }
}

// Singleton instance
export const PerformanceMonitor = new PerformanceMonitorClass();

/**
 * Hook for React components to track performance
 */
export function usePerformanceMonitor(
  onUpdate?: (metrics: PerformanceMetrics) => void,
  onWarning?: (warning: { type: string; value: number }) => void
) {
  useEffect(() => {
    PerformanceMonitor.start();
    
    const unsubscribeUpdate = onUpdate 
      ? PerformanceMonitor.on('update', onUpdate)
      : undefined;
    
    const unsubscribeWarning = onWarning
      ? PerformanceMonitor.on('warning', onWarning)
      : undefined;
    
    return () => {
      unsubscribeUpdate?.();
      unsubscribeWarning?.();
      // Don't stop the monitor on unmount, let it run globally
    };
  }, [onUpdate, onWarning]);
  
  return PerformanceMonitor.getMetrics();
}

// For React compatibility
import { useEffect } from 'react';

export default PerformanceMonitor;
