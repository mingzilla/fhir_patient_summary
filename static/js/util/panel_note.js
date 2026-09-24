/**
 * The sentences a panel needs when it has nothing to draw.
 *
 * `200 []` is a **finding**, not an error and not a gap: a panel with no rows renders as an
 * empty panel rather than as an absent one, because *none* and *not asked* are different
 * statements and only one of them is true here. The store keeps the difference on the wire -
 * a panel that failed to load reads as `null` and never as `[]` - so these notes are reached
 * only by a response the API actually sent.
 */

/** Counted in the response, not computed from the record: `rows.length` is a fact about the
 *  reply, while a sum over a column would be a number the API did not return. */
export const EMPTY_PANEL_NOTE = Object.freeze({
  problems: 'No problems are recorded in this record.',
  medications: 'No prescriptions are recorded in this record.',
  allergies: 'None known. The record was searched and holds no allergies.',
  visits: 'No visits are recorded in this record.',
});

/**
 * The allergies panel is the one place *none known* carries weight, so it says that rather
 * than "no data" - which would read as an unanswered question.
 */
export const NO_ALLERGY_NOTE = EMPTY_PANEL_NOTE.allergies;

/**
 * The panel prints this footer when no drug repeats, and the contract says to derive it
 * rather than expect it on the wire, because serving it would make the JSON parse for some
 * patients and not others. It is true exactly when every `Course` is `first`.
 *
 * Patient 12069 is the case that triggers it: three orders, three drugs, no renewal.
 */
export const NO_RENEWAL_NOTE = 'No renewal pattern: every order is a first.';

export function has_renewal_pattern(medication_rows) {
  return medication_rows.some((row) => !row.is_first_order);
}

/** The note for an empty panel, or `''` when there is something to draw. */
export function empty_panel_note(panel_key, rows) {
  if (rows === null || rows === undefined || rows.length > 0) {
    return '';
  }
  return EMPTY_PANEL_NOTE[panel_key] ?? 'Nothing is recorded for this panel.';
}

/** The renewal footer, or `''` when at least one drug was re-ordered. */
export function renewal_note(medication_rows) {
  if (medication_rows.length === 0 || has_renewal_pattern(medication_rows)) {
    return '';
  }
  return NO_RENEWAL_NOTE;
}

/**
 * A panel that could not be loaded is a different thing from an empty one, and the page says
 * which. This is the only place the two are allowed to share a code path.
 */
export function unavailable_panel_note(panel_key) {
  return `The ${panel_key} panel did not load. This is not the same as an empty one.`;
}
