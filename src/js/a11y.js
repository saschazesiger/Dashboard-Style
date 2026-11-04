/**
 * Accessibility helpers (3.0): the focus and speech tools a behaviour
 * needs, in one module, so no component writes its own.
 *
 *   const hold = DS.a11y.trap(panel);             // Tab stays inside; hold.destroy() returns focus
 *   DS.a11y.roving(toolbar, { activate: false }); // one tab stop, arrow keys (DS.dom.roving)
 *   DS.a11y.typeahead(list);                      // typing a label moves focus to its item
 *   DS.a11y.announce('Saved');                    // spoken, not shown (DS.overlay.announce)
 *
 * trap() is for a region that is no overlay (a tour step, a full-screen
 * editor): it keeps the Tab key inside and pulls stray focus back. It does
 * not make the page inert and takes no scroll lock: a dialog, a sheet or
 * the modal drawer goes through DS.overlay.open(), which is their trap.
 * Traps stack per document (the last one holds; destroying it wakes the one
 * below), and a trap rests while an overlay it does not sit in is open, so
 * a dialog opened from a trapped region keeps its focus. Snackbars stay
 * usable above a trap, as above every modal.
 *
 * roving() and announce() are the functions of DS.dom and DS.overlay under
 * this name, so what a behaviour needs for its keys is one import. The
 * focusable list and the canFocus() test are DS.overlay's, the test for a
 * field that takes text is DS.dom's.
 *
 * Every timing comes from the computed tokens (motionDuration): type-ahead
 * joins the letters typed within --ds-delay-tooltip of each other.
 */

import { runtime } from './core.js';
import { motionDuration } from './motion.js';
import { roving as rovingOf, typesText } from './dom.js';
import { announce as announceOf, canFocus, FOCUSABLE, topmost } from './overlay.js';

/**
 * This module's shared state (runtime.state('a11y')): per document the
 * stack of traps, per container its handle. Every copy of the module uses
 * the same stack, so the last trap holds, whichever copy made it.
 * @type {{ stacks: WeakMap<Document, any[]>, traps: WeakMap<Element, { destroy: () => void }> }}
 */
const shared = runtime.state('a11y', () => ({ stacks: new WeakMap(), traps: new WeakMap() }));

const isRadio = (node) => node.tagName === 'INPUT' && node.type === 'radio' && Boolean(node.name);

/**
 * The elements inside `root` that the Tab key stops at, in DOM order:
 * enabled, rendered, visible, not inert or hidden, without a negative
 * tabindex; a named radio group counts once (its checked radio, else the
 * first), as the engines do. A positive tabindex keeps its DOM place here:
 * the system never writes one.
 * @param {Element|null|undefined} root
 * @returns {HTMLElement[]}
 */
export function tabbables(root) {
  if (!root?.querySelectorAll) return [];
  const candidates = [...root.querySelectorAll(FOCUSABLE)].filter((node) => {
    if (Number(node.getAttribute('tabindex')) < 0 || !canFocus(node)) return false;
    const view = node.ownerDocument?.defaultView;
    return typeof view?.getComputedStyle !== 'function' || view.getComputedStyle(node).visibility !== 'hidden';
  });
  const groups = new Map();
  for (const node of candidates) {
    if (!isRadio(node)) continue;
    if (!groups.has(node.name) || node.checked) groups.set(node.name, node);
  }
  return candidates.filter((node) => !isRadio(node) || groups.get(node.name) === node);
}

/** The roles of the widgets that read plain keys themselves (type-ahead, typing). */
const KEY_WIDGETS = '[role="textbox"], [role="searchbox"], [role="combobox"], [role="spinbutton"], [role="listbox"], [role="menu"], [role="menubar"], [role="tree"], [role="treegrid"]';

/**
 * Whether plain keys typed on `node` already mean something: a field that
 * takes text, a select, or a widget with type-ahead. A read-only field and
 * a checkbox do not: there a plain key has nothing to do.
 * @param {Element|null|undefined} node
 * @returns {boolean}
 */
export function readsKeys(node) {
  if (!node?.closest) return false;
  return typesText(node) || node.tagName === 'SELECT' || Boolean(node.closest(KEY_WIDGETS));
}

/**
 * Keeps the Tab key inside `container` until destroy(), and pulls focus
 * that lands outside back to where it was inside. It moves focus in at once:
 * `initial` (an element or a selector), else [autofocus], else the first
 * tabbable, else the container itself; `initial: false`, or focus already
 * inside without an `initial`, leaves it. destroy() gives focus back to
 * `returnFocus` (default: what had it before; false: nowhere) when focus is
 * still inside or nowhere. Once per container (a second call returns the
 * same handle).
 * @param {Element|null|undefined} container
 * @param {{ initial?: Element|string|false, returnFocus?: Element|false }} [options]
 * @returns {{ destroy: () => void }}
 */
export function trap(container, options = {}) {
  const doc = container?.ownerDocument;
  if (!doc) return { destroy() {} };
  const existing = shared.traps.get(container);
  if (existing) return existing;
  // In a shadow root the document only knows the host: ask the root the container lives in.
  const scope = container.getRootNode?.() ?? doc;
  const activeNow = () => scope.activeElement ?? null;
  const before = doc.activeElement;
  const addedTabindex = !container.hasAttribute('tabindex');
  const stack = shared.stacks.get(doc) ?? [];
  shared.stacks.set(doc, stack);
  const entry = { last: null };
  stack.push(entry);

  const focusBox = () => {
    if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1');
    /** @type {HTMLElement} */ (container).focus({ preventScroll: true });
  };
  /** Not the top trap, or an overlay it does not sit in is open: everything stays as it is. */
  const resting = () => {
    if (stack[stack.length - 1] !== entry) return true;
    const layer = topmost(doc);
    return Boolean(layer && !layer.contains(container));
  };
  const onKey = (/** @type {KeyboardEvent} */ event) => {
    if (event.key !== 'Tab' || event.defaultPrevented || resting()) return;
    const active = activeNow();
    // A snackbar's buttons are usable above the trap: Tab walks them, and from the end of the region comes back in.
    const toasts = active?.closest?.('.ds-toasts');
    if (toasts) {
      const own = tabbables(toasts);
      if (active !== own[event.shiftKey ? 0 : own.length - 1]) return;
    }
    const list = tabbables(container);
    const first = list[0];
    const last = list[list.length - 1];
    let next = null;
    if (!first) next = container;
    else if (!active || !container.contains(active)) next = event.shiftKey ? last : first;
    else if (event.shiftKey && (active === first || active === container)) next = last;
    else if (!event.shiftKey && active === last) next = first;
    if (!next) return;
    event.preventDefault();
    if (next === container) focusBox();
    else next.focus();
  };
  const onFocus = (/** @type {FocusEvent} */ event) => {
    const path = event.composedPath?.() ?? [event.target];
    if (path.includes(container)) {
      entry.last = path[0];
      return;
    }
    if (resting() || path.some((node) => node.matches?.('.ds-toasts'))) return;
    const back = canFocus(entry.last) && container.contains(entry.last) ? entry.last : tabbables(container)[0];
    if (back) back.focus({ preventScroll: true });
    else focusBox();
  };
  // Capture: a page handler that stops the event must not open the trap.
  doc.addEventListener('keydown', onKey, true);
  doc.addEventListener('focusin', onFocus, true);

  const active = activeNow();
  if (options.initial !== false && (options.initial !== undefined || !active || !container.contains(active))) {
    const wanted = typeof options.initial === 'string' ? container.querySelector(options.initial)
      : options.initial ?? container.querySelector('[autofocus]');
    const target = canFocus(wanted) ? wanted : tabbables(container)[0];
    if (target) /** @type {HTMLElement} */ (target).focus({ preventScroll: true });
    else focusBox();
  } else if (active && container.contains(active)) entry.last = active;

  const handle = {
    destroy() {
      if (shared.traps.get(container) !== handle) return;
      shared.traps.delete(container);
      stack.splice(stack.indexOf(entry), 1);
      doc.removeEventListener('keydown', onKey, true);
      doc.removeEventListener('focusin', onFocus, true);
      const now = doc.activeElement;
      const lost = !now || now === doc.body || container.contains(activeNow());
      if (addedTabindex) container.removeAttribute('tabindex');
      const home = options.returnFocus === undefined ? before : options.returnFocus;
      if (home && lost && canFocus(home)) /** @type {HTMLElement} */ (home).focus({ preventScroll: true });
    },
  };
  shared.traps.set(container, handle);
  return handle;
}

/**
 * DS.dom.roving() under this module's name: one tab stop for a set of
 * items, the arrow keys, Home and End between them. The same function, so
 * a container has one roving focus whichever name set it up.
 * @param {Element|null|undefined} container
 * @param {{ items?: string, orientation?: 'horizontal'|'vertical'|'both', wrap?: boolean, activate?: 'focus'|'manual'|false, onActivate?: (item: Element) => void }} [options]
 * @returns {{ destroy: () => void }}
 */
export function roving(container, options = {}) {
  return rovingOf(container, options);
}

/** The items typeahead() moves through by default. */
const TYPEAHEAD_ITEMS = '[role="option"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="treeitem"], [role="tab"], [role="radio"]';

/** What an item is called for type-ahead: its aria-label, else its text; collapsed, lower case. */
const labelOf = (item) => (item.getAttribute?.('aria-label') || item.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * The item the typed letters lead to: the next one after `current`
 * (wrapping) whose label starts with them; one letter typed again and again
 * cycles through the items with that letter. A longer search may stay on
 * the current item. `label(item)` gives the lower-case label (default: its
 * aria-label, else its text). `typed` is lower case.
 * @param {Element[]} items
 * @param {Element|null|undefined} current
 * @param {string} typed
 * @param {(item: Element) => string} [label]
 * @returns {Element|null}
 */
export function typeaheadMatch(items, current, typed, label = labelOf) {
  const repeated = typed.length > 1 && [...typed].every((char) => char === typed[0]);
  const start = items.indexOf(current);
  const from = typed.length === 1 || repeated ? start + 1 : Math.max(0, start);
  for (const text of repeated ? [typed, typed[0]] : [typed]) {
    for (let step = 0; step < items.length; step += 1) {
      const item = items[(from + step) % items.length];
      if (label(item).startsWith(text)) return item;
    }
  }
  return null;
}

/** Live typeahead() handles. @type {WeakMap<Element, { destroy: () => void }>} */
const typeaheads = new WeakMap();

/**
 * Typing a label moves focus to its item: the letters typed within
 * --ds-delay-tooltip of each other are one search, a navigation key starts
 * a new one, a space counts only within a word (alone it activates the
 * item), and a field inside the container keeps its letters. `items`: a
 * selector or a function (default: every option, menu item, tree item, tab
 * and radio); disabled and hidden items are skipped, aria-disabled ones are
 * reached (their name is read). `label(item)`: see typeaheadMatch().
 * `onMatch(item)` replaces item.focus(). Delegated on the container, so it
 * survives a re-render; once per container (a second call returns the same
 * handle). Works next to roving(): focus moved here moves the tab stop.
 * @param {Element|null|undefined} container
 * @param {{ items?: string|(() => Element[]), label?: (item: Element) => string, onMatch?: (item: Element) => void }} [options]
 * @returns {{ destroy: () => void }}
 */
export function typeahead(container, options = {}) {
  if (!container?.addEventListener) return { destroy() {} };
  const existing = typeaheads.get(container);
  if (existing) return existing;
  const selector = options.items ?? TYPEAHEAD_ITEMS;
  const items = () => (typeof selector === 'function' ? [...selector()] : [...container.querySelectorAll(selector)]).filter(canFocus);
  let typed = '';
  let typedAt = 0;
  const onKey = (/** @type {KeyboardEvent} */ event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    const target = /** @type {Element} */ (event.target);
    if (typesText(target) || target?.tagName === 'SELECT') return;
    const key = event.key ?? '';
    if (key.length !== 1) {
      if (/^(arrow|home|end|page)/i.test(key)) typed = '';
      return;
    }
    if (event.timeStamp - typedAt > motionDuration(container, '--ds-delay-tooltip')) typed = '';
    if (key === ' ' && !typed) return;
    typedAt = event.timeStamp;
    typed += key.toLowerCase();
    const list = items();
    const current = list.find((item) => item === target || item.contains(target));
    const match = typeaheadMatch(list, current, typed, options.label);
    if (!match) return;
    event.preventDefault();
    if (typeof options.onMatch === 'function') options.onMatch(match);
    else /** @type {HTMLElement} */ (match).focus();
  };
  container.addEventListener('keydown', onKey);
  const handle = {
    destroy() {
      if (typeaheads.get(container) !== handle) return;
      typeaheads.delete(container);
      container.removeEventListener('keydown', onKey);
    },
  };
  typeaheads.set(container, handle);
  return handle;
}

/**
 * DS.overlay.announce() under this module's name: says `text` to screen
 * readers without showing anything: polite, or assertive with `assertive:
 * true`. The same text twice is spoken twice; empty text does nothing.
 * @param {string} text
 * @param {{ assertive?: boolean, region?: Element|null }} [options]
 */
export function announce(text, options = {}) {
  announceOf(text, options);
}
