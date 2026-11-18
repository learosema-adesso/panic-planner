import { test } from 'node:test';
import assert from 'node:assert/strict';
import { average } from './average.mjs';

test('average of a list', () => {
  assert.equal(average([2, 4, 6]), 4);
});
