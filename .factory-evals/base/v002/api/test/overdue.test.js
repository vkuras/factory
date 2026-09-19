import { test } from 'node:test';
import assert from 'node:assert/strict';
import { todayInBerlin, overdueWorkingDays, overdueLabel } from '../src/overdue.js';

test('R1 examples', () => {
  assert.equal(overdueWorkingDays('2026-09-10', '2026-09-11'), 1); // Thu -> Fri
  assert.equal(overdueWorkingDays('2026-09-11', '2026-09-12'), 0); // Fri -> Sat
  assert.equal(overdueWorkingDays('2026-09-11', '2026-09-14'), 1); // Fri -> Mon
  assert.equal(overdueWorkingDays('2026-09-09', '2026-09-16'), 5); // Wed -> Wed
});

test('R1 due today or in the future or without due date is not overdue', () => {
  assert.equal(overdueWorkingDays('2026-09-14', '2026-09-14'), 0);
  assert.equal(overdueWorkingDays('2026-09-20', '2026-09-14'), 0);
  assert.equal(overdueWorkingDays(null, '2026-09-14'), 0);
});

test('R1 today is determined in Europe/Berlin', () => {
  assert.equal(todayInBerlin(new Date('2026-09-14T23:30:00Z')), '2026-09-15');
  assert.equal(todayInBerlin(new Date('2026-09-14T21:59:00Z')), '2026-09-14');
});

test('R2 label texts', () => {
  assert.equal(overdueLabel(0), null);
  assert.equal(overdueLabel(1), 'Überfällig seit 1 Arbeitstag');
  assert.equal(overdueLabel(3), 'Überfällig seit 3 Arbeitstagen');
});
