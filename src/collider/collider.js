import * as THREE from 'three/webgpu';
import { terrainMaterial } from '@/scene/materials';
import { playTreeSound } from '@/sound/treeSound';
import { playGroundSound } from '@/sound/groundSound';
import { playRoofSound } from '@/sound/roofSound';
import { playWaterSound } from '@/sound/waterSound';
import { Dust } from './dust';
import { Collidable } from './collidable';


export class Collider {
  constructor() {
    this.dust = new Dust();
    this.collidable = new Collidable();
    this.raycaster = new THREE.Raycaster();
    this.supported = false;
  }

  toScene(scene) {
    scene.add(this.dust.mesh);
  }

  update(dt, worldManager, glider, water) {
    this.supported = false;
    
    const directions = [
      { dir: glider.left(), dst: 7.5 },
      { dir: glider.right(), dst: 7.5 },
      { dir: glider.forward(), dst: 2.2 },
      { dir: glider.down(), dst: .3 },
    ];
    
    this.raycaster.near = .1;

    const intersect = (object, onHit) => {
      const intersections = this.raycaster.intersectObject(object, true);
      if (!intersections.length) return;
      onHit(intersections[0]);
    }

    const addDust = (intersection, color) => this.dust.add(intersection.point.clone(), color, glider);

    this.collidable.update(glider.mesh.position.x, glider.mesh.position.y, worldManager);

    for (const {dir, dst} of directions) {
      this.raycaster.set(glider.mesh.position, dir);
      this.raycaster.far = dst;
      
      intersect(water, intersection => {
        addDust(intersection, 0x0000ff);
        playWaterSound(glider.speed);
      });

      intersect(this.collidable.mesh, intersection => {
        addDust(intersection, terrainMaterial.getPixelColor(intersection.point.x, intersection.point.y));
        const normal = intersection.normal;
        const depth = dst - intersection.distance;
        glider.mesh.position.add(normal.clone().multiplyScalar(depth));
        glider.speed *= 1 - (depth / 10);
        playGroundSound(glider.speed);
        this.supported = true;
      });

      intersect(this.collidable.houses, intersection => {
        addDust(intersection, 0xc00000);
        playRoofSound(glider.speed);
      });

      intersect(this.collidable.trees, intersection => {
        addDust(intersection, 0x7aa21d);
        playTreeSound(glider.speed);
      });
    }

    this.dust.update(dt, glider.paused);
  }
}