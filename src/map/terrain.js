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

const _vtmp = new THREE.Vector3();
const _vresult = new THREE.Vector3();


export function terrainHeight(x, y) { // ~120 ns per call
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

    let vi = 0;
    for (let j = 0; j <= segmentsPerSide; j++) {
      const y = j * segmentSize - cellSize * .5;

      for (let i = 0; i <= segmentsPerSide; i++) {
        const x = i * segmentSize - cellSize * .5;

        uvs[vi++] = x / 1000;
        uvs[vi++] = y / 1000;
      }
    }

    let idx = 0;
    for (let j = 0; j < segmentsPerSide; j++) {
      for (let i = 0; i < segmentsPerSide; i++) {
        const a = i + verticesPerSide * j;
        const b = a + 1;
        const c = a + verticesPerSide + 1;
        const d = a + verticesPerSide;
    
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

  update(x0, y0) { // ~16 ms per call @ cellSize = 3000, segmentSize = 12
    const { cellSize, segmentSize, segmentsPerSide } = this;

    const positions = this.geometry.attributes.position.array;

    let vi = 0;
    for (let j = 0; j <= segmentsPerSide; j++) {
      const y = y0 + j * segmentSize - cellSize * .5;
      
      for (let i = 0; i <= segmentsPerSide; i++) {
        const x = x0 + i * segmentSize - cellSize * .5;
        
        positions[vi++] = x;
        positions[vi++] = y;
        positions[vi++] = terrainHeight(x, y);
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
 
    this.geometry.computeVertexNormals();
    this.geometry.computeBoundingSphere();
    this.geometry.computeBoundingBox();
 
    this.x = x0;
    this.y = y0;
  }

  getNormal(x, y) { // ~60 ns per call
    const i = (x - this.x + this.cellSize * .5) / this.segmentSize;
    const j = (y - this.y + this.cellSize * .5) / this.segmentSize;

    const i0 = Math.floor(i);
    const j0 = Math.floor(j);

    const wi = i - i0;
    const wj = j - j0;

    if (i0 < 0 || j0 < 0 || i0 >= this.segmentsPerSide || j0 >= this.segmentsPerSide) return none;

    const verticesPerSide = this.segmentsPerSide + 1;
    
    const ia = i0 + verticesPerSide * j0;
    const ib = ia + 1;
    const ic = ia + verticesPerSide + 1;
    const id = ia + verticesPerSide;

    const normals = this.geometry.attributes.normal.array;

    const wa = (1 - wi) * (1 - wj);
    const wb = wi       * (1 - wj);
    const wc = wi       * wj;
    const wd = (1 - wi) * wj;

    return _vresult.set(0,0,0)
    .addScaledVector(_vtmp.fromArray(normals, 3 * ia), wa)
    .addScaledVector(_vtmp.fromArray(normals, 3 * ib), wb)
    .addScaledVector(_vtmp.fromArray(normals, 3 * ic), wc)
    .addScaledVector(_vtmp.fromArray(normals, 3 * id), wd)
    .normalize();
  }
}