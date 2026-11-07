/**
 * DS.cite: the card a marker names, and the behaviour's registration. The
 * hover, the press, the keys and the placement are cite.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runtime } from '../../js/core.js';
import { cardOf, create } from './cite.js';

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
    assert.equal(typeof create, 'function');
  });
});
