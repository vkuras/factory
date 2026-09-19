// Black-box acceptance tests for 002 – overdue tasks. Owned by the validator.
// Requires the stack to be started with APP_FAKE_NOW=2026-09-14T10:00:00Z (Monday 14 Sep 2026, Berlin).
import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL ?? 'http://localhost:8080';
const unique = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createTask = async (body) =>
  (await fetch(`${BASE}/api/tasks`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })).json();
const list = async (query = '') => (await fetch(`${BASE}/api/tasks${query}`)).json();

test('S1.1/R1/R2 due Fri 11 Sep, today Mon 14 Sep: "Überfällig seit 1 Arbeitstag"', async () => {
  const t = await createTask({ title: unique('S1.1'), dueDate: '2026-09-11' });
  const found = (await list()).find((x) => x.id === t.id);
  assert.equal(found.overdueDays, 1);
  assert.equal(found.overdueLabel, 'Überfällig seit 1 Arbeitstag');
});

test('S1.2 a task due today shows no label', async () => {
  const t = await createTask({ title: unique('S1.2'), dueDate: '2026-09-14' });
  const found = (await list()).find((x) => x.id === t.id);
  assert.equal(found.overdueLabel, null);
});

test('S2.1 the filter shows only overdue open tasks', async () => {
  const late = await createTask({ title: unique('S2.1-late'), dueDate: '2026-09-09' });
  const future = await createTask({ title: unique('S2.1-future'), dueDate: '2026-10-01' });
  const ids = (await list('?filter=overdue')).map((x) => x.id);
  assert.ok(ids.includes(late.id));
  assert.ok(!ids.includes(future.id));
});

test('S2.2 the most overdue task comes first in the filtered list', async () => {
  const filtered = await list('?filter=overdue');
  for (let i = 1; i < filtered.length; i++) assert.ok(filtered[i - 1].overdueDays >= filtered[i].overdueDays);
});
