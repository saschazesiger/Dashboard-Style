/**
 * DS.tracker: the counts behind a summary. The browser side (keys, names,
 * shapes) is tracker.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { counts } from './tracker.js';

describe('DS.tracker.counts', () => {
  it('counts every state and the total, from states or objects', () => {
    assert.deepEqual(counts(['success', 'error', 'success', 'warning']), { success: 2, info: 0, warning: 1, error: 1, empty: 0, total: 4 });
    assert.deepEqual(counts([{ state: 'info' }, { state: 'empty' }, { state: 'success' }]), { success: 1, info: 1, warning: 0, error: 0, empty: 1, total: 3 });
  });

  it('takes an unknown or missing state as no data', () => {
    assert.deepEqual(counts(['down', {}, null]), { success: 0, info: 0, warning: 0, error: 0, empty: 3, total: 3 });
  });

  it('gives zeros for nothing', () => {
    assert.deepEqual(counts([]), { success: 0, info: 0, warning: 0, error: 0, empty: 0, total: 0 });
    assert.deepEqual(counts(undefined), { success: 0, info: 0, warning: 0, error: 0, empty: 0, total: 0 });
  });
});
