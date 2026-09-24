import assert from 'node:assert/strict';
import test from 'node:test';

import { MedicationRow } from '../../static/js/domains/medication_row.js';
import {
  NO_RENEWAL_NOTE,
  empty_panel_note,
  has_renewal_pattern,
  renewal_note,
  unavailable_panel_note,
} from '../../static/js/util/panel_note.js';

function medication(wire) {
  return new MedicationRow({
    Ordered: '2000-01-01', Medication: 'X', Status: 'active', 'Gap (days)': null,
    Course: 'first', Source: '1', ...wire,
  });
}

test('an empty panel says none known, and never says nothing was checked', () => {
  const note = empty_panel_note('allergies', []);
  assert.match(note, /None known/);
  assert.match(note, /searched/);
});

test('a panel with rows gets no note', () => {
  assert.equal(empty_panel_note('allergies', [medication({})]), '');
});

test('a panel that failed to load is a different statement from an empty one', () => {
  // The store keeps a missing panel as null, so this is the only path that may say it.
  assert.equal(empty_panel_note('allergies', null), '');
  assert.match(unavailable_panel_note('Allergies'), /did not load/);
  assert.match(unavailable_panel_note('Allergies'), /not the same as an empty one/);
});

test('every panel that can be empty has a sentence of its own', () => {
  for (const key of ['problems', 'medications', 'allergies', 'visits']) {
    assert.notEqual(empty_panel_note(key, []), '', key);
  }
});

test('the renewal footer is derived, and true exactly when every course is a first', () => {
  const all_first = [
    medication({ Medication: 'predniSONE 5 MG Oral Tablet', Course: 'first' }),
    medication({ Medication: 'Loratadine 5 MG Chewable Tablet', Course: 'first' }),
  ];
  assert.equal(has_renewal_pattern(all_first), false);
  assert.equal(renewal_note(all_first), NO_RENEWAL_NOTE);

  const with_reorder = [...all_first, medication({ Medication: 'Simvistatin 10 MG', Course: 're-order' })];
  assert.equal(has_renewal_pattern(with_reorder), true);
  assert.equal(renewal_note(with_reorder), '');
});

test('the renewal footer is not printed over an empty panel', () => {
  // "every order is a first" is vacuously true of no orders, and printing it there would be
  // a claim about a panel that has nothing in it.
  assert.equal(renewal_note([]), '');
});
