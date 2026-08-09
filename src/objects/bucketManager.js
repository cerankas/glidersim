export class BucketManager {
  constructor(x, y, tileSize, bucketSize, maxRadius) {
    this.tileSize = tileSize;
    this.bucketSize = bucketSize;
    this.bucketsPerSide = (this.tileSize / this.bucketSize) | 0;
    this.maxRadius = maxRadius;

    this.buckets = [];
    for (let i = 0; i < this.bucketsPerSide ** 2; i++) {
      this.buckets.push([]);
    }

    this.reset(x, y)
  }

  bucket(i, j) { return this.buckets[i + this.bucketsPerSide * j]; }

  bucketAt(x, y) {
    const i = Math.floor((x - this.x + this.tileSize / 2) / this.bucketSize);
    const j = Math.floor((y - this.y + this.tileSize / 2) / this.bucketSize);
    if (i < 0 || j < 0 || i >= this.bucketsPerSide || j >= this.bucketsPerSide) return null;
    return this.bucket(i, j);
  }

  reset(x, y) {
    this.x = x;
    this.y = y;

    for (const bucket of this.buckets) {
      bucket.length = 0;
    }
  }

  add(entity) {
    const x = entity.x;
    const y = entity.y;
    const r = entity.r;

    const { tileSize, bucketSize, bucketsPerSide, maxRadius } = this;

    const i0 = Math.floor((x - this.x + tileSize / 2) / bucketSize);
    const j0 = Math.floor((y - this.y + tileSize / 2) / bucketSize);

    for (let i = i0 - 1; i <= i0 + 1; i++) {
      if (i < 0 || i >= bucketsPerSide) continue;
      if (Math.abs(x - this.x - i * bucketSize) - tileSize / 2 > r + maxRadius) continue;

      for (let j = j0 - 1; j <= j0 + 1; j++) {
        if (j < 0 || j >= bucketsPerSide) continue;
        if (Math.abs(y - this.y - j * bucketSize) - tileSize / 2 > r + maxRadius) continue;

        for (const e of this.bucket(i, j)) {
          if (Math.hypot(x - e.x, y - e.y) < r + e.r) return false;
        }
      }
    }

    this.bucket(i0, j0).push(entity);
    return true;
  }
}