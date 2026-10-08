// Builds the soundtrack: narration phrases at their timeline positions plus soft UI clicks,
// then two-pass EBU R128 loudness normalization (-16 LUFS, -1.5 dBTP), 48 kHz stereo.
// usage: node mix.mjs <events.json> <out.wav>
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SCR = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const [eventsFile, out] = process.argv.slice(2);
const tl = JSON.parse(readFileSync(join(SCR, 'stage/timeline.json'), 'utf8'));
const ev = JSON.parse(readFileSync(eventsFile, 'utf8'));
const A = join(SCR, 'audio');
const ff = (args) => execFileSync('ffmpeg', ['-y', '-hide_banner', ...args], { stdio: ['ignore', 'pipe', 'pipe'] });

// A short mouse click and a softer screen tap, synthesized (no downloaded assets).
ff(['-v', 'error', '-f', 'lavfi', '-i',
  "aevalsrc='0.55*sin(2*PI*2300*t)*exp(-t*140)+0.35*(random(1)*2-1)*exp(-t*420)':s=48000:d=0.07",
  '-af', 'highpass=f=900,volume=0.5', join(A, 'click.wav')]);
ff(['-v', 'error', '-f', 'lavfi', '-i',
  "aevalsrc='0.6*sin(2*PI*1150*t)*exp(-t*110)+0.2*(random(2)*2-1)*exp(-t*500)':s=48000:d=0.08",
  '-af', 'highpass=f=500,volume=0.45', join(A, 'tap.wav')]);

const inputs = [];
const parts = [];
const add = (file, t, gain = 1) => {
  const i = inputs.length / 2;
  inputs.push('-i', file);
  const ms = Math.round(t * 1000);
  parts.push(`[${i}:a]aresample=48000,aformat=channel_layouts=mono,volume=${gain},adelay=${ms}:all=1[a${i}]`);
};
for (const s of tl.scenes) for (const p of s.phrases) add(join(A, p.file), p.start);
for (const t of ev.clicks) add(join(A, 'click.wav'), t, 0.5);
for (const t of ev.taps) add(join(A, 'tap.wav'), t, 0.5);

const n = inputs.length / 2;
const labels = Array.from({ length: n }, (_, i) => `[a${i}]`).join('');
const graph = `${parts.join(';')};${labels}amix=inputs=${n}:normalize=0:dropout_transition=0,apad,atrim=0:${tl.duration},aformat=channel_layouts=stereo[mix]`;
const raw = out.replace(/\.wav$/, '.raw.wav');
ff(['-v', 'error', ...inputs, '-filter_complex', graph, '-map', '[mix]', '-ar', '48000', '-c:a', 'pcm_s16le', raw]);

// Pass 1: measure (loudnorm prints its JSON on stderr). Pass 2: linear normalization.
const probe = execFileSync('sh', ['-c', `ffmpeg -hide_banner -nostats -i "${raw}" -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p'`], { encoding: 'utf8' });
const m = JSON.parse(probe);
const ln = `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true:print_format=summary`;
ff(['-v', 'error', '-i', raw, '-af', ln, '-ar', '48000', '-c:a', 'pcm_s16le', out]);
console.log('input loudness', m.input_i, 'LUFS, true peak', m.input_tp, '-> normalized', out);
