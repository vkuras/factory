// Black-box acceptance tests for 001 – task list MVP. Owned by the validator.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL ?? 'http://localhost:8080';
const unique = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createTask = (body) =>
  fetch(`${BASE}/api/tasks`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
const openTasks = async () => (await fetch(`${BASE}/api/tasks`)).json();

test('S1.1 a task with title and due date appears in the open list', async () => {
  const title = unique('S1.1');
  const res = await createTask({ title, dueDate: '2031-03-01' });
  assert.equal(res.status, 201);
  const task = (await openTasks()).find((t) => t.title === title);
  assert.ok(task);
  assert.equal(task.dueDate, '2031-03-01');
});

test('S1.2 an empty title is rejected with "Bitte gib einen Titel ein."', async () => {
  const res = await createTask({ title: '  ' });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error, 'Bitte gib einen Titel ein.');
});

test('S1.3 a title longer than 100 characters is rejected', async () => {
  const res = await createTask({ title: 'x'.repeat(101) });
  assert.equal(res.status, 400);
});

test('S2.1 open tasks are sorted by due date ascending, tasks without due date last', async () => {
  const prefix = unique('S2.1');
  await createTask({ title: `${prefix}-a`, dueDate: '2032-01-02' });
  await createTask({ title: `${prefix}-none` });
  await createTask({ title: `${prefix}-b`, dueDate: '2032-01-01' });
  const titles = (await openTasks()).map((t) => t.title).filter((t) => t.startsWith(prefix));
  assert.deepEqual(titles, [`${prefix}-b`, `${prefix}-a`, `${prefix}-none`]);
});

test('S3.1 a task marked as done disappears from the open list (S2.2)', async () => {
  const title = unique('S3.1');
  const created = await (await createTask({ title })).json();
  const res = await fetch(`${BASE}/api/tasks/${created.id}/done`, { method: 'POST' });
  assert.equal(res.status, 200);
  assert.equal((await openTasks()).some((t) => t.id === created.id), false);
});

test('QE1 the web UI is German', async () => {
  const html = await (await fetch(`${BASE}/`)).text();
  assert.match(html, /<html lang="de">/);
  assert.match(html, /Hinzufügen/);
});
