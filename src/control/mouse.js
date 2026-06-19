export class Mouse {
  controlEnabled = false;
  dx = 0;
  dy = 0;

  constructor() {
    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.reset, true);
  }

  onPointerMove = (e) => {
    if (!this.controlEnabled) return;
    if (!e.buttons) return;

    const dx = e.movementX;
    const dy = e.movementY;
    const dxdy = Math.abs(dx) > Math.abs(dy);
    
    this.dx =  dxdy ? clamp(dx) : 0;
    this.dy = (!dxdy) ? clamp(dy) : 0;
  }

  reset = () => {
    this.dx = 0;
    this.dy = 0;
  }
}


function clamp(v) { return Math.max(-1, Math.min(1, v)); }