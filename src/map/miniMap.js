import * as THREE from 'three';
import { task } from '@/control/task';
import { multiplayer } from '@/multiplayer/multiplayer';

class MiniMap {
  constructor() {
    this.size = 300;
    this.range = 2000;
    this.north = false;
    this.show = true;

    this.canvas = document.getElementById('mapCanvas');
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.AmbientLight(0xffffff, Math.PI * 0.25));
            
    this.cam = new THREE.OrthographicCamera(this.range, -this.range, -this.range, this.range, -10000, 10000);
    this.cam.up.set(0,-1,0);
    this.cam.position.set(0,0,1);
    this.cam.lookAt(0,0,0);
    this.cam.updateProjectionMatrix();
  }
  
  changeScale(factor) {
    this.range = Math.min(64000, Math.max(500, this.range * factor));
    this.cam.left = this.range;
    this.cam.right = -this.range;
    this.cam.top = -this.range;
    this.cam.bottom = this.range;
  }

  drawOverlay(glider, wind) {
    const ctx = this.canvas.getContext('2d');
    const size = this.size;
    const scale = this.size / this.range / 2;

    ctx.clearRect(0, 0, size, size);

    ctx.font = 'x-small Arial, Helvetica, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = 'white'
    ctx.strokeStyle = 'white';
    
    ctx.save();
    ctx.translate(size/2, size/2);
    {
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
      for (let id in multiplayer.gliders) {
        const peer = multiplayer.gliders[id];
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
    ctx.translate(size - 15, 15);
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
    ctx.fillText(`dst: ${Math.sqrt(task.toTarget.x**2 + task.toTarget.y**2)|0} m`,5,10);
    ctx.fillText(`Δh: ${-task.toTarget.z|0} m`,5,20);

    // position
    const x = glider.mesh.position.x;
    const y = glider.mesh.position.y;
    ctx.fillText(`${(Math.abs(y/1000)).toFixed(3)} ${y >= 0 ? 'N' : 'S'}`, 5, size - 15);
    ctx.fillText(`${(Math.abs(x/1000)).toFixed(3)} ${x >= 0 ? 'E' : 'W'}`, 5, size - 5);

    // map scale indicator
    const half = size / 8;
    ctx.save();
    ctx.translate(size - half - 5, size - 5);
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
    ctx.fillText(`${this.range / 2} m`, 0, -5);
    ctx.restore();
  }
  
  clearOverlay() {
    const ctx = this.canvas.getContext('2d');
    const size = this.size;
    ctx.clearRect(0, 0, size, size);
  }
}

export const miniMap = new MiniMap();