import {
  aria_option, base_chart_option, category_axis, count_axis, horizontal_gradient,
  y_label_width,
} from './echart_theme.js';
import { format_count } from './value_text.js';
import { tooltip_body } from './tooltip_text.js';

/**
 * What the record is made of: twelve resource types, each bar the row count the endpoint
 * served.
 *
 * Horizontal, because the categories are table names - `explanation_of_benefit` is 23
 * characters and would be unreadable on a vertical axis.
 *
 * **Three series rather than one, and identical in effect.** A resource type belongs to
 * exactly one class, so exactly one series has a value at each category and the stack never
 * sums anything: each bar is one served number. Drawing it this way is what gives the legend
 * three real entries instead of three colours a reader has to decode from the bars.
 *
 * **No total anywhere.** The three classes are not totalled and no segment is labelled with
 * one, because a per-class total is not an endpoint. The one number that does appear here
 * from outside is `Clinical events` in the standfirst, which the patient endpoint serves and
 * which the contract's first invariant fixes as the sum of these clinical rows.
 */
const CLASS_COLOR_SLOT = Object.freeze({
  clinical: 0,
  billing: 1,
  'not read': 2,
});

const CLASS_LABEL = Object.freeze({
  clinical: 'clinical',
  billing: 'billing',
  'not read': 'not read',
});

/** In `Rows` order the endpoint already sorted, so the longest bar is at the top. */
const CLASS_ORDER = Object.freeze(['clinical', 'billing', 'not read']);

export function record_mix_option(mix_rows, palette, layout = {}) {
  const base = base_chart_option(palette);
  const names = mix_rows.map((row) => row.resource_name);
  const class_of = new Map(mix_rows.map((row) => [row.resource_name, row.class_text]));
  const label_width = y_label_width(layout.width ?? 1200, { wide: 168, narrow: 104 });

  return {
    backgroundColor: 'transparent',
    textStyle: base.textStyle,
    aria: aria_option(
      `The ${mix_rows.length} resource types this record holds, with the number of rows each `
      + 'one has, coloured by class: clinical, billing, or not read. No class is totalled. '
      + 'The rows are listed in the table below.',
    ),
    // `left` clears the longest table name the record holds - `explanation_of_benefit` - so
    // no label is truncated. A shortened resource name is a different name. On a narrow card
    // that name cannot be afforded and the labels truncate instead of the plot disappearing.
    grid: { left: label_width + 8, right: 54, top: 30, bottom: 30, containLabel: false },
    legend: {
      top: 0,
      left: 0,
      itemWidth: 10,
      itemHeight: 10,
      icon: 'roundRect',
      textStyle: { color: palette.text_secondary, fontSize: 12 },
      data: CLASS_ORDER.map((class_name) => CLASS_LABEL[class_name]),
    },
    tooltip: {
      ...base.tooltip,
      trigger: 'item',
      formatter: (params) =>
        tooltip_body(params.name, [
          ['Rows', format_count(params.value)],
          ['Class', CLASS_LABEL[class_of.get(params.name)] ?? class_of.get(params.name)],
        ]),
    },
    xAxis: {
      ...count_axis(),
      axisLabel: { ...base.axis_label, formatter: (value) => format_count(value) },
      splitLine: base.split_line,
    },
    yAxis: {
      ...category_axis(names, { inverse: true }),
      axisLabel: { ...base.axis_label, width: label_width, overflow: 'truncate' },
    },
    series: CLASS_ORDER.map((class_name) => stacked_class_series(
      class_name, mix_rows, class_of, palette,
    )),
  };
}

function stacked_class_series(class_name, mix_rows, class_of, palette) {
  const color = palette.series[CLASS_COLOR_SLOT[class_name]];
  return {
    name: CLASS_LABEL[class_name],
    type: 'bar',
    stack: 'record_mix',
    barMaxWidth: 18,
    itemStyle: {
      color: horizontal_gradient(color, 0.55, 1),
      borderRadius: [0, 4, 4, 0],
      borderWidth: 0,
    },
    animationDelay: (data_index) => data_index * 32,
    // `null` where the resource is another class, so these series never compete for a row.
    data: mix_rows.map((row) => (class_of.get(row.resource_name) === class_name ? row.rows_count : null)),
    label: {
      show: true,
      position: 'right',
      distance: 6,
      color: palette.text_secondary,
      fontSize: 11,
      formatter: (params) =>
        (params.value === null ? '' : format_count(params.value)),
    },
  };
}
