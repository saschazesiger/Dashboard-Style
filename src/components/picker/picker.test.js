/**
 * DS.picker without a DOM: its registration and its exports. Opening,
 * placing, Tab and Escape in a browser are picker.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { create, open, close } from './picker.js';
import { runtime } from '../../js/core.js';

describe('DS.picker', () => {
  it('registers its behaviour by its attribute', () => {
    assert.equal(runtime.state('core').specs.get('picker').attribute, 'data-ds-picker');
  });

  it('exports the controller and the two calls on a root', () => {
    assert.equal(typeof create, 'function');
    assert.equal(typeof open, 'function');
    assert.equal(typeof close, 'function');
  });

  it('closes nothing on a root it never made', async () => {
    await close({});
  });
});
