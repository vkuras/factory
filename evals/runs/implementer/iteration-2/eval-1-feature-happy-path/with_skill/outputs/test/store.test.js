import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
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

test('S3.2 sorts done tasks to the bottom', () => {
  const store = freshStore();
  const done = store.add({ title: 'done one' });
  store.add({ title: 'open one' });
  store.update(done.id, { done: true });
  assert.deepEqual(store.list().map((t) => t.title), ['open one', 'done one']);
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

test('S6.5 orders open tasks by day, soonest first, no-day tasks last', () => {
  const store = freshStore();
  store.add({ title: 'no day', dueDate: null });
  store.add({ title: 'later', dueDate: '2026-09-25' });
  store.add({ title: 'soonest', dueDate: '2026-09-20' });
  assert.deepEqual(store.list().map((t) => t.title), ['soonest', 'later', 'no day']);
});

test('S6.5 keeps done tasks below open tasks regardless of day', () => {
  const store = freshStore();
  const done = store.add({ title: 'done soon', dueDate: '2026-09-20' });
  store.add({ title: 'open later', dueDate: '2026-09-25' });
  store.update(done.id, { done: true });
  assert.deepEqual(store.list().map((t) => t.title), ['open later', 'done soon']);
});

test('S6.5 breaks a tie on the same day with the newest task first', () => {
  const store = freshStore();
  store.add({ title: 'first', dueDate: '2026-09-20' });
  store.add({ title: 'second', dueDate: '2026-09-20' });
  assert.deepEqual(store.list().map((t) => t.title), ['second', 'first']);
});

test('R2 reloads the tasks from disk', () => {
  const store = freshStore();
  store.add({ title: 'persisted' });
  const reopened = new TaskStore(store.file.replace('/tasks.json', ''));
  assert.deepEqual(reopened.list().map((t) => t.title), ['persisted']);
});
