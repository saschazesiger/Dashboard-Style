/**
 * DS.prioritybar without a DOM: the fold rule (priorities, ties from the
 * end, the More button's room, gaps, children that never fold) and the
 * registration. The browser side is prioritybar.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { plan } from './prioritybar.js';
import { runtime } from '../../js/core.js';
import { read } from '../../../test/helpers.js';

describe('DS.prioritybar.plan', () => {
  it('folds nothing when everything fits, gaps included', () => {
    assert.deepEqual(plan({ widths: [80, 80, 80], available: 248, gap: 4 }), []);
    assert.deepEqual(plan({ widths: [80, 80, 80], available: 247.6, gap: 4 }), [], 'half a pixel of slack');
  });

  it('folds from the end among equals, and makes room for More', () => {
    // 3 x 80 + 2 gaps = 248 > 200; with More (40): 80 + 80 + 40 + 2 gaps = 208 > 200, so two fold.
    assert.deepEqual(plan({ widths: [80, 80, 80], available: 200, gap: 4, more: 40 }), [1, 2]);
    assert.deepEqual(plan({ widths: [80, 80, 80], available: 220, gap: 4, more: 40 }), [2]);
  });

  it('folds the lowest priority first, whatever its place', () => {
    assert.deepEqual(plan({ widths: [80, 96, 72], priorities: [2, 0, 0], available: 200, gap: 4, more: 40 }), [1, 2]);
    assert.deepEqual(plan({ widths: [80, 80, 80], priorities: [0, 5, 1], available: 220, gap: 4, more: 40 }), [0]);
  });

  it('counts the children that never fold, and folds everything when even More barely fits', () => {
    assert.deepEqual(plan({ widths: [80, 80], available: 200, gap: 0, more: 40, pinned: 60, pinnedCount: 1 }), [1]);
    assert.deepEqual(plan({ widths: [80, 80], available: 30, more: 40 }), [0, 1]);
  });
});

describe('DS.prioritybar', () => {
  it('registers its behaviour by its attribute', () => {
    const spec = runtime.state('core').specs.get('prioritybar');
    assert.equal(spec.attribute, 'data-ds-prioritybar');
    assert.equal(typeof spec.init, 'function');
  });

  it('names its strings through t() and no timing of its own', () => {
    const source = read('src/components/prioritybar/prioritybar.js').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.match(source, /t\('moreActions'\)/);
    assert.doesNotMatch(source, /\b\d+ms\b|setTimeout/);
  });
});
