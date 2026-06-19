import * as THREE from 'three';
import { Water } from '@/objects/water';


export class Scene extends THREE.Scene {
  constructor() {
    super();    
    this.fog = new THREE.Fog(0xd0d0ff, 500, 3000);
    this.background = new THREE.Color(this.fog.color);

    this.water = new Water();
    this.add(this.water);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    this.add(this.ambientLight);

    this.directionalLight = createDirectionalLight(1000, 4096);
    this.add(this.directionalLight);
  }

  setupCamera(camera) {
    camera.far = this.fog.far;
    camera.updateProjectionMatrix();
  }
}


function createDirectionalLight(range, resolution) {
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.shadow.camera.far = 10000;
  light.castShadow = true;
  if (range) {
    light.shadow.camera.left = -range;
    light.shadow.camera.right = range;
    light.shadow.camera.top = range;
    light.shadow.camera.bottom = -range;
  }
  if (resolution) {
    light.shadow.mapSize = new THREE.Vector2(resolution, resolution);
  }
  light.shadow.bias = .000001;
  return light;
}
