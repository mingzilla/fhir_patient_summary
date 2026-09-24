import { chart_host, defer_chart } from '../util/chart_mount.js';
import { build_lanes, medication_lane_option } from '../util/medication_lane_option.js';
import { renewal_note } from '../util/panel_note.js';
import { chart_legend } from './chart_legend.js';
import { element } from './panel_card.js';

/**
 * The prescription record as lanes - Block `medication-lanes`.
 *
 * The legend explains the two marker shapes before it explains the hue, because the shape is
 * what separates a first order from a re-order and the hue is only the drug.
 */
export function medication_lanes(medication_rows, { palette }) {
  const wrapper = element('div', 'panel-card__chart');

  wrapper.append(chart_legend([
    { label: 'first order', color: palette.series_1, shape: 'diamond' },
    { label: 're-order, gap shown', color: palette.series_1, shape: 'roundRect' },
  ]));

  const lane_count = build_lanes(medication_rows).length;
  const host = chart_host('medication-lanes', Math.max(140, lane_count * 46 + 74));
  defer_chart(host, (width) => medication_lane_option(medication_rows, palette, { width }));
  wrapper.append(host);

  // The panel prints this footer when no drug repeats; the contract says to derive it
  // rather than expect it on the wire. Patient 12069 is the case that triggers it.
  const note = renewal_note(medication_rows);
  if (note !== '') {
    const line = element('p', 'panel-card__note');
    line.textContent = note;
    wrapper.append(line);
  }
  return wrapper;
}
