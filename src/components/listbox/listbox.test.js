/**
 * DS.listbox without a DOM: the matching (fuzzy, filter, highlight), its
 * registration, and that it names no timing of its own. The keys, the value
 * and the windowed data in a browser are listbox.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as listbox from './listbox.js';
import { runtime } from '../../js/core.js';
import { read } from '../../../test/helpers.js';

const { fuzzy, filter, highlight } = listbox;

describe('DS.listbox.fuzzy', () => {
  it('matches a substring, best at the start, then at a word start', () => {
    const start = fuzzy('lap', 'Laptop 14');
    const word = fuzzy('top', 'Desk top');
    const inside = fuzzy('top', 'Laptop 14');
    assert.deepEqual(start.ranges, [[0, 3]]);
    assert.deepEqual(word.ranges, [[5, 8]]);
    assert.deepEqual(inside.ranges, [[3, 6]]);
    assert.ok(start.score > word.score && word.score > inside.score, `${start.score} > ${word.score} > ${inside.score}`);
  });

  it('takes every word of the query, in any order', () => {
    const hit = fuzzy('14 lap', 'Laptop 14');
    assert.deepEqual(hit.ranges, [[0, 3], [7, 9]]);
    assert.equal(fuzzy('14 desk', 'Laptop 14'), null);
  });

  it('matches letters in order, preferring word starts, and ranks them under a substring', () => {
    const hit = fuzzy('md', 'Mini desktop');
    assert.deepEqual(hit.ranges, [[0, 1], [5, 6]]);
    assert.ok(fuzzy('mini', 'Mini desktop').score > hit.score);
    assert.equal(fuzzy('zq', 'Mini desktop'), null);
    // A later word start never costs a match the earlier letter would make.
    assert.ok(fuzzy('aa', 'xa ab'));
  });

  it('ignores case and accents, and maps the ranges back to the original text', () => {
    assert.deepEqual(fuzzy('OST', 'Café Österreich').ranges, [[5, 8]]);
    assert.deepEqual(fuzzy('cafe', 'Café').ranges, [[0, 4]]);
  });

  it('matches everything with an empty query, with no ranges', () => {
    assert.deepEqual(fuzzy('', 'Laptop'), { score: 0, ranges: [] });
    assert.deepEqual(fuzzy('   ', 'Laptop'), { score: 0, ranges: [] });
  });

  it('ranks the whole text typed above a longer text that starts with it', () => {
    assert.ok(fuzzy('laptop', 'Laptop').score > fuzzy('laptop', 'Laptop 14').score);
  });
});

describe('DS.listbox.filter', () => {
  const items = ['Laptop 13', 'Laptop 14', 'Workstation 15', 'Mini desktop', 'Convertible 13'];

  it('returns the matches best first, equal scores in their order', () => {
    assert.deepEqual(filter(items, '13').map((hit) => hit.item), ['Laptop 13', 'Convertible 13']);
    assert.deepEqual(filter(items, 'desk').map((hit) => hit.index), [3]);
    assert.equal(filter(items, '').length, items.length);
  });

  it('reads objects by their label, or by a label function, and cuts at the limit', () => {
    const objects = items.map((label, index) => ({ value: index, label }));
    assert.deepEqual(filter(objects, 'lap', { limit: 1 }).map((hit) => hit.item.value), [0]);
    assert.deepEqual(filter(objects, 'w', { label: (item) => item.label }).map((hit) => hit.item.label), ['Workstation 15']);
  });
});

describe('DS.listbox.highlight', () => {
  it('escapes the text and marks the ranges', () => {
    assert.equal(highlight('A <b> & c', [[0, 1], [8, 9]]), '<mark class="ds-listbox__match">A</mark> &lt;b&gt; &amp; <mark class="ds-listbox__match">c</mark>');
    assert.equal(highlight('Laptop', [], 'ds-combo__match'), 'Laptop');
    assert.equal(highlight('Laptop', [[0, 3]], 'ds-combo__match'), '<mark class="ds-combo__match">Lap</mark>top');
  });

  it('skips ranges that overlap or are empty', () => {
    assert.equal(highlight('abcdef', [[0, 3], [2, 4], [5, 5]]), '<mark class="ds-listbox__match">abc</mark>def');
  });
});

describe('DS.listbox', () => {
  it('registers its behaviour by its attribute', () => {
    const spec = runtime.state('core').specs.get('listbox');
    assert.equal(spec.attribute, 'data-ds-listbox');
    assert.equal(typeof spec.init, 'function');
  });

  it('windows a data list from VIRTUAL_FROM items on', () => {
    assert.equal(listbox.VIRTUAL_FROM, 100);
  });

  it('makes nothing without an element', () => {
    assert.equal(listbox.create(null), null);
  });

  it('names no timing of its own: type-ahead resets after the token', () => {
    const source = read('src/components/listbox/listbox.js');
    assert.match(source, /motionDuration\(element, '--ds-delay-tooltip'\)/);
    assert.doesNotMatch(source.replace(/\/\*[\s\S]*?\*\//g, ''), /\b\d+ms\b|setTimeout\([^,]+,\s*\d/);
  });

  it('never writes the page\'s text as markup', () => {
    const source = read('src/components/listbox/listbox.js').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.doesNotMatch(source, /\.innerHTML\s*=|insertAdjacentHTML/);
  });
});
