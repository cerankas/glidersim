import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise';
import { guiSettings } from '@/control/gui';
import { cellManager } from '@/map/cellManager';

export const params = {
  segmentSize:50,
  a: .003,
  b: .001,
  c: .0002,
  mul1: 300, //400
  mul2: 500, //250
  mul3: 500,
  waterLevel: 500,
};

const folder = guiSettings.addFolder('Terrain').onChange(() => { cellManager.invalidate(); }).close();
folder.add(params,'segmentSize',10,500).step(1);
folder.add(params,'a',0,.01).name('period a');
folder.add(params,'b',0,.01).name('period b');
folder.add(params,'mul1',0,1000).name('multiplier 1');
folder.add(params,'mul2',0,1000).name('multiplier 2');

const perlin = new ImprovedNoise();

export function terrainHeight(x, y) { // ~200 ns per call
  x -= 6000;
  y -= 3500;
  const a = params.a, b = params.b, c = params.c;
  const fine   = 1 + perlin.noise(x * a, y * a, 2.7);
  const coarse = 1 + perlin.noise(x * b, y * b, 2.7);
  const mega = perlin.noise(x * c, y * c, 2.7);
  return coarse * fine * params.mul1 + coarse * params.mul2 + mega * params.mul3 - params.waterLevel;
}

export function generateTerrain(x0, y0, cellSize, segmentSize) {
  if (segmentSize == undefined) segmentSize = params.segmentSize;

  const segments = (cellSize / segmentSize) | 0;
  
  const geometry = new THREE.BufferGeometry();
  
  const vertices = [];
  const uvs = [];
  
  for (let i = 0; i <= segments; i++) {
    for (let j = 0; j <= segments; j++) {
      const x = x0 + i * segmentSize - cellSize * .5;
      const y = y0 + j * segmentSize - cellSize * .5;
      vertices.push(x, y, terrainHeight(x, y));
      uvs.push(x/1000, y/1000);
    }
  }
  
  const indices = [];
  
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      const a = i * (segments + 1) + j;
      const b = a + 1;
      const c = a + (segments + 1);
      const d = c + 1;
  
      const ad = Math.abs(vertices[3*a+2] - vertices[3*d+2]);
      const bc = Math.abs(vertices[3*b+2] - vertices[3*c+2]);

      if (ad < bc) {
        indices.push(a, d, b);
        indices.push(a, c, d);
      }
      else {
        indices.push(a, c, b);
        indices.push(b, c, d);			
      }
    }
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

export function getFaceCentersAndNormals(geometry) {
  const centers = [];
  const normals = [];

  const tri = new THREE.Triangle();
  const indices = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for(let f=0; f<geometry.index.count; f += 3){
    indices.fromArray(geometry.index.array, f);
    tri.setFromAttributeAndIndices(geometry.attributes.position,
        indices.x,
        indices.y,
        indices.z);
    tri.getNormal(normal);
    centers.push(tri.a.clone().add(tri.b).add(tri.c).divideScalar(3));
    normals.push(normal.clone());
  }
  return [centers, normals];
}