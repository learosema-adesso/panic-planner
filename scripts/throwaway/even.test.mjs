import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isEven } from './even.mjs';

test('isEven recognizes an odd number', () => {
  assert.equal(isEven(3), false);
});
