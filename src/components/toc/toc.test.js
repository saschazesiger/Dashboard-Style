/**
 * DS.toc: which section is current, from where the sections lie. The
 * observers and the jumps run in real engines: toc.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { current } from './toc.js';

describe('DS.toc.current', () => {
  const view = { line: 200, bottom: 800 };

  it('is the last section whose top passed the reading line', () => {
    assert.equal(current([0, 400, 900], view), 0);
    assert.equal(current([-300, 150, 700], view), 1);
    assert.equal(current([-900, -500, 200], view), 2);
    assert.equal(current([-900, -500, 201], view), 1);
  });

  it('is the first section before any reached the line, and none without sections', () => {
    assert.equal(current([300, 900], view), 0);
    assert.equal(current([], view), -1);
  });

  it('at the end of the scroll: the last section whose top shows, even below the line', () => {
    assert.equal(current([-900, 100, 500, 700], { ...view, atEnd: true }), 3);
    assert.equal(current([-900, 100, 500, 900], { ...view, atEnd: true }), 2);
    assert.equal(current([-900, 100, 500, 700], view), 1);
  });

  it('keeps a pinned section (a link chose it) while its top shows', () => {
    assert.equal(current([-900, 100, 500, 700], { ...view, pinned: 2 }), 2);
    assert.equal(current([-900, 100, 500, 700], { ...view, atEnd: true, pinned: 2 }), 2);
    assert.equal(current([-1900, -1100, -900, -700], { ...view, pinned: 1 }), 3);
    assert.equal(current([0, 400], { ...view, pinned: 5 }), 0);
  });
});
