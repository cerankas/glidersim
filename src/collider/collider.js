import * as THREE from 'three/webgpu';
import { dustBallMaterial, terrainMaterial } from '@/scene/materials';
import { playTreeSound } from '@/sound/treeSound';
import { playGroundSound } from '@/sound/groundSound';
import { playRoofSound } from '@/sound/roofSound';
import { playWaterSound } from '@/sound/waterSound';


export class Collider {
  constructor() {
    this.maxCount = 100;
    this.raycaster = new THREE.Raycaster();
    this.ballGeometry = new THREE.SphereGeometry(1, 8, 4);
    this.ballMesh = new THREE.InstancedMesh(this.ballGeometry, dustBallMaterial, this.maxCount);
    this.ballMesh.setColorAt(0, new THREE.Color());
    this.ballMesh.instanceColor.needsUpdate = true;
    this.ballMesh.count = 0;
    this.balls = [];
    this.supported = false;
  }

  toScene(scene) {
    scene.add(this.ballMesh);
  }

  addBall(position, color, glider) {
    const rnd = () => Math.random() * 15;
    this.balls.push({
      position, 
      scale: 2, 
      speed: glider.forward().multiplyScalar(glider.speed).add(new THREE.Vector3(rnd(), rnd(), rnd() + 5)),
      color,
    });
  }

  update(dt, cellManager, glider, water) {
    this.supported = false;
    
    const directions = [
      { dir: glider.left(), dst: 7.5 },
      { dir: glider.right(), dst: 7.5 },
      { dir: glider.forward(), dst: 2.2 },
      { dir: glider.down(), dst: .3 },
    ];
    
    this.raycaster.near = .1;
    this.raycaster.far = 7.5;

    const cellDistanceThreshold = cellManager.cellSize / 2;
    
    // const objects = ['mesh', 'houses', 'trees'];
    const objects = ['mesh'];
    
    for (const {dir, dst} of directions) {
      this.raycaster.set(glider.mesh.position, dir);
      this.raycaster.far = dst;
      
      const i = this.raycaster.intersectObject(water, true);
      if (i.length) {
        this.addBall(i[0].point.clone(), 0x0000ff, glider);
        if (!glider.paused) playWaterSound(glider.speed);
        glider.mesh.position.z = Math.max(glider.mesh.position.z, 0);
        this.supported = true;
      }

      for (const xy in cellManager.cells) {
      const c = cellManager.cells[xy];
      if (Math.abs(glider.mesh.position.x - c.x) > cellDistanceThreshold || Math.abs(glider.mesh.position.y - c.y) > cellDistanceThreshold) continue;
        for (const object of objects) {
          const i = this.raycaster.intersectObject(c[object], true);
          if (i.length) {
            this.addBall(i[0].point.clone(), object == 'mesh' ? terrainMaterial.getPixelColor(i[0].point.x, i[0].point.y) : (object == 'trees' ? 0x7aa21d : 0xc00000), glider);
            
            if (object == 'mesh') {
              const normal = i[0].normal;
              const depth = dst - i[0].distance;
              glider.mesh.position.add(normal.clone().multiplyScalar(depth));
              glider.speed *= 1 - (depth / 10);
              playGroundSound(glider.speed);
              this.supported = true;
            }

            if (object == 'trees') {
              playTreeSound(glider.speed);
            }

            if (object == 'houses') {
              playRoofSound(glider.speed);
            }
          }
        }
      }
    }

    const m = new THREE.Matrix4;
    const cnt = Math.min(this.balls.length, this.maxCount);
    this.ballMesh.count = cnt;
    for (let i = 0; i < cnt; i++) {
      const ball = this.balls[i];
      if (!glider.paused) {
        ball.scale -= dt*4;
        ball.speed.multiplyScalar(.98);
        ball.position.add(ball.speed.clone().multiplyScalar(dt));
      }
      m.makeScale(ball.scale, ball.scale, ball.scale);
      m.setPosition(ball.position);
      this.ballMesh.setMatrixAt(i, m);
      this.ballMesh.setColorAt(i, new THREE.Color().setHex(ball.color));
    }
    if (cnt) {
      this.ballMesh.instanceMatrix.needsUpdate = true;
      this.ballMesh.instanceColor.needsUpdate = true;
    }
    this.ballMesh.computeBoundingBox();
    this.ballMesh.computeBoundingSphere();
    
    this.balls = this.balls.filter((ball, i) => i > this.balls.length - this.maxCount && ball.scale > .1);
  }
}