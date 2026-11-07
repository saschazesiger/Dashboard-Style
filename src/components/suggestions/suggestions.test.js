/**
 * DS.suggestions: the items a row shows (items()), and the stylesheet's
 * rules. Drag to scroll and filling the composer are suggestions.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { items } from './suggestions.js';
import { read, declarationsOf } from '../../../test/helpers.js';

describe('DS.suggestions.items', () => {
  it('reads texts and objects, the label and the value falling back to each other', () => {
    assert.deepEqual(items(['Battery report', { value: 'Open a ticket for laptop 4', label: 'Open a ticket', icon: '<path d="M0 0"/>' }, { value: 'Restart' }, { label: 'Close' }]), [
      { value: 'Battery report', label: 'Battery report', icon: null },
      { value: 'Open a ticket for laptop 4', label: 'Open a ticket', icon: '<path d="M0 0"/>' },
      { value: 'Restart', label: 'Restart', icon: null },
      { value: 'Close', label: 'Close', icon: null },
    ]);
  });

  it('drops empty items and survives no list', () => {
    assert.deepEqual(items(['', '  ', null, {}, 'Ok ']), [{ value: 'Ok', label: 'Ok', icon: null }]);
    assert.deepEqual(items(undefined), []);
  });
});

describe('suggestions.css', () => {
  const css = read('src/components/suggestions/suggestions.css');
  const own = (selector) => Object.fromEntries(declarationsOf(css, selector).map((entry) => [entry.property, entry.value]));

  it('scrolls sideways unless it wraps, and presses nothing while dragged', () => {
    assert.equal(own('.ds-suggestions')['overflow-x'], 'auto');
    assert.equal(own('.ds-suggestions--wrap')['flex-wrap'], 'wrap');
    assert.equal(own('.ds-suggestions[data-state="dragging"] > *')['pointer-events'], 'none');
  });
});
