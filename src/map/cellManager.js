import { Cell } from '@/map/cell';


export class CellManager {
  constructor(range, scene) {
    this.cellSize = range;
    const size = this.cellSize;
    
    this.cells = [];
    
    for (let x = -size; x <= size; x += size) {
      for (let y = -size; y <= size; y += size) {
        this.cells.push(new Cell(x, y, size, scene));
      }
    }
  }
  
  update(gliderX, gliderY) {
    const size = this.cellSize;

    const centerX = Math.round(gliderX / size) * size;
    const centerY = Math.round(gliderY / size) * size;
    
    for (let cellX = centerX - size; cellX <= centerX + size; cellX += size) {
      for (let cellY = centerY - size; cellY <= centerY + size; cellY += size) {

        const dx = Math.abs(cellX - gliderX);
        const dy = Math.abs(cellY - gliderY);

        const anyCornerVisible = Math.hypot(dx - size / 2, dy - size / 2) < size;
        const anySideVisible = Math.min(dx, dy) < .5 * size && Math.max(dx, dy) < 1.5 * size;
      
        if (!anyCornerVisible && !anySideVisible) continue;
      
        if (!this.cells.some(cell => cell.x == cellX && cell.y == cellY)) {
          this.cells.sort((a, b) => b.distance(gliderX, gliderY) - a.distance(gliderX, gliderY));
          this.cells[0].update(cellX, cellY);
          return;
        }
      }
    }

  }

  treeCounts() {
    const counts  = [];
    for (const xy in this.cells) {
      const cell = this.cells[xy];
      counts.push(cell.trees.count)
    }
    return counts;
  }

  houseCounts() {
    const counts  = [];
    for (const xy in this.cells) {
      const cell = this.cells[xy];
      counts.push(cell.houses.count)
    }
    return counts;
  }
}