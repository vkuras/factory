import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterTasks } from '../src/search.js';

// S5 (matching text in the title) is not covered here: the design's match
// algorithm contradicts R4 and its worked examples, see
// docs/architecture/.gaps/002-find-a-task.md G1. Only S6 (open only) is
// implemented and tested in this round.

test('S6.1 keeps only the tasks that are not done when open is on', () => {
  const tasks = [
    { id: 1, title: 'open one', done: false },
    { id: 2, title: 'done one', done: true },
  ];
  assert.deepEqual(
    filterTasks({ tasks, open: true }).map((t) => t.title),
    ['open one'],
  );
});

test('S6.3 keeps every task when open is off', () => {
  const tasks = [
    { id: 1, title: 'open one', done: false },
    { id: 2, title: 'done one', done: true },
  ];
  assert.deepEqual(
    filterTasks({ tasks, open: false }).map((t) => t.title),
    ['open one', 'done one'],
  );
});

test('an empty list stays empty regardless of open', () => {
  assert.deepEqual(filterTasks({ tasks: [], open: true }), []);
  assert.deepEqual(filterTasks({ tasks: [], open: false }), []);
});
