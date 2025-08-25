import THREE from '@/three/three';
import { glider } from '@/glider/glider';
import { camera } from "@/scene/camera";

function lerp(a1, a2, t) {
  return a1 + (a2 - a1) * t;
}

function lerp5(a1, a2, b1, b2, b) {
  return lerp(a1, a2, (b - b1) / (b2 - b1));
}

function anglePos(radius, angle) {
  angle *= Math.PI / 180;
  return [radius * Math.cos(angle), radius * Math.sin(angle)];
}

function drawDivs(ctx, r1, r2, start, end, div, r3, div3) {
  ctx.beginPath();
  for (let a = start; a <= end; a += div) {
    const rr = (div3 && (a - start) % div3 == 0) ? r3 : r2;
    ctx.moveTo(...anglePos(r1, a));
    ctx.lineTo(...anglePos(rr, a));
  }
  ctx.stroke();
}

function drawTriangle(ctx, r, d, a, fillColor) {
  ctx.beginPath();
  ctx.moveTo(...anglePos(r + d, a));
  ctx.lineTo(...anglePos(r, a + 50*d/r));
  ctx.lineTo(...anglePos(r, a - 50*d/r));
  ctx.lineTo(...anglePos(r + d, a));
  if (fillColor != null) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  ctx.stroke();
}


function drawCircle(ctx, radius, fillColor, strokeColor, start = 0, end = 2*Math.PI) {
  ctx.beginPath();
  ctx.arc(0, 0, radius, start, end);
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
  }
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
}

function drawTextOnCircle(ctx, radius, start, end, txt) {
  ctx.lineWidth = .5;
  ctx.strokeStyle = 'white';
  ctx.fillStyle = 'white';
  ctx.font = 'x-small Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < txt.length; i++) {
    const angle = lerp(start, end, i / (txt.length - 1));
    ctx.fillText(txt[i], ...anglePos(radius, angle));
  }
}

function drawTextBox(ctx, x, y, width, txt, height = 11) {
  ctx.fillStyle = 'gray';
  ctx.font = 'x-small Arial, Helvetica, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.beginPath();
  ctx.rect(x-width/2, y-height/2, width, height);
  ctx.fill();
  ctx.fillStyle = 'black';
  ctx.fillText(txt, x + width/2 - 2, y);
}

function speedAngle(v) { return (.25 + v / 300) * 2*Math.PI; };

function preDrawSpeed(half) {
  const canvas = document.createElement('canvas');
  canvas.width = 2 * half;
  canvas.height = 2 * half;
  const ctx = canvas.getContext('2d');

  ctx.translate(half, half);
  ctx.clearRect(-half, -half, 2*half, 2*half);
  drawCircle(ctx, half-1, 'black');
  drawCircle(ctx, half/10, 'white');
  
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'white';
  drawDivs(ctx, half-1, half-6, 90, 90 + 360, 10 / 300 * 360, half-10, 50 / 300 * 360);

  ctx.lineWidth = 3;
  drawCircle(ctx, half-2, '', 'green', speedAngle(60), speedAngle(200));
  drawCircle(ctx, half-2, '', 'yellow', speedAngle(200), speedAngle(280));
  drawCircle(ctx, half-2, '', 'red', speedAngle(280), speedAngle(300));
  
  ctx.lineWidth = .5;
  ctx.strokeStyle = 'white';
  ctx.font = 'x-small Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let v = 0; v < 300; v += 50) {
    const angle = speedAngle(v);
    ctx.fillText(`${v}`, ...anglePos(half-20, angle * 180 / Math.PI));
  }
  ctx.fillText('km/h', 0, 15);

  return canvas;
}

function drawSpeed(ctx, half, x0, canvas) {  
  ctx.save();
  ctx.translate(x0+half, half);
  // ctx.clearRect(-half, -half, 2*half, 2*half);
  ctx.globalCompositeOperation = 'copy';
  ctx.drawImage(canvas, -half, -half);
  ctx.globalCompositeOperation = 'source-over';
  
  drawTextBox(ctx, 0, -20, 21, `${(glider.speed * 3.6 | 0)}`);

  ctx.lineWidth = 3;
  ctx.strokeStyle = 'white';
  const angle = speedAngle(3.6 * glider.speed) * 180 / Math.PI;
  drawDivs(ctx, half-15, 0, angle, angle, 1);

  // drawTextBox(ctx, 0, -20, 24, '123');

  ctx.restore();
}

function drawVario(ctx, half, x0) {
  ctx.save();
  ctx.translate(x0+half, half);
  ctx.clearRect(-half, -half, 2*half, 2*half);
  drawCircle(ctx, half-1, 'black');
  drawCircle(ctx, half/10, 'white');

  ctx.lineWidth = 1;
  ctx.strokeStyle = 'white';
  drawDivs(ctx, half-1, half-5, 180, 180 + 360, 1 / 30 * 360, half-10, 5 / 30 * 360);
  
  drawTextOnCircle(ctx, half-16, 180, 180 + 360 - 60, ['0','5','10','15','10','5'])
  ctx.fillText('m/s', 20, 0);
  ctx.font = 'small Arial, Helvetica, sans-serif';
  ctx.fillText('+', 0, -12);
  ctx.fillText('-', 0, 12);

  const lift = glider.lift.toFixed(1);
  const sign = glider.lift >= 0 ? '+' : '';
  drawTextBox(ctx, 0, -24, 27, sign + lift);

  ctx.lineWidth = 3;
  const varioAngle = 180 + glider.lift / 30 * 360;
  drawDivs(ctx, half-15, 0, varioAngle, varioAngle, 1);

  ctx.restore();
}

function drawLevel(ctx, half, x0) {
  ctx.save();
  ctx.translate(x0+half, half);
  ctx.clearRect(-half, -half, 2*half, 2*half);
  if ([0,1].includes(camera.mode)) ctx.rotate(-glider.roll);
  ctx.beginPath();
  ctx.lineWidth = 1;
  ctx.fillStyle = 'skyBlue';
  ctx.strokeStyle = 'gray';
  ctx.arc(0, 0, half-1, 0, 2*Math.PI);
  ctx.fill();

  const a1 = Math.asin(glider.pitch / (Math.PI/2));
  const a2 = Math.PI - Math.asin(glider.pitch / (Math.PI/2));

  drawCircle(ctx, half-1, 'sienna', '', a1, a2);

  const dx = 5;
  const dy = half / 3;
  ctx.beginPath();
  ctx.strokeStyle = 'black';
  for (let i = -2; i <= 2; i++) {
    const d = i ? 0 : 2.5;
    ctx.moveTo(-dx-d, dy*i);
    ctx.lineTo( dx+d, dy*i);
    if (i) {
      ctx.moveTo(-dx/2, dy*i/3);
      ctx.lineTo( dx/2, dy*i/3);
    }
  }
  ctx.stroke();

  drawTriangle(ctx, half-15, 5, 90);
  drawTriangle(ctx, half-15, 5, -90);
  ctx.rotate(glider.roll);
  drawDivs(ctx, half-1, half-10, 30, 150, 30);
  drawDivs(ctx, half-1, half-10, -150, -30, 30);
  drawDivs(ctx, half-1, half-15, 0, 360, 180);
  drawDivs(ctx, half-1, half-5, 60, 120, 10);
  drawDivs(ctx, half-1, half-5, -120, -60, 10);
  drawTriangle(ctx, half-5, -5, 90, 'sienna');
  drawTriangle(ctx, half-5, -5, -90, 'skyBlue');

  ctx.restore();
}

function drawAltim(ctx, half, x0) {
  ctx.save();
  ctx.translate(x0+half, half);
  ctx.clearRect(-half, -half, 2*half, 2*half);
  drawCircle(ctx, half-1, 'black');
  drawCircle(ctx, half/10, 'white');

  ctx.lineWidth = 1;
  ctx.strokeStyle = 'white';
  
  drawDivs(ctx, half-1, half-5, 90, 90 + 360, 200 / 10000 * 360);
  drawDivs(ctx, half-5, half-10, 90, 90 + 360, 1000 / 10000 * 360);
  
  drawTextOnCircle(ctx, half-16, 90, 90 + 360 - 36, ['0','1','2','3','4','5','6','7','8','9']);
  ctx.fillText('ALT', 0, -15);
  ctx.fillText('m', 0, 15);
  ctx.fillText('x1000', 0, 28);

  drawTextBox(ctx, 0, -28, 27, `${glider.mesh.position.z | 0}`);

  ctx.lineWidth = 3;
  const altAngle100 = 90 + glider.mesh.position.z / 1000 * 360;
  drawDivs(ctx, half-15, 0, altAngle100, altAngle100, 1);
  
  ctx.lineWidth = 5;
  const altAngle1000 = 90 + glider.mesh.position.z / 10000 * 360;
  drawDivs(ctx, half-30, 0, altAngle1000, altAngle1000, 1);

  ctx.restore();
}

class Instruments {
  constructor() {
    this.show = true;

    const half = document.getElementById('instrumentCanvas').height / 2;

    this.preSpeed = preDrawSpeed(half);
  }
  
  update() {
    const canvas = document.getElementById('instrumentCanvas');
    const ctx = canvas.getContext('2d');
    
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    const half = height / 2;
    const deltax = width / 4;
    
    drawSpeed(ctx, half, 0*deltax, this.preSpeed);
    drawVario(ctx, half, 1*deltax);
    drawLevel(ctx, half, 2*deltax);
    drawAltim(ctx, half, 3*deltax);
  
    glider.updateInstrumentTextures();
    canvas.hidden = camera.mode == 0 || !this.show;
  }
}

export const instruments = new Instruments();