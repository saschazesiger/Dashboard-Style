/**
 * DS.toggletip without a DOM: its registration, its controller and its
 * string. Opening, the announcement and closing in a browser are
 * toggletip.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as toggletip from './toggletip.js';
import { runtime, t } from '../../js/core.js';

/** A button with no name, as far as the controller looks. */
function button(attributes = {}) {
  const attrs = new Map(Object.entries(attributes));
  return {
    textContent: '',
    nextElementSibling: null,
    hasAttribute: (name) => attrs.has(name),
    getAttribute: (name) => attrs.get(name) ?? null,
    setAttribute: (name, value) => attrs.set(name, String(value)),
    addEventListener() {},
    removeEventListener() {},
    attrs,
  };
}

describe('DS.toggletip', () => {
  it('registers its behaviour by its attribute', () => {
    const spec = runtime.state('core').specs.get('toggletip');
    assert.equal(spec.attribute, 'data-ds-toggletip');
    assert.equal(typeof spec.init, 'function');
    assert.ok(spec.attributes.includes('data-ds-toggletip-placement'));
  });

  it('names a nameless button with the system string, and leaves a named one alone', () => {
    const plain = button();
    toggletip.create(plain);
    assert.equal(plain.attrs.get('aria-label'), t('moreInfo'));
    assert.equal(t('moreInfo'), 'More information');
    const named = button({ 'aria-label': 'About the serial number' });
    toggletip.create(named);
    assert.equal(named.attrs.get('aria-label'), 'About the serial number');
  });

  it('makes a controller of the shared shape; without a card it stays closed', async () => {
    const control = toggletip.create(button({ 'aria-label': 'About' }));
    assert.deepEqual(Object.keys(control).sort(), ['destroy', 'element', 'get', 'on', 'set']);
    assert.equal(control.get(), false);
    assert.equal(await control.set(true), undefined);
    assert.equal(typeof control.on('change', () => {}), 'function');
    control.destroy();
  });
});
