import * as THREE from 'three';

class Camera extends THREE.PerspectiveCamera {
  mode = 2;
  modes = ['cockpit','tail','follow','free'];
  constructor() {
    super(75, window.innerWidth / window.innerHeight, .01, 5000);
    this.up.set(0,0,1);
  }
  
  
  changeMode() {
    this.mode = (this.mode + 1) % this.modes.length;
  }

  setMode(mode) {
    this.mode = mode;
  }
  
  setup(initpos) {
    // camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .01, 5000);
    this.position.copy(new THREE.Vector3(2,-20,5).add(initpos));
  }
  
  update(glider, controls) {
    if (this.mode == 0) { // cockpit
      this.up.copy(glider.up());
      this.position.copy(glider.pilotPosition());
      this.lookAt(glider.cockpitPosition());
      this.updateProjectionMatrix();
    }
    
    if (this.mode == 1) { // tail
      this.up.copy(glider.up());
      this.position.copy(glider.tailPosition());
      this.lookAt(glider.cockpitPosition());
      this.updateProjectionMatrix();
    }
    
    if (this.mode == 2) { // follow
      this.up.copy(new THREE.Vector3(0,0,1));
      controls.maxDistance = 12;
      controls.update();
    }
    
    if (this.mode == 3) { // free
      this.up.copy(new THREE.Vector3(0,0,1));
      controls.maxDistance = Infinity;
      controls.update();
    }
    
    const overSpeed = glider.overSpeed();
    if (!glider.paused && overSpeed > 0 && false) {
      const turbulence = .02 * overSpeed;
      this.rotation.x += Math.random() * turbulence;
      this.rotation.y += Math.random() * turbulence;
      this.rotation.z += Math.random() * turbulence;
    }

    controls.enableRotate = glider.paused;
    controls.enableZoom = glider.paused;
  }
}
  
export const camera = new Camera();