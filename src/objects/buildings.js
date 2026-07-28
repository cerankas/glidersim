import * as THREE from 'three/webgpu';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { vertexColorMaterial } from '@/scene/materials';
import { seededRandom } from '@/utils/random';

let random = seededRandom(12345678);

let houseRadius = 7;

function addVertexColors(geometry, color) {
  const count = geometry.attributes.position.count;
  const array = new Float32Array(3 * count);
  for (let i = 0; i < 3 * count; i += 3) {
    array[i+0] = color.r;
    array[i+1] = color.g;
    array[i+2] = color.b;
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(array, 3));
}

const roofVertices = [
  -1,-1,0,    1,-1,0,
  -1, 1,0,    1, 1,0,
  -1,0, 1,    1,0, 1,
];

const roofFaces = [
  0,1,4,
  1,5,4,
  2,4,3,
  3,4,5,
  0,4,2,
  1,3,5,
  0,2,1,
  1,2,3,
];

const wallGeometry = new THREE.BoxGeometry(1,1,1).toNonIndexed();
const roofGeometry = new THREE.PolyhedronGeometry(roofVertices, roofFaces, .8).translate(0,0,.5);

addVertexColors(wallGeometry, new THREE.Color(0xd0c080));
addVertexColors(roofGeometry, new THREE.Color(0xc00000));

const houseGeometry = mergeGeometries([wallGeometry, roofGeometry]);

export function generateHouses(geometry, normals, avoid) {
  const density = 1;

  let totalCount = 0;
  const countsOnTriangles = [];
  const vertical = new THREE.Vector3(0,0,1);

  for (let i = 0; i < normals.length; i++) {
    const normal = normals[i];
    const angle = normal.angleTo(vertical) * 180 / Math.PI;
    if (angle < 30) {
      const cnt = density * .1 * random() * (30 - angle) | 0;
      if (cnt == 0) continue;
      totalCount += cnt;
      countsOnTriangles.push([i, cnt]);      
    }
  }

  const mesh = new THREE.InstancedMesh(houseGeometry, vertexColorMaterial, totalCount);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  
  let a = new THREE.Vector3();
  let b = new THREE.Vector3();
  let c = new THREE.Vector3();

  const matrix = new THREE.Matrix4;
  const mulMatrix = new THREE.Matrix4;
  const housePosition = new THREE.Vector3;
  let houseNumber = 0;

  for (let [i,cnt] of countsOnTriangles) {
    a.fromBufferAttribute(geometry.attributes.position, geometry.index.getX(3*i + 0));
    b.fromBufferAttribute(geometry.attributes.position, geometry.index.getX(3*i + 1));
    c.fromBufferAttribute(geometry.attributes.position, geometry.index.getX(3*i + 2));
    for (let j = 0; j < cnt; j++) {
      const wa = random();
      const wb = random() * (1 - wa);
      const wc = 1 - wa - wb;

      mulMatrix.makeRotationZ(random() * Math.PI);
      matrix.makeScale(7,5,5);
      matrix.setPosition(a.clone().multiplyScalar(wa).add(b.clone().multiplyScalar(wb)).add(c.clone().multiplyScalar(wc)));
      matrix.multiply(mulMatrix);
      
      housePosition.setFromMatrixPosition(matrix);
      
      if (housePosition.z < 0) continue;
      
      let collision = false;
      for (let [position, radius] of avoid) {
        if (Math.hypot(housePosition.x - position.x, housePosition.y - position.y) < houseRadius + radius) {
          collision = true;
          break;
        }
      }
      if (collision) continue;

      avoid.push([housePosition.clone(), houseRadius]); 
      
      mesh.setMatrixAt(houseNumber, matrix);
      houseNumber++;
    }
  }

  mesh.count = houseNumber;
  return mesh;
}