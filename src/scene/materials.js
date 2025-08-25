import * as THREE from 'three';


export const treeTrunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4d2926, flatShading:true });
export const treeCrownMaterial = new THREE.MeshLambertMaterial({ color: 0x7aa21d, flatShading:true });


export const houseWallMaterial = new THREE.MeshLambertMaterial({ color: 0xd0c080, flatShading:true });
export const houseRoofMaterial = new THREE.MeshLambertMaterial({ color: 0xc00000, flatShading:true });

export const dustBallMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading:true });

// export const waterMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff, flatShading:true, side: THREE.DoubleSide });
export const waterMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff, flatShading:true, side: THREE.DoubleSide, roughness:0 });

export const cloudMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading:false, opacity:.1 });

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


let mapUniforms = {
  minHeight: {value: 0},
  maxHeight: {value: 1300},
}

// map shader based on https://jsfiddle.net/prisoner849/ag09r4pL/

export const mapMaterial = new THREE.MeshLambertMaterial({
  onBeforeCompile: shader => {
    shader.uniforms.minHeight = mapUniforms.minHeight;
    shader.uniforms.maxHeight = mapUniforms.maxHeight;
    shader.vertexShader = `
      varying vec3 vPos;
      ${shader.vertexShader}
    `.replace(
      `#include <begin_vertex>`,
      `#include <begin_vertex>
        vPos = transformed;
      `
    );
    shader.fragmentShader = `
      uniform float minHeight;
      uniform float maxHeight;
      varying vec3 vPos;
      ${shader.fragmentShader}
    `.replace(
      `#include <dithering_fragment>`,
      `
        float h = (vPos.z - minHeight) / (maxHeight - minHeight);
        h = 3. * clamp(h, -0.01, 1.);
        
        float hgrid = vPos.z / 100.;
        float grid = abs(fract(hgrid - 0.5) - 0.5) / fwidth(hgrid) / 1.;
        float line = min(grid, 1.0);
        vec3 lineCol = vec3(0);
        
        #define c0 vec3(0,0,.5)
        #define c1 vec3(0,.5,0)
        #define c2 vec3(0,1,0)
        #define c3 vec3(1,1,0)
        #define c4 vec3(1,0,0)
        if (h <= -0.01)
          lineCol = c0;
        else if (h < 1.)
          lineCol = mix(c1, c2, h);
        else if (h < 2.)
          lineCol = mix(c2, c3, h - 1.);
        else
          lineCol = mix(c3, c4, h - 2.);
        
        vec3 col = mix(lineCol, .5 * lineCol, line);
      
        gl_FragColor = vec4(col, opacity);
      `
    );
  }
});


mapMaterial.defines = {"USE_UV":""};
mapMaterial.extensions = {derivatives: true};
