/**
 * Text for values that came off the wire.
 *
 * The rule is that nothing is recomputed. A number is printed as the JSON carried it: the
 * endpoint's arithmetic is the verified part of this pipeline, and a frontend that rounded or
 * rescaled would be asserting a different number with the same confident face.
 *
 * **Known deviation.** The panel prints a whole-numbered decimal with its `.0` - patient 1's
 * body mass index is `Latest 30.0` - and JSON does not preserve that: `30.0` and `30` parse to
 * the same JavaScript number, so this prints `30`. It is cosmetic, it affects only values that
 * are exactly whole, and it never puts two different readings on one row, because a `Change`
 * sentence that quotes a number is only written when the two readings differ.
 */

export const NOT_MEASURED_TEXT = 'not measured';

/** `null` reads as empty rather than as `"null"` or `"NaN"`. */
export function format_number(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

/** `1.03` + `"mg/dL"` -> `"1.03 mg/dL"`. A record with no unit leaves the number alone. */
export function format_with_unit(value, unit) {
  const number = format_number(value);
  if (number === '') {
    return '';
  }
  return unit === '' || unit === null || unit === undefined ? number : `${number} ${unit}`;
}

/**
 * A missing key measurement is a fact about the record - *no PSA was ever taken* - so it is
 * said rather than left blank.
 */
export function format_measure_reading(value, unit, change_text) {
  if (value === null || value === undefined) {
    return change_text === NOT_MEASURED_TEXT ? NOT_MEASURED_TEXT : '';
  }
  return format_with_unit(value, unit);
}

/** `""` when a string column is deliberately blank (`Pair`, `New problem`, `Unit`). */
export function format_text(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

/** Hundreds separators for event counts. `473` -> `"473"`, `12069` -> `"12,069"`. */
export function format_count(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return Number(value).toLocaleString('en-GB');
}
