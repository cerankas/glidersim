import * as GL from 'three';
import * as GPU from 'three/webgpu';

const isGPU = 0;

const THREE = isGPU ? GPU : GL;

export default { ...THREE, isGPU};

console.log(`THREE ${isGPU ? 'WebGPU' : 'WebGL'}`)