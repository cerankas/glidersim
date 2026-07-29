import * as THREE from 'three/webgpu';
import { TerrainCell } from "@/map/terrain";
import { terrainMaterial } from '@/scene/materials';
import { generateTrees } from '@/objects/trees'
import { generateHouses } from "@/objects/buildings";

export class Cell {
  constructor(x, y, size, scene) {
    this.x = x;
    this.y = y;
    this.size = size;

    this.terrain = new TerrainCell(size, 12);
    this.terrain.update(x, y);
    
    this.mesh = new THREE.Mesh(this.terrain.geometry, terrainMaterial);
    this.mesh.receiveShadow = true;
    // this.mesh.castShadow = true;
    
    const avoid = [];
    this.trees = { count: 0} // tmp
    this.houses = { count: 0} // tmp
    // this.houses = generateHouses(this.mesh.geometry, this.normals, avoid);
    // this.trees = generateTrees(this.mesh.geometry, this.normals, avoid);
    if (scene) {
      scene.add(this.mesh);
      // scene.add(this.trees);
      // scene.add(this.houses);
    }
  }

  distance(x, y) {
    const dx = Math.max(0, Math.abs(x - this.x) - this.size / 2);
    const dy = Math.max(0, Math.abs(y - this.y) - this.size / 2);
    return Math.hypot(dx, dy);
  }

  update(x, y) {
    this.x = x;
    this.y = y;
    this.terrain.update(x, y);
  }
}