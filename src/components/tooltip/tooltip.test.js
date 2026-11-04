/**
 * DS.tooltip without a DOM: its registration, its empty handle, and that
 * DS.overlay calls it. The behaviour in a browser is tooltip.spec.js,
 * test/browser/toast-tooltip.spec.js and tooltip-touch.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as overlay from '../../js/overlay.js';
import * as tooltip from './tooltip.js';
import { runtime } from '../../js/core.js';

describe('DS.tooltip', () => {
  it('serves every root of DS.init() by a global behaviour', () => {
    assert.equal(typeof runtime.state('core').specs.get('tooltips').global, 'function');
  });

  it('gives an empty handle without a DOM, through either door', () => {
    assert.equal(typeof tooltip.tooltips({}).destroy, 'function');
    assert.equal(typeof overlay.tooltips({}).destroy, 'function');
  });
});
