import assert from 'node:assert/strict';
import test from 'node:test';

import { KeyMeasureRow } from '../../static/js/domains/key_measure_row.js';
import { MedicationRow } from '../../static/js/domains/medication_row.js';
import { ProblemRow } from '../../static/js/domains/problem_row.js';
import { RecordMixRow } from '../../static/js/domains/record_mix_row.js';
import { VisitRow } from '../../static/js/domains/visit_row.js';
import { days_between, parse_iso_date } from '../../static/js/util/date_scale.js';
import { build_lanes, medication_lane_option } from '../../static/js/util/medication_lane_option.js';
import { problem_timeline_option } from '../../static/js/util/problem_timeline_option.js';
import { record_mix_option } from '../../static/js/util/record_mix_option.js';
import { sparkline_option } from '../../static/js/util/sparkline_option.js';
import { visit_series_option } from '../../static/js/util/visit_series_option.js';

const PALETTE = Object.freeze({
  surface: '#fcfcfb',
  surface_alt: '#f2f1ee',
  text_primary: '#0b0b0b',
  text_secondary: '#52514e',
  text_muted: '#898781',
  gridline: '#e1e0d9',
  baseline: '#c3c2b7',
  border: 'rgba(11,11,11,0.10)',
  series_1: '#2a78d6',
  series_2: '#eb6834',
  series_3: '#1baf7a',
  series_muted: '#898781',
  series: ['#2a78d6', '#eb6834', '#1baf7a'],
  good: '#0ca30c',
  warning: '#fab219',
  critical: '#d03b3b',
  font: 'system-ui, sans-serif',
});

const AS_OF = parse_iso_date('2005-05-25');
const MS_PER_DAY = 86400000;

const problem = (wire) => new ProblemRow({
  Onset: '2001-05-24', Status: 'ACTIVE', Problem: 'Neoplasm of prostate', Years: 4,
  Outcome: 'ongoing', Source: '2021', Pair: '', ...wire,
});

const visit = (wire) => new VisitRow({
  Date: '2005-05-25', Visit: 'Death Certification', Results: 1, Reports: 1,
  'New problem': '', Source: '2200', ...wire,
});

const order = (wire) => new MedicationRow({
  Ordered: '2004-05-20', Medication: 'Simvistatin 10 MG', Status: 'active', 'Gap (days)': 365,
  Course: 're-order', Source: '2170', ...wire,
});

test('the problem timeline is drawn from the dates, never from the Years column', () => {
  // Years is 4 on both rows and the dates disagree completely, so a bar built from Years
  // would make these two identical. It does not.
  const rows = [
    problem({ Onset: '2001-05-24', Outcome: 'ongoing', Years: 4 }),
    problem({ Onset: '2004-05-24', Outcome: 'ongoing', Years: 4, Problem: 'Other' }),
  ];
  const option = problem_timeline_option(rows, PALETTE, AS_OF);
  const [first, second] = option.series[0].data.map((item) => item.value);

  assert.equal((first[1] - first[0]) / MS_PER_DAY, days_between(parse_iso_date('2001-05-24'), AS_OF));
  assert.equal((second[1] - second[0]) / MS_PER_DAY, days_between(parse_iso_date('2004-05-24'), AS_OF));
  assert.notEqual(first[1] - first[0], second[1] - second[0]);
});

test('an ongoing problem runs to the as-of date and a resolved one to its own', () => {
  const rows = [
    problem({ Onset: '2001-05-24', Outcome: 'ongoing', Status: 'ACTIVE' }),
    problem({ Onset: '2004-02-10', Outcome: 'resolved 2004-02-17', Status: 'RESOLVED', Years: 0 }),
  ];
  const option = problem_timeline_option(rows, PALETTE, AS_OF);
  const [ongoing, resolved] = option.series[0].data;

  assert.equal(ongoing.value[1], AS_OF.getTime());
  assert.equal(resolved.value[1], parse_iso_date('2004-02-17').getTime());
  assert.equal((resolved.value[1] - resolved.value[0]) / MS_PER_DAY, 7);
});

test('a problem that resolved the day it began still draws a mark', () => {
  const rows = [problem({ Onset: '2019-02-05', Outcome: 'resolved 2019-02-05', Years: 0 })];
  const option = problem_timeline_option(rows, PALETTE, parse_iso_date('2019-02-11'));
  const [span] = option.series[0].data;
  assert.equal(span.value[1] - span.value[0], MS_PER_DAY);
});

test('ongoing and resolved problems are told apart by colour, and both by the legend', () => {
  const rows = [
    problem({ Outcome: 'ongoing', Status: 'ACTIVE' }),
    problem({ Outcome: 'resolved 2004-02-17', Status: 'RESOLVED' }),
  ];
  const option = problem_timeline_option(rows, PALETTE, AS_OF);
  assert.equal(option.series[0].data[0].color, PALETTE.series_1);
  assert.equal(option.series[0].data[1].color, PALETTE.series_muted);
});

test('a key measurement never taken has no sparkline at all', () => {
  const never = new KeyMeasureRow({
    Code: '2857-1', Measurement: '(not in this record)', Latest: null, Unit: '', Previous: null,
    Change: 'not measured', 'Why it matters': 'prostate', Source: null, 'Source (prev)': null,
  });
  assert.equal(sparkline_option(never, PALETTE), null);
});

test('a sparkline plots previous then latest, and one reading is one point', () => {
  const twice = new KeyMeasureRow({
    Code: '38483-4', Measurement: 'Creatinine', Latest: 1.03, Unit: 'mg/dL', Previous: 3.11,
    Change: 'falling from 3.11', 'Why it matters': 'kidney', Source: '2184', 'Source (prev)': '2152',
  });
  const once = new KeyMeasureRow({
    Code: '2093-3', Measurement: 'Total Cholesterol', Latest: 183.29, Unit: 'mg/dL',
    Previous: null, Change: '', 'Why it matters': 'cholesterol', Source: '2166',
    'Source (prev)': null,
  });

  assert.deepEqual(sparkline_option(twice, PALETTE).series[0].data, [3.11, 1.03]);
  assert.deepEqual(sparkline_option(once, PALETTE).series[0].data, [183.29]);
});

test('the sparkline is scaled to its own two points, which is why the numbers are printed', () => {
  const row = new KeyMeasureRow({
    Code: '2857-1', Measurement: 'PSA', Latest: 5.14, Unit: 'ng/mL', Previous: 0.72,
    Change: 'rising from 0.72', 'Why it matters': 'prostate', Source: '2008', 'Source (prev)': '1950',
  });
  const option = sparkline_option(row, PALETTE);
  assert.equal(option.yAxis.scale, true);
  // The two readings are direct-labelled, so the slope is never the only evidence of size.
  assert.equal(option.series[0].label.show, true);
});

test('prescriptions are grouped into one lane per drug, oldest order first', () => {
  const lanes = build_lanes([
    order({ Ordered: '2004-05-20', Medication: 'Simvistatin 10 MG' }),
    order({ Ordered: '2000-06-05', Medication: 'Amoxicillin', 'Gap (days)': null, Course: 'first' }),
    order({ Ordered: '1996-05-22', Medication: 'Simvistatin 10 MG', 'Gap (days)': null, Course: 'first' }),
  ]);

  assert.deepEqual(lanes.map((lane) => lane.drug), ['Simvistatin 10 MG', 'Amoxicillin']);
  assert.deepEqual(lanes[0].orders.map((row) => row.ordered_on), ['1996-05-22', '2004-05-20']);
  assert.equal(lanes[1].orders.length, 1);
});

test('a lane holds one drug, so a course line never runs between two of them', () => {
  const rows = [
    order({ Ordered: '2004-05-20', Medication: 'Simvistatin 10 MG' }),
    order({ Ordered: '2000-06-05', Medication: 'Amoxicillin', Course: 'first', 'Gap (days)': null }),
  ];
  const option = medication_lane_option(rows, PALETTE);
  assert.equal(option.series.length, 2);
  for (const series of option.series) {
    assert.equal(new Set(series.data.map((item) => item.value[1])).size, 1);
  }
});

test('a first order carries no gap label and a re-order carries its own', () => {
  const rows = [
    order({ Ordered: '1996-05-22', Course: 'first', 'Gap (days)': null }),
    order({ Ordered: '1997-05-22', Course: 're-order', 'Gap (days)': 365 }),
  ];
  const option = medication_lane_option(rows, PALETTE);
  const formatter = option.series[0].label.formatter;

  assert.equal(formatter({ seriesIndex: 0, dataIndex: 0 }), '');
  assert.equal(formatter({ seriesIndex: 0, dataIndex: 1 }), '+365d');
});

test('the record mix colours by class and never totals a class', () => {
  const rows = RecordMixRow.from_wire_series([
    { Resource: 'observation', Rows: 365, Class: 'clinical' },
    { Resource: 'claim', Rows: 44, Class: 'billing' },
    { Resource: 'care_plan', Rows: 5, Class: 'not read' },
  ]);
  const option = record_mix_option(rows, PALETTE);

  assert.equal(option.series.length, 3);
  assert.deepEqual(option.series.map((series) => series.name), ['clinical', 'billing', 'not read']);
  // Exactly one series carries a number per row, so the stack has nothing to add up: any
  // total the three would make is a number no endpoint returned.
  rows.forEach((_, index) => {
    const present = option.series.filter((series) => series.data[index] !== null);
    assert.equal(present.length, 1, `row ${index}`);
  });
});

test('visits are placed by date, not by row number', () => {
  // The rows arrive newest first with the id as tiebreaker, and that order is insertion
  // order rather than clinical order - so an index axis would assert a sequence the data
  // does not claim.
  const rows = [
    visit({ Date: '2005-05-25', Source: '2200' }),
    visit({ Date: '1965-12-29', Source: '1646', Results: 0, Reports: 0 }),
  ];
  const option = visit_series_option(rows, PALETTE);
  const results = option.series.find((series) => series.name === 'Results');
  const dates = results.data.map((item) => item[0]);

  assert.ok(dates[0] instanceof Date);
  assert.equal(dates[1].getTime(), parse_iso_date('1965-12-29').getTime());
  assert.deepEqual(option.xAxis.type, 'time');
});

test('a visit that recorded nothing is still marked on the baseline', () => {
  const rows = [visit({ Date: '1965-12-29', Results: 0, Reports: 0 })];
  const option = visit_series_option(rows, PALETTE);
  const ticks = option.series.find((series) => series.name === 'visit');

  assert.equal(ticks.data.length, 1);
  assert.equal(ticks.data[0][1], 0);
  assert.equal(ticks.silent, undefined);
});

test('every chart carries a description written for a reader', () => {
  const charts = [
    problem_timeline_option([problem({})], PALETTE, AS_OF),
    medication_lane_option([order({})], PALETTE),
    visit_series_option([visit({})], PALETTE),
    record_mix_option(RecordMixRow.from_wire_series([
      { Resource: 'observation', Rows: 365, Class: 'clinical' },
    ]), PALETTE),
  ];
  for (const option of charts) {
    assert.equal(option.aria.enabled, true);
    assert.ok(option.aria.label.description.length > 40);
    // ECharts' own generated label reads data indices aloud; a supplied one replaces it.
    assert.ok(!option.aria.label.description.includes('the data for'));
  }
});

test('a sparkline leaves aria off, because the tile around it says the same numbers', () => {
  const row = new KeyMeasureRow({
    Code: '2093-3', Measurement: 'Total Cholesterol', Latest: 183.29, Unit: 'mg/dL',
    Previous: 181.21, Change: 'rising from 181.21', 'Why it matters': 'cholesterol',
    Source: '2166', 'Source (prev)': '2113',
  });
  assert.equal(sparkline_option(row, PALETTE).aria.enabled, false);
});
