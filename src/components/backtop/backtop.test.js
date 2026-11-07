/**
 * DS.backtop: when the button shows. The scrolling and the focus run in real
 * engines: backtop.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { shown, create } from './backtop.js';

describe('DS.backtop.shown', () => {
  it('shows past the threshold and hides under half of it', () => {
    assert.equal(shown(0, { after: 600 }), false);
    assert.equal(shown(601, { after: 600 }), true);
    assert.equal(shown(299, { after: 600, shown: true }), false);
  });

  it('keeps what it was between half the threshold and the threshold (no flicker at the line)', () => {
    assert.equal(shown(450, { after: 600, shown: true }), true);
    assert.equal(shown(450, { after: 600, shown: false }), false);
    assert.equal(shown(600, { after: 600 }), false);
    assert.equal(shown(300, { after: 600, shown: true }), true);
  });

  it('shows at any scroll with a threshold of 0', () => {
    assert.equal(shown(1, { after: 0 }), true);
    assert.equal(shown(0, { after: 0, shown: true }), true);
  });
});

describe('DS.backtop.create', () => {
  it('is a function of an element and options', () => {
    assert.equal(typeof create, 'function');
    assert.equal(create.length, 1);
  });
});
