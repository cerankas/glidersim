import * as THREE from 'three';
import { houseWallMaterial, houseRoofMaterial } from '@/scene/materials';
import { seededRandom } from '@/utils/random';
import { params as terrainParams } from '@/map/terrain';

let random = seededRandom(12345678+1);

function createPart(part, z) {
  // part.rotateX(Math.PI/2);
  part.translate(0, 0, z);
  return part;
}

const roofVertices = [
  -1,-1,0,    1,-1,0,    -1, 1,0,    1, 1,0,
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

const walls = createPart(new THREE.BoxGeometry(1,1,1), 0);
const roof = createPart(new THREE.PolyhedronGeometry(roofVertices, roofFaces, .8), .5);

export function generateHouses(geometry, normals) {
  const density = (terrainParams.segmentSize / 50) ** 2;

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

  const wallMesh = new THREE.InstancedMesh(walls, houseWallMaterial, totalCount);
  const roofMesh = new THREE.InstancedMesh(roof, houseRoofMaterial, totalCount);
  wallMesh.receiveShadow = true;
  roofMesh.receiveShadow = true;
  wallMesh.castShadow = true;
  roofMesh.castShadow = true;
  
  let a = new THREE.Vector3();
  let b = new THREE.Vector3();
  let c = new THREE.Vector3();

  const matrix = new THREE.Matrix4;
  const mulMatrix = new THREE.Matrix4;
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
      // matrix.makeRotationZ(random() * Math.PI);
      matrix.makeScale(7,5,5);
      matrix.setPosition(a.clone().multiplyScalar(wa).add(b.clone().multiplyScalar(wb)).add(c.clone().multiplyScalar(wc)));
      matrix.multiply(mulMatrix);
      wallMesh.setMatrixAt(houseNumber, matrix); 
      roofMesh.setMatrixAt(houseNumber, matrix);
      houseNumber++;
    }
  }

  const group =  new THREE.Group();
  group.add(wallMesh);
  group.add(roofMesh);
  return group;
}