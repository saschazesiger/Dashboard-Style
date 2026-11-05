/**
 * DS.facets without a DOM: which options of a facet show (search, limit,
 * "Show all", zero counts), the text a facet search compares, and the
 * registration. Counts, chips, folding and the sheet run in facets.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { foldText, visible } from './facets.js';
import { runtime } from '../../js/core.js';

const options = (labels, checked = [], counts = {}) => labels.map((label) => ({ label, checked: checked.includes(label), count: counts[label] ?? null }));
const OWNERS = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson', 'Margaret Hamilton', 'Radia Perlman'];

describe('DS.facets.foldText', () => {
  it('folds case, accents and spaces', () => {
    assert.equal(foldText('  Ádá   LOVELACE '), 'ada lovelace');
    assert.equal(foldText('Ærø Ça'), 'ærø ca');
    assert.equal(foldText(null), '');
  });
});

describe('DS.facets.visible', () => {
  it('shows every option without a limit or a search', () => {
    assert.deepEqual(visible(options(['a', 'b', 'c'])), { shown: [true, true, true], matches: 3, total: 3, more: false });
  });

  it('shows the first n and every checked option under a limit, all once expanded', () => {
    const list = options(OWNERS, ['Radia Perlman']);
    const folded = visible(list, { limit: 3 });
    assert.deepEqual(folded.shown, [true, true, true, false, false, true]);
    assert.equal(folded.more, true);
    assert.equal(folded.total, 6);
    assert.deepEqual(visible(list, { limit: 3, expanded: true }).shown, OWNERS.map(() => true));
    // A limit the facet does not exceed needs no button.
    assert.equal(visible(list, { limit: 6 }).more, false);
    assert.equal(visible(list, { limit: 0 }).more, false);
  });

  it('a search shows the matches only, whatever the limit, accents aside', () => {
    const list = options(['Ada Lovelace', 'Ádám Kovács', 'Grace Hopper', 'Alan Turing']);
    const found = visible(list, { query: 'ada', limit: 1 });
    assert.deepEqual(found.shown, [true, true, false, false]);
    assert.equal(found.matches, 2);
    assert.equal(found.more, false);
    assert.deepEqual(visible(list, { query: 'zz' }), { shown: [false, false, false, false], matches: 0, total: 4, more: false });
    // Only spaces: no search.
    assert.equal(visible(list, { query: '   ', limit: 2 }).more, true);
  });

  it('zero "hide" leaves out unchecked options counted 0; they do not count towards the limit', () => {
    const list = options(['a', 'b', 'c', 'd'], ['b'], { a: 0, b: 0, c: 4, d: 1 });
    const result = visible(list, { zero: 'hide', limit: 1 });
    assert.deepEqual(result.shown, [false, true, false, false]);
    assert.equal(result.total, 3);
    assert.equal(result.more, true);
    assert.deepEqual(visible(list, { zero: 'disable' }).shown, [true, true, true, true]);
    assert.deepEqual(visible(list, { zero: 'hide', query: 'a' }).shown, [false, false, false, false]);
  });
});

describe('DS.facets registration', () => {
  it('registers data-ds-facets and watches its options', () => {
    const spec = runtime.state('core').specs.get('facets');
    assert.equal(spec.attribute, 'data-ds-facets');
    assert.deepEqual(spec.attributes, ['data-ds-facets-sheet', 'data-ds-facets-zero']);
  });
});
