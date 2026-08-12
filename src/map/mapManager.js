import { MapCell } from '@/map/mapCell';


export class MapManager {
  constructor(resolution, scene) {
    this.cell = new MapCell(resolution, scene);
  }
  
  update(gliderX, gliderY, range) {
    const cellSize = range * 2;
    const cacheMargin = (cellSize - range) / 2;
    const outsideCache = this.cell.size !== cellSize
      || Math.abs(gliderX - this.cell.x) > cacheMargin
      || Math.abs(gliderY - this.cell.y) > cacheMargin;

    if (!outsideCache) return;

    this.cell.update(gliderX, gliderY, cellSize);
  }
}