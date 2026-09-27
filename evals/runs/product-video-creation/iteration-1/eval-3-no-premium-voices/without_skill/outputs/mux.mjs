// Turns build/plan.json into final.mp4: trims each recording, lays narration on its cues,
// frames the phone recording on a 1920x1080 background, then concatenates the segments.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const OUT = new URL('./build/', import.meta.url).pathname;
const { segs, audio } = JSON.parse(readFileSync(OUT + 'plan.json', 'utf8'));
const ff = (args) => execFileSync('ffmpeg', ['-y', '-v', 'error', ...args], { stdio: 'inherit' });

const parts = [];
for (const s of segs) {
  const trim = s.trimMs / 1000;
  const inputs = ['-ss', String(trim), '-i', s.video];
  const filters = [];
  const vf = s.name === 'phone'
    ? '[0:v]scale=-2:1000:flags=lanczos,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x2f6f4f,setsar=1,fps=30,format=yuv420p[v]'
    : '[0:v]scale=1920:1080:flags=lanczos,setsar=1,fps=30,format=yuv420p[v]';
  filters.push(vf);
  const labels = [];
  s.cues.forEach((c, i) => {
    inputs.push('-i', audio[c.key].file);
    const delay = Math.max(0, c.atMs - s.trimMs + 150);
    filters.push(`[${i + 1}:a]aresample=48000,adelay=${delay}|${delay}[a${i}]`);
    labels.push(`[a${i}]`);
  });
  filters.push(`${labels.join('')}amix=inputs=${labels.length}:normalize=0,apad[a]`);
  const out = `${OUT}${s.name}.mp4`;
  ff([...inputs, '-filter_complex', filters.join(';'), '-map', '[v]', '-map', '[a]', '-shortest',
    '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-c:a', 'aac', '-b:a', '160k', '-ac', '2', out]);
  parts.push(out);
}

// Concatenate with short fades between segments.
const list = parts.map((p) => `file '${p}'`).join('\n');
writeFileSync(OUT + 'list.txt', list);
ff(['-f', 'concat', '-safe', '0', '-i', OUT + 'list.txt', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', OUT + 'final.mp4']);
console.log('ok', OUT + 'final.mp4');
