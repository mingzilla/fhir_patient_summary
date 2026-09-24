import { WireRow } from './wire_row.js';

/**
 * One search result, from `GET /search?q=`.
 *
 * **This is not a patient in the record.** It is a patient the FHIR server knows about, and
 * the dashboard holds seven of the hundreds it knows. A candidate becomes a `PatientHeader`
 * only after `/load/{id}` has put them in the database, so the two are separate domains rather
 * than one shape bent to fit both.
 *
 * The two shapes also disagree about what a name is. A candidate's `name` is `Given Family`
 * (`"Abdul Koepp"`); a record row's `Patient` is the family name alone (`"Koepp"`). Same
 * person, two strings, and rendering one as the other would show a reader two different names
 * for one patient.
 *
 * The candidate carries no age - only `birth_date` - because age is a fact about a record's
 * end, which a candidate does not have.
 */
export class PatientCandidate extends WireRow {
  static ENDPOINT = '/search';
  static COLUMNS = ['name', 'birth_date', 'gender', 'id'];

  get display_name() { return this._wire['name']; }
  get birth_date() { return this._wire['birth_date']; }
  get gender() { return this._wire['gender'];}
  get candidate_id() { return this._wire['id']; }
}
