export class ResizeHandle {
  constructor({x, y, width=20, height=20, minx, miny, maxx, maxy}, resizeCallback) {
    this.dragging = false;
    
    this.handle = document.createElement('canvas');

    this.setRange({minx, miny, maxx, maxy}, false);

    this.setPosition(x, y);

    this.handle.width = width;
    this.handle.height = height;
    this.handle.style.marginLeft = `${-width/2}px`;
    this.handle.style.marginBottom = `${-height/2}px`;
    this.handle.style.position = 'absolute';
    this.handle.style.cursor = 'nesw-resize';
    document.body.appendChild(this.handle);
    this.draw(this.handle.getContext('2d'), width, height);

    this.handle.addEventListener('pointerdown', this.onPointerDown);
    document.addEventListener('pointerup', this.onPointerUp);
    document.addEventListener('pointermove', this.onPointerMove);

    this.resizeCallback = resizeCallback;
  }

  setRange({minx, miny, maxx, maxy}, clampPositionToRange = true) {
    this.minx = minx;
    this.miny = miny;
    this.maxx = maxx;
    this.maxy = maxy;

    if (clampPositionToRange) {
      this.setPosition(this.x, this.y);
    }
  }

  setPosition(x, y) {
    if (x < this.minx) x = this.minx;
    if (x > this.maxx) x = this.maxx;
    if (y < this.miny) y = this.miny;
    if (y > this.maxy) y = this.maxy;
    
    this.x = x;
    this.y = y;

    this.handle.style.left = `${this.x}px`;
    this.handle.style.bottom = `${this.y}px`;
  }

  onPointerDown = (e) => {
    this.dragging = true;
    e.stopPropagation();
  }

  onPointerUp = (e) => {
    this.dragging = false;
  }

  onPointerMove = (e) => {
    if (this.dragging) {
      this.setPosition(e.clientX, window.innerHeight - e.clientY);
      this.resizeCallback(this.x, this.y);
    }
  }
  
  draw = (ctx, width, height) => {
    const w = width / 2;
    const h = height / 2;
    const d = 3;
    ctx.strokeStyle = 'white';
    ctx.translate(w, h);
    ctx.beginPath();
    ctx.moveTo(-w, 0);
    ctx.lineTo(0, 0);
    ctx.lineTo(0, h);
    ctx.moveTo(-w, -d);
    ctx.lineTo(d, -d);
    ctx.lineTo(d, h);
    ctx.stroke();
  }
}