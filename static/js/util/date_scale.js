/**
 * Dates on this wire are `"YYYY-MM-DD"` strings, and every one of them is a calendar day
 * rather than an instant.
 *
 * `new Date("2014-03-15")` is **wrong** for that: the spec parses a date-only string as UTC
 * midnight, so in any timezone behind UTC it formats back as the 14th, and a patient's visit
 * slides a day earlier for a reader in New York. These helpers build the date from its parts
 * in local time instead, which is the only reading under which the string survives a round
 * trip. They are the only place a date is constructed.
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `"2014-03-15"` -> a `Date` at local midnight. Anything else -> `null`. */
export function parse_iso_date(text) {
  const match = ISO_DATE.exec(typeof text === 'string' ? text : '');
  if (match === null) {
    return null;
  }
  const [, year, month, day] = match.map(Number);
  return new Date(year, month - 1, day);
}

/** A `Date` -> `"YYYY-MM-DD"` in local time, matching the wire's own format. */
export function to_iso_date(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * How far apart the outermost of a set of dates are, in whole days.
 *
 * This is axis scaling, not a reading of the record: no number it produces is ever displayed,
 * it only decides whether a time axis is labelled by year or by month. A chart of six weeks
 * labelled `2018 2018 2018` is the failure it prevents.
 *
 * Rounded, for the same reason `days_between` rounds: these are calendar days, and the
 * interval between two local midnights is an hour short or long whenever the clocks change
 * between them - `2018-04-17` to `2019-02-11` divides to 300.0416 days, and every caller
 * here means 300.
 */
export function span_days_of(dates) {
  const times = dates.filter((date) => date instanceof Date && !Number.isNaN(date.getTime()))
    .map((date) => date.getTime());
  if (times.length === 0) {
    return 0;
  }
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((Math.max(...times) - Math.min(...times)) / MS_PER_DAY);
}

/** Whole days from `from` to `to`. Both are `Date`s at local midnight. */
export function days_between(from, to) {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

/** `"2001-05-24"` -> `"24 May 2001"`. Empty in, empty out. */
export function format_day(text) {
  const date = parse_iso_date(text);
  if (date === null) {
    return '';
  }
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

/** `"2001-05-24"` -> `"May 2001"`, for axis ticks where the day is noise. */
export function format_month(text) {
  const date = parse_iso_date(text);
  if (date === null) {
    return '';
  }
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

/** `0` -> `"0 years"`, `1` -> `"1 year"`. `Years` counts year boundaries, so this is approximate. */
export function format_years(years) {
  if (years === null || years === undefined) {
    return '';
  }
  return years === 1 ? '1 year' : `${years} years`;
}

/** `365` -> `"365 days"`. `Gap (days)` is null on a first order, so null reads as no gap. */
export function format_days(days) {
  if (days === null || days === undefined) {
    return '';
  }
  if (days < 31) {
    return days === 1 ? '1 day' : `${days} days`;
  }
  if (days < 365) {
    const months = Math.round(days / 30.44);
    return `${days} days (~${months} months)`;
  }
  const years = (days / 365.25).toFixed(1);
  return `${days} days (~${years} years)`;
}
