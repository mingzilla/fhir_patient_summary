import { countdown_text } from '../util/countdown_text.js';
import { format_number } from '../util/value_text.js';
import { element } from './panel_card.js';

/**
 * The patient list - one row per patient, each a single line.
 *
 * One line and not three: a list of a dozen patients is *scanned*, and a three-line entry
 * turns twelve rows into thirty-six lines of text to read past. The surname is the thing being
 * looked for, so it carries the weight and the rest is set beside it in recessive ink.
 *
 * A row is two controls, not one. The name opens the patient; the `×` takes the patient off
 * the list and drops its cached panels. Removing the one on screen moves the selection to the
 * first remaining rather than leaving the page showing somebody who is no longer listed.
 *
 * Rendered into the left column on a wide screen and into the drawer on a phone. One function
 * marks the current patient in both, because two lists that can disagree about which patient
 * is open is a bug waiting for a narrow window.
 */
export function build_picker(container, roster, { on_open, on_remove, removal_state, pending = [] }) {
  container.classList.add('patient-picker--list');
  container.replaceChildren();

  const label = element('span', 'patient-picker__label');
  label.textContent = 'Patients';
  container.append(label);

  if (roster.length === 0 && pending.length === 0) {
    const empty = element('p', 'patient-picker__empty');
    empty.textContent = 'No patients. Add one with the search box.';
    container.append(empty);
    return container;
  }

  for (const entry of roster) {
    container.append(row(entry, { on_open, on_remove, removal_state }));
  }
  // The patients being fetched, at the bottom, where the real row will land. A patient being
  // added is not in the record yet, so there is no row to draw - but a click that shows
  // nothing in the list for twenty seconds reads as a click that did not work.
  for (const entry of pending) {
    container.append(pending_row(entry));
  }
  return container;
}

/**
 * The placeholder: a dashed box saying whose row is coming and how long it has been.
 *
 * It carries no `×` and cannot be opened - there is nothing to remove and nothing to open
 * until the server has the patient - so it is a box rather than a row, and the reader can see
 * at a glance that it is not one of the patients.
 */
function pending_row(entry) {
  const wrapper = element('div', 'patient-picker__row patient-picker__row--pending');
  wrapper.dataset.pendingId = entry.patient_id;

  const name = element('span', 'patient-picker__pending-name');
  name.textContent = entry.full_name;
  wrapper.append(name);

  const countdown = element('span', 'patient-picker__countdown');
  countdown.textContent = countdown_text(entry.elapsed_seconds);
  wrapper.append(countdown);
  return wrapper;
}

function row(entry, { on_open, on_remove, removal_state }) {
  const wrapper = element('div', 'patient-picker__row');
  wrapper.dataset.patientId = entry.patient_id;

  const open = element('button', 'patient-picker__choice');
  open.type = 'button';
  open.dataset.patientId = entry.patient_id;

  const name = element('span', 'patient-picker__name');
  // `Given Family`. A column of surnames is a column you cannot pick from the moment two
  // patients share one, and it is the reader's only way to tell them apart before opening them.
  name.textContent = entry.header.full_name;
  const detail = element('span', 'patient-picker__detail');
  detail.textContent = `${entry.header.sex} · ${format_number(entry.header.age_years)}`;
  open.append(name, detail);
  // The record id is what the row has no width for, and it is already the first column of
  // every panel's table view. It stays reachable here without being printed.
  open.title = `record ${entry.patient_id}`;
  open.addEventListener('click', () => on_open(entry.patient_id));

  const removal = removal_state?.(entry.patient_id);
  const remove = element('button', 'patient-picker__remove');
  remove.type = 'button';
  if (removal?.state === 'loading') {
    // Removing takes a moment - the record is rebuilt, not patched - so the row says it is
    // happening rather than looking like the click did nothing.
    remove.textContent = '…';
    remove.classList.add('patient-picker__remove--busy');
    remove.disabled = true;
    remove.setAttribute('aria-label', `Removing ${entry.header.full_name}`);
  } else {
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Remove ${entry.header.full_name} from the record`);
    remove.addEventListener('click', () => on_remove(entry.patient_id));
  }
  wrapper.append(open, remove);

  if (removal?.state === 'failed') {
    const failed = element('span', 'patient-picker__failed');
    failed.textContent = removal.label;
    failed.title = removal.title;
    wrapper.append(failed);
  }
  return wrapper;
}

/** The one place that knows which row is the current patient. Updates every list at once. */
export function mark_selected_choice(patient_id) {
  for (const button of document.querySelectorAll('.patient-picker__choice')) {
    button.setAttribute('aria-pressed', String(button.dataset.patientId === patient_id));
  }
}
