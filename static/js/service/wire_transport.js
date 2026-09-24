/**
 * The only place `fetch` is called.
 *
 * A 404 here is a defined answer and not an exception: the API returns it for a patient the
 * record does not hold, and the contract is explicit that a non-numeric id is a 404 too. So
 * the transport reports what happened and lets the service decide what it means.
 *
 * A `200 []` never reaches this file's error path - an empty panel is a success with no rows,
 * and six of the seven patients have no allergies.
 */
export class WireTransport {
  #base_url;

  constructor(base_url = '') {
    this.#base_url = base_url;
  }

  /** @returns {Promise<{ok: true, rows: unknown[]} | {ok: false, status: number, detail: string}>} */
  async get_panel(patient_id, endpoint) {
    return this.get_json(`/dashboard/${encodeURIComponent(patient_id)}/${endpoint}`);
  }

  /** Any route that answers a bare JSON array, so the list is not a special case. */
  async get_json(path) {
    return this.#send(path, 'GET');
  }

  /**
   * A route that changes the record. The only one is `/load/{id}`.
   *
   * It is not idempotent by accident: adding a patient already in the record is a no-op on
   * the server, so a double click cannot duplicate anybody and the client's tick is a
   * convenience rather than the guard.
   */
  async post_json(path) {
    return this.#send(path, 'POST');
  }

  /** The same path as the add, going the other way: `state` says which way it went. */
  async delete_json(path) {
    return this.#send(path, 'DELETE');
  }

  async #send(path, method) {
    let response;
    try {
      response = await fetch(`${this.#base_url}${path}`, {
        method,
        headers: { accept: 'application/json' },
      });
    } catch (error) {
      return { ok: false, status: 0, detail: `the dashboard API is unreachable: ${error.message}` };
    }
    if (response.ok) {
      return { ok: true, body: await response.json() };
    }
    return { ok: false, status: response.status, detail: await this.#detail_of(response) };
  }

  async #detail_of(response) {
    try {
      const body = await response.json();
      return body?.detail ?? response.statusText;
    } catch {
      return response.statusText;
    }
  }
}

export const wire_transport = new WireTransport();
