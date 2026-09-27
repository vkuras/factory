// Records the Taskboard product video: a 1920x1080 stage page with title cards,
// and the real app (running on port 8102) driven inside iframes.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const APP = 'http://localhost:8102';
const OUT = path.join(__dirname, 'raw');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, p, body) {
  const res = await fetch(APP + p, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.status === 204 ? null : res.json();
}

async function resetTasks() {
  const { tasks } = await api('GET', '/api/tasks');
  for (const t of tasks) await api('DELETE', `/api/tasks/${t.id}`);
}

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  await resetTasks();

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
  });
  const t0 = Date.now();
  const page = await context.newPage();
  await page.goto('file://' + path.join(__dirname, 'stage.html'));
  await page.evaluate((app) => {
    document.getElementById('app').src = app;
  }, APP);
  const app = page.frameLocator('#app');
  await app.locator('#empty').waitFor({ state: 'visible' });
  await wait(500);

  const marks = {};
  const mark = (name) => (marks[name] = (Date.now() - t0) / 1000);

  // Move the fake cursor to the centre of a locator, then click it.
  async function clickOn(locator, { offsetX = 0 } = {}) {
    const box = await locator.boundingBox();
    const x = box.x + box.width / 2 + offsetX;
    const y = box.y + box.height / 2;
    await page.evaluate(([x, y]) => window.cursorTo(x - 4, y - 4), [x, y]);
    await wait(800);
    await page.evaluate(() => window.cursorClick(true));
    // The iframes are CSS-scaled, which breaks coordinate hit-testing, so the
    // click is dispatched on the element itself (same events the user fires).
    await locator.evaluate((el) => (el.tagName === 'INPUT' && el.type === 'text' ? el.focus() : el.click()));
    await wait(180);
    await page.evaluate(() => window.cursorClick(false));
  }

  async function addTask(frame, title, delay = 55) {
    const input = frame.locator('#title');
    await clickOn(input);
    await input.pressSequentially(title, { delay });
    await wait(300);
    await clickOn(frame.locator('button[type=submit]'));
    await frame.locator('#tasks li .title', { hasText: title }).first().waitFor();
    await wait(500);
  }

  // 1 Title
  mark('start');
  await page.evaluate(() => window.show('s-title'));
  await wait(3500);

  // 2 Problem
  await page.evaluate(() => window.show('s-problem'));
  await wait(900);
  for (const el of await page.locator('.pain').all()) {
    await el.evaluate((e) => e.classList.add('on'));
    await wait(1100);
  }
  await wait(1800);

  // 3 Answer
  await page.evaluate(() => window.show('s-answer'));
  await wait(3800);

  // 4 Demo
  await page.evaluate(() => window.caption('Open it', 'Just open it in the browser.', 'No account, no login. Everybody in the team can do everything.'));
  await page.evaluate(() => window.show('s-demo'));
  await wait(3800);

  await page.evaluate(() => window.caption('Write it down', 'One field. One button.', 'Something came up? Type it in and it is on the list for everyone.'));
  await wait(1200);
  await addTask(app, 'Order printer toner');
  await addTask(app, 'Call the landlord about the heating');
  await addTask(app, 'Send the invoice to Berger & Co');
  await addTask(app, 'Book the meeting room for Friday');
  await page.evaluate(() => window.caption('See what is open', 'Newest on top.', 'Everything the team still has to do, in one list.'));
  await page.evaluate(() => window.cursorHide());
  await wait(3200);

  await page.evaluate(() => window.caption('Tick it off', 'Done? Tick it off.', 'Finished tasks are struck through and move to the bottom, so everyone sees it is handled.'));
  await wait(1500);
  const toner = app.locator('#tasks li', { hasText: 'Order printer toner' });
  await clickOn(toner.locator('input[type=checkbox]'));
  await app.locator('#tasks li.done', { hasText: 'Order printer toner' }).waitFor();
  await wait(1600);
  const invoice = app.locator('#tasks li', { hasText: 'Send the invoice' });
  await clickOn(invoice.locator('input[type=checkbox]'));
  await app.locator('#tasks li.done', { hasText: 'Send the invoice' }).waitFor();
  await page.evaluate(() => window.cursorHide());
  await wait(2800);

  await page.evaluate(() => window.caption('Clean up', 'Not needed any more? Delete it.', 'Gone for everyone, right away. No confirmation dialog, no clutter.'));
  await wait(1500);
  await clickOn(app.locator('#tasks li', { hasText: 'Book the meeting room' }).locator('button'));
  await app.locator('#tasks li', { hasText: 'Book the meeting room' }).waitFor({ state: 'detached' });
  await page.evaluate(() => window.cursorHide());
  await wait(2800);

  // 5 Devices: add on the phone, the laptop shows it after opening the list
  await page.evaluate((a) => {
    document.getElementById('laptop').src = a;
    document.getElementById('phone').src = a;
  }, APP);
  const laptop = page.frameLocator('#laptop');
  const phone = page.frameLocator('#phone');
  await laptop.locator('#tasks li').first().waitFor();
  await phone.locator('#tasks li').first().waitFor();
  await page.evaluate(() => window.show('s-devices'));
  await wait(2500);
  await addTask(phone, 'Water the plants', 70);
  await page.evaluate(() => window.cursorHide());
  await wait(900);
  await page.evaluate(() => { const f = document.getElementById('laptop'); f.src = f.src; });
  await laptop.locator('#tasks li .title', { hasText: 'Water the plants' }).waitFor();
  await wait(3500);

  // 6 What it is not
  await page.evaluate(() => window.show('s-not'));
  await wait(5000);

  // 7 Outro
  await page.evaluate(() => window.show('s-outro'));
  await wait(4000);
  mark('end');

  await context.close();
  await browser.close();
  const [file] = fs.readdirSync(OUT).filter((f) => f.endsWith('.webm'));
  fs.writeFileSync(path.join(__dirname, 'marks.json'), JSON.stringify({ file: path.join(OUT, file), ...marks }, null, 2));
  console.log(JSON.stringify(marks));
})();
