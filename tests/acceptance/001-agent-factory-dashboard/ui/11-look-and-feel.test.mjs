// The quality expectations that are measurable in the browser: dark only, desktop, immediate,
// English, no money, no light mode, no phone layout, nothing fetched from anywhere else.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { withPage, shot, BASE, SHOTS } from './lib.mjs';

const PAGES = ['/', '/?tab=pipeline', '/?tab=analytics', '/ticket/001', '/ticket/004'];

test('QE4 dark only: the design\'s palette, and a light system preference changes nothing', async () => {
  await withPage(async (page) => {
    for (const path of PAGES) {
      await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
      const style = await page.evaluate(() => {
        const s = getComputedStyle(document.body.firstElementChild);
        return { bg: s.backgroundColor, fg: s.color, font: s.fontFamily, size: s.fontSize };
      });
      assert.equal(style.bg, 'rgb(10, 12, 15)', `${path}: the design's page background`);
      assert.equal(style.fg, 'rgb(230, 233, 238)', `${path}: the design's text colour`);
      assert.match(style.font, /IBM Plex Sans/, `${path}: the design's font`);
      assert.equal(style.size, '14px');
    }
  });

  await withPage(
    async (page) => {
      await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
      const bg = await page.evaluate(() => getComputedStyle(document.body.firstElementChild).backgroundColor);
      assert.equal(bg, 'rgb(10, 12, 15)', 'there is no light mode to fall into');
    },
    { colorScheme: 'light' },
  );
});

test('QE3 a normal computer screen: no sideways scrolling, no phone layout', async () => {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1024, height: 768 }]) {
    await withPage(
      async (page) => {
        for (const path of PAGES) {
          await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
          const m = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
          assert.ok(m.scroll <= m.client, `${path} at ${viewport.width} px: ${m.scroll} > ${m.client}`);
        }
      },
      { viewport },
    );
  }
});

test('everything the page loads comes from the dashboard itself — no CDN, no font service', async () => {
  await withPage(async (page, requests) => {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.goto(BASE + '/ticket/001', { waitUntil: 'networkidle' });
    for (const url of requests) assert.ok(url.startsWith(BASE), `off-site request: ${url}`);
    const fonts = await page.evaluate(() => [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.status}`));
    assert.ok(fonts.some((f) => f.includes('IBM Plex Mono')), 'the design\'s mono font is there: ' + fonts.join(', '));
  });
});

test('out of scope: no money anywhere, and no way to act from the page', async () => {
  await withPage(async (page) => {
    for (const path of PAGES) {
      await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
      const body = await page.innerText('body');
      assert.ok(!/[€$£]|\bEUR\b|\bUSD\b|\bcost\b/i.test(body), `${path} shows no money`);
      const controls = await page.$$eval('button, input, form, textarea, select', (n) => n.map((e) => `${e.tagName}:${e.dataset.tab || e.type || ''}`));
      for (const c of controls) {
        assert.match(c, /^BUTTON:(attention|pipeline|analytics)$/, `the only controls are the three tabs, found ${c}`);
      }
    }
  });
});

test('QE2 opening the dashboard feels immediate', async () => {
  const samples = [];
  await withPage(async (page) => {
    for (let i = 0; i < 12; i++) {
      await page.goto(BASE + '/?tab=analytics', { waitUntil: 'load' });
      samples.push(await page.evaluate(() => {
        const n = performance.getEntriesByType('navigation')[0];
        return { ttfb: Math.round(n.responseStart), loaded: Math.round(n.domContentLoadedEventEnd) };
      }));
    }
    for (const path of ['/', '/ticket/001']) {
      await page.goto(BASE + path, { waitUntil: 'load' });
    }
  });
  const loaded = samples.map((s) => s.loaded).sort((a, b) => a - b);
  const p95 = loaded[Math.floor(loaded.length * 0.95) - 1] ?? loaded[loaded.length - 1];
  writeFileSync(`${SHOTS}/page-load.json`, JSON.stringify({ samples, p95 }, null, 1));
  assert.ok(p95 < 1000, `the whole page is interactive in ${p95} ms (p95 of ${samples.length} loads)`);
});

test('the language of the page is English', async () => {
  await withPage(async (page) => {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    const chrome = ['Control room', 'Agent Factory', 'Attention', 'Pipeline', 'Analytics', 'Running on their own', 'status ·', 'owner ·', 'idle ·', 'loops ·', 'you ·', 'open ticket'];
    const body = await page.innerText('body');
    for (const s of chrome) assert.ok(body.toLowerCase().includes(s.toLowerCase()), `the page says "${s}"`);
    await page.goto(BASE + '/ticket/001', { waitUntil: 'domcontentloaded' });
    const detail = await page.innerText('body');
    for (const s of ['back to', 'lead time', 'agent compute', 'loops', 'your calls', 'tokens', 'runs', 'Route · swimlanes over time', 'Agent output log', 'Tokens per agent', 'Your involvement', 'Status trail']) {
      assert.ok(detail.toLowerCase().includes(s.toLowerCase()), `the detail view says "${s}"`);
    }
    await shot(page, 'detail-full');
  });
});
