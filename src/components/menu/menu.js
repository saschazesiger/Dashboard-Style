/**
 * The behaviour of a menu (DS.menu): what only a menu does once DS.overlay
 * opened it (the stack, focus return, Escape, a pointerdown outside and the
 * placement stay in the core, js/overlay.js).
 *
 *   <button aria-haspopup="menu" aria-expanded="false" data-ds-open="#row-menu">...</button>
 *   <div class="ds-menu" id="row-menu" role="menu" hidden>...</div>
 *
 *   DS.menu.open(menu, { opener });   DS.menu.close(menu);   // DS.overlay.open and close
 *   DS.menu.create(menu)              // get(), set(), on(), destroy()
 *
 * It focuses its first enabled item (the last one when an ArrowUp keydown
 * opened it), moves focus with ArrowUp, ArrowDown, Home and End (wrapping), to
 * the next item whose label starts with the typed letters (type-ahead; the
 * letters reset after --ds-delay-tooltip) and closes a task after an item's
 * click, once the item's handlers ran. Tab closes it and moves on from its
 * trigger. A menu the script placed follows its trigger through scrolling and
 * resizing. data-ds-menu-checks on the menu: the system flips its check items
 * (a menuitemcheckbox toggles, a menuitemradio takes its group's one check)
 * once the item's own handlers ran and sends ds:change ({ item, checked });
 * without it the page flips aria-checked itself, as in 2.x.
 *
 * ES2022; no progressive feature of its own.
 */
import { define, emit } from '../../js/core.js';
import { motionDuration } from '../../js/motion.js';
import { internals, open as openOverlay, close as closeOverlay, typeAhead } from '../../js/overlay.js';

const { overlays, stack, viewOf, canFocus, activeIn, closeFrom, arrowTarget, placeMenu, controllerOf, clock, topOpen } = internals;

/** The items of a menu that take focus (aria-disabled ones too: their name is read). */
function menuItems(menu) {
  return [...menu.querySelectorAll('.ds-menu__item')].filter(canFocus);
}

const enabled = (item) => item.getAttribute('aria-disabled') !== 'true';

/** The first enabled item of a menu. */
function firstItem(menu) {
  return menuItems(menu).find(enabled) ?? null;
}

/** Documents with the Tab and follow listeners. */
const listening = new WeakSet();

/** Tab out of a menu, and following its trigger: one set of listeners per document, from the first menu on. */
function listen(doc) {
  if (listening.has(doc)) return;
  listening.add(doc);
  doc.addEventListener('keydown', (/** @type {KeyboardEvent} */ event) => {
    if (event.key !== 'Tab' || event.isComposing || event.defaultPrevented) return;
    const top = topOpen();
    if (!top || overlays.get(top)?.kind !== 'menu' || !top.contains(activeIn(top))) return;
    // Tab moves on from the trigger, as if the menu had not been there.
    const opener = overlays.get(top)?.opener;
    if (canFocus(opener)) opener.focus({ preventScroll: true });
    closeFrom(top, 'tab');
  }, true);
  // A menu the script placed follows its trigger through scrolling and
  // resizing, within one frame (an anchored one follows by itself).
  const view = doc.defaultView ?? globalThis;
  let frame = 0;
  const follow = (/** @type {Event} */ event) => {
    // A menu's own scroll moves nothing it is placed by, and placing it
    // again (its cap lifted to measure) would clamp that scroll.
    if (event?.type === 'scroll' && /** @type {Element} */ (event.target)?.closest?.('.ds-menu')) return;
    if (frame || !stack.some((element) => overlays.get(element)?.kind === 'menu')) return;
    const run = () => {
      frame = 0;
      for (const element of stack) {
        const state = overlays.get(element);
        if (state?.kind === 'menu' && state.phase !== 'closed' && !element.hasAttribute('data-anchored')) placeMenu(element, state.opener);
      }
    };
    frame = typeof view.requestAnimationFrame === 'function' ? view.requestAnimationFrame(run) : 0;
    if (!frame) run();
  };
  doc.addEventListener('scroll', follow, { capture: true, passive: true });
  view.addEventListener?.('resize', follow);
}

/** The check items: only on a menu that asked for it (data-ds-menu-checks), since a 2.x page flips them itself. */
function flipCheck(menu, item) {
  if (!menu.hasAttribute('data-ds-menu-checks')) return;
  const role = item.getAttribute('role');
  if (role !== 'menuitemcheckbox' && role !== 'menuitemradio') return;
  const was = item.getAttribute('aria-checked') === 'true';
  // The radio that is already the one: nothing changed, so nothing to tell.
  if (role === 'menuitemradio' && was) return;
  const checked = role === 'menuitemradio' || !was;
  if (role === 'menuitemradio') {
    const group = item.closest('[role="group"]') ?? menu;
    for (const other of group.querySelectorAll('[role="menuitemradio"]')) other.setAttribute('aria-checked', 'false');
  }
  item.setAttribute('aria-checked', String(checked));
  emit(menu, 'change', { item, checked });
}

/**
 * A menu's own keys and items: ArrowUp, ArrowDown, Home and End move focus
 * (wrapping); an item's click closes the menu once its handlers ran (a
 * task later, so a handler further up the tree still sees it open).
 */
function wireMenu(menu) {
  // Type-ahead: the letters typed within --ds-delay-tooltip of each other.
  let typed = '';
  let typedAt = 0;
  menu.addEventListener('keydown', (/** @type {KeyboardEvent} */ event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    const items = menuItems(menu);
    const next = arrowTarget(items, event);
    if (next) {
      typed = '';
      event.preventDefault();
      next.focus();
      return;
    }
    // A printable key; a space only within a word (alone it activates the item).
    if (event.key.length !== 1 || (event.key === ' ' && !typed)) return;
    const now = clock();
    if (now - typedAt > motionDuration(menu, '--ds-delay-tooltip')) typed = '';
    typedAt = now;
    typed += event.key.toLowerCase();
    const match = typeAhead(items, /** @type {Element} */ (event.target)?.closest?.('.ds-menu__item'), typed);
    if (!match) return;
    event.preventDefault();
    match.focus();
  });
  menu.addEventListener('click', (/** @type {MouseEvent} */ event) => {
    const item = /** @type {Element} */ (event.target)?.closest?.('.ds-menu__item');
    if (!item || !menu.contains(item) || !enabled(item) || /** @type {any} */ (item).disabled) return;
    const state = overlays.get(menu);
    if (state?.phase !== 'open') return;
    const gen = state.gen;
    flipCheck(menu, item);
    setTimeout(() => {
      if (state.gen === gen && state.phase === 'open') closeFrom(menu, 'item');
    });
  });
}

/** Focus when it opens: from an ArrowUp keydown (the trigger's handler is running) the last item, as in a native menu. */
function focusInto(menu) {
  const event = /** @type {any} */ (viewOf(menu)).event;
  const last = event?.type === 'keydown' && event.key === 'ArrowUp';
  (last ? menuItems(menu).filter(enabled).at(-1) : firstItem(menu))?.focus({ preventScroll: true });
}

/**
 * Opens a menu: DS.overlay.open().
 * @param {Element} element
 * @param {{ opener?: Element|null, returnTo?: () => Element|null|undefined }} [options]
 * @returns {Promise<void>}
 */
export function open(element, options = {}) {
  return openOverlay(element, options);
}

/**
 * Closes a menu: DS.overlay.close().
 * @param {Element} element
 * @param {{ reason?: string }} [options]
 * @returns {Promise<void>}
 */
export function close(element, options = {}) {
  return closeOverlay(element, options);
}

/**
 * The controller of a menu, the one [data-ds-menu] makes.
 * @param {Element} element
 * @returns {ReturnType<typeof controllerOf>}
 */
export function create(element) {
  return controllerOf(element);
}

define('menu', {
  attribute: 'data-ds-menu',
  init: (element) => create(element),
});

internals.use('menu', {
  focusInto,
  wire(menu) {
    listen(menu.ownerDocument);
    wireMenu(menu);
  },
});
