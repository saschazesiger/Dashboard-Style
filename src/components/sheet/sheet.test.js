/**
 * DS.sheet without a DOM: its registration and controller. The behaviour in a
 * browser is sheet.spec.js and test/browser/overlay.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as sheet from './sheet.js';
import { runtime } from '../../js/core.js';

describe('DS.sheet', () => {
  it('registers its behaviour by its attribute', () => {
    const spec = runtime.state('core').specs.get('sheet');
    assert.equal(spec.attribute, 'data-ds-sheet');
    assert.equal(typeof spec.init, 'function');
  });

  it('makes the controller of every overlay; open() out of the document does nothing', async () => {
    const element = { isConnected: false, addEventListener() {}, removeEventListener() {} };
    const control = sheet.create(element);
    assert.equal(control.get(), false);
    assert.equal(await sheet.open(element), undefined);
    assert.equal(control.get(), false);
  });
});

describe('DS.sheet widths', () => {
  const bounds = { min: 280, max: 900 };

  it('clamps a width to its bounds in whole pixels', () => {
    assert.equal(sheet.clampWidth(100, bounds), 280);
    assert.equal(sheet.clampWidth(1200, bounds), 900);
    assert.equal(sheet.clampWidth(480.6, bounds), 481);
    assert.equal(sheet.MIN_WIDTH, 280);
  });

  it('widens towards the side the separator sits on', () => {
    // A separator on the panel's left edge: the pointer going left (negative) widens.
    assert.equal(sheet.dragWidth(400, -50, 'left', bounds), 450);
    assert.equal(sheet.dragWidth(400, 50, 'left', bounds), 350);
    // On its right edge (a docked panel at the start in a right-to-left page): the other way.
    assert.equal(sheet.dragWidth(400, 50, 'right', bounds), 450);
    assert.equal(sheet.dragWidth(400, -500, 'left', bounds), 900);
    assert.equal(sheet.dragWidth(400, 500, 'left', bounds), 280);
  });

  it('makes no resizer for an element without a panel', () => {
    const element = { matches: () => false, querySelector: () => null, closest: () => null };
    assert.equal(sheet.resizable(element), null);
  });
});
