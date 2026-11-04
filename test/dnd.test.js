/**
 * DS.dnd (src/js/dnd.js) without a DOM: the handle without an element and the
 * strings it speaks. Everything else needs layout and a pointer: it runs in
 * real engines in test/browser/dnd.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { create } from '../src/js/dnd.js';
import { t } from '../src/js/core.js';

describe('DS.dnd', () => {
  it('returns a controller that does nothing without an element', () => {
    const idle = create(null);
    assert.equal(idle.get(), null);
    assert.equal(idle.set({ item: null, index: 0 }), false);
    idle.cancel();
    idle.on('drop', () => {})();
    idle.destroy();
  });

  it('has a default string for every step, with its placeholders', () => {
    const vars = { label: 'Fan', zone: 'To do', position: 2, total: 5 };
    assert.equal(t('dragGrabbed', vars), 'Picked up Fan, position 2 of 5.');
    assert.equal(t('dragMoved', vars), 'Moved Fan to position 2 of 5.');
    assert.equal(t('dragMovedZone', vars), 'Moved Fan to To do, position 2 of 5.');
    assert.equal(t('dragDropped', vars), 'Dropped Fan at position 2 of 5.');
    assert.equal(t('dragDroppedZone', vars), 'Dropped Fan in To do, position 2 of 5.');
    assert.equal(t('dragCancelled', vars), 'Cancelled. Fan is back at position 2 of 5.');
    assert.notEqual(t('dragHint'), 'dragHint');
  });
});
