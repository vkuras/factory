// node stills.mjs 3 10.5 20  → out/still-<t>.png for quick visual checks.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { serve } from './server.mjs';

mkdirSync('out', { recursive: true });
const { srv, url } = await serve();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
page.on('console', (m) => m.type() === 'error' && console.error('console', m.text()));
await page.goto(url);
await page.waitForFunction(() => window.READY, null, { timeout: 30000 });
console.log('TOTAL', await page.evaluate(() => window.TOTAL));
for (const a of process.argv.slice(2)) {
  const t = +a;
  await page.evaluate((t) => window.seek(t), t);
  await page.screenshot({ path: `out/still-${t}.png`, scale: 'css' });
}
await browser.close(); srv.close();
