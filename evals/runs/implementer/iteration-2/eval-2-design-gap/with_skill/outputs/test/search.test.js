import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterTasks } from '../src/search.js';

const tasks = [
  { id: 1, title: 'Buy milk', done: false },
  { id: 2, title: 'Order milk crate', done: true },
  { id: 3, title: 'Water the plants', done: false },
];

test('S6.1 keeps only the tasks that are not done when open-only is on', () => {
  const result = filterTasks(tasks, { open: true });
  assert.deepEqual(result.map((t) => t.id), [1, 3]);
});

test('S6.3 returns every task when open-only is off', () => {
  const result = filterTasks(tasks, { open: false });
  assert.deepEqual(result.map((t) => t.id), [1, 2, 3]);
});

test('returns every task when no filter is given', () => {
  assert.deepEqual(filterTasks(tasks, {}).map((t) => t.id), [1, 2, 3]);
});

test('an empty list stays empty', () => {
  assert.deepEqual(filterTasks([], { open: true }), []);
});
