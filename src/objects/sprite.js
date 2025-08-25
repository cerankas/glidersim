import * as THREE from 'three';

export function createTextSprite() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 1024;
  canvas.height = 128;
  
  ctx.font = 'Bold 60px Arial';
  ctx.fillStyle = 'back';
  ctx.textAlign = 'center';
  
  const map = new THREE.CanvasTexture(canvas);
  
  const spriteMaterial = new THREE.SpriteMaterial({ map: map });
  const sprite = new THREE.Sprite(spriteMaterial);
  
  sprite.scale.set(10, 1.25, 1);
  sprite.initScale = sprite.scale.clone();
  sprite.ctx = ctx;

  sprite.setText = (text) => {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    map.needsUpdate = true;
  }
  
  return sprite;
}