/**
 * DS.datepicker without a DOM: its registration. The field, the calendar
 * and the popover together in a browser are datepicker.spec.js; the date
 * engine it uses is calendar.test.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { create } from './datepicker.js';
import { runtime } from '../../js/core.js';

describe('DS.datepicker', () => {
  it('registers its behaviour by its attribute', () => {
    assert.equal(runtime.state('core').specs.get('datepicker').attribute, 'data-ds-datepicker');
    assert.equal(typeof create, 'function');
  });
});
