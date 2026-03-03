export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.muted = false;
    this.musicPlaying = false;
    this.musicNodes = [];
    this.musicTimers = [];
    this.musicStyle = 1; // 1 = default, 2 = intense, etc.
  }

  _ensureContext() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMusicStyle(style) {
    if (this.musicStyle === style) return;
    this.musicStyle = style;
    // Restart music with new style if currently playing
    if (this.musicPlaying) {
      this.stopMusic();
      this.startMusic();
    }
  }

  startMusic() {
    this._ensureContext();
    if (!this.ctx || this.musicPlaying) return;
    this.musicPlaying = true;
    this._scheduleDrumLoop();
  }

  stopMusic() {
    this.musicPlaying = false;
    for (const node of this.musicNodes) {
      try { node.stop(); } catch (_) { /* already stopped */ }
    }
    this.musicNodes = [];
    for (const id of this.musicTimers) {
      clearTimeout(id);
    }
    this.musicTimers = [];
  }

  _scheduleDrumLoop() {
    if (!this.musicPlaying || !this.ctx) return;

    // Clear previous bar's references (already stopped/fired)
    this.musicNodes = [];
    this.musicTimers = [];

    if (this.musicStyle === 2) {
      this._scheduleDrumLoopIntense();
      return;
    }

    const bpm = 120;
    const beatMs = (60 / bpm) * 1000;

    // 4-beat pattern: kick, hat, snare, hat
    const pattern = [
      () => this._playKick(),
      () => this._playHiHat(),
      () => this._playSnare(),
      () => this._playHiHat(),
    ];

    for (let i = 0; i < 4; i++) {
      const id = setTimeout(() => {
        if (this.musicPlaying) pattern[i]();
      }, i * beatMs);
      this.musicTimers.push(id);
    }

    // Schedule next bar
    const barId = setTimeout(() => {
      if (this.musicPlaying) this._scheduleDrumLoop();
    }, 4 * beatMs);
    this.musicTimers.push(barId);

    // Bass note on beat 1
    this._playBass();
  }

  _scheduleDrumLoopIntense() {
    if (!this.musicPlaying || !this.ctx) return;

    const bpm = 140;
    const beatMs = (60 / bpm) * 1000;

    // 8-step pattern: double-time feel with syncopation
    const pattern = [
      () => { this._playKick(); this._playBassIntense(); },
      () => this._playHiHat(),
      () => { this._playSnare(); this._playHiHat(); },
      () => this._playHiHat(),
      () => { this._playKick(); this._playKick(); },
      () => this._playHiHat(),
      () => { this._playSnare(); this._playHiHat(); },
      () => { this._playHiHat(); this._playBassIntense(); },
    ];

    const stepMs = beatMs / 2;
    for (let i = 0; i < 8; i++) {
      const id = setTimeout(() => {
        if (this.musicPlaying) pattern[i]();
      }, i * stepMs);
      this.musicTimers.push(id);
    }

    const barId = setTimeout(() => {
      if (this.musicPlaying) this._scheduleDrumLoop();
    }, 8 * stepMs);
    this.musicTimers.push(barId);
  }

  _playKick() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.15);
    this.musicNodes.push(osc);
  }

  _playSnare() {
    if (!this.ctx) return;
    // Noise burst for snare
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(this.ctx.currentTime);
    noise.stop(this.ctx.currentTime + 0.1);
    this.musicNodes.push(noise);
  }

  _playHiHat() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(this.ctx.currentTime);
    noise.stop(this.ctx.currentTime + 0.05);
    this.musicNodes.push(noise);
  }

  _playBass() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    const notes = [55, 62, 65, 55]; // A1, B1, C2, A1
    const note = notes[Math.floor(Math.random() * notes.length)];
    osc.frequency.setValueAtTime(note, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.4);
    this.musicNodes.push(osc);
  }

  _playBassIntense() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    // Darker, more aggressive bass notes (D2, E2, F2, A1)
    const notes = [73, 82, 87, 55];
    const note = notes[Math.floor(Math.random() * notes.length)];
    osc.frequency.setValueAtTime(note, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(note * 0.5, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 250;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.3);
    this.musicNodes.push(osc);
  }

  playHitSound() {
    if (!this.ctx) return;
    // Noise burst + pitch pop
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.6;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(this.ctx.currentTime);
    noise.stop(this.ctx.currentTime + 0.08);

    // Pitch pop
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.06);
    oscGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.06);
  }

  playPlayerHurtSound() {
    if (!this.ctx) return;
    // Low impact sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.2);

    // Noise layer
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(this.ctx.currentTime);
    noise.stop(this.ctx.currentTime + 0.15);
  }

  toggleMute() {
    if (!this.ctx) return;
    this.muted = !this.muted;
    this.masterGain.gain.value = this.muted ? 0 : 1;
  }

  destroy() {
    this.stopMusic();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
