import * as THREE from 'three/webgpu';


export function addVertexColors(geometry, color) {
  const count = geometry.attributes.position.count;
  const array = new Float32Array(3 * count);
  for (let i = 0; i < 3 * count; i += 3) {
    array[i+0] = color.r;
    array[i+1] = color.g;
    array[i+2] = color.b;
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(array, 3));
}