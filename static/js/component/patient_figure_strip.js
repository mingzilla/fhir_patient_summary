import { format_day, format_month } from '../util/date_scale.js';
import { format_count } from '../util/value_text.js';
import { element } from './panel_card.js';

/**
 * The five blocks in the top bar: who the record is about, and the figures a reader wants
 * before reading anything else.
 *
 * It is **not a chart**, and every form that gives nine scalars one - a dial, a progress ring,
 * a bar per figure - is decoration over a number that is already the clearest thing to show.
 *
 * The strip is one nowrap row that scrolls sideways. It is the reason the bar's height can be
 * a constant: a wrapping row would make the bar grow and shrink as the window changes, and the
 * bar's height is the one thing about this layout that must not move.
 *
 * On a narrow screen the dates show the month rather than the day. Four full dates do not fit
 * beside a phone's wordmark, and the day is in the Patient panel's table view either way.
 */
export function patient_figure_strip(header) {
  const strip = element('div', 'figure-strip');
  strip.dataset.panel = 'patient';

  strip.append(identity_block(header));
  for (const [label, value] of figures(header)) {
    strip.append(figure_block(value, label));
  }
  return strip;
}

/** The name, with sex and whether the record ends in a death - the two facts that change how
 *  every other figure on the page is read. */
function identity_block(header) {
  const block = element('div', 'figure-strip__block figure-strip__block--name');
  const value = element('div', 'figure-strip__value');
  value.textContent = header.family_name;

  const label = element('div', 'figure-strip__label');
  label.textContent = [
    header.sex,
    header.is_deceased ? `died ${header.died_on.slice(0, 4)}` : 'living',
  ].join(' · ');

  block.append(value, label);
  return block;
}

function figure_block(value, label) {
  const block = element('div', 'figure-strip__block');
  const value_node = element('div', 'figure-strip__value');
  value_node.textContent = value;
  const label_node = element('div', 'figure-strip__label');
  label_node.textContent = label;
  block.append(value_node, label_node);
  return block;
}

/** `Age` is age at `As of`, not age today, which is what the strip's last block pins down. */
export function figures(header, { compact = true } = {}) {
  const day = compact ? format_month : format_day;
  return [
    ['Clinical events', format_count(header.clinical_events)],
    ['Age', String(header.age_years)],
    ['First seen', day(header.first_seen_on)],
    ['As of', day(header.as_of)],
  ];
}
