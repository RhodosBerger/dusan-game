/**
 * Render Configuration Documentation
 * 
 * This module provides adaptive rendering for all hardware configurations.
 */

# Adaptive Render Pipeline - Complete Guide

## Overview

The Dušan Game rendering system automatically adjusts quality settings based on detected hardware capabilities, ensuring optimal performance across:
- 📱 **Mobile Low-End** (30 FPS target)
- 📱 **Mobile High-End** (45 FPS target)  
- 💻 **Desktop Low** (60 FPS target)
- 💻 **Desktop Medium** (60 FPS target)
- 💻 **Desktop High** (90 FPS target)
- 🖥️ **Workstation** (120+ FPS target)

## Hardware Detection

The system automatically detects your hardware tier using:
- **GPU Analysis**: Identifies GPU model and capabilities
- **CPU Cores**: Uses `navigator.hardwareConcurrency`
- **Memory**: Uses `navigator.deviceMemory`
- **Real-time Performance**: Monitors FPS and frame times

## Quality Presets

### Mobile Low-End
```json
{
  "pixelRatio": 0.5,
  "shadows": false,
  "textures": "512px max",
  "particles": 50,
  "postProcessing": false,
  "targetFPS": 30
}
```

### Desktop Medium
```json
{
  "pixelRatio": 1.0,
  "shadows": "PCF Soft",
  "textures": "2048px max",
  "particles": 600,
  "postProcessing": true,
  "SSAO": true,
  "Bloom": true,
  "targetFPS": 60
}
```

### Workstation
```json
{
  "pixelRatio": 1.5,
  "shadows": "VSM",
  "textures": "8192px max",
  "particles": 2000,
  "postProcessing": true,
  "SSAO": true,
  "Bloom": true,
  "MotionBlur": true,
  "VolumetricLighting": true,
  "Tessellation": true,
  "targetFPS": 120
}
```

## Manual Override

Players can manually select quality preset:

```typescript
import { getRenderPipeline } from './rendering/AdaptiveRenderPipeline';

const pipeline = getRenderPipeline();
pipeline.setQualityPreset('low'); // 'low' | 'medium' | 'high' | 'ultra'
```

## LOD System

Level of Detail automatically adjusts model complexity:

| Tier | Max LOD Levels | Fade Distance | Update Interval |
|------|---------------|---------------|-----------------|
| Mobile Low | 2 | None | 200ms |
| Desktop Medium | 4 | 20 units | 100ms |
| Workstation | 6 | 30 units | 50ms |

## Texture Streaming

Textures are loaded/unloaded dynamically based on:
- **Distance from camera**
- **Visibility** (frustum culling)
- **Priority** (important assets load first)
- **Available memory**

### Concurrent Loads by Tier
- Mobile Low: 2 textures
- Desktop Medium: 8 textures
- Workstation: 16 textures

## Performance Monitoring

Real-time metrics available:
```typescript
const stats = pipeline.getPerformanceMonitor().getStats();
console.log(`FPS: ${stats.currentFPS}`);
console.log(`Frame Time: ${stats.averageFrameTime}ms`);
console.log(`Stability: ${(stats.stabilityScore * 100).toFixed(1)}%`);
```

## Integration Example

```typescript
import { createRenderPipeline } from './rendering/AdaptiveRenderPipeline';
import { LODManager } from './rendering/LODManager';
import { TextureStreamingManager } from './rendering/TextureStreamingManager';

// Create render pipeline
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const pipeline = createRenderPipeline(canvas);

// Get detected tier
const tier = pipeline.getHardwareTier();
console.log(`Detected hardware: ${tier}`);

// Create LOD manager
const lodManager = new LODManager(scene, camera, tier);

// Create texture streamer
const textureStreamer = new TextureStreamingManager(pipeline.getRenderer(), tier);

// Listen for config changes
window.addEventListener('render-config-changed', (e: CustomEvent) => {
  const { config, tier } = e.detail;
  lodManager.setHardwareTier(tier);
  textureStreamer.setHardwareTier(tier);
});
```

## Memory Management

Automatic cleanup occurs when:
- Textures are out of view for >15 seconds (desktop)
- Distance exceeds 2x preload range
- Memory pressure is detected

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `render-config-changed` | `{config, tier}` | Quality settings updated |
| `texture-loaded` | `{id, texture}` | Texture finished loading |
| `texture-unloaded` | `{id}` | Texture removed from memory |

## Troubleshooting

### Performance Issues
1. Check current tier: `pipeline.getHardwareTier()`
2. View FPS: `pipeline.getPerformanceMonitor().getCurrentFPS()`
3. Lower preset: `pipeline.setQualityPreset('low')`

### Texture Pop-in
- Increase `preloadDistance` in config
- Ensure textures have proper priority values
- Check network bandwidth

### Memory Leaks
- Monitor texture count: `textureStreamer.getStats()`
- Verify `dispose()` is called on removed objects
- Check for orphaned event listeners

## Platform-Specific Optimizations

### Mobile Safari
- Limited to 1024px textures on older devices
- Reduced anisotropy support
- Automatic pixel ratio clamping

### Android Chrome
- Better WebGL support on recent versions
- Can use up to 2048px on mid-range devices
- Hardware acceleration recommended

### Desktop Firefox
- Full feature support
- Best performance with WebGPU flag enabled
- No texture size limitations

## Future Enhancements

Planned improvements:
- [ ] WebGPU backend support
- [ ] DLSS/FSR upscaling integration
- [ ] Real-time ray tracing (workstation tier)
- [ ] VR/AR optimized presets
- [ ] Cloud rendering fallback

---

For API reference, see individual module documentation:
- [`AdaptiveRenderPipeline.ts`](./AdaptiveRenderPipeline.ts)
- [`LODManager.ts`](./LODManager.ts)
- [`TextureStreamingManager.ts`](./TextureStreamingManager.ts)
