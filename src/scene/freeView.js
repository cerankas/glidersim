import * as THREE from 'three';

const worldUp = new THREE.Vector3(0,0,1);

export class FreeView {
  name = 'free';
  zoom = 1;
  dx = 0;
  dy = 0;
  resetFlag = false;

  reset() {
    this.resetFlag = true;
  }

  onPan(dx, dy) {
    this.dx += dx;
    this.dy += dy;
  }

  onZoom(factor) {
    this.zoom *= factor;
  }

  update(camera, glider) {
    camera.up.copy(worldUp);
    camera.position.sub(glider.mesh.position);
    camera.position.multiplyScalar(this.zoom);
    
    const horizontalOffset = camera.position.clone().setZ(0);
    const perpendicularOffset = horizontalOffset.clone().cross(worldUp).multiplyScalar(-1).normalize();
    camera.position.applyAxisAngle(perpendicularOffset, -this.dy);
    
    camera.position.applyAxisAngle(worldUp, -this.dx);
    camera.position.add(glider.mesh.position);
    camera.lookAt(glider.mesh.position);
    camera.updateProjectionMatrix();

    this.zoom = 1;
    this.dx = 0;
    this.dy = 0;
  }
}