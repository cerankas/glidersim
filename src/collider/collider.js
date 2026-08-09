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

    const tileDistanceThreshold = worldManager.tileSize / 2;
    
    const intersect = (object, onHit) => {
      const intersections = this.raycaster.intersectObject(object, true);
      if (!intersections.length) return;
      onHit(intersections[0]);
    }

    const addDust = (intersection, color) => this.dust.add(intersection.point.clone(), color, glider);

    for (const {dir, dst} of directions) {
      this.raycaster.set(glider.mesh.position, dir);
      this.raycaster.far = dst;
      
      intersect(water, intersection => {
        addDust(intersection, 0x0000ff);
        playWaterSound(glider.speed);
      });

      for (const tile of worldManager.tiles) {
        if (Math.abs(glider.mesh.position.x - tile.x) > tileDistanceThreshold || Math.abs(glider.mesh.position.y - tile.y) > tileDistanceThreshold) continue;

        intersect(tile.mesh, intersection => {
          addDust(intersection, terrainMaterial.getPixelColor(intersection.point.x, intersection.point.y));
          const normal = intersection.normal;
          const depth = dst - intersection.distance;
          glider.mesh.position.add(normal.clone().multiplyScalar(depth));
          glider.speed *= 1 - (depth / 10);
          playGroundSound(glider.speed);
          this.supported = true;
        });

        intersect(tile.houses, intersection => {
          addDust(intersection, 0xc00000);
          playRoofSound(glider.speed);
        });

        intersect(tile.trees, intersection => {
          addDust(intersection, 0x7aa21d);
          playTreeSound(glider.speed);
        });
      }
    }

    this.dust.update(dt, glider.paused);
  }
}