/**
 * DS.inlineedit: what a save does (a pure function) and a controller
 * without parts. The browser side is inlineedit.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { create, decide } from './inlineedit.js';

describe('DS.inlineedit.decide', () => {
  it('closes when nothing changed', () => {
    assert.deepEqual(decide('LAPTOP-0042', 'LAPTOP-0042'), { action: 'close', value: 'LAPTOP-0042' });
    assert.deepEqual(decide('', null), { action: 'close', value: '' });
  });

  it('saves a change, an added space too', () => {
    assert.deepEqual(decide('LAPTOP-0043', 'LAPTOP-0042'), { action: 'save', value: 'LAPTOP-0043' });
    assert.deepEqual(decide('LAPTOP-0042 ', 'LAPTOP-0042'), { action: 'save', value: 'LAPTOP-0042 ' });
    assert.deepEqual(decide('', 'x'), { action: 'save', value: '' });
  });

  it('compares and saves without the outer spaces with trim', () => {
    assert.deepEqual(decide('  LAPTOP-0042 ', 'LAPTOP-0042', { trim: true }), { action: 'close', value: 'LAPTOP-0042' });
    assert.deepEqual(decide(' Room B ', 'Room A', { trim: true }), { action: 'save', value: 'Room B' });
  });
});

describe('DS.inlineedit.create', () => {
  it('returns a controller that does nothing without parts', async () => {
    const root = {
      attrs: {},
      querySelector: () => null,
      getAttribute(name) { return this.attrs[name] ?? null; },
      setAttribute(name, value) { this.attrs[name] = value; },
      removeAttribute(name) { delete this.attrs[name]; },
      hasAttribute(name) { return name in this.attrs; },
      addEventListener() {},
    };
    const made = create(root);
    assert.deepEqual(made.get(), { value: '', editing: false, busy: false });
    made.edit();
    await made.save();
    made.cancel();
    assert.equal(root.getAttribute('data-state'), 'view');
    assert.equal(typeof made.on('nonsense', () => {}), 'function');
    made.destroy();
    made.destroy();
  });
});
