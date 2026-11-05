/**
 * DS.loadingoverlay without a DOM: its registration and the hold arithmetic.
 * The behaviour in a browser is loadingoverlay.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as overlay from './loadingoverlay.js';
import { runtime } from '../../js/core.js';

describe('DS.loadingoverlay', () => {
  it('registers its behaviour by its attribute', () => {
    const spec = runtime.state('core').specs.get('loadingoverlay');
    assert.equal(spec.attribute, 'data-ds-loadingoverlay');
    assert.equal(typeof spec.init, 'function');
  });

  it('holds a visible overlay for the minimum time, and never one that never showed', () => {
    const timing = { delay: 200, minVisible: 450 };
    // Hidden before the delay passed: it never showed, so nothing to hold.
    assert.equal(overlay.holdMs(1000, 1150, timing), 0);
    // Visible for 100ms: 350ms more.
    assert.equal(overlay.holdMs(1000, 1300, timing), 350);
    // Visible long enough already.
    assert.equal(overlay.holdMs(1000, 2000, timing), 0);
  });

  it('hides nothing in a region without an overlay', async () => {
    const region = { children: [] };
    assert.equal(await overlay.hide(region), undefined);
  });
});
