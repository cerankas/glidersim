class TreeSound {
  constructor() {
    this.audioCtx = new window.AudioContext();
    this.maxIntensity = 1.2;
    this.intensity = 0;
    this.lastTrigger = 0;
    this.decayTime = 0.6; // seconds for intensity to decay
    this.baseSpeed = 85;  // reference speed for full volume
  }

  play(speed = 85) {
    const now = this.audioCtx.currentTime;
    const dt = now - this.lastTrigger;
    this.lastTrigger = now;

    // Decay accumulated intensity over time
    const decayFactor = Math.exp(-dt / this.decayTime);
    this.intensity = this.intensity * decayFactor + (1 - decayFactor);

    // Scale intensity based on speed
    const speedFactor = Math.min(speed / this.baseSpeed, 1); // Clamp to 1.0
    const effectiveIntensity = Math.min(this.maxIntensity, this.intensity + 0.1) * speedFactor**2;

    // Set parameters based on intensity
    const duration = 1.0;
    const gainPeak = 0.1 + 0.2 * effectiveIntensity;

    // Create white noise buffer
    const bufferSize = this.audioCtx.sampleRate * duration;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = this.audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Lowpass filter to shape rustling tone
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000 + effectiveIntensity * 800, now);
    filter.Q.value = 1.5;

    // Gain envelope
    const gainNode = this.audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.0, now);
    gainNode.gain.linearRampToValueAtTime(gainPeak, now + 0.05); // fast attack
    gainNode.gain.exponentialRampToValueAtTime(0.1 * speedFactor, now + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    // Optional: crackle for leaf tear texture
    const osc = this.audioCtx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(300 + Math.random() * 100, now);
    const oscGain = this.audioCtx.createGain();
    oscGain.gain.setValueAtTime(0.01 * effectiveIntensity, now);
    osc.connect(oscGain).connect(gainNode);

    // Connect all nodes
    noiseSource.connect(filter).connect(gainNode).connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.3);

    noiseSource.start(now);
    noiseSource.stop(now + duration);
  }
}


const treeSound = new TreeSound();

export const playTreeSound = (speed) => treeSound.play(speed);