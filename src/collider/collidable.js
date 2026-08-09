import * as THREE from 'three/webgpu';
import { TerrainTile } from '@/map/terrain';
import { tree } from '@/objects/tree';
import { house } from '@/objects/house';
import { config } from "@/config";


const m = new THREE.Matrix4;

// includes 4 terrain buckets nearest to the glider, updated with hysteresis

export class Collidable {
  constructor() {
    this.size = 2 * config.bucketSize;
    const areaSqKm = (this.size / 1000) ** 2;

    const maxHouses = areaSqKm * config.houseDensity;
    const maxTrees = areaSqKm * config.treeDensity;

    this.terrain = new TerrainTile(this.size, config.quadSize);

    this.mesh = new THREE.Mesh(this.terrain.geometry, new THREE.MeshBasicMaterial);
    this.houses = new THREE.InstancedMesh(house.geometry, new THREE.MeshBasicMaterial, maxHouses);
    this.trees = new THREE.InstancedMesh(tree.geometry, new THREE.MeshBasicMaterial, maxTrees);

    this.x = NaN;
    this.y = NaN;
  }

  update(x, y, worldManager) {
    const nx = Math.round(x / config.bucketSize - .5) * config.bucketSize + config.bucketSize / 2;
    const ny = Math.round(y / config.bucketSize - .5) * config.bucketSize + config.bucketSize / 2;
    
    const d = Math.hypot(x - this.x, y - this.y);
    const nd = Math.hypot(x - nx, y - ny);

    if (nd < d * .75 || isNaN(d)) {
      this.x = nx;
      this.y = ny;
      this.populate(worldManager);
    }
  }

  populate(worldManager) {
    this.terrain.update(this.x, this.y);

    let houseCnt = 0;
    let treeCnt = 0;

    for (let dx = 0; dx <= 1; dx++) {
      for (let dy = 0; dy <= 1; dy++) {
        const x = this.x + dx * config.bucketSize - config.bucketSize / 2;
        const y = this.y + dy * config.bucketSize - config.bucketSize / 2;
    
        const tile = worldManager.tile(x, y);
        if (tile == null) {
          console.log('collidable: null tile', x, y);
          continue;
        }
    
        const bucket = tile.bucketManager.bucketAt(x, y);
        if (bucket == null) {
          console.log('collidable: null bucket', x, y);
          continue;
        }

        for (const e of bucket) {
          m.setPosition(e.x, e.y, e.z);
          if (e.type == 'house') this.houses.setMatrixAt(houseCnt++, m);
          if (e.type == 'tree') this.trees.setMatrixAt(treeCnt++, m);
        }
      }
    }

    this.houses.count = houseCnt;
    this.trees.count = treeCnt;

    this.houses.instanceMatrix.needsUpdate = true;
    this.trees.instanceMatrix.needsUpdate = true;

    this.terrain.geometry.computeBoundingBox();
    this.terrain.geometry.computeBoundingSphere();

    this.houses.computeBoundingBox();
    this.houses.computeBoundingSphere();

    this.trees.computeBoundingBox();
    this.trees.computeBoundingSphere();
  }
}