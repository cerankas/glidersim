import * as THREE from 'three/webgpu';
import { TerrainCell } from '@/map/terrain';
import { mapMaterial} from '@/scene/materials';

export class MapCell {
  constructor(x, y, size, scene) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.scene = scene;

    this.terrain = new TerrainCell(size, size / 200);
    this.terrain.update(x, y);
    this.mesh = new THREE.Mesh(this.terrain.geometry, mapMaterial);    
    this.scene.add(this.mesh);
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.scene.remove(this.mesh);
  }
}