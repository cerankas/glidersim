import * as THREE from 'three/webgpu';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { vertexColorMaterial } from '@/scene/materials';
import { addVertexColors } from '@/utils/threeUtils';


export const tree = createTree();

function createTree() {
  const trunkGeometry = createTreePart(new THREE.CylinderGeometry(.5, .5, 4, 8), 1, new THREE.Color(0x4d2926));
  const crownGeometry = createTreePart(new THREE.SphereGeometry(4, 8, 4), 6, new THREE.Color(0x7aa21d)); // maple
  // const crownGeometry = createTreePart(new THREE.ConeGeometry(3, 8, 8), 6, new THREE.Color(0x7aa21d)); // pine
  
  const geometry = mergeGeometries([trunkGeometry, crownGeometry]);
  geometry.computeBoundingSphere();

  return {
    geometry,
    material: vertexColorMaterial,
    radius: 4, 
  };
}

function createTreePart(part, z, color) {
  part.rotateX(Math.PI/2);
  part.translate(0, 0, z);
  part.toNonIndexed();
  addVertexColors(part, color);
  return part;
}