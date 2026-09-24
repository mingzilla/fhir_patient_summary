import assert from 'node:assert/strict';
import test from 'node:test';

import { UiDataStore } from '../../static/js/store/ui_data_store.js';

function store_with(ids) {
  const store = new UiDataStore();
  store.seed_working_set(ids);
  store.select_patient(ids[0]);
  return store;
}

test('a snapshot cannot be edited by whoever reads it', () => {
  const store = store_with(['1643']);
  store.save_panel('1643', 'problems', [{ Problem: 'x' }]);
  const snapshot = store.snapshot('1643');

  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.problems), true);
  assert.throws(() => { snapshot.problems.push({}); }, TypeError);
});

test('a panel that was never written reads as absent, and never as an empty array', () => {
  // Absent is "not loaded" and [] is "loaded, none known" - the distinction the whole page
  // rests on. A store that coalesced them would turn no-allergies into a failed request.
  const store = store_with(['1643']);
  store.save_panel('1643', 'problems', [{ Problem: 'x' }]);

  const snapshot = store.snapshot('1643');
  assert.equal(snapshot.allergies, undefined);
  assert.equal(snapshot.patient, undefined);
  // A patient with nothing saved at all is a different thing again: no snapshot.
  assert.equal(store.snapshot('999999'), null);
});

test('adding a patient is a key operation, and adding twice is not a second entry', () => {
  const store = store_with(['1643']);
  assert.equal(store.add_to_working_set('12069'), true);
  assert.equal(store.add_to_working_set('12069'), false);
  assert.deepEqual(store.working_set, ['1643', '12069']);
});

test('dropping a patient takes its cached panels with the key', () => {
  const store = store_with(['1643', '12069']);
  store.save_panel('12069', 'problems', [{ Problem: 'x' }]);
  assert.equal(store.has_patient('12069'), true);

  assert.equal(store.drop_patient('12069'), true);
  assert.equal(store.has_patient('12069'), false);
  assert.equal(store.snapshot('12069'), null);
  assert.deepEqual(store.working_set, ['1643']);
});

test('dropping a patient that is not listed changes nothing', () => {
  const store = store_with(['1643']);
  assert.equal(store.drop_patient('12069'), false);
  assert.deepEqual(store.working_set, ['1643']);
});

test('dropping the patient on screen moves the selection to one that is still listed', () => {
  // Otherwise the page keeps showing a record the reader has just taken off the list.
  const store = store_with(['1643', '12069']);
  store.select_patient('12069');
  store.drop_patient('12069');
  assert.equal(store.selected_patient_id, '1643');
});

test('dropping the last patient leaves nobody selected rather than a dangling id', () => {
  const store = store_with(['1643']);
  store.drop_patient('1643');
  assert.equal(store.selected_patient_id, null);
  assert.deepEqual(store.working_set, []);
});

test('a repeat selection is not a change and notifies nobody', () => {
  // The `data-unchanged UI-unrefresh` rule: clicking the patient already open must not tear
  // down and rebuild every chart on the page.
  const store = store_with(['1643']);
  let notifications = 0;
  store.subscribe(() => { notifications += 1; });

  assert.equal(store.select_patient('1643'), false);
  assert.equal(notifications, 0);
  assert.equal(store.select_patient('12069'), true);
  assert.equal(notifications, 1);
});

test('the listed order is the order patients were added', () => {
  const store = new UiDataStore();
  store.seed_working_set([]);
  store.add_to_working_set('12069');
  store.add_to_working_set('1643');
  assert.deepEqual(store.working_set, ['12069', '1643']);
});
