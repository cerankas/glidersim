import * as THREE from 'three';
import { terrainHeight } from '@/map/terrain';
import { seededRandom } from '@/utils/random';
import { gui } from '@/control/gui';
import { glider } from '@/glider/glider';
import { camera } from '@/scene/camera';
import { playCheckpointSound } from '@/sound/checkpointSound';

class Task {
  constructor() {
    this.maxCount = 100;

    this.count = 10;
    this.seed = 14;

    this.x0 = 0;
    this.y0 = 0;
    
    this.minDistance = 500;
    this.maxDistance = 1000;
    this.trendDistance = 1000;
    this.trendDirection = 350;

    this.radius = 50;
    this.geometry = new THREE.CylinderGeometry(this.radius, this.radius, 2*this.radius);
    this.material = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.5, /*side: THREE.DoubleSide*/ });
    
    this.passedColor = new THREE.Color().setHex(0xc0c0c0);
    this.activeColor = new THREE.Color().setHex(0xff0000);
    this.futureColor = new THREE.Color().setHex(0x0000ff);
    
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.maxCount);
    this.points = [];
    this.times = [];
    this.current = 0;


    this.loadItem = '';
    this.loadItems = {};
    for (let k of Object.keys(localStorage).sort()) {
      if (k.startsWith('task_')) this.loadItems[k.substring(5)] = localStorage.getItem(k);
    }

    this.guiParameters = gui.addFolder('Mission parameters').onChange(this.generate.bind(this)).close();
    this.guiParameters.add(this, 'count', 2, this.maxCount).step(1).name('stages');
    this.guiParameters.add(this, 'minDistance',0,10000).step(1).name('min random distance');
    this.guiParameters.add(this, 'maxDistance',0,10000).step(1).name('max random distance');
    this.guiParameters.add(this, 'trendDistance',0,10000).step(1).name('trend distance');
    this.guiParameters.add(this, 'trendDirection',0,360).step(1).name('trend direction');
    this.guiParameters.add(this, 'x0').step(1).name('start x');
    this.guiParameters.add(this, 'y0').step(1).name('start y');
    this.guiParameters.add(this, 'seed').name('checkpoints seed');
    
    this.guiControl = gui.addFolder('Mission control').close();
    this.guiControl.add(this, 'randomizeSeed').name('randomize checkpoints');
    this.guiControl.add(this, 'randomizeStart').name('randomize start location');
    this.guiControl.add(this, 'save').name('save mission');
    this.guiLoad = this.guiControl.add(this, 'loadItem', this.loadItems).name('load mission').onChange(this.load.bind(this));
  }

  load() {
    const obj = JSON.parse(this.loadItem);
    this.guiParameters.load(obj);
    gui.updateDisplay();
  }

  save() {
    const time = new Date().toLocaleString("en-GB");
    const key = `${time.substring(6,10)}.${time.substring(3,5)}.${time.substring(0,2)} ${time.substring(11,20)}`;
    const value = JSON.stringify(this.guiParameters.save());
    localStorage.setItem(`task_${key}`, value);
    this.loadItems[key] = value;
    this.guiLoad = this.guiLoad.options(this.loadItems).onChange(this.load.bind(this));
    this.loadItem = value;
  }

  randomizeSeed() { 
    this.seed = Math.random() * 99999999 | 0;
    this.generate();
    gui.updateDisplay();
  }
  
  randomizeStart() { 
    this.x0 = Math.random() * 1000000 | 0;
    this.y0 = Math.random() * 1000000 | 0;
    this.generate();
    gui.updateDisplay();
  }

  resetGliderPosition() {
    if (glider == undefined) return;
    if (!glider.mesh) return;
    glider.mesh.position.x = this.x0;
    glider.mesh.position.y = this.y0;
    glider.mesh.position.z = terrainHeight(this.x0, this.y0) + 300;
    glider.mesh.rotation.x = 0;
    glider.mesh.rotation.y = 0;
    glider.mesh.rotation.z = 0;
    glider.speed = 90 / 3.6;
    if (camera.mode == 2 || camera.mode == 3) camera.position.copy(new THREE.Vector3(2,-20,5).add(glider.mesh.position));
  }

  generate() {
    this.points = [];
    this.times = [];
    this.current = 0;

    const trend = {
      x: this.trendDistance * Math.sin(this.trendDirection * Math.PI/180),
      y: this.trendDistance * Math.cos(this.trendDirection * Math.PI/180)
    }

    const random = seededRandom(this.seed);
    this.mesh.count = this.count;
    let x = this.x0;
    let y = this.y0;

    for (let i = 0; i < this.count; i++) {
      const dir = random() * 2 * Math.PI;
      const dist = this.minDistance + Math.sqrt(random()) * (this.maxDistance - this.minDistance);
      x += dist * Math.sin(dir) + trend.x;
      y += dist * Math.cos(dir) + trend.y;
      const z = terrainHeight(x, y);

      this.points.push(new THREE.Vector3(x, y, z));

      const matrix = new THREE.Matrix4();
      const rotationMatrix = new THREE.Matrix4().makeRotationX(Math.PI / 2);
          
      matrix.setPosition(x, y, z);
      matrix.multiply(rotationMatrix);

      this.mesh.setMatrixAt(i, matrix);
      this.mesh.setColorAt(i, i ? this.futureColor : this.activeColor);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor.needsUpdate = true;
    this.mesh.computeBoundingBox();
    this.mesh.computeBoundingSphere();

    this.current = 0;

    this.resetGliderPosition();
  }

  toScene(scene) {
    scene.add(this.mesh);
  }

  reached() {
    return this.toTarget.x**2 + this.toTarget.y**2 < this.radius**2 && Math.abs(this.toTarget.z) < this.radius;
  }

  advance() {
    this.times.push(glider.time);
    this.mesh.setColorAt(this.current, this.passedColor);
    this.current += 1;
    this.mesh.setColorAt(this.current, this.activeColor);
    this.mesh.instanceColor.needsUpdate = true;
    playCheckpointSound();
  }

  update(position) {
    if (this.current >= this.points.length) return;
    this.toTarget = this.points[this.current].clone().sub(position);
    if (this.reached()) this.advance();
  }
}

export const task = new Task();