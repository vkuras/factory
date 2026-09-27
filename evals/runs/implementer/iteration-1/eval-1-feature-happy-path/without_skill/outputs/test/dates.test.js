import { test } from 'node:test';
import assert from 'node:assert/strict';
import { today, validateDueDate, dueState } from '../src/dates.js';

test('today() returns the X-Today override when well-formed', () => {
  assert.equal(today('2026-09-19'), '2026-09-19');
});

test('today() falls back to the real day when the override is malformed', () => {
  assert.match(today('not-a-date'), /^\d{4}-\d{2}-\d{2}$/);
  assert.match(today(undefined), /^\d{4}-\d{2}-\d{2}$/);
});

test('R6 a missing due date is valid and reads as null', () => {
  assert.deepEqual(validateDueDate(undefined), { dueDate: null });
  assert.deepEqual(validateDueDate(null), { dueDate: null });
});

test('R5 accepts a real calendar date', () => {
  assert.deepEqual(validateDueDate('2026-09-19'), { dueDate: '2026-09-19' });
});

test('S5.5 accepts a day that already passed', () => {
  assert.deepEqual(validateDueDate('2020-01-01'), { dueDate: '2020-01-01' });
});

test('S5.4 rejects a day that is not a real date', () => {
  assert.ok(validateDueDate('2026-02-30').error);
  assert.ok(validateDueDate('2026-13-01').error);
});

test('S5.4 rejects a day not in the form YYYY-MM-DD', () => {
  assert.ok(validateDueDate('19-09-2026').error);
  assert.ok(validateDueDate('2026/09/19').error);
  assert.ok(validateDueDate('tomorrow').error);
});

test('S5.4 rejects a non-string due date', () => {
  assert.ok(validateDueDate(20260919).error);
});

test('R4 a day before today is overdue', () => {
  assert.equal(dueState('2026-09-18', '2026-09-19'), 'overdue');
});

test('R4 a day equal to today is due-today, not overdue', () => {
  assert.equal(dueState('2026-09-19', '2026-09-19'), 'due-today');
});

test('R4 a day after today is upcoming', () => {
  assert.equal(dueState('2026-09-20', '2026-09-19'), 'upcoming');
});

test('S6.4 no due date means no state', () => {
  assert.equal(dueState(null, '2026-09-19'), 'none');
  assert.equal(dueState(undefined, '2026-09-19'), 'none');
});
