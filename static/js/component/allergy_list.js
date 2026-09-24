import { format_day } from '../util/date_scale.js';
import { element } from './panel_card.js';

/**
 * The allergy panel - Block `allergy-list`. A list and not a chart: every field this
 * endpoint carries is a string, there is no number to place on a scale, and eight chips
 * carry more than eight bars would.
 *
 * `Criticality` is the risk the allergy poses, not how bad a reaction was. It gets the
 * reserved status colour - the one place on this page where a colour means a state rather
 * than an identity - and **the word is always beside it**, so the stripe is a second channel
 * and never the only one. `unable-to-assess` is not "low": it is the absence of an
 * assessment, so it wears the warning colour and says so.
 */
const CRITICALITY_STRIPE = Object.freeze({
  high: 'critical',
  'unable-to-assess': 'warning',
  low: 'neutral',
});

export function allergy_list(allergy_rows) {
  const list = element('ul', 'allergy-list');
  for (const row of allergy_rows) {
    list.append(chip(row));
  }
  return list;
}

function chip(row) {
  const item = element('li', 'allergy-chip');

  const stripe = element('span', `allergy-chip__stripe allergy-chip__stripe--${
    CRITICALITY_STRIPE[row.criticality_text] ?? 'neutral'}`);
  stripe.setAttribute('aria-hidden', 'true');
  item.append(stripe);

  const name = element('div', 'allergy-chip__name');
  name.textContent = row.allergen_name;
  item.append(name);

  const meta = element('div', 'allergy-chip__meta');
  meta.textContent = [
    `criticality ${row.criticality_text}`,
    row.status_text.toLowerCase(),
    `recorded ${format_day(row.recorded_on)}`,
    `id ${row.source_id}`,
  ].join(' · ');
  item.append(meta);
  return item;
}
