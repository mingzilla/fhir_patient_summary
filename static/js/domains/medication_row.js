import { WireRow } from './wire_row.js';

/**
 * One row of `GET /dashboard/{patient_id}/medications` - the report's **Prescriptions** panel.
 *
 * `Status` is raw and lower-case here, unlike every other status column on the wire, which
 * the panels upper-case. `Gap (days)` is null on a first order and carries the days since the
 * previous order of the *same* drug on a re-order, so it is read per drug and never across
 * drugs.
 */
export class MedicationRow extends WireRow {
  static ENDPOINT = '/medications';
  static COLUMNS = ['Ordered', 'Medication', 'Status', 'Gap (days)', 'Course', 'Source'];

  get ordered_on() { return this._wire['Ordered']; }
  get medication_name() { return this._wire['Medication']; }
  get status_text() { return this._wire['Status']; }
  get gap_days() { return this._wire['Gap (days)']; }
  get course_text() { return this._wire['Course']; }

  get is_first_order() {
    return this.course_text === 'first';
  }

  get has_gap() {
    return this.gap_days !== null && this.gap_days !== undefined;
  }
}
