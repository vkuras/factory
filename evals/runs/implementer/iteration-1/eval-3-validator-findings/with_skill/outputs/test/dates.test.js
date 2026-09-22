import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dueState, validateDueDate } from '../src/dates.js';

test('R5 accepts an ISO due date', () => {
  assert.equal(validateDueDate('2026-09-19').dueDate, '2026-09-19');
});

test('R5 accepts no due date', () => {
  assert.equal(validateDueDate(undefined).dueDate, null);
  assert.equal(validateDueDate('').dueDate, null);
});

test('R5 rejects a due date in the wrong format', () => {
  assert.ok(validateDueDate('19.09.2026').error);
});

test('R5 rejects a day that does not exist', () => {
  assert.ok(validateDueDate('2026-02-30').error);
});

test('R4 marks a task due yesterday as overdue', () => {
  assert.equal(dueState('2026-09-18', '2026-09-19'), 'overdue');
});

test('R4 marks a task due today as due today, not overdue', () => {
  assert.equal(dueState('2026-09-19', '2026-09-19'), 'due-today');
});

test('R4 marks a task due tomorrow as upcoming', () => {
  assert.equal(dueState('2026-09-20', '2026-09-19'), 'upcoming');
});

test('R4 marks a task without a due date as none', () => {
  assert.equal(dueState(null, '2026-09-19'), 'none');
});
