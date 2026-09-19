// Measures the rendered UI on a phone viewport for QE5 (>= 20 px), QE6 (the
// word next to the colour) and QE7 (one row of inputs and one button), and
// writes screenshots next to the validation report.
//
//   BASE_URL=http://localhost:8110 OUT_DIR=docs/validation/002-due-dates \
//     node tests/acceptance/002-due-dates/ui-browser.mjs
//
// It needs Playwright with a Chromium build. When Playwright cannot be
// resolved it exits with code 2 and the validation report records the UI
// measurement as "not verified in a browser".
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';
const OUT_DIR = process.env.OUT_DIR ?? 'docs/validation/002-due-dates';

// PLAYWRIGHT_MODULE points at an installed playwright when the repo itself has
// no node_modules (the product has no third-party dependencies on purpose).
const playwrightModule = process.env.PLAYWRIGHT_MODULE ?? 'playwright';

let chromium;
try {
  const playwright = await import(playwrightModule);
  chromium = playwright.chromium ?? playwright.default?.chromium;
  if (!chromium) throw new Error('no chromium export');
} catch {
  console.error('Playwright is not available; skipping the browser measurement.');
  process.exit(2);
}

async function api(method, path, body) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  return response.json().catch(() => undefined);
}

const created = [];
for (const fields of [
  { title: 'Send the offer to Meyer', dueDate: '2026-09-18' },
  { title: 'Call the supplier back', dueDate: '2026-09-19' },
  { title: 'Book the training room', dueDate: '2026-09-25' },
  { title: 'Refill the coffee beans' },
]) {
  created.push(await api('POST', '/api/tasks', fields));
}

// CHROMIUM_PATH lets the run use a browser that is already on the machine when
// Playwright's own download is not available.
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const results = {};
for (const [name, viewport] of [
  ['phone', { width: 390, height: 844 }],
  ['desktop', { width: 1280, height: 800 }],
]) {
  const page = await browser.newPage({ viewport });
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('li .title');
  results[name] = await page.evaluate(() => {
    const px = (el) => (el ? Number.parseFloat(getComputedStyle(el).fontSize) : null);
    const rows = [...document.querySelectorAll('li')].map((li) => ({
      title: li.querySelector('.title')?.textContent,
      titlePx: px(li.querySelector('.title')),
      due: li.querySelector('.due')?.textContent,
      duePx: px(li.querySelector('.due')),
      dueClass: li.querySelector('.due')?.className,
    }));
    const form = document.querySelector('form');
    const controls = [...form.querySelectorAll('input, button, label')].map((el) => ({
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute('type'),
      id: el.id,
      text: el.textContent.trim(),
      top: Math.round(el.getBoundingClientRect().top),
      height: Math.round(el.getBoundingClientRect().height),
    }));
    const formRows = new Set(
      [...form.querySelectorAll(':scope > *')].map((el) => Math.round(el.getBoundingClientRect().top)),
    );
    return { rows, controls, formRowCount: formRows.size };
  });
  await page.screenshot({ path: `${OUT_DIR}/screens-${name}.png`, fullPage: true });
  await page.close();
}
await browser.close();

for (const task of created) {
  await api('DELETE', `/api/tasks/${task.id}`);
}

console.log(JSON.stringify(results, null, 2));
