import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterTasks } from '../src/search.js';

const tasks = [
  { id: 1, title: 'Buy Milk', done: false },
  { id: 2, title: 'Order milk crate', done: true },
  { id: 3, title: 'Milk bill', done: false },
];

test('S6.1 "open only" keeps only tasks that are not done', () => {
  const result = filterTasks(tasks, { open: true });
  assert.deepEqual(result.map((t) => t.id), [1, 3]);
});

test('S6.3 "open only" off shows done tasks again', () => {
  assert.deepEqual(filterTasks(tasks, { open: false }).map((t) => t.id), [1, 2, 3]);
  assert.deepEqual(filterTasks(tasks, {}).map((t) => t.id), [1, 2, 3]);
});

test('no filters returns every task unchanged', () => {
  assert.deepEqual(filterTasks(tasks), tasks);
});
