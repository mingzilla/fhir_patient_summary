import assert from 'node:assert/strict';
import test from 'node:test';

import {
  days_between,
  format_day,
  format_days,
  format_month,
  format_years,
  parse_iso_date,
  span_days_of,
  to_iso_date,
} from '../../static/js/util/date_scale.js';

test('a date-only string is read as a local calendar day, not a UTC instant', () => {
  const date = parse_iso_date('2014-03-15');
  // The spec parses this string as UTC midnight, so in a timezone behind UTC the local
  // getters would give the 14th. Reading the parts back is what proves the construction.
  assert.equal(date.getFullYear(), 2014);
  assert.equal(date.getMonth(), 2);
  assert.equal(date.getDate(), 15);
  assert.equal(date.getHours(), 0);
});

test('a date survives a round trip through the parser in any timezone', () => {
  for (const text of ['1965-12-29', '2005-05-25', '2014-03-15', '2019-02-11', '2000-01-01']) {
    assert.equal(to_iso_date(parse_iso_date(text)), text);
  }
});

test('a string that is not a date is null rather than an Invalid Date', () => {
  for (const text of ['', 'living', '2014-3-15', '15/03/2014', null, undefined, '2014-03-15T00:00']) {
    assert.equal(parse_iso_date(text), null, `${text}`);
  }
});

test('days_between counts calendar days across a DST boundary', () => {
  assert.equal(days_between(parse_iso_date('2004-02-10'), parse_iso_date('2004-02-17')), 7);
  assert.equal(days_between(parse_iso_date('1996-05-22'), parse_iso_date('2004-05-20')), 2920);
  // Both of these spans cross a clock change; a naive millisecond divide would drift.
  assert.equal(days_between(parse_iso_date('2014-03-15'), parse_iso_date('2014-11-15')), 245);
});

test('span_days_of ignores anything that is not a date', () => {
  const span = span_days_of([parse_iso_date('2018-04-17'), null, parse_iso_date('2019-02-11')]);
  assert.equal(span, 300);
  assert.equal(span_days_of([]), 0);
  assert.equal(span_days_of([null, 'nonsense']), 0);
});

test('dates are rendered the way the report writes them', () => {
  assert.equal(format_day('2001-05-24'), '24 May 2001');
  assert.equal(format_day('1965-12-29'), '29 Dec 1965');
  assert.equal(format_day(''), '');
  assert.equal(format_month('2001-05-24'), 'May 2001');
});

test('Years and Gap are rendered as readable spans', () => {
  assert.equal(format_years(0), '0 years');
  assert.equal(format_years(1), '1 year');
  assert.equal(format_years(36), '36 years');
  assert.equal(format_years(null), '');

  assert.equal(format_days(1), '1 day');
  assert.equal(format_days(30), '30 days');
  assert.equal(format_days(365), '365 days (~1.0 years)');
  assert.equal(format_days(null), '');
});
