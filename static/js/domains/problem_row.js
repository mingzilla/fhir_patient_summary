import { WireRow } from './wire_row.js';

/**
 * One row of `GET /dashboard/{patient_id}/problems`.
 *
 * `Pair` reports the other problem recorded the *same day*. That is co-recording, not cause
 * and consequence - of the five same-day pairs in this sample, three are one condition
 * written twice - so it is rendered as a note on the row and never as an arrow or an edge.
 *
 * `Years` counts year boundaries crossed rather than complete years elapsed, so it is
 * approximate by up to a year and is for reading, not for arithmetic. The timeline uses
 * `onset_on` and `outcome` instead, which are exact.
 */
export class ProblemRow extends WireRow {
  static ENDPOINT = '/problems';
  static COLUMNS = ['Onset', 'Status', 'Problem', 'Years', 'Outcome', 'Source', 'Pair'];

  get onset_on() { return this._wire['Onset']; }
  get status_text() { return this._wire['Status']; }
  get problem_name() { return this._wire['Problem']; }
  get years_counted() { return this._wire['Years']; }
  get outcome_text() { return this._wire['Outcome']; }
  get paired_problem() { return this._wire['Pair']; }

  get is_ongoing() {
    return this.outcome_text === 'ongoing';
  }

  get is_active() {
    return this.status_text === 'ACTIVE';
  }

  /**
   * `Outcome` is the literal `"ongoing"` or `"resolved YYYY-MM-DD"` - the date is inside the
   * sentence, and it is the only exact end date the endpoint carries.
   */
  get resolved_on() {
    const outcome = this.outcome_text;
    if (outcome === 'ongoing' || outcome === '') {
      return null;
    }
    return outcome.startsWith('resolved ') ? outcome.slice('resolved '.length) : null;
  }
}
