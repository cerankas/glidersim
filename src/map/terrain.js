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
  constructor(cellSize, segmentSize) {
    this.cellSize = cellSize;
    this.segmentSize = segmentSize;
    this.segmentsPerSide = (cellSize / segmentSize) | 0;

    const { segmentsPerSide } = this;
    const verticesPerSide = segmentsPerSide + 1;

    const vertexCount = verticesPerSide * verticesPerSide;
    const indexCount = segmentsPerSide * segmentsPerSide * 6;

    const positions = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const indices = new Uint16Array(indexCount);

    for (let j = 0; j <= segmentsPerSide; j++) {
      for (let i = 0; i <= segmentsPerSide; i++) {
        const vi = i * verticesPerSide + j;
        const x = i * segmentSize - cellSize * .5;
        const y = j * segmentSize - cellSize * .5;

        uvs[vi * 2] = x / 1000;
        uvs[vi * 2 + 1] = y / 1000;
      }
    }

    let idx = 0;
    for (let j = 0; j < segmentsPerSide; j++) {
      for (let i = 0; i < segmentsPerSide; i++) {
        const a = i * verticesPerSide + j;
        const b = a + verticesPerSide;
        const c = a + verticesPerSide + 1;
        const d = a + 1;
    
        indices[idx++] = a;
        indices[idx++] = b;
        indices[idx++] = d;

        indices[idx++] = b;
        indices[idx++] = c;
        indices[idx++] = d;
      }
    }
    
    const positionAttribute = new THREE.BufferAttribute(positions, 3);
    const uvAttribute = new THREE.BufferAttribute(uvs, 2);
    const indexAttribute = new THREE.BufferAttribute(indices, 1);
 
    positionAttribute.setUsage(THREE.DynamicDrawUsage);
 
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', positionAttribute);
    this.geometry.setAttribute('uv', uvAttribute);
    this.geometry.setIndex(indexAttribute);
  }

  update(x0, y0) {
    const { cellSize, segmentSize, segmentsPerSide } = this;

    const positions = this.geometry.attributes.position.array;

    for (let j = 0; j <= segmentsPerSide; j++) {
      for (let i = 0; i <= segmentsPerSide; i++) {
        const vi = 3 * (i * (segmentsPerSide + 1) + j);
        const x = x0 + i * segmentSize - cellSize * .5;
        const y = y0 + j * segmentSize - cellSize * .5;
        
        positions[vi] = x;
        positions[vi + 1] = y;
        positions[vi + 2] = terrainHeight(x, y);
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
 
    this.geometry.computeVertexNormals();
    this.geometry.computeBoundingSphere();
    this.geometry.computeBoundingBox();
 
    this.x = x0;
    this.y = y0;
  }
}