import { chart_host, defer_chart } from '../util/chart_mount.js';
import { sparkline_option } from '../util/sparkline_option.js';
import { NOT_MEASURED_TEXT, format_number } from '../util/value_text.js';
import { element } from './panel_card.js';

/**
 * The nine key measurements - Block `measure-grid`, one tile per code.
 *
 * The grid keeps all nine tiles whatever the patient, so the panel's shape does not change
 * between a record with a full set and one with three. A code the record does not carry is a
 * tile that says `not measured` in words: *no PSA was ever taken* is a fact about the record,
 * and a tile that simply vanished would read as a report that forgot to look.
 *
 * Both readings are printed beside the sparkline, because the sparkline is scaled to its own
 * two points and its slope therefore is not proportional to the size of the change. The
 * endpoint's `Change` sentence states the direction; the numbers state the size.
 */
export function measure_grid(measure_rows, { palette }) {
  const grid = element('div', 'measure-grid');
  for (const row of measure_rows) {
    grid.append(tile(row, palette));
  }
  return grid;
}

function tile(row, palette) {
  const card = element('div', `measure-tile${row.was_measured ? '' : ' measure-tile--unmeasured'}`);
  card.dataset.code = row.code;

  const head = element('div', 'measure-tile__head');
  const name = element('div', 'measure-tile__name');
  name.textContent = row.measurement_name;
  const code = element('div', 'measure-tile__code');
  code.textContent = row.code;
  head.append(name, code);
  card.append(head);

  const reading = element('div', 'measure-tile__reading');
  if (row.was_measured) {
    reading.textContent = format_number(row.latest_value);
    if (row.unit_text !== '') {
      const unit = element('span', 'measure-tile__reading-unit');
      unit.textContent = row.unit_text;
      reading.append(unit);
    }
  } else {
    reading.textContent = NOT_MEASURED_TEXT;
    reading.classList.add('panel-table__muted');
  }
  card.append(reading);

  // The endpoint's own sentence, verbatim. It names the previous reading and not the unit,
  // and the unit shown belongs to the latest reading - appending it here would put this
  // frontend's guess about the older measurement's unit into a sentence it did not write.
  const change = element('div', 'measure-tile__change');
  change.textContent = row.change_text === ''
    ? (row.was_measured ? 'measured once, so there is nothing to compare' : '')
    : row.change_text;
  card.append(change);

  if (row.was_measured) {
    const host = chart_host('measure-tile__spark', 46);
    defer_chart(host, () => sparkline_option(row, palette));
    card.append(host);
  }

  const why = element('div', 'measure-tile__why');
  why.textContent = row.why_it_matters;
  card.append(why);
  return card;
}
