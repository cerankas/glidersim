import THREE from '@/three/three';

export function setShadowCameraFrustum(light, object) {
  light.position.copy(new THREE.Vector3(-500,-500,1000).add(object.position));
  light.shadow.camera.updateProjectionMatrix();
}