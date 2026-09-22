import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterTasks } from '../src/search.js';

const tasks = [
  { id: 1, title: 'Buy milk', done: false },
  { id: 2, title: 'Order milk crate', done: true },
  { id: 3, title: 'Milk bill', done: false },
];

test('S6.1 keeps only the tasks that are not done when open is true', () => {
  const result = filterTasks(tasks, { open: true });
  assert.deepEqual(result.map((t) => t.id), [1, 3]);
});

test('S6.3 returns every task again when open is false', () => {
  const result = filterTasks(tasks, { open: false });
  assert.deepEqual(result.map((t) => t.id), [1, 2, 3]);
});

test('open defaults to showing every task when omitted', () => {
  const result = filterTasks(tasks, {});
  assert.deepEqual(result.map((t) => t.id), [1, 2, 3]);
});

test('does not mutate the input array', () => {
  const copy = tasks.map((t) => ({ ...t }));
  filterTasks(copy, { open: true });
  assert.deepEqual(copy, tasks);
});
