import * as THREE from 'three';

/**
 * Non-destructive Geometry Modifier Pipeline (Rule 12 compliant)
 * Allows procedural rendering tools to apply Blender-style operations.
 */
export class GeometryModifierStack {
    /**
     * ArrayModifier: Clones and translates the base geometry multiple times.
     * Mimics Blender's Array modifier.
     */
    static applyArray(geometry, count, offset = [1.2, 0, 0]) {
        if (count <= 1) return geometry.clone();

        const positionAttr = geometry.getAttribute('position');
        const normalAttr = geometry.getAttribute('normal');
        const uvAttr = geometry.getAttribute('uv');
        const indexAttr = geometry.getIndex();

        const vertexCount = positionAttr.count;
        const totalVertices = vertexCount * count;

        const positions = new Float32Array(totalVertices * 3);
        const normals = normalAttr ? new Float32Array(totalVertices * 3) : null;
        const uvs = uvAttr ? new Float32Array(totalVertices * 2) : null;

        let indices = null;
        if (indexAttr) {
            const indexCount = indexAttr.count;
            indices = new Uint32Array(indexCount * count);
            for (let c = 0; c < count; c++) {
                const indexOffset = c * indexCount;
                const vertOffset = c * vertexCount;
                for (let i = 0; i < indexCount; i++) {
                    indices[indexOffset + i] = indexAttr.getX(i) + vertOffset;
                }
            }
        }

        for (let c = 0; c < count; c++) {
            const vertOffset = c * vertexCount;
            const dx = offset[0] * c;
            const dy = offset[1] * c;
            const dz = offset[2] * c;

            for (let i = 0; i < vertexCount; i++) {
                const idx = vertOffset + i;
                positions[idx * 3] = positionAttr.getX(i) + dx;
                positions[idx * 3 + 1] = positionAttr.getY(i) + dy;
                positions[idx * 3 + 2] = positionAttr.getZ(i) + dz;

                if (normals) {
                    normals[idx * 3] = normalAttr.getX(i);
                    normals[idx * 3 + 1] = normalAttr.getY(i);
                    normals[idx * 3 + 2] = normalAttr.getZ(i);
                }

                if (uvs) {
                    uvs[idx * 2] = uvAttr.getX(i);
                    uvs[idx * 2 + 1] = uvAttr.getY(i);
                }
            }
        }

        const mergedGeo = new THREE.BufferGeometry();
        mergedGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        if (normals) {
            mergedGeo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        }
        if (uvs) {
            mergedGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        }
        if (indices) {
            mergedGeo.setIndex(new THREE.BufferAttribute(indices, 1));
        } else {
            mergedGeo.computeVertexNormals();
        }

        return mergedGeo;
    }

    /**
     * BevelModifier: Applies custom extrusion and bevel parameters to a 2D shape.
     */
    static applyBevel(shape, depth = 0.1, bevelSize = 0.01, bevelThickness = 0.01, bevelSegments = 2) {
        const settings = {
            depth: depth,
            bevelEnabled: true,
            bevelSegments: bevelSegments,
            steps: 1,
            bevelSize: bevelSize,
            bevelThickness: bevelThickness
        };
        return new THREE.ExtrudeGeometry(shape, settings);
    }
}
