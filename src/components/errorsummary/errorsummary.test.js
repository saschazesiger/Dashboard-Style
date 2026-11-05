/**
 * DS.errorsummary: the title (a pure function of the count and the plural
 * rules) and a controller without a form. The browser side is
 * errorsummary.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { create, title } from './errorsummary.js';

describe('DS.errorsummary.title', () => {
  it('says one problem and many, nothing for none', () => {
    assert.equal(title(1), 'There is 1 problem');
    assert.equal(title(2), 'There are 2 problems');
    assert.equal(title(12), 'There are 12 problems');
    assert.equal(title(0), '');
    assert.equal(title(-3), '');
    assert.equal(title(Number.NaN), '');
  });
});

describe('DS.errorsummary.create', () => {
  it('returns a controller that finds no problem without a form', () => {
    const attrs = {};
    const root = {
      hidden: true,
      ownerDocument: null,
      closest: () => null,
      querySelector: () => null,
      getAttribute: (name) => attrs[name] ?? null,
      setAttribute: (name, value) => { attrs[name] = value; },
      hasAttribute: (name) => name in attrs,
      dispatchEvent: () => true,
    };
    const made = create(root);
    assert.equal(made.validate(), true);
    assert.deepEqual(made.get(), { errors: [] });
    assert.equal(attrs.tabindex, '-1');
    made.clear();
    assert.equal(typeof made.on('nonsense', () => {}), 'function');
    made.destroy();
    made.destroy();
  });
});
