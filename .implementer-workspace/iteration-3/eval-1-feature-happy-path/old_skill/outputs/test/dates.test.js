import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateDueDate, dueState, today } from '../src/dates.js';

test('R5 accepts a real day in the form YYYY-MM-DD', () => {
  assert.equal(validateDueDate('2026-09-19').dueDate, '2026-09-19');
});

test('R5 accepts no day at all as valid and optional (R6)', () => {
  assert.equal(validateDueDate(undefined).dueDate, null);
  assert.equal(validateDueDate(null).dueDate, null);
});

test('R5 rejects a day that is not a real date', () => {
  assert.ok(validateDueDate('2026-02-30').error);
});

test('R5 rejects a day not in the form YYYY-MM-DD', () => {
  assert.ok(validateDueDate('09/19/2026').error);
  assert.ok(validateDueDate('2026-9-19').error);
  assert.ok(validateDueDate('not a date').error);
});

test('R5 rejects a non-string day', () => {
  assert.ok(validateDueDate(20260919).error);
});

test('S5.5 accepts a day that already passed', () => {
  assert.equal(validateDueDate('2020-01-01').dueDate, '2020-01-01');
});

test('R4 marks a day before the reference as overdue', () => {
  assert.equal(dueState('2026-09-18', '2026-09-19'), 'overdue');
});

test('R4 marks the reference day itself as due-today, not overdue', () => {
  assert.equal(dueState('2026-09-19', '2026-09-19'), 'due-today');
});

test('R4 marks a day after the reference as upcoming', () => {
  assert.equal(dueState('2026-09-20', '2026-09-19'), 'upcoming');
});

test('R6 a task without a day has no due state', () => {
  assert.equal(dueState(null, '2026-09-19'), 'none');
});

test('today() uses the override when it is a real day', () => {
  assert.equal(today('2026-01-05'), '2026-01-05');
});

test('today() falls back to the real day when the override is not a real day', () => {
  const real = today(undefined);
  assert.equal(today('not a date'), real);
  assert.equal(today('2026-02-30'), real);
});
