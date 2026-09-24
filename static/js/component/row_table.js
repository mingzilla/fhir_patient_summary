import { as_text_cell } from '../util/table_cell.js';
import { element } from './panel_card.js';

/**
 * The table view. Every panel has one, and it is the same component each time.
 *
 * Two jobs. It is the accessible twin of the chart - every value a tooltip would show is
 * readable here without a pointer - and it is where `Source` stays visible, so any line can
 * be traced back past the report to the resource it came from.
 *
 * The columns come off the domain, which took them off the wire. A column the endpoint does
 * not carry cannot appear here, and one it adds cannot be silently dropped.
 */
export function row_table(panel, rows) {
  const columns = panel.domain.COLUMNS;
  const numeric_columns = numeric_columns_of(columns, rows);

  const drawer = element('details', 'table-drawer');
  const summary = element('summary', 'table-drawer__toggle');
  summary.textContent = `Show the ${rows.length} row${rows.length === 1 ? '' : 's'}`;
  drawer.append(summary);

  const body = element('div', 'table-drawer__body');
  const table = element('table', 'panel-table');

  const head_row = element('tr', '');
  for (const column of columns) {
    const head = element('th', '');
    head.scope = 'col';
    head.textContent = column;
    head_row.append(head);
  }
  const thead = element('thead', '');
  thead.append(head_row);
  table.append(thead);

  const tbody = element('tbody', '');
  for (const row of rows) {
    const table_row = element('tr', '');
    for (const column of columns) {
      const cell = element('td', numeric_columns.has(column) ? 'panel-table__number' : '');
      if (column === 'Source' || column === 'Source (prev)') {
        cell.className = 'panel-table__source';
      }
      const { text, muted, title } = as_text_cell(row.get(column));
      cell.textContent = text;
      if (muted) {
        cell.classList.add('panel-table__muted');
      }
      if (title !== '') {
        cell.title = title;
      }
      table_row.append(cell);
    }
    tbody.append(table_row);
  }
  table.append(tbody);

  body.append(table);
  drawer.append(body);
  return drawer;
}

/** A column is numeric when the endpoint sent a number in it - never inferred from the name. */
function numeric_columns_of(columns, rows) {
  const numeric = new Set();
  for (const column of columns) {
    if (rows.some((row) => typeof row.get(column) === 'number')) {
      numeric.add(column);
    }
  }
  return numeric;
}
