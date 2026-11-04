/**
 * The geometry of the shared placer (src/js/position.js): the placement rules
 * of 2.x, each as the numbers the menu, the combobox list and the tooltip
 * relied on, and the sides and options 3.0 adds. No DOM.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computePlacement, round } from '../src/js/position.js';

const VIEW = { left: 0, top: 0, right: 1000, bottom: 800 };
const rectAt = (left, top, width = 100, height = 40) => ({ left, top, right: left + width, bottom: top + height });
const MENU = { offset: 4, padding: 8, crossFlip: true };

describe('computePlacement: as a menu', () => {
  it('opens below the trigger from its start edge', () => {
    const at = computePlacement(rectAt(100, 100), { width: 200, height: 300 }, VIEW, MENU);
    assert.deepEqual([at.x, at.y, at.side, at.flipped], [100, 144, 'bottom', false]);
    assert.equal(at.length, 300);
  });

  it('flips above when it does not fit below and there is more room above, capped to that room', () => {
    const at = computePlacement(rectAt(100, 600), { width: 200, height: 700 }, VIEW, MENU);
    assert.equal(at.side, 'top');
    assert.equal(at.flipped, true);
    // Room above: 600 - 4 - 0 - 8; it never covers its trigger.
    assert.equal(at.room, 588);
    assert.equal(at.length, 588);
    assert.equal(at.y, 600 - 4 - 588);
  });

  it('stays below when the side above has less room, capped too', () => {
    const at = computePlacement(rectAt(100, 200), { width: 200, height: 900 }, VIEW, MENU);
    assert.equal(at.side, 'bottom');
    assert.equal(at.room, 800 - 8 - 240 - 4);
    assert.equal(at.length, at.room);
  });

  it('aligns with the trigger\'s end when the start edge would leave the viewport, and stays inside either way', () => {
    assert.equal(computePlacement(rectAt(850, 100), { width: 200, height: 100 }, VIEW, MENU).x, 750);
    // Neither edge fits: the wanted one, shifted inside.
    assert.equal(computePlacement(rectAt(500, 100), { width: 990, height: 100 }, VIEW, MENU).x, 8);
  });

  it('mirrors the alignment in right-to-left', () => {
    assert.equal(computePlacement(rectAt(500, 100), { width: 200, height: 100 }, VIEW, { ...MENU, rtl: true }).x, 400);
    assert.equal(computePlacement(rectAt(10, 100), { width: 200, height: 100 }, VIEW, { ...MENU, rtl: true }).x, 10);
  });
});

describe('computePlacement: as a tooltip', () => {
  const TIP = { align: 'center', offset: 8, padding: 8, flip: 'fits', size: false };

  it('centres on the trigger, below it, shifted inside the viewport', () => {
    assert.deepEqual(computePlacement(rectAt(400, 100), { width: 100, height: 30 }, VIEW, TIP).x, 400);
    assert.equal(computePlacement(rectAt(0, 100), { width: 200, height: 30 }, VIEW, TIP).x, 8);
    assert.equal(computePlacement(rectAt(950, 100, 50), { width: 200, height: 30 }, VIEW, TIP).x, 1000 - 200 - 8);
  });

  it('flips above only when it fits there, and is never capped', () => {
    const above = computePlacement(rectAt(400, 760), { width: 100, height: 30 }, VIEW, TIP);
    assert.equal(above.side, 'top');
    assert.equal(above.y, 760 - 8 - 30);
    const tall = computePlacement(rectAt(400, 20), { width: 100, height: 900 }, VIEW, TIP);
    assert.equal(tall.side, 'bottom', 'fits on neither side: it stays');
    assert.equal(tall.length, 900);
  });
});

describe('computePlacement: as a combobox list', () => {
  it('stays in the bounds a clipping box gives, and does not shift', () => {
    const bounds = { left: 0, top: 300, right: 1000, bottom: 500 };
    const at = computePlacement(rectAt(100, 420), { width: 200, height: 150 }, bounds, { offset: 4, padding: 4, shift: false });
    assert.equal(at.side, 'top');
    assert.equal(at.room, 420 - 4 - 300 - 4);
    assert.equal(at.length, 112);
    assert.equal(at.x, 100);
  });
});

describe('computePlacement: the options of 3.0', () => {
  it('prefers a side: top, then flips to the bottom', () => {
    assert.equal(computePlacement(rectAt(100, 400), { width: 100, height: 100 }, VIEW, { side: 'top', offset: 4 }).side, 'top');
    assert.equal(computePlacement(rectAt(100, 20), { width: 100, height: 100 }, VIEW, { side: 'top', offset: 4 }).side, 'bottom');
  });

  it('places beside the anchor on the inline sides, mirrored in right-to-left, and aligns on the block axis', () => {
    const end = computePlacement(rectAt(100, 100), { width: 80, height: 60 }, VIEW, { side: 'end', offset: 4 });
    assert.deepEqual([end.x, end.y, end.side], [204, 100, 'end']);
    const start = computePlacement(rectAt(100, 100), { width: 80, height: 60 }, VIEW, { side: 'end', offset: 4, rtl: true });
    assert.deepEqual([start.x, start.side], [16, 'end']);
    const flipped = computePlacement(rectAt(900, 100), { width: 80, height: 60 }, VIEW, { side: 'end', offset: 4, padding: 8 });
    assert.deepEqual([flipped.x, flipped.side], [816, 'start']);
    assert.equal(computePlacement(rectAt(100, 100), { width: 80, height: 60 }, VIEW, { side: 'end', align: 'center' }).y, 90);
    assert.equal(computePlacement(rectAt(100, 100), { width: 80, height: 60 }, VIEW, { side: 'end', align: 'end' }).y, 80);
  });

  it('never flips with flip: false', () => {
    const at = computePlacement(rectAt(100, 760), { width: 100, height: 300 }, VIEW, { flip: false, offset: 4 });
    assert.equal(at.side, 'bottom');
    assert.equal(at.flipped, false);
  });

  it('says where the arrow goes: the anchor\'s centre along the box, kept from its corners', () => {
    assert.equal(computePlacement(rectAt(100, 100), { width: 200, height: 50 }, VIEW, {}).arrow, 50);
    assert.equal(computePlacement(rectAt(0, 100, 20), { width: 200, height: 50 }, VIEW, { arrowPadding: 16, align: 'start', padding: 8 }).arrow, 16);
  });
});

describe('round', () => {
  it('keeps two decimals', () => {
    assert.equal(round(12.3456), 12.35);
    assert.equal(round(10), 10);
  });
});
