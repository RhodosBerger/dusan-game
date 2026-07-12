import { useRef, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { BIOME_SPECS } from '../../design/worldDesign';
import { createSeededRandom } from '../../design/seededRandom';

const PORTAL_NODE_ID = 'm4_s0';
const TRUNK_COLOR = new THREE.Color('#201d27');

export default function InstancedWorldProps({ gridData, collapsingNodeIds = [] }) {
  // 1. Procedural generation & positioning of all prop instances
  const instances = useMemo(() => {
    const crystals = [];
    const trunks = [];
    const foliage = [];
    const spikes = [];
    const stones = [];
    const pools = [];
    const flowers = [];

    gridData.forEach((node) => {
      if (collapsingNodeIds.includes(node.id) || node.isTown || node.id === PORTAL_NODE_ID) {
        return;
      }
      const [hexX, hexY, hexZ] = node.position;
      const rnd = createSeededRandom(node.macroIndex * 7 + node.subIndex + 1);

      if (node.biome === 'GLACIER') {
        // Glacier Crystals
        for (let s = 0; s < 2; s++) {
          const offsetAngle = rnd() * Math.PI * 2;
          const offsetR = 0.2 + rnd() * 0.3;
          const posX = hexX + Math.cos(offsetAngle) * offsetR;
          const posZ = hexZ + Math.sin(offsetAngle) * offsetR;
          for (let c = 0; c < 3; c++) {
            const crystalAngle = rnd() * Math.PI * 2;
            const crystalR = c === 0 ? 0 : 0.1 + rnd() * 0.12;
            const h = c === 0 ? 1.3 : 0.4 + rnd() * 0.5;
            const tiltX = (rnd() - 0.5) * 0.35;
            const tiltZ = (rnd() - 0.5) * 0.35;
            crystals.push({
              x: posX + Math.cos(crystalAngle) * crystalR,
              y: 0.45,
              z: posZ + Math.sin(crystalAngle) * crystalR,
              rotX: tiltX,
              rotY: rnd() * Math.PI,
              rotZ: tiltZ,
              scaleX: 0.12 + h * 0.08,
              scaleY: h,
              scaleZ: 0.12 + h * 0.08,
            });
          }
        }
      } else if (node.biome === 'LUSH_FOREST') {
        // Lush Forest Trees
        for (let t = 0; t < 2; t++) {
          const offsetAngle = rnd() * Math.PI * 2;
          const offsetR = 0.2 + rnd() * 0.3;
          const posX = hexX + Math.cos(offsetAngle) * offsetR;
          const posZ = hexZ + Math.sin(offsetAngle) * offsetR;
          const leanX = (rnd() - 0.5) * 0.25;
          const leanZ = (rnd() - 0.5) * 0.25;

          // Trunk
          trunks.push({
            x: posX,
            y: 0.45 + 0.55,
            z: posZ,
            rotX: leanX,
            rotY: 0,
            rotZ: leanZ,
            scaleX: 1,
            scaleY: 1,
            scaleZ: 1,
          });
          // Foliage 1
          foliage.push({
            x: posX + leanX * 0.8,
            y: 0.45 + 1.35,
            z: posZ + leanZ * 0.8,
            rotX: 0,
            rotY: 0,
            rotZ: 0,
            scaleX: 0.55,
            scaleY: 0.55,
            scaleZ: 0.55,
          });
          // Foliage 2
          foliage.push({
            x: posX + 0.3 + leanX * 0.6,
            y: 0.45 + 1.15,
            z: posZ + 0.1 + leanZ * 0.6,
            rotX: 0,
            rotY: 0,
            rotZ: 0,
            scaleX: 0.4,
            scaleY: 0.4,
            scaleZ: 0.4,
          });
        }
      } else if (node.biome === 'BARRENS') {
        // Barrens Spikes
        for (let s = 0; s < 3; s++) {
          const offsetAngle = rnd() * Math.PI * 2;
          const offsetR = 0.15 + rnd() * 0.35;
          const posX = hexX + Math.cos(offsetAngle) * offsetR;
          const posZ = hexZ + Math.sin(offsetAngle) * offsetR;
          const h = 0.5 + rnd() * 0.7;
          const base = 0.14 + rnd() * 0.08;
          const tiltX = (rnd() - 0.5) * 0.3;
          const tiltZ = (rnd() - 0.5) * 0.3;
          spikes.push({
            x: posX,
            y: 0.45 + h / 2,
            z: posZ,
            rotX: tiltX,
            rotY: rnd() * Math.PI,
            rotZ: tiltZ,
            scaleX: base,
            scaleY: h,
            scaleZ: base,
          });
        }
      } else if (node.biome === 'DESERT') {
        // Desert Stones
        for (let s = 0; s < 3; s++) {
          const offsetAngle = rnd() * Math.PI * 2;
          const offsetR = 0.15 + rnd() * 0.35;
          const posX = hexX + Math.cos(offsetAngle) * offsetR;
          const posZ = hexZ + Math.sin(offsetAngle) * offsetR;
          const scale = 0.1 + rnd() * 0.08;
          stones.push({
            x: posX,
            y: 0.45 + scale * 0.6,
            z: posZ,
            rotX: 0,
            rotY: rnd() * Math.PI,
            rotZ: 0,
            scaleX: scale,
            scaleY: scale,
            scaleZ: scale,
          });
        }
      } else if (node.biome === 'TOXIC_SWAMP') {
        // Toxic Pools & Flowers
        pools.push({
          x: hexX,
          y: 0.45 + 0.03,
          z: hexZ,
          rotX: -Math.PI / 2,
          rotY: 0,
          rotZ: 0,
          scaleX: 1,
          scaleY: 1,
          scaleZ: 1,
        });
        for (let f = 0; f < 3; f++) {
          const offsetAngle = rnd() * Math.PI * 2;
          const offsetR = 0.85 + rnd() * 0.15;
          flowers.push({
            x: hexX + Math.cos(offsetAngle) * offsetR,
            y: 0.45 + 0.05,
            z: hexZ + Math.sin(offsetAngle) * offsetR,
            rotX: 0,
            rotY: 0,
            rotZ: 0,
            scaleX: 1,
            scaleY: 1,
            scaleZ: 1,
          });
        }
      }
    });

    return { crystals, trunks, foliage, spikes, stones, pools, flowers };
  }, [gridData, collapsingNodeIds]);

  // Refs for Instanced Meshes
  const crystalsRef = useRef();
  const trunksRef = useRef();
  const foliageRef = useRef();
  const spikesRef = useRef();
  const stonesRef = useRef();
  const poolsRef = useRef();
  const flowersRef = useRef();

  // Helper function to update matrices
  const updateInstances = (ref, list) => {
    if (!ref.current || !list.length) return;
    const temp = new THREE.Object3D();
    list.forEach((item, idx) => {
      temp.position.set(item.x, item.y, item.z);
      temp.rotation.set(item.rotX, item.rotY, item.rotZ);
      temp.scale.set(item.scaleX, item.scaleY, item.scaleZ);
      temp.updateMatrix();
      ref.current.setMatrixAt(idx, temp.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  };

  useLayoutEffect(() => {
    updateInstances(crystalsRef, instances.crystals);
    updateInstances(trunksRef, instances.trunks);
    updateInstances(foliageRef, instances.foliage);
    updateInstances(spikesRef, instances.spikes);
    updateInstances(stonesRef, instances.stones);
    updateInstances(poolsRef, instances.pools);
    updateInstances(flowersRef, instances.flowers);
  }, [instances]);

  // 2. Procedural Geometries & Materials Caching (Cache Memory Optimization)
  const sharedResources = useMemo(() => {
    return {
      crystalGeom: new THREE.ConeGeometry(0.2, 1, 5),
      trunkGeom: new THREE.CylinderGeometry(0.09, 0.15, 1.1, 6),
      foliageGeom: new THREE.SphereGeometry(1, 9, 8),
      spikeGeom: new THREE.ConeGeometry(1, 1, 5),
      stoneGeom: new THREE.DodecahedronGeometry(1, 0),
      poolGeom: new THREE.CircleGeometry(0.9, 24),
      flowerGeom: new THREE.SphereGeometry(0.055, 6, 5),

      crystalMat: new THREE.MeshStandardMaterial({
        color: new THREE.Color(BIOME_SPECS.GLACIER.accent),
        emissive: new THREE.Color(BIOME_SPECS.GLACIER.accent),
        emissiveIntensity: 0.4,
        roughness: 0.15,
        metalness: 0,
        flatShading: true,
      }),
      trunkMat: new THREE.MeshStandardMaterial({
        color: TRUNK_COLOR,
        roughness: 1.0,
        metalness: 0,
        flatShading: true,
      }),
      foliageMat: new THREE.MeshStandardMaterial({
        color: new THREE.Color(BIOME_SPECS.LUSH_FOREST.accent),
        roughness: 1.0,
        metalness: 0,
        flatShading: true,
      }),
      spikeMat: new THREE.MeshStandardMaterial({
        color: new THREE.Color(BIOME_SPECS.BARRENS.base),
        roughness: 1.0,
        metalness: 0,
        flatShading: true,
      }),
      stoneMat: new THREE.MeshStandardMaterial({
        color: new THREE.Color(BIOME_SPECS.DESERT.base),
        roughness: 1.0,
        metalness: 0,
        flatShading: true,
      }),
      poolMat: new THREE.MeshStandardMaterial({
        color: new THREE.Color(BIOME_SPECS.TOXIC_SWAMP.accent),
        emissive: new THREE.Color(BIOME_SPECS.TOXIC_SWAMP.accent),
        emissiveIntensity: 0.85,
        roughness: 0.4,
        metalness: 0,
      }),
      flowerMat: new THREE.MeshStandardMaterial({
        color: new THREE.Color(BIOME_SPECS.TOXIC_SWAMP.accentFlower),
        emissive: new THREE.Color(BIOME_SPECS.TOXIC_SWAMP.accentFlower),
        emissiveIntensity: 0.5,
        roughness: 0.6,
        metalness: 0,
      }),
    };
  }, []);

  return (
    <group>
      {/* Instanced Glacier Crystals */}
      {instances.crystals.length > 0 && (
        <instancedMesh
          ref={crystalsRef}
          args={[sharedResources.crystalGeom, sharedResources.crystalMat, instances.crystals.length]}
          castShadow
        />
      )}

      {/* Instanced Forest Trunks */}
      {instances.trunks.length > 0 && (
        <instancedMesh
          ref={trunksRef}
          args={[sharedResources.trunkGeom, sharedResources.trunkMat, instances.trunks.length]}
          castShadow
        />
      )}

      {/* Instanced Forest Foliage */}
      {instances.foliage.length > 0 && (
        <instancedMesh
          ref={foliageRef}
          args={[sharedResources.foliageGeom, sharedResources.foliageMat, instances.foliage.length]}
          castShadow
        />
      )}

      {/* Instanced Barrens Spikes */}
      {instances.spikes.length > 0 && (
        <instancedMesh
          ref={spikesRef}
          args={[sharedResources.spikeGeom, sharedResources.spikeMat, instances.spikes.length]}
          castShadow
        />
      )}

      {/* Instanced Desert Stones */}
      {instances.stones.length > 0 && (
        <instancedMesh
          ref={stonesRef}
          args={[sharedResources.stoneGeom, sharedResources.stoneMat, instances.stones.length]}
          castShadow
        />
      )}

      {/* Instanced Swamp Pools */}
      {instances.pools.length > 0 && (
        <instancedMesh
          ref={poolsRef}
          args={[sharedResources.poolGeom, sharedResources.poolMat, instances.pools.length]}
        />
      )}

      {/* Instanced Swamp Flowers */}
      {instances.flowers.length > 0 && (
        <instancedMesh
          ref={flowersRef}
          args={[sharedResources.flowerGeom, sharedResources.flowerMat, instances.flowers.length]}
          castShadow
        />
      )}
    </group>
  );
}
