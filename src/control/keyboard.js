import { gui } from "./gui";


export class Keyboard {
  keys = {};

  constructor(game) {
    this.game = game;

    document.addEventListener("keydown", this.onKeyDown, true);
    document.addEventListener("keyup", this.onKeyUp, true);
    document.addEventListener("keypress", this.onKeyPress, true);
    document.addEventListener("visibilitychange", () => this.keys = {});
  }

  onKeyDown = (e) => {
    const newPress = (key) => { return e.key == key && !this.keys[key]; };
    
    if (newPress('Escape')) {
      
      if (this.game.isHelpVisible()) {
        this.game.toggleHelp();
        return;
      }
      
      const menu = document.getElementById("menu");
      if (!menu.open) {
        menu.showModal();
        e.preventDefault();
      }

      // if (gui._closed) {
      //   gui.open();
      //   gui.domElement.children[0].focus();
      // }
      // else {
      //   gui.close();
      //   document.activeElement.blur();
      // }
    }
  
    if (document.activeElement != document.body) return;
  
    if (!this.keys.Shift && newPress('PageUp')) {
      this.game.miniMap.changeScale(.5);
    }

    if (!this.keys.Shift && newPress('PageDown')) {
      this.game.miniMap.changeScale(2);
    }
    
    this.keys[e.key] = 1;
  }

  onKeyUp = (e) => {
    this.keys[e.key] = 0;
  }
  
  onKeyPress = (e) => {
    if (document.activeElement != document.body) return;

    if (e.key == 'h') {
      this.game.toggleHelp();
    }
    if (e.key == 'c') {
      this.game.camera.setNextMode();
    }
    if (e.key == 'i') {
    	this.game.instruments.visible ^= true;
    }
    if (e.key == 'm') {
    	this.game.miniMap.visible ^= true;
    }
    if (e.key == 'n') {
    	this.game.miniMap.north ^= true;
    }
    if (e.key == 'o') {
      this.game.mouse.controlEnabled ^= true;
      this.game.camera.orbitingEnabled = !this.game.mouse.controlEnabled;
    }
    if (e.key == 'a') {
      this.game.toggleAudioVario();
    }
    if (e.key == 's') {
    	if (this.game.airflowSound.isPlaying) this.game.airflowSound.stop();
    	else this.game.airflowSound.start();
    }
    if (e.key == ' ') {
      this.game.togglePause();
    }
    if (e.key == '1') {
      this.game.camera.setMode(0);
    }
    if (e.key == '2') {
      this.game.camera.setMode(1);
    }
    if (e.key == '3') {
      this.game.camera.setMode(2);
    }
    if (e.key == '4') {
      this.game.camera.setMode(3);
    }
  
    if (e.key == '0' || e.key == '1' || e.key == '2' || e.key == '3' || e.key == '4') {
      this.game.camera.resetOrbiting();
    }
  
    if (e.key == 'g') {
      this.game.glider.toggleGear();
    }
  }
}