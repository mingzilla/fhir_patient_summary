/**
 * The one store, keyed on the primary domain id - the patient.
 *
 *     { patient_id: { panel_key: row[] } }
 *
 * Nothing reads the network. A component reads a snapshot and draws it, and only the service
 * writes - so the panel data on screen is always something an endpoint returned, which is the
 * point of an API whose numbers are verified SQL. No aggregation happens here or anywhere
 * else downstream of it.
 *
 * Snapshots are frozen. The read-only rule of the frontend design says data out of the store
 * is never edited; a transform that must change a value copies it first.
 *
 * **The list on the left is a working set, not a roster.** It is the patients this reader is
 * looking at, and it grows and shrinks. Because the store is keyed by patient id, both
 * operations are a key operation: adding a patient is a write under its id, and removing one
 * is `drop_patient`, which takes the cached panels with it. There is no third structure to
 * keep in step, and nothing to invalidate.
 *
 * Re-selecting the patient already selected notifies nobody. That is the
 * `data-unchanged UI-unrefresh` rule, and it is what keeps a click on the current patient from
 * tearing down and rebuilding every chart.
 */

/** Freeze a row series so no reader can reach back into the store and mutate it. */
function frozen_series(rows) {
  return Object.freeze(rows.map((row) => row));
}

export class UiDataStore {
  #panels_by_patient = new Map();
  #working_set = [];
  #selected_patient_id = null;
  #subscribers = new Set();
  #revision = 0;

  /**
   * Write one panel's rows. Called by the service, once per endpoint response.
   */
  save_panel(patient_id, panel_key, rows) {
    const panels = this.#panels_by_patient.get(patient_id) ?? {};
    panels[panel_key] = frozen_series(rows);
    this.#panels_by_patient.set(patient_id, panels);
    this.#revision += 1;
    return true;
  }

  /** A frozen `{ panel_key: row[] }` view. Missing panels read as `null`, never as `[]`. */
  snapshot(patient_id) {
    const panels = this.#panels_by_patient.get(patient_id);
    if (panels === undefined) {
      return null;
    }
    return Object.freeze({ patient_id, ...panels });
  }

  has_patient(patient_id) {
    return this.#panels_by_patient.has(patient_id);
  }

  /* ------------------------------------------------------------- working set */

  /** The patients on the left, in the order they were added. */
  get working_set() {
    return Object.freeze([...this.#working_set]);
  }

  in_working_set(patient_id) {
    return this.#working_set.includes(patient_id);
  }

  /** Seed the list without notifying - used once, before the first render. */
  seed_working_set(patient_ids) {
    this.#working_set = [...patient_ids];
  }

  add_to_working_set(patient_id) {
    if (this.in_working_set(patient_id)) {
      return false;
    }
    this.#working_set.push(patient_id);
    this.#notify();
    return true;
  }

  /**
   * Remove a patient from the list and drop its cached panels.
   *
   * The data goes with the key: a patient taken off the left is a patient this reader is no
   * longer looking at, and keeping the rows cached would leave the map growing with every
   * patient ever opened. Clicking the patient again re-fetches, which is cheap and is the
   * only way to be sure the record shown is current.
   */
  drop_patient(patient_id) {
    const at = this.#working_set.indexOf(patient_id);
    if (at === -1) {
      return false;
    }
    this.#working_set.splice(at, 1);
    this.#panels_by_patient.delete(patient_id);
    if (this.#selected_patient_id === patient_id) {
      // Never leave the page showing a patient that is no longer in the list.
      this.#selected_patient_id = this.#working_set[0] ?? null;
    }
    this.#notify();
    return true;
  }

  get selected_patient_id() {
    return this.#selected_patient_id;
  }

  get revision() {
    return this.#revision;
  }

  /** Select a patient. A repeat selection is not a change and notifies nobody. */
  select_patient(patient_id) {
    if (this.#selected_patient_id === patient_id) {
      return false;
    }
    this.#selected_patient_id = patient_id;
    this.#notify();
    return true;
  }

  subscribe(listener) {
    this.#subscribers.add(listener);
    return () => this.#subscribers.delete(listener);
  }

  #notify() {
    const snapshot = this.snapshot(this.#selected_patient_id);
    for (const listener of this.#subscribers) {
      listener(snapshot, this.#selected_patient_id);
    }
  }
}

export const ui_data_store = new UiDataStore();
