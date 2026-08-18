import * as THREE from 'three/webgpu';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { timeIt } from '@/utils/timeIt';


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


export function terrainHeight(x, y) { // ~100 ns per call
  x -= 6000;
  y -= 3500;
  const fine   = 1 + perlin.noise(x * freq1, y * freq1, 2.7);
  const coarse = 1 + perlin.noise(x * freq2, y * freq2, 2.7);
  const mega   =     perlin.noise(x * freq3, y * freq3, 2.7);
  return coarse * fine * scale1 + coarse * scale2 + mega * scale3 - waterLevel;
}


export class TerrainTile {
  constructor(tileSize, quadSize) {
    this.tileSize = tileSize;
    this.quadSize = quadSize
    this.quadsPerSide = (tileSize / quadSize) | 0;

    const { quadsPerSide } = this;
    const verticesPerSide = quadsPerSide + 1;

    const vertexCount = verticesPerSide * verticesPerSide;
    const indexCount = quadsPerSide * quadsPerSide * 6;

    const positions = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const indices = new Uint16Array(indexCount);

    let vi = 0;
    for (let j = 0; j <= quadsPerSide; j++) {
      const y = j * quadSize - tileSize * .5;

      for (let i = 0; i <= quadsPerSide; i++) {
        const x = i * quadSize - tileSize * .5;

        uvs[vi++] = x / 1000;
        uvs[vi++] = y / 1000;
      }
    }

    let idx = 0;
    for (let j = 0; j < quadsPerSide; j++) {
      for (let i = 0; i < quadsPerSide; i++) {
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

  update(x0, y0) { // ~16 ms per call @ tileSize = 3000, quadSize = 12
    const { tileSize, quadSize, quadsPerSide } = this;

    const positions = this.geometry.attributes.position.array;

    let vi = 0;
    for (let j = 0; j <= quadsPerSide; j++) {
      const y = y0 + j * quadSize - tileSize * .5;
      
      for (let i = 0; i <= quadsPerSide; i++) {
        const x = x0 + i * quadSize - tileSize * .5;
        
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

  getHeight(x, y) { // ~20 ns per call
    const i = (x - this.x + this.tileSize * .5) / this.quadSize;
    const j = (y - this.y + this.tileSize * .5) / this.quadSize;

    const i0 = Math.floor(i);
    const j0 = Math.floor(j);

    const wi = i - i0;
    const wj = j - j0;

    if (i0 < 0 || j0 < 0 || i0 >= this.quadsPerSide || j0 >= this.quadsPerSide) return null;

    const verticesPerSide = this.quadsPerSide + 1;
    
    const ia = i0 + verticesPerSide * j0;
    const ib = ia + 1;
    const ic = ia + verticesPerSide + 1;
    const id = ia + verticesPerSide;

    const positions = this.geometry.attributes.position.array;

    const wa = (1 - wi) * (1 - wj);
    const wb = wi       * (1 - wj);
    const wc = wi       * wj;
    const wd = (1 - wi) * wj;

    return positions[3 * ia + 2] * wa +
      positions[3 * ib + 2] * wb +
      positions[3 * ic + 2] * wc +
      positions[3 * id + 2] * wd
    ;
  }

  getNormal(x, y) { // ~50 ns per call
    const i = (x - this.x + this.tileSize * .5) / this.quadSize;
    const j = (y - this.y + this.tileSize * .5) / this.quadSize;

    const i0 = Math.floor(i);
    const j0 = Math.floor(j);

    const wi = i - i0;
    const wj = j - j0;

    if (i0 < 0 || j0 < 0 || i0 >= this.quadsPerSide || j0 >= this.quadsPerSide) return null;

    const verticesPerSide = this.quadsPerSide + 1;
    
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


function testTiming() {
  const tile = new TerrainTile(3000, 12);
  tile.update(0, 0);
  
  const n = 1_000_000;
  timeIt(() => Math.random() * 1500 + Math.random() * 1500, n, 'rnd');
  timeIt(() => tile.getHeight(Math.random() * 1500, Math.random() * 1500), n, 'height');
  timeIt(() => tile.getNormal(Math.random() * 1500, Math.random() * 1500), n, 'normal');
  timeIt(() => terrainHeight(Math.random() * 1500, Math.random() * 1500), n, 'terrainHeight');
}

// testTiming();