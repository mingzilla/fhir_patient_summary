import assert from 'node:assert/strict';
import test from 'node:test';

import { as_text_cell, is_numeric } from '../../static/js/util/table_cell.js';

test('null and empty string are rendered differently, because they mean different things', () => {
  // `Gap (days)` is null on a first order - the record carries no value. `Pair` is "" - the
  // column is empty on purpose. Collapsing both to blank would hide that.
  const missing = as_text_cell(null);
  const blank = as_text_cell('');

  assert.equal(missing.text, '-');
  assert.equal(missing.muted, true);
  assert.match(missing.title, /carries no value/);

  assert.equal(blank.text, '');
  assert.equal(blank.muted, false);
  assert.equal(blank.title, '');
});

test('a zero is a value and is not treated as missing', () => {
  assert.equal(as_text_cell(0).text, '0');
  assert.equal(as_text_cell(0).muted, false);
  assert.equal(as_text_cell('0').text, '0');
});

test('undefined is missing too', () => {
  assert.equal(as_text_cell(undefined).text, '-');
});

test('a number is a number and a numeric string is not', () => {
  // `Source` arrives as a string and must not be right-aligned as a measurement.
  assert.equal(is_numeric(365), true);
  assert.equal(is_numeric('365'), false);
  assert.equal(is_numeric(null), false);
});
