import * as THREE from 'three/webgpu';
import { TerrainTile } from "@/map/terrain";
import { terrainMaterial } from '@/scene/materials';
import { house } from '@/objects/house';
import { tree } from '@/objects/tree';
import { placeEntities } from '@/objects/placeEntities';
import { BucketManager } from '@/objects/bucketManager';
import { config } from '@/config';


export class WorldTile {
  constructor(x, y, tileSize, bucketSize, quadSize, scene) {
    this.tileSize = tileSize;
    this.bucketSize = bucketSize;
    this.quadSize = quadSize;

    this.terrain = new TerrainTile(tileSize, quadSize);
    
    this.mesh = new THREE.Mesh(this.terrain.geometry, terrainMaterial);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;

    const areaSqKm = (tileSize / 1000) ** 2;

    this.maxHouses = config.houseDensity * areaSqKm;
    this.maxTrees = config.treeDensity * areaSqKm;
    
    this.houses = new THREE.InstancedMesh(house.geometry, house.material, this.maxHouses);
    this.trees = new THREE.InstancedMesh(tree.geometry, tree.material, this.maxTrees);
    
    this.houses.receiveShadow = true;
    this.trees.receiveShadow = true;

    this.houses.castShadow = true;
    this.trees.castShadow = true;

    this.bucketManager = new BucketManager(x, y, tileSize, bucketSize, Math.max(house.radius, tree.radius));

    this.update(x, y);
    
    if (scene) {
      scene.add(this.mesh);
      scene.add(this.houses);
      scene.add(this.trees);
    }
  }

  distance(x, y) {
    const dx = Math.max(0, Math.abs(x - this.x) - this.tileSize / 2);
    const dy = Math.max(0, Math.abs(y - this.y) - this.tileSize / 2);
    return Math.hypot(dx, dy);
  }

  update(x, y) {
    this.x = x;
    this.y = y;
    this.bucketManager.reset(x, y);
    this.terrain.update(x, y);
    placeEntities(this.houses, house.radius, 'house', this.bucketManager, this.terrain, this.maxHouses);
    placeEntities(this.trees, tree.radius, 'tree', this.bucketManager, this.terrain, this.maxTrees);
  }
}