import { chart_host, defer_chart } from '../util/chart_mount.js';
import { record_mix_option } from '../util/record_mix_option.js';
import { element } from './panel_card.js';

/**
 * What the record is made of - Block `record-mix`.
 *
 * The height is fixed, because this panel is one of the three whose row count never varies:
 * twelve, whatever the patient. That is what lets the container be sized off it.
 */
export function record_mix_chart(mix_rows, { palette }) {
  const wrapper = element('div', 'panel-card__chart');
  const host = chart_host('record-mix', mix_rows.length * 26 + 74);
  defer_chart(host, (width) => record_mix_option(mix_rows, palette, { width }));
  wrapper.append(host);
  return wrapper;
}
