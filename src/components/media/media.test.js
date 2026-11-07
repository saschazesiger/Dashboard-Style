/**
 * DS.media.between: the range of Shift, on plain lists (no DOM in Node). The
 * controller (keys, focus, checkboxes) is covered in the browser
 * (media.spec.js).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { between } from './media.js';

describe('DS.media.between', () => {
  const items = ['a', 'b', 'c', 'd', 'e'];

  it('gives the items from one to the other, both included, in list order', () => {
    assert.deepEqual(between(items, 'b', 'd'), ['b', 'c', 'd']);
    assert.deepEqual(between(items, 'd', 'b'), ['b', 'c', 'd'], 'backwards too');
    assert.deepEqual(between(items, 'a', 'e'), items);
  });

  it('gives one item when both ends are the same', () => {
    assert.deepEqual(between(items, 'c', 'c'), ['c']);
  });

  it('gives the target alone without a start in the list, nothing without a target', () => {
    assert.deepEqual(between(items, 'x', 'c'), ['c']);
    assert.deepEqual(between(items, null, 'c'), ['c']);
    assert.deepEqual(between(items, 'a', 'x'), []);
  });

  it('works on any values, objects included', () => {
    const one = {};
    const two = {};
    const three = {};
    assert.deepEqual(between([one, two, three], three, two), [two, three]);
  });
});
