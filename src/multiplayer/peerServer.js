import { Peer } from "peerjs";
import { gui } from '@/control/gui';
import { devlog } from "@/utils/devlog";

class PeerServer {
  constructor() {
    this.peer = null;
    this.connections = [];
    this.sent = 0;
    this.received = 0;
    this.peerId = '';

    // this.folder = gui.addFolder('Network');
    // this.folder.add(this, 'peerId');
    // this.folder.add(this, 'sent');
    // this.folder.add(this, 'received');
  }

  broadcast(openCallback) {
    if (!this.peer) this.peer = new Peer(localStorage.getItem('peerId') || undefined);

    this.peer.on('open', ((id) => { 
      devlog('peer on open', id)
      this.peerId = id;
      gui.updateDisplay();
      localStorage.setItem('peerId', id);
      openCallback(id);
    }).bind(this));

    this.peer.on('connection', (conn) => {
      devlog('connected to', conn.peer)
      this.connections.push(conn);
      conn.on('data', this.onData.bind(conn));
      conn.on('error', (e) => { devlog('connection error', e); })
      conn.sent = 0;
      conn.received = 0;
      conn.lastActive = Date.now();
    });

    this.peer.on('error', (e) => { devlog('peer error', e.name, e.type); })
  }

  onData(data) {
    this.data = data; 
    this.received++; 
    this.lastActive = Date.now();
    data.received = this.received; 
    data.sent = this.sent; 
    peerServer.received++; 
  }

  connect(peerId) {
    const conn = this.peer.connect(peerId);
    this.connections.push(conn);
    conn.on('data', this.onData.bind(conn));
    conn.on('error', (e) => { devlog('connection error', e); })
    conn.sent = 0;
    conn.received = 0;
    devlog('peer try connect', peerId, this.connections)
  }
}

export const peerServer = new PeerServer();