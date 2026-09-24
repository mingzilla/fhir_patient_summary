import assert from 'node:assert/strict';
import test from 'node:test';

import { escape_html, tooltip_body } from '../../static/js/util/tooltip_text.js';

test('a value out of the record cannot become markup in a tooltip', () => {
  assert.equal(escape_html('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.equal(escape_html('a & b'), 'a &amp; b');
  assert.equal(escape_html(`it's "quoted"`), 'it&#39;s &quot;quoted&quot;');
});

test('an allergen name with an ampersand survives the tooltip intact', () => {
  const body = tooltip_body('Dander (animal) allergy', [['Source', '12172']]);
  assert.match(body, /Dander \(animal\) allergy/);
  assert.match(body, /12172/);

  const escaped = tooltip_body('A & B', []);
  assert.ok(!escaped.includes('A & B'));
  assert.ok(escaped.includes('A &amp; B'));
});

test('a field with no value is dropped rather than shown empty', () => {
  const body = tooltip_body('X', [['Onset', '2001-05-24'], ['Pair', ''], ['Unit', null]]);
  assert.match(body, /Onset/);
  assert.ok(!body.includes('Pair'));
  assert.ok(!body.includes('Unit'));
});

test('a row of nothing but empty fields still renders its heading', () => {
  const body = tooltip_body('Neoplasm of prostate', [['Pair', '']]);
  assert.match(body, /Neoplasm of prostate/);
});
