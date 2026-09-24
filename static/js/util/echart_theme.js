/**
 * The chart layer's view of the page's design tokens.
 *
 * The colours live in `app_style.css` as custom properties and are read back here, so a
 * chart and the page around it cannot drift: dark mode moves both at once, and there is one
 * place to change a hue. Nothing in this file names a colour.
 *
 * The series slots are used in the palette's fixed order and are never cycled or generated -
 * a chart that needs a ninth identity gets a table instead.
 */

const TOKEN = Object.freeze({
  surface: '--surface-1',
  surface_alt: '--surface-2',
  text_primary: '--text-primary',
  text_secondary: '--text-secondary',
  text_muted: '--text-muted',
  gridline: '--gridline',
  baseline: '--baseline',
  border: '--border',
  series_1: '--series-1',
  series_2: '--series-2',
  series_3: '--series-3',
  series_muted: '--series-muted',
  good: '--status-good',
  warning: '--status-warning',
  critical: '--status-critical',
  font: '--font-sans',
});

export function read_palette(root = document.documentElement) {
  const styles = getComputedStyle(root);
  const palette = {};
  for (const [role, token] of Object.entries(TOKEN)) {
    palette[role] = styles.getPropertyValue(token).trim();
  }
  palette.series = [palette.series_1, palette.series_2, palette.series_3];
  return palette;
}

/** `#2a78d6` -> `[42, 120, 214]`. Only the six-digit form the palette uses is accepted. */
function hex_to_rgb(hex) {
  const text = hex.trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(text)) {
    return [0, 0, 0];
  }
  return [0, 2, 4].map((offset) => parseInt(text.slice(offset, offset + 2), 16));
}

/**
 * A gradient within one hue.
 *
 * This is a depth cue, not an encoding: the two stops are the *same* colour at different
 * alpha, so a gradient bar carries exactly the information a flat bar does. A gradient
 * between two hues would be a rainbow, and a rainbow on a magnitude scale invents an order
 * the data does not have.
 */
export function vertical_gradient(hex, top_alpha = 1, bottom_alpha = 0.5) {
  const [r, g, b] = hex_to_rgb(hex);
  return {
    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
    colorStops: [
      { offset: 0, color: `rgba(${r}, ${g}, ${b}, ${top_alpha})` },
      { offset: 1, color: `rgba(${r}, ${g}, ${b}, ${bottom_alpha})` },
    ],
  };
}

/** The same colour at a given alpha, for glows and shadows that must follow the palette. */
export function translucent(hex, alpha) {
  const [r, g, b] = hex_to_rgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** The horizontal twin, for a bar that grows to the right. */
export function horizontal_gradient(hex, left_alpha = 0.55, right_alpha = 1) {
  const [r, g, b] = hex_to_rgb(hex);
  return {
    type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
    colorStops: [
      { offset: 0, color: `rgba(${r}, ${g}, ${b}, ${left_alpha})` },
      { offset: 1, color: `rgba(${r}, ${g}, ${b}, ${right_alpha})` },
    ],
  };
}

/**
 * What every chart on the page shares: no surface of its own (the card is the surface), ink
 * from the text tokens, hairline solid axes, and a tooltip that is a card rather than a
 * coloured box. Gridlines are solid and one shade off the surface - a dashed grid reads as a
 * threshold, which is a claim none of these charts makes.
 */
export function base_chart_option(palette) {
  const axis_label = { color: palette.text_muted, fontSize: 11 };
  const axis_line = { lineStyle: { color: palette.baseline, width: 1 } };
  const split_line = { lineStyle: { color: palette.gridline, width: 1, type: 'solid' } };
  const axis_tick = { lineStyle: { color: palette.baseline } };

  return {
    backgroundColor: 'transparent',
    // A chart that draws itself is read as a thing that was computed; the stagger is what
    // makes the eye follow a series rather than take a finished picture. Kept short, and
    // `animationDurationUpdate` is lower than the entry so a patient switch does not replay
    // the whole entrance at the reader.
    animationDuration: 700,
    animationDurationUpdate: 260,
    animationEasing: 'cubicOut',
    animationEasingUpdate: 'cubicInOut',
    textStyle: { fontFamily: palette.font, fontSize: 12 },
    tooltip: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: palette.text_primary, fontSize: 12 },
      extraCssText: 'box-shadow: 0 4px 14px rgba(0,0,0,0.10); border-radius: 8px;',
    },
    axis_label,
    axis_line,
    split_line,
    axis_tick,
  };
}

/**
 * The chart's own accessible name.
 *
 * ECharts writes `role="img"` and an `aria-label` onto the container, and the label it
 * generates itself reads the raw data indices aloud - "the data for a is 0, 3" - which is
 * worse than nothing on a clinical page. Supplying the description replaces it, so the
 * sentence a screen reader announces is one written for a reader.
 *
 * The description never carries a number the endpoint did not serve: it may say how many rows
 * the panel has, because that is a fact about the response, and it may not total a column.
 */
export function aria_option(description) {
  return { enabled: true, label: { description } };
}

/**
 * How much room the category labels get on a chart of this width.
 *
 * The names on these axes are conditions, drugs and table names, so they are long and they
 * are truncated rather than wrapped. A phone cannot spare 290px of a 386px card for them, so
 * the margin follows the measured width: narrow enough to leave a plot, wide enough to keep
 * the first words of every name distinguishable.
 */
export function y_label_width(chart_width, { wide = 290, narrow = 118, breakpoint = 620 } = {}) {
  return chart_width < breakpoint ? narrow : wide;
}

/** A category axis of names, drawn without a line - the labels are the axis. */
export function category_axis(names, { inverse = false, label_width = null } = {}) {
  return {
    type: 'category',
    data: names,
    inverse,
    axisTick: { show: false },
    axisLine: { show: false },
    axisLabel: {
      interval: 0,
      ...(label_width === null ? {} : { width: label_width, overflow: 'truncate' }),
    },
  };
}

/** A time axis. Values are `Date` objects from `date_scale`, never parsed by the browser. */
export function time_axis() {
  return { type: 'time', axisTick: { show: false } };
}

/**
 * The tick format a time axis earns from the span it covers.
 *
 * A record of six weeks labelled `2018 2018 2018` is worse than no axis at all: the reader
 * cannot place anything in it. Years are only the right tick when the axis actually spans
 * years, so the format follows `span_days_of`, which is the only thing that decides it.
 */
export function time_axis_tick_format(span_days) {
  return span_days > 730 ? '{yyyy}' : '{MMM} {yyyy}';
}

/** A count axis with integer ticks: a visit had 6 results, never 6.5. */
export function count_axis() {
  return { type: 'value', minInterval: 1, axisLine: { show: false } };
}
