/**
 * DS.sheet without a DOM: its registration and controller. The behaviour in a
 * browser is sheet.spec.js and test/browser/overlay.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as sheet from './sheet.js';
import { runtime } from '../../js/core.js';

describe('DS.sheet', () => {
  it('registers its behaviour by its attribute', () => {
    const spec = runtime.state('core').specs.get('sheet');
    assert.equal(spec.attribute, 'data-ds-sheet');
    assert.equal(typeof spec.init, 'function');
  });

  it('makes the controller of every overlay; open() out of the document does nothing', async () => {
    const element = { isConnected: false, addEventListener() {}, removeEventListener() {} };
    const control = sheet.create(element);
    assert.equal(control.get(), false);
    assert.equal(await sheet.open(element), undefined);
    assert.equal(control.get(), false);
  });
});
