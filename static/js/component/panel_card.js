import { empty_panel_note, unavailable_panel_note } from '../util/panel_note.js';
import { format_count } from '../util/value_text.js';
import { row_table } from './row_table.js';

/**
 * The shell every panel sits in - Block `panel-card`, one per panel.
 *
 * It owns the three things the panels share: the heading with its row count, the note that
 * stands in for a chart when there is nothing to draw, and the table view.
 *
 * The count beside the heading is `rows.length` - a fact about the response, the same number
 * the panel prints as `Allergies (0)`. It is **not** a sum over a column: a total the API did
 * not return would be this frontend asserting its own arithmetic, which is the one thing the
 * verified-SQL API exists to prevent.
 */
export function panel_card({ panel, rows, span = 12, standfirst = '', build_chart = null }) {
  const card = element('section', 'panel-card');
  card.dataset.panel = panel.key;
  card.dataset.span = String(span);

  const head = element('div', 'panel-card__head');
  const title = element('h2', 'panel-card__title');
  title.textContent = panel.title;
  head.append(title);

  const count = element('span', 'panel-card__count');
  count.textContent = rows === null ? '' : `(${format_count(rows.length)})`;
  head.append(count);
  card.append(head);

  if (standfirst !== '') {
    const line = element('p', 'panel-card__standfirst');
    line.textContent = standfirst;
    card.append(line);
  }

  // A panel that failed to load is not an empty one, and only the empty case gets a note.
  if (rows === null) {
    card.append(note(unavailable_panel_note(panel.title), 'absent'));
    return card;
  }

  const absence = empty_panel_note(panel.key, rows);
  if (absence !== '') {
    card.append(note(absence, 'absent'));
  } else if (build_chart !== null) {
    card.append(build_chart(rows));
  }

  if (rows.length > 0) {
    card.append(row_table(panel, rows));
  }
  return card;
}

function note(text, modifier) {
  const line = element('p', `panel-card__note panel-card__note--${modifier}`);
  line.textContent = text;
  return line;
}

export function element(tag, class_name) {
  const node = document.createElement(tag);
  if (class_name !== '') {
    node.className = class_name;
  }
  return node;
}
