import * as THREE from 'three/webgpu';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

const freq1 = .003;
const freq2 = .001;
const freq3 = .0002;
const scale1 = 300;
const scale2 = 500;
const scale3 = 500;
const waterLevel = 500;

const perlin = new ImprovedNoise();

export function terrainHeight(x, y) { // ~200 ns per call
  x -= 6000;
  y -= 3500;
  const fine   = 1 + perlin.noise(x * freq1, y * freq1, 2.7);
  const coarse = 1 + perlin.noise(x * freq2, y * freq2, 2.7);
  const mega   =     perlin.noise(x * freq3, y * freq3, 2.7);
  return coarse * fine * scale1 + coarse * scale2 + mega * scale3 - waterLevel;
}


export class TerrainCell {
  constructor(cellSize, segmentSize, useFaceCentersAndNormals=false) {
    this.cellSize = cellSize;
    this.segmentSize = segmentSize;
    this.segments = (cellSize / segmentSize) | 0;

    const { segments } = this;

    const vertexCount = (segments + 1) * (segments + 1);
    const faceCount = segments * segments * 2;
    const indexCount = faceCount * 3;

    this.positionAttribute = new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3);
    this.uvAttribute = new THREE.BufferAttribute(new Float32Array(vertexCount * 2), 2);
    this.indexAttribute = new THREE.BufferAttribute(new Uint32Array(indexCount), 1);
 
    this.positionAttribute.setUsage(THREE.DynamicDrawUsage);
 
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', this.positionAttribute);
    this.geometry.setAttribute('uv', this.uvAttribute);
    this.geometry.setIndex(this.indexAttribute);

    this.centers = null;
    this.normals = null;

    if (useFaceCentersAndNormals) {
      this.centers = new Array(faceCount);
      this.normals = new Array(faceCount);
  
      for (let i = 0; i < faceCount; i++) {
        this.centers[i] = new THREE.Vector3();
        this.normals[i] = new THREE.Vector3();
      }
    }
  }

  update(x0, y0) {
    const { segments, segmentSize, cellSize } = this;

    const positions = this.positionAttribute.array;
    const uvs = this.uvAttribute.array;
    const indices = this.indexAttribute.array;

    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        const vi = i * (segments + 1) + j;
        const x = x0 + i * segmentSize - cellSize * .5;
        const y = y0 + j * segmentSize - cellSize * .5;


        positions[vi * 3] = x;
        positions[vi * 3 + 1] = y;
        positions[vi * 3 + 2] = terrainHeight(x, y);
 
        uvs[vi * 2] = x / 1000;
        uvs[vi * 2 + 1] = y / 1000;
      }
    }


    let idx = 0;
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * (segments + 1) + j;
        const b = a + 1;
        const c = a + (segments + 1);
        const d = c + 1;
    
        const ad = Math.abs(positions[3 * a + 2] - positions[3 * d + 2]);
        const bc = Math.abs(positions[3 * b + 2] - positions[3 * c + 2]);
 
        if (ad < bc) {
        // if (true) {
          indices[idx++] = a; indices[idx++] = d; indices[idx++] = b;
          indices[idx++] = a; indices[idx++] = c; indices[idx++] = d;
        } else {
          indices[idx++] = a; indices[idx++] = c; indices[idx++] = b;
          indices[idx++] = b; indices[idx++] = c; indices[idx++] = d;
        }
      }
    }
    
    this.positionAttribute.needsUpdate = true;
    this.uvAttribute.needsUpdate = true;
    this.indexAttribute.needsUpdate = true;
 
    this.geometry.computeVertexNormals();
    this.geometry.computeBoundingSphere();
    this.geometry.computeBoundingBox();
 
    this.x = x0;
    this.y = y0;

    if (this.normals) this.computeFaceCentersAndNormals();
  }

  computeFaceCentersAndNormals() {
    const tri = new THREE.Triangle();
    const indices = new THREE.Vector3();

    for(let faceIndex = 0; faceIndex < this.centers.length; faceIndex++){
      indices.fromArray(this.geometry.index.array, 3 * faceIndex);
      tri.setFromAttributeAndIndices(this.geometry.attributes.position,
        indices.x,
        indices.y,
        indices.z
      );
      this.centers[faceIndex].copy(tri.a).add(tri.b).add(tri.c).divideScalar(3);
      tri.getNormal(this.normals[faceIndex]);
    }
  }
}