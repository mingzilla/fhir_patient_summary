import { horizontal_gradient, translucent } from './echart_theme.js';
import { format_with_unit } from './value_text.js';

/**
 * One key measurement as a two-point sparkline: `Previous` then `Latest`.
 *
 * This is deliberately **not a time series**. The endpoint carries two readings per code,
 * not a history, so the two points are placed at equal spacing and the axis is hidden - the
 * horizontal distance between them means nothing, and only their order and their height do.
 * Plotting them against their real dates would invent a span the data does not have.
 *
 * `scale: true` lets the two points use the full height of a 46px box, which is what makes a
 * change visible at all. That also means the slope is not proportional to the size of the
 * change, so both readings are printed beside it and the endpoint's own `Change` sentence is
 * the statement of direction - the sparkline is the glance, the text is the claim.
 *
 * A row the record does not carry has no sparkline: `Latest` is null and the tile says
 * `not measured`, which is a fact about the record rather than a gap in the chart.
 */
export function sparkline_option(measure_row, palette) {
  if (!measure_row.was_measured) {
    return null;
  }

  const has_previous = measure_row.previous_value !== null && measure_row.previous_value !== undefined;
  const points = has_previous
    ? [measure_row.previous_value, measure_row.latest_value]
    : [measure_row.latest_value];
  const labels = has_previous ? ['Previous', 'Latest'] : ['Latest'];

  return {
    backgroundColor: 'transparent',
    animation: false,
    // Off, because the tile around this sparkline already states every value in text and the
    // panel has a table view. A generated label here would announce the same readings a
    // second time, in ECharts' index-into-the-data phrasing.
    aria: { enabled: false },
    // `top` is headroom for the label above the highest point, and `scale: true` guarantees
    // the highest point sits at the top of the plot - so a small `top` clips the latest
    // reading on every tile. 18 clears an 11px label at 46px of tile.
    grid: { left: 6, right: 8, top: 18, bottom: 8, containLabel: false },
    xAxis: { type: 'category', data: labels, show: false, boundaryGap: true },
    yAxis: { type: 'value', show: false, scale: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'none' },
      formatter: (params) =>
        params
          .map((point) => `${point.name}: ${format_with_unit(point.value, measure_row.unit_text)}`)
          .join('<br>'),
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text_primary, fontSize: 12 },
      extraCssText: 'box-shadow: 0 4px 14px rgba(0,0,0,0.10); border-radius: 8px;',
    },
    series: [{
      type: 'line',
      data: points,
      symbol: 'circle',
      symbolSize: 8,
      // Deepening left to right: `previous` is the faded end and `latest` is the full one,
      // which is also the order the two readings are read in.
      lineStyle: { width: 2.5, color: horizontal_gradient(palette.series_1, 0.35, 1) },
      itemStyle: {
        color: palette.series_1,
        borderColor: palette.surface,
        borderWidth: 2,
        shadowBlur: 6,
        shadowColor: translucent(palette.series_1, 0.5),
      },
      animationDuration: 620,
      animationEasing: 'cubicOut',
      label: {
        show: true,
        position: 'top',
        distance: 4,
        color: palette.text_secondary,
        fontSize: 11,
        formatter: (params) => format_with_unit(params.value, ''),
      },
      // A single reading draws the symbol alone: a line needs two points to be a line.
    }],
  };
}
