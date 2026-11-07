/**
 * DS.splitbutton without a DOM: finding its parts, the registration and the
 * toggle's name from the strings. The browser side is splitbutton.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { partsOf } from './splitbutton.js';
import { runtime, t } from '../../js/core.js';

describe('DS.splitbutton.partsOf', () => {
  it('finds the action, the toggle and the menu right after the group', () => {
    const menu = { matches: (selector) => selector === '.ds-menu' };
    const toggle = { getAttribute: () => null, getRootNode: () => ({}), ownerDocument: { getElementById: () => null }, nextElementSibling: null };
    const action = { name: 'action' };
    const group = {
      querySelector: (selector) => ({ '.ds-split-btn__toggle': toggle, '.ds-split-btn__action': action }[selector] ?? null),
      querySelectorAll: () => [action, toggle],
      nextElementSibling: menu,
    };
    assert.deepEqual(partsOf(group), { action, toggle, menu });
  });

  it('takes the first other button as the action when none is marked', () => {
    const toggle = { getAttribute: () => null, getRootNode: () => ({}), ownerDocument: { getElementById: () => null }, nextElementSibling: null };
    const first = { name: 'first' };
    const group = {
      querySelector: (selector) => (selector === '.ds-split-btn__toggle' ? toggle : null),
      querySelectorAll: () => [first, toggle],
      nextElementSibling: null,
    };
    assert.equal(partsOf(group).action, first);
    assert.equal(partsOf(group).menu, null);
  });
});

describe('DS.splitbutton', () => {
  it('registers its behaviour by its attribute, with data-ds-value', () => {
    const spec = runtime.state('core').specs.get('splitbutton');
    assert.equal(spec.attribute, 'data-ds-splitbutton');
    assert.deepEqual([...spec.attributes], ['data-ds-value']);
  });

  it('names a toggle without a name from the strings', () => {
    assert.equal(t('moreOptionsFor', { label: 'Save' }), 'More options for Save');
  });
});
