/**
 * DS.tearsheet without a DOM: its registration and the step arithmetic.
 * The behaviour in a browser is tearsheet.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as tearsheet from './tearsheet.js';
import { runtime, t } from '../../js/core.js';

describe('DS.tearsheet', () => {
  it('registers its behaviour by its attribute', () => {
    const spec = runtime.state('core').specs.get('tearsheet');
    assert.equal(spec.attribute, 'data-ds-tearsheet');
    assert.equal(typeof spec.init, 'function');
  });

  it('keeps a step inside the flow', () => {
    assert.equal(tearsheet.stepIndex(2, 4), 2);
    assert.equal(tearsheet.stepIndex(-1, 4), 0);
    assert.equal(tearsheet.stepIndex(9, 4), 3);
    assert.equal(tearsheet.stepIndex(1.7, 4), 1);
    assert.equal(tearsheet.stepIndex(Number.NaN, 4), 0);
    assert.equal(tearsheet.stepIndex(3, 0), 0);
  });

  it('gives each step of the rail its status: done before, current, upcoming after, error wherever', () => {
    assert.deepEqual(tearsheet.statuses(4, 2), ['done', 'done', 'current', 'upcoming']);
    assert.deepEqual(tearsheet.statuses(3, 0), ['current', 'upcoming', 'upcoming']);
    assert.deepEqual(tearsheet.statuses(3, 1, new Set([1])), ['done', 'error', 'upcoming']);
    assert.deepEqual(tearsheet.statuses(3, 2, [0]), ['error', 'done', 'current']);
    assert.deepEqual(tearsheet.statuses(0, 0), []);
  });

  it('says where the flow is in the system\'s words', () => {
    assert.equal(t('stepOf', { step: 2, total: 4, label: 'Network' }), 'Step 2 of 4: Network');
    assert.equal(t('discard'), 'Discard');
  });

  it('closes nothing that is not open', async () => {
    const element = { isConnected: false };
    assert.equal(await tearsheet.close(element), false);
  });
});
