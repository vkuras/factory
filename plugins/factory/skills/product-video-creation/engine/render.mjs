// Renders the page frame by frame with parallel headless Chromium workers,
// encodes with ffmpeg, lays the live product recordings over their slots,
// mixes the soundtrack and muxes out/<video name>.mp4.
// --preview: 960×540 at 15 fps → out/preview.mp4
import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import os from 'node:os';
import { serve } from './server.mjs';
import { mix } from './mix.mjs';

const PREVIEW = process.argv.includes('--preview');
const FPS = PREVIEW ? 15 : 30, DSF = PREVIEW ? 0.5 : 1;
const WORKERS = Math.max(2, Math.min(8, Math.floor(os.cpus().length / 2)));
mkdirSync('out', { recursive: true });
const { srv, url } = await serve();
const browser = await chromium.launch();

async function openPage() {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: DSF });
  page.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.READY, null, { timeout: 60000 });
  return page;
}
const first = await openPage();
const { total, cues, clips } = await first.evaluate(() => ({ total: window.TOTAL, cues: window.CUES, clips: window.V.clips }));
const frames = Math.ceil(total * FPS);
console.log(`total ${total}s · ${frames} frames @ ${FPS} fps · ${WORKERS} workers`);

const t0 = Date.now();
let done = 0;
async function worker(k, page) {
  const from = Math.floor((frames * k) / WORKERS), to = Math.floor((frames * (k + 1)) / WORKERS);
  const file = `out/seg-${k}.mp4`;
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', PREVIEW ? 'veryfast' : 'slow', '-crf', PREVIEW ? '26' : '16', '-pix_fmt', 'yuv420p', '-r', String(FPS), file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const cdp = await page.context().newCDPSession(page);
  for (let f = from; f < to; f++) {
    await page.evaluate((t) => window.seek(t), f / FPS);
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 94, optimizeForSpeed: true });
    if (!ff.stdin.write(Buffer.from(data, 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
    if (++done % 150 === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`${done}/${frames} frames · ${el.toFixed(0)}s · eta ${((el / done) * (frames - done)).toFixed(0)}s`);
    }
  }
  ff.stdin.end();
  await new Promise((r, j) => ff.on('close', (c) => (c ? j(new Error('ffmpeg ' + c)) : r())));
  return file;
}
const pages = [first, ...(await Promise.all(Array.from({ length: WORKERS - 1 }, openPage)))];
const segs = await Promise.all(pages.map((p, k) => worker(k, p)));
await browser.close(); srv.close();

writeFileSync('out/segs.txt', segs.map((s) => `file '${s.replace('out/', '')}'`).join('\n'));
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', 'out/segs.txt', '-c', 'copy', 'out/video.mp4']);
let video = 'out/video.mp4';
if (clips.length) {
  // Each recording fades in over its slot on the stage and fades out at its end.
  const vw = +execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width', '-of', 'default=nw=1:nk=1', video]).toString().trim();
  const k = vw / 1920, F = 0.4, ev = (v) => 2 * Math.round((v * k) / 2);
  const ins = clips.flatMap((c) => ['-i', `recordings/${c.name}.mp4`]);
  let g = '', last = '0:v';
  clips.forEach((c, i) => {
    const b = c.box;
    g += `[${i + 1}:v]scale=${ev(b.w)}:${ev(b.h)},fps=${FPS},format=yuva420p,fade=t=in:st=0:d=${F}:alpha=1,fade=t=out:st=${(c.dur - F).toFixed(3)}:d=${F}:alpha=1,setpts=PTS-STARTPTS+${c.at.toFixed(3)}/TB[c${i}];`;
    g += `[${last}][c${i}]overlay=x=${Math.round(b.x * k)}:y=${Math.round(b.y * k)}:eof_action=pass:format=auto[v${i}];`;
    last = `v${i}`;
  });
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', video, ...ins, '-filter_complex', g.slice(0, -1), '-map', `[${last}]`,
    '-c:v', 'libx264', '-preset', PREVIEW ? 'veryfast' : 'slow', '-crf', PREVIEW ? '26' : '16', '-pix_fmt', 'yuv420p', 'out/video-clips.mp4']);
  video = 'out/video-clips.mp4';
}
console.log('mixing audio…');
const wav = mix(cues, total);
const NAME = JSON.parse(readFileSync('package.json', 'utf8')).name;
const outFile = PREVIEW ? 'out/preview.mp4' : `out/${NAME}.mp4`;
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', video, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
  '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-ac', '2', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', outFile]);
// Poster for the README: a frame from the middle of the first product recording.
const posterAt = clips.length ? clips[0].at + clips[0].dur * 0.55 : total * 0.5;
execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', posterAt.toFixed(2), '-i', outFile, '-frames:v', '1', '-q:v', '3', PREVIEW ? 'out/preview-poster.jpg' : `out/${NAME}.jpg`]);
console.log(`done → ${outFile} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
