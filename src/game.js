import * as THREE from 'three/webgpu';
import Stats from 'three/addons/libs/stats.module.js';
import { Glider } from '@/glider/glider';
import { Wind } from '@/map/wind';
import { setShadowCameraFrustum } from '@/scene/shadow';
import { AudioVario } from '@/sound/audioVario';
import { AirflowSound } from '@/sound/airSound';
import { Camera } from '@/scene/camera';
import { gui } from '@/control/gui';
import { Scene } from '@/scene/scene';
import { Instruments } from '@/glider/instruments';
import { Task } from '@/control/task';
import { MiniMap } from '@/map/miniMap';
import { WorldManager } from '@/map/worldManager';
import { MapManager } from '@/map/mapManager';
import { Multiplayer } from '@/multiplayer/multiplayer';
import { getGamepadState } from '@/control/gamepad';
import { Collider } from '@/collider/collider';
import { Mouse } from './control/mouse';
import { Keyboard } from './control/keyboard';
import { config } from './config';
import { WindHelper } from './objects/windHelper';


export class Game {
  constructor() {
    this.mouseControlFlag = false;
    this.showStats = JSON.parse(localStorage.getItem('stats') || false);

    if (!localStorage.getItem('firstTimeHelpDisplayed')) document.getElementById("help").hidden = false;
    localStorage.setItem('firstTimeHelpDisplayed', 'true');

    this.range = config.visibilityRange;

    this.scene = new Scene(this.range);
    this.camera = new Camera(this.range);

    this.wind = new Wind();
    this.task = new Task();
    this.collider = new Collider();
    this.glider = new Glider();
    this.instruments = new Instruments();

    this.worldManager = new WorldManager(config.tileSize, config.bucketSize, config.quadSize, this.scene);
    this.miniMap = new MiniMap();
    this.mapManager = new MapManager(config.heightMapResolution, this.miniMap.scene);
    
    this.multiplayer = new Multiplayer(this.glider);
    
    this.audioVario = new AudioVario();
    this.airflowSound = new AirflowSound();
    
    this.stats = new Stats();

    this.windHelper = new WindHelper(this.scene, 500, 10);
    
    this.renderer = new THREE.WebGPURenderer({antialias:true, logarithmicDepthBuffer:true});
    this.renderer.highPrecision = true;
    
    this.mouse = new Mouse();
    this.keyboard = new Keyboard(this);

    window.tile = this.worldManager.tiles[4];

    this.stats.showPanel(this.showStats ? 1 : -1);
    document.body.appendChild(this.stats.dom);
    
    const initpos = new THREE.Vector3(500, 1250, 2050);
    this.camera.setup(initpos);

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);

    this.multiplayer.setScene(this.scene);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    this.task.toScene(this.scene);
    this.collider.toScene(this.scene);

    this.camera.bindInput(this.renderer.domElement);

    gui.add(this, 'toggleAudioVario').name('Audio vario [a]');
    gui.add(this, 'togglePause').name('Pause [space]');
    gui.add(this, 'toggleHelp').name('Help [h]');
    gui.add(this, 'toggleStats').name('Stats');

    document.addEventListener('contextmenu', e => e.preventDefault());

    this.glider.load(initpos, (glider) => {
      this.scene.add(glider.mesh);
      this.scene.directionalLight.target = glider.mesh;
      const tasks = Task.listTasksInLocalStorage();
      this.task.load(tasks[tasks.length-1] ?? '{}');
      this.task.resetGliderPosition(glider, this.camera);
      this.instruments.update(glider);
      this.renderer.setAnimationLoop(this.animate);
      this.multiplayer.connect();
    });
  }

  toggleAudioVario = () => {
    if (this.audioVario.isPlaying) this.audioVario.stop();
    else this.audioVario.start();
  }

  togglePause = () => {
    this.glider.paused = !this.glider.paused;
    if (this.glider.paused) {
      this.audioVario.stop();
      this.airflowSound.stop();
    }
    else {
      this.audioVario.start();
      this.airflowSound.start();
    }
  }

  isHelpVisible = () => !document.getElementById("help").hidden;

  toggleHelp = () => {
    const help = document.getElementById("help");
    help.hidden = !help.hidden;
  }

  toggleStats = () => {
    this.showStats = !this.showStats;
    localStorage.setItem('stats', this.showStats);
    this.stats.showPanel(this.showStats ? 0 : -1);
  }

  jump(dx, dy, dz) {
    const c = this.keyboard.keys['Control'] ? (this.keyboard.keys['Alt'] ? (this.keyboard.keys['Shift'] ? 100000 : 10) : 100) : (this.keyboard.keys['Alt'] ? 10000 : 1000);
    const delta = new THREE.Vector3(c*dx, c*dy, c*dz);
    this.glider.mesh.position.add(delta);
    this.camera.position.add(delta);
    this.camera.view.base?.add(delta);
  }

  lastFrameTime = 0;

  animate = (t) => {
    if (this.showStats) this.stats.begin();
  
    let dt = (t - this.lastFrameTime) / 1000;
    this.lastFrameTime = t;

    if (this.keyboard.keys['[']) dt *= .5;
    if (this.keyboard.keys[']']) dt *= 2;

    this.updateGliderControl(dt);
  
    const windLift = this.wind.calculateLift(this.glider.mesh.position, this.worldManager);
  
    this.glider.move(dt, windLift, this.wind, this.collider.supported);
  
    this.scene.water.position.x = this.glider.mesh.position.x;
    this.scene.water.position.y = this.glider.mesh.position.y;
  
    // if (!this.glider.paused) this.scene.water.material.uniforms['time'].value -= dt;
  
    this.multiplayer.update(t, this.worldManager, this.wind, this.scene, this.camera);
    
    this.task.update(this.glider.mesh.position, this.glider.time);

    this.windHelper.update(this.glider.mesh.position, this.wind, this.worldManager);
  
    this.renderWorld();

    this.updateSound(t);
  
    this.worldManager.update(this.glider.mesh.position.x, this.glider.mesh.position.y);
    if (this.miniMap.visible) {
      this.mapManager.update(this.glider.mesh.position.x, this.glider.mesh.position.y, this.miniMap.mapDataRange(), this.miniMap.mapDataDiagonal());
    }

    this.renderMap();
  
    if (!this.glider.paused) this.collider.update(dt, this.worldManager, this.glider, this.scene.water);
  
    document.getElementById('logDiv').innerHTML = this.showStats ? this.generateStats() : '';

    if (this.showStats) this.stats.end();
  }

  updateGliderControl(dt) {
    const keys = this.keyboard.keys;
  
    const s = Math.sin(this.glider.yaw) * dt;
    const c = Math.cos(this.glider.yaw) * dt;
  
    if (keys.Shift) {
      if (keys.ArrowUp)    this.jump(s,c,0);
      if (keys.ArrowDown)  this.jump(-s,-c,0);
          
      if (keys.ArrowLeft)  this.jump(-c,s,0);
      if (keys.ArrowRight) this.jump(c,-s,0);
      
      if (keys.PageUp)     this.jump(0,0,dt);
      if (keys.PageDown)   this.jump(0,0,-dt);
  
      if (keys['<'])       this.glider.rotateZ(dt);
      if (keys['>'])       this.glider.rotateZ(-dt);
    }
      
    if (!keys['Shift']) {	
      if (keys.ArrowUp)    this.glider.setElevatorControl(-1);
      if (keys.ArrowDown)  this.glider.setElevatorControl(1);
  
      if (keys.ArrowLeft)  this.glider.setAileronsControl(-1);
      if (keys.ArrowRight) this.glider.setAileronsControl(1);
  
      if (keys[','])       this.glider.setRudderControl(-1);
      if (keys['.'])       this.glider.setRudderControl(1);
    }
  
    const gamepad = getGamepadState();
    if (gamepad) {
      if (gamepad.buttons[0].pressed) this.glider.setElevatorControl(-1);
      if (gamepad.buttons[2].pressed) this.glider.setElevatorControl(1);
  
      if (gamepad.buttons[1].pressed) this.glider.setAileronsControl(1);
      if (gamepad.buttons[3].pressed) this.glider.setAileronsControl(-1);
    }
  
    if (this.glider.paused || !this.mouse.controlEnabled) {
      this.mouse.reset();
    }
  
    if (!this.glider.paused) {
      this.glider.setElevatorControl(this.mouse.dy);
      this.glider.setAileronsControl(this.mouse.dx);
    }

    this.glider.setAccelerateControl(keys['v']|0);
    this.glider.setBrakeControl(keys['b']|0);
  }

  renderWorld() {
    this.camera.update(this.glider);
  
    this.instruments.update(this.glider, this.camera.view.name == 'cockpit', this.camera.view.name == 'tail');
  
    setShadowCameraFrustum(this.scene.directionalLight, this.glider.mesh);
    
    this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    this.renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
    this.renderer.setScissorTest(true);
    this.renderer.render(this.scene, this.camera);  
  }

  renderMap() {
    if (this.miniMap.visible) {
      this.miniMap.cam.position.copy(this.glider.mesh.position);
      this.miniMap.cam.rotation.z = this.miniMap.north ? Math.PI : Math.PI - this.glider.yaw;
      this.miniMap.cam.updateProjectionMatrix();
      
      this.renderer.setViewport(0, window.innerHeight - this.miniMap.height, this.miniMap.width, this.miniMap.height);
      this.renderer.setScissor(0, window.innerHeight - this.miniMap.height, this.miniMap.width, this.miniMap.height);
      this.renderer.setScissorTest(true);
      this.renderer.render(this.miniMap.scene, this.miniMap.cam);
      this.miniMap.drawOverlay(this.glider, this.wind, this.task, this.multiplayer.gliders, this.worldManager.tiles, this.collider.collidable);
    }
    else {
      this.miniMap.clearOverlay();
    }
  }

  lastVarioTime = 0;
  
  updateSound(t) {
    if (t > this.lastVarioTime + 500) {
      this.lastVarioTime = t;
      this.audioVario.setLiftRate(this.glider.lift);
    }
  
    this.airflowSound.setAirspeed(this.glider.speed * 3.6);
    
    if (Math.random() < 0.05) {
      this.airflowSound.addTurbulence(0.2);
    }

  }

  generateStats() {
    let log = [];

    log.push(`build ${__BUILD_TIMESTAMP__}`);
    log.push(`id ${this.multiplayer.peerServer.peerId}`)
    log.push(`${this.multiplayer.nick}, sent: ${this.multiplayer.peerServer.sent}, rec: ${this.multiplayer.peerServer.received}`);
    
    for (let id in this.multiplayer.gliders) {
      const peer = this.multiplayer.gliders[id].peer;
      log.push(`${peer.nick}, dt: ${peer.systime - Date.now()}, sent: ${peer.sent}, rec: ${peer.received}`)
    }
    
    log.push(`flight time: ${this.glider.time.toFixed(2)}`);
    const treeCounts = this.worldManager.treeCounts();
    const houseCounts = this.worldManager.houseCounts();
    const totalTrees = treeCounts.reduce((sum, value) => sum + value);
    const totalHouses = houseCounts.reduce((sum, value) => sum + value);
    log.push(`trees: ${totalTrees} : [${treeCounts.sort().reverse()}]`);
    log.push(`houses: ${totalHouses} : [${houseCounts.sort().reverse()}]`);
    log.push(`collider balls: ${this.collider.dust.balls.length}`);

    if (this.task.times.length) {
      log.push('');
      let rows = ['<td></td><td>time</td><td>Δt</td><td>dst</td><td>Δh</td><td>Vavg</td>'];
      for (let i = 1; i < this.task.times.length; i++) {
        const t = this.task.times[i] - this.task.times[0];
        const dt = this.task.times[i] - this.task.times[i-1];
        const d = this.task.points[i].clone().sub(this.task.points[i-1]);
        rows.push(`<td>${i}</td><td>${t.toFixed(2)}s</td><td>${dt.toFixed(2)}s</td><td>${d.length()|0}m</td><td>${d.z|0}m</td><td>${3.6*d.length()/dt|0}km/h</td>`);
      }
      if (this.task.times.length && this.task.current < this.task.points.length) {
        const t = this.glider.time - this.task.times[0];
        const dt = this.glider.time - this.task.times[this.task.times.length-1];
        rows.push(`<td>${this.task.times.length}</td><td>${t.toFixed(2)}</td><td>${this.task.times.length > 1 ? dt.toFixed(2) : ''}</td>`);
      }
      log.push(`<table style='text-align:right'><tr>${rows.join('</tr><tr>')}</tr></table>`);
    }

    // for (const k in multiplayer.gliders) {
    // 	const g = multiplayer.gliders[k];
    // 	log.push(`${g.speed} ${Date.now() - g.peer.systime} ${g.peer.time} ${JSON.stringify(g.peer.quaternion)}`);
    // }

    return log.join('<br>');
  }
}