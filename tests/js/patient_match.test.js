import assert from 'node:assert/strict';
import test from 'node:test';

import { PatientHeader } from '../../static/js/domains/patient_header.js';
import { matches_query, search_roster, searchable_text } from '../../static/js/util/patient_match.js';

const welch = new PatientHeader({
  Patient: 'Welch', Sex: 'female', Age: 6, Born: '2013-01-07', Died: 'living',
  'First seen': '2013-01-07', 'As of': '2019-02-11', 'Clinical events': 194, Source: '12069',
});

const pulido = new PatientHeader({
  Patient: 'Pulido', Sex: 'male', Age: 71, Born: '1934-10-17', Died: '2005-05-23',
  'First seen': '1965-12-29', 'As of': '2005-05-25', 'Clinical events': 473, Source: '1643',
});

const roster = [
  { patient_id: '1643', header: pulido },
  { patient_id: '12069', header: welch },
];

test('a surname is found whatever case it is typed in', () => {
  assert.equal(matches_query(welch, '12069', 'welch'), true);
  assert.equal(matches_query(welch, '12069', 'WELCH'), true);
  assert.equal(matches_query(welch, '12069', 'Wel'), true);
  assert.equal(matches_query(welch, '12069', '  wel  '), true);
});

test('the record id is searchable too, including a prefix of it', () => {
  assert.equal(matches_query(welch, '12069', '12069'), true);
  assert.equal(matches_query(welch, '12069', '120'), true);
});

test('sex, age and dates are not search keys, because one letter would return everyone', () => {
  // `male` contains an `a`, an `e` and an `l`, and a `6` sits inside `16` and `26`. Matching
  // on those returns the whole record for a single typed letter, which reads as a search box
  // that does not work. Only the surname and the id are matched.
  assert.equal(matches_query(welch, '12069', 'female'), false);
  assert.equal(matches_query(pulido, '1643', 'male'), false);
  assert.equal(matches_query(welch, '12069', '2013'), false);
  assert.deepEqual(search_roster(roster, 'female'), []);
  assert.deepEqual(search_roster(roster, 'zzz'), []);
});

test('a query that matches nothing returns nothing, and so does an empty one', () => {
  // An empty box returning the whole record is a search nobody can read a result out of.
  assert.equal(matches_query(welch, '12069', ''), false);
  assert.equal(matches_query(welch, '12069', '   '), false);
  assert.equal(matches_query(welch, '12069', 'zzz'), false);
  assert.deepEqual(search_roster(roster, ''), []);
});

test('only the matching patients come back', () => {
  assert.deepEqual(search_roster(roster, 'pulido'), [roster[0]]);
  assert.deepEqual(search_roster(roster, 'welch'), [roster[1]]);
  assert.deepEqual(search_roster(roster, 'u'), [roster[0]]);
});

test('what is searchable is a stated pair, not whatever happens to be on the object', () => {
  // The row carries nine fields; only two are matched, so a field added later cannot quietly
  // become searchable, and the noisy ones cannot quietly come back.
  assert.equal(searchable_text(welch, '12069'), 'welch 12069');
});
