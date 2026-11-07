/**
 * DS.steps: what a step announces. The clicks and aria-current run in real
 * engines: steps.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { position, create } from './steps.js';

describe('DS.steps.position', () => {
  it('is 1-based, with the total and the trimmed label', () => {
    assert.deepEqual(position(0, 4, ' Device '), { position: 1, total: 4, label: 'Device' });
    assert.deepEqual(position(3, 4, 'Review'), { position: 4, total: 4, label: 'Review' });
  });

  it('clamps an index outside the list, and is 0 of 0 without steps', () => {
    assert.deepEqual(position(9, 4, 'x'), { position: 4, total: 4, label: 'x' });
    assert.deepEqual(position(-2, 4, 'x'), { position: 1, total: 4, label: 'x' });
    assert.deepEqual(position(0, 0, ''), { position: 0, total: 0, label: '' });
  });
});

describe('DS.steps.create', () => {
  it('is a function of an element', () => {
    assert.equal(typeof create, 'function');
    assert.equal(create.length, 1);
  });
});
