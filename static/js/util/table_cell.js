/**
 * One wire value as a table cell.
 *
 * `null` and `""` are different on this wire and stay different here: the panels coalesce
 * `Unit`, `Pair` and `New problem` to `""` on purpose - the column is empty because there is
 * nothing to say - while a `null` is a value the record does not carry, such as the
 * `Gap (days)` of a first order. Rendering both as blank would hide that distinction, so
 * `null` gets a dash and a title that says what it means.
 */
export function as_text_cell(value) {
  if (value === null || value === undefined) {
    return { text: '-', muted: true, title: 'the record carries no value here' };
  }
  if (value === '') {
    return { text: '', muted: false, title: '' };
  }
  return { text: String(value), muted: false, title: '' };
}

/** The class a value earns in a table cell, kept here so every table agrees. */
export function is_numeric(value) {
  return typeof value === 'number';
}
