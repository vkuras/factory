// Browser side of the acceptance suite: a real browser against the running stack, nothing else.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

export const BASE = (process.env.BASE || 'http://127.0.0.1:8787').replace(/\/$/, '');
export const SHOTS = process.env.SHOTS || '/evidence';
export const DESKTOP = { width: 1440, height: 1000 };

export async function withPage(fn, options = {}) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: DESKTOP, colorScheme: 'dark', ...options });
  const page = await context.newPage();
  const requests = [];
  page.on('request', (r) => requests.push(r.url()));
  try {
    return await fn(page, requests, context);
  } finally {
    await context.close();
    await browser.close();
  }
}

export async function shot(page, name) {
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
}

/** What the operator actually sees, not what the markup says. */
export const visiblePanels = (page) =>
  page.$$eval('section[data-panel]', (nodes) => nodes.filter((n) => getComputedStyle(n).display !== 'none').map((n) => n.dataset.panel));
