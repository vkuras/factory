import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { createApp } from '../src/app.js';
import { TaskStore } from '../src/store.js';

// Exercises the real HTTP layer (not just search.js), so the `open` query
// parameter's wiring through GET /api/tasks is covered end to end.
async function withServer(run) {
  const store = new TaskStore(mkdtempSync(join(tmpdir(), 'taskboard-')));
  const server = createServer(createApp({ store, publicDir: join(process.cwd(), 'public') }));
  await new Promise((resolve) => server.listen(0, resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    await run({ store, baseUrl });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('S6.1 GET /api/tasks?open=true hides done tasks', async () => {
  await withServer(async ({ store, baseUrl }) => {
    const open = store.add({ title: 'still open' });
    const done = store.add({ title: 'finished' });
    store.update(done.id, { done: true });

    const response = await fetch(`${baseUrl}/api/tasks?open=true`);
    const body = await response.json();

    assert.deepEqual(body.tasks.map((t) => t.id), [open.id]);
  });
});

test('S6.3 GET /api/tasks without open shows done tasks again', async () => {
  await withServer(async ({ store, baseUrl }) => {
    const open = store.add({ title: 'still open' });
    const done = store.add({ title: 'finished' });
    store.update(done.id, { done: true });

    const response = await fetch(`${baseUrl}/api/tasks`);
    const body = await response.json();

    assert.deepEqual(
      new Set(body.tasks.map((t) => t.id)),
      new Set([open.id, done.id]),
    );
  });
});
