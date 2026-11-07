/**
 * DS.cite: the card a marker names, and the behaviour's registration. The
 * hover, the press, the keys and the placement are cite.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runtime } from '../../js/core.js';
import { cardOf, create } from './cite.js';

/**
 * A stand-in element that records its listeners: one is live until its
 * signal aborts (one without a signal stays for good).
 */
function fakeElement(attributes = {}, extra = {}) {
  const added = [];
  const attrs = new Map(Object.entries(attributes));
  const view = { setTimeout: () => 0, clearTimeout() {}, addEventListener() {} };
  return {
    live: () => added.filter((entry) => !entry.signal?.aborted).map((entry) => entry.type),
    ownerDocument: { defaultView: view, activeElement: null, getElementById: () => null },
    addEventListener: (type, fn, options) => added.push({ type, signal: options?.signal }),
    getAttribute: (name) => (attrs.has(name) ? attrs.get(name) : null),
    hasAttribute: (name) => attrs.has(name),
    setAttribute: (name, value) => attrs.set(name, String(value)),
    removeAttribute: (name) => attrs.delete(name),
    querySelector: () => null,
    querySelectorAll: () => [],
    ...extra,
  };
}

const marker = (id, found) => ({
  getAttribute: (name) => (name === 'aria-controls' ? id : null),
  getRootNode: () => ({ getElementById: (asked) => (asked === id.trim() ? found : null) }),
  ownerDocument: { getElementById: () => null },
});

describe('DS.cite.cardOf', () => {
  it('finds the element aria-controls names, in the marker\'s root', () => {
    const card = { id: 'src-1-card' };
    assert.equal(cardOf(marker(' src-1-card ', card)), card);
  });

  it('gives null without a name, a marker or a match', () => {
    assert.equal(cardOf(marker('', {})), null);
    assert.equal(cardOf(marker('src-2', null)), null);
    assert.equal(cardOf(null), null);
    assert.equal(cardOf(undefined), null);
  });
});

describe('DS.cite registration', () => {
  it('defines the behaviour with its attribute and a delegated press outside', () => {
    const spec = runtime.state('core').specs.get('cite');
    assert.equal(spec.attribute, 'data-ds-cite');
    assert.equal(typeof spec.global, 'function');
  });
});

describe('DS.cite.create', () => {
  const pair = (card) => fakeElement({ 'aria-controls': 'src-card' }, { getRootNode: () => ({ getElementById: () => card }) });

  it('binds the marker until destroy(), and the card until the last marker that uses it goes', () => {
    const card = fakeElement();
    const one = pair(card);
    const two = pair(card);
    const first = create(one);
    const second = create(two);
    assert.deepEqual(one.live().sort(), ['click', 'pointerenter', 'pointerleave']);
    assert.equal(one.getAttribute('aria-expanded'), 'false');
    // Bound once, whatever the markers.
    assert.deepEqual(card.live().sort(), ['keydown', 'pointerenter', 'pointerleave']);
    first.destroy();
    assert.deepEqual(one.live(), []);
    assert.equal(card.live().length, 3);
    second.destroy();
    assert.deepEqual(two.live(), []);
    assert.deepEqual(card.live(), []);
    // A new marker binds it again.
    const third = create(pair(card));
    assert.equal(card.live().length, 3);
    third.destroy();
    assert.deepEqual(card.live(), []);
  });
});
