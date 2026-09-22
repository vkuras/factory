import { test } from 'node:test';
import assert from 'node:assert/strict';
import { today, validateDueDate, dueState } from '../src/dates.js';

test('R4 a day before the reference is overdue', () => {
  assert.equal(dueState('2026-09-18', '2026-09-19'), 'overdue');
});

test('R4 a day equal to the reference is due today, not overdue', () => {
  assert.equal(dueState('2026-09-19', '2026-09-19'), 'due-today');
});

test('R4 a day after the reference is upcoming', () => {
  assert.equal(dueState('2026-09-20', '2026-09-19'), 'upcoming');
});

test('R4 a task without a day is none', () => {
  assert.equal(dueState(null, '2026-09-19'), 'none');
  assert.equal(dueState(undefined, '2026-09-19'), 'none');
});

test('R5 accepts a real date', () => {
  assert.equal(validateDueDate('2026-09-19').dueDate, '2026-09-19');
});

test('R5 treats a missing day as no day, not an error', () => {
  assert.equal(validateDueDate(undefined).dueDate, null);
  assert.equal(validateDueDate(null).dueDate, null);
});

test('R5 rejects a day that is not in the form YYYY-MM-DD', () => {
  assert.ok(validateDueDate('19-09-2026').error);
  assert.ok(validateDueDate('2026/09/19').error);
  assert.ok(validateDueDate('tomorrow').error);
  assert.ok(validateDueDate(20260919).error);
});

test('R5 rejects a day that does not exist', () => {
  assert.ok(validateDueDate('2026-02-30').error);
  assert.ok(validateDueDate('2027-02-29').error);
  assert.ok(validateDueDate('2026-13-01').error);
  assert.ok(validateDueDate('2026-09-00').error);
});

test('R5 accepts a leap day in a leap year', () => {
  assert.equal(validateDueDate('2028-02-29').dueDate, '2028-02-29');
});

test('S5.5 accepts a day that already passed', () => {
  assert.equal(validateDueDate('2020-01-01').dueDate, '2020-01-01');
});

test('today() uses a valid override instead of the real day', () => {
  assert.equal(today('2026-09-19'), '2026-09-19');
});

test('today() ignores an invalid override and returns a real day', () => {
  assert.match(today('not-a-date'), /^\d{4}-\d{2}-\d{2}$/);
  assert.match(today(undefined), /^\d{4}-\d{2}-\d{2}$/);
});
