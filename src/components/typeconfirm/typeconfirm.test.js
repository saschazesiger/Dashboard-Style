/**
 * DS.typeconfirm: the match (a pure function) and a controller without
 * parts. The browser side is typeconfirm.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { create, matches } from './typeconfirm.js';

describe('DS.typeconfirm.matches', () => {
  it('is exact but for the outer spaces', () => {
    assert.equal(matches('LAPTOP-0042', 'LAPTOP-0042'), true);
    assert.equal(matches('  LAPTOP-0042 ', 'LAPTOP-0042'), true);
    assert.equal(matches('laptop-0042', 'LAPTOP-0042'), false);
    assert.equal(matches('LAPTOP-004', 'LAPTOP-0042'), false);
    assert.equal(matches('LAPTOP - 0042', 'LAPTOP-0042'), false);
  });

  it('ignores the case when asked', () => {
    assert.equal(matches('laptop-0042', 'LAPTOP-0042', { caseInsensitive: true }), true);
  });

  it('never matches an empty name', () => {
    assert.equal(matches('', ''), false);
    assert.equal(matches('  ', ' '), false);
    assert.equal(matches(null, undefined), false);
  });
});

describe('DS.typeconfirm.create', () => {
  it('returns a controller that never matches without a field', () => {
    const attrs = { 'data-ds-typeconfirm': 'LAPTOP-0042' };
    const root = {
      localName: 'div',
      querySelector: () => null,
      closest: () => null,
      getAttribute: (name) => attrs[name] ?? null,
      setAttribute: (name, value) => { attrs[name] = value; },
      dispatchEvent: () => true,
    };
    const made = create(root);
    assert.deepEqual(made.get(), { name: 'LAPTOP-0042', typed: '', match: false });
    made.set('ROUTER-7');
    assert.equal(made.get().name, 'ROUTER-7');
    made.reset();
    assert.equal(typeof made.on('nonsense', () => {}), 'function');
    made.destroy();
    made.destroy();
  });
});
