// usage:
//   node render.mjs preview <outDir> <t1> <t2> ...   -> PNG stills at those times (state advances in order)
//   node render.mjs video <out.mp4> [dpr]            -> every frame piped into ffmpeg (silent H.264)
// Run tools/servers.sh reset before each invocation: the demo mutates the app's data.
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { launch } from './cdp.mjs';

const [mode, out, ...rest] = process.argv.slice(2);
const dpr = mode === 'video' && rest[0] ? Number(rest[0]) : 1;
const b = await launch({ width: 1920, height: 1080 });
try {
  const p = await b.newPage({ w: 1920, h: 1080, dpr });
  await p.send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await p.goto('http://127.0.0.1:8212/__stage/index.html');
  const info = await p.eval('stage.init()');
  console.log('stage ready', info);
  if (mode === 'video') writeFileSync(out.replace(/\.mp4$/, '') + '.events.json', JSON.stringify(info, null, 2));

  if (mode === 'preview') {
    mkdirSync(out, { recursive: true });
    const times = rest.map(Number).sort((x, y) => x - y);
    for (const t of times) {
      await p.eval(`stage.tick(${t})`);
      const f = join(out, `t${t.toFixed(2).padStart(6, '0')}.png`);
      writeFileSync(f, await p.screenshot());
      console.log('wrote', f);
    }
  } else if (mode === 'video') {
    const fps = info.fps;
    const n = Math.ceil(info.duration * fps);
    const vf = dpr !== 1 ? ['-vf', 'scale=1920:1080:flags=lanczos'] : [];
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
      ...vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', String(fps), '-movflags', '+faststart', out],
      { stdio: ['pipe', 'inherit', 'inherit'] });
    const started = Date.now();
    for (let i = 0; i < n; i++) {
      await p.eval(`stage.tick(${(i / fps).toFixed(5)})`);
      const buf = await p.screenshot();
      if (!ff.stdin.write(buf)) await once(ff.stdin, 'drain');
      if (i % 150 === 0) console.log(`frame ${i}/${n}  ${((Date.now() - started) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end();
    const [code] = await once(ff, 'exit');
    if (code !== 0) throw new Error('ffmpeg failed ' + code);
    console.log(`done: ${n} frames in ${((Date.now() - started) / 1000).toFixed(0)}s -> ${out}`);
  }
} finally {
  await b.close();
}
