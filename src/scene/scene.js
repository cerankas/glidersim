import * as THREE from 'three';
import { Water } from '@/objects/water';


export class Scene extends THREE.Scene {
  constructor() {
    super();    
    this.fog = new THREE.Fog(0xd0d0ff, 500, 3000);
    this.background = new THREE.Color(this.fog.color);

    this.water = new Water();
    this.add(this.water);
  }

  setupCamera(camera) {
    camera.far = this.fog.far;
    camera.updateProjectionMatrix();
  }
}