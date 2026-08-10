import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { EffectComposer } from '@react-three/postprocessing';
import { Bloom, SMAA, Vignette, ChromaticAberration, Noise, ColorDepth } from '@react-three/postprocessing';
import * as THREE from 'three';

/**
 * Advanced Post-Processing Pipeline
 * Provides cinematic visual effects with performance-aware settings
 */

export default function AdvancedPostProcessing({ 
  enabled = true,
  // Bloom settings
  bloomEnabled = true,
  bloomIntensity = 0.6,
  bloomLuminanceThreshold = 0.8,
  bloomRadius = 0.4,
  
  // Color grading
  colorGradingEnabled = true,
  saturation = 1.1,
  contrast = 1.05,
  brightness = 1.0,
  
  // Cinematic effects
  vignetteEnabled = true,
  vignetteDarkness = 0.3,
  vignetteOffset = 0.5,
  
  chromaticAberrationEnabled = false,
  chromaticAberrationIntensity = 0.02,
  
  filmGrainEnabled = false,
  filmGrainIntensity = 0.03,
  
  // Performance mode for low-end devices
  performanceMode = false,
  
  // Dynamic adjustment based on scene
  adaptiveBloom = true,
  sceneBrightness = 0.5
}) {
  const { gl, scene, camera } = useThree();
  const composerRef = useRef(null);
  const bloomRef = useRef(null);
  
  // Auto-adjust settings based on performance mode
  const settings = useMemo(() => {
    if (performanceMode) {
      return {
        bloomEnabled: false,
        chromaticAberrationEnabled: false,
        filmGrainEnabled: false,
        vignetteEnabled: true,
        vignetteDarkness: 0.2
      };
    }
    return {
      bloomEnabled,
      chromaticAberrationEnabled,
      filmGrainEnabled,
      vignetteEnabled,
      vignetteDarkness
    };
  }, [performanceMode, bloomEnabled, chromaticAberrationEnabled, filmGrainEnabled, vignetteEnabled, vignetteDarkness]);

  // Adaptive bloom based on scene brightness
  useEffect(() => {
    if (adaptiveBloom && bloomRef.current && enabled && settings.bloomEnabled) {
      const adjustedIntensity = bloomIntensity * (1.5 - sceneBrightness);
      bloomRef.current.intensity = Math.max(0.1, adjustedIntensity);
    }
  }, [adaptiveBloom, bloomIntensity, sceneBrightness, enabled, settings.bloomEnabled]);

  if (!enabled) {
    return null;
  }

  return (
    <EffectComposer renderer={gl} multisampling={performanceMode ? 0 : 8}>
      {/* Bloom - Glowing highlights */}
      {settings.bloomEnabled && (
        <Bloom
          ref={bloomRef}
          intensity={bloomIntensity}
          luminanceThreshold={bloomLuminanceThreshold}
          radius={bloomRadius}
          levels={9}
          resolution={256}
        />
      )}
      
      {/* SMAA - Anti-aliasing for smooth edges */}
      {!performanceMode && (
        <SMAA 
          preset="HIGH" 
          edgeDetectionThreshold={0.1}
        />
      )}
      
      {/* Vignette - Darkened corners for cinematic feel */}
      {settings.vignetteEnabled && (
        <Vignette
          darkness={vignetteDarkness}
          offset={vignetteOffset}
          cylindrical={false}
        />
      )}
      
      {/* Chromatic Aberration - Subtle color fringing (use sparingly) */}
      {settings.chromaticAberrationEnabled && (
        <ChromaticAberration
          offset={[chromaticAberrationIntensity, chromaticAberrationIntensity]}
          radialModulation={false}
          modulationOffset={0}
        />
      )}
      
      {/* Film Grain - Analog film texture */}
      {settings.filmGrainEnabled && (
        <Noise
          opacity={filmGrainIntensity}
        />
      )}
      
      {/* Color Depth - Enhanced color precision */}
      {colorGradingEnabled && !performanceMode && (
        <ColorDepth bits={8} framed={false} />
      )}
    </EffectComposer>
  );
}

/**
 * Dynamic Tone Mapping Controller
 * Adjusts exposure and tone mapping based on scene content
 */
export function DynamicToneMapping({ 
  targetBrightness = 0.6,
  adaptationSpeed = 0.1,
  minExposure = 0.1,
  maxExposure = 2.0
}) {
  const { scene, camera, gl } = useThree();
  const currentExposure = useRef(gl.toneMappingExposure);
  const targetExposure = useRef(targetBrightness);

  useFrame((state, delta) => {
    // Simple automatic exposure adjustment
    const exposureDelta = targetExposure.current - currentExposure.current;
    currentExposure.current += exposureDelta * adaptationSpeed;
    
    // Clamp exposure
    currentExposure.current = THREE.MathUtils.clamp(
      currentExposure.current,
      minExposure,
      maxExposure
    );
    
    gl.toneMappingExposure = currentExposure.current;
  });

  return null;
}

/**
 * Depth of Field Effect
 * Blurs background/foreground based on focus point
 */
export function DepthOfField({ 
  enabled = false,
  focusDistance = 0,
  focusRange = 0.5,
  focalLength = 1,
  bokehScale = 1
}) {
  const { camera } = useThree();
  
  if (!enabled) return null;

  // Note: Full DOF requires additional post-processing setup
  // This is a placeholder for future implementation
  
  return null;
}

/**
 * Motion Blur Effect
 * Adds blur during fast camera movements
 */
export function MotionBlur({ 
  enabled = false,
  shutterSpeed = 0.5
}) {
  if (!enabled) return null;
  
  // Placeholder for motion blur implementation
  // Requires velocity buffer support
  
  return null;
}
