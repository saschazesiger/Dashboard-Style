/**
 * DS.secret: the rule behind the hidden action input (a pure function) and a
 * controller without parts. The browser side is secret.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { action, create } from './secret.js';

describe('DS.secret.action', () => {
  it('keeps the stored value while set, and while nothing was typed', () => {
    assert.equal(action('set', ''), 'keep');
    assert.equal(action('set', 'typed'), 'keep');
    assert.equal(action('replace', ''), 'keep');
    assert.equal(action('empty', ''), 'keep');
    assert.equal(action('empty', null), 'keep');
    assert.equal(action('replace', undefined), 'keep');
  });

  it('sets what was typed while empty or replacing', () => {
    assert.equal(action('replace', 'ex_new_key'), 'set');
    assert.equal(action('empty', 'x'), 'set');
  });

  it('clears in the clear state, whatever the field holds', () => {
    assert.equal(action('clear', ''), 'clear');
    assert.equal(action('clear', 'typed'), 'clear');
  });
});

describe('DS.secret.create', () => {
  const fake = (stored) => ({
    querySelector: () => null,
    getAttribute: (name) => (name === 'data-ds-secret' ? stored : null),
    setAttribute() {},
    hasAttribute: () => false,
    removeAttribute() {},
    dispatchEvent: () => true,
  });

  it('starts from the attribute or the option, and walks the states', () => {
    assert.equal(create(fake('set')).get().state, 'set');
    assert.equal(create(fake('')).get().state, 'empty');
    assert.equal(create(fake(''), { stored: true }).get().state, 'set');
    const made = create(fake('set'));
    const seen = [];
    const off = made.on('change', (detail) => seen.push(detail));
    made.set('clear');
    assert.deepEqual(made.get(), { state: 'clear', stored: true, action: 'clear' });
    made.set('nonsense');
    made.set('clear');
    off();
    made.set('set');
    assert.deepEqual(seen, [{ state: 'clear', action: 'clear' }]);
    made.destroy();
    made.destroy();
  });
});
