import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';
import Stats from 'three/addons/libs/stats.module';
import { glider } from '@/glider/glider';
import { wind } from '@/map/wind';
import { setShadowCameraFrustum } from '@/scene/shadow';
import { AudioVario } from '@/sound/audioVario';
import { AirflowSound } from '@/sound/airSound';
import { camera } from '@/scene/camera';
import { gui } from '@/control/gui';
import { scene } from '@/scene/scene';
import { fog, setFog } from '@/scene/fog';
import { instruments } from '@/glider/instruments';
import { task } from '@/control/task';
import { miniMap as map } from '@/map/miniMap';
import { cellManager } from '@/map/cellManager';
import { mapManager } from '@/map/mapManager';
import { multiplayer } from '@/multiplayer/multiplayer';
import { getGamepadState } from '@/control/gamepad';
import { peerServer } from '@/multiplayer/peerServer';
import { collider } from '@/glider/collider';
import { water } from '@/objects/water';
import { clouds } from '@/objects/clouds';

const ui = {
	toggleAudioVario: () => {
		if (audioVario.isPlaying) audioVario.stop();
		else audioVario.start();
	},
	togglePause: () => {
		glider.paused = !glider.paused;
		if (glider.paused) {
			audioVario.stop();
			airflowSound.stop();
		}
		else {
			audioVario.start();
			airflowSound.start();
		}
	},
	toggleHelp: () => {
		const help = document.getElementById("help");
		help.hidden = !help.hidden;
	},
	stats: JSON.parse(localStorage.getItem('stats') || false),
	toggleStats: () => {
		ui.stats = !ui.stats;
		localStorage.setItem('stats', ui.stats);
		stats.showPanel(ui.stats ? 0 : -1);
	},
}

gui.add(ui, 'toggleAudioVario').name('Audio vario [a]');
gui.add(ui, 'togglePause').name('Pause [space]');
gui.add(ui, 'toggleHelp').name('Help [h]');
gui.add(ui, 'toggleStats').name('Stats');

const x = 0;
const y = 0;
// const initpos = new THREE.Vector3(x, y, terrainHeight(x, y) + 300);
const initpos = new THREE.Vector3(500, 1250, 2050);

const audioVario = new AudioVario();
const airflowSound = new AirflowSound();

const stats = new Stats();
stats.showPanel(ui.stats ? 0 : -1);
document.body.appendChild(stats.dom);


cellManager.setScene(scene);
mapManager.setScene(map.scene);

camera.setup(initpos);

setFog();

const renderer = new THREE.WebGLRenderer({antialias:true, logarithmicDepthBuffer:true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);

function createDirectionalLight(range, resolution) {
	const light = new THREE.DirectionalLight(0xffffff, 1);
	light.shadow.camera.far = 10000;
	light.castShadow = true;
	if (range) {
		light.shadow.camera.left = -range;
		light.shadow.camera.right = range;
		light.shadow.camera.top = range;
		light.shadow.camera.bottom = -range;
	}
	if (resolution) {
		light.shadow.mapSize = new THREE.Vector2(resolution, resolution);
	}
	light.shadow.bias = .000001;
	return light;
}

// const directionalLight = createDirectionalLight(8);
// const directionalLight = createDirectionalLight(500, 4096);
const directionalLight = createDirectionalLight(1000, 4096);


scene.add(ambientLight);
scene.add(directionalLight);

multiplayer.setScene(scene);

window.addEventListener('resize', () => {
	camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

task.toScene(scene);
collider.toScene(scene);
clouds.toScene(scene);
scene.add(water);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;




const pointer = {
	x0: 0,
	y0: 0,
	dx: 0,
	dy: 0,
};

function clamp(v) { return Math.max(-1, Math.min(1, v)); }

// document.addEventListener('pointerdown', e => {
// 	if (glider.paused) return;
// 	pointer.x0 = e.clientX;
// 	pointer.y0 = e.clientY;
// });

document.addEventListener('pointermove', e => {
	if (glider.paused) {
		pointer.dx = 0;
		pointer.dy = 0;
		return;
	}

	if (!e.buttons) return;

	// const dx = e.clientX - pointer.x0;
	// const dy = e.clientY - pointer.y0;
	const dx = e.movementX;
	const dy = e.movementY;
	const dxdy = Math.abs(dx) > Math.abs(dy);
	
	pointer.dx =  dxdy ? clamp(dx) : 0;
	pointer.dy = (!dxdy) ? clamp(dy) : 0;
});

document.addEventListener('pointerup', () => {
	pointer.dx = 0;
	pointer.dy = 0;
});

const keys = {}

function jump(dx, dy, dz) {
	const c = keys['Control'] ? (keys['Alt'] ? 10 : 100) : (keys['Alt'] ? 10000 : 1000);
	const delta = new THREE.Vector3(c*dx, c*dy, c*dz);
	glider.mesh.position.add(delta);
	camera.position.add(delta);
}

document.addEventListener("keydown", (e) => { 
	const newPress = (key) => { return e.key == key && !keys[key]; };
	
	if (newPress('Escape')) {
		if (gui._closed) {
			gui.open();
			gui.domElement.children[0].focus();
		}
		else {
			gui.close();
			document.activeElement.blur();
		}
	}

	if (document.activeElement != document.body) return;

	if (!keys.Shift && newPress('PageUp')) {
		map.changeScale(.5);
	}
	if (!keys.Shift && newPress('PageDown')) {
		map.changeScale(2);
	}
	
	keys[e.key] = 1;
}, true);

document.addEventListener("keyup", (e) => { keys[e.key] = 0; }, true);

document.addEventListener("keypress", (e) => {
	if (e.key == '?') {
	}

	if (document.activeElement != document.body) return;

	if (e.key == 'h') {
		ui.toggleHelp();
	}
	if (e.key == 'c') {
		camera.changeMode();
	}
	// if (e.key == 'i') {
	// 	instruments.show ^= true;
	// }
	// if (e.key == 'm') {
	// 	map.show ^= true;
	// }
	// if (e.key == 'n') {
	// 	map.north ^= true;
	// }
	if (e.key == 'a') {
		ui.toggleAudioVario();
	}
	// if (e.key == 's') {
	// 	if (airflowSound.isPlaying) airflowSound.stop();
	// 	else airflowSound.start();
	// }
	if (e.key == ' ') {
		ui.togglePause();
	}
	if (e.key == '1') {
		camera.setMode(0);
	}
	if (e.key == '2') {
		camera.setMode(1);
	}
	if (e.key == '3') {
		camera.setMode(2);
	}
	if (e.key == '4') {
		camera.setMode(3);
	}

	if (e.key == 'g') {
		glider.toggleGear();
	}

}, true);


let last = 0;
let lastVario = 0;
function animate(t) {
	if (ui.stats) stats.begin();

	let dt = (t - last) / 1000;
	last = t;
	if (keys['[']) dt *= .5;
	if (keys[']']) dt *= 2;

	const s = Math.sin(glider.yaw) * dt;
	const c = Math.cos(glider.yaw) * dt;

	if (keys.Shift) {
		if (keys.ArrowUp)    jump(s,c,0);
		if (keys.ArrowDown)  jump(-s,-c,0);
				
		if (keys.ArrowLeft)  jump(-c,s,0);
		if (keys.ArrowRight) jump(c,-s,0);
		
		if (keys.PageUp)     jump(0,0,dt);
		if (keys.PageDown)   jump(0,0,-dt);

		if (keys['<'])       glider.rotateZ(dt);
		if (keys['>'])       glider.rotateZ(-dt);
	}
		
	if (!keys['Shift']) {	
		if (keys.ArrowUp)    glider.setElevatorControl(-1);
		if (keys.ArrowDown)  glider.setElevatorControl(1);

		if (keys.ArrowLeft)  glider.setAileronsControl(-1);
		if (keys.ArrowRight) glider.setAileronsControl(1);

		if (keys[','])       glider.setRudderControl(-1);
		if (keys['.'])       glider.setRudderControl(1);
	}

	const gamepad = getGamepadState();
	if (gamepad) {
		if (gamepad.buttons[0].pressed) glider.setElevatorControl(-1);
		if (gamepad.buttons[2].pressed) glider.setElevatorControl(1);

		if (gamepad.buttons[1].pressed) glider.setAileronsControl(1);
		if (gamepad.buttons[3].pressed) glider.setAileronsControl(-1);
	}

	glider.setElevatorControl(pointer.dy);
	glider.setAileronsControl(pointer.dx);

	glider.setAccelerateControl(keys['v']|0);
	glider.setBrakeControl(keys['b']|0);

	const windLift = wind.calculateLift(glider.mesh.position);

	glider.move(dt, windLift);

	water.position.x = glider.mesh.position.x;
	water.position.y = glider.mesh.position.y;

	clouds.update(glider.forward().multiplyScalar(fog.far / 2).add(glider.mesh.position), wind.vector().multiplyScalar(dt));

	multiplayer.update(t);
	
	task.update(glider.mesh.position);

	water.material.uniforms['time'].value -= dt;

	camera.update(glider, controls);

	instruments.update();

	setShadowCameraFrustum(directionalLight, glider.mesh);
	
	renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
	renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
	renderer.setScissorTest(true);
	renderer.render(scene, camera);

	if (map.show) {
		map.cam.position.copy(glider.mesh.position);
		map.cam.rotation.z = map.north ? Math.PI : Math.PI - glider.yaw;
		map.cam.updateProjectionMatrix();
		
		renderer.setViewport(0, 0, map.size, map.size);
		renderer.setScissor(0, 0, map.size, map.size);
		renderer.setScissorTest(true);
		renderer.render(map.scene, map.cam);
		map.drawOverlay(glider, wind);
	}
	else {
		map.clearOverlay();
	}

	if (t > lastVario + 500) {
		lastVario = t;
		audioVario.setLiftRate(glider.lift);
	}

	airflowSound.setAirspeed(glider.speed * 3.6);
  
  if (Math.random() < 0.05) {
    airflowSound.addTurbulence(0.2);
  }

	cellManager.update(glider.mesh.position.x, glider.mesh.position.y);
	mapManager.update(glider.mesh.position.x, glider.mesh.position.y);

	collider.update(dt);

	if (ui.stats) {
		let log = [`build ${__BUILD_TIMESTAMP__}`, `id ${peerServer.peerId}`, `${multiplayer.nick}, sent: ${peerServer.sent}, rec: ${peerServer.received}`];
		for (let id in multiplayer.gliders) {
			const peer = multiplayer.gliders[id];
			log.push(`${peer.peer.nick}, dt: ${peer.peer.systime - Date.now()}, sent: ${peer.peer.sent}, rec: ${peer.peer.received}`)
		}
		log.push('<b>flight</b> time: ' + glider.time.toFixed(2));
		log.push(`trees: ${cellManager.treeCnt}`)
		log.push(`houses: ${cellManager.houseCnt}`)
		log.push(`collider balls: ${collider.balls.length}`)
		if (task.times.length) {
			log.push('');
			let rows = ['<td></td><td>time</td><td>Δt</td><td>dst</td><td>Δh</td><td>Vavg</td>'];
			for (let i = 1; i < task.times.length; i++) {
				const t = task.times[i] - task.times[0];
				const dt = task.times[i] - task.times[i-1];
				const d = task.points[i].clone().sub(task.points[i-1]);
				rows.push(`<td>${i}</td><td>${t.toFixed(2)}s</td><td>${dt.toFixed(2)}s</td><td>${d.length()|0}m</td><td>${d.z|0}m</td><td>${3.6*d.length()/dt|0}km/h</td>`);
			}
			if (task.times.length && task.current < task.points.length) {
				const t = glider.time - task.times[0];
				const dt = glider.time - task.times[task.times.length-1];
				rows.push(`<td>${task.times.length}</td><td>${t.toFixed(2)}</td><td>${task.times.length > 1 ? dt.toFixed(2) : ''}</td>`);
			}
			log.push(`<table style='text-align:right'><tr>${rows.join('</tr><tr>')}</tr></table>`);
		}

		// for (const k in multiplayer.gliders) {
		// 	const g = multiplayer.gliders[k];
		// 	log.push(`${g.speed} ${Date.now() - g.peer.systime} ${g.peer.time} ${JSON.stringify(g.peer.quaternion)}`);
		// }
		document.getElementById('logDiv').innerHTML = log.join('<br>');
	}
	else {
		document.getElementById('logDiv').innerHTML = '';
	}

	if (ui.stats) stats.end();
}

glider.load(initpos, (glider) => {
	controls.target = glider.mesh.position;
	scene.add(glider.mesh);
	directionalLight.target = glider.mesh;
	task.generate();
	instruments.update();
	renderer.setAnimationLoop(animate);
});

