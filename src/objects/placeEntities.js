import * as THREE from 'three/webgpu';
import { seededRandom } from '@/utils/random';


const vertical = new THREE.Vector3(0,0,1);


export function placeEntities(mesh, r, type, bucketManager, terrain, maxCount) {
  const size = bucketManager.tileSize;
  const x0 = bucketManager.x - size / 2;
  const y0 = bucketManager.y - size / 2;
  const hash = x0 + (1<<16) * size * y0 + r;
  const rnd = seededRandom(hash);

  const matrix = new THREE.Matrix4;

  let i = 0;
  while (maxCount--) {
    const x = x0 + rnd() * size;
    const y = y0 + rnd() * size;
    const z = terrain.getHeight(x, y);

    if (z < 0) continue;

    const normal = terrain.getNormal(x, y);
    if (normal == null) continue;

    const angle = normal.angleTo(vertical) * 180 / Math.PI;
    if (angle > rnd() * 30) continue;

    if (!bucketManager.add({x, y, z, r, type})) continue;

    matrix.makeRotationZ(rnd() * 2 * Math.PI);
    matrix.setPosition(x, y, z);
    mesh.setMatrixAt(i++, matrix);
  }
  mesh.count = i;
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingBox();
  mesh.computeBoundingSphere();
}