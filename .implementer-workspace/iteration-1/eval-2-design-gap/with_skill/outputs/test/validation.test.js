import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateTitle } from '../src/validation.js';

test('R1 trims the title', () => {
  assert.equal(validateTitle('  Buy milk  ').title, 'Buy milk');
});

test('R1 rejects an empty title', () => {
  assert.equal(validateTitle('   ').error, 'A title is required.');
});

test('R1 rejects a missing title', () => {
  assert.ok(validateTitle(undefined).error);
});

test('R1 accepts a title of exactly 200 characters', () => {
  assert.equal(validateTitle('x'.repeat(200)).title.length, 200);
});

test('R1 rejects a title of 201 characters', () => {
  assert.ok(validateTitle('x'.repeat(201)).error);
});
