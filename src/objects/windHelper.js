import * as THREE from 'three/webgpu';


export class WindHelper {
  constructor(scene, range, segmentCount) {
    const count = segmentCount + 1;
    this.range = range;
    this.count = count;
    this.step = range / segmentCount;

    const vertexCount = count * count * 2;
    this.positions = new Float32Array(vertexCount * 3);
    this.colors = new Float32Array(vertexCount * 3);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage),
    );
    this.geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(this.colors, 3).setUsage(THREE.DynamicDrawUsage),
    );

    this.lines = new THREE.LineSegments(
      this.geometry,
      new THREE.LineBasicMaterial({ vertexColors: true }),
    );
    this.lines.frustumCulled = false;
    scene.add(this.lines);
  }

  update(position, wind, worldManager) {
    const v = position.clone();
    const positiveColor = new THREE.Color('green');
    const negativeColor = new THREE.Color('red');
    
    for (let i = 0; i < this.count; i++) {
      v.x = position.x - this.range / 2 + i * this.step;

      for (let j = 0; j < this.count; j++) {
        v.y = position.y - this.range / 2 + j * this.step;
      
        const lift = wind.calculateLift(v, worldManager);
        const offset = (i * this.count + j) * 6;
        const color = lift > 0 ? positiveColor : negativeColor;

        this.positions.set([
          v.x, v.y, position.z,
          v.x, v.y, position.z + lift,
        ], offset);
        this.colors.set([
          color.r, color.g, color.b,
          color.r, color.g, color.b,
        ], offset);
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }
}
