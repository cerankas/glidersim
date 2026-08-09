import * as THREE from 'three/webgpu';
import { guiSettings } from '@/control/gui';


export class Wind {
  constructor() {
    this.direction = 90; // deg
    this.speed = 30; // km/h
    this.range = 500; // m
    this.liftFactor = 2 * 2 * (12 / 50) ** 2;

    const folder = guiSettings.addFolder('Wind').close();
    folder.add(this,'direction',0,360);
    folder.add(this,'speed',0,100).name('speed [km/h]');
    folder.add(this,'liftFactor',0,5).name('lift factor');    
  }
  
  vector() { // m/s
    const wind = new THREE.Vector3(0,this.speed/3.6,0);
    wind.applyAxisAngle(new THREE.Vector3(0,0,1), this.direction * Math.PI / 180);
    return wind;
  }
    
  calculateLift(position, worldManager) {
    const windDirection = this.vector().normalize();

    const minx = position.x - this.range;
    const miny = position.y - this.range;
    const minz = position.z - this.range;
    const maxx = position.x + this.range;
    const maxy = position.y + this.range;
    const maxz = position.z + this.range;

    let sumLifts = 0;

    const center = new THREE.Vector3();
    const normal = new THREE.Vector3();

    for (const tile of worldManager.tiles) {
      
      if (Math.abs(tile.x - position.x) > this.range + worldManager.tileSize/2) continue;
      if (Math.abs(tile.y - position.y) > this.range + worldManager.tileSize/2) continue;

      const positionToCenter = new THREE.Vector3();
      
      const centers = tile.terrain.geometry.attributes.position.array;
      const normals = tile.terrain.geometry.attributes.normal.array;

      for (let i = 0; i < normals.length; i += 3) {
        center.fromArray(centers, i);
        normal.fromArray(normals, i);

        if (
          center.x < minx || center.x > maxx ||
          center.y < miny || center.y > maxy ||
          center.z < minz || center.z > maxz
        ) continue;
        
        positionToCenter.subVectors(position, center);
        const distance = positionToCenter.length();
        const dotProduct = normal.dot(windDirection);
        sumLifts += dotProduct / (50 + distance);
      }
    }

    return this.liftFactor / 3.6 * this.speed * sumLifts;
  }
}