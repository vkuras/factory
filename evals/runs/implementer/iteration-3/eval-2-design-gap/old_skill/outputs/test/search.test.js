import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterTasks } from '../src/search.js';

const tasks = [
  { id: 1, title: 'Buy milk', done: false },
  { id: 2, title: 'Order milk crate', done: true },
  { id: 3, title: 'Milk bill', done: false },
];

test('returns every task when open is not requested', () => {
  assert.deepEqual(filterTasks(tasks, {}), tasks);
  assert.deepEqual(filterTasks(tasks), tasks);
});

test('S6.1 keeps only the tasks that are not done when open is on', () => {
  const result = filterTasks(tasks, { open: true });
  assert.deepEqual(result.map((t) => t.id), [1, 3]);
});

test('S6.3 shows done tasks again when open is off', () => {
  const result = filterTasks(tasks, { open: false });
  assert.deepEqual(result.map((t) => t.id), [1, 2, 3]);
});
