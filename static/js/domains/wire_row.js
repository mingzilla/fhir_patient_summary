/**
 * Base for a domain row.
 *
 * A domain mirrors one wire row: the same keys, in the panel's order, frozen on arrival.
 * `data_analysis/stage_06__dashboard/01__api_contract.md` is the only source for either -
 * the keys are the report's column headings verbatim, which is why they carry spaces and
 * parentheses and why they are read with `get('Gap (days)')` rather than `row.gap_days`.
 *
 * The freeze is the read-only rule of the frontend design: data out of the store is never
 * edited, so a transform that needs to change a value copies it first.
 */
export class WireRow {
  /** Verbatim wire keys, in the order the panel prints them. Overridden per domain. */
  static COLUMNS = [];

  /** The endpoint segment these rows arrive from. Used in error messages only. */
  static ENDPOINT = '';

  constructor(wire) {
    const columns = this.constructor.COLUMNS;
    const missing = columns.filter((column) => !(column in wire));
    if (missing.length > 0) {
      throw new Error(`${this.constructor.ENDPOINT}: row is missing ${missing.join(', ')}`);
    }
    this._wire = Object.freeze({ ...wire });
  }

  /** Build a frozen series from the endpoint's bare JSON array. */
  static from_wire_series(rows) {
    return rows.map((wire) => new this(wire));
  }

  get(column) {
    return this._wire[column];
  }

  /** The row as an array, in `COLUMNS` order - what a table view renders. */
  to_row_values() {
    return this.constructor.COLUMNS.map((column) => this._wire[column]);
  }

  /** The resource id this row came from, traceable past the report into the record. */
  get source_id() {
    return this._wire['Source'];
  }
}
