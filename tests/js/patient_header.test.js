import assert from 'node:assert/strict';
import test from 'node:test';

import { PatientHeader } from '../../static/js/domains/patient_header.js';

const STRIP = {
  Patient: 'Pulido', Sex: 'male', Age: 71, Born: '1934-10-17', Died: '2005-05-23',
  'First seen': '1965-12-29', 'As of': '2005-05-25', 'Clinical events': 473, Source: '1643',
};

test('a row from the panel, which carries no Given, is still a valid header', () => {
  // `Given` is on the list route and not on the panel: the list needs it, the report does not.
  // A strict column check here would reject every row the patient panel returns.
  const header = PatientHeader.from_wire_series([STRIP])[0];

  assert.equal(header.family_name, 'Pulido');
  assert.equal(header.given_name, '');
  assert.equal(header.clinical_events, 473);
});

test('a row from the list carries the given name', () => {
  const header = PatientHeader.from_wire_series([{ ...STRIP, Given: 'Adán' }])[0];

  assert.equal(header.given_name, 'Adán');
});

test('the full name is Given Family', () => {
  const header = PatientHeader.from_wire_series([{ ...STRIP, Given: 'Adán' }])[0];

  assert.equal(header.full_name, 'Adán Pulido');
});

test('a record with no given name falls back to the surname', () => {
  // Not a placeholder and not a blank: a name missing its first half is still a name, and a
  // list row with nothing on it is worse than the half that is there.
  const header = PatientHeader.from_wire_series([STRIP])[0];

  assert.equal(header.full_name, 'Pulido');
});

test('an explicit null given name falls back too', () => {
  // The join is a LEFT JOIN, so a patient with no `patient_name` row arrives as null rather
  // than as an absent key - and `??` is what stops that rendering as "null Pulido".
  const header = PatientHeader.from_wire_series([{ ...STRIP, Given: null }])[0];

  assert.equal(header.full_name, 'Pulido');
});
