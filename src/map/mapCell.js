import * as THREE from 'three';
import { generateTerrain } from '@/map/terrain';
import { mapMaterial} from '@/scene/materials';

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