import * as THREE from 'three/webgpu';
import { ResizeHandle } from '@/ui/resizeHandle';


const m = new THREE.Matrix4();

export class MiniMap {
  constructor() {
    this.scale = 16000; // length in m corresponding to min(map width, map height)
    this.north = false;

    this.canvas = document.getElementById('mapCanvas');
    this.canvas.width = parseFloat(localStorage.getItem('mapWidth')) || window.innerHeight / 3;
    this.canvas.height = parseFloat(localStorage.getItem('mapHeight')) || window.innerHeight / 3;
    
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.AmbientLight(0xffffff, Math.PI * 0.25));
            
    this.cam = new THREE.OrthographicCamera();
    this.cam.near = -10000;
    this.cam.far = 10000;
    this.cam.up.set(0,-1,0);
    this.cam.position.set(0,0,1);
    this.cam.lookAt(0,0,0);
    this.cam.updateProjectionMatrix();

    this.updateCameraFrustum();

    this.resizeHandle = new ResizeHandle(
      {
        x: this.width, 
        y: this.height, 
        ...this.resizingRange()
      }, 
      this.setScreenSize
    );

    window.addEventListener('resize', this.onWindowResize);

    this.visible = JSON.parse(localStorage.getItem('mapVisible') | 'true');
  }

  get width() { return this.canvas.width; }
  get height() { return this.canvas.height; }

  get visible() { return this._visible; }

  set visible(state) {
    this._visible = state;
    this.resizeHandle.handle.style.visibility = state ? 'visible' : 'hidden';
    localStorage.setItem('mapVisible', state);
  }

  onWindowResize = () => {
    this.resizeHandle.setRange(this.resizingRange());
    this.setScreenSize(this.resizeHandle.x, this.resizeHandle.y);
  }

  mapDataRange() {
    const min = Math.min(this.width, this.height);
    const max = Math.max(this.width, this.height);
    const range = this.scale * max / min;
    return range;
  }

  resizingRange() {
    return {
      minx: 100,
      miny: 100,
      maxx: window.innerWidth,
      maxy: window.innerHeight,
    }
  }

  setScreenSize = (width, height) => {
    this.canvas.width = width;
    this.canvas.height = height;
    localStorage.setItem('mapWidth', width);
    localStorage.setItem('mapHeight', height);
    this.updateCameraFrustum();
  }
  
  changeScale(factor) {
    this.scale = Math.min(256000, Math.max(500, this.scale * factor));
    this.updateCameraFrustum();
  }

  updateCameraFrustum() {
    const size = Math.min(this.width, this.height);

    const frustumWidth = this.width / size * this.scale;
    const frustumHeight = this.height / size * this.scale;

    this.cam.left = frustumWidth / 2;
    this.cam.right = -frustumWidth / 2;
    this.cam.top = -frustumHeight / 2;
    this.cam.bottom = frustumHeight / 2;
  }

  drawOverlay(glider, wind, task, multiplayerGliders, worldTiles, collidable) {
    const ctx = this.canvas.getContext('2d');

    const size = Math.min(this.width, this.height);
    
    const scale = size / this.scale;

    ctx.clearRect(0, 0, this.width, this.height);

    const fontSize = 300 * Math.min(this.width, this.height) / Math.min(window.innerWidth, window.innerHeight);

    ctx.font = `${fontSize}% Arial, Helvetica, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';

    const textMetrics = ctx.measureText('');
    const textHeight = textMetrics.fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent;

    ctx.fillStyle = 'white'
    ctx.strokeStyle = 'white';
    
    ctx.save();
    ctx.translate(this.width/2, this.height/2);
    {
      if (task.points.length) {
        // visited task checkpoints
        ctx.save();
        if (!this.north) ctx.rotate(-glider.yaw);
        const x0 = scale * glider.mesh.position.x;
        const y0 = -scale * glider.mesh.position.y;
        const t = task;
        ctx.strokeStyle = '#c0c0c0';
        for (let i = 0; i < t.current; i++) {
          const x = scale * t.points[i].x - x0;
          const y = -scale * t.points[i].y - y0;
          ctx.beginPath();
          ctx.arc(x, y, t.radius * scale, 0, 2*Math.PI);
          ctx.stroke();
        }
  
        // task path
        let prev = [0,0];
        for (let i = t.current; i < t.points.length; i++) {
          const x = scale * t.points[i].x - x0;
          const y = -scale * t.points[i].y - y0;
          ctx.beginPath();
          ctx.moveTo(...prev);
          ctx.strokeStyle = i == t.current ? '#ff0000' : '#0000ff';
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x, y, t.radius * scale, 0, 2*Math.PI);
          ctx.stroke();
          prev = [x,y];
        }
        ctx.restore();
      }

      // wind symbol
      ctx.save();
      if (!this.north) ctx.rotate(-glider.yaw);
      ctx.rotate(wind.direction * Math.PI/180);
      const d = 20;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let off = -10; off <= 10; off += 10) {
        ctx.moveTo(off,d+15);
        ctx.lineTo(off,d);
        ctx.lineTo(off-3,d+3);
        ctx.moveTo(off,d);
        ctx.lineTo(off+3,d+3);
      }
      ctx.stroke();
      ctx.restore();

      // peer glider symbols
      for (let id in multiplayerGliders) {
        const peer = multiplayerGliders[id];
        ctx.save();
        ctx.strokeStyle = 'black';
        if (!this.north) ctx.rotate(-glider.yaw);
        const x = scale * (peer.mesh.position.x - glider.mesh.position.x);
        const y = -scale * (peer.mesh.position.y - glider.mesh.position.y);
        ctx.translate(x,y);
        ctx.rotate(peer.yaw);
        ctx.lineWidth = 2;
        ctx.fillStyle = 'black';
        for (let i = 0; i < 4; i++) {
          ctx.fillText(`${(peer.mesh.position.z - glider.mesh.position.z)|0}m`,5,8);
        }
        ctx.beginPath();
        ctx.moveTo(0,10);
        ctx.lineTo(0,-5);
        ctx.moveTo(-3,10);
        ctx.lineTo(3,10);
        ctx.moveTo(-15,0);
        ctx.lineTo(15,0);
        ctx.stroke();
        ctx.restore();
      }

      // glider symbol
      if (this.north) ctx.rotate(glider.yaw);
      ctx.beginPath();
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 1.5;
      ctx.moveTo(0,10);
      ctx.lineTo(0,-5);
      ctx.moveTo(-3,10);
      ctx.lineTo(3,10);
      ctx.moveTo(-15,0);
      ctx.lineTo(15,0);
      ctx.stroke();
      
    }
    ctx.restore();

    // north symbol
    ctx.save();
    ctx.translate(this.width - 15, 15);
    if (!this.north) ctx.rotate(-glider.yaw);
    ctx.beginPath();
    ctx.lineWidth = 1.5;
    ctx.moveTo(0,-10);
    ctx.lineTo(-5,10);
    ctx.lineTo(0,5);
    ctx.stroke();
    ctx.beginPath()
    ctx.moveTo(0,-10);
    ctx.lineTo(5,10);
    ctx.lineTo(0,5);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // task
    if (task.toTarget) {
      ctx.fillText(`dst: ${Math.sqrt(task.toTarget.x**2 + task.toTarget.y**2)|0} m`,5,textHeight);
      ctx.fillText(`Δh: ${-task.toTarget.z|0} m`,5,2*textHeight);
    }

    // position
    const x = glider.mesh.position.x;
    const y = glider.mesh.position.y;
    ctx.fillText(`${(Math.abs(y/1000)).toFixed(3)} ${y >= 0 ? 'N' : 'S'}`, 5, this.height - 1 * textHeight);
    ctx.fillText(`${(Math.abs(x/1000)).toFixed(3)} ${x >= 0 ? 'E' : 'W'}`, 5, this.height - 0 * textHeight);

    // map scale indicator
    const half = size / 8; // half of the map scale indicator width
    ctx.save();
    ctx.translate(this.width - half - 5, this.height - 5);
    ctx.beginPath();
    ctx.lineWidth = 1.5;
    ctx.moveTo(-half, -3);
    ctx.lineTo(-half, 3);
    ctx.moveTo(-half, 0);
    ctx.lineTo(half, 0);
    ctx.moveTo(half, -3);
    ctx.lineTo(half, 3);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillText(`${this.scale / 4} m`, 0, 0);
    ctx.restore();

    // draw tileManager helper
    ctx.save();
    ctx.translate(this.width/2, this.height/2);
    if (!this.north) ctx.rotate(-glider.yaw);
    ctx.lineWidth = .5;

    //draw rectangle for every world tile
    for (const tile of worldTiles) {
      ctx.save();
      const x = scale * (tile.x - glider.mesh.position.x);
      const y = -scale * (tile.y - glider.mesh.position.y);
      ctx.translate(x,y);
      const s = scale * tile.tileSize;
      ctx.strokeRect(-s/2,-s/2,s,s);
      ctx.restore();
    }

    // draw visibility circle
    ctx.beginPath();
    ctx.arc(0, 0, scale * 3000, 0, 2 * Math.PI);
    ctx.stroke();

    // draw collidable area
    {
      ctx.save();
      const x = scale * (collidable.x - glider.mesh.position.x);
      const y = -scale * (collidable.y - glider.mesh.position.y);
      ctx.translate(x,y);
      const s = scale * collidable.size;
      ctx.strokeRect(-s/2,-s/2,s,s);
      ctx.restore();

      // draw collidable houses
      for (let i = 0; i < collidable.houses.count; i++) {
        collidable.houses.getMatrixAt(i, m);
        const x = scale * (m.elements[12] - glider.mesh.position.x);
        const y = -scale * (m.elements[13] - glider.mesh.position.y);
        const s = scale * 7;
        ctx.save();
        ctx.translate(x,y);
        ctx.fillStyle = 'red';
        ctx.fillRect(-s/2,-s/2,s,s);
        ctx.restore();
      }

      // draw collidable trees
      for (let i = 0; i < collidable.trees.count; i++) {
        collidable.trees.getMatrixAt(i, m);
        const x = scale * (m.elements[12] - glider.mesh.position.x);
        const y = -scale * (m.elements[13] - glider.mesh.position.y);
        const s = scale * 4;
        ctx.save();
        ctx.translate(x,y);
        ctx.fillStyle = 'green';
        ctx.fillRect(-s/2,-s/2,s,s);
        ctx.restore();
      }
    }
    ctx.restore();
  }
  
  clearOverlay() {
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.width, this.height);
  }
}