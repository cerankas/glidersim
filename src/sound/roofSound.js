class RoofSound {
  constructor() {
    this.audioCtx = new window.AudioContext();
    this.lastTrigger = 0;
    this.intensity = 0;
    this.decayTime = 0.5;
    this.baseSpeed = 85;
    this.maxIntensity = 1.5;
  }

  play(speed = 85) {
    const now = this.audioCtx.currentTime;
    const dt = now - this.lastTrigger;
    this.lastTrigger = now;

    const decayFactor = Math.exp(-dt / this.decayTime);
    this.intensity = this.intensity * decayFactor + (1 - decayFactor);

    const speedRatio = Math.min(speed / this.baseSpeed, 1);
    const speedFactor = speedRatio * speedRatio;
    const effectiveIntensity = Math.min(this.maxIntensity, this.intensity + 0.1) * speedFactor;

    const baseTime = now;
    const tileCount = Math.floor(3 + effectiveIntensity * 5);

    for (let i = 0; i < tileCount; i++) {
      const delay = Math.random() * 0.4 + i * 0.03;
      const pitch = 600 + Math.random() * 1200;
      const dur = 0.05 + Math.random() * 0.05;

      const osc = this.audioCtx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitch, baseTime + delay);

      const gain = this.audioCtx.createGain();
      const startGain = 0.15 + Math.random() * 0.1 * effectiveIntensity;
      gain.gain.setValueAtTime(0.0, baseTime + delay);
      gain.gain.linearRampToValueAtTime(startGain, baseTime + delay + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, baseTime + delay + dur);

      osc.connect(gain).connect(this.audioCtx.destination);
      osc.start(baseTime + delay);
      osc.stop(baseTime + delay + dur + 0.05);
    }
  }
}


const roofSound = new RoofSound();

export const playRoofSound = (speed) => roofSound.play(speed);