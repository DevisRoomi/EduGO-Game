/**
 * Cheerful procedural Web Audio API sound & dynamic BGM synthesizer for Lari Pintar 3D.
 * Zero external MP3/WAV dependencies — 100% Web Audio oscillators, filters, and envelopes.
 */
export type BgmMood = 'normal' | 'fever' | 'hurry';

const AUDIO_STORAGE_KEY = 'lari-pintar-audio-prefs-v1';

// Cheerful C-major / pentatonic classroom race melody (Hz)
const MELODY_NOTES = [
  523.25, 659.25, 783.99, 659.25,
  880.0, 783.99, 659.25, 587.33,
  523.25, 587.33, 659.25, 783.99,
  1046.5, 880.0, 783.99, 659.25,
];

const BASS_NOTES = [
  130.81, 0, 196.0, 0,
  174.61, 0, 196.0, 0,
  130.81, 0, 146.83, 0,
  196.0, 0, 130.81, 0,
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxMuted: boolean = false;
  private bgmMuted: boolean = false;
  private bgmRunning: boolean = false;
  private bgmMood: BgmMood = 'normal';
  private bgmTimer: number | null = null;
  private bgmStep: number = 0;

  constructor() {
    this.loadPrefs();
  }

  private loadPrefs(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(AUDIO_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed.sfxMuted === 'boolean') this.sfxMuted = parsed.sfxMuted;
      if (typeof parsed.bgmMuted === 'boolean') this.bgmMuted = parsed.bgmMuted;
    } catch {
      // ignore storage issues
    }
  }

  private savePrefs(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        AUDIO_STORAGE_KEY,
        JSON.stringify({ sfxMuted: this.sfxMuted, bgmMuted: this.bgmMuted }),
      );
    } catch {
      // ignore storage issues
    }
  }

  private ensureContext(allowWhenSfxMuted: boolean = false): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!allowWhenSfxMuted && this.sfxMuted) return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.sfxMuted = muted;
    this.savePrefs();
  }

  public isMuted(): boolean {
    return this.sfxMuted;
  }

  public setSfxMuted(muted: boolean): void {
    this.sfxMuted = muted;
    this.savePrefs();
  }

  public isSfxMuted(): boolean {
    return this.sfxMuted;
  }

  public setBgmMuted(muted: boolean): void {
    this.bgmMuted = muted;
    this.savePrefs();
    if (muted) {
      this.clearBgmTimer();
    } else if (this.bgmRunning) {
      this.scheduleBgmTick();
    }
  }

  public isBgmMuted(): boolean {
    return this.bgmMuted;
  }

  public startBgm(mood: BgmMood = 'normal'): void {
    this.bgmMood = mood;
    this.bgmRunning = true;
    this.bgmStep = 0;
    if (!this.bgmMuted) {
      this.scheduleBgmTick();
    }
  }

  public setBgmMood(mood: BgmMood): void {
    this.bgmMood = mood;
  }

  public stopBgm(): void {
    this.bgmRunning = false;
    this.clearBgmTimer();
  }

  private clearBgmTimer(): void {
    if (this.bgmTimer !== null) {
      window.clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private scheduleBgmTick(): void {
    this.clearBgmTimer();
    if (!this.bgmRunning || this.bgmMuted || typeof window === 'undefined') return;

    const bpm = this.bgmMood === 'hurry' ? 152 : this.bgmMood === 'fever' ? 142 : 124;
    const stepMs = Math.round((60 / bpm / 2) * 1000); // 8th-note groove

    this.playBgmStep(this.bgmStep);
    this.bgmStep = (this.bgmStep + 1) % MELODY_NOTES.length;

    this.bgmTimer = window.setTimeout(() => {
      this.scheduleBgmTick();
    }, stepMs);
  }

  private playBgmStep(step: number): void {
    const ctx = this.ensureContext(true);
    if (!ctx || ctx.state !== 'running') return;

    const pitchBoost = this.bgmMood === 'fever' ? 1.12246 : 1; // +2 semitones bright lift in Fever!
    const leadFreq = MELODY_NOTES[step] * pitchBoost;
    const bassFreq = BASS_NOTES[step] * pitchBoost;

    // Gentle marimba-like lead voice
    this.playRawTone(
      ctx,
      leadFreq,
      leadFreq,
      0.13,
      this.bgmMood === 'fever' ? 'triangle' : 'sine',
      this.bgmMood === 'fever' ? 0.045 : 0.036,
      0,
    );

    // Bouncy warm bass on downbeats
    if (bassFreq > 0) {
      this.playRawTone(ctx, bassFreq, bassFreq * 0.99, 0.17, 'triangle', 0.042, 0);
    }

    // Subtle soft hi-hat click on off-beats
    if (step % 2 === 1) {
      this.playRawTone(ctx, 2200, 900, 0.03, 'square', 0.008, 0);
    }
  }

  private playRawTone(
    ctx: AudioContext,
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay: number = 0,
  ): void {
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + Math.min(0.015, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay: number = 0,
  ): void {
    const ctx = this.ensureContext(false);
    if (!ctx) return;
    this.playRawTone(ctx, freqStart, freqEnd, duration, type, volume, delay);
  }

  public playLaneSwitch(): void {
    const jitter = 0.94 + Math.random() * 0.12;
    this.playTone(320 * jitter, 460 * jitter, 0.08, 'triangle', 0.09);
  }

  public playJump(): void {
    const jitter = 0.94 + Math.random() * 0.12;
    this.playTone(280 * jitter, 640 * jitter, 0.16, 'sine', 0.14);
    this.playTone(420 * jitter, 820 * jitter, 0.12, 'triangle', 0.07, 0.03);
  }

  public playStarPickup(): void {
    const jitter = 0.96 + Math.random() * 0.08;
    this.playTone(880 * jitter, 1174 * jitter, 0.11, 'sine', 0.12);
    this.playTone(1318 * jitter, 1568 * jitter, 0.14, 'triangle', 0.09, 0.06);
  }

  public playPowerupPickup(type: 'shield' | 'magnet'): void {
    if (type === 'shield') {
      this.playTone(440, 660, 0.12, 'triangle', 0.14, 0);
      this.playTone(660, 990, 0.18, 'sine', 0.15, 0.08);
    } else {
      this.playTone(392, 784, 0.14, 'sine', 0.14, 0);
      this.playTone(587.33, 1174.66, 0.18, 'triangle', 0.14, 0.09);
    }
  }

  public playShieldBlock(): void {
    this.playTone(720, 420, 0.14, 'triangle', 0.14, 0);
    this.playTone(540, 880, 0.16, 'sine', 0.12, 0.07);
  }

  public playFeverActivate(): void {
    const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    chord.forEach((f, idx) => {
      this.playTone(f, f * 1.05, 0.18, 'triangle', 0.13, idx * 0.055);
    });
  }

  public playCorrectGate(streak: number): void {
    const pitchLift = 1 + Math.min(streak, 6) * 0.04;
    this.playTone(523.25 * pitchLift, 523.25 * pitchLift, 0.11, 'triangle', 0.15, 0);
    this.playTone(659.25 * pitchLift, 659.25 * pitchLift, 0.12, 'triangle', 0.15, 0.07);
    this.playTone(783.99 * pitchLift, 783.99 * pitchLift, 0.13, 'sine', 0.16, 0.14);
    this.playTone(1046.5 * pitchLift, 1174.66 * pitchLift, 0.24, 'sine', 0.18, 0.21);
  }

  public playWrongGate(): void {
    this.playTone(260, 175, 0.18, 'sawtooth', 0.09, 0);
    this.playTone(190, 130, 0.22, 'triangle', 0.12, 0.12);
  }

  public playObstacleBump(): void {
    this.playTone(165, 72, 0.16, 'square', 0.1, 0);
    this.playTone(120, 65, 0.14, 'triangle', 0.12, 0.04);
  }

  public playCountdownTick(isGo: boolean): void {
    if (isGo) {
      this.playTone(587.33, 880, 0.12, 'triangle', 0.16, 0);
      this.playTone(880, 1174.66, 0.28, 'sine', 0.18, 0.08);
    } else {
      this.playTone(440, 440, 0.14, 'triangle', 0.13, 0);
    }
  }

  public playVictoryFanfare(): void {
    const notes = [
      { f: 523.25, t: 0, d: 0.13 },
      { f: 659.25, t: 0.12, d: 0.13 },
      { f: 783.99, t: 0.24, d: 0.13 },
      { f: 1046.5, t: 0.36, d: 0.28 },
      { f: 783.99, t: 0.58, d: 0.12 },
      { f: 1046.5, t: 0.7, d: 0.42 },
    ];
    for (const n of notes) {
      this.playTone(n.f, n.f, n.d, 'triangle', 0.15, n.t);
      this.playTone(n.f * 1.5, n.f * 1.5, n.d * 0.9, 'sine', 0.06, n.t);
    }
  }
}

export const soundEngine = new SoundEngine();
