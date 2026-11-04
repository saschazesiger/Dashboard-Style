/**
 * DS.hotkeys (src/js/hotkeys.js) without a DOM: combos as data, matching by
 * platform and layout, labels, and the registry on a bare EventTarget. The
 * real engines run the rest in test/browser/hotkeys.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as hotkeys from '../src/js/hotkeys.js';
import * as core from '../src/js/core.js';

const MAC = { navigator: { platform: 'MacIntel' } };
const PC = { navigator: { platform: 'Win32' } };

/** A keydown as an engine makes it: `view` says the platform. */
function key(init) {
  return Object.assign(new Event('keydown', { cancelable: true }), { ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, view: PC, code: '', isComposing: false, repeat: false }, init);
}

describe('parse()', () => {
  it('reads modifiers and the key, in any case, with their aliases', () => {
    assert.deepEqual(hotkeys.parse('Mod+Shift+K'), { key: 'k', mod: true, ctrl: false, meta: false, alt: false, shift: true });
    assert.deepEqual(hotkeys.parse('control+option+command+Up'), { key: 'arrowup', mod: false, ctrl: true, meta: true, alt: true, shift: false });
    for (const [alias, name] of [['esc', 'escape'], ['return', 'enter'], ['del', 'delete'], ['left', 'arrowleft'], ['spacebar', 'space'], ['plus', '+']]) assert.equal(hotkeys.parse(alias).key, name);
    assert.equal(hotkeys.parse('?').key, '?');
  });

  it('reads the plus key', () => {
    assert.equal(hotkeys.parse('+').key, '+');
    assert.deepEqual(hotkeys.parse('mod++'), { key: '+', mod: true, ctrl: false, meta: false, alt: false, shift: false });
  });

  it('throws on a combo without a key or with an unknown modifier', () => {
    for (const bad of ['', 'mod+', 'hyper+k', 'toString+k', 'shift', 'mod', 'mod+shift', 'ctrl+alt', 'mod+escpe', 'mod+toString', 'mod+constructor', 'f1x']) assert.throws(() => hotkeys.parse(bad), /DS\.hotkeys/, bad);
    for (const good of ['insert', 'mod+contextmenu', 'f13', 'shift+f1', 'é', '@']) assert.doesNotThrow(() => hotkeys.parse(good), good);
  });
});

describe('isApple()', () => {
  it('reads the platform, userAgentData first', () => {
    assert.equal(hotkeys.isApple(MAC), true);
    assert.equal(hotkeys.isApple({ navigator: { platform: 'iPhone' } }), true);
    assert.equal(hotkeys.isApple(PC), false);
    assert.equal(hotkeys.isApple({ navigator: { platform: 'Linux x86_64' } }), false);
    assert.equal(hotkeys.isApple({ navigator: { userAgentData: { platform: 'macOS' }, platform: 'x' } }), true);
    assert.equal(hotkeys.isApple({}), false);
  });
});

describe('matches()', () => {
  it('takes mod for Command on Apple systems and for Control elsewhere', () => {
    assert.equal(hotkeys.matches(key({ key: 'k', ctrlKey: true }), 'mod+k'), true);
    assert.equal(hotkeys.matches(key({ key: 'k', metaKey: true }), 'mod+k'), false);
    assert.equal(hotkeys.matches(key({ key: 'k', metaKey: true, view: MAC }), 'mod+k'), true);
    assert.equal(hotkeys.matches(key({ key: 'k', ctrlKey: true, view: MAC }), 'mod+k'), false);
    assert.equal(hotkeys.matches(key({ key: 'k', ctrlKey: true, view: MAC }), 'ctrl+k'), true);
  });

  it('wants exactly the modifiers of the combo; caps lock changes nothing', () => {
    assert.equal(hotkeys.matches(key({ key: 'k' }), 'k'), true);
    assert.equal(hotkeys.matches(key({ key: 'K' }), 'k'), true);
    assert.equal(hotkeys.matches(key({ key: 'K', shiftKey: true }), 'k'), false);
    assert.equal(hotkeys.matches(key({ key: 'K', shiftKey: true }), 'shift+k'), true);
    assert.equal(hotkeys.matches(key({ key: 'k', ctrlKey: true }), 'k'), false);
    assert.equal(hotkeys.matches(key({ key: 'k', altKey: true }), 'k'), false);
    assert.equal(hotkeys.matches(key({ key: 'Enter' }), 'enter'), true);
    assert.equal(hotkeys.matches(key({ key: 'Enter', shiftKey: true }), 'enter'), false);
    assert.equal(hotkeys.matches(key({ key: ' ' }), 'space'), true);
    assert.equal(hotkeys.matches(key({ key: 'Escape' }), 'esc'), true);
    assert.equal(hotkeys.matches(key({ key: 'ArrowUp' }), 'up'), true);
  });

  it('takes a character as typed, whatever Shift it took', () => {
    assert.equal(hotkeys.matches(key({ key: '?', shiftKey: true, code: 'Slash' }), '?'), true);
    assert.equal(hotkeys.matches(key({ key: '?', code: 'Minus' }), '?'), true);
    assert.equal(hotkeys.matches(key({ key: '/', code: 'Slash' }), '/'), true);
    assert.equal(hotkeys.matches(key({ key: '/', shiftKey: true }), 'shift+/'), true);
    assert.equal(hotkeys.matches(key({ key: '/' }), 'shift+/'), false);
  });

  it('falls back on the place of the key where the layout types no Latin letter', () => {
    assert.equal(hotkeys.matches(key({ key: 'л', code: 'KeyK', ctrlKey: true }), 'mod+k'), true, 'another alphabet');
    assert.equal(hotkeys.matches(key({ key: '˚', code: 'KeyK', altKey: true, view: MAC }), 'alt+k'), true, 'Option on a Mac');
    assert.equal(hotkeys.matches(key({ key: 'Dead', code: 'KeyE', altKey: true, view: MAC }), 'alt+e'), true, 'a dead key');
    assert.equal(hotkeys.matches(key({ key: 'j', code: 'KeyK' }), 'k'), false, 'a Latin layout: the letter it types');
    assert.equal(hotkeys.matches(key({ key: 'k', code: 'KeyV' }), 'k'), true, 'Dvorak');
  });

  it('finds a digit that needs a modifier', () => {
    assert.equal(hotkeys.matches(key({ key: '1', code: 'Digit1' }), '1'), true);
    assert.equal(hotkeys.matches(key({ key: '!', code: 'Digit1', shiftKey: true }), 'shift+1'), true);
    assert.equal(hotkeys.matches(key({ key: '1', code: 'Digit1', shiftKey: true }), '1'), true, 'a French layout types it with Shift');
    assert.equal(hotkeys.matches(key({ key: '&', code: 'Digit1', ctrlKey: true }), 'mod+1'), true, 'and its unshifted key is a symbol');
    assert.equal(hotkeys.matches(key({ key: 'a', code: 'Digit1' }), '1'), false);
  });

  it('counts AltGr as neither Control nor Alt', () => {
    const altGr = (init) => key({ getModifierState: (name) => name === 'AltGraph', ctrlKey: true, altKey: true, ...init });
    assert.equal(hotkeys.matches(altGr({ key: '@', code: 'KeyQ' }), '@'), true);
    assert.equal(hotkeys.matches(altGr({ key: 'q', code: 'KeyQ' }), 'ctrl+alt+q'), false);
    assert.equal(hotkeys.matches(key({ key: 'q', ctrlKey: true, altKey: true }), 'ctrl+alt+q'), true);
  });

  it('takes what parse() gives', () => {
    assert.equal(hotkeys.matches(key({ key: 'k' }), hotkeys.parse('k')), true);
  });
});

describe('format()', () => {
  it('writes the keys of the platform, the line and aria-keyshortcuts', () => {
    assert.deepEqual(hotkeys.format('mod+shift+k', { apple: true }), { keys: ['⇧', '⌘', 'K'], text: '⇧⌘K', aria: 'Shift+Meta+K' });
    assert.deepEqual(hotkeys.format('mod+shift+k', { apple: false }), { keys: ['Ctrl', 'Shift', 'K'], text: 'Ctrl+Shift+K', aria: 'Control+Shift+K' });
    assert.deepEqual(hotkeys.format('ctrl+alt+k', { apple: true }), { keys: ['⌃', '⌥', 'K'], text: '⌃⌥K', aria: 'Control+Alt+K' });
    assert.deepEqual(hotkeys.format('meta+k', { apple: false }), { keys: ['Win', 'K'], text: 'Win+K', aria: 'Meta+K' });
  });

  it('names the other keys', () => {
    const aria = (combo) => hotkeys.format(combo, { apple: false }).aria;
    const text = (combo) => hotkeys.format(combo, { apple: false }).text;
    assert.deepEqual(['esc', 'enter', 'space', 'tab', 'backspace', 'del', 'home', 'end', 'pageup', 'pagedown'].map(text), ['Esc', 'Enter', 'Space', 'Tab', 'Backspace', 'Delete', 'Home', 'End', 'Page Up', 'Page Down']);
    assert.deepEqual(['esc', 'enter', 'space', 'pageup', 'pagedown', 'up', 'f1', '?', '+'].map(aria), ['Escape', 'Enter', 'Space', 'PageUp', 'PageDown', 'ArrowUp', 'F1', '?', 'Plus']);
    assert.equal(aria('mod++'), 'Control+Plus');
    assert.deepEqual(['up', 'down', 'left', 'right', 'f12', '?', '+', 'insert'].map(text), ['↑', '↓', '←', '→', 'F12', '?', '+', 'Insert']);
  });

  it('reads the key names from the strings', () => {
    core.config({ strings: { keyCtrl: 'Strg', keyEscape: 'Abbr' } });
    try {
      assert.equal(hotkeys.format('mod+esc', { apple: false }).text, 'Strg+Abbr');
    } finally {
      core.config({ strings: { keyCtrl: null, keyEscape: null } });
    }
  });
});

describe('the registry', () => {
  /** A root of its own, a press on it, and a log. */
  function setup() {
    const root = new EventTarget();
    const log = [];
    const press = (init) => {
      const event = key(init);
      root.dispatchEvent(event);
      return event;
    };
    const bind = (combo, name, options = {}) => hotkeys.register(combo, () => { log.push(name); return options.pass ? false : undefined; }, { root, ...options });
    return { root, log, press, bind };
  }
  const field = { tagName: 'INPUT', type: 'text', readOnly: false, closest: () => null };

  it('takes the last registration, passes on after false, prevents the default of the one that took it', () => {
    const { log, press, bind } = setup();
    bind('j', 'early');
    const late = bind('j', 'late', { pass: true });
    const first = press({ key: 'j' });
    assert.deepEqual(log, ['late', 'early']);
    assert.equal(first.defaultPrevented, true);
    late.destroy();
    late.destroy();
    press({ key: 'j' });
    assert.deepEqual(log, ['late', 'early', 'early']);
  });

  it('leaves the default when nothing took it', () => {
    const { press, bind } = setup();
    bind('j', 'pass', { pass: true });
    assert.equal(press({ key: 'j' }).defaultPrevented, false);
    assert.equal(press({ key: 'x' }).defaultPrevented, false);
  });

  it('takes a list of alternatives', () => {
    const { log, press, bind } = setup();
    bind(['j', 'down'], 'next');
    press({ key: 'j' });
    press({ key: 'ArrowDown' });
    assert.deepEqual(log, ['next', 'next']);
  });

  it('removes its listener with the last registration', () => {
    const root = new EventTarget();
    let added = 0;
    let removed = 0;
    const add = root.addEventListener.bind(root);
    const remove = root.removeEventListener.bind(root);
    root.addEventListener = (...args) => { added += 1; add(...args); };
    root.removeEventListener = (...args) => { removed += 1; remove(...args); };
    const a = hotkeys.register('j', () => {}, { root });
    const b = hotkeys.register('k', () => {}, { root });
    assert.deepEqual([added, removed], [1, 0], 'one listener');
    a.destroy();
    assert.deepEqual([added, removed], [1, 0]);
    b.destroy();
    assert.deepEqual([added, removed], [1, 1]);
  });

  it('ignores what the page prevented, a composing IME and a held key (unless repeat)', () => {
    const { root, log, press, bind } = setup();
    bind('j', 'plain');
    bind('k', 'held', { repeat: true });
    press({ key: 'j', isComposing: true });
    press({ key: 'j', repeat: true });
    press({ key: 'k', repeat: true });
    const prevented = key({ key: 'j' });
    prevented.preventDefault();
    root.dispatchEvent(prevented);
    assert.deepEqual(log, ['held']);
  });

  it('keeps the default of a held key it runs nothing for, unless the first press passed the key on', () => {
    const { log, press, bind } = setup();
    bind('mod+s', 'save');
    assert.equal(press({ key: 's', ctrlKey: true }).defaultPrevented, true);
    assert.equal(press({ key: 's', ctrlKey: true, repeat: true }).defaultPrevented, true);
    assert.deepEqual(log, ['save']);
    bind('j', 'pass', { pass: true });
    assert.equal(press({ key: 'j' }).defaultPrevented, false);
    assert.equal(press({ key: 'j', repeat: true }).defaultPrevented, false);
    assert.equal(press({ key: 'x', repeat: true }).defaultPrevented, false, 'no registration at all');
    let on = false;
    bind('k', 'gated', { when: () => on });
    assert.equal(press({ key: 'k', repeat: true }).defaultPrevented, false, 'an entry its other filters skip');
    on = true;
    assert.equal(press({ key: 'k', repeat: true }).defaultPrevented, true);
    assert.deepEqual(log, ['save', 'pass']);
  });

  it('keeps plain keys off what a native control does with them; fields: true overrides; mod combos pass', () => {
    const { log, press, bind } = setup();
    bind('space', 'space');
    bind('left', 'left');
    bind('j', 'j');
    bind('mod+enter', 'mod-enter');
    const on = (selector) => ({ composedPath: () => [{ tagName: 'DIV', closest: (asked) => (asked.split(', ').includes(selector) ? {} : null) }] });
    press({ key: ' ', ...on('button') });
    press({ key: ' ', ...on('input[type="checkbox"]') });
    press({ key: 'ArrowLeft', ...on('input[type="range"]') });
    press({ key: 'ArrowLeft', ...on('[role="grid"]') });
    assert.deepEqual(log, [], 'taken by the control');
    press({ key: 'ArrowLeft', ...on('button') });
    press({ key: ' ', ...on('input[type="range"]') });
    press({ key: 'j', ...on('button') });
    press({ key: 'Enter', ctrlKey: true, ...on('button') });
    assert.deepEqual(log, ['left', 'space', 'j', 'mod-enter']);
    bind('enter', 'forced', { fields: true });
    press({ key: 'Enter', ...on('button') });
    assert.equal(log.at(-1), 'forced');
  });

  it('asks available(): false takes no key, and list() says so', () => {
    const { root, log, press, bind } = setup();
    let on = false;
    bind('j', 'gated', { description: 'Gated', available: () => on });
    assert.equal(press({ key: 'j' }).defaultPrevented, false);
    assert.equal(hotkeys.list({ root, apple: false })[0].items[0].active, false);
    assert.deepEqual(hotkeys.list({ root, apple: false, activeOnly: true }), []);
    on = true;
    press({ key: 'j' });
    assert.deepEqual(log, ['gated']);
    assert.equal(hotkeys.list({ root, apple: false })[0].items[0].active, true);
  });

  it('leaves out of list() what its element does not show; a later one that does not show replaces nothing', () => {
    const { root, bind } = setup();
    const owner = (visible) => ({ closest: () => null, checkVisibility: () => visible });
    bind('a', 'x', { description: 'Shown', owner: owner(true) });
    bind('b', 'x', { description: 'Unseen', owner: owner(false) });
    bind('c', 'x', { description: 'In hidden', owner: { closest: () => ({}), checkVisibility: () => true } });
    bind('d', 'x', { description: 'Gone', owner: { isConnected: false } });
    bind('e', 'x', { description: 'Wide', owner: owner(true) });
    bind('e', 'x', { description: 'Narrow', owner: owner(false) });
    assert.deepEqual(hotkeys.list({ root, apple: false })[0].items.map((item) => item.description), ['Shown', 'Wide']);
  });

  it('keeps plain combos out of fields; mod combos and fields: true come in; fields: false never', () => {
    const { log, press, bind } = setup();
    bind('j', 'plain');
    bind('mod+j', 'mod');
    bind('k', 'always', { fields: true });
    bind('mod+k', 'never', { fields: false });
    const inField = { composedPath: () => [field] };
    press({ key: 'j', ...inField });
    press({ key: 'j', ctrlKey: true, ...inField });
    press({ key: 'k', ...inField });
    press({ key: 'k', ctrlKey: true, ...inField });
    assert.deepEqual(log, ['mod', 'always']);
    press({ key: 'k', ctrlKey: true });
    assert.deepEqual(log, ['mod', 'always', 'never'], 'outside a field fields: false counts');
  });

  it('asks when(event)', () => {
    const { log, press, bind } = setup();
    let on = false;
    bind('j', 'gated', { when: () => on });
    press({ key: 'j' });
    on = true;
    press({ key: 'j' });
    assert.deepEqual(log, ['gated']);
  });

  it('counts within only from there, the innermost first', () => {
    const { log, press, bind } = setup();
    const inner = {};
    const outer = {};
    bind('j', 'global');
    bind('j', 'outer', { within: outer });
    bind('j', 'inner', { within: inner });
    press({ key: 'j' });
    press({ key: 'j', composedPath: () => [outer] });
    press({ key: 'j', composedPath: () => [inner, outer] });
    assert.deepEqual(log, ['global', 'outer', 'inner']);
  });

  it('orders scopes: off, on, exclusive, off again', () => {
    const { root, log, press, bind } = setup();
    bind('j', 'global');
    bind('j', 'one', { scope: 'one' });
    bind('j', 'two', { scope: 'two' });
    press({ key: 'j' });
    assert.deepEqual(hotkeys.scopes({ root }), ['global']);
    const one = hotkeys.scope('one', { root });
    press({ key: 'j' });
    const two = hotkeys.scope('two', { root });
    press({ key: 'j' });
    assert.deepEqual(hotkeys.scopes({ root }), ['two', 'one', 'global']);
    two.destroy();
    two.destroy();
    press({ key: 'j' });
    assert.deepEqual(log, ['global', 'one', 'two', 'one']);
    const solo = hotkeys.scope('solo', { root, exclusive: true });
    assert.deepEqual(hotkeys.scopes({ root }), ['solo']);
    press({ key: 'j' });
    assert.deepEqual(log, ['global', 'one', 'two', 'one'], 'masked');
    solo.destroy();
    one.destroy();
    assert.deepEqual(hotkeys.scopes({ root }), ['global']);
  });

  it('keeps a scope turned on twice until both are gone', () => {
    const { root, log, press, bind } = setup();
    bind('j', 'scoped', { scope: 'x' });
    const a = hotkeys.scope('x', { root });
    const b = hotkeys.scope('x', { root });
    assert.deepEqual(hotkeys.scopes({ root }), ['x', 'global']);
    a.destroy();
    press({ key: 'j' });
    assert.deepEqual(log, ['scoped']);
    b.destroy();
    press({ key: 'j' });
    assert.deepEqual(log, ['scoped']);
  });

  it('gives list() the groups, leaving out what has no description or was replaced; onChange() follows', () => {
    const { root, bind } = setup();
    let changes = 0;
    const off = hotkeys.onChange(() => { changes += 1; }, { root });
    bind('j', 'x');
    bind('mod+s', 'x', { description: 'Save', group: 'Editing' });
    bind('?', 'x', { description: 'Shortcuts' });
    const board = hotkeys.scope('board', { root });
    bind('k', 'x', { description: 'Up', group: 'Editing', scope: 'board' });
    bind('l', 'x', { description: 'Hidden', group: 'Other', scope: 'other' });
    assert.equal(changes, 6);
    assert.deepEqual(hotkeys.list({ root, apple: false }).map((group) => [group.name, group.items.map((item) => [item.description, item.active])]), [
      ['Editing', [['Save', true], ['Up', true]]],
      ['General', [['Shortcuts', true]]],
      ['Other', [['Hidden', false]]],
    ]);
    assert.deepEqual(hotkeys.list({ root, apple: true, activeOnly: true }).map((group) => group.name), ['Editing', 'General']);
    assert.deepEqual(hotkeys.list({ root, apple: true })[0].items[0].combos, [{ combo: 'mod+s', keys: ['⌘', 'S'], text: '⌘S', aria: 'Meta+S' }]);
    const again = bind('ctrl+s', 'x', { description: 'Other save', group: 'Editing' });
    assert.equal(hotkeys.list({ root, apple: false })[0].items.length, 3, 'mod+s and ctrl+s are different combos');
    again.destroy();
    bind('Mod+S', 'x', { description: 'Save all', group: 'Editing' });
    assert.deepEqual(hotkeys.list({ root, apple: false }).find((group) => group.name === 'Editing').items.map((item) => item.description), ['Up', 'Save all'], 'the same combo: the later one');
    board.destroy();
    off();
    const before = changes;
    bind('m', 'x');
    assert.equal(changes, before, 'unsubscribed');
  });

  it('throws on a bad combo or handler, and does nothing without a root', () => {
    const root = new EventTarget();
    assert.throws(() => hotkeys.register('hyper+k', () => {}, { root }), /unknown modifier/);
    assert.throws(() => hotkeys.register([], () => {}, { root }), /no combo/);
    assert.throws(() => hotkeys.register('k', null, { root }), TypeError);
    // Node has no document: every call is safe, as core's are.
    assert.equal(globalThis.document, undefined);
    hotkeys.register('k', () => {}).destroy();
    hotkeys.scope('x').destroy();
    assert.deepEqual(hotkeys.scopes(), ['global']);
    assert.deepEqual(hotkeys.list(), []);
    hotkeys.onChange(() => {})();
  });
});

describe('data-ds-hotkey', () => {
  it('is a behaviour of the registry', () => {
    assert.equal(core.define('hotkey', { attribute: 'data-ds-hotkey' }), false, 'the name is taken by hotkeys.js');
  });
});
