/**
 * DS.tabs: the overflow arithmetic (which tabs stay in a row of a given
 * width). The behaviour on a real DOM is tabs.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fit, create } from './tabs.js';

describe('DS.tabs.fit', () => {
  it('keeps every tab when they fit, gaps and padding counted', () => {
    assert.deepEqual(fit([100, 100, 100], { room: 300 }), [0, 1, 2]);
    assert.deepEqual(fit([100, 100, 100], { room: 308, gap: 4 }), [0, 1, 2]);
    assert.deepEqual(fit([100, 100, 100], { room: 307, gap: 4 }), [0, 1]);
    assert.deepEqual(fit([100, 100, 100], { room: 316, gap: 4, pad: 8 }), [0, 1, 2]);
    assert.deepEqual(fit([100, 100, 100], { room: 315, gap: 4, pad: 8 }), [0, 1]);
  });

  it('keeps the tabs in order while they fit, and stops at the first that does not', () => {
    assert.deepEqual(fit([100, 200, 50, 50], { room: 260 }), [0]);
    assert.deepEqual(fit([80, 80, 80, 80], { room: 250 }), [0, 1, 2]);
  });

  it('keeps the selected tab whatever its place; it pushes the ones before it out', () => {
    assert.deepEqual(fit([100, 100, 100, 100], { room: 250, selected: 3 }), [0, 3]);
    assert.deepEqual(fit([100, 100, 100, 100], { room: 250, selected: 0 }), [0, 1]);
    assert.deepEqual(fit([100, 100, 100, 100], { room: 250, selected: 1 }), [0, 1]);
  });

  it('keeps the selected tab even when it alone is wider than the room; nothing without one', () => {
    assert.deepEqual(fit([400, 100], { room: 200, selected: 0 }), [0]);
    assert.deepEqual(fit([400, 100], { room: 200, selected: 1 }), [1]);
    assert.deepEqual(fit([400, 100], { room: 200 }), []);
    assert.deepEqual(fit([], { room: 200 }), []);
  });
});

describe('DS.tabs.create', () => {
  it('is a function of an element and options', () => {
    assert.equal(typeof create, 'function');
    assert.equal(create.length, 1);
  });
});
