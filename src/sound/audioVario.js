export class AudioVario {
  constructor() {
    // Initialize audio context
    this.audioContext = new window.AudioContext();
    this.oscillator = null;
    this.gainNode = null;
    this.isPlaying = false;
    
    // Default vario parameters
    this.baseFrequency = 500;    // Base frequency in Hz
    this.minFrequency = 200;     // Minimum frequency for sink
    this.maxFrequency = 1400;    // Maximum frequency for lift
    this.beepInterval = 200;     // Interval between beeps in ms for climb
    this.beepDuration = 150;     // Duration of beep in ms
    this.sinkToneThreshold = -0.5; // m/s, below which sink tone starts
    
    this.liftRate = 0;           // Current vertical speed in m/s
    this.timerId = null;
  }

  start() {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.updateSound();
  }

  stop() {
    if (!this.isPlaying) return;
    
    this.isPlaying = false;
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator = null;
    }
    
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  setLiftRate(liftRateInMetersPerSecond) {
    this.liftRate = liftRateInMetersPerSecond;
    if (this.isPlaying) {
      this.updateSound();
    }
  }

  updateSound() {
    if (!this.isPlaying) return;
    
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    
    // In lift (positive values)
    if (this.liftRate > 0) {
      this.generateLiftTone();
    } 
    // In significant sink (negative values below threshold)
    else if (this.liftRate < this.sinkToneThreshold) {
      this.generateContinuousSinkTone();
    } 
    // In minimal sink or level flight
    if (this.liftRate >= this.sinkToneThreshold) {
      if (this.oscillator) {
        this.oscillator.stop();
        this.oscillator = null;
      }
    }
  }

  generateLiftTone() {
    // Calculate frequency based on lift rate
    // Higher lift = higher frequency
    let frequency = this.baseFrequency + (this.liftRate * 100);
    // frequency = Math.min(frequency, this.maxFrequency);
    
    // Calculate beep interval - stronger lift = faster beeps
    let interval = this.beepInterval - (this.liftRate * 30);
    interval = Math.max(interval, 50);
    
    this.playBeep(frequency, this.beepDuration);
    
    // Schedule next beep
    this.timerId = setTimeout(() => {
      this.updateSound();
    }, interval);
  }

  generateContinuousSinkTone() {
    // Calculate frequency based on sink rate
    // Stronger sink = lower frequency
    let frequency = this.baseFrequency / (1 - this.liftRate / 5);
    // let frequency = this.baseFrequency + (this.liftRate * 100);
    // frequency = Math.max(frequency, this.minFrequency);
    
    if (this.oscillator) {
      this.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    } else {
      this.playContinuousTone(frequency);
    }
  }

  playBeep(frequency, duration) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    
    // Apply slight attack and release for smoother sound
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2 * this.baseFrequency / frequency, this.audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + (duration / 1000));
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + (duration / 1000));
  }

  playContinuousTone(frequency) {
    this.oscillator = this.audioContext.createOscillator();
    this.gainNode = this.audioContext.createGain();
    
    this.oscillator.type = 'sine';
    this.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    
    this.gainNode.gain.setValueAtTime(0.5 * this.baseFrequency / frequency, this.audioContext.currentTime);
    
    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);
    
    this.oscillator.start();
  }
}

