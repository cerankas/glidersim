import { GUI } from "three/addons/libs/lil-gui.module.min.js";

export const gui = new GUI();
gui.title('Menu [Esc]');
gui.updateDisplay = () => {
  const controllers = gui.controllersRecursive();
  for (let controller of controllers) {
    controller.updateDisplay();
  }
}
export const guiSettings = gui.addFolder('Settings').close();
gui.close();
// gui.hide();