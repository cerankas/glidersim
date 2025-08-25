export class AirflowSound {
  constructor() {
    // Initialize audio context
    this.audioContext = new window.AudioContext();
    this.isPlaying = false;
    
    // Noise generator nodes
    this.noiseNode = null;
    this.gainNode = null;
    this.filterNode = null;
    
    // Airflow parameters
    this.minAirspeed = 20;      // km/h - minimum airspeed that produces sound
    this.maxAirspeed = 300;     // km/h - airspeed for maximum volume
    this.currentAirspeed = 0;   // km/h
    
    // Sound characteristics
    this.maxGain = 0.5;         // Maximum volume (0 to 1)
    this.minFilterFreq = 200;   // Hz - filter frequency at low airspeed
    this.maxFilterFreq = 2000;  // Hz - filter frequency at high airspeed
    this.filterQ = 1.0;         // Filter resonance
  }
  
  // Create a buffer of white noise
  createNoiseBuffer() {
    const bufferSize = 10 * this.audioContext.sampleRate;
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    return noiseBuffer;
  }
  
  start() {
    if (this.isPlaying) return;
    
    // Create noise source
    const noiseBuffer = this.createNoiseBuffer();
    this.noiseNode = this.audioContext.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;
    
    // Create filter node
    this.filterNode = this.audioContext.createBiquadFilter();
    this.filterNode.type = 'bandpass';
    this.filterNode.frequency.value = this.minFilterFreq;
    this.filterNode.Q.value = this.filterQ;
    
    // Create gain node
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 0;
    
    // Connect nodes
    this.noiseNode.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);
    
    // Start noise generator
    this.noiseNode.start();
    this.isPlaying = true;
    
    // Apply current airspeed settings
    this.updateSound();
  }
  
  stop() {
    if (!this.isPlaying) return;
    
    // Fade out for smooth stopping
    const currentTime = this.audioContext.currentTime;
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, currentTime);
    this.gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.2);
    
    // Stop and clean up after fade out
    setTimeout(() => {
      if (this.noiseNode) {
        this.noiseNode.stop();
        this.noiseNode = null;
        this.filterNode = null;
        this.gainNode = null;
      }
      this.isPlaying = false;
    }, 200);
  }
  
  setAirspeed(airspeedKmh) {
    this.currentAirspeed = Math.max(0, airspeedKmh);
    if (this.isPlaying) {
      this.updateSound();
    }
  }
  
  updateSound() {
    if (!this.isPlaying || !this.gainNode || !this.filterNode) return;
    
    const currentTime = this.audioContext.currentTime;
    
    // Calculate volume based on airspeed
    let volume = 0;
    if (this.currentAirspeed > this.minAirspeed) {
      const speedRatio = Math.min(
        (this.currentAirspeed - this.minAirspeed) / (this.maxAirspeed - this.minAirspeed),
        1.0
      );
      // Non-linear volume growth for more realistic effect
      volume = this.maxGain * Math.pow(speedRatio, 1.5);
    }
    
    // Calculate filter frequency based on airspeed
    // Higher speeds = higher frequencies
    let filterFreq = this.minFilterFreq;
    if (this.currentAirspeed > this.minAirspeed) {
      const speedRatio = Math.min(
        (this.currentAirspeed - this.minAirspeed) / (this.maxAirspeed - this.minAirspeed),
        1.0
      );
      filterFreq = this.minFilterFreq + (this.maxFilterFreq - this.minFilterFreq) * speedRatio;
    }
    
    // Apply changes with slight smoothing
    this.gainNode.gain.setTargetAtTime(volume, currentTime, 0.1);
    this.filterNode.frequency.setTargetAtTime(filterFreq, currentTime, 0.1);
    
    // Add second filter for more complex sound at higher speeds
    if (this.currentAirspeed > 80 && !this.secondFilter) {
      this.secondFilter = this.audioContext.createBiquadFilter();
      this.secondFilter.type = 'highpass';
      this.secondFilter.frequency.value = 800;
      
      // Rewire the audio graph
      this.filterNode.disconnect();
      this.filterNode.connect(this.secondFilter);
      this.secondFilter.connect(this.gainNode);
    }
  }
  
  // Add turbulence effect
  addTurbulence(intensity = 0.3) {
    if (!this.isPlaying) return;
    
    const currentTime = this.audioContext.currentTime;
    const currentGain = this.gainNode.gain.value;
    const currentFreq = this.filterNode.frequency.value;
    
    // Randomize volume and filter frequency briefly
    const turbulenceGain = currentGain * (1 + (Math.random() * intensity));
    const turbulenceFreq = currentFreq * (1 + (Math.random() * intensity * 0.5));
    
    this.gainNode.gain.setTargetAtTime(turbulenceGain, currentTime, 0.05);
    this.filterNode.frequency.setTargetAtTime(turbulenceFreq, currentTime, 0.05);
    
    // Return to normal after a brief period
    setTimeout(() => {
      this.updateSound();
    }, 100 + Math.random() * 200);
  }
}
