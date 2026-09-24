import { format_years, parse_iso_date, span_days_of } from './date_scale.js';
import {
  aria_option, base_chart_option, category_axis, horizontal_gradient, time_axis,
  time_axis_tick_format, y_label_width,
} from './echart_theme.js';
import { tooltip_body } from './tooltip_text.js';

/**
 * The problem list as a timeline: one bar per problem, from `Onset` to the day it resolved.
 *
 * **The bars are drawn from dates, never from `Years`.** `Years` counts year boundaries
 * crossed rather than complete years elapsed, so a span of three years and 364 days reads as
 * 4 - the report says plainly that the column is approximate and for reading, not for
 * arithmetic. Sizing a bar with it would turn a rounding into a length. The exact end of a
 * problem is inside the `Outcome` sentence (`resolved YYYY-MM-DD`), and an ongoing problem
 * ends at `As of`, which is a served date too.
 *
 * `Years` is still printed beside the bar, as the report's own reading of duration - a served
 * number shown as text, which is a different thing from using it as a measurement.
 *
 * **A custom series, because a bar series cannot span two dates.** `encode: {x: [0, 1]}` on a
 * `bar` looks like it should, and it renders: the bars come out anchored to the left edge of
 * the grid and their length encodes the onset alone, so the chart is wrong in a way that
 * still looks like a chart. A `custom` series draws each bar between two `api.coord` points,
 * which is the only form where the left end is the onset by construction.
 *
 * **Emphasis, not two equal series.** A problem that is still active is the one a clinician
 * needs to see, so ongoing bars take the accent hue and resolved ones a de-emphasis grey.
 * The legend names both, so the colour is never the only channel.
 *
 * A `Pair` is co-recording on the same day and never cause and consequence, so it appears in
 * the tooltip as a note on the row and is never drawn as a link between two bars.
 */
const BAR_THICKNESS_MAX = 16;
const BAR_THICKNESS_RATIO = 0.46;

export function problem_timeline_option(problem_rows, palette, as_of_date, layout = {}) {
  const base = base_chart_option(palette);
  const names = problem_rows.map((row) => row.problem_name);
  const label_width = y_label_width(layout.width ?? 1200);

  const starts = problem_rows.map((row) => parse_iso_date(row.onset_on));
  const ends = problem_rows.map((row, index) =>
    (row.is_ongoing ? as_of_date : parse_iso_date(row.resolved_on) ?? as_of_date));
  const tick_format = time_axis_tick_format(span_days_of([...starts, ...ends, as_of_date]));

  const spans = problem_rows.map((row, index) => ({
    // A bar whose two ends are the same calendar day would have no length at all, so it
    // keeps a day's width. Patient 12069's allergic reaction resolved the day it began.
    value: [starts[index].getTime(),
            Math.max(ends[index].getTime(), starts[index].getTime() + 86400000), index],
    row,
    color: row.is_ongoing ? palette.series_1 : palette.series_muted,
  }));

  return {
    backgroundColor: 'transparent',
    textStyle: base.textStyle,
    aria: aria_option(
      `Timeline of ${problem_rows.length} recorded problems. Each bar runs from a problem's `
      + 'onset to the day it resolved, or to the last recorded event where it is ongoing. '
      + 'Ongoing problems are drawn in the accent colour, resolved ones in grey. The rows '
      + 'are listed in the table below.',
    ),
    grid: { left: label_width + 10, right: 100, top: 34, bottom: 40, containLabel: false },
    tooltip: {
      ...base.tooltip,
      trigger: 'item',
      formatter: (params) => {
        const row = spans[params.dataIndex].row;
        return tooltip_body(row.problem_name, [
          ['Onset', row.onset_on],
          ['Outcome', row.outcome_text],
          ['Years', format_years(row.years_counted)],
          ['Status', row.status_text],
          ['Recorded the same day as', row.paired_problem],
          ['Source', row.source_id],
        ]);
      },
    },
    xAxis: {
      ...time_axis(),
      axisLabel: { ...base.axis_label, formatter: tick_format, hideOverlap: true },
      axisLine: base.axis_line,
      splitLine: base.split_line,
    },
    yAxis: {
      ...category_axis(names, { inverse: true }),
      axisLabel: { ...base.axis_label, width: label_width, overflow: 'truncate' },
      splitLine: { show: false },
    },
    series: [{
      type: 'custom',
      encode: { x: [0, 1], y: 2 },
      data: spans,
      renderItem: (params, api) => render_problem_bar(params, api, spans, palette),
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { color: palette.baseline, width: 1, type: 'solid' },
        label: {
          color: palette.text_muted,
          fontSize: 11,
          rotate: 0,
          // The line spans the grid vertically and ECharts generates it top-to-bottom, so
          // 'start' is the end a reader reads first. 'end' put the word on the axis line,
          // where it collided with the year tick under it.
          position: 'start',
          distance: 8,
          formatter: 'as of',
        },
        data: [{ xAxis: as_of_date.getTime() }],
      },
    }],
  };
}

/**
 * One bar, plus its duration in the reading the report uses. The bar's ends come from
 * `api.coord` on the two dates; the label comes from the row, so the text and the geometry
 * are never the same number.
 */
function render_problem_bar(params, api, spans, palette) {
  const span = spans[params.dataIndex];
  const category_index = api.value(2);
  const start = api.coord([api.value(0), category_index]);
  const end = api.coord([api.value(1), category_index]);
  const thickness = Math.min(api.size([0, 1])[1] * BAR_THICKNESS_RATIO, BAR_THICKNESS_MAX);
  // Three pixels, so a problem that lasted days is still a mark rather than nothing. Its
  // length is not to scale at that size and its `Years` label says so beside it.
  const width = Math.max(end[0] - start[0], 3);
  const years = format_years(span.row.years_counted);

  return {
    type: 'group',
    children: [
      {
        type: 'rect',
        shape: {
          x: start[0],
          y: start[1] - thickness / 2,
          width,
          height: thickness,
          r: [0, thickness / 2, thickness / 2, 0],
        },
        style: { fill: horizontal_gradient(span.color, 0.5, 1) },
      },
      {
        type: 'text',
        style: {
          text: years,
          x: start[0] + width + 8,
          y: start[1],
          fill: palette.text_secondary,
          fontSize: 11,
          textVerticalAlign: 'middle',
          textAlign: 'left',
        },
      },
    ],
  };
}
