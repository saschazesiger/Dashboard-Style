/**
 * DS.labelgroup.visibleCount: how many tags fit on the line. The browser
 * side (measuring, the popup, the keys) is labelgroup.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { visibleCount } from './labelgroup.js';

describe('DS.labelgroup.visibleCount', () => {
  it('keeps every tag when all fit without the button', () => {
    assert.equal(visibleCount([60, 80, 70], 218, 40, 4), 3);
    assert.equal(visibleCount([60, 80, 70], 500, 40, 4), 3);
  });

  it('keeps as many as fit beside the button', () => {
    // 60 + 4 + 80 + 4 + 40 = 188
    assert.equal(visibleCount([60, 80, 70], 200, 40, 4), 2);
    assert.equal(visibleCount([60, 80, 70], 187, 40, 4), 1);
  });

  it('keeps at least one, which may end in an ellipsis', () => {
    assert.equal(visibleCount([300, 80], 100, 40, 4), 1);
  });

  it('keeps at most max, and the button then shows', () => {
    assert.equal(visibleCount([10, 10, 10, 10], 500, 40, 4, 2), 2);
    assert.equal(visibleCount([10, 10], 500, 40, 4, 2), 2);
    assert.equal(visibleCount([10, 10, 10], 500, 40, 4, 0), 1);
  });

  it('gives none for no tags', () => {
    assert.equal(visibleCount([], 100, 40, 4), 0);
  });
});
