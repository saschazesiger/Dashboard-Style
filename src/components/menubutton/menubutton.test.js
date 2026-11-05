/**
 * DS.menubutton and DS.splitbutton without a DOM: an item's value, the
 * registrations, the strings. The keys, the menu and the choice run in a
 * browser: menubutton.spec.js and splitbutton.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { itemValue } from './menubutton.js';
import { runtime } from '../../js/core.js';
import { read } from '../../../test/helpers.js';

const item = (attributes, label) => ({
  attributes,
  getAttribute(name) { return this.attributes[name] ?? null; },
  querySelector: () => (label === undefined ? null : { textContent: label }),
  textContent: `  ${label ?? 'Owner'}  `,
});

describe('DS.menubutton.itemValue', () => {
  it('takes the value attribute, else data-value, else the label', () => {
    assert.equal(itemValue(item({ value: 'seen', 'data-value': 'x' }, 'Last seen')), 'seen');
    assert.equal(itemValue(item({ 'data-value': 'owner' }, 'Owner')), 'owner');
    assert.equal(itemValue(item({}, ' Last   seen ')), 'Last seen');
    assert.equal(itemValue(item({})), 'Owner');
  });
});

describe('DS.menubutton', () => {
  it('registers its behaviour by its attribute, with data-ds-value', () => {
    const spec = runtime.state('core').specs.get('menubutton');
    assert.equal(spec.attribute, 'data-ds-menubutton');
    assert.deepEqual([...spec.attributes], ['data-ds-value']);
  });

  it('opens through DS.menu (so the menu module comes along) and leaves data-ds-open to the overlay', () => {
    const source = read('src/components/menubutton/menubutton.js');
    assert.match(source, /from '\.\.\/menu\/menu\.js';/);
    assert.match(source, /button\.hasAttribute\('data-ds-open'\)/);
  });
});
