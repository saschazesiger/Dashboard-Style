/**
 * DS.bottomsheet without a DOM: its registration, the detents and where a
 * release ends. The behaviour in a browser is bottomsheet.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as sheet from './bottomsheet.js';
import { runtime, t } from '../../js/core.js';

describe('DS.bottomsheet', () => {
  it('registers its behaviour by its attribute, and hears a change of its detents', () => {
    const spec = runtime.state('core').specs.get('bottomsheet');
    assert.equal(spec.attribute, 'data-ds-bottomsheet');
    assert.deepEqual(spec.attributes, ['data-ds-bottomsheet-detents']);
  });

  it('reads the detents: fractions in (0, 1], sorted, once each; none is the full height', () => {
    assert.deepEqual(sheet.parseDetents('0.5 1'), [0.5, 1]);
    assert.deepEqual(sheet.parseDetents('1, 0.25,0.5 0.5'), [0.25, 0.5, 1]);
    assert.deepEqual(sheet.parseDetents('0 2 -1 x'), [1]);
    assert.deepEqual(sheet.parseDetents(null), [1]);
  });

  it('settles a release at the nearest detent its throw reaches, or closes below half the smallest', () => {
    const detents = [0.4, 1];
    assert.equal(sheet.settleDetent(detents, 0.45, 0, 250), 0);
    assert.equal(sheet.settleDetent(detents, 0.8, 0, 250), 1);
    // A quick flick up from the low detent reaches the full height.
    assert.equal(sheet.settleDetent(detents, 0.5, 0.002, 250), 1);
    // Thrown down past half of the smallest: it closes.
    assert.equal(sheet.settleDetent(detents, 0.3, -0.001, 250), -1);
    assert.equal(sheet.settleDetent(detents, 0.15, 0, 250), -1);
  });

  it('says its height in the system\'s words', () => {
    assert.equal(t('sheetDetent', { percent: 50 }), 'Sheet at 50 percent of the screen');
  });
});
