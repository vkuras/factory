// Dependency-free UI checks against the served assets. They cover the parts of
// QE5-QE7 and the out-of-scope list that can be checked without a browser; the
// rendered sizes are measured by ui-browser.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BASE_URL } from '../helpers.js';

async function asset(path) {
  const response = await fetch(`${BASE_URL}${path}`);
  assert.equal(response.status, 200, `${path} is not served`);
  return response.text();
}

test('QE6 the overdue marking carries a word, not only a colour', async () => {
  const app = await asset('/app.js');
  assert.match(app, /overdue['"]?\s*:\s*['"]Overdue/i);
  assert.match(app, /due-today['"]?\s*:\s*['"]Due today/i);
});

test('QE7 the add form has one row of inputs and one button', async () => {
  const html = await asset('/');
  const form = html.slice(html.indexOf('<form'), html.indexOf('</form>'));
  const inputs = form.match(/<input/g) ?? [];
  const buttons = form.match(/<button/g) ?? [];
  assert.equal(buttons.length, 1, 'the form must have exactly one button');
  assert.ok(
    inputs.length <= 2,
    `the form must stay one title field plus the day: found ${inputs.length} inputs`,
  );
});

test('QE5 the phone stylesheet does not shrink the title or the marking below 20 px', async () => {
  const css = await asset('/style.css');
  const sizes = [...css.matchAll(/font-size:\s*(\d+)px/g)].map((m) => Number(m[1]));
  const tooSmall = sizes.filter((s) => s < 20);
  assert.deepEqual(
    tooSmall,
    [],
    `font sizes below the 20 px of QE5 in the stylesheet: ${tooSmall.join(', ')}`,
  );
});

test('Out of scope: the UI offers no recurring tasks', async () => {
  const html = await asset('/');
  const app = await asset('/app.js');
  assert.doesNotMatch(html, /repeat|recurr|weekly|every week/i);
  assert.doesNotMatch(app, /repeat|recurr|weekly/i);
});

test('Out of scope: the UI offers no reminders or notifications', async () => {
  const html = await asset('/');
  assert.doesNotMatch(html, /remind|notif|e-?mail/i);
});
