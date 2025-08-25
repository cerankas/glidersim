class WaterSound {
  constructor() {
    this.audioCtx = new AudioContext();
    this.lastTrigger = 0;
    this.intensity = 0;
    this.decayTime = 0.4;
    this.baseSpeed = 85;
    this.maxIntensity = 1.3;
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

    const duration = 0.6 + Math.random() * 0.2;
    const gainPeak = 0.2 + 0.5 * effectiveIntensity;

    // White noise burst for splash
    const bufferSize = this.audioCtx.sampleRate * duration;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2); // fade-out envelope in buffer
    }

    const noiseSource = this.audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Highpass to cut rumble, bandpass for splashy texture
    const hp = this.audioCtx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(400, now);

    const band = this.audioCtx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.setValueAtTime(1200 + Math.random() * 800, now);
    band.Q.value = 1.2;

    // Gain envelope
    const gainNode = this.audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(gainPeak, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    // Optional: a few randomized droplets (high-pitched ping blips)
    const dropCount = Math.floor(2 + effectiveIntensity * 3);
    for (let i = 0; i < dropCount; i++) {
      const osc = this.audioCtx.createOscillator();
      const dropFreq = 1500 + Math.random() * 2500;
      const delay = Math.random() * 0.3;

      const dropGain = this.audioCtx.createGain();
      dropGain.gain.setValueAtTime(0, now + delay);
      dropGain.gain.linearRampToValueAtTime(0.03 * effectiveIntensity, now + delay + 0.01);
      dropGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(dropFreq, now + delay);

      osc.connect(dropGain).connect(this.audioCtx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.3);
    }

    // Connect everything
    noiseSource.connect(hp).connect(band).connect(gainNode).connect(this.audioCtx.destination);
    noiseSource.start(now);
    noiseSource.stop(now + duration);
  }
}

const waterSound = new WaterSound();

export const playWaterSound = (speed) => waterSound.play(speed);