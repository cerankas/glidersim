import THREE from '@/three/three';
import { treeCrownMaterial, treeTrunkMaterial } from '@/scene/materials';
import { seededRandom } from '@/utils/random';
import { params as terrainParams } from '@/map/terrain';

let random = seededRandom(12345678);

function createTreePart(part, z) {
  part.rotateX(Math.PI/2);
  part.translate(0, 0, z);
  return part;
}

const trunk = createTreePart(new THREE.CylinderGeometry(.5, .5, 4, 8), 1);
const maple = createTreePart(new THREE.SphereGeometry(4, 8, 4), 6);
const pine = createTreePart(new THREE.ConeGeometry(3, 8, 8), 6);

export function generateTrees(geometry, normals) {
  const density = (terrainParams.segmentSize / 50) ** 2;

  let totalTreeCount = 0;
  const treeCountsOnTriangles = [];
  const vertical = new THREE.Vector3(0,0,1);

  for (let i = 0; i < normals.length; i++) {
    const normal = normals[i];
    const angle = normal.angleTo(vertical) * 180 / Math.PI;
    if (angle < 30) {
      const cnt = density * .5 * random() * (30 - angle) | 0;
      if (cnt == 0) continue;
      totalTreeCount += cnt;
      treeCountsOnTriangles.push([i, cnt]);      
    }
  }

  const trunkMesh = new THREE.InstancedMesh(trunk, treeTrunkMaterial, totalTreeCount);
  const crownMesh = new THREE.InstancedMesh(maple, treeCrownMaterial, totalTreeCount);
  crownMesh.receiveShadow = true;
  crownMesh.castShadow = true;

  let a = new THREE.Vector3();
  let b = new THREE.Vector3();
  let c = new THREE.Vector3();

  const matrix = new THREE.Matrix4;
  let treeNumber = 0;

  for (let [i,cnt] of treeCountsOnTriangles) {
    a.fromBufferAttribute(geometry.attributes.position, geometry.index.getX(3*i + 0));
    b.fromBufferAttribute(geometry.attributes.position, geometry.index.getX(3*i + 1));
    c.fromBufferAttribute(geometry.attributes.position, geometry.index.getX(3*i + 2));
    // if (a.z < 0 || b.z < 0 || c.z < 0) {
    //   treeNumber -= cnt;
    //   continue;
    // }
    for (let j = 0; j < cnt; j++) {
      const wa = random();
      const wb = random() * (1 - wa);
      const wc = 1 - wa - wb;
      matrix.makeScale(1, 1, 1);
      matrix.setPosition(a.clone().multiplyScalar(wa).add(b.clone().multiplyScalar(wb)).add(c.clone().multiplyScalar(wc)));
      trunkMesh.setMatrixAt(treeNumber, matrix); 
      crownMesh.setMatrixAt(treeNumber, matrix);
      treeNumber++;
    }
  }

  const group =  new THREE.Group();
  group.add(trunkMesh);
  group.add(crownMesh);
  // trunkMesh.count = totalTreeCount
  // crownMesh.count = totalTreeCount
  return group;
}