import * as THREE from 'three/webgpu';
import { dustBallMaterial } from '@/scene/materials';


export class Dust {
  constructor() {
    this.maxCount = 100;
    this.geometry = new THREE.SphereGeometry(1, 8, 4);
    this.mesh = new THREE.InstancedMesh(this.geometry, dustBallMaterial, this.maxCount);
    this.mesh.setColorAt(0, new THREE.Color());
    this.mesh.instanceColor.needsUpdate = true;
    this.mesh.count = 0;
    this.balls = [];
  }

  add(position, color, glider) {
    const rnd = () => Math.random() * 15;
    this.balls.push({
      position, 
      scale: 2, 
      speed: glider.forward().multiplyScalar(glider.speed).add(new THREE.Vector3(rnd(), rnd(), rnd() + 5)),
      color,
    });
  }

  update(dt, paused) {
    const m = new THREE.Matrix4;
    const cnt = Math.min(this.balls.length, this.maxCount);
    this.mesh.count = cnt;
    for (let i = 0; i < cnt; i++) {
      const ball = this.balls[i];
      if (!paused) {
        ball.scale -= dt*4;
        ball.speed.multiplyScalar(.98);
        ball.position.add(ball.speed.clone().multiplyScalar(dt));
      }
      m.makeScale(ball.scale, ball.scale, ball.scale);
      m.setPosition(ball.position);
      this.mesh.setMatrixAt(i, m);
      this.mesh.setColorAt(i, new THREE.Color().setHex(ball.color));
    }
    if (cnt) {
      this.mesh.instanceMatrix.needsUpdate = true;
      this.mesh.instanceColor.needsUpdate = true;
    }
    this.mesh.computeBoundingBox();
    this.mesh.computeBoundingSphere();
    
    this.balls = this.balls.filter((ball, i) => i > this.balls.length - this.maxCount && ball.scale > .1);
  }
  
}