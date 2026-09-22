import { test } from 'node:test';
import assert from 'node:assert/strict';
import { today, validateDueDate, dueState } from '../src/dates.js';

test('today returns a YYYY-MM-DD string', () => {
  assert.match(today(), /^\d{4}-\d{2}-\d{2}$/);
});

test('R5 accepts a valid day', () => {
  assert.equal(validateDueDate('2026-09-19').dueDate, '2026-09-19');
});

test('R6 treats an absent day as no day', () => {
  assert.equal(validateDueDate(undefined).dueDate, null);
  assert.equal(validateDueDate(undefined).error, undefined);
});

test('an explicit null clears the day', () => {
  assert.equal(validateDueDate(null).dueDate, null);
});

test('R5 rejects a day not in the form YYYY-MM-DD', () => {
  assert.match(validateDueDate('19-09-2026').error, /day/i);
  assert.ok(validateDueDate('2026/09/19').error);
  assert.ok(validateDueDate('2026-9-19').error);
});

test('R5 rejects a day that does not exist', () => {
  assert.match(validateDueDate('2026-02-30').error, /day/i);
  assert.ok(validateDueDate('2026-13-01').error);
});

test('R5 accepts 29 February in a leap year and rejects it otherwise', () => {
  assert.equal(validateDueDate('2024-02-29').dueDate, '2024-02-29');
  assert.ok(validateDueDate('2026-02-29').error);
});

test('R5 rejects a non-string value', () => {
  assert.ok(validateDueDate(20260919).error);
  assert.ok(validateDueDate(true).error);
});

test('R4 worked example: 2026-09-18 is overdue relative to 2026-09-19', () => {
  assert.equal(dueState('2026-09-18', '2026-09-19'), 'overdue');
});

test('R4 worked example: 2026-09-19 is due today relative to 2026-09-19', () => {
  assert.equal(dueState('2026-09-19', '2026-09-19'), 'due-today');
});

test('R4 worked example: 2026-09-20 is neither relative to 2026-09-19', () => {
  assert.equal(dueState('2026-09-20', '2026-09-19'), 'upcoming');
});

test('R4/R6 a task without a day has no due state', () => {
  assert.equal(dueState(null, '2026-09-19'), 'none');
});
