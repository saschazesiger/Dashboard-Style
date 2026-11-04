/**
 * DS.a11y (src/js/a11y.js) without a DOM: the matching of type-ahead, the
 * delegated typeahead() on fake items, tabbables() and readsKeys() on fake
 * nodes, and that roving() and announce() are DS.dom's and DS.overlay's.
 * The real engines run the rest in test/browser/a11y.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as a11y from '../src/js/a11y.js';
import { read } from './helpers.js';

const item = (text, extra = {}) => ({
  text,
  isConnected: true,
  disabled: false,
  textContent: text,
  getAttribute: (name) => extra[name] ?? null,
  closest: () => null,
  contains: (other) => other === item,
  focus() { this.focused = true; },
  ...extra,
});

describe('inert()', () => {
  const doc = {};
  const node = (inert = false) => ({ nodeType: 1, ownerDocument: doc, inert });

  it('counts per element and lets go with the last hold; a second destroy() counts once', () => {
    const one = node();
    const first = a11y.inert(one);
    const second = a11y.inert([one, one]);
    assert.equal(one.inert, true);
    first.destroy();
    first.destroy();
    assert.equal(one.inert, true);
    second.destroy();
    assert.equal(one.inert, false);
  });

  it('leaves what the page made inert itself; takes one element, a list, or nothing', () => {
    const own = node(true);
    a11y.inert(own).destroy();
    assert.equal(own.inert, true);
    const iterable = node();
    iterable[Symbol.iterator] = function* each() { yield {}; };
    const hold = a11y.inert(iterable);
    assert.equal(iterable.inert, true, 'an iterable element (a form) is one element');
    hold.destroy();
    assert.doesNotThrow(() => a11y.inert(null).destroy());
    assert.doesNotThrow(() => a11y.inert([null]).destroy());
  });
});

describe('typeaheadMatch()', () => {
  const items = ['Ada', 'Alan', 'Barbara', 'Grace'].map((text) => item(text));
  const [ada, alan, barbara, grace] = items;

  it('finds the next item after the current one, wrapping', () => {
    assert.equal(a11y.typeaheadMatch(items, ada, 'g'), grace);
    assert.equal(a11y.typeaheadMatch(items, grace, 'a'), ada, 'wraps');
    assert.equal(a11y.typeaheadMatch(items, ada, 'a'), alan, 'a new search starts after the current item');
    assert.equal(a11y.typeaheadMatch(items, null, 'a'), ada, 'no current item: from the first');
    assert.equal(a11y.typeaheadMatch(items, ada, 'z'), null);
  });

  it('lets a longer search stay on the current item', () => {
    assert.equal(a11y.typeaheadMatch(items, barbara, 'ba'), barbara);
    assert.equal(a11y.typeaheadMatch(items, ada, 'al'), alan);
  });

  it('cycles through the items of one letter typed again and again', () => {
    assert.equal(a11y.typeaheadMatch(items, ada, 'aa'), alan);
    assert.equal(a11y.typeaheadMatch(items, alan, 'aaa'), ada);
    const named = [item('Aaron'), item('Ada')];
    assert.equal(a11y.typeaheadMatch(named, named[1], 'aa'), named[0], 'the word itself comes first');
  });

  it('reads the label: aria-label, else the text, collapsed and lower case; or the function given', () => {
    const list = [item('  Some\n  Thing  '), item('x', { 'aria-label': 'Named' })];
    assert.equal(a11y.typeaheadMatch(list, null, 'some thing'), list[0]);
    assert.equal(a11y.typeaheadMatch(list, null, 'na'), list[1]);
    assert.equal(a11y.typeaheadMatch(list, null, 'x'), null);
    assert.equal(a11y.typeaheadMatch(list, null, 'own', (each) => (each === list[1] ? 'own label' : 'other')), list[1]);
  });
});

describe('typeahead()', () => {
  /** A list of fake items on an EventTarget; `press` fires a keydown at `target`. */
  function setup(names, options) {
    const container = new EventTarget();
    const items = names.map((text) => item(text));
    container.querySelectorAll = () => items;
    const handle = a11y.typeahead(container, options);
    const press = (key, init = {}) => {
      const event = Object.assign(new Event('keydown', { cancelable: true }), { key, altKey: false, ctrlKey: false, metaKey: false, isComposing: false }, init);
      Object.defineProperty(event, 'target', { value: init.on ?? null });
      Object.defineProperty(event, 'timeStamp', { value: init.at ?? 0 });
      container.dispatchEvent(event);
      return event;
    };
    return { container, items, handle, press };
  }

  it('joins the letters typed within --ds-delay-tooltip, then starts over', () => {
    const { items, press } = setup(['Ada', 'Grace', 'Gregor']);
    assert.equal(press('g', { at: 1000, on: items[0] }).defaultPrevented, true);
    assert.equal(items[1].focused, true);
    items[1].focused = false;
    press('r', { at: 1100, on: items[1] });
    press('e', { at: 1200, on: items[1] });
    press('g', { at: 1300, on: items[1] });
    assert.equal(items[2].focused, true, 'greg');
    items[2].focused = false;
    press('a', { at: 2000, on: items[2] });
    assert.equal(items[0].focused, true, 'after the delay, a new search');
  });

  it('counts a space only within a word; a navigation key starts over, a modifier key does not', () => {
    const { items, press } = setup(['Ada Lovelace', 'Ada King', 'Lena']);
    assert.equal(press(' ', { at: 100, on: items[0] }).defaultPrevented, false, 'alone it activates the item');
    press('a', { at: 200, on: items[2] });
    press('Shift', { at: 210, on: items[0] });
    press('d', { at: 220, on: items[0] });
    press('a', { at: 230, on: items[0] });
    assert.equal(press(' ', { at: 240, on: items[0] }).defaultPrevented, true, 'within a word');
    press('k', { at: 250, on: items[0] });
    assert.equal(items[1].focused, true, 'ada k');
    press('ArrowDown', { at: 260, on: items[1] });
    items[2].focused = false;
    press('l', { at: 270, on: items[1] });
    assert.equal(items[2].focused, true, 'a new search');
  });

  it('stays out with a modifier, while composing, on a field and after what the page prevented', () => {
    const { items, press } = setup(['Ada']);
    press('a', { at: 100, on: items[0], ctrlKey: true });
    press('a', { at: 100, on: items[0], altKey: true });
    press('a', { at: 100, on: items[0], metaKey: true });
    press('a', { at: 100, on: items[0], isComposing: true });
    press('a', { at: 100, on: { tagName: 'INPUT', type: 'text', readOnly: false } });
    press('a', { at: 100, on: { tagName: 'SELECT' } });
    assert.equal(items[0].focused, undefined);
  });

  it('skips what cannot take focus, and takes items, label and onMatch', () => {
    const skipped = setup(['Ada', 'Alan']);
    skipped.items[0].disabled = true;
    skipped.press('a', { at: 100, on: null });
    assert.deepEqual(skipped.items.map((each) => each.focused), [undefined, true]);

    const matched = [];
    const own = setup(['Ignored'], { items: () => [item('Ada'), item('Bert')], label: (each) => each.text.toUpperCase().toLowerCase(), onMatch: (each) => matched.push(each.text) });
    own.press('b', { at: 100, on: null });
    assert.deepEqual(matched, ['Bert']);
  });

  it('goes on from the item the container\'s aria-activedescendant names, else current()', () => {
    const seen = [];
    const listed = setup(['Ada', 'Alan', 'Barbara'], { onMatch: (each) => seen.push(each.text), current: () => listed.items[1] });
    listed.press('a', { at: 100, on: null });
    assert.deepEqual(seen, ['Ada'], 'current(): after Alan, wrapping');

    const found = [];
    const container = new EventTarget();
    const items = ['Ada', 'Alan'].map((text) => item(text));
    container.querySelectorAll = () => items;
    container.getAttribute = () => 'alan';
    container.getRootNode = () => ({ getElementById: () => items[1] });
    a11y.typeahead(container, { onMatch: (each) => found.push(each.text) });
    const event = Object.assign(new Event('keydown', { cancelable: true }), { key: 'a', altKey: false, ctrlKey: false, metaKey: false, isComposing: false });
    Object.defineProperty(event, 'target', { value: container });
    container.dispatchEvent(event);
    assert.deepEqual(found, ['Ada'], 'after the named item');
  });

  it('is once per container; destroy() ends it, twice is safe, then it can start again', () => {
    const { container, items, handle, press } = setup(['Ada']);
    assert.equal(a11y.typeahead(container), handle);
    handle.destroy();
    handle.destroy();
    press('a', { at: 100, on: null });
    assert.equal(items[0].focused, undefined);
    assert.notEqual(a11y.typeahead(container), handle);
  });

  it('does nothing without a container', () => {
    a11y.typeahead(null).destroy();
  });
});

describe('tabbables()', () => {
  const node = (attrs = {}, extra = {}) => ({
    isConnected: true,
    disabled: false,
    tagName: 'BUTTON',
    getAttribute: (name) => attrs[name] ?? null,
    closest: () => null,
    focus() {},
    ...extra,
  });
  const root = (...nodes) => ({ querySelectorAll: () => nodes });

  it('filters by canFocus() and a negative tabindex', () => {
    const plain = node();
    const set = node({ tabindex: '0' });
    assert.deepEqual(a11y.tabbables(root(plain, node({ tabindex: '-1' }), node({}, { disabled: true }), node({}, { closest: () => ({}) }), node({}, { getClientRects: () => [] }), node({}, { isConnected: false }), set)), [plain, set]);
  });

  it('leaves what is not visible out, and what a fieldset disables', () => {
    const shown = node({}, { checkVisibility: (options) => options.checkVisibilityCSS === true });
    const hidden = node({}, { checkVisibility: () => false });
    const inFieldset = node({}, { matches: (selector) => selector === ':disabled' });
    assert.deepEqual(a11y.tabbables(root(shown, hidden, inFieldset)), [shown]);
  });

  it('counts a named radio group once: the checked one, else the first', () => {
    const radio = (name, checked = false) => node({}, { tagName: 'INPUT', type: 'radio', name, checked });
    const a = radio('one');
    const b = radio('one', true);
    const c = radio('two');
    const d = radio('two');
    const free = radio('');
    assert.deepEqual(a11y.tabbables(root(a, b, c, d, free)), [b, c, free]);
  });

  it('is empty without a root', () => {
    assert.deepEqual(a11y.tabbables(null), []);
    assert.deepEqual(a11y.tabbables(undefined), []);
  });
});

describe('canTakeFocus()', () => {
  const node = (extra = {}) => ({ isConnected: true, disabled: false, closest: () => null, focus() {}, ...extra });

  it('adds :disabled and the visibility check to canFocus(), and copes with a stub without them', () => {
    assert.equal(a11y.canTakeFocus(node()), true);
    assert.equal(a11y.canTakeFocus(node({ disabled: true })), false);
    assert.equal(a11y.canTakeFocus(node({ matches: () => true })), false);
    assert.equal(a11y.canTakeFocus(node({ matches: () => false, checkVisibility: () => true })), true);
    assert.equal(a11y.canTakeFocus(node({ checkVisibility: () => false })), false);
    assert.equal(a11y.canTakeFocus(null), false);
  });
});

describe('readsKeys()', () => {
  const inWidget = (selector) => selector.includes('role="listbox"') ? {} : null;
  it('says yes to fields and key widgets, no to the rest', () => {
    const closest = () => null;
    assert.equal(a11y.readsKeys({ closest, tagName: 'INPUT', type: 'search', readOnly: false }), true);
    assert.equal(a11y.readsKeys({ closest, tagName: 'INPUT', type: 'search', readOnly: true }), false, 'read-only');
    assert.equal(a11y.readsKeys({ closest, tagName: 'INPUT', type: 'checkbox', readOnly: false }), false);
    assert.equal(a11y.readsKeys({ closest, tagName: 'TEXTAREA', readOnly: false }), true);
    assert.equal(a11y.readsKeys({ closest, tagName: 'DIV', isContentEditable: true }), true);
    assert.equal(a11y.readsKeys({ closest, tagName: 'SELECT' }), true);
    assert.equal(a11y.readsKeys({ closest: inWidget, tagName: 'LI' }), true);
    assert.equal(a11y.readsKeys({ closest, tagName: 'BUTTON' }), false);
    assert.equal(a11y.readsKeys(null), false);
    assert.equal(a11y.readsKeys({}), false, 'no element: the document, a window');
  });
});

describe('what the module takes from the others', () => {
  const source = read('src/js/a11y.js');

  it('builds on the functions of DS.dom and DS.overlay, and writes no focusable list of its own', () => {
    assert.match(source, /^import \{ roving as rovingOf, typesText \} from '\.\/dom\.js';$/m);
    assert.match(source, /^import \{ announce as announceOf, canFocus, FOCUSABLE, holdInert, layerAt, typeAhead \} from '\.\/overlay\.js';$/m);
    assert.doesNotMatch(source, /const FOCUSABLE/);
    assert.doesNotMatch(source, /a\[href\]/);
    assert.doesNotMatch(source, /startsWith/, 'the matcher is the menus\' (DS.overlay.typeAhead)');
  });

  it('is safe without a DOM', () => {
    assert.equal(typeof a11y.trap(null).destroy, 'function');
    a11y.trap(null).destroy();
    a11y.roving(null).destroy();
    assert.equal(a11y.readsKeys(undefined), false);
  });
});
