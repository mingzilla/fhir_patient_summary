/**
 * Tooltip bodies, built as text and escaped.
 *
 * The values come out of a clinical record, so a display name containing `<` or `&` is
 * possible and would otherwise become markup inside the tooltip. Everything interpolated
 * here is escaped, and the label/value split is done by this file rather than by each chart.
 *
 * A tooltip never carries a value the table view does not - it is a shortcut to a number,
 * not the only place that number exists.
 */

const ESCAPES = Object.freeze({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
});

export function escape_html(text) {
  return String(text).replace(/[&<>"']/g, (character) => ESCAPES[character]);
}

/** `[['Onset', '24 May 2001'], ['Source', '2021']]` -> a two-column definition list. */
export function tooltip_body(title, pairs) {
  const rows = pairs
    .filter(([, value]) => value !== '' && value !== null && value !== undefined)
    .map(([label, value]) =>
      `<div style="display:flex;gap:14px;justify-content:space-between">`
      + `<span style="opacity:0.7">${escape_html(label)}</span>`
      + `<span style="font-variant-numeric:tabular-nums">${escape_html(value)}</span></div>`)
    .join('');
  const heading = title === ''
    ? ''
    : `<div style="font-weight:600;margin-bottom:5px">${escape_html(title)}</div>`;
  return `${heading}${rows}`;
}
