import { firebase } from '@/multiplayer/firebase';
import { peerServer } from '@/multiplayer/peerServer';
import { glider as mainGlider, Glider } from '@/glider/glider';
import { wind } from '@/map/wind';
import { gui } from '@/control/gui';
import { devlog } from '@/utils/devlog';

class Multiplayer {
  constructor() {
    this.gliders = [];
    this.nick = localStorage.getItem('nick') || 'anonymous';
    this.lastbroadcast = 0;

    const folder = gui.addFolder('Multiplayer');
    folder.add(this, 'nick').onChange((name) => { localStorage.setItem('nick', name); });
    // folder.add(this, 'connect');
  }

  setScene(scene) {
    this.scene = scene;
  }

  connect() {
    peerServer.broadcast(
      this.connectFirebase.bind(this),
    );
  }

  connectFirebase() {
    firebase.connect(peerServer.peer.id, this.nick, (peers) => {
      devlog('firebase get:', Object.keys(peers).length);
      for (let id in peers) {
        const peer = peers[id];
        if (id == peerServer.peer.id) continue;
        if (Date.now() - peer.time > 60 * 60 * 1000) continue;
        devlog('multiplayer try connect', id, peer.date, peer.nick)
        peerServer.connect(id);
      }
    });
  }

  broadcast(t) {
    this.lastbroadcast = t;
    firebase.broadcast();
  }

  update(t) {
    if (!peerServer.peer || !peerServer.peer.id) return;
    
    if (this.lastbroadcast + 60 * 1000 < t) {
      this.broadcast(t);
    }

    const conns = peerServer.connections;

    for (let conn of conns) {
      if (!conn.open) continue;
      const q = mainGlider.mesh.quaternion;
      const status = {
        nick: this.nick,
        position: mainGlider.mesh.position,
        quaternion: {x:q.x, y:q.y, z:q.z, w:q.w},
        speed: mainGlider.speed,
        time: t,
        systime: Date.now()
      };
      conn.send(status);
      conn.sent++;
      peerServer.sent++;
      gui.updateDisplay();
    }

    for (let conn of conns) {
      if (!conn.open) continue;
      if (Date.now() - conn.lastActive > 5000) continue;
      
      const peer = conn.data;
      if (!peer) continue;
      
      if (this.gliders[conn.peer]) {
        this.gliders[conn.peer].peer = peer;
      }
      else {
        devlog('adding peer glider', peer.nick)
        const glider = mainGlider.clone();
        glider.peer = peer;
        this.gliders[conn.peer] = glider;
        this.scene.add(glider.mesh);
      }
    }

    const outdatedGliders = [];
    for (let id in this.gliders) {
      const glider = this.gliders[id];
      
      if (Date.now() - glider.peer.systime > 2000) {
        outdatedGliders.push(id);
        devlog('outdated', id, t, glider.time)
        continue;
      }

      glider.mesh.position.copy(glider.peer.position);
      glider.mesh.quaternion.copy(glider.peer.quaternion);
      glider.speed = glider.peer.speed;
      
      const dt = (Date.now() - glider.peer.systime) / 1000;
      const windLift = wind.calculateLift(glider.mesh.position);
      glider.move(dt, windLift);
    }

    for (let id of outdatedGliders) {
      this.scene.remove(this.gliders[id].mesh);
      this.scene.remove(this.gliders[id].sprite)
      delete this.gliders[id];
    }
  }

}

export const multiplayer = new Multiplayer();