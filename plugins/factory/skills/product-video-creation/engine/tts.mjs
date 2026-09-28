// Renders every line in lines.mjs with Kokoro (local neural TTS) into
// audio/<id>.wav (48 kHz, 16 bit) and writes durations.js (for the page) and
// durations.json (for record.mjs). Every visual cue is timed from these durations.
//
// Kokoro speaks a whole line at once and pauses at sentence and list breaks by
// itself, the way a person does. Forcing pauses into the middle of sentences is
// what makes a voice sound read out, so nothing is inserted automatically: a
// line adds a deliberate beat only with [[slnc N]] (N ms). PRONOUNCE respells
// words for the voice only.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import os from 'node:os';
import * as L from './lines.mjs';
import { readWav, writeWav } from './wav.mjs';
import { VOICES, label } from './voices.mjs';

const { lines } = L, PRONOUNCE = L.PRONOUNCE || {};
const HOME = process.env.PVC_HOME || `${os.homedir()}/.cache/product-video`;
const PY = process.env.PVC_PYTHON || `${HOME}/kokoro/bin/python`;

export function spoken(l) {
  let s = l.say || l.text;
  for (const [w, r] of Object.entries(PRONOUNCE)) s = s.replace(new RegExp(`\\b${w}\\b`, 'g'), r);
  return s;
}

// ---- checks -------------------------------------------------------------------
for (const l of lines) {
  if (!/^[ab][fm]_[a-z]+$/.test(l.voice)) throw new Error(`${l.id}: "${l.voice}" is not a Kokoro English voice (see voices.mjs)`);
  if (!VOICES[l.voice]) console.warn(`⚠ ${l.id}: ${l.voice} is not in the cast list in voices.mjs; it is graded below C and sounds synthetic`);
}
// People who speak one after another should not sound alike.
for (let i = 1; i < lines.length; i++) {
  const a = VOICES[lines[i - 1].voice], b = VOICES[lines[i].voice];
  if (a && b && lines[i - 1].voice !== lines[i].voice && a.gender === b.gender && a.locale === b.locale)
    console.warn(`⚠ ${lines[i - 1].id} → ${lines[i].id}: ${lines[i - 1].voice} and ${lines[i].voice} are both ${label(lines[i].voice)}; change gender or locale so they sound different`);
}

// ---- render what changed ------------------------------------------------------
mkdirSync('audio', { recursive: true });
const hashOf = (l) => createHash('sha1').update(['kokoro', l.voice, l.speed || 1, spoken(l)].join('|')).digest('hex').slice(0, 8);
const todo = lines.filter((l) => {
  const f = `audio/${l.id}.wav`, stamp = `audio/${l.id}.hash`;
  return !existsSync(f) || !existsSync(stamp) || readFileSync(stamp, 'utf8') !== hashOf(l);
});
if (todo.length) {
  if (!existsSync(PY)) throw new Error(`Kokoro is not set up (${PY} missing): run <skill-dir>/scripts/setup_kokoro.sh after the user agreed`);
  const jobs = todo.map((l) => ({ id: l.id, voice: l.voice, text: spoken(l), speed: l.speed || 1, out: `audio/${l.id}.24k.wav` }));
  writeFileSync('audio/jobs.json', JSON.stringify(jobs));
  console.log(`Kokoro: rendering ${jobs.length} line(s)…`);
  execFileSync(PY, ['kokoro_tts.py', 'audio/jobs.json'], { stdio: ['ignore', 'inherit', 'inherit'] });
  for (const l of todo) {
    const raw = `audio/${l.id}.24k.wav`, out = `audio/${l.id}.wav`;
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le', out]);
    // Kokoro leaves 0.2–0.8 s of silence around a line: trim it, so a line
    // placed at t starts speaking at t and cues land on their words.
    const { samples: x, rate } = readWav(out);
    let peak = 0; for (const v of x) peak = Math.max(peak, Math.abs(v));
    let a = 0, b = x.length - 1;
    while (a < b && Math.abs(x[a]) < peak * 0.02) a++;
    while (b > a && Math.abs(x[b]) < peak * 0.02) b--;
    writeWav(out, x.subarray(Math.max(0, a - Math.round(rate * 0.04)), Math.min(x.length, b + Math.round(rate * 0.15))), rate);
    writeFileSync(`audio/${l.id}.hash`, hashOf(l));
    rmSync(raw);
  }
  rmSync('audio/jobs.json');
}

// ---- durations ----------------------------------------------------------------
const dur = {};
for (const l of lines) { const { samples, rate } = readWav(`audio/${l.id}.wav`); dur[l.id] = +(samples.length / rate).toFixed(3); }
const map = (f) => JSON.stringify(Object.fromEntries(lines.map((l) => [l.id, f(l)])));
writeFileSync('durations.json', JSON.stringify(dur, null, 1));
writeFileSync('durations.js', `window.DUR = ${JSON.stringify(dur, null, 1)};\nwindow.LINES = ${map((l) => l.text)};\nwindow.LINES_SAY = ${map(spoken)};\n`);
for (const l of lines) console.log(`${l.id.padEnd(12)} ${String(dur[l.id]).padStart(6)}s  ${l.voice.padEnd(12)} ${label(l.voice).padEnd(10)} ${spoken(l)}`);
console.log(`speech total ${Object.values(dur).reduce((s, d) => s + d, 0).toFixed(1)}s`);
