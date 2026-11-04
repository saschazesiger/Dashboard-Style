import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { create } from './fanout.js';

describe('fanout', () => {
  it('counts through its controller', () => {
    const listeners = new Set();
    const el = { addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn), dispatchEvent: () => true, textContent: '' };
    const controller = create(el);
    assert.equal(controller.get(), 0);
    controller.set(2);
    assert.equal(controller.get(), 2);
    controller.destroy();
    assert.equal(listeners.size, 0);
  });
});
