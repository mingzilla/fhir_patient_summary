import { chart_host, defer_chart } from '../util/chart_mount.js';
import { problem_timeline_option } from '../util/problem_timeline_option.js';
import { chart_legend } from './chart_legend.js';
import { element } from './panel_card.js';

/**
 * The problem list as a timeline - Block `problem-timeline` inside the panel card.
 *
 * The height grows with the row count, because the axis band and the bars both do. A fixed
 * height would put a nested scrollbar inside the card and clip the earliest onset.
 */
export function problem_timeline(problem_rows, { palette, as_of_date }) {
  const wrapper = element('div', 'panel-card__chart');
  wrapper.append(chart_legend([
    { label: 'ongoing', color: palette.series_1 },
    { label: 'resolved', color: palette.series_muted },
  ]));

  const host = chart_host('problem-timeline', Math.max(140, problem_rows.length * 30 + 74));
  defer_chart(host, (width) =>
    problem_timeline_option(problem_rows, palette, as_of_date, { width }));
  wrapper.append(host);
  return wrapper;
}
