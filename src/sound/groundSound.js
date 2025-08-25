class GroundSound {
  constructor() {
    this.audioCtx = new window.AudioContext();
    this.lastTrigger = 0;
    this.intensity = 0;
    this.decayTime = 0.5; // seconds to fade between quick re-triggers
    this.baseSpeed = 85;  // full intensity reference speed
    this.maxIntensity = 1.2;
  }

  play(speed = 85) {
    const now = this.audioCtx.currentTime;
    const dt = now - this.lastTrigger;
    this.lastTrigger = now;

    // Smooth decay of accumulated intensity
    const decayFactor = Math.exp(-dt / this.decayTime);
    this.intensity = this.intensity * decayFactor + (1 - decayFactor);

    // Intensity scales with square of speed ratio
    const speedRatio = Math.min(speed / this.baseSpeed, 1);
    const speedFactor = speedRatio * speedRatio;
    const effectiveIntensity = Math.min(this.maxIntensity, this.intensity + 0.1) * speedFactor;

    // Gain based on intensity
    const duration = 1.2;
    const gainPeak = 0.2 + 0.5 * effectiveIntensity;

    // White noise buffer
    const bufferSize = this.audioCtx.sampleRate * duration;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = this.audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Filter to mimic ground scrape character (midrange with some roughness)
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    
    // filter.frequency.setValueAtTime(500 + speedFactor * 1000, now);
    const freqJitter = 100 + Math.random() * 200;
    filter.frequency.setValueAtTime(500 + speedFactor * 800 + freqJitter, now);
    
    filter.Q.value = 0.8;

    // Gain envelope
    const gainNode = this.audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.0, now);
    gainNode.gain.linearRampToValueAtTime(gainPeak, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.2 * speedFactor, now + 0.5);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    // Optional crackle layer to simulate grit/friction
    const crackle = this.audioCtx.createOscillator();
    crackle.type = 'sawtooth';
    crackle.frequency.setValueAtTime(90 + Math.random() * 40, now);
    const crackleGain = this.audioCtx.createGain();
    crackleGain.gain.setValueAtTime(0.01 * effectiveIntensity, now);
    crackle.connect(crackleGain).connect(gainNode);

    // Connect and play
    noiseSource.connect(filter).connect(gainNode).connect(this.audioCtx.destination);
    crackle.start(now);
    crackle.stop(now + 0.3);

    noiseSource.start(now);
    noiseSource.stop(now + duration);
  }
}


const groundSound = new GroundSound();

export const playGroundSound = (speed) => groundSound.play(speed);