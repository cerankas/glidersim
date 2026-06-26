import * as THREE from 'three';
import { terrainHeight } from '@/map/terrain';
import { playCheckpointSound } from '@/sound/checkpointSound';


export class Task {
  constructor() {
    this.maxCount = 100;

    this.radius = 50;

    this.geometry = new THREE.CylinderGeometry(this.radius, this.radius, 2*this.radius).rotateX(Math.PI/2);
    this.material = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.5, /*side: THREE.DoubleSide*/ });
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.maxCount);
    
    this.passedColor = new THREE.Color().setHex(0xc0c0c0);
    this.activeColor = new THREE.Color().setHex(0xff0000);
    this.futureColor = new THREE.Color().setHex(0x0000ff);

    this.startPosition = new THREE.Vector3();
    this.startRotation = new THREE.Vector3();
    this.startSpeed = 90 / 3.6;
    
    this.name = '';
    this.points = [];
    this.times = [];
    this.current = 0;
    this.toTarget = null;
  }

  static listTasksInLocalStorage() {
    const items = [];
    for (let k of Object.keys(localStorage).sort()) {
      if (k.startsWith('task_')) {
        items.push(localStorage.getItem(k));
      }
    }
    return items;
  }

  load(data) {
    const obj = JSON.parse(data);
    const points = obj.points ?? [];
    
    this.startPosition = new THREE.Vector3(...obj.startPosition ?? [0,0,terrainHeight(0,0)+300]);
    this.startRotation = new THREE.Euler(...obj.startRotation ?? [0,0,0]);
    this.startSpeed = obj.startSpeed ?? 90 / 3.6;

    this.points = [];
    this.times = [];
    this.current = 0;

    this.mesh.count = points.length;
    const matrix = new THREE.Matrix4();

    for (let i = 0; i < points.length; i++) {
      const point = new THREE.Vector3(...points[i]);
      this.points.push(point);

      matrix.setPosition(point);

      this.mesh.setMatrixAt(i, matrix);
      this.mesh.setColorAt(i, i ? this.futureColor : this.activeColor);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
    this.mesh.computeBoundingBox();
    this.mesh.computeBoundingSphere();
  }

  save() {
    const timestamp = new Date().toLocaleString("sv");
    const points = [];
    for (let i = 0; i < this.points.length; i++) {
      points.push(this.points[i].toArray());
    }
    const value = JSON.stringify({
      name:this.name,
      timestamp,
      points,
      startPosition: this.startPosition.toArray(),
      startRotation: this.startRotation.toArray(),
      startSpeed: this.startSpeed,
    });
    localStorage.setItem(`task_${timestamp}`, value);
  }

  resetGliderPosition(glider, camera) {
    if (glider == undefined) return;
    if (!glider.mesh) return;
    glider.mesh.position.copy(this.startPosition);
    glider.mesh.rotation.copy(this.startRotation);
    glider.speed = this.startSpeed;
    if (camera.view.name == 'follow' || camera.view.name == 'free') camera.setup(glider.mesh.position);
  }

  toScene(scene) {
    scene.add(this.mesh);
  }

  isNextTargetReached() {
    return this.toTarget.x**2 + this.toTarget.y**2 < this.radius**2 && Math.abs(this.toTarget.z) < this.radius;
  }

  advance(time) {
    this.times.push(time);
    this.mesh.setColorAt(this.current, this.passedColor);
    this.current += 1;
    this.mesh.setColorAt(this.current, this.activeColor);
    this.mesh.instanceColor.needsUpdate = true;
    playCheckpointSound();
  }

  update(position, time) {
    if (this.current >= this.points.length) {
      this.toTarget = null;
      return;
    }
    this.toTarget = this.points[this.current].clone().sub(position);
    if (this.isNextTargetReached()) this.advance(time);
  }
}