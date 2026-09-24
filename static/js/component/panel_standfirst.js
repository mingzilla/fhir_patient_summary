/**
 * One line per panel, above its chart.
 *
 * These carry the readings that a chart cannot make on its own: what a bar's length is
 * measured from, what a colour means, and which absences are findings. They are the panel's
 * half of the report's **Conventions** section, kept beside the panel rather than in a
 * footnote at the bottom of the page.
 */
export const PANEL_STANDFIRST = Object.freeze({
  problems: 'One bar per problem, from its onset to the day it resolved or to the last '
    + 'recorded event. Length is drawn from those dates, never from the Years column, which '
    + 'counts year boundaries crossed and is approximate by up to a year.',

  medications: 'One lane per drug. Each mark is an order; the number above a mark is the Gap '
    + 'in days since the previous order of that same drug, which is why a first order has '
    + 'none. A single-order lane is a drug that was never renewed.',

  key_measures: 'Nine codes, always. Two readings each at most - the previous and the latest '
    + '- so this is not a time series and the sparklines are not drawn against dates. The '
    + 'change is the endpoint\'s own sentence; the numbers beside it are the readings it '
    + 'compares.',

  allergies: 'The only safety resource in this set. Criticality is the risk the allergy '
    + 'poses, not how bad a reaction was - the record carries no reaction for any patient '
    + 'here, so no field on this page claims a severity.',

  visits: 'Results and Reports are counted at the encounter. Both are drawn against a time '
    + 'axis rather than a row number, because two visits on one day arrive in insertion order '
    + 'and that order is a tiebreaker rather than a finding.',

  record_mix: 'Twelve resource types. Clinical is exactly the eight types this report reads; '
    + 'billing and not-read are rows the record holds that no part of the pipeline fetches, '
    + 'and showing them is the point. There is no per-class total, because no endpoint serves '
    + 'one - the only total here is Clinical events in the header, which the contract '
    + 'guarantees equals the clinical rows.',

  patient: '',
});
