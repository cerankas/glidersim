import { WorldTile } from '@/map/worldTile';


export class WorldManager {
  constructor(tileSize, bucketSize, quadSize, scene) {
    this.tileSize = tileSize;
    this.bucketSize = bucketSize;
    this.quadSize = quadSize;
    const size = this.tileSize;
    
    this.tiles = [];
    
    for (let x = -tileSize; x <= tileSize; x += tileSize) {
      for (let y = -tileSize; y <= tileSize; y += tileSize) {
        this.tiles.push(new WorldTile(x, y, tileSize, bucketSize, quadSize, scene));
      }
    }
  }
  
  update(gliderX, gliderY) {
    const size = this.tileSize;

    const centerX = Math.round(gliderX / size) * size;
    const centerY = Math.round(gliderY / size) * size;
    
    for (let tileX = centerX - size; tileX <= centerX + size; tileX += size) {
      for (let tileY = centerY - size; tileY <= centerY + size; tileY += size) {

        const dx = Math.abs(tileX - gliderX);
        const dy = Math.abs(tileY - gliderY);

        const anyCornerVisible = Math.hypot(dx - size / 2, dy - size / 2) < size;
        const anySideVisible = Math.min(dx, dy) < .5 * size && Math.max(dx, dy) < 1.5 * size;
      
        if (!anyCornerVisible && !anySideVisible) continue;
      
        if (!this.tiles.some(tile => tile.x == tileX && tile.y == tileY)) {
          this.tiles.sort((a, b) => b.distance(gliderX, gliderY) - a.distance(gliderX, gliderY));
          this.tiles[0].update(tileX, tileY);
          return;
        }
      }
    }

  }

  treeCounts() {
    const counts  = [];
    for (const xy in this.tiles) {
      const tile = this.tiles[xy];
      counts.push(tile.trees.count)
    }
    return counts;
  }

  houseCounts() {
    const counts  = [];
    for (const xy in this.tiles) {
      const tile = this.tiles[xy];
      counts.push(tile.houses.count)
    }
    return counts;
  }
}