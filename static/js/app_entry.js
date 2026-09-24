import { allergy_list } from './component/allergy_list.js';
import { measure_grid } from './component/measure_grid.js';
import { medication_lanes } from './component/medication_lanes.js';
import { panel_card } from './component/panel_card.js';
import { PANEL_STANDFIRST } from './component/panel_standfirst.js';
import { patient_figure_strip } from './component/patient_figure_strip.js';
import { build_picker, mark_selected_choice } from './component/patient_picker.js';
import { patient_search } from './component/patient_search.js';
import { problem_timeline } from './component/problem_timeline.js';
import { record_mix_chart } from './component/record_mix_chart.js';
import { site_footer } from './component/site_footer.js';
import { visit_series } from './component/visit_series.js';
import { PANEL_REGISTRY } from './domains/panel_registry.js';
import { dashboard_service } from './service/dashboard_service.js';
import { ui_data_store } from './store/ui_data_store.js';
import { dispose_charts_within, mount_deferred_charts } from './util/chart_mount.js';
import { countdown_text } from './util/countdown_text.js';
import { parse_iso_date } from './util/date_scale.js';
import { read_palette } from './util/echart_theme.js';

/**
 * The page. It owns the picker, the search, the theme, the drawer and the render pass - and
 * nothing else. Every value it shows comes from a store snapshot, and every snapshot came
 * from an endpoint.
 */
const CHART_BUILDER = Object.freeze({
  problems: problem_timeline,
  medications: medication_lanes,
  key_measures: measure_grid,
  allergies: allergy_list,
  visits: visit_series,
  record_mix: record_mix_chart,
});

/**
 * Every panel takes the full width of the pane.
 *
 * Two panels sharing a row was tried and is worse here: it halves the room for a chart whose
 * axis labels are conditions and drug names, and it makes the page's rhythm change halfway
 * down for no reason the reader can see. A panel is one record read one way, so they are all
 * the same shape and the reader learns the shape once.
 */
const PANEL_SPAN = 12;

const THEME_KEY = 'fhir_patient_summary.theme';
const STAGGER_MS = 55;

const picker_box = document.getElementById('picker-rail');
const picker_drawer = document.getElementById('picker-drawer');
const search_boxes = [document.getElementById('search-rail'),
                      document.getElementById('search-drawer')];
const drawer = document.getElementById('drawer');
const drawer_scrim = document.getElementById('drawer-scrim');
const drawer_open = document.getElementById('drawer-open');
const drawer_foot = document.getElementById('drawer-foot');
const strip_host = document.getElementById('figure-strip-host');
const panel_pane = document.getElementById('panel-pane');

/** Filled once the roster arrives; every list and the search read from it. */
let roster = [];
/** A search box sits above the column and above the drawer's list; both stay in step. */
const searches = [];
/** Per patient: a removal in flight, or one that failed. Survives the redraw it triggers. */
const removal_state = new Map();

/**
 * The patients being fetched into the record right now, by id.
 *
 * `/load` takes fifteen to twenty seconds and the row cannot be drawn before it answers - the
 * patient is not in the record until then. So this is what the list shows in the meantime.
 */
const pending_adds = new Map();
let pending_ticker = 0;

/* ------------------------------------------------------------------- the theme */

/**
 * `null` means the reader has not chosen, so the operating system decides - which is what the
 * stylesheet's media query already does, and why the attribute is removed rather than set.
 */
export function apply_theme(theme) {
  if (theme === null) {
    document.documentElement.removeAttribute('data-theme');
    return;
  }
  document.documentElement.dataset.theme = theme;
}

export function theme_in_use() {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === 'light' || chosen === 'dark') {
    return chosen;
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function stored_theme() {
  try {
    const value = window.localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    // A browser with storage disabled still gets a themed page; it just will not remember.
    return null;
  }
}

function remember_theme(theme) {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* nothing to do - the theme holds for this page either way */
  }
}

/** Every toggle on the page, because the column and the drawer each carry one. */
function mark_theme_toggles() {
  const next = theme_in_use() === 'dark' ? 'light' : 'dark';
  for (const button of document.querySelectorAll('.theme-toggle')) {
    button.textContent = next === 'light' ? 'Light mode' : 'Dark mode';
    button.setAttribute('aria-label', `Switch to ${next} mode`);
  }
}

function toggle_theme() {
  const next = theme_in_use() === 'dark' ? 'light' : 'dark';
  apply_theme(next);
  remember_theme(next);
  mark_theme_toggles();
  // The charts read their colours out of the stylesheet, so a theme change is a re-render.
  render_dashboard();
}

/* ------------------------------------------------------------------ the drawer */

function set_drawer(open) {
  drawer.dataset.open = String(open);
  drawer_scrim.dataset.open = String(open);
  drawer.setAttribute('aria-hidden', String(!open));
  drawer_open.setAttribute('aria-expanded', String(open));
}

/* --------------------------------------------------------------- the patients */

/** The roster entries currently on the left, in the order they were added. */
function listed_patients() {
  const by_id = new Map(roster.map((entry) => [entry.patient_id, entry]));
  return ui_data_store.working_set.map((id) => by_id.get(id)).filter((entry) => entry !== undefined);
}

/**
 * The placeholder rows, with how long each has been waiting.
 *
 * The elapsed time is read here and handed to a pure function rather than read inside the
 * component, so the text a reader sees is decided in one testable place.
 */
function pending_rows() {
  const now = Date.now();
  return [...pending_adds].map(([patient_id, entry]) => ({
    patient_id,
    full_name: entry.full_name,
    elapsed_seconds: (now - entry.started_at) / 1000,
  }));
}

/**
 * Redraw once, then tick only the countdown text.
 *
 * Redrawing the whole list every second would throw away every row's hover and focus state for
 * a number changing in one of them, so the ticker writes into the placeholder it finds and
 * touches nothing else.
 */
function start_pending_ticker() {
  if (pending_ticker !== 0) {
    return;
  }
  pending_ticker = window.setInterval(() => {
    if (pending_adds.size === 0) {
      window.clearInterval(pending_ticker);
      pending_ticker = 0;
      return;
    }
    const now = Date.now();
    for (const [patient_id, entry] of pending_adds) {
      const text = countdown_text((now - entry.started_at) / 1000);
      for (const node of document.querySelectorAll(
        `[data-pending-id="${patient_id}"] .patient-picker__countdown`)) {
        node.textContent = text;
      }
    }
  }, 1000);
}

function draw_lists() {
  const listed = listed_patients();
  const handlers = {
    on_open: open_patient,
    on_remove: remove_patient,
    removal_state: (id) => removal_state.get(id),
    pending: pending_rows(),
  };
  // Both lists are redrawn together rather than patched: seven rows is not worth an
  // incremental update, and a full redraw cannot leave the two disagreeing.
  build_picker(picker_box, listed, handlers);
  build_picker(picker_drawer, listed, handlers);
  mark_selected_choice(ui_data_store.selected_patient_id);
  // The results carry a tick for a patient already listed, so they go stale when the list
  // changes underneath them.
  for (const search of searches) {
    search.refresh();
  }
}

/** Is this patient one the dashboard can draw? The record is the list the API served. */
function in_record(patient_id) {
  return roster.some((entry) => entry.patient_id === patient_id);
}

/**
 * Put a search candidate on the list.
 *
 * Two cases that look the same on screen and are nothing alike underneath. A patient already
 * in the record, whom the reader took off the list with the `×`, is put back by bookkeeping
 * and returns at once. A patient only the FHIR server knows about has to be fetched into the
 * record first, which is fifteen to twenty seconds, and that is what the in-flight `+` on the
 * row is for.
 *
 * The patient is added, not opened. Adding someone to compare against is not switching to
 * them, and a list that jumps to whatever was just added is a list that moves under the
 * reader's hand.
 */
async function add_candidate_to_list(patient_id, full_name) {
  if (in_record(patient_id)) {
    ui_data_store.add_to_working_set(patient_id);
    return { ok: true };
  }

  pending_adds.set(patient_id, { full_name, started_at: Date.now() });
  draw_lists();
  start_pending_ticker();

  const result = await dashboard_service.add_to_record(patient_id);

  pending_adds.delete(patient_id);
  if (!result.ok) {
    // The placeholder goes with the failure: leaving it would say a patient is still coming
    // when nothing is.
    draw_lists();
    return result;
  }
  // The service extended its own copy of the record; take the new one so `in_record` and the
  // list agree about who exists, then put the patient on the list.
  roster = await dashboard_service.load_roster();
  ui_data_store.add_to_working_set(patient_id);
  return { ok: true };
}

/** Open a patient: add if absent, then load and select. */
async function open_patient(patient_id) {
  ui_data_store.add_to_working_set(patient_id);
  set_drawer(false);
  await choose_patient(patient_id);
}

/**
 * Take a patient off the list, out of the record.
 *
 * The row leaves only once the server has agreed. Dropping it first and telling the server
 * afterwards would be quicker and would be wrong: the record would still hold the patient, and
 * the next page load would put the row back - which is exactly the confusion this replaces.
 *
 * Removing is reversible. The patient is still on the FHIR server, and `+` fetches them back.
 */
async function remove_patient(patient_id) {
  removal_state.set(patient_id, { state: 'loading' });
  draw_lists();

  const result = await dashboard_service.remove_from_record(patient_id);
  if (!result.ok) {
    removal_state.set(patient_id, {
      state: 'failed',
      label: result.status === 0 ? 'unreachable' : `failed (HTTP ${result.status})`,
      title: result.detail,
    });
    draw_lists();
    return;
  }

  removal_state.delete(patient_id);
  // The store drops the cached panels with the key - the patient is gone from the record, so
  // keeping their rows would be keeping data the dashboard no longer holds.
  ui_data_store.drop_patient(patient_id);

  const next = ui_data_store.selected_patient_id;
  if (next === null) {
    show_empty_state();
    return;
  }
  // The store already moved the selection; loading it is what puts it on screen.
  choose_patient(next);
}

/* -------------------------------------------------------------------- the page */

async function start() {
  apply_theme(stored_theme());
  mark_theme_toggles();

  document.addEventListener('click', (event) => {
    if (event.target.closest('.theme-toggle') !== null) {
      toggle_theme();
    }
  });
  drawer_open.addEventListener('click', () => set_drawer(true));
  drawer_scrim.addEventListener('click', () => set_drawer(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      set_drawer(false);
    }
  });

  roster = await dashboard_service.load_roster();
  if (roster.length === 0) {
    show_error('No patient in the record answered. Is the dashboard API running?');
    return;
  }

  // The list starts as the whole record. It is a working set, so it can be cut down and
  // built back up, but a page that opens with nothing on it shows nothing.
  ui_data_store.seed_working_set(roster.map((entry) => entry.patient_id));

  for (const box of search_boxes) {
    const search = patient_search({
      in_record,
      in_working_set: (id) => ui_data_store.in_working_set(id),
      on_search: (query) => dashboard_service.search_candidates(query),
      on_add: add_candidate_to_list,
      on_open: open_patient,
    });
    box.append(search.element);
    searches.push(search);
  }

  drawer_foot.append(site_footer());

  ui_data_store.subscribe(() => {
    draw_lists();
    render_dashboard();
  });

  const requested = new URLSearchParams(window.location.search).get('patient');
  const wanted = roster.some((entry) => entry.patient_id === requested)
    ? requested
    : roster[0].patient_id;
  await choose_patient(wanted);
}

async function choose_patient(patient_id) {
  if (patient_id === null) {
    show_empty_state();
    return;
  }
  // Hold the previous render at reduced opacity rather than flashing a skeleton: the layout
  // does not jump, and a failed load leaves the last good record readable.
  panel_pane.classList.add('panel-pane--refreshing');
  const result = await dashboard_service.select_patient(patient_id);
  panel_pane.classList.remove('panel-pane--refreshing');

  if (!result.ok) {
    show_error(`Patient ${patient_id} could not be loaded (HTTP ${result.status}): ${result.detail}`);
    return;
  }
  window.history.replaceState(null, '', `?patient=${patient_id}`);
}

function render_dashboard() {
  const patient_id = ui_data_store.selected_patient_id;
  const snapshot = patient_id === null ? null : ui_data_store.snapshot(patient_id);
  if (snapshot === null || snapshot.patient === undefined) {
    strip_host.replaceChildren();
    show_empty_state();
    return;
  }
  const header = snapshot.patient[0];
  const palette = read_palette();
  const context = { palette, header, as_of_date: parse_iso_date(header.as_of) };

  // Charts hold their container and a ResizeObserver; dropping the old subtree without
  // disposing would leave one of each alive per patient switch.
  dispose_charts_within(panel_pane);

  strip_host.replaceChildren(patient_figure_strip(header));

  const stack = document.createElement('div');
  stack.className = 'panel-pane__stack';
  let order = 0;

  for (const panel of PANEL_REGISTRY) {
    if (panel.key === 'patient') {
      continue;
    }
    const rows = snapshot[panel.key] ?? null;
    const builder = CHART_BUILDER[panel.key];
    const card = panel_card({
      panel,
      rows,
      span: PANEL_SPAN,
      standfirst: PANEL_STANDFIRST[panel.key] ?? '',
      build_chart: builder === undefined ? null : (panel_rows) => builder(panel_rows, context),
    });
    // The entry stagger runs down the page in reading order, so the eye is led rather than
    // shown a wall that appeared at once.
    card.style.setProperty('--panel-delay', `${order * STAGGER_MS}ms`);
    order += 1;
    stack.append(card);
  }

  panel_pane.replaceChildren(stack);

  // Charts are measured, so they are built once their containers are in the document.
  mount_deferred_charts(stack);
}

/** No patient on the left is not an error - it is a list the reader emptied. */
function show_empty_state() {
  dispose_charts_within(panel_pane);
  const block = document.createElement('p');
  block.className = 'panel-pane__empty';
  block.textContent = 'No patient is open. Add one from the list on the left.';
  panel_pane.replaceChildren(block);
}

function show_error(message) {
  const block = document.createElement('p');
  block.className = 'page-frame__error';
  block.textContent = message;
  panel_pane.prepend(block);
}

start();
