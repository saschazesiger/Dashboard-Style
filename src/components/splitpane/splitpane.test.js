/**
 * DS.splitpane: the pure parts, the lengths the engines compute and the
 * size a key or a drag gives a pane (the APG window splitter's keys, the
 * limits, the collapse). The browser side is splitpane.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { nextSize, toPixels } from './splitpane.js';

describe('DS.splitpane.toPixels', () => {
  it('reads px and percentages of the total', () => {
    assert.equal(toPixels('320px', 1000), 320);
    assert.equal(toPixels('12.5px', 1000), 12.5);
    assert.equal(toPixels('30%', 1000), 300);
    assert.equal(toPixels('0%', 1000), 0);
    assert.equal(toPixels(' 50% ', 640), 320);
    assert.equal(toPixels('.5px', 10), 0.5);
  });

  it('reads the calc() a mixed length computes to, in either order', () => {
    assert.equal(toPixels('calc(20% + 16px)', 1000), 216);
    assert.equal(toPixels('calc(20% - 16px)', 1000), 184);
    assert.equal(toPixels('calc(16px + 20%)', 1000), 216);
    assert.equal(toPixels('calc(100px - 5%)', 1000), 50);
  });

  it('is null for what names no length it can resolve', () => {
    for (const text of ['', 'none', 'auto', null, undefined, '20rem', 'calc(10px + 4px)', 'var(--x)', 'min(20%, 300px)']) {
      assert.equal(toPixels(text, 1000), null, String(text));
    }
  });
});

describe('DS.splitpane.nextSize', () => {
  const pane = { size: 300, min: 200, max: 600 };

  it('moves by the step on the arrows of its axis, four times as far with Shift', () => {
    assert.deepEqual(nextSize(pane, { key: 'ArrowRight' }), { size: 316, collapsed: false });
    assert.deepEqual(nextSize(pane, { key: 'ArrowLeft' }), { size: 284, collapsed: false });
    assert.deepEqual(nextSize(pane, { key: 'ArrowRight', shift: true }), { size: 364, collapsed: false });
    assert.deepEqual(nextSize({ ...pane, step: 10 }, { key: 'ArrowRight' }), { size: 310, collapsed: false });
    assert.equal(nextSize(pane, { key: 'ArrowDown' }), null, 'side by side: the vertical arrows do nothing');
    assert.deepEqual(nextSize(pane, { key: 'ArrowDown', axis: 'y' }), { size: 316, collapsed: false });
    assert.deepEqual(nextSize(pane, { key: 'ArrowUp', axis: 'y' }), { size: 284, collapsed: false });
    assert.equal(nextSize(pane, { key: 'ArrowRight', axis: 'y' }), null);
  });

  it('turns the arrows round for a pane after its divider', () => {
    assert.deepEqual(nextSize(pane, { key: 'ArrowRight', sign: -1 }), { size: 284, collapsed: false });
    assert.deepEqual(nextSize(pane, { key: 'ArrowLeft', sign: -1 }), { size: 316, collapsed: false });
  });

  it('stays within the limits; Home and End go to them', () => {
    assert.deepEqual(nextSize({ ...pane, size: 205 }, { key: 'ArrowLeft' }), { size: 200, collapsed: false });
    assert.deepEqual(nextSize({ ...pane, size: 596 }, { key: 'ArrowRight' }), { size: 600, collapsed: false });
    assert.deepEqual(nextSize(pane, { key: 'Home' }), { size: 200, collapsed: false });
    assert.deepEqual(nextSize(pane, { key: 'End' }), { size: 600, collapsed: false });
    // No room for the minimum: the minimum holds.
    assert.deepEqual(nextSize({ size: 300, min: 200, max: 150 }, { key: 'End' }), { size: 200, collapsed: false });
  });

  it('collapses and restores a collapsible pane on Enter, keeping the size it opens to', () => {
    assert.equal(nextSize(pane, { key: 'Enter' }), null, 'not collapsible');
    const open = { ...pane, collapsible: true };
    assert.deepEqual(nextSize(open, { key: 'Enter' }), { size: 300, collapsed: true });
    assert.deepEqual(nextSize({ ...open, collapsed: true }, { key: 'Enter' }), { size: 300, collapsed: false });
  });

  it('collapses past the minimum by a key, and an arrow outwards opens it at the minimum', () => {
    const open = { ...pane, size: 200, collapsible: true };
    assert.deepEqual(nextSize(open, { key: 'ArrowLeft' }), { size: 200, collapsed: true });
    assert.deepEqual(nextSize({ ...pane, size: 200 }, { key: 'ArrowLeft' }), { size: 200, collapsed: false }, 'not collapsible: it stops');
    const shut = { ...open, size: 320, collapsed: true };
    assert.deepEqual(nextSize(shut, { key: 'ArrowRight' }), { size: 200, collapsed: false });
    assert.deepEqual(nextSize(shut, { key: 'ArrowLeft' }), { size: 320, collapsed: true });
    assert.deepEqual(nextSize({ size: 0, min: 0, max: 400, collapsible: true, collapsed: true }, { key: 'ArrowRight' }), { size: 16, collapsed: false });
  });

  it('ignores collapsed on a pane that cannot collapse', () => {
    assert.deepEqual(nextSize({ ...pane, collapsed: true }, { key: 'ArrowRight' }), { size: 316, collapsed: false });
  });

  it('follows a drag within the limits and snaps a collapsible pane shut below half its minimum', () => {
    assert.deepEqual(nextSize(pane, { to: 420 }), { size: 420, collapsed: false });
    assert.deepEqual(nextSize(pane, { to: 900 }), { size: 600, collapsed: false });
    assert.deepEqual(nextSize(pane, { to: 20 }), { size: 200, collapsed: false });
    const open = { ...pane, collapsible: true };
    assert.deepEqual(nextSize(open, { to: 120 }), { size: 200, collapsed: false });
    assert.deepEqual(nextSize(open, { to: 99 }), { size: 300, collapsed: true });
  });

  it('does nothing for other keys', () => {
    for (const key of ['a', 'Tab', 'Escape', ' ', 'PageUp']) assert.equal(nextSize(pane, { key }), null, key);
  });
});
