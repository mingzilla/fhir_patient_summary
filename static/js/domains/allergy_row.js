import { WireRow } from './wire_row.js';

/**
 * One row of `GET /dashboard/{patient_id}/allergies` - the only safety resource on the page.
 *
 * `Criticality` is the risk the allergy poses, not how bad a reaction was: the record's
 * `reaction[]` is empty for every patient in this sample, so no field here claims a severity.
 * There is deliberately no `category` field either.
 *
 * Six of the seven patients return `[]` from this endpoint. That is *none known* - a finding -
 * and not *not checked*.
 */
export class AllergyRow extends WireRow {
  static ENDPOINT = '/allergies';
  static COLUMNS = ['Recorded', 'Allergen', 'Criticality', 'Status', 'Source'];

  get recorded_on() { return this._wire['Recorded']; }
  get allergen_name() { return this._wire['Allergen']; }
  get criticality_text() { return this._wire['Criticality']; }
  get status_text() { return this._wire['Status']; }

  get is_active() {
    return this.status_text === 'ACTIVE';
  }
}
