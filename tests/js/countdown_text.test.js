import assert from 'node:assert/strict';
import test from 'node:test';

import { countdown_text } from '../../static/js/util/countdown_text.js';

test('it counts down a second at a time', () => {
  assert.equal(countdown_text(0), '20s');
  assert.equal(countdown_text(1), '19s');
  assert.equal(countdown_text(19), '1s');
});

test('it stops counting rather than going past zero', () => {
  // Adding a patient takes fifteen to twenty seconds, so the estimate and the wait are about
  // the same length. A countdown that ran to -5s, or wrapped, would be a
  // progress indicator reporting progress that is not happening.
  assert.equal(countdown_text(20), 'still working');
  assert.equal(countdown_text(23), 'still working');
  assert.equal(countdown_text(600), 'still working');
});

test('part of a second is still the second it is in', () => {
  assert.equal(countdown_text(0.4), '20s');
  assert.equal(countdown_text(1.9), '19s');
});

test('a nonsense elapsed time reads as no time elapsed, not as NaN', () => {
  assert.equal(countdown_text(undefined), '20s');
  assert.equal(countdown_text(Number.NaN), '20s');
  assert.equal(countdown_text(-5), '20s');
});
