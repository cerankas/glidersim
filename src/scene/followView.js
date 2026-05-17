import * as THREE from 'three';

const worldUp = new THREE.Vector3(0,0,1);

export class FollowView {
  name = 'follow';
  distance;
  azimuth;
  elevation;
  base = new THREE.Vector3();
  
  constructor() {
    this.reset();
  }

  reset() {
    this.distance = 12;
    this.azimuth = 0;
    this.elevation = 0;
  }

  setup(initpos) {
    this.base.copy(initpos);
  }

  onPan(dx, dy) {
    this.azimuth += dx;
    this.elevation += dy;
  }

  onZoom(factor) {
    this.distance *= factor;
    this.distance = THREE.MathUtils.clamp(this.distance, 5, 50);
  }

  update(camera, glider) {
    camera.up.copy(worldUp);
    
    const offset = glider.mesh.position.clone().sub(this.base);
    if (offset.length() > this.distance) {
      offset.normalize();
      offset.multiplyScalar(this.distance);
      this.base.copy(glider.mesh.position).sub(offset);
    }

    const baseOffset = this.base.clone().sub(glider.mesh.position);
    const baseElevation = Math.PI/2 - worldUp.angleTo(baseOffset);
    this.baseElevation = baseElevation;
    const minElevation = -.99 * Math.PI/2 - baseElevation;
    this.minElevation = minElevation;
    const maxElevation = .99 * Math.PI/2 - baseElevation;
    this.maxElevation = maxElevation;
    

    if (this.elevation < minElevation) this.elevation = minElevation;
    if (this.elevation > maxElevation) this.elevation = maxElevation;

    const horizontalOffset = baseOffset.clone().setZ(0);
    const perpendicularOffset = horizontalOffset.clone().cross(worldUp).multiplyScalar(-1).normalize();
    
    camera.position.copy(this.base);
    camera.position.sub(glider.mesh.position);
    camera.position.applyAxisAngle(perpendicularOffset, -this.elevation);
    camera.position.applyAxisAngle(worldUp, -this.azimuth);
    camera.position.add(glider.mesh.position);
    camera.lookAt(glider.mesh.position);
    camera.updateProjectionMatrix();
  }
}