import THREE from '@/three/three.js';
import { generateTerrain, getFaceCentersAndNormals } from "@/map/terrain.js";
import { terrainMaterial } from '@/scene/materials.js';
import { generateTrees } from '@/objects/trees.js'
import { generateHouses } from "@/objects/buildings.js";

export class Cell {
  constructor(x, y, size, scene) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.scene = scene;

    this.geometry = generateTerrain(x, y, size);
    
    this.mesh = new THREE.Mesh(this.geometry, terrainMaterial);
    this.mesh.receiveShadow = true;
    // this.mesh.castShadow = true;
    
    [this.centers, this.normals] = getFaceCentersAndNormals(this.mesh.geometry);
    this.trees = generateTrees(this.mesh.geometry, this.normals);
    this.houses = generateHouses(this.mesh.geometry, this.normals);
    this.scene.add(this.mesh);
    this.scene.add(this.trees);
    this.scene.add(this.houses);
    
    this.populated = true;
  }
  
  // distance(x,y) { return Math.max(Math.abs(this.x - x), Math.abs(this.y - y)); }
  
  dispose() {
    this.mesh.geometry.dispose();
    this.scene.remove(this.mesh);
    this.scene.remove(this.trees);
    this.scene.remove(this.houses);
    this.populated = false;
  }
}