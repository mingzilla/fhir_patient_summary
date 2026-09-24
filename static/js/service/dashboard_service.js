import { PANEL_REGISTRY } from '../domains/panel_registry.js';
import { PatientCandidate } from '../domains/patient_candidate.js';
import { PatientHeader } from '../domains/patient_header.js';
import { ui_data_store } from '../store/ui_data_store.js';
import { wire_transport } from './wire_transport.js';

/**
 * Everything that talks to the API: the seven panels read, the list reads, and the two calls
 * that search and add.
 *
 * **Search and add are two different sources.** `/search` asks the FHIR server. The record is
 * the database. A candidate is not in the record until `/load/{id}` returns, which is why the
 * results carry a `+` rather than a link: there is a step in between, and it is not instant.
 *
 * The seven panel requests go out together - `Promise.all` - because they are independent and
 * each is one query against a local DuckDB file. If any one fails the patient is not written at
 * all, so a half-drawn record can never reach the screen: a panel missing from the store reads
 * as `null`, and `null` is not the same finding as `[]`.
 */
export class DashboardService {
  #transport;
  #store;
  #roster = null;

  constructor(transport = wire_transport, store = ui_data_store) {
    this.#transport = transport;
    this.#store = store;
  }

  /** Fetch all seven panels for one patient and write them. */
  async load_patient(patient_id) {
    const responses = await Promise.all(
      PANEL_REGISTRY.map(async (panel) => [panel, await this.#transport.get_panel(patient_id, panel.endpoint)]),
    );

    for (const [, response] of responses) {
      if (!response.ok) {
        return { ok: false, status: response.status, detail: response.detail };
      }
    }

    for (const [panel, response] of responses) {
      this.#store.save_panel(patient_id, panel.key, panel.domain.from_wire_series(response.body));
    }
    return { ok: true, patient_id };
  }

  /** Load if absent, then select. A patient already loaded is not refetched. */
  async select_patient(patient_id) {
    if (this.#store.has_patient(patient_id)) {
      this.#store.select_patient(patient_id);
      return { ok: true, patient_id, cached: true };
    }
    const loaded = await this.load_patient(patient_id);
    if (loaded.ok) {
      this.#store.select_patient(patient_id);
    }
    return loaded;
  }

  /**
   * The patients in the record, from `GET /dashboard/patients`.
   *
   * One request, and the rows are panel 1's own shape - the same nine columns the patient
   * panel prints - so the list and the header of the open patient are the same domain read
   * twice, and the row for whoever is open is already here.
   *
   * `limit=0` is no limit. The list is fetched whole because a list this page can hold is a
   * list it can filter; pagination is on the route for when that stops being true.
   */
  async load_roster() {
    if (this.#roster !== null) {
      return this.#roster;
    }
    const response = await this.#transport.get_json('/dashboard/patients?limit=0');
    if (!response.ok) {
      this.#roster = [];
      return this.#roster;
    }
    this.#roster = PatientHeader.from_wire_series(response.body)
      .map((header) => ({ patient_id: header.source_id, header }));
    return this.#roster;
  }

  /* ------------------------------------------------------------- search and add */

  /**
   * Candidates for a name, from the FHIR server.
   *
   * The three outcomes are kept apart, because two of them look identical on the wire and
   * mean opposite things. `ok` with an empty list is *nobody matched* - a finding. Not `ok`
   * is *the search did not run*, which is not a statement about the record at all and must
   * never be shown as one.
   */
  async search_candidates(query) {
    const response = await this.#transport.get_json(`/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      return { ok: false, status: response.status, detail: response.detail };
    }
    return { ok: true, candidates: PatientCandidate.from_wire_series(response.body) };
  }

  /**
   * Put one candidate into the record, then return their list row.
   *
   * The endpoint answers with the id and a state, not with a row - it has no opinion about how
   * the list draws - so the row is read back, and it is read from **the list route**.
   *
   * Not from `/dashboard/{id}/patient`, which is the obvious-looking one and is wrong: a panel
   * row carries no given name. Panel 1 prints a surname because that is what the report prints,
   * and `Given` is on the list route alone. Reading the new row from the panel drew a patient
   * who had just been added as `Boyle` while every other row read `Tiera Boyle` - the one row
   * the reader is looking at, missing the half of the name the list exists to show, and
   * repairing itself only on the next page load.
   *
   * The whole list is re-read rather than one row appended. It is the same number of requests,
   * it cannot disagree with the record it came from, and it picks up anything else that changed
   * while the fetch was in flight.
   */
  async add_to_record(patient_id) {
    const response = await this.#transport.post_json(`/load/${encodeURIComponent(patient_id)}`);
    if (!response.ok) {
      return { ok: false, status: response.status, detail: response.detail };
    }
    const listed = await this.#transport.get_json('/dashboard/patients?limit=0');
    if (!listed.ok) {
      // Added, but the list will not read back. The patient is in the record either way, so
      // this is a missing row rather than a lost patient - say which.
      return { ok: false, status: listed.status ?? 0,
               detail: 'added, but the list could not be read back' };
    }
    this.#roster = PatientHeader.from_wire_series(listed.body)
      .map((header) => ({ patient_id: header.source_id, header }));

    const entry = this.#roster.find((row) => row.patient_id === patient_id);
    return entry === undefined
      ? { ok: false, status: 0, detail: 'added, but the patient is not in the list' }
      : { ok: true, entry };
  }

  /**
   * Take one patient out of the record, so the list shrinks and stays shrunk.
   *
   * The add and the remove are the same path in opposite directions, and `state` is which way
   * it went - `ready` or `absent`.
   *
   * **A 404 here is not a failure.** It means the patient is not in the record, which is the
   * outcome that was asked for; reporting it as an error would put a red mark on a row for
   * having achieved exactly what was wanted. The one thing it must not do is be confused with
   * the add's 404, which means the *server* has never heard of that patient - the same status
   * code for two different statements, told apart by which verb produced them.
   *
   * Removing is reversible: the patient still exists on the FHIR server and `+` fetches them
   * back. What is dropped is this dashboard's copy.
   */
  async remove_from_record(patient_id) {
    const response = await this.#transport.delete_json(`/load/${encodeURIComponent(patient_id)}`);
    if (!response.ok && response.status !== 404) {
      return { ok: false, status: response.status, detail: response.detail };
    }
    if (this.#roster !== null) {
      this.#roster = this.#roster.filter((listed) => listed.patient_id !== patient_id);
    }
    return { ok: true, already_absent: !response.ok };
  }
}

export const dashboard_service = new DashboardService();
