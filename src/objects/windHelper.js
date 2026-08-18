import * as THREE from 'three/webgpu';


export class WindHelper {
  constructor(scene, range, count) {
    this.range = range;
    this.count = count;
    this.step = range / count;
    this.arrows = [];

    for (let i = 0; i < count * count; i++) {
      const arrow = new THREE.ArrowHelper();
      this.arrows.push(arrow);
      scene.add(arrow);
    }
  }

  update(position, wind, worldManager) {
    const v = position.clone();
    
    for (let i = 0; i < this.count; i++) {
      v.x = position.x - this.range / 2 + i * this.step;

      for (let j = 0; j < this.count; j++) {
        v.y = position.y - this.range / 2 + j * this.step;
      
        const lift = wind.calculateLift(v, worldManager);

        const arrow = this.arrows[i * this.count + j];
        arrow.position.set(v.x, v.y, position.z);
        arrow.setLength(lift);
        arrow.setColor(lift > 0 ? 'green' : 'red');

      }
    }
  }
}