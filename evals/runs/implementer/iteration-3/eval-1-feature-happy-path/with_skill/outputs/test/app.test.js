import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app.js';
import { TaskStore } from '../src/store.js';

// These are the implementer's own tests of the HTTP layer, independent of
// tests/acceptance/ (the validator's black-box suite). They cover every
// acceptance criterion of 002 the same way a client of the API would.
function startApp() {
  const store = new TaskStore(mkdtempSync(join(tmpdir(), 'taskboard-app-')));
  const server = createServer(createApp({ store, publicDir: join(tmpdir()) }));
  return new Promise((resolve) => {
    server.listen(0, () => {
      const url = `http://127.0.0.1:${server.address().port}`;
      resolve({
        url,
        close: () => new Promise((r) => server.close(r)),
      });
    });
  });
}

async function call(url, method, path, body, headers = {}) {
  const response = await fetch(`${url}${path}`, {
    method,
    headers: body === undefined ? headers : { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : undefined };
}

test('S5.1 creates a task with a day and shows it in the list', async () => {
  const app = await startApp();
  try {
    const created = await call(app.url, 'POST', '/api/tasks', { title: 'Ship the report', dueDate: '2026-09-25' });
    assert.equal(created.status, 201);
    assert.equal(created.body.dueDate, '2026-09-25');

    const list = await call(app.url, 'GET', '/api/tasks', undefined, { 'X-Today': '2026-09-19' });
    const task = list.body.tasks.find((t) => t.id === created.body.id);
    assert.equal(task.dueDate, '2026-09-25');
    assert.equal(task.dueState, 'upcoming');
  } finally {
    await app.close();
  }
});

test('S5.2 creates a task without a day exactly as before this feature', async () => {
  const app = await startApp();
  try {
    const created = await call(app.url, 'POST', '/api/tasks', { title: 'No due date' });
    assert.equal(created.status, 201);
    assert.equal(created.body.dueDate, null);

    const list = await call(app.url, 'GET', '/api/tasks', undefined, { 'X-Today': '2026-09-19' });
    const task = list.body.tasks.find((t) => t.id === created.body.id);
    assert.equal(task.dueState, 'none');
  } finally {
    await app.close();
  }
});

test('S5.3 sets a day on a task that had none', async () => {
  const app = await startApp();
  try {
    const created = await call(app.url, 'POST', '/api/tasks', { title: 'Add a day later' });
    const patched = await call(app.url, 'PATCH', `/api/tasks/${created.body.id}`, { dueDate: '2026-10-01' });
    assert.equal(patched.status, 200);
    assert.equal(patched.body.dueDate, '2026-10-01');

    const list = await call(app.url, 'GET', '/api/tasks');
    const task = list.body.tasks.find((t) => t.id === created.body.id);
    assert.equal(task.dueDate, '2026-10-01');
  } finally {
    await app.close();
  }
});

test('S5.4 rejects a day that is not a real date, on create and on update', async () => {
  const app = await startApp();
  try {
    const created = await call(app.url, 'POST', '/api/tasks', { title: 'Bad date', dueDate: '2026-02-30' });
    assert.equal(created.status, 400);
    assert.match(created.body.error, /date/i);

    const wrongForm = await call(app.url, 'POST', '/api/tasks', { title: 'Bad date', dueDate: '19-09-2026' });
    assert.equal(wrongForm.status, 400);
    assert.match(wrongForm.body.error, /date/i);

    const ok = await call(app.url, 'POST', '/api/tasks', { title: 'Fine for now' });
    const patched = await call(app.url, 'PATCH', `/api/tasks/${ok.body.id}`, { dueDate: 'not-a-date' });
    assert.equal(patched.status, 400);
    assert.match(patched.body.error, /date/i);
  } finally {
    await app.close();
  }
});

test('S5.5 accepts a day that has already passed', async () => {
  const app = await startApp();
  try {
    const created = await call(app.url, 'POST', '/api/tasks', { title: 'Overdue on arrival', dueDate: '2020-01-01' });
    assert.equal(created.status, 201);
    assert.equal(created.body.dueDate, '2020-01-01');
  } finally {
    await app.close();
  }
});

test('S6.1/S6.2/S6.3/S6.4 mark overdue, due-today, upcoming and no-day tasks', async () => {
  const app = await startApp();
  try {
    const overdue = await call(app.url, 'POST', '/api/tasks', { title: 'late', dueDate: '2026-09-18' });
    const dueToday = await call(app.url, 'POST', '/api/tasks', { title: 'today', dueDate: '2026-09-19' });
    const upcoming = await call(app.url, 'POST', '/api/tasks', { title: 'later', dueDate: '2026-09-20' });
    const none = await call(app.url, 'POST', '/api/tasks', { title: 'someday' });

    const list = await call(app.url, 'GET', '/api/tasks', undefined, { 'X-Today': '2026-09-19' });
    const stateOf = (id) => list.body.tasks.find((t) => t.id === id).dueState;

    assert.equal(stateOf(overdue.body.id), 'overdue');
    assert.equal(stateOf(dueToday.body.id), 'due-today');
    assert.equal(stateOf(upcoming.body.id), 'upcoming');
    assert.equal(stateOf(none.body.id), 'none');
  } finally {
    await app.close();
  }
});

test('S6.5 orders tasks by day, soonest first, no-day tasks last', async () => {
  const app = await startApp();
  try {
    await call(app.url, 'POST', '/api/tasks', { title: 'no day' });
    await call(app.url, 'POST', '/api/tasks', { title: 'later', dueDate: '2026-09-25' });
    await call(app.url, 'POST', '/api/tasks', { title: 'sooner', dueDate: '2026-09-20' });

    const list = await call(app.url, 'GET', '/api/tasks', undefined, { 'X-Today': '2026-09-19' });
    assert.deepEqual(
      list.body.tasks.map((t) => t.title),
      ['sooner', 'later', 'no day'],
    );
  } finally {
    await app.close();
  }
});
