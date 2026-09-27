import { test } from 'node:test';
import assert from 'node:assert/strict';
import { today, validateDueDate, dueState } from '../src/dates.js';

test('today() returns the Europe/Berlin calendar day', () => {
  // 2026-06-15T21:30:00Z is 2026-06-15T23:30:00+02:00 (CEST) in Berlin.
  assert.equal(today(new Date('2026-06-15T21:30:00Z')), '2026-06-15');
  // 2026-06-15T22:30:00Z is 2026-06-16T00:30:00+02:00 in Berlin: past midnight.
  assert.equal(today(new Date('2026-06-15T22:30:00Z')), '2026-06-16');
});

test('R5 accepts a well-formed, existing date', () => {
  assert.equal(validateDueDate('2026-09-19').dueDate, '2026-09-19');
});

test('R5 accepts a leap day', () => {
  assert.equal(validateDueDate('2028-02-29').dueDate, '2028-02-29');
});

test('R5 rejects a day that does not exist', () => {
  assert.match(validateDueDate('2026-02-30').error, /date/i);
});

test('R5 rejects a non-leap-year Feb 29', () => {
  assert.match(validateDueDate('2026-02-29').error, /date/i);
});

test('R5 rejects a wrong format', () => {
  assert.match(validateDueDate('19-09-2026').error, /date/i);
  assert.match(validateDueDate('2026/09/19').error, /date/i);
  assert.match(validateDueDate('not a date').error, /date/i);
});

test('R5 rejects a non-string value', () => {
  assert.match(validateDueDate(12345).error, /date/i);
});

test('R6 treats a missing or null day as no day, not an error', () => {
  assert.equal(validateDueDate(undefined).dueDate, null);
  assert.equal(validateDueDate(null).dueDate, null);
});

test('R4 marks a day before today as overdue', () => {
  assert.equal(dueState('2026-09-18', '2026-09-19'), 'overdue');
});

test('R4 marks a day equal to today as due-today, not overdue', () => {
  assert.equal(dueState('2026-09-19', '2026-09-19'), 'due-today');
});

test('R4 marks a day after today as upcoming', () => {
  assert.equal(dueState('2026-09-20', '2026-09-19'), 'upcoming');
});

test('R4/R6 marks a task without a day as none', () => {
  assert.equal(dueState(null, '2026-09-19'), 'none');
});
