// Records the real product live: node record.mjs <name>
// Runs flows/<name>.mjs against the running product in Chromium, in real time:
// the pointer travels, clicks land, every key is pressed at human speed.
// Frames come from the browser's own compositor (CDP screencast), so what ends
// up in the video is exactly what the product rendered.
//
// Output: recordings/<name>.mp4 (1920×1080, 30 fps), recordings/<name>.json
// (duration, narration cues, UI sounds) and recordings.js for the page.
import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const name = process.argv[2];
if (!name) throw new Error('usage: node record.mjs <flow name>   (flows/<name>.mjs)');
const flowMod = await import(pathToFileURL(path.resolve(`flows/${name}.mjs`)).href);
const flow = flowMod.default, opts = flowMod.options || {};
const DUR = existsSync('durations.json') ? JSON.parse(readFileSync('durations.json', 'utf8')) : {};
// The recording is sized for where it lands on the stage: options.size is the
// clip's box in stage pixels (default full frame 1920×1080), options.viewport.width
// the CSS width the product is laid out at. A narrow viewport enlarges the UI:
// pick it so the product's content fills the frame and its text is readable.
const even = (v) => 2 * Math.round(v / 2);
const FPS = 30, OUT_W = even(opts.size?.w || 1920), OUT_H = even(opts.size?.h || 1080);
const VW = opts.viewport?.width || 1440, VH = Math.round(VW * OUT_H / OUT_W), DSF = OUT_W / VW;

mkdirSync('recordings', { recursive: true });
const frameDir = `recordings/.${name}-frames`;
rmSync(frameDir, { recursive: true, force: true });
mkdirSync(frameDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: DSF, colorScheme: opts.colorScheme || 'light', ...(opts.context || {}) });
// The headless browser has no pointer of its own: draw the system arrow on top
// of the page, driven by the real mouse events Playwright sends.
await context.addInitScript(() => {
  const mount = () => {
    if (document.getElementById('__pvc_cursor')) return;
    const c = document.createElement('div');
    c.id = '__pvc_cursor';
    c.innerHTML = '<svg width="22" height="30" viewBox="0 0 22 30"><path d="M2 2 L2 23 L7.2 18.2 L10.6 26.4 L14 25 L10.7 17 L17.6 16.8 Z" fill="#000" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    c.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);filter:drop-shadow(0 1px 2px rgba(0,0,0,.35));transition:none';
    document.documentElement.appendChild(c);
    const x = window.__pvc_pos || [-100, -100];
    c.style.transform = `translate(${x[0] - 2}px,${x[1] - 2}px)`;
  };
  addEventListener('mousemove', (e) => {
    window.__pvc_pos = [e.clientX, e.clientY];
    const c = document.getElementById('__pvc_cursor');
    if (c) c.style.transform = `translate(${e.clientX - 2}px,${e.clientY - 2}px)`;
  }, true);
  addEventListener('mousedown', () => { const c = document.getElementById('__pvc_cursor'); if (c) c.firstChild.style.transform = 'scale(.88)'; }, true);
  addEventListener('mouseup', () => { const c = document.getElementById('__pvc_cursor'); if (c) c.firstChild.style.transform = ''; }, true);
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', mount); else mount();
  new MutationObserver(mount).observe(document, { childList: true, subtree: true });
});
const page = await context.newPage();
page.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
if (opts.url) await page.goto(opts.url, { waitUntil: 'networkidle' });
if (opts.prepare) await opts.prepare(page);

// ---- capture ----------------------------------------------------------------
const cdp = await context.newCDPSession(page);
const frames = []; // [seconds since start, file]
let t0 = 0, n = 0;
cdp.on('Page.screencastFrame', async ({ data, sessionId }) => {
  const f = `${frameDir}/${String(n++).padStart(6, '0')}.jpg`;
  writeFileSync(f, Buffer.from(data, 'base64'));
  frames.push([now(), f]);
  cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
const now = () => (performance.now() - t0) / 1000;
const sleep = (s) => new Promise((r) => setTimeout(r, Math.max(0, s) * 1000));

// ---- the flow API -------------------------------------------------------------
const cues = [], sfx = [];
let speechEnd = 0, mouse = [VW * 0.62, VH * 0.72];
const rnd = (() => { let s = 7; return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff); })();
const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

async function point(target) {
  if (Array.isArray(target)) return target;
  const loc = typeof target === 'string' ? page.locator(target).first() : target;
  await loc.scrollIntoViewIfNeeded();
  const b = await loc.boundingBox();
  if (!b) throw new Error(`not visible: ${target}`);
  return [b.x + b.width * (0.4 + rnd() * 0.2), b.y + b.height * (0.4 + rnd() * 0.2)];
}
// Human pointer travel: eased, slightly arched, ~0.45–0.9 s depending on distance.
async function moveTo([x, y]) {
  const [x0, y0] = mouse, dist = Math.hypot(x - x0, y - y0);
  const d = Math.min(0.9, 0.35 + dist / 1800), steps = Math.max(8, Math.round(d * 60)), arc = Math.min(40, dist * 0.08);
  for (let i = 1; i <= steps; i++) {
    const p = easeInOut(i / steps);
    await page.mouse.move(x0 + (x - x0) * p, y0 + (y - y0) * p - Math.sin(p * Math.PI) * arc);
    await sleep(d / steps);
  }
  mouse = [x, y];
}
const NEIGHBOUR = { a: 's', e: 'r', i: 'o', o: 'p', t: 'y', n: 'm', r: 't', s: 'd', l: 'k', c: 'v', u: 'i', d: 'f', p: 'o', m: 'n', g: 'h', h: 'j' };
const key = (name) => sfx.push({ name, t: +now().toFixed(3), gain: 0.75 + rnd() * 0.5 });

const p = {
  page,
  /** Seconds since the recording started. */
  now,
  /** Start a narration line now. Waits for the previous line to finish first, so lines never overlap. */
  async say(id, gap = 0.25) {
    if (!(id in DUR)) throw new Error(`no audio for ${id}: add it to lines.mjs and run node tts.mjs`);
    if (now() < speechEnd + gap) await sleep(speechEnd + gap - now());
    cues.push({ id, t: +now().toFixed(3) });
    speechEnd = now() + DUR[id];
  },
  /** Wait until the current narration line has been spoken (plus `extra` seconds). */
  async settle(extra = 0.3) { await sleep(speechEnd + extra - now()); },
  async wait(s) { await sleep(s); },
  async move(target) { await moveTo(await point(target)); },
  async hover(target, hold = 0.4) { await moveTo(await point(target)); await sleep(hold); },
  async click(target, { hold = 0.25 } = {}) {
    await moveTo(await point(target));
    await sleep(0.12 + rnd() * 0.1);
    await page.mouse.down(); key('click'); await sleep(0.07); await page.mouse.up();
    await sleep(hold);
  },
  /** Type like a person, in real time: 50–110 ms per key, longer after words and punctuation, one corrected typo in longer text. */
  async type(text, { target, typo = text.length > 22 } = {}) {
    if (target) await p.click(target);
    const typoAt = typo ? Math.floor(text.length * (0.3 + rnd() * 0.4)) : -1;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i], prev = text[i - 1];
      let d = 0.05 + rnd() * 0.06;
      if (ch === ' ') d += 0.02 + rnd() * 0.05;
      if (prev && /[.,:;!?]/.test(prev)) d += 0.14 + rnd() * 0.12;
      if (rnd() < 0.04) d += 0.2;
      await sleep(d);
      if (i === typoAt && NEIGHBOUR[ch.toLowerCase()]) {
        await page.keyboard.type(NEIGHBOUR[ch.toLowerCase()]); key('key');
        await sleep(0.24 + rnd() * 0.12);
        await page.keyboard.press('Backspace'); key('bs');
        await sleep(0.09);
      }
      await page.keyboard.type(ch); key('key');
    }
  },
  async press(k, hold = 0.3) { await sleep(0.2); await page.keyboard.press(k); key(k === 'Enter' ? 'enter' : 'key'); await sleep(hold); },
  /** Smooth wheel scroll by dy CSS pixels. */
  async scroll(dy, d = 0.8) {
    const steps = Math.round(d * 30);
    for (let i = 0; i < steps; i++) { await page.mouse.wheel(0, dy / steps); await sleep(d / steps); }
    await sleep(0.2);
  },
  async goto(url) { await page.goto(url, { waitUntil: 'networkidle' }); await page.mouse.move(...mouse); },
};

// ---- run ----------------------------------------------------------------------
await page.mouse.move(...mouse);
t0 = performance.now();
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: OUT_W, maxHeight: OUT_H, everyNthFrame: 1 });
await sleep(0.3);
await flow(p);
await p.settle(0.8);
const duration = +now().toFixed(3);
await cdp.send('Page.stopScreencast');
await sleep(0.2);
await browser.close();
if (!frames.length) throw new Error('no frames captured');

// Variable-rate compositor frames → constant 30 fps: every output frame shows
// the newest frame rendered by then.
const out = `recordings/${name}.mp4`;
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
  '-vf', `scale=${OUT_W}:${OUT_H}:force_original_aspect_ratio=decrease,pad=${OUT_W}:${OUT_H}:(ow-iw)/2:(oh-ih)/2:white`,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
let k = 0;
for (let i = 0; i < Math.ceil(duration * FPS); i++) {
  const t = i / FPS;
  while (k + 1 < frames.length && frames[k + 1][0] <= t) k++;
  if (!ff.stdin.write(readFileSync(frames[k][1]))) await new Promise((r) => ff.stdin.once('drain', r));
}
ff.stdin.end();
await new Promise((r, j) => ff.on('close', (c) => (c ? j(new Error('ffmpeg ' + c)) : r())));
// First and last frame as stills: the window around the clip shows them
// while the clip fades in and after it ends, instead of an empty window.
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', out, '-frames:v', '1', '-q:v', '2', `recordings/${name}-first.jpg`]);
execFileSync('ffmpeg', ['-v', 'error', '-y', '-sseof', '-0.1', '-i', out, '-frames:v', '1', '-q:v', '2', `recordings/${name}-last.jpg`]);
rmSync(frameDir, { recursive: true, force: true });

writeFileSync(`recordings/${name}.json`, JSON.stringify({ duration, cues, sfx }, null, 1));
const all = Object.fromEntries(readdirSync('recordings').filter((f) => f.endsWith('.json')).map((f) => [f.slice(0, -5), JSON.parse(readFileSync(`recordings/${f}`, 'utf8'))]));
writeFileSync('recordings.js', `window.REC = ${JSON.stringify(all)};\n`);
console.log(`${out}: ${duration}s, ${frames.length} compositor frames, ${cues.length} narration cues, ${sfx.length} sounds`);
