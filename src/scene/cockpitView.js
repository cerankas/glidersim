import * as THREE from 'three/webgpu';

export class CockpitView {
  name = 'cockpit';
  fov;
  azimuth;
  elevation;

  constructor() {
    this.reset();
  }

  reset() {
    this.fov = 75;
    this.azimuth = 0;
    this.elevation = 0;
  }

  onPan(dx, dy) {
    this.azimuth += dx;
    this.elevation += dy;
    this.azimuth = THREE.MathUtils.clamp(this.azimuth, -Math.PI, Math.PI);
    this.elevation = THREE.MathUtils.clamp(this.elevation, -Math.PI/2, Math.PI/2);
  }

  onZoom(factor) {
    this.fov *= factor;
    this.fov = THREE.MathUtils.clamp(this.fov, 30, 100);
  }

  update(camera, glider) {
    camera.up.copy(glider.up());
    camera.fov = this.fov;
    camera.position.copy(glider.pilotPosition());
    camera.lookAt(glider.cockpitPosition());
    camera.rotateOnAxis(new THREE.Vector3(0,1,0), -this.azimuth);
    camera.rotateOnAxis(new THREE.Vector3(1,0,0), -this.elevation);
    camera.updateProjectionMatrix();
  }
}