import { Cell } from '@/map/cell';


export class CellManager {
  constructor(range) {
    this.cellSize = range;
    this.cells = [];
    this.treeCnt = 0;
    this.houseCnt = 0;

    this.range = range;
    this.addThreshold = Math.ceil(this.range / this.cellSize);
    this.removeThreshold = this.addThreshold + 1;
  }
  
  setScene(scene) {
    this.scene = scene;
  }

  update(gliderX,gliderY) {
    const t0 = Date.now();

    const x0 = Math.floor(gliderX / this.cellSize + .5);
    const y0 = Math.floor(gliderY / this.cellSize + .5);
    
    for (const xy in this.cells) {
      const [x,y] = xy.split(',').map(Number);
  
      const dx = Math.abs(x - x0);
      const dy = Math.abs(y - y0);
      
      if ((dx > this.removeThreshold || dy > this.removeThreshold) || this.cells[xy].size != this.cellSize) { 
        this.treeCnt -= this.cells[xy].trees.children[0].count;
        this.houseCnt -= this.cells[xy].houses.children[0].count;
        this.cells[xy].dispose();
        delete this.cells[xy];
      }
    }

    for (let x = x0 - this.addThreshold; x <= x0 + this.addThreshold; x++) {
      for (let y = y0 - this.addThreshold; y <= y0 + this.addThreshold; y++) {
        if (this.cells[[x,y]] == undefined) {
          this.cells[[x,y]] = new Cell(x * this.cellSize, y * this.cellSize, this.cellSize, this.scene);
          this.treeCnt += this.cells[[x,y]].trees.children[0].count;
          this.houseCnt += this.cells[[x,y]].houses.children[0].count;
          if (Date.now() - t0 > 5) return;
        }
      }
    }

  }
}