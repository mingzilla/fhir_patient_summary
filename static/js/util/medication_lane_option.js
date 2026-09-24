import { parse_iso_date, span_days_of } from './date_scale.js';
import {
  aria_option, base_chart_option, category_axis, horizontal_gradient, time_axis,
  time_axis_tick_format, translucent, y_label_width,
} from './echart_theme.js';
import { tooltip_body } from './tooltip_text.js';

/**
 * The prescription record as one lane per drug - the renewal story.
 *
 * Reading it: a lane with one mark is a drug ordered once. A lane with several marks is a
 * course, and every mark after the first carries the `Gap (days)` the endpoint measured since
 * the previous order of that same drug. Patient 1643 is one lane with nine marks 365 days
 * apart; patient 12069 is three lanes with one mark each.
 *
 * **Within a lane the orders run oldest to newest, left to right.** The endpoint sorts newest
 * first, which is right for a table and wrong for a course - a line drawn through the points
 * has to travel forward in time or it reads backwards.
 *
 * **`Course` is carried by the marker, not by a colour.** A first order is a diamond and a
 * re-order is a circle, so the distinction survives a reader who cannot tell two hues apart,
 * and the legend names both shapes.
 *
 * **The gap labels are hidden where they would collide.** A lane of nine orders inside four
 * years has no room for nine labels; `labelLayout.hideOverlap` drops the ones that do not fit
 * and the tooltip and table view carry every one of them. A number on every mark would be
 * unreadable anyway - the anti-pattern this avoids is not "too many labels" but "a label
 * nobody can read".
 *
 * A `Gap (days)` of null is not zero and is not drawn: it means there was no previous order
 * to measure from. On patient 12069 every gap is null and the panel says so in words.
 */
export function medication_lane_option(medication_rows, palette, layout = {}) {
  const base = base_chart_option(palette);
  const lanes = build_lanes(medication_rows);
  const names = lanes.map((lane) => lane.drug);
  const label_width = y_label_width(layout.width ?? 1200, { wide: 200, narrow: 104 });
  const tick_format = time_axis_tick_format(
    span_days_of(medication_rows.map((row) => parse_iso_date(row.ordered_on))),
  );

  return {
    backgroundColor: 'transparent',
    textStyle: base.textStyle,
    aria: aria_option(
      `Prescription record of ${medication_rows.length} orders across ${lanes.length} drugs, `
      + 'one lane per drug, oldest order to newest. A diamond marks a first order and a '
      + 'circle a re-order, and a re-order is labelled with the gap in days since the '
      + 'previous order of that same drug. The rows are listed in the table below.',
    ),
    grid: { left: label_width + 10, right: 90, top: 34, bottom: 44, containLabel: false },
    tooltip: {
      ...base.tooltip,
      trigger: 'item',
      formatter: (params) => {
        const row = order_of(params, lanes);
        return tooltip_body(row.medication_name, [
          ['Ordered', row.ordered_on],
          ['Course', row.course_text],
          ['Status', row.status_text],
          ['Gap (days)', row.gap_days === null ? 'no previous order' : row.gap_days],
          ['Source', row.source_id],
        ]);
      },
    },
    xAxis: {
      ...time_axis(),
      axisLabel: { ...base.axis_label, formatter: tick_format, hideOverlap: true },
      axisLine: base.axis_line,
      splitLine: { show: false },
    },
    yAxis: {
      ...category_axis(names, { inverse: true }),
      axisLabel: { ...base.axis_label, width: label_width, overflow: 'truncate' },
      splitLine: base.split_line,
    },
    series: lanes.map((lane, lane_index) => ({
      name: lane.drug,
      type: 'line',
      data: lane.orders.map((row) => ({
        value: [parse_iso_date(row.ordered_on), lane_index],
        symbol: row.is_first_order ? 'diamond' : 'circle',
        symbolSize: row.is_first_order ? 10 : 11,
      })),
      // The connector deepens left to right, so a course reads as moving forward from its
      // first order even before the gap labels are read.
      lineStyle: { width: 2.5, color: horizontal_gradient(palette.series_1, 0.28, 1) },
      itemStyle: {
        color: palette.series_1,
        borderColor: palette.surface,
        borderWidth: 2,
        // A small glow, not a large one. Nine orders four years apart are twenty pixels
        // apart, so a wide halo makes them one continuous blur - and the panel's whole job
        // is to be countable.
        shadowBlur: 5,
        shadowColor: translucent(palette.series_1, 0.5),
      },
      symbol: 'circle',
      label: {
        show: true,
        position: 'top',
        distance: 7,
        color: palette.text_secondary,
        fontSize: 11,
        formatter: (params) => gap_label(order_of(params, lanes)),
      },
      labelLayout: { hideOverlap: true },
      emphasis: { focus: 'series' },
    })),
  };
}

/**
 * The row behind a hovered or labelled point, found by lane and index.
 *
 * Reading it off the data item - `params.data.row` - rendered every label as `+undefinedd`
 * while the markers themselves drew correctly, so the row was reachable and its `gap_days`
 * was not. Why is not established: ECharts documents `params.data` as the raw item, and the
 * option dump showed the row still attached. What is established is that the lookup below
 * renders the right gaps, and that it does not depend on what a formatter is handed.
 */
function order_of(params, lanes) {
  return lanes[params.seriesIndex].orders[params.dataIndex];
}

/** Only a re-order has a gap to show; a first order would be labelling an absence. */
function gap_label(row) {
  return row.has_gap ? `+${row.gap_days}d` : '';
}

/**
 * Group the rows by drug, keeping the endpoint's own order for the lanes: the drug whose most
 * recent order is newest sits at the top. No lane is dropped and no lane is merged.
 */
export function build_lanes(medication_rows) {
  const lanes = [];
  const by_drug = new Map();
  for (const row of medication_rows) {
    let lane = by_drug.get(row.medication_name);
    if (lane === undefined) {
      lane = { drug: row.medication_name, orders: [] };
      by_drug.set(row.medication_name, lane);
      lanes.push(lane);
    }
    lane.orders.push(row);
  }
  for (const lane of lanes) {
    lane.orders.sort((left, right) => left.ordered_on.localeCompare(right.ordered_on));
  }
  return lanes;
}
