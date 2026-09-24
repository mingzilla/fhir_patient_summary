import { WireRow } from './wire_row.js';

/**
 * One row of `GET /dashboard/{patient_id}/record_mix` - twelve rows, whatever the patient.
 *
 * `Class` is three values and not two. `clinical` is exactly the eight types the report reads;
 * `billing` and `not read` are rows the record holds that no part of this pipeline fetches.
 * Showing them is the point - it is what the boundary filters out - so no row is dropped when
 * its count is zero.
 *
 * There is deliberately no `Source`: an aggregate over a whole table has no single row behind
 * it, which is also why `rows_count` is the one number on the page that cannot be traced back.
 */
export class RecordMixRow extends WireRow {
  static ENDPOINT = '/record_mix';
  static COLUMNS = ['Resource', 'Rows', 'Class'];

  static CLINICAL = 'clinical';
  static BILLING = 'billing';
  static NOT_READ = 'not read';

  get resource_name() { return this._wire['Resource']; }
  get rows_count() { return this._wire['Rows']; }
  get class_text() { return this._wire['Class']; }

  get is_clinical() {
    return this.class_text === RecordMixRow.CLINICAL;
  }

  get was_read() {
    return this.class_text !== RecordMixRow.NOT_READ;
  }
}
