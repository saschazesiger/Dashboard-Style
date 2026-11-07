/**
 * DS.expandable: when a text is longer than its lines. The browser side
 * (the toggle, the clamp, resizing) is expandable.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { overflows } from './expandable.js';

describe('DS.expandable.overflows', () => {
  it('is true past the lines, with half a line of slack', () => {
    assert.equal(overflows(60, 20, 3), false);
    assert.equal(overflows(70, 20, 3), false);
    assert.equal(overflows(71, 20, 3), true);
    assert.equal(overflows(200, 20, 3), true);
  });

  it('is false without a line height or lines', () => {
    assert.equal(overflows(200, 0, 3), false);
    assert.equal(overflows(200, 20, 0), false);
    assert.equal(overflows(200, NaN, 3), false);
  });
});
