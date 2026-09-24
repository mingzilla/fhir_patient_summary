import { parse_iso_date, span_days_of } from './date_scale.js';
import {
  aria_option, base_chart_option, count_axis, time_axis, time_axis_tick_format,
  vertical_gradient,
} from './echart_theme.js';
import { tooltip_body } from './tooltip_text.js';

/**
 * The visit series - the only real time series in the set.
 *
 * **A time axis, not an index axis.** The rows arrive date-descending with the resource id as
 * tiebreaker, so two visits on one day are in insertion order and not clinical order. An
 * index axis would space them evenly and present that tiebreaker as a sequence; a time axis
 * spaces them by when they happened, which is the one thing the dates do claim.
 *
 * **Grouped, not stacked.** `Results` and `Reports` are both counts of things recorded at the
 * encounter, but "items at this visit" is not a number this API returns, and a stack would
 * put a total on top of every bar that nothing served. Two bars side by side assert only the
 * two numbers that are on the wire.
 */
export function visit_series_option(visit_rows, palette) {
  const base = base_chart_option(palette);
  const shared = {
    palette,
    axis_label: base.axis_label,
    axis_line: base.axis_line,
    split_line: base.split_line,
    axis_tick: base.axis_tick,
  };
  const rows_newest_first = visit_rows;
  const tick_format = time_axis_tick_format(
    span_days_of(visit_rows.map((row) => parse_iso_date(row.date_on))),
  );

  return {
    backgroundColor: 'transparent',
    textStyle: base.textStyle,
    aria: aria_option(
      `${visit_rows.length} recorded visits on a time axis. Two bars at each visit give the `
      + 'number of results and the number of reports recorded at it; a small tick on the '
      + 'baseline marks a visit that recorded neither. The rows are listed in the table below.',
    ),
    grid: { left: 44, right: 16, top: 34, bottom: 42, containLabel: false },
    legend: {
      top: 0,
      right: 0,
      itemWidth: 10,
      itemHeight: 10,
      icon: 'roundRect',
      textStyle: { color: palette.text_secondary, fontSize: 12 },
      data: ['Results', 'Reports'],
    },
    tooltip: {
      ...base.tooltip,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const row = rows_newest_first[params[0].dataIndex];
        return tooltip_body(row.date_on, [
          ['Visit', row.visit_name],
          ['Results', row.result_count],
          ['Reports', row.report_count],
          ['New problem', row.new_problem_text],
          ['Source', row.source_id],
        ]);
      },
    },
    xAxis: {
      ...time_axis(),
      axisLabel: { ...shared.axis_label, formatter: tick_format, hideOverlap: true },
      axisLine: shared.axis_line,
      splitLine: { show: false },
    },
    yAxis: {
      ...count_axis(),
      name: 'items recorded',
      nameTextStyle: { color: palette.text_muted, fontSize: 11, align: 'left' },
      nameGap: 12,
      axisLabel: shared.axis_label,
      splitLine: shared.split_line,
    },
    series: [
      visit_tick_series(visit_rows, palette),
      bar_series('Results', visit_rows, (row) => row.result_count, palette.series_1, palette),
      bar_series('Reports', visit_rows, (row) => row.report_count, palette.series_2, palette),
    ],
  };
}

/**
 * Every visit, marked on the baseline.
 *
 * Without this a visit that recorded nothing draws nothing, and patient 1643's record hides
 * its own first event: the 1965 encounter is the `First seen` date in the header and has no
 * bar at all, so forty years of the axis look empty and the chart looks broken rather than
 * sparse. These ticks put the visits on the axis and leave the bars to say how much was
 * recorded. They carry no value and are not in the legend - the standfirst names them.
 */
function visit_tick_series(visit_rows, palette) {
  return {
    name: 'visit',
    type: 'scatter',
    symbol: 'rect',
    symbolSize: [5, 8],
    itemStyle: { color: palette.series_muted },
    z: 1,
    data: visit_rows.map((row) => [parse_iso_date(row.date_on), 0]),
    tooltip: { show: false },
  };
}

function bar_series(name, rows, pick, color, palette) {
  return {
    name,
    type: 'bar',
    // An explicit width, because on a time axis ECharts cannot infer one from the spacing of
    // the dates: a record of twenty visits across six years otherwise draws as hairlines.
    barWidth: 5,
    barGap: '30%',
    // A gradient inside one hue is a depth cue, not an encoding: both stops are the same
    // colour, so the bar carries exactly what a flat one would.
    itemStyle: {
      color: vertical_gradient(color, 1, 0.42),
      borderRadius: [3, 3, 0, 0],
      borderWidth: 0,
    },
    // The two series draw left to right together, so the record fills in the way it was lived.
    animationDelay: (data_index) => data_index * 18,
    data: rows.map((row) => [parse_iso_date(row.date_on), pick(row)]),
  };
}
