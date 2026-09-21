// The operator's side: what the page does in a real browser (S1.1, S4.4, R11, R12, QE2, QE5).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withPage, shot, visiblePanels, BASE } from './lib.mjs';

test('S1.1 / R11 the dashboard opens on Attention, and the three tabs switch without a reload', async () => {
  await withPage(async (page, requests) => {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    assert.deepEqual(await visiblePanels(page), ['attention']);
    await shot(page, 'attention-tab');

    const before = requests.length;
    const t0 = Date.now();
    await page.click('button[data-tab="pipeline"]');
    assert.deepEqual(await visiblePanels(page), ['pipeline']);
    await shot(page, 'pipeline-tab');
    await page.click('button[data-tab="analytics"]');
    assert.deepEqual(await visiblePanels(page), ['analytics']);
    const elapsed = Date.now() - t0;
    await shot(page, 'analytics-tab');
    await page.click('button[data-tab="attention"]');
    assert.deepEqual(await visiblePanels(page), ['attention']);

    assert.equal(requests.length, before, 'QE2: switching tabs asks the server for nothing');
    assert.ok(elapsed < 1000, `QE2: switching tabs is immediate (${elapsed} ms for two switches)`);

    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    assert.deepEqual(await visiblePanels(page), ['attention'], 'a reload lands on Attention again');
  });
});

test('QE5 the operator sees what needs them without scrolling', async () => {
  await withPage(async (page) => {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    const first = await page.locator('a.af-h-attn').first().boundingBox();
    assert.ok(first, 'there is an attention card');
    assert.ok(first.y + first.height <= 1000, `the first thing that needs me is above the fold (ends at ${first.y + first.height} px)`);
    const reason = await page.locator('a.af-h-attn').first().innerText();
    assert.match(reason, /blocking/i, 'and it says how urgent it is (the design sets it in capitals)');
  });
});

test('S4 clicking a ticket opens its detail view, and a run expands into its numbered output', async () => {
  await withPage(async (page) => {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.locator('a.af-h-attn').first().click();
    await page.waitForLoadState('domcontentloaded');
    assert.match(page.url(), /\/ticket\//);
    assert.match(await page.innerText('body'), /Route · swimlanes over time/i);

    const first = page.locator('details').first();
    assert.ok(!(await first.evaluate((d) => d.open)), 'runs start collapsed');
    await first.locator('summary').click();
    assert.ok(await first.evaluate((d) => d.open));
    const expanded = await first.innerText();
    assert.match(expanded, /(^|\n)01\b/, 'the agent output is a numbered list');
    assert.match(expanded, /(Final output|Your note)/i);
    await shot(page, 'detail-expanded');

    await page.click('a:has-text("back to")');
    await page.waitForLoadState('domcontentloaded');
    assert.deepEqual(await visiblePanels(page), ['attention']);
  });
});

test('the dashboard works without JavaScript: everything is visible and every link works', async () => {
  await withPage(
    async (page) => {
      await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
      assert.deepEqual((await visiblePanels(page)).sort(), ['analytics', 'attention', 'pipeline']);
      const href = await page.locator('a.af-h-pcard').first().getAttribute('href');
      await page.goto(BASE + href, { waitUntil: 'domcontentloaded' });
      assert.match(await page.innerText('body'), /Agent output log/i);
    },
    { javaScriptEnabled: false },
  );
});

test('R12 the page is a snapshot: it never refreshes itself and never says how old it is', async () => {
  await withPage(async (page, requests) => {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    const after = requests.length;
    await page.waitForTimeout(6000);
    assert.equal(requests.length, after, 'nothing is fetched after the page has loaded');
    const body = await page.innerText('body');
    assert.ok(!/synced/i.test(body), 'no "synced X ago"');
    assert.ok(!/(ago|updated|refresh)/i.test(body.split('Agent Factory')[1].slice(0, 200)), 'no data-age line in the header');
  });
});
