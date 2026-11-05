/**
 * DS.banner's ordering: the priority given, else the tone's rank; equal
 * ones keep their order.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { order, priorityOf } from './banner.js';

describe('DS.banner.priorityOf()', () => {
  it('takes a number given, else the tone, else the plain alert', () => {
    assert.equal(priorityOf({ priority: 90 }), 90);
    assert.equal(priorityOf({ priority: '7', tone: 'error' }), 7);
    assert.ok(priorityOf({ tone: 'error' }) > priorityOf({ tone: 'warning' }));
    assert.ok(priorityOf({ tone: 'warning' }) > priorityOf({ tone: 'info' }));
    assert.ok(priorityOf({ tone: 'info' }) > priorityOf({ tone: 'primary' }));
    assert.ok(priorityOf({ tone: 'primary' }) > priorityOf({}));
    assert.equal(priorityOf({}), priorityOf({ tone: 'neutral' }));
    assert.ok(priorityOf({}) > priorityOf({ tone: 'success' }));
    assert.equal(priorityOf({ priority: 'soon', tone: 'error' }), priorityOf({ tone: 'error' }), 'a priority that is no number counts as none');
    assert.equal(priorityOf(null), priorityOf({}));
  });
});

describe('DS.banner.order()', () => {
  it('puts the highest first and keeps equal ones in their order', () => {
    const list = [
      { id: 'a', tone: 'info' },
      { id: 'b', tone: 'error' },
      { id: 'c' },
      { id: 'd', tone: 'info' },
      { id: 'e', tone: 'success', priority: 100 },
    ];
    assert.deepEqual(order(list).map((banner) => banner.id), ['e', 'b', 'a', 'd', 'c']);
    assert.deepEqual(list.map((banner) => banner.id), ['a', 'b', 'c', 'd', 'e'], 'the given list stays');
    assert.deepEqual(order([]), []);
  });
});
