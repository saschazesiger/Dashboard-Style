/**
 * DS.toolcall: the duration's text and the statuses. The clock, the marks
 * and the announcement are toolcall.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../../js/core.js';
import { STATUSES, durationText } from './toolcall.js';

describe('DS.toolcall.durationText', () => {
  it('shows milliseconds under a second, whole seconds above', () => {
    config({ locale: 'en' });
    assert.equal(durationText(0), '0ms');
    assert.equal(durationText(240.4), '240ms');
    assert.equal(durationText(999), '999ms');
    assert.equal(durationText(1000), '1s');
    assert.equal(durationText(12900), '12s');
    assert.equal(durationText(65000), '1m 5s');
    config({ locale: null });
  });

  it('shows nothing for no duration', () => {
    for (const value of [null, undefined, Number.NaN, -1, 'soon']) assert.equal(durationText(value), '');
  });
});

describe('DS.toolcall.STATUSES', () => {
  it('names the five statuses, frozen', () => {
    assert.deepEqual([...STATUSES], ['pending', 'running', 'done', 'failed', 'cancelled']);
    assert.ok(Object.isFrozen(STATUSES));
  });
});
