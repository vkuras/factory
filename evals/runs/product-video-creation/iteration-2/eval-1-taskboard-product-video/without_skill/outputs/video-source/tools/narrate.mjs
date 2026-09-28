// Synthesizes each phrase with macOS `say`, trims silence, measures it, and writes
// stage/timeline.json (absolute start/end of every scene and phrase) plus captions.srt.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SCR = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const script = JSON.parse(readFileSync(join(SCR, 'tools/script.json'), 'utf8'));
const AUDIO = join(SCR, 'audio');
mkdirSync(AUDIO, { recursive: true });

const run = (cmd, args) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
const duration = (f) =>
  Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).trim());

let t = 0;
const scenes = [];
for (const scene of script.scenes) {
  const s = { id: scene.id, start: t, phrases: [] };
  t += scene.lead;
  scene.phrases.forEach((p, i) => {
    const aiff = join(AUDIO, `${p.id}.aiff`);
    const wav = join(AUDIO, `${p.id}.wav`);
    run('say', ['-v', script.voice, '-r', String(script.rate), '-o', aiff, p.text]);
    // Trim leading/trailing silence so phrase timing is exact, resample to 48 kHz mono.
    run('ffmpeg', ['-y', '-v', 'error', '-i', aiff, '-af',
      'silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.06,areverse',
      '-ar', '48000', '-ac', '1', wav]);
    const d = duration(wav);
    s.phrases.push({ id: p.id, text: p.text, start: +t.toFixed(3), end: +(t + d).toFixed(3), file: `${p.id}.wav` });
    t += d + (i < scene.phrases.length - 1 ? (p.pause ?? 0.35) : 0);
  });
  t += scene.tail;
  s.end = +t.toFixed(3);
  scenes.push(s);
}

const timeline = { fps: 30, duration: +t.toFixed(3), scenes };
writeFileSync(join(SCR, 'stage/timeline.json'), JSON.stringify(timeline, null, 2));

const ts = (x) => {
  const ms = Math.round(x * 1000);
  const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
  const sec = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
  return `${h}:${m}:${sec},${String(ms % 1000).padStart(3, '0')}`;
};
const srt = scenes
  .flatMap((s) => s.phrases)
  .map((p, i) => `${i + 1}\n${ts(p.start)} --> ${ts(p.end + 0.25)}\n${p.text}\n`)
  .join('\n');
writeFileSync(join(SCR, 'out/captions.srt'), srt);

for (const s of scenes) {
  console.log(`${s.id.padEnd(7)} ${s.start.toFixed(2).padStart(6)} → ${s.end.toFixed(2).padStart(6)}  ` +
    s.phrases.map((p) => `${p.id}:${(p.end - p.start).toFixed(2)}`).join(' '));
}
console.log('total', timeline.duration.toFixed(2), 's');
