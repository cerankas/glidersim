import * as THREE from 'three/webgpu';

export class TailView {
  name = 'tail';
  distance;
  azimuth;
  elevation;

  constructor() {
    this.reset();
  }

  reset() {
    this.distance = 10;
    this.azimuth = 0;
    this.elevation = 0;
  }

  onPan(dx, dy) {
    this.azimuth += dx;
    this.elevation += dy;
    this.elevation = THREE.MathUtils.clamp(this.elevation, -.99 * Math.PI/2, .99 * Math.PI/2);
  }

  onZoom(factor) {
    this.distance *= factor;
    this.distance = THREE.MathUtils.clamp(this.distance, 5, 50);
  }

  update(camera, glider) {
    camera.up.copy(glider.up());
    camera.position.copy(glider.forward()).multiplyScalar(-this.distance);
    camera.position.applyAxisAngle(glider.right(), -this.elevation);
    camera.position.applyAxisAngle(glider.up(), -this.azimuth);
    camera.position.add(glider.mesh.position);
    camera.lookAt(glider.mesh.position);
    camera.updateProjectionMatrix();
  }
}