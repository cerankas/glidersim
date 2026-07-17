import * as THREE from 'three/webgpu';
import { Water as BaseWater } from 'three/addons/objects/Water.js';


export class Water extends BaseWater {
  constructor() {
    super(
      new THREE.PlaneGeometry(6000, 6000),
      {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new THREE.TextureLoader().load( 'textures/waternormals.jpg', function ( texture ) {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        } ),
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: true,
      }
    );

    this.material.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        'getNoise( worldPosition.xz * size );', 
        'getNoise( worldPosition.xy * size );'
      ).replace(
        'vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );',
        'vec3 surfaceNormal = normalize( noise.xyz * vec3( 1.5, 1.5, 1.0 ) );'
      ).replace(
        'vec2 distortion = surfaceNormal.xz * ( 0.001 + 1.0 / distance ) * distortionScale;',
        'vec2 distortion = surfaceNormal.xy * ( 0.001 + 1.0 / distance ) * distortionScale;'
      );
    }
  }
}


// import { Reflector } from 'three/examples/jsm/Addons.js';
// export class Water extends Reflector {
//   constructor() {
//     super(new THREE.PlaneGeometry(6000, 6000), {
//       clipBias: 0.003,
//       textureWidth: window.innerWidth * window.devicePixelRatio / 2,
//       textureHeight: window.innerHeight * window.devicePixelRatio / 2,
//       color: 0x889999
//     });
//   }
// }


// import { waterMaterial } from '@/scene/materials';
// export class Water extends THREE.Mesh {
//   constructor() {
//     super(new THREE.PlaneGeometry(6000, 6000), waterMaterial);
//   }
// }