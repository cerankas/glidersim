import * as THREE from 'three/webgpu';
import { terrainHeight } from '@/map/terrain';
import { HeightMapMaterial } from '@/scene/materials';


export class MapCell {
  constructor(resolution, scene) {
    this.x = null;
    this.y = null;
    this.size = null;
    this.resolution = resolution;

    this.heights = new Float32Array(this.resolution ** 2);

    this.heightTexture = new THREE.DataTexture(
      this.heights,
      this.resolution,
      this.resolution,
      THREE.RedFormat,
      THREE.FloatType,
    );

    this.heightTexture.minFilter = THREE.LinearFilter;
    this.heightTexture.magFilter = THREE.LinearFilter;

    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(),
      new HeightMapMaterial(this.heightTexture),
    );

    this.mesh.position.set(0, 0, 0);
    scene.add(this.mesh);
  }

  update(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;

    const sampleSpacing = size / this.resolution;
    const x0 = x - size / 2 + .5 * sampleSpacing;
    const y0 = y - size / 2 + .5 * sampleSpacing;

    let index = 0;
    for (let j = 0; j < this.resolution; j++) {
      const sampleY = y0 + j * sampleSpacing;

      for (let i = 0; i < this.resolution; i++) {
        const sampleX = x0 + i * sampleSpacing;

        this.heights[index++] = terrainHeight(sampleX, sampleY);
      }
    }

    this.mesh.position.set(x, y, 0);
    this.mesh.scale.set(size, size, 1);
    this.heightTexture.needsUpdate = true;
  }
}