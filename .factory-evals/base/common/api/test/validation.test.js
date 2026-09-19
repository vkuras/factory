import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateTitle, validateDueDate } from '../src/validation.js';

test('S1.2 empty or blank title is rejected', () => {
  assert.equal(validateTitle(''), 'Bitte gib einen Titel ein.');
  assert.equal(validateTitle('   '), 'Bitte gib einen Titel ein.');
  assert.equal(validateTitle(undefined), 'Bitte gib einen Titel ein.');
});

test('S1.3 title longer than 100 characters is rejected', () => {
  assert.equal(validateTitle('x'.repeat(100)), null);
  assert.equal(validateTitle('x'.repeat(101)), 'Der Titel darf höchstens 100 Zeichen lang sein.');
});

test('due date is optional and must be a real date', () => {
  assert.equal(validateDueDate(undefined), null);
  assert.equal(validateDueDate(''), null);
  assert.equal(validateDueDate('2026-09-14'), null);
  assert.equal(validateDueDate('2026-02-30'), 'Bitte gib ein gültiges Datum ein.');
  assert.equal(validateDueDate('14.09.2026'), 'Bitte gib ein gültiges Datum ein.');
});
