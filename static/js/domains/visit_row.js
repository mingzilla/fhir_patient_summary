import { WireRow } from './wire_row.js';

/**
 * One row of `GET /dashboard/{patient_id}/visits`.
 *
 * `Results` and `Reports` are both counts of things recorded *at* this encounter, so they
 * share one scale and can be stacked. `New problem` is the conditions recorded at the
 * encounter, `"; "`-joined, or `""` when there were none.
 *
 * Rows are sorted date descending with the id as tiebreaker, so **within one day the order is
 * insertion order and not clinical order**. The visit series is drawn on a time axis for that
 * reason: an index axis would present a sequence the data does not claim.
 */
export class VisitRow extends WireRow {
  static ENDPOINT = '/visits';
  static COLUMNS = ['Date', 'Visit', 'Results', 'Reports', 'New problem', 'Source'];

  get date_on() { return this._wire['Date']; }
  get visit_name() { return this._wire['Visit']; }
  get result_count() { return this._wire['Results']; }
  get report_count() { return this._wire['Reports']; }
  get new_problem_text() { return this._wire['New problem']; }

  get recorded_items() {
    return this.result_count + this.report_count;
  }

  get introduced_problem() {
    return this.new_problem_text !== '';
  }

  /** Conditions recorded at this encounter, as a list rather than the joined sentence. */
  get problem_list() {
    return this.new_problem_text === '' ? [] : this.new_problem_text.split('; ');
  }
}
