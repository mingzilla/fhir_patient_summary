import { format_day } from '../util/date_scale.js';
import { element } from './panel_card.js';

/**
 * The search field above the patient list - Block `patient-search`.
 *
 * **The results are an overlay.** Inserted in flow they pushed the list down the moment a
 * letter was typed, so the list a reader was reaching for moved as they searched for it in the
 * list. The field anchors, the results float, and the list stays where it was.
 *
 * **The results come from the server, and they are not patients in the record.** `/search`
 * asks the FHIR server; the record is the database. A candidate is not openable until `/load`
 * has put them there, which is why a result carries a `+` rather than being a link. The `+`
 * takes fifteen to twenty seconds, so the page stays usable and the row is appended when it
 * lands - a slow add must not make the page look broken.
 *
 * **Four outcomes that must not collapse into one.** *Nothing has been searched* is not *nobody
 * matched*, which is a finding about the record; *the search did not run* is not a statement
 * about the record at all; and *this patient is not on the server* is a finding about one
 * candidate. The state below is what keeps them apart - an earlier version rendered the
 * "nobody matched" message whenever it had no rows, which put that sentence under an empty
 * field on every page load.
 *
 * Returns `refresh` so the page can redraw when the record changes underneath.
 */
const MINIMUM_QUERY = 3;
const DEBOUNCE_MS = 250;

export function patient_search({ in_record, in_working_set, on_search, on_add, on_open }) {
  const wrap = element('div', 'patient-search');

  const input = element('input', 'patient-search__input');
  input.type = 'search';
  input.placeholder = 'Find a patient';
  input.setAttribute('aria-label', 'Find a patient to add to the list');
  input.setAttribute('aria-expanded', 'false');
  input.autocomplete = 'off';
  input.spellcheck = false;
  wrap.append(input);

  const results = element('ul', 'patient-search__results');
  results.hidden = true;
  wrap.append(results);

  /**
   * Put the overlay under the field, and let it be as tall as the room there is.
   *
   * It is `fixed` rather than `absolute` so the rail's scroll container cannot clip it, which
   * means its position is the field's rectangle in the viewport and has to be recomputed when
   * that moves - hence the scroll and resize listeners. `capture` on the scroll, because the
   * rail scrolls rather than the window and a scroll event there does not bubble.
   */
  function place() {
    const field = input.getBoundingClientRect();
    results.style.left = `${field.left}px`;
    // As wide as the widest name needs, and never narrower than the field.
    //
    // The overlay is `fixed`, so it is not confined to the rail the field sits in - which is
    // the whole reason it can do this. Matching the field's width instead left `Adolfo Mar...`
    // and `Bonnie M...`, and shortening a patient's name to remove a scrollbar is trading the
    // thing the reader needs for the thing they asked not to see.
    results.style.minWidth = `${field.width}px`;
    results.style.width = 'max-content';
    results.style.maxWidth = `${Math.max(field.width, window.innerWidth - field.left - 12)}px`;
    results.style.top = `${field.bottom + 6}px`;
    // The room below the field, less a margin. Capped rather than fixed: a dropdown that
    // scrolls when it did not need to is what this replaces, and one that runs off the bottom
    // of the window is worse still.
    results.style.maxHeight = `${Math.max(120, window.innerHeight - field.bottom - 20)}px`;
  }

  /** What the dropdown is showing, and why. `idle` is closed, and is where it starts. */
  let state = { kind: 'idle' };
  let active = -1;
  /** Per candidate: what is happening to it, and what went wrong if something did. */
  const row_state = new Map();
  let timer = 0;
  /** Answers arrive out of order when a reader types quickly; only the newest may draw. */
  let sequence = 0;

  const shown_candidates = () => (state.kind === 'done' ? state.candidates : []);

  function close() {
    results.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
  }

  function message(text) {
    const line = element('li', 'patient-search__message');
    line.textContent = text;
    results.replaceChildren(line);
    open_results();
  }

  function open_results() {
    place();
    results.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  async function search_now() {
    const query = input.value.trim();
    const mine = ++sequence;

    if (query === '') {
      state = { kind: 'idle' };
      draw();
      return;
    }
    if (query.length < MINIMUM_QUERY) {
      // A short query is not asked, because the server would not keep the answer. Saying so is
      // better than going quiet: an empty dropdown under a typed letter looks like a search
      // that ran and found nothing.
      state = { kind: 'short' };
      draw();
      return;
    }

    state = { kind: 'searching' };
    draw();

    const response = await on_search(query);
    if (mine !== sequence) {
      return;
    }
    state = response.ok
      ? { kind: 'done', candidates: response.candidates }
      : { kind: 'failed', status: response.status };
    draw();
  }

  function draw() {
    active = -1;
    results.replaceChildren();

    if (state.kind === 'idle') {
      close();
      return;
    }
    if (state.kind === 'short') {
      message(`Keep typing - the search needs ${MINIMUM_QUERY} characters or more.`);
      return;
    }
    if (state.kind === 'searching') {
      message('Searching…');
      return;
    }
    if (state.kind === 'failed') {
      // Not "nobody matched". The search did not run, and saying otherwise would be a claim
      // about the record that nothing supports.
      message(state.status === 503
        ? 'The search could not run. The record server is unavailable.'
        : `The search could not run (HTTP ${state.status}).`);
      return;
    }
    if (state.candidates.length === 0) {
      message('No patient on the server matches that.');
      return;
    }

    open_results();
    state.candidates.forEach((candidate, index) => results.append(result_row(candidate, index)));
  }

  function result_row(candidate, index) {
    const row = element('li', 'patient-search__row');
    const id = candidate.candidate_id;

    const open = element('button', 'patient-search__open');
    open.type = 'button';
    open.id = `patient-search-open-${index}`;

    const name = element('span', 'patient-search__name');
    // `Given Family`, as the server wrote it. The record writes the family name alone; these
    // are two names for one person and neither is a shortened form of the other.
    name.textContent = candidate.display_name;
    const detail = element('span', 'patient-search__detail');
    detail.textContent = [candidate.gender, format_day(candidate.birth_date)]
      .filter((part) => part !== null && part !== '').join(' · ');
    open.append(name, detail);

    const row_progress = row_state.get(id);
    // Two different questions, and the row answers them differently. **In the record** is
    // whether the dashboard can draw this patient at all - a candidate it cannot draw is not
    // openable, because clicking one would land on a 404. **On the list** is whether they are
    // on the left right now, which a reader can undo with the `×`.
    open.disabled = !in_record(id);
    open.addEventListener('click', () => {
      if (in_record(id)) {
        close();
        on_open(id);
      }
    });
    row.append(open);

    if (row_progress?.state === 'failed') {
      const failed = element('span', 'patient-search__failed');
      failed.textContent = row_progress.label;
      failed.title = row_progress.title;
      row.append(failed);
    }
    row.append(add_button(candidate, row_progress));
    return row;
  }

  function add_button(candidate, progress) {
    const id = candidate.candidate_id;
    const add = element('button', 'patient-search__add');
    add.type = 'button';

    if (in_working_set(id)) {
      add.classList.add('patient-search__add--done');
      add.textContent = '✓';
      add.disabled = true;
      add.setAttribute('aria-label', `${candidate.display_name} is already in the list`);
      return add;
    }
    if (progress?.state === 'loading') {
      add.classList.add('patient-search__add--busy');
      add.textContent = '…';
      add.disabled = true;
      add.setAttribute('aria-label', `Adding ${candidate.display_name}`);
      return add;
    }

    add.textContent = progress?.state === 'failed' ? '↻' : '+';
    add.setAttribute('aria-label', progress?.state === 'failed'
      ? `Try adding ${candidate.display_name} again`
      : `Add ${candidate.display_name} to the list`);
    add.addEventListener('click', () => add_candidate(candidate, add));
    return add;
  }

  async function add_candidate(candidate, button) {
    const id = candidate.candidate_id;
    row_state.set(id, { state: 'loading' });
    button.className = 'patient-search__add patient-search__add--busy';
    button.textContent = '…';
    button.disabled = true;

    // The display name goes with the id: the list needs something to put in the placeholder
    // row while this is in flight, and the candidate is the only thing that knows it.
    const response = await on_add(id, candidate.display_name);
    if (response.ok) {
      row_state.delete(id);
      // The record changed, so every row's tick is now possibly stale - redraw rather than
      // patch the one that moved. `draw` is safe here because the state says `done`.
      draw();
      return;
    }
    // A patient the server does not have is not worth retrying; an ask that did not get
    // through is. The two failures get different words and different buttons.
    row_state.set(id, { state: 'failed', ...failure_text(response.status) });
    draw();
  }

  function mark_active() {
    const rows = [...results.querySelectorAll('.patient-search__row')];
    rows.forEach((row, index) => {
      row.dataset.active = String(index === active);
    });
    if (active >= 0 && rows[active] !== undefined) {
      const first = rows[active].querySelector('button');
      input.setAttribute('aria-activedescendant', first.id);
      rows[active].scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  function on_key(event) {
    if (event.key === 'Escape') {
      close();
      input.blur();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const candidates = shown_candidates();
      if (results.hidden || candidates.length === 0) {
        return;
      }
      event.preventDefault();
      const last = candidates.length - 1;
      if (event.key === 'ArrowDown') {
        // Down from nothing is the first row, and down from the last wraps to the first.
        active = active >= last ? 0 : active + 1;
      } else {
        active = active <= 0 ? last : active - 1;
      }
      mark_active();
      return;
    }
    if (event.key === 'Enter' && !results.hidden && active >= 0) {
      const candidate = shown_candidates()[active];
      if (candidate !== undefined && in_record(candidate.candidate_id)) {
        event.preventDefault();
        close();
        on_open(candidate.candidate_id);
      }
    }
  }

  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(search_now, DEBOUNCE_MS);
  });
  input.addEventListener('keydown', on_key);

  // The overlay is placed from the field's rectangle, so anything that moves the field has to
  // move the overlay with it. `capture` on the scroll because the rail scrolls rather than the
  // window, and a scroll inside it does not reach a listener on the window.
  const replace_if_open = () => {
    if (!results.hidden) {
      place();
    }
  };
  window.addEventListener('scroll', replace_if_open, { capture: true, passive: true });
  window.addEventListener('resize', replace_if_open);

  // A dropdown that only closes on Escape is a dropdown that stays open while the reader
  // works somewhere else on the page.
  //
  // `isConnected` is not a formality. Acting on a click redraws the results, and the redraw
  // detaches the element that was clicked - then this listener runs on the same event and
  // finds a target that is inside nothing, so it closes the dropdown the reader just used.
  // Pressing `+` on two patients in a row was impossible for that reason.
  document.addEventListener('click', (event) => {
    if (event.target.isConnected && !wrap.contains(event.target)) {
      close();
    }
  });

  return { element: wrap, refresh: draw };
}

/**
 * What to say when an add does not work, per failure.
 *
 * Four different problems wearing the same shape, and the wrong word sends the reader
 * somewhere useless. `405` in particular is not about the patient at all - it is this server
 * not having the route, which happens when the app was started before the route existed - so
 * it says so rather than blaming the record or the network.
 */
function failure_text(status) {
  if (status === 404) {
    return { label: 'not on the server', title: 'The record server does not have this patient.' };
  }
  if (status === 405) {
    return { label: 'add not available',
             title: 'This dashboard server has no /load route. Restart it to pick up the current app.' };
  }
  if (status === 503) {
    return { label: 'server unavailable',
             title: 'The record server did not answer. Worth trying again.' };
  }
  if (status === 0) {
    return { label: 'unreachable', title: 'The dashboard API could not be reached.' };
  }
  return { label: `failed (HTTP ${status})`, title: `The add failed with HTTP ${status}.` };
}
