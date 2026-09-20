import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateDueDate, today, dueState } from '../src/dates.js';

// R5: format and round-trip.
test('R5 accepts a well-formed date', () => {
  assert.equal(validateDueDate('2026-09-19').value, '2026-09-19');
});

test('R5 accepts a missing date as no date', () => {
  assert.equal(validateDueDate(undefined).value, null);
  assert.equal(validateDueDate(null).value, null);
});

test('R5 rejects a date in the wrong form', () => {
  assert.ok(validateDueDate('19-09-2026').error);
  assert.ok(validateDueDate('2026/09/19').error);
  assert.ok(validateDueDate('2026-9-19').error);
  assert.ok(validateDueDate('not a date').error);
});

test('R5 rejects a day that does not exist', () => {
  assert.ok(validateDueDate('2026-02-30').error);
  assert.ok(validateDueDate('2026-13-01').error);
});

test('R5 accepts a leap day in a leap year', () => {
  assert.equal(validateDueDate('2024-02-29').value, '2024-02-29');
});

test('R5 rejects a leap day in a non-leap year', () => {
  assert.ok(validateDueDate('2023-02-29').error);
});

// R4: the overdue/due-today/upcoming boundary, example from the requirements:
// today is 2026-09-19, 2026-09-18 is overdue, 2026-09-19 is due today, 2026-09-20 is neither.
test('R4 a day before the reference is overdue', () => {
  assert.equal(dueState('2026-09-18', '2026-09-19'), 'overdue');
});

test('R4 the reference day itself is due today, not overdue', () => {
  assert.equal(dueState('2026-09-19', '2026-09-19'), 'due-today');
});

test('R4 a day after the reference is upcoming', () => {
  assert.equal(dueState('2026-09-20', '2026-09-19'), 'upcoming');
});

test('R4 a task without a day has no due state', () => {
  assert.equal(dueState(null, '2026-09-19'), 'none');
});

// ADR-0002: the override lets tests pin "today" without waiting for midnight.
test('today() returns a validated override unchanged', () => {
  assert.equal(today('2026-01-01'), '2026-01-01');
});

test('today() falls back to the real day when the override is invalid', () => {
  const real = today(undefined);
  assert.equal(today('not-a-date'), real);
});

test('today() without an override returns a well-formed date', () => {
  assert.match(today(undefined), /^\d{4}-\d{2}-\d{2}$/);
});
