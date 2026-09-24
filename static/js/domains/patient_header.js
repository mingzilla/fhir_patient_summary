import { WireRow } from './wire_row.js';

/**
 * The single row of `GET /dashboard/{patient_id}/patient`.
 *
 * `Died` is a string either way - the literal `"living"` or a date - so `is_deceased`
 * tests for the word and never for null.
 */
export class PatientHeader extends WireRow {
  static ENDPOINT = '/patient';
  /**
   * `Given` is on the **list** route and not on the panel. The list needs it to tell two
   * patients apart; panel 1 prints a surname and the report is built from what it prints.
   * So it is read with `get()` rather than declared, and a row from the panel is still valid.
   */
  static COLUMNS = ['Patient', 'Sex', 'Age', 'Born', 'Died', 'First seen', 'As of',
                    'Clinical events', 'Source'];

  get family_name() { return this._wire['Patient']; }

  get given_name() { return this._wire['Given'] ?? ''; }

  /**
   * `Given Family`, or the family name alone where the record carries no given name.
   *
   * Two patients can share a surname, and a list of surnames is a list you cannot pick from.
   * The fallback is the surname rather than a placeholder: a name missing its first half is
   * still a name, and an empty line would be worse than the half that is there.
   */
  get full_name() {
    return this.given_name === '' ? this.family_name : `${this.given_name} ${this.family_name}`;
  }
  get sex() { return this._wire['Sex']; }
  get age_years() { return this._wire['Age']; }
  get born_on() { return this._wire['Born']; }
  get died_on() { return this._wire['Died']; }
  get first_seen_on() { return this._wire['First seen']; }
  get as_of() { return this._wire['As of']; }
  get clinical_events() { return this._wire['Clinical events']; }

  /** `Died` is the literal `"living"` for a patient who is alive at `As of`. */
  get is_deceased() {
    return this.died_on !== 'living';
  }

  /** Age is age at `As of`, so it is a fact about the record rather than about today. */
  get age_basis() {
    return this.is_deceased ? `died ${this.died_on}` : 'living';
  }
}
