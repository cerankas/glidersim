import * as THREE from 'three';
import { seededRandom } from '@/utils/random';
import { cloudMaterial } from '@/scene/materials';
import { fog } from '@/scene/fog';

let random = seededRandom(12345678);

const params = {
  height: 1500,
};

function makeCloud(ball, position, scale, count, min, max) {
  const mesh = new THREE.InstancedMesh(ball, cloudMaterial, count);
  mesh.position.copy(position);
  const m = new THREE.Matrix4();
  const m2 = new THREE.Matrix4();
  const p = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const s = min + random() * (max - min);
    m.makeScale(s, s, s);
    // m2.makeRotationFromEuler(new THREE.Euler(random(), random(), random()));
    // m.multiply(m2);
    p.x = random() * scale.x - random() * scale.x;
    p.y = random() * scale.y - random() * scale.y;
    p.z = random() * scale.z - random() * scale.z;
    m.setPosition(p);
    mesh.setMatrixAt(i, m);
  }
  mesh.castShadow = true;
  return mesh;
}

class Clouds {
  constructor() {
    this.group = new THREE.Group();
    return;
    const ball = new THREE.SphereGeometry(1, 16, 8);
    const range = 2 * fog.far;
    const position = new THREE.Vector3(0,0,1500);
    const scale = new THREE.Vector3(800, 800, 100);
    for (let i = 0; i < 20; i++) {
      position.x = random() * 2 * range - range;
      position.y = random() * 2 * range - range;
      this.group.add(makeCloud(ball, position, scale, 20, 250, 300));
    }
  }

  toScene(scene) {
    scene.add(this.group);
  }

  update(position, wind) {
    const range = 2 * fog.far;
    for (const cloud of this.group.children) {
      cloud.position.x -= wind.x;
      cloud.position.y -= wind.y;
      if (cloud.position.x < position.x - range) cloud.position.x += 2 * range;
      if (cloud.position.x > position.x + range) cloud.position.x -= 2 * range;
      if (cloud.position.y < position.y - range) cloud.position.y += 2 * range;
      if (cloud.position.y > position.y + range) cloud.position.y -= 2 * range;
      cloud.instanceMatrix.needsUpdate = true;
      cloud.computeBoundingBox();
      cloud.computeBoundingSphere();
    }
  }
}

export const clouds = new Clouds();