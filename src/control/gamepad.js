import { devlog } from "@/utils/devlog";

let index = null;

window.addEventListener('gamepadconnected', (e) => {
  if (e.gamepad.id.startsWith('Generic')) {
    index = e.gamepad.index;
    devlog('gamepad connected', index);
  }
});

export function getGamepadState() {
  return (index != null) ? navigator.getGamepads()[index] : null;
}