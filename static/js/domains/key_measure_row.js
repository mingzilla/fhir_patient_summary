import { WireRow } from './wire_row.js';

/**
 * One row of `GET /dashboard/{patient_id}/key_measures` - nine rows, whatever the patient.
 *
 * This is not a time series. There are two readings per code at most - `Latest` and
 * `Previous` - and `Change` is a sentence no chart can plot, which is why the two numbers
 * are on the wire as well.
 *
 * A row the record does not carry still arrives: `Latest` and `Previous` are null and
 * `Measurement` is the literal `"(not in this record)"`. That is information about the
 * record - no PSA was ever taken - and not a gap in the data.
 */
export class KeyMeasureRow extends WireRow {
  static ENDPOINT = '/key_measures';
  static COLUMNS = ['Code', 'Measurement', 'Latest', 'Unit', 'Previous', 'Change',
                    'Why it matters', 'Source', 'Source (prev)'];

  static NEVER_MEASURED = '(not in this record)';

  get code() { return this._wire['Code']; }
  get measurement_name() { return this._wire['Measurement']; }
  get latest_value() { return this._wire['Latest']; }
  get unit_text() { return this._wire['Unit']; }
  get previous_value() { return this._wire['Previous']; }
  get change_text() { return this._wire['Change']; }
  get why_it_matters() { return this._wire['Why it matters']; }
  get previous_source_id() { return this._wire['Source (prev)']; }

  get was_measured() {
    return this.latest_value !== null && this.latest_value !== undefined;
  }

  /** `Change` is `""` when the code was measured once, so there is nothing to compare. */
  get has_comparison() {
    return this.change_text !== '';
  }
}
