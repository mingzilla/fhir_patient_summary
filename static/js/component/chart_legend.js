import { element } from './panel_card.js';

/**
 * A legend in HTML rather than inside the canvas.
 *
 * Two panels need entries that are not series - the problem timeline's ongoing/resolved pair
 * and the prescription lanes' first/re-order marker shapes - and ECharts can only build a
 * legend out of series it has. Building it here also keeps the legend in the text layer where
 * a screen reader reaches it and where it inherits the page's own ink.
 *
 * `shape` is `roundRect` or `diamond`, mirroring what the chart draws, so a marker shape can
 * be the thing the legend explains and not only a hue.
 */
export function chart_legend(entries) {
  const legend = element('div', 'chart-legend');
  legend.setAttribute('role', 'list');
  for (const entry of entries) {
    const item = element('span', 'chart-legend__item');
    item.setAttribute('role', 'listitem');

    const swatch = element('span', `chart-legend__swatch chart-legend__swatch--${entry.shape ?? 'roundRect'}`);
    swatch.style.background = entry.color;
    swatch.setAttribute('aria-hidden', 'true');

    const label = element('span', 'chart-legend__label');
    label.textContent = entry.label;

    item.append(swatch, label);
    legend.append(item);
  }
  return legend;
}
