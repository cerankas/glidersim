import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader';
import { wind } from '@/map/wind';
import { multiplayer } from '@/multiplayer/multiplayer';
import { createTextSprite } from '@/objects/sprite';
import { scene } from '@/scene/scene';
import { camera } from '@/scene/camera';
import { collider } from '@/glider/collider';

export class Glider {
  constructor(initpos, callback) {
    this.mesh = null;
    this.elements = null;
    this.paused = true;

    this.speed = 90 / 3.6;
    this.stallSpeed = 60 / 3.6;
    
    this.maxControl = 1/60 * Math.PI / 2;
    this.rotationControl = [0,0,0]; // elevator, ailerons, rudder
    this.rotationDelta   = [0,0,0];
    this.controlBrake = 0;

    this.gearDelta = 0;
    this.gearPosition = 0;

    this.roll = 0;
    this.pitch = 0;
    this.yaw = 0;
    
    this.lift = 0;

    this.textures = [];

    this.time = 0;
  }

  clone() {
    const cloned = new Glider();
    cloned.mesh = this.mesh.clone();
    return cloned;
  }

  load(initpos, callback) {
    new GLTFLoader().load("glider.glb", (loaded) => {
      this.mesh = new THREE.Group().add(loaded.scene);
      this.mesh.position.copy(initpos);
      this.updateAttitude();
      
      const instrumentCanvas = document.getElementById('instrumentCanvas');

      this.mesh.traverse(c => {
        const idx = ['Speedometer','Variometer','Horizon','Altimeter'].indexOf(c.name);
        if (idx == -1) {
          if (c.children[0]) {
            c.children[0].castShadow = true;
          }
          if (c.name.endsWith('Box')) c.visible = false;
        }
        else {
          const map = new THREE.CanvasTexture(instrumentCanvas);
          map.flipY = true;
          map.center = new THREE.Vector2(.5,.5);
          map.rotation = Math.PI;
          map.anisotropy = 2;
          map.repeat.set(120/600,1);
          map.offset.set((-300 + 60 + 150 * idx)/600,0);
          c.material = new THREE.MeshBasicMaterial({map});
          this.textures.push(map);
        }
        if (c.name == 'Canopy') {
          c.castShadow = true;
          c.material.opacity = .4;
          c.material.side = THREE.FrontSide;
        }
        if (c.name == 'WheelF') this.wheel = c;
        if (c.name == 'LandingGearHandle') this.wheelH = c;

        if (c.name == 'LandingGearDoorL') this.doorL = c;
        if (c.name == 'LandingGearDoorR') this.doorR = c;
        
        if (c.name == 'BrakeTop') this.brakeT = c;
        if (c.name == 'BrakeBottom') this.brakeB = c;
      });
      callback(this);
      multiplayer.connect();
      return this;
    });
  }

  setBrake(brake) {
    this.brake = brake;
  }

  toggleGear() {
    this.gearDelta = this.gearDelta ? -this.gearDelta : (this.gearPosition ? -.02 : .02);
  }

  updateInstrumentTextures() {
    for (let map of this.textures) map.needsUpdate = true;
  }

  elevator(state) {
    if (!state) return;
    this.rotationControl[0] = state;
  }
  
  ailerons(state) {
    if (!state) return;
    this.rotationControl[1] = state;
  }
  
  rudder(state) {
    if (!state) return;
    this.rotationControl[2] = state;
  }

  rotateZ(dt) {
    this.mesh.rotateOnWorldAxis(new THREE.Vector3(0,0,1), Math.PI * dt / 2);
  }

  right() {
    return new THREE.Vector3(1,0,0).applyQuaternion(this.mesh.quaternion);
  }
  
  left() {
    return new THREE.Vector3(-1,0,0).applyQuaternion(this.mesh.quaternion);
  }
  
  forward() {
    return new THREE.Vector3(0,1,0).applyQuaternion(this.mesh.quaternion);
  }
  
  up() {
    return new THREE.Vector3(0,0,1).applyQuaternion(this.mesh.quaternion);
  }

  down() {
    return new THREE.Vector3(0,0,-1).applyQuaternion(this.mesh.quaternion);
  }

  updateAttitude() {
    function clamp(v) { return Math.max(-1, Math.min(1, v)); }

    const right = this.right();
    const forward = this.forward();
    const up = this.up();
    
    const worldUp = new THREE.Vector3(0, 0, 1);
    const levelVector = worldUp.clone().sub(forward.clone().multiplyScalar(worldUp.dot(forward))).normalize();
    this.roll = Math.acos(clamp(levelVector.dot(up)));
    if (right.dot(levelVector) > 0) this.roll = -this.roll;
    
    const forwardProjected = new THREE.Vector3(forward.x, forward.y, 0).normalize();
    this.pitch = Math.acos(clamp(forward.dot(forwardProjected)));
    if (forward.z < 0) this.pitch = -this.pitch;
    
    this.yaw = Math.atan2(forwardProjected.x, forwardProjected.y);
  }

  cockpitPosition() {
    return new THREE.Vector3(0,3,0.38).applyMatrix4(this.mesh.matrixWorld);
  }
  
  pilotPosition() {
    return new THREE.Vector3(0,.65,0.38).applyMatrix4(this.mesh.matrixWorld);
  }

  tailPosition() {
    return new THREE.Vector3(0,-10,0.4).applyMatrix4(this.mesh.matrixWorld);
  }

  sinkRate() {
    const speed = this.speed * 3.6;
    const stall = this.stallSpeed * 3.6
    const rollFactor = Math.abs(this.roll) / Math.PI;
    const fastFactor = Math.max(0, (speed - 200) / 50);
    const boltFactor = Math.max(0, (speed - 280) / 10);
    const stallFactor = Math.max(0, (stall - speed) / 10);
    return .5 + this.speed / 50 + rollFactor + fastFactor + boltFactor + stallFactor;
  }

  overSpeed() {
    return Math.max(0, glider.speed * 3.6 - 280)**2 / 20**2;
  }

  move(dt, airLift) {
    for (let a = 0; a < 3; a++) {
      const control = this.rotationControl[a];
      this.rotationDelta[a] = Math.max(-Math.abs(control), Math.min(Math.abs(control), this.rotationDelta[a] + control * dt * 10));
      const vector = new THREE.Vector3(
        (a==0) ? 1 : 0, 
        (a==1) ? 1 : 0, 
        (a==2) ? -1 : 0
      );
      this.mesh.rotateOnAxis(vector, dt * this.rotationDelta[a] * 1.6);
    }
    this.rotationControl = [0,0,0];
    
    if (!this.paused) {
      const delta = this.forward().multiplyScalar(dt * this.speed);
      this.lift = airLift - this.sinkRate();
  
      this.mesh.position.add(delta);
      this.mesh.position.sub(wind.vector().clone().multiplyScalar(dt));
      this.mesh.position.z += dt * this.lift;
      
      this.speed = Math.sqrt(this.speed**2 - 2 * 9.81 * delta.z);

      this.speed *= 1 - this.overSpeed()/200;
  
      if (this.speed < this.stallSpeed && !collider.supported) {
        this.mesh.rotateOnAxis(new THREE.Vector3(1,0,0), .01 * dt * (this.stallSpeed - this.speed)**3 * (this.up().z > 0 ? -1 : 1));
      }
      
      let roll = this.roll;
      if (roll > Math.PI/2) roll = Math.PI - roll;
      if (roll < -Math.PI/2) roll = -Math.PI - roll;
      this.mesh.rotateOnWorldAxis(new THREE.Vector3(0,0,1), -roll * dt / 100 * 180 / Math.PI);

      if (this.gearDelta) {
        this.gearPosition += this.gearDelta;
        if (this.gearPosition >= 1) {
          this.gearPosition = 1;
          this.gearDelta = 0;
        }
        if (this.gearPosition <= 0) {
          this.gearPosition = 0;
          this.gearDelta = 0;
        }
        if (this.wheel) this.wheel.position.z = this.gearPosition * -.2;
        if (this.wheelH) this.wheelH.position.y = this.gearPosition * -.2;
        if (this.doorL) this.doorL.rotation.y = this.gearPosition *  Math.PI/2;
        if (this.doorR) this.doorR.rotation.y = this.gearPosition * -Math.PI/2;
      }

      if (this.brakeT) this.brakeT.position.z = this.brake *  .1;
      if (this.brakeB) this.brakeB.position.z = this.brake * -.1;

      this.time += dt;
    }
      
    this.mesh.updateMatrixWorld();
    this.updateAttitude();

    if (this.peer) {
      if (!this.sprite) {
        this.sprite = createTextSprite(this.peer.nick);
        scene.add(this.sprite);
      }
      const dst = this.sprite.position.clone().sub(camera.position).length();
      this.sprite.position.copy(this.mesh.position.clone().add(camera.up.clone().multiplyScalar(1 + dst / 100)));
      this.sprite.scale.copy(this.sprite.initScale.clone().multiplyScalar(dst / 50));
      this.sprite.setText(`${this.peer.nick} ${this.mesh.position.clone().sub(glider.mesh.position).length()|0}m`)
    }
  }
}

export const glider = new Glider();