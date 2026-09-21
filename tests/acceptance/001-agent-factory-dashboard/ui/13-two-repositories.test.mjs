// R3 / D16 in the browser: from the second repository on, a ticket never appears without it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withPage, shot, BASE } from './lib.mjs';
import { REPO_A_LABEL, REPO_B_LABEL } from '../seed/dataset.mjs';

test('D16 every ticket on every tab carries its repository, and the two 001s are told apart', async () => {
  await withPage(async (page) => {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    for (const [tab, selector] of [['attention', 'a.af-h-attn'], ['attention', 'a.af-h-chip'], ['pipeline', 'a.af-h-pcard'], ['analytics', 'a.af-h-row']]) {
      await page.click(`button[data-tab="${tab}"]`);
      const texts = await page.locator(`section[data-panel="${tab}"] ${selector}`).allInnerTexts();
      assert.ok(texts.length > 0, `${tab} ${selector} has tickets`);
      for (const t of texts) {
        assert.ok(t.includes(REPO_A_LABEL) || t.includes(REPO_B_LABEL), `${selector}: "${t.split('\n')[0]}" names its repository`);
      }
      await shot(page, `two-repositories-${tab}-${selector.replace(/\W/g, '')}`);
    }

    await page.click('button[data-tab="pipeline"]');
    const withNumber = await page.locator('section[data-panel="pipeline"] a.af-h-pcard', { hasText: '001' }).allInnerTexts();
    const labels = withNumber.filter((t) => t.trim().startsWith('001')).map((t) => (t.includes(REPO_A_LABEL) ? 'A' : t.includes(REPO_B_LABEL) ? 'B' : '?'));
    assert.deepEqual(labels.sort(), ['A', 'B'], 'the two tickets numbered 001 are told apart on the card itself');
  });
});

test('the repository label stays on one line and never pushes the card apart', async () => {
  await withPage(async (page) => {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    const boxes = await page.$$eval('section[data-panel]:not([hidden]) .af-repo', (nodes) =>
      nodes.filter((n) => n.getBoundingClientRect().height > 0).map((n) => {
        const r = n.getBoundingClientRect();
        const s = getComputedStyle(n);
        return { h: Math.round(r.height), w: Math.round(r.width), overflow: s.textOverflow, wrap: s.whiteSpace, size: s.fontSize };
      }),
    );
    assert.ok(boxes.length > 0);
    const line = boxes[0].h;
    for (const b of boxes) {
      assert.equal(b.h, line, 'every label is one line high');
      assert.equal(b.overflow, 'ellipsis');
      assert.equal(b.wrap, 'nowrap');
    }
  });
});
