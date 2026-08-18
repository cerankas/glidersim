import * as THREE from 'three/webgpu';
import { Fn, vec3, If, mix, fwidth, min, texture, uv } from 'three/tsl';


export const vertexColorMaterial = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });

export const dustBallMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading:true });

export const terrainMaterial = new THREE.MeshLambertMaterial({ flatShading: false });

new THREE.TextureLoader().load("textures/camo.jpg", (map) => {
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  terrainMaterial.map = map;
  terrainMaterial.needsUpdate = true;

  const ctx = document.createElement('canvas').getContext('2d', {willReadFrequently:true});
  ctx.canvas.width = map.width;
  ctx.canvas.height = map.height;
  ctx.drawImage(map.image, 0, 0);

  const color = new THREE.Color();

  terrainMaterial.getPixelColor = ((x, y) => {
    const px = (x / 1000 % 1 + 1) % 1 * map.width | 0;
    const py = (y / 1000 % 1 + 1) % 1 * map.height | 0;
    
    const pixel = ctx.getImageData(px, map.height - 1 - py, 1, 1).data;
    
    return color.set((pixel[0] << 16) + (pixel[1] << 8) + pixel[2])
    .convertLinearToSRGB()
    .getHex();
  });
});


// map shader based on https://jsfiddle.net/prisoner849/ag09r4pL/

const mapColors = {
  c0: new THREE.Color().setRGB(0,0,.5),
  c1: new THREE.Color().setRGB(0,.5,0),
  c2: new THREE.Color().setRGB(0,1,0),
  c3: new THREE.Color().setRGB(1,1,0),
  c4: new THREE.Color().setRGB(1,0,0),
}

const mapColorNode = Fn(([height]) => {
  const h = height.mul(3/1300).toVar();
  const lineCol = vec3( 0, 0, 0 ).toVar( );

  If(h.lessThan(0), () => { lineCol.assign(mapColors.c0); })
  .ElseIf(h.lessThan(1), () => { lineCol.assign(mix(mapColors.c1, mapColors.c2, h)); })
  .ElseIf(h.lessThan(2), () => { lineCol.assign(mix(mapColors.c2, mapColors.c3, h.sub(1))); })
  .Else(() => { lineCol.assign(mix(mapColors.c3, mapColors.c4, h.sub(2))); });

  const hgrid = height.div(250).toVar();
  const hgrid2 = height.div(50).toVar();
  const grid = hgrid.sub(.5).fract().sub(.5).abs().div(fwidth(hgrid)).toVar();
  const grid2 = hgrid2.sub(.5).fract().sub(.5).abs().div(fwidth(hgrid2)).toVar();
  const line = min(grid, 1);
  const line2 = min(grid2, 1);
  const col = mix(lineCol, lineCol.mul(.66), line);
  const col2 = mix(col, col.mul(.66), line2);
  return col2.pow(2.2); 
});

export class HeightMapMaterial extends THREE.MeshBasicNodeMaterial {
  constructor(heightTexture) {
    const sampledHeight = texture(heightTexture, uv()).r;
    super({outputNode: mapColorNode(sampledHeight)});
  }
}