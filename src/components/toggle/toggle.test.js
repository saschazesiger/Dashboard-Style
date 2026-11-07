/**
 * DS.toggle without a DOM: the rule behind a press (single, required,
 * multiple), the reading of data-ds-value, the registrations and a toggle's
 * controller on a stand-in button. The browser side is toggle.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { create, nextPressed, parseValue } from './toggle.js';
import { runtime } from '../../js/core.js';

/** A stand-in button: attributes, click listeners, events. */
function stub(attributes = {}) {
  const listeners = [];
  return {
    attributes: { ...attributes },
    events: [],
    parentElement: null,
    disabled: false,
    getAttribute(name) { return this.attributes[name] ?? null; },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    hasAttribute(name) { return name in this.attributes; },
    addEventListener(type, fn, options) {
      listeners.push(fn);
      options?.signal?.addEventListener('abort', () => listeners.splice(listeners.indexOf(fn), 1));
    },
    dispatchEvent(event) { this.events.push(event); return true; },
    click() { for (const fn of [...listeners]) fn({ defaultPrevented: false }); },
  };
}

describe('DS.toggle.nextPressed', () => {
  it('single: a press turns the item on and every other off; again, off', () => {
    assert.deepEqual(nextPressed([], 'list', { mode: 'single' }), ['list']);
    assert.deepEqual(nextPressed(['list'], 'grid', { mode: 'single' }), ['grid']);
    assert.deepEqual(nextPressed(['grid'], 'grid', { mode: 'single' }), []);
  });

  it('single and required: the item that is on stays on', () => {
    assert.deepEqual(nextPressed(['grid'], 'grid', { mode: 'single', required: true }), ['grid']);
    assert.deepEqual(nextPressed(['grid'], 'list', { mode: 'single', required: true }), ['list']);
  });

  it('multiple: each item flips on its own, in the order pressed', () => {
    assert.deepEqual(nextPressed(['bold'], 'italic', { mode: 'multiple' }), ['bold', 'italic']);
    assert.deepEqual(nextPressed(['bold', 'italic'], 'bold', { mode: 'multiple' }), ['italic']);
  });
});

describe('DS.toggle.parseValue', () => {
  it('reads one value for single and a list for multiple', () => {
    assert.equal(parseValue('grid', 'single'), 'grid');
    assert.equal(parseValue('grid list', 'single'), 'grid');
    assert.equal(parseValue('', 'single'), null);
    assert.equal(parseValue(null, 'single'), null);
    assert.deepEqual(parseValue('bold  code', 'multiple'), ['bold', 'code']);
    assert.deepEqual(parseValue(['bold', 'bold', 'code'], 'multiple'), ['bold', 'code']);
    assert.deepEqual(parseValue(undefined, 'multiple'), []);
  });
});

describe('DS.toggle behaviours', () => {
  it('registers the toggle and the group by their attributes', () => {
    const specs = runtime.state('core').specs;
    assert.equal(specs.get('toggle').attribute, 'data-ds-toggle');
    assert.equal(specs.get('toggle-group').attribute, 'data-ds-toggle-group');
    assert.deepEqual([...specs.get('toggle-group').attributes], ['data-ds-toggle-group-required', 'data-ds-value', 'data-ds-toggle-group-roving']);
  });

  it('flips aria-pressed on a click and says so; set() is silent; a blocked toggle stays', () => {
    const button = stub();
    const toggle = create(button);
    assert.equal(button.getAttribute('aria-pressed'), 'false', 'starts off without the attribute');
    const heard = [];
    toggle.on('change', (detail) => heard.push(detail.pressed));
    button.click();
    assert.equal(toggle.get(), true);
    assert.deepEqual(heard, [true]);
    assert.equal(button.events.at(-1).type, 'ds:change');
    toggle.set(false);
    assert.equal(button.getAttribute('aria-pressed'), 'false');
    assert.deepEqual(heard, [true]);
    button.setAttribute('aria-disabled', 'true');
    button.click();
    assert.equal(toggle.get(), false);
    toggle.destroy();
    button.attributes['aria-disabled'] = 'false';
    button.click();
    assert.equal(toggle.get(), false, 'no listener after destroy()');
  });
});
