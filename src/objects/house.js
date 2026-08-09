import * as THREE from 'three/webgpu';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { vertexColorMaterial } from '@/scene/materials';
import { addVertexColors } from '@/utils/threeUtils';


export const house = createHouse();

function createHouse() {
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
  
  const geometry = mergeGeometries([wallGeometry, roofGeometry]);

  geometry.scale(7, 5, 5);

  return {
    geometry,
    material: vertexColorMaterial,
    radius: 7,
  };
}