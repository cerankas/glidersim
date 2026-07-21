import * as THREE from 'three/webgpu';
import { WaterMesh } from './WaterMesh';


export class Water extends WaterMesh {
  constructor(range) {
    const size = range * 2;
    super(
      new THREE.PlaneGeometry(size, size),
      {
        waterNormals: new THREE.TextureLoader().load( 'textures/waternormals.jpg', function ( texture ) {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        } ),
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
      }
    );
  }
}