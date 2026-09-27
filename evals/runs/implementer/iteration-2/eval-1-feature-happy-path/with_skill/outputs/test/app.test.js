// API-level tests for 002 (due dates). tests/acceptance/ is the validator's
// black-box suite, so the implementer's own coverage of S5/S6 lives here,
// against an in-process server (no Docker needed to run these).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../src/app.js';
import { TaskStore } from '../src/store.js';

const publicDir = join(dirname(import.meta.url), '..', 'public');

function dirname(moduleUrl) {
  return fileURLToPath(new URL('.', moduleUrl));
}

function startServer() {
  const store = new TaskStore(mkdtempSync(join(tmpdir(), 'taskboard-app-')));
  const server = createServer(createApp({ store, publicDir }));
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

async function withServer(run) {
  const { server, baseUrl } = await startServer();
  try {
    await run(baseUrl);
  } finally {
    server.close();
  }
}

async function api(baseUrl, method, path, body, headers = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let json;
  try {
    json = text === '' ? undefined : JSON.parse(text);
  } catch {
    json = undefined;
  }
  return { status: response.status, body: json };
}

test('S5.1 creates a task with a day and it is visible in the list', async () => {
  await withServer(async (baseUrl) => {
    const created = await api(baseUrl, 'POST', '/api/tasks', { title: 'Ship the release', dueDate: '2026-09-25' });
    assert.equal(created.status, 201);
    assert.equal(created.body.dueDate, '2026-09-25');
    const list = await api(baseUrl, 'GET', '/api/tasks');
    const task = list.body.tasks.find((t) => t.id === created.body.id);
    assert.equal(task.dueDate, '2026-09-25');
  });
});

test('S5.2 creates a task without a day exactly as before this feature', async () => {
  await withServer(async (baseUrl) => {
    const created = await api(baseUrl, 'POST', '/api/tasks', { title: 'No date task' });
    assert.equal(created.status, 201);
    assert.equal(created.body.dueDate, null);
    const list = await api(baseUrl, 'GET', '/api/tasks');
    const task = list.body.tasks.find((t) => t.id === created.body.id);
    assert.equal(task.dueState, 'none');
  });
});

test('S5.3 setting a day on an existing task shows it in the list', async () => {
  await withServer(async (baseUrl) => {
    const created = await api(baseUrl, 'POST', '/api/tasks', { title: 'Later' });
    const patched = await api(baseUrl, 'PATCH', `/api/tasks/${created.body.id}`, { dueDate: '2026-10-01' });
    assert.equal(patched.status, 200);
    assert.equal(patched.body.dueDate, '2026-10-01');
    const list = await api(baseUrl, 'GET', '/api/tasks');
    const task = list.body.tasks.find((t) => t.id === created.body.id);
    assert.equal(task.dueDate, '2026-10-01');
  });
});

test('S5.4 rejects a malformed day on create and does not create the task', async () => {
  await withServer(async (baseUrl) => {
    const before = await api(baseUrl, 'GET', '/api/tasks');
    const created = await api(baseUrl, 'POST', '/api/tasks', { title: 'Bad date', dueDate: '2026-13-40' });
    assert.equal(created.status, 400);
    assert.match(created.body.error, /day/i);
    const after = await api(baseUrl, 'GET', '/api/tasks');
    assert.equal(after.body.tasks.length, before.body.tasks.length);
  });
});

test('S5.4 rejects a malformed day on update and does not change the task', async () => {
  await withServer(async (baseUrl) => {
    const created = await api(baseUrl, 'POST', '/api/tasks', { title: 'Keep me', dueDate: '2026-09-20' });
    const patched = await api(baseUrl, 'PATCH', `/api/tasks/${created.body.id}`, { dueDate: 'not-a-date' });
    assert.equal(patched.status, 400);
    assert.match(patched.body.error, /day/i);
    const list = await api(baseUrl, 'GET', '/api/tasks');
    const task = list.body.tasks.find((t) => t.id === created.body.id);
    assert.equal(task.dueDate, '2026-09-20');
  });
});

test('S5.5 accepts a day that already passed', async () => {
  await withServer(async (baseUrl) => {
    const created = await api(baseUrl, 'POST', '/api/tasks', { title: 'Late already', dueDate: '2020-01-01' });
    assert.equal(created.status, 201);
    assert.equal(created.body.dueDate, '2020-01-01');
  });
});

test('S6.1 a day before the pinned today is overdue', async () => {
  await withServer(async (baseUrl) => {
    const created = await api(baseUrl, 'POST', '/api/tasks', { title: 'Overdue task', dueDate: '2026-09-18' });
    const list = await api(baseUrl, 'GET', '/api/tasks', undefined, { 'X-Today': '2026-09-19' });
    const task = list.body.tasks.find((t) => t.id === created.body.id);
    assert.equal(task.dueState, 'overdue');
  });
});

test('S6.2 a day equal to the pinned today is due-today, not overdue', async () => {
  await withServer(async (baseUrl) => {
    const created = await api(baseUrl, 'POST', '/api/tasks', { title: 'Due today task', dueDate: '2026-09-19' });
    const list = await api(baseUrl, 'GET', '/api/tasks', undefined, { 'X-Today': '2026-09-19' });
    const task = list.body.tasks.find((t) => t.id === created.body.id);
    assert.equal(task.dueState, 'due-today');
  });
});

test('S6.3 a day after the pinned today is upcoming', async () => {
  await withServer(async (baseUrl) => {
    const created = await api(baseUrl, 'POST', '/api/tasks', { title: 'Future task', dueDate: '2026-09-20' });
    const list = await api(baseUrl, 'GET', '/api/tasks', undefined, { 'X-Today': '2026-09-19' });
    const task = list.body.tasks.find((t) => t.id === created.body.id);
    assert.equal(task.dueState, 'upcoming');
  });
});

test('S6.4 a task without a day has no day and no marking', async () => {
  await withServer(async (baseUrl) => {
    const created = await api(baseUrl, 'POST', '/api/tasks', { title: 'No day task' });
    const list = await api(baseUrl, 'GET', '/api/tasks', undefined, { 'X-Today': '2026-09-19' });
    const task = list.body.tasks.find((t) => t.id === created.body.id);
    assert.equal(task.dueDate, null);
    assert.equal(task.dueState, 'none');
  });
});

test('S6.5 orders tasks by day, soonest first, no-day tasks last', async () => {
  await withServer(async (baseUrl) => {
    const a = await api(baseUrl, 'POST', '/api/tasks', { title: 'no day' });
    const b = await api(baseUrl, 'POST', '/api/tasks', { title: 'later', dueDate: '2026-09-25' });
    const c = await api(baseUrl, 'POST', '/api/tasks', { title: 'soonest', dueDate: '2026-09-20' });
    const list = await api(baseUrl, 'GET', '/api/tasks');
    const ids = new Set([a.body.id, b.body.id, c.body.id]);
    const order = list.body.tasks.filter((t) => ids.has(t.id)).map((t) => t.title);
    assert.deepEqual(order, ['soonest', 'later', 'no day']);
  });
});

test('an X-Today header that is not a real day is ignored', async () => {
  await withServer(async (baseUrl) => {
    const created = await api(baseUrl, 'POST', '/api/tasks', { title: 'irrelevant', dueDate: '2026-09-19' });
    const list = await api(baseUrl, 'GET', '/api/tasks', undefined, { 'X-Today': 'not-a-day' });
    const task = list.body.tasks.find((t) => t.id === created.body.id);
    // Falls back to the real today; just check the request does not error.
    assert.ok(['overdue', 'due-today', 'upcoming'].includes(task.dueState));
  });
});

test('R6 a request body without "done" or "dueDate" is rejected, not silently accepted', async () => {
  await withServer(async (baseUrl) => {
    const created = await api(baseUrl, 'POST', '/api/tasks', { title: 'Untouched' });
    const patched = await api(baseUrl, 'PATCH', `/api/tasks/${created.body.id}`, {});
    assert.equal(patched.status, 400);
  });
});
