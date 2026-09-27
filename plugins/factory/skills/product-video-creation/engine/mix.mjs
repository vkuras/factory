// Builds the soundtrack: voice clips at their cue times, synthesized UI sounds
// (keys, clicks, pops).
import { readWav, writeWav } from './wav.mjs';

const SR = 48000;
const rnd = (() => { let s = 12345; return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff); })();
const noise = () => rnd() * 2 - 1;
function synth(len, fn) { const n = Math.round(len * SR), a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = fn(i / SR, i); return a; }

// soft mechanical keyboard: short filtered noise tick + tiny body tone
function keyVariant(tone, bright) {
  let lp = 0;
  return synth(0.05, (t) => { const n = noise(); lp += (n - lp) * bright; return (lp * 0.9 + Math.sin(2 * Math.PI * tone * t) * 0.25) * Math.exp(-t * 180); });
}
const SFX = {
  key: [keyVariant(1900, 0.55), keyVariant(2300, 0.5), keyVariant(1700, 0.6), keyVariant(2100, 0.45)].map((a) => a.map((x) => x * 0.16)),
  bs: [keyVariant(1400, 0.4).map((x) => x * 0.16)],
  enter: [(() => { let lp = 0; return synth(0.09, (t) => { lp += (noise() - lp) * 0.35; return (lp * 0.8 + Math.sin(2 * Math.PI * 180 * t) * 0.6) * Math.exp(-t * 60) * 0.3; }); })()],
  click: [synth(0.06, (t) => (Math.sin(2 * Math.PI * 2600 * t) * Math.exp(-t * 400) + (t > 0.03 ? Math.sin(2 * Math.PI * 1800 * (t - 0.03)) * Math.exp(-(t - 0.03) * 420) * 0.7 : 0)) * 0.22)],
  pop: [synth(0.14, (t) => Math.sin(2 * Math.PI * (520 + 900 * t) * t) * Math.exp(-t * 30) * 0.2)],
  tick: [synth(0.12, (t) => (Math.sin(2 * Math.PI * 1568 * t) + 0.4 * Math.sin(2 * Math.PI * 2352 * t)) * Math.exp(-t * 35) * 0.13)],
  ding: [synth(1.2, (t) => (Math.sin(2 * Math.PI * 1318.5 * t) * 0.6 + Math.sin(2 * Math.PI * 1975.5 * t) * 0.3 + Math.sin(2 * Math.PI * 2637 * t) * 0.1) * Math.exp(-t * 5) * 0.14)],
  whoosh: [(() => { let lp = 0; return synth(1.1, (t) => { const env = Math.sin(Math.PI * Math.min(1, t / 1.1)) ** 2; lp += (noise() - lp) * (0.05 + 0.25 * env); return lp * env * 0.5; }); })()],
  boom: [(() => { let lp = 0; return synth(2.2, (t) => { lp += (noise() - lp) * 0.02; return (Math.sin(2 * Math.PI * (48 + 30 * Math.exp(-t * 8)) * t) * 0.8 + lp * 1.5) * Math.exp(-t * 2.2) * 0.5 + Math.sin(2 * Math.PI * 523.25 * t) * Math.exp(-t * 3) * 0.05; }); })()],
};

export function mix(cues, total) {
  const n = Math.ceil((total + 0.5) * SR), out = new Float32Array(n), voice = new Float32Array(n);
  const add = (buf, at, gain, target = out) => { const o = Math.round(at * SR); for (let i = 0; i < buf.length && o + i < n; i++) if (o + i >= 0) target[o + i] += buf[i] * gain; };
  for (const c of cues.audio) add(readWav(`audio/${c.id}.wav`).samples, c.t, 0.95 * c.gain, voice);
  let k = 0;
  for (const s of cues.sfx) { const v = SFX[s.name]; if (!v) throw new Error('no sfx ' + s.name); add(v[k++ % v.length], s.t, s.gain); }

  for (let i = 0; i < n; i++) out[i] += voice[i];
  // gentle limiter
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(out[i]));
  const g = peak > 0.95 ? 0.95 / peak : 1;
  for (let i = 0; i < n; i++) out[i] *= g;
  writeWav('out/mix.wav', out, SR);
  return 'out/mix.wav';
}
