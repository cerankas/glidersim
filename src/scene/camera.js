import * as THREE from 'three';
import { CockpitView } from './cockpitView';
import { TailView } from './tailView';
import { FollowView } from './followView';
import { FreeView } from './freeView';


export class Camera extends THREE.PerspectiveCamera {
  orbitingEnabled = true;
  dragging = false;
  views = [new CockpitView(), new TailView(), new FollowView(), new FreeView()];
  view = this.views[2];
  
  constructor() {
    super(75, window.innerWidth / window.innerHeight, .01, 5000);
  }

  bindInput(domElement) {
    domElement.addEventListener('pointerdown', this.onPointerDown);
    domElement.addEventListener('pointerup', this.onPointerUp);
    domElement.addEventListener('pointermove', this.onPointerMove);
    domElement.addEventListener('wheel', this.onWheel);
  }

  onPointerDown = (e) => {
    if (!this.orbitingEnabled) return;
    if (e.button == 0) {
      this.dragging = true;
    }
    if (e.button == 2) {
      this.resetOrbiting();
      e.preventDefault();
    }
  }

  onPointerUp = (e) => {
    this.dragging = false;
  }

  onPointerMove = (e) => {
    if (!this.orbitingEnabled) return;
    if (!this.dragging) return;
    const span = document.body.clientHeight / 3;
    this.view.onPan(e.movementX / span, e.movementY / span);
  }

  onWheel = (e) => {
    this.view.onZoom(1.1 ** (e.deltaY > 0 ? 1 : -1));
  }

  resetOrbiting() {
    this.view.reset();
  }

  setNextMode() {
    const viewIndex = this.views.indexOf(this.view);
    this.setMode((viewIndex + 1) % this.views.length);
  }
  
  setMode(viewIndex) {
    this.view = this.views[viewIndex];
  }
  
  setup(position) {
    this.position.set(2,-20,5).add(position);
    this.view.setup?.(this.position);
  }
  
  update(glider) {
    this.view.update(this, glider);
  }
}