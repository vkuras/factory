// Renders every line in lines.mjs with macOS `say` and a premium voice into
// audio/<id>.wav, and writes durations.js (for the page) and durations.json
// (for record.mjs). Every visual cue is timed from these durations.
//
// Premium voices rush sentence and list boundaries, which is what makes them
// sound read out by a machine. Unless a line brings its own [[slnc N]] marks,
// pauses are inserted automatically: after a sentence, after : ; and dashes,
// and after every comma (list items). PRONOUNCE respells words for the voice only.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as L from './lines.mjs';
import { readWav } from './wav.mjs';

const { lines } = L, PRONOUNCE = L.PRONOUNCE || {};

export const PAUSE = { sentence: 320, colon: 220, dash: 200, comma: 140 };

export function spoken(l) {
  let s = l.say || l.text;
  for (const [w, r] of Object.entries(PRONOUNCE)) s = s.replace(new RegExp(`\\b${w}\\b`, 'g'), r);
  if (s.includes('[[slnc')) return s;
  return s
    .replace(/([.!?…])\s+(?=\S)/g, `$1 [[slnc ${PAUSE.sentence}]] `)
    .replace(/([:;])\s+/g, `$1 [[slnc ${PAUSE.colon}]] `)
    .replace(/\s+[—–]\s+/g, `, [[slnc ${PAUSE.dash}]] `)
    .replace(/,\s+(?!\[\[)/g, `, [[slnc ${PAUSE.comma}]] `);
}

mkdirSync('audio', { recursive: true });
const installed = execFileSync('say', ['-v', '?']).toString();
const dur = {};
for (const l of lines) {
  const voice = `${l.voice} (Premium)`;
  if (!installed.includes(voice)) throw new Error(`Premium voice not installed: ${voice}. Install it (System Settings → Accessibility → Spoken Content → System voice ⓘ → Voice → search "Premium") or pick one from: say -v '?' | grep Premium`);
  const text = spoken(l);
  const hash = createHash('sha1').update(voice + (l.rate || '') + text).digest('hex').slice(0, 8);
  const file = `audio/${l.id}.wav`, stamp = `audio/${l.id}.hash`;
  if (!existsSync(file) || !existsSync(stamp) || readFileSync(stamp, 'utf8') !== hash) {
    const args = ['-v', voice, '--file-format=WAVE', '--data-format=LEI16@48000', '-o', file];
    if (l.rate) args.push('-r', String(l.rate));
    execFileSync('say', [...args, text]);
    writeFileSync(stamp, hash);
  }
  const { samples, rate } = readWav(file);
  dur[l.id] = +(samples.length / rate).toFixed(3);
}
const map = (f) => JSON.stringify(Object.fromEntries(lines.map((l) => [l.id, f(l)])));
writeFileSync('durations.json', JSON.stringify(dur, null, 1));
writeFileSync('durations.js', `window.DUR = ${JSON.stringify(dur, null, 1)};\nwindow.LINES = ${map((l) => l.text)};\nwindow.LINES_SAY = ${map(spoken)};\n`);
for (const l of lines) console.log(`${l.id.padEnd(12)} ${String(dur[l.id]).padStart(6)}s  ${l.voice.padEnd(8)} ${spoken(l)}`);
console.log(`speech total ${Object.values(dur).reduce((a, b) => a + b, 0).toFixed(1)}s`);
