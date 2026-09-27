const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const APP = 'http://localhost:8104/';
const W = 1280, H = 720;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const offsets = {};

async function resetTasks() {
  const { tasks } = await (await fetch(APP + 'api/tasks')).json();
  for (const t of tasks) await fetch(APP + 'api/tasks/' + t.id, { method: 'DELETE' });
}

const OVERLAY = `
(() => {
  const s = document.createElement('style');
  s.textContent = \`
  #vcap{position:fixed;left:0;right:0;bottom:28px;display:flex;justify-content:center;pointer-events:none;z-index:9999}
  #vcap div{background:rgba(28,28,26,.88);color:#fff;font:600 26px system-ui,sans-serif;padding:12px 26px;border-radius:10px;opacity:0;transition:opacity .3s}
  #vcap div.on{opacity:1}
  #vhdr{position:fixed;top:18px;right:26px;font:700 22px system-ui,sans-serif;color:#2f6f4f;z-index:9999;pointer-events:none}
  .vring{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border:4px solid #e0a800;border-radius:50%;pointer-events:none;z-index:9998;animation:vr .6s ease-out forwards}
  @keyframes vr{from{transform:scale(.4);opacity:1}to{transform:scale(1.4);opacity:0}}\`;
  document.head.append(s);
  const c = document.createElement('div'); c.id='vcap'; c.innerHTML='<div></div>'; document.body.append(c);
  const h = document.createElement('div'); h.id='vhdr'; h.textContent='2 · Use it  —  http://localhost:8080'; document.body.append(h);
  window.caption = t => { const d=c.firstChild; if(!t){d.classList.remove('on');return;} d.textContent=t; d.classList.add('on'); };
  document.addEventListener('mousedown', e => { const r=document.createElement('div'); r.className='vring'; r.style.left=e.clientX+'px'; r.style.top=e.clientY+'px'; document.body.append(r); setTimeout(()=>r.remove(),700); }, true);
  document.documentElement.style.zoom = '1.3';
})();`;

async function recordScene(browser, name, fn) {
  const dir = path.join(__dirname, 'rec', name);
  fs.rmSync(dir, { recursive: true, force: true });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir, size: { width: W, height: H } } });
  const t0 = Date.now();
  const page = await ctx.newPage();
  const startAt = await fn(page, t0);
  const video = page.video();
  await ctx.close();
  const src = await video.path();
  fs.renameSync(src, path.join(__dirname, 'rec', name + '.webm'));
  offsets[name] = startAt; if (page.__len) offsets[name + '_len'] = page.__len;
}

async function staticScene(page, t0, file, holdMs) {
  await page.goto('file://' + path.join(__dirname, 'scenes', file));
  await page.waitForLoadState('load');
  await sleep(300);
  const startAt = (Date.now() - t0) / 1000;
  await page.evaluate('start()');
  await sleep(holdMs); page.__len = holdMs / 1000;
  
  return startAt;
}

async function typeSlow(page, loc, text) { await loc.click(); await loc.pressSequentially(text, { delay: 55 }); }

(async () => {
  const browser = await chromium.launch();
  await recordScene(browser, '1-title', (p, t0) => staticScene(p, t0, 'title.html', 3800));
  await recordScene(browser, '2-terminal', (p, t0) => staticScene(p, t0, 'terminal.html', 11000));

  await resetTasks();
  await recordScene(browser, '3-app', async (page, t0) => {
    await page.goto(APP);
    await page.waitForSelector('#empty:not([hidden])');
    await page.evaluate(OVERLAY);
    await sleep(300);
    const startAt = (Date.now() - t0) / 1000;
    const input = page.locator('#title');
    const add = page.getByRole('button', { name: 'Add task' });
    await page.evaluate("caption('Open http://localhost:8080 — no login, no accounts')");
    await sleep(2600);
    await page.evaluate("caption('Add a task: type a title, press Enter')");
    await typeSlow(page, input, 'Order printer paper'); await sleep(250); await input.press('Enter'); await sleep(900);
    await typeSlow(page, input, 'Call the landlord about the heating'); await sleep(250); await add.click(); await sleep(900);
    await page.evaluate("caption('An empty title is rejected')");
    await input.fill('   '); await sleep(300); await add.click(); await sleep(2000);
    await input.fill('');
    await page.evaluate("caption('Add a task: type a title, press Enter')");
    await typeSlow(page, input, 'Book the team lunch'); await sleep(250); await input.press('Enter'); await sleep(1000);
    await page.evaluate("caption('Newest tasks are on top')"); await sleep(1800);
    await page.evaluate("caption('Done? Tick it off — it moves down, struck through')"); await sleep(600);
    await page.getByRole('checkbox', { name: 'Mark "Order printer paper" as done' }).click(); await sleep(2600);
    await page.evaluate("caption('Not needed any more? Delete removes it for everyone')"); await sleep(600);
    await page.locator('li', { hasText: 'Book the team lunch' }).getByRole('button', { name: 'Delete' }).click(); await sleep(2300);
    await page.evaluate("caption('Everyone sees the same list')"); await sleep(1800);
    offsets['3-app_len'] = (Date.now() - t0) / 1000 - startAt;
    return startAt;
  });

  await recordScene(browser, '4-phone', async (page, t0) => {
    await page.goto('file://' + path.join(__dirname, 'scenes', 'phone.html'));
    const f = page.frameLocator('#f');
    await f.locator('li').first().waitFor();
    await sleep(400);
    const startAt = (Date.now() - t0) / 1000;
    await sleep(1500);
    await f.locator('#title').click(); await f.locator('#title').pressSequentially('Water the plants', { delay: 55 }); await f.locator('#title').press('Enter');
    await sleep(1200);
    await f.getByRole('checkbox', { name: 'Mark "Water the plants" as done' }).click();
    await sleep(2200);
    offsets['4-phone_len'] = (Date.now() - t0) / 1000 - startAt;
    return startAt;
  });

  await recordScene(browser, '5-end', (p, t0) => staticScene(p, t0, 'end.html', 4000));
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'rec', 'offsets.json'), JSON.stringify(offsets, null, 2));
  console.log(offsets);
})();
