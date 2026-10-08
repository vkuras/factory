// Minimal Chrome DevTools Protocol client over --remote-debugging-pipe (no ports, no npm deps).
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export const CHROME =
  process.env.CHROME ??
  `${process.env.HOME}/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell`;

export async function launch({ width = 1920, height = 1080, profileDir } = {}) {
  const userDataDir = profileDir ?? mkdtempSync(join(process.env.SCRATCH ?? tmpdir(), 'chrome-'));
  const args = [
    '--headless',
    '--remote-debugging-pipe',
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--mute-audio',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    '--force-color-profile=srgb',
    `--window-size=${width},${height}`,
    'about:blank',
  ];
  const proc = spawn(CHROME, args, { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });
  let stderr = '';
  proc.stderr.on('data', (d) => (stderr += d));
  const writer = proc.stdio[3];
  const reader = proc.stdio[4];

  let nextId = 1;
  const pending = new Map();
  const listeners = new Set();
  let buf = '';
  reader.on('data', (chunk) => {
    buf += chunk.toString('utf8');
    let idx;
    while ((idx = buf.indexOf('\0')) !== -1) {
      const raw = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      const msg = JSON.parse(raw);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject, method } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(`${method}: ${msg.error.message} ${msg.error.data ?? ''}`));
        else resolve(msg.result);
      } else if (msg.method) {
        for (const l of listeners) l(msg);
      }
    }
  });

  function send(method, params = {}, sessionId) {
    const id = nextId++;
    const msg = { id, method, params };
    if (sessionId) msg.sessionId = sessionId;
    writer.write(JSON.stringify(msg) + '\0');
    return new Promise((resolve, reject) => pending.set(id, { resolve, reject, method }));
  }

  function waitFor(method, sessionId, predicate = () => true, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        listeners.delete(l);
        reject(new Error(`timeout waiting for ${method}`));
      }, timeout);
      const l = (msg) => {
        if (msg.method === method && (!sessionId || msg.sessionId === sessionId) && predicate(msg.params)) {
          clearTimeout(timer);
          listeners.delete(l);
          resolve(msg.params);
        }
      };
      listeners.add(l);
    });
  }

  async function newPage({ w = width, h = height, dpr = 1, mobile = false } = {}) {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const s = (m, p) => send(m, p, sessionId);
    await s('Page.enable');
    await s('Runtime.enable');
    await s('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile });
    const page = {
      sessionId,
      send: s,
      on(method, fn) {
        const l = (msg) => msg.method === method && msg.sessionId === sessionId && fn(msg.params);
        listeners.add(l);
        return () => listeners.delete(l);
      },
      async goto(url) {
        const loaded = waitFor('Page.loadEventFired', sessionId);
        const r = await s('Page.navigate', { url });
        if (r.errorText) throw new Error(`navigate ${url}: ${r.errorText}`);
        await loaded;
      },
      async eval(expression) {
        const r = await s('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
        if (r.exceptionDetails) {
          const d = r.exceptionDetails;
          throw new Error(`eval failed: ${d.exception?.description ?? d.text}`);
        }
        return r.result.value;
      },
      async screenshot({ format = 'png', quality } = {}) {
        const p = { format, captureBeyondViewport: false };
        if (quality) p.quality = quality;
        const { data } = await s('Page.captureScreenshot', p);
        return Buffer.from(data, 'base64');
      },
    };
    return page;
  }

  async function close() {
    try {
      await Promise.race([send('Browser.close'), new Promise((r) => setTimeout(r, 2000))]);
    } catch {}
    proc.kill('SIGKILL');
    if (!profileDir) rmSync(userDataDir, { recursive: true, force: true });
  }

  return { send, newPage, close, proc, stderr: () => stderr };
}
