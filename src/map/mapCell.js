import THREE from '@/three/three.js';
import { generateTerrain } from '@/map/terrain.js';
import { mapMaterial} from '@/scene/materials.js';

export class MapCell {
  constructor(x, y, size, scene) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.scene = scene;

    this.geometry = generateTerrain(x, y, size, size / 50);
    this.mesh = new THREE.Mesh(this.geometry, mapMaterial);    
    this.scene.add(this.mesh);
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.scene.remove(this.mesh);
  }
}