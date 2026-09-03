/**
 * Level of Detail (LOD) Manager
 * Dynamically adjusts model detail based on distance and hardware tier
 */

import * as THREE from 'three';
import type { HardwareTier } from './AdaptiveRenderPipeline';

export interface LODConfig {
  distances: number[]; // Distance thresholds for each LOD level
  maxLodLevel: number; // Maximum LOD level to use
  fadeTransition: boolean; // Enable smooth LOD transitions
  fadeDistance: number; // Distance over which to fade between LODs
}

export class LODManager {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private lodObjects: Map<string, THREE.LOD>;
  private currentHardwareTier: HardwareTier;
  private config: LODConfig;
  private updateInterval: number = 100; // ms between LOD updates
  private lastUpdateTime: number = 0;

  constructor(scene: THREE.Scene, camera: THREE.Camera, hardwareTier: HardwareTier = 'desktop-medium') {
    this.scene = scene;
    this.camera = camera;
    this.lodObjects = new Map();
    this.currentHardwareTier = hardwareTier;
    this.config = this.getConfigForTier(hardwareTier);
    
    this.startUpdateLoop();
  }

  /**
   * Get LOD configuration based on hardware tier
   */
  private getConfigForTier(tier: HardwareTier): LODConfig {
    const configs: Record<HardwareTier, LODConfig> = {
      'mobile-low': {
        distances: [0, 20, 50],
        maxLodLevel: 2,
        fadeTransition: false,
        fadeDistance: 0
      },
      'mobile-high': {
        distances: [0, 30, 70, 120],
        maxLodLevel: 3,
        fadeTransition: true,
        fadeDistance: 10
      },
      'desktop-low': {
        distances: [0, 40, 100, 200],
        maxLodLevel: 3,
        fadeTransition: true,
        fadeDistance: 15
      },
      'desktop-medium': {
        distances: [0, 50, 150, 300, 500],
        maxLodLevel: 4,
        fadeTransition: true,
        fadeDistance: 20
      },
      'desktop-high': {
        distances: [0, 60, 180, 400, 700, 1000],
        maxLodLevel: 5,
        fadeTransition: true,
        fadeDistance: 25
      },
      'workstation': {
        distances: [0, 80, 200, 500, 900, 1400, 2000],
        maxLodLevel: 6,
        fadeTransition: true,
        fadeDistance: 30
      }
    };
    
    return configs[tier];
  }

  /**
   * Register a new LOD object with multiple detail levels
   */
  public registerLOD(
    id: string,
    meshes: { mesh: THREE.Object3D; distance?: number }[],
    autoAddToScene: boolean = true
  ): THREE.LOD {
    const lod = new THREE.LOD();
    
    // Sort meshes by distance (closest first)
    const sortedMeshes = [...meshes].sort((a, b) => 
      (a.distance || 0) - (b.distance || 0)
    );
    
    // Add meshes to LOD with appropriate distances
    sortedMeshes.forEach(({ mesh, distance }, index) => {
      const lodDistance = distance ?? this.config.distances[index] ?? this.config.distances[this.config.distances.length - 1];
      
      if (this.config.fadeTransition && index < sortedMeshes.length - 1) {
        // Use fade for smooth transitions
        lod.addLevel(mesh, lodDistance, this.config.fadeDistance);
      } else {
        lod.addLevel(mesh, lodDistance);
      }
    });
    
    // Limit to max LOD level based on hardware
    while (lod.levels.length > this.config.maxLodLevel + 1) {
      const removedLevel = lod.levels.pop();
      if (removedLevel) {
        lod.removeLevel(removedLevel.object as THREE.Object3D);
      }
    }
    
    if (autoAddToScene) {
      this.scene.add(lod);
    }
    
    this.lodObjects.set(id, lod);
    
    return lod;
  }

  /**
   * Create simplified mesh versions for LOD levels
   */
  public static async createLODMeshes(
    originalMesh: THREE.Mesh,
    targetVertexCounts: number[]
  ): Promise<THREE.Mesh[]> {
    const meshes: THREE.Mesh[] = [originalMesh];
    
    for (const targetCount of targetVertexCounts) {
      const simplified = await this.simplifyMesh(originalMesh, targetCount);
      meshes.push(simplified);
    }
    
    return meshes;
  }

  /**
   * Simplify mesh using vertex decimation (placeholder - use actual simplification library in production)
   */
  private static async simplifyMesh(mesh: THREE.Mesh, targetVertices: number): Promise<THREE.Mesh> {
    const geometry = mesh.geometry.clone();
    const positionAttribute = geometry.attributes.position;
    const currentVertices = positionAttribute.count;
    
    if (currentVertices <= targetVertices) {
      return mesh.clone();
    }
    
    // Simple vertex reduction strategy (in production, use proper mesh simplification)
    const ratio = targetVertices / currentVertices;
    const indicesToRemove = Math.floor(currentVertices * (1 - ratio));
    
    // Create new geometry with reduced vertices
    const simplifiedGeometry = new THREE.BufferGeometry();
    
    // Copy attributes with reduction
    for (const [name, attribute] of Object.entries(geometry.attributes)) {
      const newArray = new (attribute.array.constructor as any)(targetVertices * attribute.itemSize);
      
      for (let i = 0; i < targetVertices; i++) {
        const sourceIndex = Math.floor(i / ratio);
        for (let j = 0; j < attribute.itemSize; j++) {
          newArray[i * attribute.itemSize + j] = attribute.array[sourceIndex * attribute.itemSize + j];
        }
      }
      
      simplifiedGeometry.setAttribute(name, new THREE.BufferAttribute(newArray, attribute.itemSize));
    }
    
    // Copy index if exists
    if (geometry.index) {
      const indexArray = new Uint16Array(Math.floor(geometry.index.count * ratio));
      for (let i = 0; i < indexArray.length; i++) {
        indexArray[i] = Math.floor(i / ratio);
      }
      simplifiedGeometry.index = new THREE.BufferAttribute(indexArray, 1);
    }
    
    simplifiedGeometry.computeVertexNormals();
    
    const simplifiedMesh = new THREE.Mesh(simplifiedGeometry, mesh.material.clone());
    simplifiedMesh.position.copy(mesh.position);
    simplifiedMesh.rotation.copy(mesh.rotation);
    simplifiedMesh.scale.copy(mesh.scale);
    
    return simplifiedMesh;
  }

  /**
   * Update LOD levels based on camera distance
   */
  private updateLODs(): void {
    const cameraPosition = this.camera.position;
    
    this.lodObjects.forEach((lod, id) => {
      const distance = lod.position.distanceTo(cameraPosition);
      lod.update(cameraPosition);
    });
  }

  /**
   * Start the LOD update loop
   */
  private startUpdateLoop(): void {
    const update = () => {
      const now = performance.now();
      
      if (now - this.lastUpdateTime >= this.updateInterval) {
        this.updateLODs();
        this.lastUpdateTime = now;
      }
      
      requestAnimationFrame(update);
    };
    
    requestAnimationFrame(update);
  }

  /**
   * Update hardware tier and reconfigure LODs
   */
  public setHardwareTier(tier: HardwareTier): void {
    if (tier === this.currentHardwareTier) return;
    
    this.currentHardwareTier = tier;
    this.config = this.getConfigForTier(tier);
    
    // Reconfigure all existing LOD objects
    this.lodObjects.forEach((lod, id) => {
      // Adjust LOD distances based on new tier
      // This is a simplified approach - in production, you might want to rebuild LODs
      console.log(`[LOD Manager] Reconfigured for tier: ${tier}`);
    });
  }

  /**
   * Remove an LOD object
   */
  public removeLOD(id: string): void {
    const lod = this.lodObjects.get(id);
    if (lod) {
      this.scene.remove(lod);
      this.lodObjects.delete(id);
    }
  }

  /**
   * Get all registered LOD objects
   */
  public getAllLODs(): Map<string, THREE.LOD> {
    return new Map(this.lodObjects);
  }

  /**
   * Get statistics about LOD usage
   */
  public getStats(): {
    totalLODs: number;
    activeLevels: number;
    avgDistance: number;
  } {
    let activeLevels = 0;
    let totalDistance = 0;
    
    this.lodObjects.forEach((lod) => {
      activeLevels += lod.getCurrentLevel() + 1;
      totalDistance += lod.position.distanceTo(this.camera.position);
    });
    
    return {
      totalLODs: this.lodObjects.size,
      activeLevels,
      avgDistance: this.lodObjects.size > 0 ? totalDistance / this.lodObjects.size : 0
    };
  }
}
