import assert from 'node:assert/strict';
import test from 'node:test';

import {
  format_count,
  format_measure_reading,
  format_number,
  format_text,
  format_with_unit,
} from '../../static/js/util/value_text.js';

test('a number is printed as the wire carried it, never recomputed', () => {
  assert.equal(format_number(1.03), '1.03');
  assert.equal(format_number(17.36), '17.36');
  assert.equal(format_number(365), '365');
  assert.equal(format_number(129.48), '129.48');
});

test('a whole-numbered decimal loses its .0, which is the one known deviation', () => {
  // The panel prints patient 1's body mass index as `30.0`; JSON does not preserve that and
  // `30.0` and `30` are the same JavaScript number. Recorded here so the difference is a
  // decision on file rather than a surprise in a diff.
  assert.equal(format_number(JSON.parse('[30.0]')[0]), '30');
});

test('null reads as empty, not as "null" or "NaN"', () => {
  assert.equal(format_number(null), '');
  assert.equal(format_number(undefined), '');
  assert.equal(format_with_unit(null, 'mg/dL'), '');
});

test('a unit is appended only when the record carries one', () => {
  assert.equal(format_with_unit(1.03, 'mg/dL'), '1.03 mg/dL');
  assert.equal(format_with_unit(5.14, 'ng/mL'), '5.14 ng/mL');
  assert.equal(format_with_unit(27.37, ''), '27.37');
});

test('a key measurement the record does not carry says so', () => {
  assert.equal(format_measure_reading(null, '', 'not measured'), 'not measured');
  assert.equal(format_measure_reading(5.14, 'ng/mL', 'rising from 0.72'), '5.14 ng/mL');
  // A blank Change means measured once, so there is nothing to compare - and no reading to
  // report either, in which case the cell is empty rather than claiming a measurement.
  assert.equal(format_measure_reading(6.36, '%', ''), '6.36 %');
});

test('an empty string stays empty and is not rendered as text', () => {
  assert.equal(format_text(''), '');
  assert.equal(format_text(null), '');
  assert.equal(format_text('smokes tobacco daily'), 'smokes tobacco daily');
  // `Pair` and `New problem` coalesce to "" on purpose; nothing invents a placeholder here,
  // and `table_cell` is what keeps "" and null apart once they reach a table.
  assert.equal(format_text(0), '0');
});

test('counts are grouped for reading', () => {
  assert.equal(format_count(473), '473');
  assert.equal(format_count(0), '0');
  assert.equal(format_count(null), '');
});
