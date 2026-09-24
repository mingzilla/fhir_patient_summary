/**
 * Finding a patient by what a clinician would type.
 *
 * The search is over the patient headers the page has already fetched, and **not over the
 * record**. The dashboard API answers per patient - `/dashboard/{id}/patient` - and has no
 * search route, so there is nothing to ask for a patient this page has not already seen. This
 * is a filter, and it is named one; a real search needs an endpoint and is the one thing this
 * feature is waiting on.
 *
 * Matching is a case-insensitive substring over **the surname and the record id** - the two
 * things that identify a patient. Deliberately not fuzzy: a clinical record has no place for
 * a result that is *close* to what was asked for.
 *
 * The other fields on the row are deliberately not matched. Sex and age are the trap: `male`
 * contains an `a`, `e` and an `l`, and a `6` sits inside `16` and `26`, so a search over them
 * returns every patient for a single typed letter - which reads as a search box that does not
 * work. What a reader types into this box is a name, or an id off a paper record.
 */

const RESULT_LIMIT = 12;

/** The text a query is matched against. Exported so a test can assert what is searchable. */
export function searchable_text(header, patient_id) {
  return `${header.family_name} ${patient_id}`.toLowerCase();
}

export function matches_query(header, patient_id, query) {
  const needle = String(query ?? '').trim().toLowerCase();
  if (needle === '') {
    return false;
  }
  return searchable_text(header, patient_id).includes(needle);
}

/**
 * The roster entries matching a query, capped.
 *
 * An empty query returns nothing rather than everything: the list of patients is already on
 * screen, and a search box that dumps the whole record when cleared is a search box nobody
 * can read a result out of.
 */
export function search_roster(roster, query) {
  return roster
    .filter((entry) => matches_query(entry.header, entry.patient_id, query))
    .slice(0, RESULT_LIMIT);
}
