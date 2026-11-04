/**
 * DS.dialog without a DOM: what the promise dialogs answer, that DS.overlay
 * calls this module, and the controller's shape. The behaviour in a browser is
 * dialog.spec.js and test/browser/promise-dialogs.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as overlay from '../../js/overlay.js';
import * as dialog from './dialog.js';
import { runtime } from '../../js/core.js';
import { read } from '../../../test/helpers.js';

/** Just enough of an element for the controller. */
function fakeElement() {
  const listeners = new Map();
  return {
    isConnected: false,
    addEventListener(type, fn) { listeners.set(type, fn); },
    removeEventListener(type) { listeners.delete(type); },
    listeners,
  };
}

describe('DS.dialog', () => {
  it('answers no without a DOM, through either door', async () => {
    assert.equal(await dialog.confirm(), false);
    assert.equal(await overlay.confirm(), false);
    assert.equal(await dialog.prompt(), null);
    assert.equal(await overlay.prompt(), null);
    assert.equal(await dialog.alert(), undefined);
    assert.equal(await overlay.alert(), undefined);
  });

  it('registers its behaviour by its attribute', () => {
    const spec = runtime.state('core').specs.get('dialog');
    assert.equal(spec.attribute, 'data-ds-dialog');
    assert.equal(typeof spec.init, 'function');
  });

  it('makes one controller shape; on() returns the unsubscribe, destroy() takes the rest', async () => {
    const element = fakeElement();
    const control = dialog.create(element);
    assert.equal(control.get(), false, 'never opened');
    const off = control.on('open', () => {});
    control.on('close', () => {});
    assert.deepEqual([...element.listeners.keys()], ['ds:open', 'ds:close']);
    off();
    assert.deepEqual([...element.listeners.keys()], ['ds:close']);
    control.destroy();
    assert.equal(element.listeners.size, 0);
    assert.equal(await control.set(true), undefined, 'open() on an element out of the document does nothing');
  });

  it('gives the destructive confirmation, and only it, the filled error button (D10)', () => {
    const source = read('src/components/dialog/dialog.js');
    assert.match(source, /options\.destructive \? 'ds-btn ds-btn--filled ds-tone-error' : 'ds-btn ds-btn--filled'/);
    assert.equal(source.match(/ds-tone-error/g).length, 1, 'that one button');
  });

  it('takes a form only when asked: data-ds-dialog-form or form()', () => {
    const source = read('src/components/dialog/dialog.js');
    assert.match(source, /if \(!setup && !box\.hasAttribute\('data-ds-dialog-form'\)\) return;/);
    assert.match(source, /event\.defaultPrevented\) return;/);
  });
});
