/**
 * DS.daterange without a DOM: the relative presets resolved against a
 * given today and their names, and its registration. The popover, the
 * preview and the keys in a browser are daterange.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolve, presetLabel } from './daterange.js';
import { runtime } from '../../js/core.js';

// A Wednesday.
const TODAY = '2026-11-04';

describe('DS.daterange', () => {
  it('resolves every preset against today', () => {
    const at = (preset, firstDay = 1) => resolve(preset, { today: TODAY, firstDay });
    assert.deepEqual(at('today'), { start: '2026-11-04', end: '2026-11-04' });
    assert.deepEqual(at('yesterday'), { start: '2026-11-03', end: '2026-11-03' });
    assert.deepEqual(at('last-7-days'), { start: '2026-10-29', end: '2026-11-04' });
    assert.deepEqual(at('last-1-days'), { start: '2026-11-04', end: '2026-11-04' });
    assert.deepEqual(at('last-30-days'), { start: '2026-10-06', end: '2026-11-04' });
    assert.deepEqual(at('this-week'), { start: '2026-11-02', end: '2026-11-04' });
    assert.deepEqual(at('this-week', 7), { start: '2026-11-01', end: '2026-11-04' });
    assert.deepEqual(at('last-week'), { start: '2026-10-26', end: '2026-11-01' });
    assert.deepEqual(at('this-month'), { start: '2026-11-01', end: '2026-11-04' });
    assert.deepEqual(at('last-month'), { start: '2026-10-01', end: '2026-10-31' });
    assert.deepEqual(at('this-year'), { start: '2026-01-01', end: '2026-11-04' });
    assert.deepEqual(at('last-year'), { start: '2025-01-01', end: '2025-12-31' });
    assert.deepEqual(resolve('last-month', { today: '2026-03-31', firstDay: 1 }), { start: '2026-02-01', end: '2026-02-28' });
    assert.equal(resolve('2026-11-01/2026-11-07', { today: TODAY }), null, 'a range is no preset');
    assert.equal(resolve('next-week', { today: TODAY }), null);
  });

  it('names the presets through Intl and the lastSpan string', () => {
    assert.equal(presetLabel('today', { locale: 'en-US' }), 'Today');
    assert.equal(presetLabel('yesterday', { locale: 'en-US' }), 'Yesterday');
    assert.equal(presetLabel('this-month', { locale: 'en-US' }), 'This month');
    assert.equal(presetLabel('last-week', { locale: 'en-US' }), 'Last week');
    assert.equal(presetLabel('last-7-days', { locale: 'en-US' }), 'Last 7 days');
    assert.equal(presetLabel('this-month', { locale: 'de' }), 'Diesen Monat');
  });

  it('registers its behaviour by its attribute', () => {
    assert.equal(runtime.state('core').specs.get('daterange').attribute, 'data-ds-daterange');
  });
});
