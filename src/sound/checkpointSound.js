class CheckpointSound {
  constructor() {
    this.audioCtx = new window.AudioContext();
  }

  play() {
    const now = this.audioCtx.currentTime;

    const notes = [
      { freq: 880, delay: 0.00 }, // A5
      { freq: 1046.5, delay: 0.12 }, // C6
      { freq: 1318.5, delay: 0.25 }  // E6
    ];

    // const notes = [
    //   { freq: 659.25, delay: 0.00 },   // E5
    //   { freq: 739.99, delay: 0.10 },   // F#5
    //   { freq: 880.00, delay: 0.20 },   // A5
    //   { freq: 987.77, delay: 0.30 },   // B5
    //   { freq: 1046.50, delay: 0.40 },  // C6
    //   { freq: 1318.51, delay: 0.50 }   // E6
    // ];

    // const notes = [
    //   { freq: 659.25, delay: 0.00 },   // E5
    //   { freq: 783.99, delay: 0.10 },   // G5
    //   { freq: 880.00, delay: 0.20 },   // A5
    //   { freq: 1046.50, delay: 0.30 },  // C6
    //   { freq: 1174.66, delay: 0.40 }   // D6
    // ];

    for (let note of notes) {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.delay);

      gain.gain.setValueAtTime(0.0, now + note.delay);
      gain.gain.linearRampToValueAtTime(2, now + note.delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.delay + 0.3);

      osc.connect(gain).connect(this.audioCtx.destination);
      osc.start(now + note.delay);
      osc.stop(now + note.delay + 0.4);
    }
  }
}

const checkpointSound = new CheckpointSound();

export const playCheckpointSound = () => checkpointSound.play();