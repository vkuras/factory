import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchesQuery, filterTasks } from '../src/search.js';

test('S5.4 an empty query matches everything', () => {
  assert.equal(matchesQuery('Buy Milk', ''), true);
});

test('S5.1/S5.3 matches text anywhere in the title, not only the start', () => {
  assert.equal(matchesQuery('Order milk crate', 'milk'), true);
});

test('R4/S5.2 matching ignores case', () => {
  assert.equal(matchesQuery('Buy Milk', 'MILK'), true);
  assert.equal(matchesQuery('MILK BILL', 'milk'), true);
});

test('R4 does not match text the title does not contain', () => {
  assert.equal(matchesQuery('Buy bread', 'milk'), false);
});

test('filterTasks applies the search text', () => {
  const tasks = [{ title: 'Buy Milk' }, { title: 'Call the plumber' }];
  assert.deepEqual(
    filterTasks(tasks, { q: 'milk' }).map((t) => t.title),
    ['Buy Milk'],
  );
});

test('S6.1 filterTasks applies "open only"', () => {
  const tasks = [
    { title: 'open task', done: false },
    { title: 'done task', done: true },
  ];
  assert.deepEqual(
    filterTasks(tasks, { open: true }).map((t) => t.title),
    ['open task'],
  );
});

test('S6.2 combines the search text with "open only"', () => {
  const tasks = [
    { title: 'Buy Milk', done: false },
    { title: 'Buy Milk', done: true },
    { title: 'Call the plumber', done: false },
  ];
  const result = filterTasks(tasks, { q: 'milk', open: true });
  assert.equal(result.length, 1);
  assert.equal(result[0].done, false);
});

test('S6.3 an "open only" of false keeps done tasks', () => {
  const tasks = [
    { title: 'open task', done: false },
    { title: 'done task', done: true },
  ];
  assert.deepEqual(
    filterTasks(tasks, { open: false }).map((t) => t.title),
    ['open task', 'done task'],
  );
});
