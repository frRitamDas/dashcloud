'use client';

/**
 * Tiny WebAudio blip synth — no asset downloads, no autoplay violations
 * (the context is only resumed after a user gesture).
 */
type Wave = OscillatorType;

let ctx: AudioContext | null = null;
let muted = false;

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function setMuted(value: boolean) {
  muted = value;
}

export function isMuted() {
  return muted;
}

export function blip(freq = 440, duration = 0.08, type: Wave = 'square', gain = 0.045, slideTo?: number) {
  if (muted) return;
  const ac = context();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const vol = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), ac.currentTime + duration);
    vol.gain.setValueAtTime(0.0001, ac.currentTime);
    vol.gain.exponentialRampToValueAtTime(gain, ac.currentTime + 0.008);
    vol.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
    osc.connect(vol).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + duration + 0.02);
  } catch {
    /* audio is a nicety, never a failure mode */
  }
}

export const sfx = {
  eat: () => blip(680, 0.07, 'square', 0.04, 980),
  hit: () => blip(180, 0.16, 'sawtooth', 0.05, 70),
  shoot: () => blip(880, 0.05, 'triangle', 0.028, 420),
  explode: () => blip(120, 0.3, 'sawtooth', 0.05, 40),
  jump: () => blip(420, 0.1, 'sine', 0.04, 720),
  place: () => blip(320, 0.06, 'square', 0.035, 420),
  break: () => blip(240, 0.09, 'sawtooth', 0.035, 120),
  click: () => blip(520, 0.04, 'sine', 0.03),
  win: () => {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.14, 'triangle', 0.045), i * 95));
  },
  lose: () => {
    [420, 330, 240, 160].forEach((f, i) => setTimeout(() => blip(f, 0.18, 'sawtooth', 0.04), i * 110));
  },
  engine: (intensity: number) => blip(60 + intensity * 90, 0.05, 'sawtooth', 0.012 + intensity * 0.01),
};
