import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, chmodSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TaskStore } from '../src/store.js';

function freshStore() {
  return new TaskStore(mkdtempSync(join(tmpdir(), 'taskboard-')));
}

test('S2.1 lists open tasks newest first', () => {
  const store = freshStore();
  store.add({ title: 'first' });
  store.add({ title: 'second' });
  assert.deepEqual(store.list().map((t) => t.title), ['second', 'first']);
});

test('S3.2 keeps done tasks below the open ones, whatever their due date', () => {
  const store = freshStore();
  const done = store.add({ title: 'done but due soon', dueDate: '2026-09-20' });
  store.add({ title: 'open and due later', dueDate: '2026-12-24' });
  store.update(done.id, { done: true });
  assert.deepEqual(store.list().map((t) => t.title), ['open and due later', 'done but due soon']);
});

test('S6 sorts the soonest due date first', () => {
  const store = freshStore();
  store.add({ title: 'later', dueDate: '2026-09-25' });
  store.add({ title: 'sooner', dueDate: '2026-09-20' });
  assert.deepEqual(store.list().map((t) => t.title), ['sooner', 'later']);
});

test('S6 puts tasks without a due date last', () => {
  const store = freshStore();
  store.add({ title: 'no date' });
  store.add({ title: 'dated', dueDate: '2026-09-20' });
  assert.deepEqual(store.list().map((t) => t.title), ['dated', 'no date']);
});

test('S4.1 removes a task', () => {
  const store = freshStore();
  const task = store.add({ title: 'temporary' });
  assert.equal(store.remove(task.id), true);
  assert.equal(store.list().length, 0);
});

test('S4.2 reports an unknown task', () => {
  assert.equal(freshStore().remove(99), false);
});

test('R2 reloads the tasks from disk', () => {
  const store = freshStore();
  store.add({ title: 'persisted' });
  const reopened = new TaskStore(store.file.replace('/tasks.json', ''));
  assert.deepEqual(reopened.list().map((t) => t.title), ['persisted']);
});

test('R2 flush() never leaves a half-written file behind (validation 002 F3)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'taskboard-'));
  const store = new TaskStore(dir);
  store.add({ title: 'already saved', dueDate: '2026-09-18' });
  const before = readFileSync(store.file, 'utf8');

  // Make the data directory read-only, as a process killed mid-flush would
  // leave it: flush() can no longer create the new file. If flush() wrote
  // straight to tasks.json (truncate then write), a kill at the wrong
  // instant would corrupt or empty it; writing to a temp file and renaming
  // it into place means an interrupted flush leaves the previous, complete
  // file untouched instead.
  chmodSync(dir, 0o500);
  try {
    assert.throws(() => store.add({ title: 'never saved', dueDate: '2026-09-19' }));
  } finally {
    chmodSync(dir, 0o700);
  }

  assert.equal(readFileSync(store.file, 'utf8'), before);
});
