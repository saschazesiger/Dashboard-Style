/**
 * DS.orderedchoice without a DOM: the layout of set() and the places of the
 * checked rows; the registration. The behaviour in a browser is
 * orderedchoice.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { arrange, ranks, create } from './orderedchoice.js';
import { runtime, t } from '../../js/core.js';

describe('DS.orderedchoice.arrange', () => {
  it('puts the value first, in its order, the rest after it in theirs', () => {
    assert.deepEqual(arrange(['a', 'b', 'c', 'd'], ['c', 'a']), ['c', 'a', 'b', 'd']);
    assert.deepEqual(arrange(['a', 'b'], []), ['a', 'b']);
  });

  it('leaves out unknown values and repeats', () => {
    assert.deepEqual(arrange(['a', 'b', 'c'], ['x', 'b', 'b']), ['b', 'a', 'c']);
  });
});

describe('DS.orderedchoice.ranks', () => {
  it('numbers the checked values in their order', () => {
    assert.deepEqual([...ranks(['a', 'b', 'c', 'd'], ['d', 'b'])], [['b', 1], ['d', 2]]);
    assert.equal(ranks(['a'], new Set()).size, 0);
  });
});

describe('DS.orderedchoice', () => {
  it('registers its behaviour by its attribute; says a place through the system strings', () => {
    assert.equal(runtime.state('core').specs.get('orderedchoice').attribute, 'data-ds-orderedchoice');
    assert.equal(create(null), null);
    assert.equal(t('orderPosition', { position: 2 }), 'Position 2');
  });
});
