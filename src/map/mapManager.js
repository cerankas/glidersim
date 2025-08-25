import { MapCell } from '@/map/mapCell';
import { miniMap } from '@/map/miniMap';
import { mapMaterial } from '@/scene/materials';

class MapManager {
  constructor() {
    // this.cellSize = 1000;
    this.cells = [];
  }
  
  setScene(scene) {
    this.scene = scene;
  }

  update(gliderX,gliderY) {
    const t0 = Date.now();
    const range = miniMap.range;

    this.cellSize = miniMap.range;

    const x0 = Math.floor(gliderX / this.cellSize + .5);
    const y0 = Math.floor(gliderY / this.cellSize + .5);
    
    const addThreshold = 1.5 * range / this.cellSize;
    const removeThreshold = 2 * range / this.cellSize;

    for (const xy in this.cells) {
      const [x,y] = xy.split(',').map(Number);
  
      const dx = Math.abs(x - x0);
      const dy = Math.abs(y - y0);
      
      if (dx > removeThreshold || dy > removeThreshold || this.cells[xy].size != this.cellSize) { 
        this.cells[xy].dispose();
        delete this.cells[xy];
      }
    }

    for (let x = x0 - addThreshold; x <= x0 + addThreshold; x++) {
      for (let y = y0 - addThreshold; y <= y0 + addThreshold; y++) {
        if (this.cells[[x,y]] == undefined) {
          this.cells[[x,y]] = new MapCell(x * this.cellSize, y * this.cellSize, this.cellSize, this.scene);
          // if (Date.now() - t0 > 5) return;
        }
      }
    }
  }
}

export const mapManager = new MapManager();