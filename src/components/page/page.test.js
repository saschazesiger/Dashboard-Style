/**
 * DS.page: which actions of a page head fold into the More menu. The
 * condensing and the menu run in real engines: page.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fold, create } from './page.js';

describe('DS.page.fold', () => {
  it('folds nothing while every action fits, gaps counted', () => {
    assert.deepEqual(fold([100, 100], { room: 208, gap: 8, more: 40 }), []);
    assert.deepEqual(fold([], { room: 0 }), []);
  });

  it('folds in order until the rest and the More button fit', () => {
    assert.deepEqual(fold([100, 100, 100], { room: 270, gap: 8, more: 40 }), [0]);
    assert.deepEqual(fold([100, 100, 100], { room: 150, gap: 8, more: 40 }), [0, 1]);
    assert.deepEqual(fold([100, 100, 100], { room: 30, gap: 8, more: 40 }), [0, 1, 2]);
  });

  it('follows the given order: the filled action last', () => {
    assert.deepEqual(fold([80, 80, 120], { room: 260, gap: 8, more: 40, order: [0, 1, 2] }), [0]);
    assert.deepEqual(fold([120, 80, 80], { room: 180, gap: 8, more: 40, order: [1, 2, 0] }), [1, 2]);
  });
});

describe('DS.page.create', () => {
  it('is a function of an element and options', () => {
    assert.equal(typeof create, 'function');
    assert.equal(create.length, 1);
  });
});
