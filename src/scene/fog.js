import * as THREE from 'three';
import { guiSettings } from "@/control/gui";
import { scene } from '@/scene/scene';
import { camera } from '@/scene/camera';

export const fog = new THREE.Fog(0xd0d0ff, 500, 3000);

const folder = guiSettings.addFolder('Fog').onChange(setFog).close();
folder.add(fog,'near',100,2000);
folder.add(fog,'far',100,10000);
folder.addColor(fog,'color');

export function setFog() {
  scene.fog = fog;
  scene.background = new THREE.Color(fog.color);
  camera.far = fog.far;
  camera.updateProjectionMatrix();
}