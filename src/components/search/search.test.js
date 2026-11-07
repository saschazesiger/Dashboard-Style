/**
 * DS.search: the list of recent searches (a pure function) and a controller
 * without parts. The browser side is search.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { create, remember } from './search.js';

describe('DS.search.remember', () => {
  it('puts the search at the head, trimmed', () => {
    assert.deepEqual(remember(['router'], '  laptop '), ['laptop', 'router']);
    assert.deepEqual(remember([], 'laptop'), ['laptop']);
    assert.deepEqual(remember(null, 'laptop'), ['laptop']);
  });

  it('drops an earlier copy in any case', () => {
    assert.deepEqual(remember(['router', 'Laptop', 'switch'], 'laptop'), ['laptop', 'router', 'switch']);
  });

  it('keeps at most max, five by default', () => {
    assert.deepEqual(remember(['a', 'b', 'c', 'd', 'e'], 'f'), ['f', 'a', 'b', 'c', 'd']);
    assert.deepEqual(remember(['a', 'b'], 'c', { max: 2 }), ['c', 'a']);
    assert.deepEqual(remember(['a', 'b'], 'c', { max: 0 }), ['c']);
  });

  it('ignores an empty search and what is not text', () => {
    assert.deepEqual(remember(['a', 'b'], '   '), ['a', 'b']);
    assert.deepEqual(remember(['a', 7, null, ' ', 'b'], ''), ['a', 'b']);
    assert.deepEqual(remember('nonsense', 'x'), ['x']);
  });
});

describe('DS.search.create', () => {
  it('returns a controller that does nothing without parts', () => {
    const made = create({ querySelector: () => null, getAttribute: () => null, addEventListener() {} });
    assert.deepEqual(made.get(), { value: '', count: null, recent: [] });
    made.set({ count: 3 });
    assert.equal(made.get().count, 3);
    made.remember('x');
    assert.equal(typeof made.on('nonsense', () => {}), 'function');
    made.destroy();
    made.destroy();
  });
});
