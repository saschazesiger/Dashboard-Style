/**
 * DS.timepicker without a DOM: the list of times (step, limits) and its
 * registration. The list's keys and the field in a browser are
 * timepicker.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { times } from './timepicker.js';
import { runtime } from '../../js/core.js';

describe('DS.timepicker', () => {
  it('lists the times of a day every step minutes, within min and max', () => {
    const day = times();
    assert.equal(day.length, 48);
    assert.equal(day[0], '00:00');
    assert.equal(day.at(-1), '23:30');
    assert.deepEqual(times({ step: 15, min: '08:00', max: '09:00' }), ['08:00', '08:15', '08:30', '08:45', '09:00']);
    assert.deepEqual(times({ step: 60, min: '22:30' }), ['22:30', '23:30']);
    assert.equal(times({ step: 0 }).length, 48, 'a step of 0 falls back to 30');
    assert.equal(times({ step: 1 }).length, 1440);
  });

  it('registers its behaviour by its attribute', () => {
    assert.equal(runtime.state('core').specs.get('timepicker').attribute, 'data-ds-timepicker');
  });
});
