import * as THREE from 'three/webgpu';
import { Fn, positionGeometry, vec3, If, mix, fwidth, min } from 'three/tsl';


export const treeTrunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4d2926, flatShading:true });
export const treeCrownMaterial = new THREE.MeshLambertMaterial({ color: 0x7aa21d, flatShading:true });


export const houseWallMaterial = new THREE.MeshLambertMaterial({ color: 0xd0c080, flatShading:true });
export const houseRoofMaterial = new THREE.MeshLambertMaterial({ color: 0xc00000, flatShading:true });

export const dustBallMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading:true });

export const terrainMaterial = new THREE.MeshLambertMaterial({ flatShading: false });

new THREE.TextureLoader().load("textures/moro.jpg", (map) => {
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  terrainMaterial.map = map;
  const ctx = document.createElement('canvas').getContext('2d', {willReadFrequently:true});
  ctx.canvas.width = map.image.width;
  ctx.canvas.height = map.image.height;
  ctx.drawImage(map.image, 0, 0);
  const pixel = ctx.getImageData(5, 5, 1, 1).data;
  terrainMaterial.getPixelColor = ((x, y) => {
    const coord = v => ((((v % 1000) + 1000) % 1000) * 1024 / 1000) | 0;
    const pixel = ctx.getImageData(coord(x), 1023 - coord(y), 1, 1).data;
    // return pixel[0]*0x10000 + pixel[1] * 0x100 + pixel[2];
    return new THREE.Color(pixel[0]*0x10000 + pixel[1] * 0x100 + pixel[2]).convertLinearToSRGB().getHex();
  }).bind(ctx);
});


// map shader based on https://jsfiddle.net/prisoner849/ag09r4pL/

const mapColors = {
  c0: new THREE.Color().setRGB(0,0,.5),
  c1: new THREE.Color().setRGB(0,.5,0),
  c2: new THREE.Color().setRGB(0,1,0),
  c3: new THREE.Color().setRGB(1,1,0),
  c4: new THREE.Color().setRGB(1,0,0),
}

const mapColorNode = Fn(() => {
  const h = positionGeometry.z.mul(3/1300).toVar();
  const lineCol = vec3( 0, 0, 0 ).toVar( );

  If(h.lessThan(0), () => { lineCol.assign(mapColors.c0); })
  .ElseIf(h.lessThan(1), () => { lineCol.assign(mix(mapColors.c1, mapColors.c2, h)); })
  .ElseIf(h.lessThan(2), () => { lineCol.assign(mix(mapColors.c2, mapColors.c3, h.sub(1))); })
  .Else(() => { lineCol.assign(mix(mapColors.c3, mapColors.c4, h.sub(2))); });

  const hgrid = positionGeometry.z.div(250).toVar();
  const hgrid2 = positionGeometry.z.div(50).toVar();
  const grid = hgrid.sub(.5).fract().sub(.5).abs().div(fwidth(hgrid)).toVar();
  const grid2 = hgrid2.sub(.5).fract().sub(.5).abs().div(fwidth(hgrid2)).toVar();
  const line = min(grid, 1);
  const line2 = min(grid2, 1);
  const col = mix(lineCol, lineCol.mul(.66), line);
  const col2 = mix(col, col.mul(.66), line2);
  return col2.pow(2.2); 
});

export const mapMaterial = new THREE.MeshBasicNodeMaterial({outputNode:  mapColorNode()});