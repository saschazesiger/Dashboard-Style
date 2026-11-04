/**
 * DS.badge: the figure of a count and its controller, on a stand-in element
 * (no DOM in Node). The browser side is badge.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { create, format } from './badge.js';

function stub(text = '') {
  return {
    textContent: text,
    hidden: false,
    attributes: {},
    getAttribute(name) { return this.attributes[name] ?? null; },
    dispatchEvent() { return true; },
  };
}

describe('DS.badge.format', () => {
  it('shows the count up to the maximum, then the maximum and a plus', () => {
    assert.equal(format(3), '3');
    assert.equal(format(99), '99');
    assert.equal(format(100), '99+');
    assert.equal(format(128, 9), '9+');
    assert.equal(format('12'), '12');
    assert.equal(format(2.9), '2');
  });

  it('is empty at zero, below zero and for what is no number', () => {
    for (const value of [0, -4, '', 'many', NaN, undefined, null]) assert.equal(format(value), '', String(value));
  });
});

describe('DS.badge.create', () => {
  it('writes the figure at once and silently', () => {
    const el = stub();
    const badge = create(el, { value: 128 });
    assert.equal(el.textContent, '99+');
    assert.equal(badge.get(), 128);
  });

  it('changes a figure at once, reports the change, and stops reporting after unsubscribing', () => {
    const el = stub();
    const badge = create(el, { value: 3, max: 9 });
    const seen = [];
    const off = badge.on('change', (detail) => seen.push(detail));
    badge.set(4);
    assert.equal(el.textContent, '4');
    badge.set(12);
    assert.equal(el.textContent, '9+');
    assert.deepEqual(seen, [{ value: 4, text: '4' }, { value: 12, text: '9+' }]);
    badge.set(12);
    assert.equal(seen.length, 2, 'no change, no event');
    off();
    badge.set(5);
    assert.equal(seen.length, 2);
  });

  it('listens for nothing but change', () => {
    const badge = create(stub(), { value: 1 });
    const off = badge.on('other', () => assert.fail('never called'));
    assert.equal(typeof off, 'function');
    off();
    badge.set(2);
  });
});
