import { chart_host, defer_chart } from '../util/chart_mount.js';
import { visit_series_option } from '../util/visit_series_option.js';
import { element } from './panel_card.js';

/**
 * Visits over time - Block `visit-series`. The one real time series in the set.
 *
 * Zero-value rows are kept. A check-up that recorded no results and no reports is a visit
 * that happened, and dropping it would shorten the record to look tidier than it is - the
 * bars simply have no height.
 */
export function visit_series(visit_rows, { palette }) {
  const wrapper = element('div', 'panel-card__chart');
  const host = chart_host('visit-series', 300);
  defer_chart(host, () => visit_series_option(visit_rows, palette));
  wrapper.append(host);
  return wrapper;
}
