import { element } from './panel_card.js';

/**
 * The two pieces of chrome that belong to the page rather than to a patient: what this page
 * is, and which theme it is in.
 *
 * Rendered twice - once at the foot of the desktop rail, once at the foot of the phone drawer
 * - so both layouts carry the same controls without JavaScript deciding which one exists.
 * Anything that updates them updates every instance by class.
 */
export function site_footer() {
  const footer = element('div', 'site-footer');
  footer.append(site_info(), theme_toggle_button());
  return footer;
}

/**
 * The page's honesty statement, folded away.
 *
 * This is the sentence that separates the page from a picture of one: every figure was
 * returned by the API and nothing is recomputed in the browser. It is worth having on screen
 * and not worth the height of a paragraph beside the patient's name, so it opens on demand.
 */
export function site_info() {
  const details = element('details', 'site-info');
  const summary = element('summary', 'site-info__summary');
  summary.textContent = 'About this page';
  details.append(summary);

  const body = element('p', 'site-info__body');
  body.textContent =
    'Every number on this page is one the dashboard API returned. Nothing is summed, averaged '
    + 'or recomputed in the browser, so each figure is traceable to the query behind it. A '
    + 'panel with no rows says so in words, because none known and not checked are different '
    + 'statements. Every row carries the id of the resource it came from, in its table view.';
  details.append(body);
  return details;
}

/** The label names the theme the button switches **to**, not the one in use. */
export function theme_toggle_button() {
  const button = element('button', 'theme-toggle');
  button.type = 'button';
  button.textContent = 'Dark mode';
  return button;
}
