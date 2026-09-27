// Records the Taskboard product video: per segment a Playwright screen recording plus
// narration clips synthesized with `say`, timed so each scene lasts as long as its line.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = 'http://localhost:8106';
const OUT = new URL('./build/', import.meta.url).pathname;
const VOICE = process.env.VOICE ?? 'Ava (Enhanced)';
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lines = {
  intro: 'Meet Taskboard. The shared to-do list for a small team that works in one room.',
  add: "Something comes up? Type it in and press Enter. It's on the list right away, newest first.",
  validate: 'Forget the title, and Taskboard tells you. Add one, and the message is gone.',
  done: "Finished? Tick it off. Done tasks drop below the open ones, struck through, so everyone sees what's left.",
  del: 'And mistakes disappear with a single click.',
  phone: 'It works just as well on a phone, held in one hand.',
  outro: 'No accounts, no setup. Taskboard runs on your own office machine, and starts with one command.',
};

function synth(key) {
  const aiff = `${OUT}${key}.aiff`;
  execFileSync('say', ['-v', VOICE, '-r', '180', '-o', aiff, lines[key]]);
  const d = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', aiff]).toString();
  return { file: aiff, dur: Number(d) * 1000 };
}
const audio = Object.fromEntries(Object.keys(lines).map((k) => [k, synth(k)]));

async function api(method, path, body) {
  const r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
  return r.status === 204 ? null : r.json();
}
async function reset() {
  const { tasks } = await api('GET', '/api/tasks');
  for (const t of tasks) await api('DELETE', `/api/tasks/${t.id}`);
}

const CURSOR = `
  window.addEventListener('DOMContentLoaded', () => {
    const c = document.createElement('div');
    c.id = 'fake-cursor';
    c.style.cssText = 'position:fixed;left:0;top:0;width:22px;height:22px;border-radius:50%;background:rgba(47,111,79,.35);border:2px solid #2f6f4f;pointer-events:none;z-index:99999;transform:translate(-50%,-50%) translate(-100px,-100px);transition:width .1s,height .1s';
    document.body.appendChild(c);
    addEventListener('mousemove', (e) => { c.style.transform = 'translate(-50%,-50%) translate(' + e.clientX + 'px,' + e.clientY + 'px)'; }, true);
    addEventListener('mousedown', () => { c.style.width = c.style.height = '16px'; }, true);
    addEventListener('mouseup', () => { c.style.width = c.style.height = '22px'; }, true);
  });`;

const card = (title, sub) => `<!doctype html><html><body style="margin:0;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#2f6f4f;color:#fff;font-family:system-ui,-apple-system,sans-serif">
  <div style="font-size:64px;font-weight:700;letter-spacing:-1px">${title}</div>
  <div style="font-size:26px;margin-top:16px;opacity:.85">${sub}</div></body></html>`;

// Runs scenes in one recorded context; returns {video, trimMs, cues:[{key, atMs}]}.
async function segment(name, ctxOpts, run) {
  const browser = await chromium.launch();
  const { videoSize, ...opts } = ctxOpts;
  const ctx = await browser.newContext({ ...opts, recordVideo: { dir: OUT + name, size: videoSize } });
  const page = await ctx.newPage();
  const t0 = Date.now();
  const cues = [];
  let trimMs = 0;
  const scene = async (key, action) => {
    const start = Date.now();
    if (!cues.length) trimMs = start - t0;
    cues.push({ key, atMs: start - t0 });
    await action();
    const left = audio[key].dur + 450 - (Date.now() - start);
    if (left > 0) await sleep(left);
  };
  await run(page, scene);
  await sleep(300);
  const video = await page.video().path();
  await ctx.close();
  await browser.close();
  return { name, video, trimMs, cues };
}

async function moveTo(page, locator) {
  const b = await locator.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 25 });
  await sleep(150);
}
async function clickOn(page, locator) {
  await moveTo(page, locator);
  await page.mouse.down(); await sleep(80); await page.mouse.up();
}

await reset();
const segs = [];

segs.push(await segment('desktop', { viewport: { width: 1024, height: 576 }, deviceScaleFactor: 2, videoSize: { width: 1024, height: 576 } }, async (page, scene) => {
  await page.addInitScript(CURSOR);
  await page.setContent(card('Taskboard', 'Write it down. Tick it off.'));
  await sleep(200);
  await scene('intro', async () => {
    await sleep(2600);
    await page.goto(BASE);
    await page.waitForSelector('#empty:not([hidden])');
    await page.mouse.move(700, 400);
  });
  await scene('add', async () => {
    const input = page.locator('#title');
    await clickOn(page, input);
    for (const t of ['Order printer paper', 'Call the plumber about the sink']) {
      await input.pressSequentially(t, { delay: 45 });
      await sleep(200);
      await page.keyboard.press('Enter');
      await page.waitForFunction((x) => [...document.querySelectorAll('li .title')].some((e) => e.textContent === x), t);
      await sleep(350);
    }
  });
  await scene('validate', async () => {
    await clickOn(page, page.locator('#new-task button'));
    await page.waitForSelector('#error:not([hidden])');
    await sleep(1400);
    const input = page.locator('#title');
    await clickOn(page, input);
    await input.pressSequentially('Book a table for Friday lunch', { delay: 45 });
    await page.keyboard.press('Enter');
    await page.waitForSelector('#error', { state: 'hidden' });
  });
  await scene('done', async () => {
    const row = page.locator('li', { hasText: 'Call the plumber' });
    await clickOn(page, row.locator('input[type=checkbox]'));
    await page.waitForSelector('li.done');
    await sleep(600);
    await moveTo(page, page.locator('li.done .title'));
  });
  await scene('del', async () => {
    const row = page.locator('li', { hasText: 'Order printer paper' });
    await clickOn(page, row.locator('button'));
    await row.waitFor({ state: 'detached' });
  });
}));

segs.push(await segment('phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, videoSize: { width: 390, height: 844 } }, async (page, scene) => {
  await page.goto(BASE);
  await page.waitForSelector('li');
  await sleep(200);
  await scene('phone', async () => {
    await sleep(500);
    await page.tap('#title');
    await page.locator('#title').pressSequentially('Water the plants', { delay: 60 });
    await page.tap('#new-task button');
    await page.waitForSelector('li:has-text("Water the plants")');
    await sleep(500);
    await page.tap('li:has-text("Book a table") input[type=checkbox]');
  });
}));

segs.push(await segment('outro', { viewport: { width: 1024, height: 576 }, deviceScaleFactor: 2, videoSize: { width: 1024, height: 576 } }, async (page, scene) => {
  await page.setContent(card('Taskboard', 'docker compose up -d'));
  await sleep(200);
  await scene('outro', async () => {});
}));

writeFileSync(OUT + 'plan.json', JSON.stringify({ segs, audio }, null, 2));
console.log(JSON.stringify({ segs, durations: Object.fromEntries(Object.entries(audio).map(([k, v]) => [k, Math.round(v.dur)])) }, null, 2));
