/**
 * DS.choices without a DOM: the summary of a "select all" box and the
 * registration. The behaviour in a browser is choices.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { summary, create } from './choices.js';
import { runtime } from '../../js/core.js';

describe('DS.choices.summary', () => {
  it('says all, none or some', () => {
    assert.equal(summary([{ checked: true }, { checked: true }]), 'all');
    assert.equal(summary([{ checked: false }, { checked: false }]), 'none');
    assert.equal(summary([{ checked: true }, { checked: false }]), 'some');
  });

  it('leaves blocked boxes out, and an empty set is none', () => {
    assert.equal(summary([{ checked: true }, { checked: false, disabled: true }]), 'all');
    assert.equal(summary([{ checked: true, disabled: true }, { checked: false }]), 'none');
    assert.equal(summary([]), 'none');
    assert.equal(summary([{ checked: true, disabled: true }]), 'none');
  });
});

describe('DS.choices', () => {
  it('registers its behaviour by its attribute and needs its list', () => {
    const spec = runtime.state('core').specs.get('choices');
    assert.equal(spec.attribute, 'data-ds-choices');
    assert.equal(create(null), null);
    assert.equal(create({ querySelector: () => null }), null);
  });
});
