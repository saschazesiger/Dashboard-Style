/**
 * DS.list: the range of a shift-click, the state of a "select all" box,
 * and the module without a DOM. The browser side is list.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { rangeKeys, allState, create, facts } from './list.js';

describe('DS.list.rangeKeys', () => {
  const keys = ['a', 'b', 'c', 'd', 'e'];

  it('takes every key between the anchor and the target, both included, in list order', () => {
    assert.deepEqual(rangeKeys(keys, 'b', 'd'), ['b', 'c', 'd']);
    assert.deepEqual(rangeKeys(keys, 'd', 'b'), ['b', 'c', 'd']);
    assert.deepEqual(rangeKeys(keys, 'c', 'c'), ['c']);
  });

  it('takes the target alone without an anchor, or with one that left the list', () => {
    assert.deepEqual(rangeKeys(keys, null, 'c'), ['c']);
    assert.deepEqual(rangeKeys(keys, 'x', 'c'), ['c']);
  });

  it('takes nothing for a target that is not in the list', () => {
    assert.deepEqual(rangeKeys(keys, 'a', 'x'), []);
  });
});

describe('DS.list.allState', () => {
  it('is true for all, false for none, mixed between', () => {
    assert.equal(allState(5, 5), 'true');
    assert.equal(allState(0, 5), 'false');
    assert.equal(allState(2, 5), 'mixed');
  });

  it('is false for an empty list', () => {
    assert.equal(allState(0, 0), 'false');
  });
});

describe('DS.list without a DOM', () => {
  it('returns inert controllers', () => {
    const list = create(null);
    assert.equal(list.get(), null);
    assert.equal(list.window(), null);
    assert.deepEqual(facts(null).get(), []);
    list.destroy();
  });
});
