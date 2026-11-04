/**
 * Keyboard shortcuts (3.0): one registry per document, combos that read
 * right on every platform, scopes, and the data of a shortcut sheet.
 *
 *   const save = DS.hotkeys.register('mod+s', store, { description: 'Save', group: 'Editing' });
 *   const board = DS.hotkeys.scope('board');     // its shortcuts count until board.destroy()
 *   DS.hotkeys.format('mod+s').text;             // '⌘S' on Apple systems, 'Ctrl+S' elsewhere
 *   DS.hotkeys.list();                           // the groups a shortcut sheet shows
 *   <button data-ds-hotkey="mod+k" data-ds-hotkey-description="Search">…</button>
 *
 * A combo is modifiers and one key, joined by +: `mod` is Command on Apple
 * systems and Control elsewhere; `ctrl`, `alt` and `shift` are themselves,
 * `meta` the Command or Windows key. A letter or a digit matches by what it
 * types, then by its place on the keyboard where the layout types no Latin
 * letter (another alphabet, Option on a Mac) or the digit needs a modifier
 * (shift+1, a French layout). Other characters are written as typed (`?`,
 * never `shift+/`), whatever Shift it took on this layout.
 *
 * Which registration a key press reaches: the page's own handlers come first
 * (bubble phase; preventDefault() keeps it), a composing IME and a held key
 * get nothing (`repeat: true` takes a held key). A combo without Control or
 * Command stays out of fields and of widgets that read keys (readsKeys()),
 * where it would type (`fields` changes that). An open overlay masks the
 * registrations behind it, so letters reach a menu's type-ahead and no
 * shortcut acts on the inert page (`within` or `owner` in that layer, or
 * `overlays: true`, still count). Of what is left the innermost `within`
 * wins, then the scope activated last, then the registration made last; a
 * handler that returns false passes the key on. The one that takes it
 * prevents the default.
 *
 * Scopes: 'global' is always on, below the others; `scope(name)` turns a
 * scope on until its handle is destroyed, and `exclusive: true` masks every
 * scope below it (a full-screen editor).
 *
 * Progressive:
 * - navigator.userAgentData (tells the platform): an engine without it
 *   falls back on navigator.platform.
 */

import { define, runtime, t } from './core.js';
import { canFocus, topmost } from './overlay.js';
import { readsKeys } from './a11y.js';

/** The scope of a registration that names none; always on, below the others. */
const GLOBAL = 'global';

/**
 * This module's shared state (runtime.state('hotkeys')): per root the
 * registrations, the active scopes, the listeners of list() changes and the
 * one keydown listener, whichever copy made it.
 * @type {{ roots: WeakMap<object, any> }}
 */
const shared = runtime.state('hotkeys', () => ({ roots: new WeakMap() }));

const MODIFIERS = { mod: 'mod', ctrl: 'ctrl', control: 'ctrl', meta: 'meta', cmd: 'meta', command: 'meta', win: 'meta', super: 'meta', alt: 'alt', option: 'alt', opt: 'alt', shift: 'shift' };

const KEY_ALIASES = { esc: 'escape', return: 'enter', del: 'delete', up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright', spacebar: 'space', plus: '+' };

/**
 * A combo as data: { key, mod, ctrl, meta, alt, shift }. The key is lower
 * case (`escape`, `arrowup`, `f1`, `k`, `?`), with the aliases `esc`,
 * `return`, `del`, `up`, `down`, `left`, `right`, `spacebar` and `plus`; `+`
 * alone is the plus key. A combo without a key or with an unknown modifier
 * throws.
 * @param {string} combo
 * @returns {{ key: string, mod: boolean, ctrl: boolean, meta: boolean, alt: boolean, shift: boolean }}
 */
export function parse(combo) {
  const parts = String(combo ?? '').trim().toLowerCase().split('+').map((part) => part.trim());
  let key;
  // 'mod++' and '+': the two empty parts at the end are the plus key.
  if (parts.length > 1 && parts[parts.length - 1] === '' && parts[parts.length - 2] === '') {
    parts.length -= 2;
    key = '+';
  } else key = parts.pop();
  if (!key) throw new Error(`DS.hotkeys: no key in the combo "${combo}"`);
  const spec = { key: KEY_ALIASES[key] ?? key, mod: false, ctrl: false, meta: false, alt: false, shift: false };
  for (const part of parts) {
    if (!Object.hasOwn(MODIFIERS, part)) throw new Error(`DS.hotkeys: unknown modifier "${part}" in the combo "${combo}"`);
    spec[MODIFIERS[part]] = true;
  }
  return spec;
}

/**
 * Whether this is an Apple system, where `mod` means Command.
 * @param {any} [view]
 * @returns {boolean}
 */
export function isApple(view = globalThis) {
  const nav = view?.navigator;
  return /mac|iphone|ipad|ipod/i.test(nav?.userAgentData?.platform || nav?.platform || '');
}

/**
 * Whether a keyboard event is this combo (a string or what parse() gives).
 * Only the combo's modifiers may be held; AltGr types a character, so it
 * counts as neither Control nor Alt.
 * @param {KeyboardEvent} event
 * @param {string|ReturnType<typeof parse>} combo
 * @returns {boolean}
 */
export function matches(event, combo) {
  const spec = typeof combo === 'string' ? parse(combo) : combo;
  const apple = isApple(event.view ?? globalThis);
  const altGr = event.getModifierState?.('AltGraph') === true;
  if ((event.ctrlKey && !altGr) !== (spec.ctrl || (spec.mod && !apple))) return false;
  if (event.metaKey !== (spec.meta || (spec.mod && apple))) return false;
  if ((event.altKey && !altGr) !== spec.alt) return false;
  const pressed = (event.key ?? '').toLowerCase();
  const name = pressed === ' ' ? 'space' : pressed;
  const { key } = spec;
  const letter = /^[a-z]$/.test(key);
  const digit = /^[0-9]$/.test(key);
  // A character other than a letter or a digit is what it types, whatever Shift it took here.
  if (key.length === 1 && !letter && !digit) return name === key && (!spec.shift || event.shiftKey);
  // A digit some layouts type with Shift (a French one).
  if (digit && name === key && (!spec.shift || event.shiftKey)) return true;
  if (event.shiftKey !== spec.shift) return false;
  if (name === key) return true;
  if (letter) return event.code === `Key${key.toUpperCase()}` && !/^[\x20-\x7e]$/.test(event.key ?? '');
  if (digit) return event.code === `Digit${key}` && !/^[a-z0-9]$/i.test(event.key ?? '');
  return false;
}

/** Word keys, by the string that names them (DS.core.t). */
const KEY_STRINGS = { enter: 'keyEnter', escape: 'keyEscape', space: 'keySpace', tab: 'keyTab', backspace: 'keyBackspace', delete: 'keyDelete', home: 'keyHome', end: 'keyEnd', pageup: 'keyPageUp', pagedown: 'keyPageDown' };

const ARROWS = { arrowup: '↑', arrowdown: '↓', arrowleft: '←', arrowright: '→' };

const capital = (word) => word.charAt(0).toUpperCase() + word.slice(1);

/** The key as aria-keyshortcuts names it: `K`, `Enter`, `ArrowUp`, `PageDown`, `F1`, `?`. */
function ariaKey(key) {
  if (key.startsWith('arrow') && key.length > 5) return `Arrow${capital(key.slice(5))}`;
  if (key.startsWith('page') && key.length > 4) return `Page${capital(key.slice(4))}`;
  return key.length === 1 ? key.toUpperCase() : capital(key);
}

function keyLabel(key) {
  if (Object.hasOwn(KEY_STRINGS, key)) return t(KEY_STRINGS[key]);
  if (Object.hasOwn(ARROWS, key)) return ARROWS[key];
  return key.length === 1 || /^f\d+$/.test(key) ? key.toUpperCase() : capital(key);
}

/**
 * A combo for people and for assistive tech on this platform (`apple`
 * overrides it): `keys` one label per key, for a <kbd class="ds-kbd"> each
 * (⌃ ⌥ ⇧ ⌘ on Apple systems, else the strings keyCtrl, keyAlt, keyShift and
 * keyMeta); `text` the one line ('⌘⇧K', 'Ctrl+Shift+K'); `aria` the value
 * of aria-keyshortcuts ('Meta+Shift+K', 'Control+Shift+K').
 * @param {string} combo
 * @param {{ apple?: boolean }} [options]
 * @returns {{ keys: string[], text: string, aria: string }}
 */
export function format(combo, options = {}) {
  const spec = parse(combo);
  const apple = options.apple ?? isApple();
  const ctrl = spec.ctrl || (spec.mod && !apple);
  const meta = spec.meta || (spec.mod && apple);
  const held = [[ctrl, '⌃', 'keyCtrl', 'Control'], [spec.alt, '⌥', 'keyAlt', 'Alt'], [spec.shift, '⇧', 'keyShift', 'Shift'], [meta, '⌘', 'keyMeta', 'Meta']].filter(([on]) => on);
  const keys = [...held.map(([, glyph, string]) => (apple ? glyph : t(string))), keyLabel(spec.key)];
  return {
    keys,
    text: keys.join(apple ? '' : '+'),
    aria: [...held.map(([, , , name]) => name), ariaKey(spec.key)].join('+'),
  };
}

const rootOf = (root) => root ?? globalThis.document;

function stateOf(root) {
  let state = shared.roots.get(root);
  if (!state) {
    state = { entries: [], scopes: [], subscribers: new Set(), listener: null, count: 0 };
    shared.roots.set(root, state);
  }
  return state;
}

/** The active scopes, the one that counts first at the head: down the stack to the first exclusive one, else 'global' last. */
function activeScopes(state) {
  const active = [];
  for (let at = state.scopes.length - 1; at >= 0; at -= 1) {
    const { name, exclusive } = state.scopes[at];
    if (!active.includes(name)) active.push(name);
    if (exclusive) return active;
  }
  if (!active.includes(GLOBAL)) active.push(GLOBAL);
  return active;
}

/** Whether the entry may take this key press on `target`, for the combo that matched. */
function allowedOn(entry, spec, target) {
  if (entry.fields !== undefined) return entry.fields === true || !readsKeys(target);
  return spec.mod || spec.ctrl || spec.meta || !readsKeys(target);
}

/** Runs the registration a key press belongs to (the file comment has the order). */
function dispatch(root, state, event) {
  if (event.defaultPrevented || event.isComposing) return;
  const path = event.composedPath?.() ?? [];
  const target = path[0] ?? event.target;
  const layer = topmost(root.ownerDocument ?? root);
  const active = activeScopes(state);
  const found = [];
  for (const entry of state.entries) {
    const rank = active.indexOf(entry.scope);
    if (rank < 0) continue;
    const spec = entry.specs.find((each) => matches(event, each));
    if (!spec) continue;
    const depth = entry.within ? path.indexOf(entry.within) : Infinity;
    if (depth < 0) continue;
    const home = entry.owner ?? entry.within;
    if (layer && !entry.overlays && !(home && layer.contains(home))) continue;
    if (event.repeat && !entry.repeat) continue;
    if (!allowedOn(entry, spec, target)) continue;
    if (entry.when && !entry.when(event)) continue;
    found.push({ entry, depth, rank });
  }
  // Two entries without `within` give Infinity - Infinity, NaN: falsy, a tie, as it should.
  found.sort((a, b) => a.depth - b.depth || a.rank - b.rank || b.entry.order - a.entry.order);
  for (const { entry } of found) {
    if (entry.handler(event) === false) continue;
    event.preventDefault();
    return;
  }
}

/** The keydown listener while there is a registration, and the news for an open sheet. */
function changed(root, state) {
  if (state.entries.length && !state.listener) {
    state.listener = (event) => dispatch(root, state, event);
    root.addEventListener('keydown', state.listener);
  } else if (!state.entries.length && state.listener) {
    root.removeEventListener('keydown', state.listener);
    state.listener = null;
  }
  for (const fn of [...state.subscribers]) fn();
}

/**
 * Registers a shortcut: `combo` (a string, or a list of alternatives) calls
 * `handler(event)`; a handler that returns false passes the key on.
 * `description` and `group` (default: the string hotkeysGeneral) are for
 * list(), which leaves out a registration without a description. `scope`
 * (default 'global'). `within`: an element the key press must come from.
 * `owner`: the element this belongs to, when it is no `within`: in an open
 * overlay it still counts. `overlays: true` counts over any overlay.
 * `fields`: true counts in fields too, false never (default: only a combo
 * with Control or Command). `repeat: true` takes a held key. `when(event)`:
 * false skips it for this press. `root` (default: the document).
 * The last registration of a combo wins while it lives; destroy() brings
 * the one before it back. A bad combo throws here.
 * @param {string|string[]} combo
 * @param {(event: KeyboardEvent) => unknown} handler
 * @param {{ description?: string|null, group?: string|null, scope?: string, within?: Element|null, owner?: Element|null, overlays?: boolean, fields?: boolean, repeat?: boolean, when?: (event: KeyboardEvent) => boolean, root?: Document|ShadowRoot|Element|null }} [options]
 * @returns {{ destroy: () => void }}
 */
export function register(combo, handler, options = {}) {
  if (typeof handler !== 'function') throw new TypeError('DS.hotkeys.register: the handler must be a function');
  const combos = (Array.isArray(combo) ? combo : [combo]).map(String);
  if (!combos.length) throw new Error('DS.hotkeys.register: no combo');
  const specs = combos.map(parse);
  const root = rootOf(options.root);
  if (!root?.addEventListener) return { destroy() {} };
  const state = stateOf(root);
  state.count += 1;
  const entry = {
    combos,
    specs,
    handler,
    identity: JSON.stringify(specs),
    order: state.count,
    description: options.description ?? null,
    group: options.group ?? null,
    scope: options.scope ?? GLOBAL,
    within: options.within ?? null,
    owner: options.owner ?? null,
    overlays: options.overlays === true,
    fields: options.fields,
    repeat: options.repeat === true,
    when: options.when ?? null,
  };
  state.entries.push(entry);
  changed(root, state);
  return {
    destroy() {
      const at = state.entries.indexOf(entry);
      if (at < 0) return;
      state.entries.splice(at, 1);
      changed(root, state);
    },
  };
}

/**
 * Turns the scope `name` on until destroy(): its shortcuts count, before
 * those of the scopes turned on earlier. `exclusive: true` masks every scope
 * below it, 'global' too. `root` (default: the document).
 * @param {string} name
 * @param {{ exclusive?: boolean, root?: Document|ShadowRoot|Element|null }} [options]
 * @returns {{ destroy: () => void }}
 */
export function scope(name, options = {}) {
  const root = rootOf(options.root);
  if (!root?.addEventListener) return { destroy() {} };
  const state = stateOf(root);
  const entry = { name: String(name), exclusive: options.exclusive === true };
  state.scopes.push(entry);
  changed(root, state);
  return {
    destroy() {
      const at = state.scopes.indexOf(entry);
      if (at < 0) return;
      state.scopes.splice(at, 1);
      changed(root, state);
    },
  };
}

/**
 * The scopes that count now, the one that counts first at the head.
 * @param {{ root?: Document|ShadowRoot|Element|null }} [options]
 * @returns {string[]}
 */
export function scopes(options = {}) {
  const root = rootOf(options.root);
  return root?.addEventListener ? activeScopes(stateOf(root)) : [GLOBAL];
}

/**
 * The data of a shortcut sheet: the groups in the order they were first
 * registered, each `{ name, items }`, an item `{ description, scope, active,
 * combos: [{ combo, keys, text, aria }] }` (format()). Only registrations
 * with a description, without those a later one with the same combos, scope
 * and `within` replaces. `active`: its scope counts now. `activeOnly: true`
 * leaves the others out. `apple` overrides the platform.
 * @param {{ root?: Document|ShadowRoot|Element|null, activeOnly?: boolean, apple?: boolean }} [options]
 * @returns {{ name: string, items: { description: string, scope: string, active: boolean, combos: { combo: string, keys: string[], text: string, aria: string }[] }[] }[]}
 */
export function list(options = {}) {
  const root = rootOf(options.root);
  if (!root?.addEventListener) return [];
  const state = stateOf(root);
  const active = activeScopes(state);
  const groups = new Map();
  for (const [at, entry] of state.entries.entries()) {
    if (!entry.description) continue;
    if (state.entries.slice(at + 1).some((later) => later.scope === entry.scope && later.within === entry.within && later.identity === entry.identity)) continue;
    const isActive = active.includes(entry.scope);
    if (options.activeOnly && !isActive) continue;
    const name = entry.group ?? t('hotkeysGeneral');
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push({
      description: entry.description,
      scope: entry.scope,
      active: isActive,
      combos: entry.combos.map((combo) => ({ combo, ...format(combo, { apple: options.apple }) })),
    });
  }
  return [...groups].map(([name, items]) => ({ name, items }));
}

/**
 * Calls `fn` after every change of what list() or scopes() give, so an open
 * sheet stays true. Returns the unsubscribe.
 * @param {() => void} fn
 * @param {{ root?: Document|ShadowRoot|Element|null }} [options]
 * @returns {() => void}
 */
export function onChange(fn, options = {}) {
  const root = rootOf(options.root);
  if (!root?.addEventListener) return () => {};
  const state = stateOf(root);
  state.subscribers.add(fn);
  return () => {
    state.subscribers.delete(fn);
  };
}

/*
 * Declarative: a press of the combo presses the button or link, or focuses
 * the field. It counts only while the element could take focus (not
 * disabled, hidden or inert) and is not aria-disabled, and over an overlay
 * only when it sits in that overlay.
 */
define('hotkey', {
  attribute: 'data-ds-hotkey',
  attributes: ['data-ds-hotkey-description', 'data-ds-hotkey-group', 'data-ds-hotkey-scope'],
  init(el) {
    const combos = (el.getAttribute('data-ds-hotkey') ?? '').split(/\s+/).filter(Boolean);
    if (!combos.length) return undefined;
    const text = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim();
    const registration = register(combos, () => {
      if (readsKeys(el)) {
        /** @type {HTMLElement} */ (el).focus();
        /** @type {HTMLInputElement} */ (el).select?.();
      } else /** @type {HTMLElement} */ (el).click();
    }, {
      description: el.getAttribute('data-ds-hotkey-description') || text || null,
      group: el.getAttribute('data-ds-hotkey-group'),
      scope: el.getAttribute('data-ds-hotkey-scope') ?? undefined,
      owner: el,
      when: () => canFocus(el) && el.getAttribute('aria-disabled') !== 'true',
      root: el.ownerDocument,
    });
    const named = el.hasAttribute('aria-keyshortcuts');
    if (!named) el.setAttribute('aria-keyshortcuts', combos.map((combo) => format(combo).aria).join(' '));
    return () => {
      registration.destroy();
      if (!named) el.removeAttribute('aria-keyshortcuts');
    };
  },
});
