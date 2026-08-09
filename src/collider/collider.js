import * as THREE from 'three/webgpu';
import { terrainMaterial } from '@/scene/materials';
import { playTreeSound } from '@/sound/treeSound';
import { playGroundSound } from '@/sound/groundSound';
import { playRoofSound } from '@/sound/roofSound';
import { playWaterSound } from '@/sound/waterSound';
import { Dust } from './dust';


export class Collider {
  constructor() {
    this.dust = new Dust();
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
    this.raycaster.far = 7.5;

    const tileDistanceThreshold = worldManager.tileSize / 2;
    
    const objects = ['mesh', 'houses', 'trees'];
    
    for (const {dir, dst} of directions) {
      this.raycaster.set(glider.mesh.position, dir);
      this.raycaster.far = dst;
      
      const i = this.raycaster.intersectObject(water, true);
      if (i.length) {
        this.dust.add(i[0].point.clone(), 0x0000ff, glider);
        if (!glider.paused) playWaterSound(glider.speed);
        glider.mesh.position.z = Math.max(glider.mesh.position.z, 0);
        this.supported = true;
      }

      for (const tile of worldManager.tiles) {
      if (Math.abs(glider.mesh.position.x - tile.x) > tileDistanceThreshold || Math.abs(glider.mesh.position.y - tile.y) > tileDistanceThreshold) continue;
        for (const object of objects) {
          const i = this.raycaster.intersectObject(tile[object], true);
          if (i.length) {
            this.dust.add(i[0].point.clone(), object == 'mesh' ? terrainMaterial.getPixelColor(i[0].point.x, i[0].point.y) : (object == 'trees' ? 0x7aa21d : 0xc00000), glider);
            
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

    this.dust.update(dt, glider.paused);
  }
}