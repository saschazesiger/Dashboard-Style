/**
 * Overlays (D18): the dialog, the side sheet, the modal drawer and the
 * popups (.ds-menu, .ds-combo__popup) open and close through one pair of
 * calls, so focus, inertness, Escape and the scroll lock behave the same
 * everywhere.
 *
 *   DS.overlay.open(dialog, { opener: button });   // a Promise: the entrance settled
 *   DS.overlay.close(dialog);                      // a Promise: hidden again
 *
 * Kinds, recognised by class: a native <dialog class="ds-dialog | ds-sheet">
 * (showModal() is the focus trap and makes the page inert), the div
 * markup .ds-dialog / .ds-sheet (the siblings of the overlay and of each
 * of its ancestors up to <body> turn inert, .ds-scrim excepted), the modal
 * drawer .ds-drawer (only while (max-width: 900px) matches; wider, open()
 * resolves at once) and the popups .ds-menu and .ds-combo__popup (no
 * trap, no lock). Any other element is opened like a popup.
 *
 * Motion is state-driven: open() sets data-state="closed", flushes style,
 * writes the origin (originFrom(opener, box) for dialogs and popups) and
 * sets data-state="open"; close() sets data-state="closed". The CSS
 * transitions keyed on data-state therefore reverse from the current value
 * when a close is taken back (D21). The drawer keeps its P4 attribute,
 * data-drawer-open on .ds-app.
 *
 * Every element has one state with a generation: a later open() or
 * close() supersedes an earlier call, whose promise then resolves without
 * acting. A second close() during an exit returns the same promise; open()
 * on an open overlay does nothing.
 *
 * Close order (the same for dialog, sheet and modal drawer): release the
 * trap (native: dialog.close() at once plus .ds-dialog--closing /
 * .ds-sheet--closing, which keeps it displayed and stacked outside the top
 * layer; div: restore the inert it set), focus the opener at once (gone:
 * the nearest tabindex="-1" landmark, never <body>), make only the box or
 * panel inert (the backdrop keeps swallowing clicks, and a mousedown on
 * it or the drawer's scrim is prevented, so focus stays on the opener), set
 * data-state="closed", wait for settled(), then hide (div: hidden; native:
 * drop --closing), clear the box's inert and .ds-dialog--nested, unlock
 * the scroll and leave the Escape stack, in one task. Popups return focus
 * to their opener only when it was inside them and the close was not a
 * click outside.
 *
 * Container transform (opt-in): open(el, { opener, container: true }) on
 * a dialog or side sheet runs the open inside DS.motion.transition() with
 * type 'container', so the opener (a card, a row) grows into the box or
 * panel on the spring over --ds-dur-long while the scrim fades with the
 * root's crossfade; the overlay skips its own entrance for that open (the
 * live image would grow twice), and the page frame and the sheet's body
 * keep no view-transition-name meanwhile (named, they would paint above
 * the scrim or apart from the panel). The page is frozen while it runs, so
 * it is never the default. close() keeps its own exit. Without View
 * Transitions, or without .ds-theme on <html>, it is the usual entrance
 * from the opener; an opener that its scroller clips (a group would paint
 * its hidden part over the top bar) gets that entrance inside a short
 * fade-through.
 *
 * Escape stack: one keydown listener on the document (bubble phase, so a
 * widget inside the overlay that handles Escape itself and calls
 * preventDefault() keeps it open) closes the topmost overlay that is not
 * already closing, unless a tooltip took the key. A native dialog's cancel
 * event is turned into close(), so its exit plays. Closing a dialog, sheet
 * or the drawer first closes the menus and lists open inside it and hides
 * the tooltip. [data-close] inside an overlay closes it (ignored while
 * closing); the scrim closes the modal drawer; a menu also closes on Tab
 * (focus goes back to its trigger and Tab moves on from there) and on a
 * pointerdown outside the menu and its trigger.
 *
 * Popups (D17): a menu or a combobox list is placed before it enters, at
 * rest size, then grows from its trigger (originFrom(): the origin and the
 * clip edge). Where popover and CSS anchor positioning exist it opens as
 * popover="manual" in the top layer, anchored to its trigger (a combobox
 * list to its field, as wide as the field), so no scrolling box clips it;
 * elsewhere a menu is placed by --ds-menu-x/-y (below the trigger from its
 * start edge, towards the start edge without room, following scroll and
 * resize) and a combobox list stays absolute under its field. A popup
 * opens below when it fits, else on the side with more room
 * (data-placement="top" above; for the list, the viewport narrowed by
 * clipping boxes), never taller than that room (anchored: the CSS cap of
 * its position-area; else an inline max-height), so it never covers its
 * trigger. Over an open native dialog or sheet (showModal() makes the
 * rest inert, top-layer popovers too) a menu, popup, dialog or sheet (div
 * or native) moves inside it while it shows and back once closed; a native
 * one so that its exit, outside the top layer at once, stays above the
 * sheet's panel and its scrim keeps catching clicks. A menu focuses
 * its first enabled item (the last one when an ArrowUp keydown opened it),
 * moves focus with ArrowUp, ArrowDown, Home and End (wrapping) and closes a
 * task after an item's click, once the item's handlers ran.
 *
 * Scroll lock: reference-counted (lockScroll / unlockScroll; modal kinds
 * call them). body.ds-no-scroll (needs .ds-base) toggles only on 0 <-> 1.
 * When the lock really removes a classic scrollbar of the page, its room
 * is kept: scrollbar-gutter: stable on <html>, else a padding-right on
 * <body>; in the app frame, where .ds-view scrolls, nothing is reserved.
 *
 * Inert follows the stack: each div trap (and the drawer) records what
 * it took, and an element is inert while a trap holds it and no overlay
 * above that trap sits inside it. So overlays opened over each other (a
 * dialog from a div sheet or from the modal drawer) take input, and
 * closing in any order restores exactly what was taken.
 *
 * Snackbars (D19): toast(region, content, options) builds or takes a
 * .ds-toast and shows at most TOAST_LIMIT at once; insertions and removals
 * run inside DS.motion.flip(), so the messages on screen glide while one
 * enters or fades out in place. A fourth replaces the oldest message that
 * would close by itself; behind three that stay it waits in a queue. The
 * timer (length-dependent, --ds-time-scale included) pauses while a pointer
 * is over a message, focus is in the region or the tab is hidden. Text is
 * announced through two .ds-sr live regions next to the region; a focused
 * message that leaves hands focus to the next close button, else to where
 * focus came from, never to <body>. An open dialog or side sheet takes the
 * regions of its theme in (with a sheet they glide to its panel's edge on
 * the sheet's timing), so messages stay above its scrim, usable and
 * announced; the div trap and the modal drawer never make them inert.
 * Closing, they glide back while still inside it (above its leaving scrim
 * and panel in every engine) and go back to the page once it settled.
 *
 * Tooltips (D17, WCAG 1.4.13): tooltips(root) serves every [data-tip]
 * trigger in root with one tooltip per call: shown after
 * --ds-delay-tooltip on hover (mouse and pen) and at once on keyboard
 * focus, at once again within --ds-delay-tooltip-skip of the last hide
 * (warm-up; a visible one swaps text and place in place; anchored, its
 * data-placement is read again two frames later), hoverable during
 * the --ds-delay-tooltip-hide grace, hidden by Escape (only then is the key
 * the tooltip's), by any pointerdown and by open(). Like the snackbar
 * regions, it is never made inert by the div trap or the modal drawer, so
 * a trigger inside one shows a hoverable tooltip that is heard.
 *
 * The constants are fallbacks only (outside a .ds-theme or without a
 * DOM): JS timing comes from the computed tokens through motionDuration(),
 * which includes --ds-time-scale. Nothing touches the DOM at import.
 *
 * ES2022 (Safari 16.4); a module may import from an earlier module (the
 * build bundles it into dist/ds.js as DS.overlay); newer APIs only behind
 * feature detection, named under Progressive:.
 *
 * Progressive:
 * - scrollbar-gutter (CSS.supports; keeps the room of a removed page
 *   scrollbar): without it the body gets the same room as padding-right.
 * - showPopover and CSS anchor positioning (anchorName and position-area,
 *   both detected, anchor-size() too for a combobox list; the tooltip, a
 *   menu and a combobox list go into the top layer as popover="manual",
 *   anchored to their trigger): without them the script places them
 *   (--ds-tooltip-x/-y, --ds-menu-x/-y, the list's upward flip).
 * - moveBefore (a snackbar region that moves into a dialog or side sheet
 *   keeps its running motion and focus): without it insertBefore, focus
 *   put back, the entrances already marked played (.ds-toast--shown).
 * - startViewTransition (through DS.motion.transition(), for `container:
 *   true`, only with .ds-theme on <html>): without it the usual entrance.
 */
import { flip, motionDuration, originFrom, settled, transition } from './motion.js';
import { alertCircle, checkCircle, close as closeGlyph, iconElement, info } from './icons.js';

/** How long a snackbar stays (ms) before its length adds time; --ds-time-scale stretches it. */
export const TOAST_MS = 4000;

/** The longest a snackbar stays on its own (ms), however long its text. */
export const TOAST_MAX_MS = 10000;

/** At most this many snackbars show at once (D19). */
export const TOAST_LIMIT = 3;

/** --ds-delay-tooltip outside a theme: the wait before a tooltip shows. */
export const TOOLTIP_DELAY_MS = 500;

/** --ds-delay-tooltip-skip outside a theme: within this of the last hide the next tooltip shows at once. */
export const TOOLTIP_SKIP_MS = 300;

/** --ds-delay-tooltip-hide outside a theme: the grace before a tooltip hides (it is hoverable). */
export const TOOLTIP_HIDE_MS = 100;

/* ── State ──────────────────────────────────────────── */

/** The modal drawer exists only below this width (shell.css). */
const DRAWER_QUERY = '(max-width: 900px)';

/** Tabbable candidates; canFocus() filters them. */
const FOCUSABLE = 'a[href], area[href], button, input:not([type="hidden"]), select, textarea, summary, iframe, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [tabindex]';

/** The landmarks focus falls back to when an opener is gone (leave()'s rule). */
const LANDMARK = '.ds-view[tabindex="-1"], main[tabindex="-1"], [role="main"][tabindex="-1"]';

/** Kinds that trap focus, lock the scroll and count as "another modal" for --nested. */
const MODAL = new Set(['dialog', 'sheet', 'drawer']);

/**
 * One state per overlay element. `anchor`: the element a popup gave an
 * anchor-name (removed again on close). `home`: where an overlay that
 * moved into an open native modal came from (put back on close).
 * @typedef {{ gen: number, phase: 'closed'|'open'|'closing', kind: string, opener: Element|null,
 *   expander: Element|null, inerted: Element[], locked: boolean, hiddenClass: string,
 *   opening: Promise<void>|null, closing: Promise<void>|null, anchor: HTMLElement|null,
 *   home: { parent: Node, next: Node|null }|null }} OverlayState
 * @type {WeakMap<Element, OverlayState>}
 */
const overlays = new WeakMap();

/** Open overlays (and those still closing), the topmost last. */
const stack = /** @type {Element[]} */ ([]);

/**
 * The elements the div trap and the drawer made inert, for whichever
 * overlays took them (each overlay records its own in `inerted`).
 * syncInert() derives their inert from the stack, so overlays over each
 * other compose and closing in any order restores exactly what was taken.
 */
const managedInert = /** @type {Set<Element>} */ (new Set());

/**
 * Tooltip controllers (tooltips()): open() hides them through hide(), and
 * the Escape stack asks escape() first, which returns true when it hid a
 * visible tooltip (the key is then the tooltip's).
 * @type {Set<{ hide: () => void, escape: () => boolean }>}
 */
const tooltipControllers = new Set();

/** Documents with the Escape and pointer listeners. */
const listening = new WeakSet();

/** Elements with their [data-close] (and scrim, cancel) listeners. */
const wired = new WeakSet();

/** Drawers with their media-change listener. */
const watchedDrawers = new WeakSet();

let warned = false;

function stateOf(element) {
  let state = overlays.get(element);
  if (!state) {
    state = { gen: 0, phase: 'closed', kind: kindOf(element), opener: null, expander: null, inerted: [], locked: false, hiddenClass: '', opening: null, closing: null, anchor: null, home: null, container: null };
    overlays.set(element, state);
  }
  return state;
}

/** @returns {'dialog'|'sheet'|'drawer'|'menu'|'combo'|'popup'} */
function kindOf(element) {
  if (element.matches('.ds-drawer')) return 'drawer';
  if (element.matches('.ds-dialog')) return 'dialog';
  if (element.matches('.ds-sheet')) return 'sheet';
  if (element.matches('.ds-menu')) return 'menu';
  if (element.matches('.ds-combo__popup')) return 'combo';
  return 'popup';
}

/** The part that moves and holds the content: the dialog's box, the sheet's panel, else the element. */
function boxOf(element, kind) {
  if (kind === 'dialog') return element.querySelector('.ds-dialog__box') ?? element;
  if (kind === 'sheet') return element.querySelector('.ds-sheet__panel') ?? element;
  return element;
}

const isNative = (element) => element.tagName === 'DIALOG' && typeof element.showModal === 'function';

const viewOf = (element) => element.ownerDocument?.defaultView ?? globalThis;

/** A style flush: the closed state is computed before the open one is set. */
function flushStyle(element) {
  const view = viewOf(element);
  if (typeof view.getComputedStyle === 'function') void view.getComputedStyle(element).opacity;
}

/* ── Focus ──────────────────────────────────────────── */

/** Whether focus() would land on the node (enabled, rendered, not inert or hidden). */
function canFocus(node) {
  if (!node || node.isConnected === false || typeof node.focus !== 'function') return false;
  if (node.disabled || node.closest?.('[inert], [hidden]')) return false;
  return typeof node.getClientRects !== 'function' || node.getClientRects().length > 0;
}

/** The first tabbable element inside `root`. */
function firstFocusable(root) {
  for (const node of root.querySelectorAll(FOCUSABLE)) {
    if (node.getAttribute('tabindex') === '-1') continue;
    if (canFocus(node)) return node;
  }
  return null;
}

/** The items of a menu that take focus (aria-disabled ones too: their name is read). */
function menuItems(menu) {
  return [...menu.querySelectorAll('.ds-menu__item')].filter(canFocus);
}

const enabled = (item) => item.getAttribute('aria-disabled') !== 'true';

/** The first enabled item of a menu. */
function firstItem(menu) {
  return menuItems(menu).find(enabled) ?? null;
}

/**
 * Where focus goes when `element` closes: its opener, or, when that is
 * gone or hidden inside another closed overlay, that overlay's opener;
 * else the nearest tabindex="-1" ancestor or landmark. Never <body>.
 */
function returnTarget(element, state) {
  let opener = state.opener;
  for (let depth = 0; opener && depth < 4; depth += 1) {
    if (canFocus(opener) && !element.contains(opener)) return opener;
    const host = [...stack, ...hostsOf(opener)].find((node) => node !== element && node.contains(opener));
    opener = host ? overlays.get(host)?.opener ?? null : null;
  }
  const doc = element.ownerDocument;
  const near = element.parentElement?.closest('[tabindex="-1"]');
  return [near, doc.querySelector(LANDMARK)].find((node) => canFocus(node) && !element.contains(node)) ?? null;
}

/** The overlay elements around a node that DS.overlay has seen (closed ones included). */
function hostsOf(node) {
  const hosts = [];
  for (let el = node?.parentElement; el; el = el.parentElement) if (overlays.has(el)) hosts.push(el);
  return hosts;
}

function focusInto(element, state, box) {
  const autofocus = element.querySelector('[autofocus]');
  if (canFocus(autofocus)) {
    autofocus.focus({ preventScroll: true });
    return;
  }
  if (state.kind === 'combo') return;
  if (state.kind === 'menu') {
    // Opened from an ArrowUp keydown (the trigger's handler is running):
    // the last item, as in a native menu.
    const event = /** @type {any} */ (viewOf(element)).event;
    const last = event?.type === 'keydown' && event.key === 'ArrowUp';
    (last ? menuItems(element).filter(enabled).at(-1) : firstItem(element))?.focus({ preventScroll: true });
    return;
  }
  if (state.kind === 'drawer' && element.hasAttribute('tabindex')) {
    element.focus({ preventScroll: true });
    return;
  }
  if (state.kind === 'popup') return;
  const target = firstFocusable(box);
  if (target) target.focus({ preventScroll: true });
  else {
    // Nothing to focus: the box itself takes it, so focus is inside the trap.
    if (!box.hasAttribute('tabindex')) box.setAttribute('tabindex', '-1');
    box.focus({ preventScroll: true });
  }
}

/* ── Inert outside (the div trap) ───────────────────── */

/**
 * The siblings of `element` and of each of its ancestors up to <body>
 * that its trap takes: all but .ds-scrim, the snackbar regions and their
 * announcers (they stay above every modal: usable and heard), the tooltips
 * (a trigger inside the overlay shows one that must stay hoverable and
 * heard), and what is inert already without us. syncInert() applies them.
 */
function inertOutside(element) {
  const taken = [];
  const body = element.ownerDocument.body;
  for (let node = element; node && node !== body && node.parentElement; node = node.parentElement) {
    for (const sibling of node.parentElement.children) {
      if (sibling === node || sibling.matches('.ds-scrim, .ds-toasts') || announcerNodes.has(sibling) || tooltipNodes.has(sibling)) continue;
      if (sibling.inert && !managedInert.has(sibling)) continue;
      taken.push(sibling);
    }
  }
  return taken;
}

/**
 * Sets inert from the stack: an element a trap took is inert unless it
 * holds an overlay above that trap (opened later, still open or closing).
 * So a dialog opened from a div sheet or from the modal drawer, which the
 * lower trap took as a sibling, takes input, and its scrim keeps
 * swallowing clicks through its exit; the lower overlay stays inert under
 * it. The box of a closing overlay keeps its inert.
 */
function syncInert() {
  const wanted = new Set();
  stack.forEach((element, index) => {
    const above = stack.slice(index + 1);
    for (const node of overlays.get(element)?.inerted ?? []) {
      if (node.isConnected && !above.some((other) => node.contains(other))) wanted.add(node);
    }
  });
  const closingBoxes = new Set(stack.filter((element) => overlays.get(element)?.phase === 'closing')
    .map((element) => boxOf(element, overlays.get(element)?.kind ?? '')));
  for (const node of [...managedInert]) {
    if (wanted.has(node)) continue;
    managedInert.delete(node);
    if (!closingBoxes.has(node)) node.inert = false;
  }
  for (const node of wanted) {
    managedInert.add(node);
    node.inert = true;
  }
}

function restoreInert(state) {
  state.inerted = [];
  syncInert();
}

/* ── Scroll lock ────────────────────────────────────── */

let locks = 0;
let saved = /** @type {{ gutter: string, padding: string } | null} */ (null);

function supportsGutter(view) {
  return typeof view.CSS?.supports === 'function' && view.CSS.supports('scrollbar-gutter: stable');
}

/**
 * Locks the page's scroll: the first call adds body.ds-no-scroll; later
 * calls only count. When the lock removes a classic page scrollbar, its
 * room stays (scrollbar-gutter: stable on <html>, else padding-right on
 * <body>), so the page does not shift sideways.
 */
export function lockScroll() {
  const doc = globalThis.document;
  if (!doc?.body) return;
  locks += 1;
  if (locks !== 1) return;
  const root = doc.documentElement;
  const body = doc.body;
  const view = doc.defaultView ?? globalThis;
  const before = (view.innerWidth || 0) - (root.clientWidth || 0);
  saved = { gutter: root.style.scrollbarGutter ?? '', padding: body.style.paddingRight ?? '' };
  body.classList.add('ds-no-scroll');
  // Only a scrollbar that the lock really removed leaves a gap to fill.
  const gap = before - ((view.innerWidth || 0) - (root.clientWidth || 0));
  if (!(before > 0) || !(gap > 0)) return;
  if (supportsGutter(view)) root.style.scrollbarGutter = 'stable';
  else {
    const padding = parseFloat(view.getComputedStyle?.(body).paddingRight ?? '') || 0;
    body.style.paddingRight = `${padding + gap}px`;
  }
}

/** Releases one lockScroll(); the last one removes the class and restores the inline styles. Never below 0. */
export function unlockScroll() {
  const doc = globalThis.document;
  if (!doc?.body || locks === 0) return;
  locks -= 1;
  if (locks) return;
  doc.body.classList.remove('ds-no-scroll');
  if (saved) {
    doc.documentElement.style.scrollbarGutter = saved.gutter;
    doc.body.style.paddingRight = saved.padding;
  }
  saved = null;
}

/* ── Listeners ──────────────────────────────────────── */

/** The topmost overlay that is not already closing. */
function topOpen() {
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    if (overlays.get(stack[i])?.phase === 'open') return stack[i];
  }
  return null;
}

function listen(doc) {
  if (listening.has(doc)) return;
  listening.add(doc);
  // Escape in the bubble phase: a widget inside the overlay that handles
  // the key itself (an inline edit, a picker) runs first and keeps the
  // overlay open with preventDefault(), as with a plain <dialog>. A
  // visible tooltip takes the key earlier, in its own capture listener.
  doc.addEventListener('keydown', (/** @type {KeyboardEvent} */ event) => {
    if (event.key !== 'Escape' || event.isComposing || event.defaultPrevented) return;
    for (const tip of tooltipControllers) {
      if (!tip.escape()) continue;
      // The key was the tooltip's: the overlay under it stays open.
      event.preventDefault();
      return;
    }
    const top = topOpen();
    if (!top) return;
    // preventDefault() also keeps a native dialog from its own cancel.
    event.preventDefault();
    closeFrom(top, 'escape');
  });
  doc.addEventListener('keydown', (/** @type {KeyboardEvent} */ event) => {
    if (event.key !== 'Tab' || event.isComposing || event.defaultPrevented) return;
    const top = topOpen();
    if (!top || overlays.get(top)?.kind !== 'menu' || !top.contains(doc.activeElement)) return;
    // Tab moves on from the trigger, as if the menu had not been there.
    const opener = overlays.get(top)?.opener;
    if (canFocus(opener)) opener.focus({ preventScroll: true });
    closeFrom(top, 'tab');
  }, true);
  doc.addEventListener('pointerdown', (/** @type {PointerEvent} */ event) => {
    const target = /** @type {Node} */ (event.target);
    for (const element of [...stack].reverse()) {
      const state = overlays.get(element);
      if (state?.kind !== 'menu' || state.phase !== 'open') continue;
      if (element.contains(target) || state.opener?.contains(target)) continue;
      closeFrom(element, 'outside');
    }
  }, true);
  // A menu the script placed follows its trigger through scrolling and
  // resizing, within one frame (an anchored one follows by itself).
  const view = doc.defaultView ?? globalThis;
  let frame = 0;
  const follow = () => {
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

/** [data-close] clicks, the drawer's scrim and a native dialog's cancel. */
function wire(element, state) {
  if (wired.has(element)) return;
  wired.add(element);
  // A press on the scrim during the exit (the second click of a double
  // click) would move focus off the opener to <body>: the backdrop is not
  // focusable. Its default is the focus change, so focus stays put.
  const holdFocus = (/** @type {MouseEvent} */ event) => {
    if (overlays.get(element)?.phase === 'closing') event.preventDefault();
  };
  element.addEventListener('mousedown', holdFocus, true);
  element.addEventListener('click', (/** @type {MouseEvent} */ event) => {
    const target = /** @type {Element} */ (event.target);
    const closer = target.closest?.('[data-close]');
    if (!closer || !element.contains(closer)) return;
    // A closer inside a nested overlay belongs to that one.
    if (hostsOf(closer)[0] !== element && closer !== element) return;
    if (overlays.get(element)?.phase !== 'open') return;
    closeFrom(element, 'close');
  });
  if (state.kind === 'menu') wireMenu(element);
  if (state.kind === 'drawer') {
    const scrim = element.parentElement?.querySelector(':scope > .ds-scrim');
    scrim?.addEventListener('click', () => {
      if (overlays.get(element)?.phase === 'open') closeFrom(element, 'close');
    });
    scrim?.addEventListener('mousedown', holdFocus, true);
  }
  if (isNative(element)) {
    element.addEventListener('cancel', (event) => {
      // Escape or another close request: play the exit instead of vanishing.
      event.preventDefault();
      if (overlays.get(element)?.phase === 'open') closeFrom(element, 'escape');
    });
    // Closed natively (a <form method="dialog">, dialog.close() of the
    // page): the state follows, and the exit still plays. The event of
    // close() itself arrives later, when the dialog may be open again.
    element.addEventListener('close', () => {
      if (overlays.get(element)?.phase === 'open' && !element.open) closeFrom(element, 'close');
    });
  }
}

/**
 * A menu's own keys and items: ArrowUp, ArrowDown, Home and End move focus
 * (wrapping); an item's click closes the menu once its handlers ran (a
 * task later, so a handler further up the tree still sees it open).
 */
function wireMenu(menu) {
  menu.addEventListener('keydown', (/** @type {KeyboardEvent} */ event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const items = menuItems(menu);
    if (!items.length) return;
    const current = items.indexOf(/** @type {Element} */ (event.target)?.closest?.('.ds-menu__item'));
    let next;
    if (event.key === 'Home') next = items[0];
    else if (event.key === 'End') next = items.at(-1);
    else if (event.key === 'ArrowDown') next = items[(current + 1) % items.length];
    else next = items[current < 0 ? items.length - 1 : (current - 1 + items.length) % items.length];
    event.preventDefault();
    next.focus();
  });
  menu.addEventListener('click', (/** @type {MouseEvent} */ event) => {
    const item = /** @type {Element} */ (event.target)?.closest?.('.ds-menu__item');
    if (!item || !menu.contains(item) || !enabled(item) || /** @type {any} */ (item).disabled) return;
    const state = overlays.get(menu);
    if (state?.phase !== 'open') return;
    const gen = state.gen;
    setTimeout(() => {
      if (state.gen === gen && state.phase === 'open') closeFrom(menu, 'item');
    });
  });
}

/* ── Popups: placement ──────────────────────────────── */

/**
 * Top layer and CSS anchor positioning for a popup: popover, anchor-name
 * and position-area; the combobox list also needs anchor-size() for its
 * width.
 */
function popupAnchoring(view, kind) {
  if (!supportsAnchoring(view)) return false;
  return kind !== 'combo' || view.CSS.supports('width: anchor-size(width)');
}

/** The element a popup is placed at: the combobox's field, else its opener. */
function popupAnchorOf(element, state) {
  const anchor = state.kind === 'combo' ? element.closest('.ds-combo') ?? state.opener : state.opener;
  return anchor && typeof anchor.getBoundingClientRect === 'function' ? anchor : null;
}

/**
 * The side of a popup `height` tall at `rect`: below when it fits there,
 * else the side with more room, and the room on that side (a popup taller
 * than it scrolls inside it instead of covering its trigger). `top` and
 * `bottom` bound the room; `near` is the gap to the trigger, `far` the one
 * kept from the bound.
 */
function sideFor(height, rect, near, far, top, bottom) {
  const below = bottom - far - rect.bottom - near;
  const above = rect.top - near - top - far;
  const up = height > below && above > below;
  return { up, room: Math.max(0, up ? above : below) };
}

/** Caps a popup placed by the script to `room` (none when it fits). */
function fitTo(element, height, room) {
  const style = /** @type {HTMLElement} */ (element).style;
  if (height > room) style.setProperty('max-height', `${round(room)}px`);
  else style.removeProperty('max-height');
}

/**
 * Places a popup that is about to enter (laid out at rest size): anchored
 * in the top layer where the engine can (popover="manual", data-anchored,
 * an anchor-name on the anchor unless it has one), else by the script (a
 * menu by --ds-menu-x/-y; the combobox list stays absolute and flips
 * above). Either way it opens below its anchor when it fits there, else on
 * the side with more room, and never taller than that room (anchored: the
 * CSS caps it to its position-area; the script writes max-height), so it
 * never covers its trigger. data-placement="top" marks a popup above its
 * anchor. Returns the anchor.
 */
function placePopup(element, state) {
  const anchor = popupAnchorOf(element, state);
  if (!anchor) return null;
  const view = viewOf(element);
  if (popupAnchoring(view, state.kind)) {
    element.setAttribute('popover', 'manual');
    element.setAttribute('data-anchored', '');
    let name = view.getComputedStyle(anchor).getPropertyValue('anchor-name').trim();
    if (!name || name === 'none') {
      name = `--ds-anchor-${anchorCount += 1}`;
      /** @type {HTMLElement} */ (anchor).style.setProperty('anchor-name', name);
      state.anchor = /** @type {HTMLElement} */ (anchor);
    }
    const style = /** @type {HTMLElement} */ (element).style;
    style.setProperty('position-anchor', name.split(',')[0].trim());
    try {
      /** @type {HTMLElement} */ (element).showPopover();
    } catch {
      // Already open: it stays.
    }
    // The side from its full height (the CSS cap lifted to measure it);
    // the engine then fits it to the room on that side.
    style.setProperty('max-height', 'none');
    const height = /** @type {HTMLElement} */ (element).offsetHeight;
    style.removeProperty('max-height');
    const doc = element.ownerDocument;
    const gap = pxOf(element, '--ds-space-1', 4);
    const { up } = sideFor(height, anchor.getBoundingClientRect(), gap, gap, 0, doc.documentElement.clientHeight || view.innerHeight);
    if (up) element.setAttribute('data-placement', 'top');
    else element.removeAttribute('data-placement');
  } else if (state.kind === 'menu') placeMenu(element, anchor);
  else placeList(element, anchor);
  return anchor;
}

/**
 * A menu by the script: below the trigger from its start edge, towards the
 * start edge (the trigger's end) when it would leave the viewport, above
 * the trigger when it does not fit below and there is more room above,
 * never taller than the room on its side; 8px (--ds-space-2) from the
 * viewport edges.
 */
function placeMenu(menu, anchor) {
  if (!anchor || typeof anchor.getBoundingClientRect !== 'function') return;
  const doc = menu.ownerDocument;
  const view = viewOf(menu);
  const rect = anchor.getBoundingClientRect();
  const gap = pxOf(menu, '--ds-space-1', 4);
  const edge = pxOf(menu, '--ds-space-2', 8);
  const style = /** @type {HTMLElement} */ (menu).style;
  style.removeProperty('max-height');
  const width = menu.offsetWidth;
  const height = menu.offsetHeight;
  const viewWidth = doc.documentElement.clientWidth || view.innerWidth;
  const viewHeight = doc.documentElement.clientHeight || view.innerHeight;
  const rtl = view.getComputedStyle?.(anchor).direction === 'rtl';
  const start = rtl ? rect.right - width : rect.left;
  const flipped = rtl ? rect.left : rect.right - width;
  const fits = (x) => x >= edge && x + width <= viewWidth - edge;
  let x = fits(start) || !fits(flipped) ? start : flipped;
  x = Math.max(edge, Math.min(viewWidth - width - edge, x));
  const { up, room } = sideFor(height, rect, gap, edge, 0, viewHeight);
  fitTo(menu, height, room);
  const y = up ? rect.top - gap - Math.min(height, room) : rect.bottom + gap;
  style.setProperty('--ds-menu-x', `${round(x)}px`);
  style.setProperty('--ds-menu-y', `${round(y)}px`);
  if (up) menu.setAttribute('data-placement', 'top');
  else menu.removeAttribute('data-placement');
}

/**
 * The combobox list by the script: under its field; above it when it does
 * not fit below and there is more room above; never taller than the room
 * on its side, so it never covers the field. The room is the viewport's,
 * narrowed by every box around the field that clips its overflow (a
 * dialog's box, a sheet's body), since the absolute list cannot leave
 * them.
 */
function placeList(list, anchor) {
  const view = viewOf(list);
  const doc = list.ownerDocument;
  const rect = anchor.getBoundingClientRect();
  const gap = pxOf(list, '--ds-space-1', 4);
  /** @type {HTMLElement} */ (list).style.removeProperty('max-height');
  const height = list.offsetHeight;
  let top = 0;
  let bottom = doc.documentElement.clientHeight || view.innerHeight;
  for (let node = list.parentElement; node && node !== doc.body && node !== doc.documentElement; node = node.parentElement) {
    if (view.getComputedStyle?.(node).overflowY === 'visible') continue;
    const box = node.getBoundingClientRect();
    top = Math.max(top, box.top);
    bottom = Math.min(bottom, box.bottom);
  }
  const { up, room } = sideFor(height, rect, gap, gap, top, bottom);
  fitTo(list, height, room);
  if (up) list.setAttribute('data-placement', 'top');
  else list.removeAttribute('data-placement');
}

/** Undoes placePopup() once a popup is hidden: out of the top layer, its anchor-name gone. */
function releasePopup(element, state) {
  if (element.hasAttribute('popover')) {
    try {
      if (element.matches(':popover-open')) /** @type {HTMLElement} */ (element).hidePopover();
    } catch {
      // Not open.
    }
    element.removeAttribute('popover');
  }
  element.removeAttribute('data-anchored');
  element.removeAttribute('data-placement');
  /** @type {HTMLElement} */ (element).style.removeProperty('position-anchor');
  /** @type {HTMLElement} */ (element).style.removeProperty('max-height');
  state.anchor?.style.removeProperty('anchor-name');
  state.anchor = null;
}

/* ── Over a native modal ────────────────────────────── */

/**
 * The topmost open native dialog or sheet, unless it holds `element`
 * already. showModal() makes everything outside it inert, top-layer
 * popovers included, so an overlay opened over it must sit inside it.
 */
function nativeHostFor(element) {
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    const other = stack[i];
    const state = overlays.get(other);
    if (other === element || state?.phase !== 'open' || !MODAL.has(state.kind) || !isNative(other) || !other.open) continue;
    return other.contains(element) ? null : other;
  }
  return null;
}

/**
 * A menu, popup, dialog or sheet (div or native) opened while a native
 * modal is open moves into it (still hidden or closed, so nothing shows
 * the move) and goes back once its close settled. It stays fixed to the
 * viewport there: the native element has no transform, and its overflow
 * does not clip fixed boxes. A native one needs it for its exit: its
 * close() at once makes the one under it the top modal again, which
 * would make the closing dialog inert (clicks on its scrim would reach
 * the sheet under it) and draw it under that top-layer sheet; inside it,
 * the closing dialog stays above the sheet's panel and keeps catching
 * clicks. A combobox list stays with its field, the drawer in its frame.
 */
function adopt(element, state) {
  if (state.home || !['menu', 'popup', 'dialog', 'sheet'].includes(state.kind)) return;
  // Moving an open <dialog> would close it: one the page opened itself stays.
  if (isNative(element) && element.open) return;
  const host = nativeHostFor(element);
  if (!host || !element.parentNode) return;
  state.home = { parent: element.parentNode, next: element.nextSibling };
  host.append(element);
}

/** Puts an adopted overlay back where it was (it is hidden by then). */
function giveBack(element, state) {
  const home = state.home;
  state.home = null;
  if (!home || element.parentNode === home.parent) return;
  home.parent.insertBefore(element, home.next && home.next.parentNode === home.parent ? home.next : null);
}

/* ── Modal drawer ───────────────────────────────────── */

function drawerQuery(drawer) {
  const view = viewOf(drawer);
  return typeof view.matchMedia === 'function' ? view.matchMedia(DRAWER_QUERY) : null;
}

/**
 * Crossing 900px changes the drawer in place: .ds-drawer--instant for two
 * frames (no slide, no scrim fade), and a wider window closes a stale open
 * state at once.
 */
function watchDrawer(drawer, query) {
  if (!query || watchedDrawers.has(drawer)) return;
  watchedDrawers.add(drawer);
  const view = viewOf(drawer);
  let crossing = 0;
  const frame = (callback) => (typeof view.requestAnimationFrame === 'function' ? view.requestAnimationFrame(callback) : setTimeout(callback));
  const onChange = () => {
    const run = ++crossing;
    drawer.classList.add('ds-drawer--instant');
    if (!query.matches) {
      const state = overlays.get(drawer);
      if (state && state.phase !== 'closed') closeNow(drawer, state);
    }
    frame(() => frame(() => {
      if (run === crossing) drawer.classList.remove('ds-drawer--instant');
    }));
  };
  if (typeof query.addEventListener === 'function') query.addEventListener('change', onChange);
  else query.addListener?.(onChange);
}

/** Closes the drawer without motion (the window widened): every bit of state goes at once. */
function closeNow(drawer, state) {
  state.gen += 1;
  state.closing = null;
  state.opening = null;
  state.phase = 'closed';
  drawer.closest('.ds-app')?.removeAttribute('data-drawer-open');
  state.expander?.setAttribute('aria-expanded', 'false');
  restoreInert(state);
  drawer.inert = false;
  finishClose(drawer, state);
}

/* ── Open and close ─────────────────────────────────── */

/** Leaves the stack and the lock; shared by every end of a close. */
function finishClose(element, state) {
  const index = stack.indexOf(element);
  if (index >= 0) stack.splice(index, 1);
  // What this overlay lifted from a lower trap is inert again.
  syncInert();
  if (state.locked) {
    state.locked = false;
    unlockScroll();
  }
}

/**
 * Opens an overlay: a dialog or side sheet (native <dialog> or div
 * markup), the modal drawer, or a popup (.ds-menu, .ds-combo__popup).
 * `opener` (default: the focused element) gets focus back on close; a
 * popup's opener (and the drawer's menu button) carries aria-expanded.
 * Focus moves at once to [autofocus], else the first focusable element
 * (a menu: its first enabled item; a combobox keeps focus in its input;
 * the drawer: itself). A close in progress is taken back from where its
 * motion is. Resolves when the entrance has settled.
 *
 * `container: true` (a closed dialog or side sheet, with View Transitions
 * and .ds-theme on <html>): the opener grows into the box or panel as a
 * container transform (DS.motion.transition()); the open, focus included,
 * runs a frame later inside the transition's update, and the promise
 * resolves once the transform finished. The page is frozen meanwhile
 * (--ds-dur-long; a press skips the motion), so use it only where the overlay is the opener's own
 * detail. Ignored elsewhere: the usual entrance.
 * @param {Element} element
 * @param {{ opener?: Element|null, container?: boolean }} [options]
 * @returns {Promise<void>}
 */
export function open(element, options = {}) {
  if (!element?.isConnected) return Promise.resolve();
  if (options.container) {
    const transform = containerOpen(element, options);
    if (transform) return transform;
  }
  return show(element, options, false);
}

/** The parts that keep no view-transition-name during a container open (see containerOpen). */
const UNNAMED_IN_CONTAINER = '.ds-view, .ds-panel, .ds-drawer';

/**
 * open() as a container transform, or null where it cannot run: only a
 * closed dialog or sheet, an opener on the page, View Transitions and
 * .ds-theme on <html> (the conditions of DS.motion.transition()'s View
 * Transition path). The page frame (shell.css names it while data-ds-vt
 * is set) and the overlay's sheet body keep no name meanwhile: every group
 * paints above the root, where the scrim is, and a body named apart would
 * not grow with its panel.
 */
function containerOpen(element, options) {
  const doc = element.ownerDocument;
  const state = stateOf(element);
  if (state.kind !== 'dialog' && state.kind !== 'sheet') return null;
  if (state.phase !== 'closed' || state.container) return state.container?.done ?? null;
  const viewTransitions = typeof doc.startViewTransition === 'function' && doc.documentElement.classList.contains('ds-theme');
  if (!viewTransitions) return null;
  const active = doc.activeElement;
  const opener = options.opener ?? (active && active !== doc.body && !element.contains(active) ? active : null);
  if (!opener?.isConnected || typeof opener.getBoundingClientRect !== 'function') return null;

  const lifted = new Map();
  for (const part of [...doc.querySelectorAll(UNNAMED_IN_CONTAINER), ...element.querySelectorAll('.ds-sheet__body')]) {
    lifted.set(part, part.style.getPropertyValue('view-transition-name'));
    part.style.setProperty('view-transition-name', 'none');
  }
  const restore = () => {
    for (const [part, before] of lifted) {
      if (part.style.getPropertyValue('view-transition-name') !== 'none') continue;
      if (before) part.style.setProperty('view-transition-name', before);
      else part.style.removeProperty('view-transition-name');
    }
  };

  const pending = { done: /** @type {Promise<void>|null} */ (null) };
  state.container = pending;
  let entrance = Promise.resolve();
  const update = () => {
    // A close() (or a plain open()) before the snapshot took over.
    const current = state.container === pending;
    if (current) state.container = null;
    if (!current || !element.isConnected) return null;
    // Inside the View Transition data-ds-vt is "container"; were it
    // refused, the update runs bare, and an opener that its scroller clips
    // (a row of a wide table, a card partly scrolled under the top bar)
    // made it a fade-through: the overlay plays its usual entrance.
    const transform = doc.documentElement.getAttribute('data-ds-vt') === 'container';
    entrance = show(element, { ...options, opener }, transform);
    return transform ? boxOf(element, state.kind) : null;
  };
  pending.done = transition(update, { type: 'container', from: opener }).then(
    () => { restore(); return entrance; },
    (error) => { restore(); throw error; },
  );
  return pending.done;
}

/**
 * The open itself. `transform`: the container transform plays the motion,
 * so the overlay takes its open state at once (shown straight into
 * data-state="open": nothing to transition from).
 */
function show(element, options, transform) {
  const doc = element.ownerDocument;
  const state = stateOf(element);
  state.container = null;
  const kind = state.kind;
  const box = boxOf(element, kind);
  const app = kind === 'drawer' ? element.closest('.ds-app') : null;
  if (kind === 'drawer') {
    const query = drawerQuery(element);
    watchDrawer(element, query);
    if (query && !query.matches) return Promise.resolve();
  }
  if (!warned && !element.closest('.ds-theme')) {
    warned = true;
    viewOf(element).console?.warn('Dashboard-Style: DS.overlay.open() on an element outside .ds-theme. Overlays must sit inside the .ds-theme element, or they get neither the tokens nor the motion.');
  }
  for (const tip of tooltipControllers) tip.hide();
  if (state.phase === 'open') return state.opening ?? Promise.resolve();
  listen(doc);
  wire(element, state);
  const reopening = state.phase === 'closing';
  const gen = ++state.gen;
  state.closing = null;
  state.phase = 'open';

  if (!reopening) {
    const active = doc.activeElement;
    const focused = active && active !== doc.body && !element.contains(active) ? active : null;
    const menuButton = app?.querySelector('.ds-topbar__menu') ?? null;
    state.opener = options.opener ?? (kind === 'drawer' ? menuButton ?? focused : focused);
    state.expander = kind === 'drawer' ? menuButton ?? state.opener : MODAL.has(kind) ? null : state.opener;
  } else if (options.opener) state.opener = options.opener;

  // The stack: a reopened overlay moves to the top again.
  const index = stack.indexOf(element);
  if (index >= 0) stack.splice(index, 1);
  if (MODAL.has(kind)) {
    if (!state.locked) {
      state.locked = true;
      lockScroll();
    }
    if (kind === 'dialog') {
      const nested = stack.some((other) => MODAL.has(overlays.get(other)?.kind ?? '') && overlays.get(other)?.phase === 'open');
      element.classList.toggle('ds-dialog--nested', nested);
    }
  }
  stack.push(element);
  // Over a native modal, it goes inside it, or it would be inert.
  if (!reopening) adopt(element, state);

  // The closed state first, so a native dialog shown by showModal() never
  // matches the hand-driven rules (their @starting-style) on the way.
  if (kind !== 'drawer' && !reopening) element.setAttribute('data-state', transform ? 'open' : 'closed');

  // Show it and take the page away.
  if (kind === 'drawer') {
    app?.setAttribute('data-drawer-open', '');
    element.inert = false;
    if (!state.inerted.length) state.inerted = inertOutside(element);
  } else if (isNative(element) && MODAL.has(kind)) {
    element.classList.remove('ds-dialog--closing', 'ds-sheet--closing');
    if (!element.open) element.showModal();
    // The snackbars of the theme come in: into the top layer with it.
    hostToasts(element, 'enter');
  } else {
    if (/** @type {HTMLElement} */ (element).hidden) /** @type {HTMLElement} */ (element).hidden = false;
    for (const name of ['ds-dialog--hidden', 'ds-sheet--hidden']) {
      if (element.classList.contains(name)) {
        element.classList.remove(name);
        state.hiddenClass = name;
      }
    }
    // The snackbars come in before the page turns inert, so they never are.
    if (kind === 'dialog' || kind === 'sheet') hostToasts(element, 'enter');
    if (MODAL.has(kind) && !state.inerted.length) state.inerted = inertOutside(element);
  }
  // A lower trap may have taken this overlay (or a box around it) as a
  // sibling: the stack lifts that, since this one is above it now.
  syncInert();
  box.inert = false;

  // Closed -> flush -> open: the entrance runs on transitions in every engine.
  if (kind !== 'drawer') {
    if (reopening) element.setAttribute('data-state', 'open');
    else if (kind === 'menu' || kind === 'combo') {
      // A popup is placed and measured at rest size (the closed state's
      // scale would shrink its box), then takes its closed state without a
      // transition, and grows from the trigger.
      element.setAttribute('data-state', 'closed');
      const style = /** @type {HTMLElement} */ (element).style;
      style.setProperty('transition', 'none');
      style.setProperty('scale', 'none');
      const anchor = placePopup(element, state);
      const trigger = state.opener && typeof state.opener.getBoundingClientRect === 'function' ? state.opener : anchor;
      if (trigger) originFrom(trigger, element);
      style.removeProperty('scale');
      flushStyle(element);
      style.removeProperty('transition');
      element.setAttribute('data-state', 'open');
    } else if (!transform) {
      element.setAttribute('data-state', 'closed');
      flushStyle(box);
      if ((kind !== 'sheet') && state.opener && typeof state.opener.getBoundingClientRect === 'function') originFrom(state.opener, box);
      element.setAttribute('data-state', 'open');
    }
  }

  focusInto(element, state, box);
  state.expander?.setAttribute('aria-expanded', 'true');

  const entrance = settled(box, { transitions: true }).then(() => {
    if (state.gen === gen) state.opening = null;
  });
  state.opening = entrance;
  return entrance;
}

/**
 * Closes an overlay that open() showed, in the documented order: the trap
 * goes and focus is on the opener at once, the box or panel turns inert,
 * data-state="closed" plays the exit, and once it settled the overlay is
 * hidden and leaves the lock and the Escape stack. A second call during
 * the exit returns the same promise; an open() meanwhile takes it back.
 * @param {Element} element
 * @returns {Promise<void>}
 */
export function close(element) {
  if (!element) return Promise.resolve();
  // A container open still waiting for its snapshot does not open.
  const pending = overlays.get(element);
  if (pending?.container) pending.container = null;
  if (element.matches('.ds-drawer')) watchDrawer(element, drawerQuery(element));
  return closeFrom(element, 'close');
}

/**
 * close() with its reason: 'close' (a call, [data-close], the scrim),
 * 'escape', 'tab' (a menu; focus is on the trigger already) or 'outside'
 * (a pointerdown outside a menu: focus stays where the pointer puts it).
 */
function closeFrom(element, reason) {
  const state = overlays.get(element);
  if (!state || state.phase === 'closed') return Promise.resolve();
  if (state.phase === 'closing') return state.closing ?? Promise.resolve();
  const kind = state.kind;
  const box = boxOf(element, kind);
  const doc = element.ownerDocument;
  if (MODAL.has(kind)) {
    // What floats over it goes with it: a tooltip, and a menu or list
    // opened inside it (or from a trigger inside it), the topmost first,
    // so none stays open, marked expanded or on the Escape stack.
    for (const tip of tooltipControllers) tip.hide();
    for (const other of [...stack].reverse()) {
      const inner = overlays.get(other);
      if (other === element || inner?.phase !== 'open') continue;
      if (element.contains(other) || (!MODAL.has(inner.kind) && element.contains(inner.opener))) closeFrom(other, 'close');
    }
  }
  const gen = ++state.gen;
  state.phase = 'closing';
  state.opening = null;
  const active = doc.activeElement;
  const focusInside = Boolean(active) && (element.contains(active) || active === doc.body);

  // 1. Release the trap.
  if (kind === 'drawer') element.closest('.ds-app')?.removeAttribute('data-drawer-open');
  if (isNative(element) && MODAL.has(kind)) {
    element.classList.add(kind === 'sheet' ? 'ds-sheet--closing' : 'ds-dialog--closing');
    if (element.open) element.close();
  }
  restoreInert(state);

  // 2. Focus back on the opener at once.
  state.expander?.setAttribute('aria-expanded', 'false');
  const returns = MODAL.has(kind) ? focusInside : reason !== 'outside' && element.contains(doc.activeElement);
  if (returns) returnTarget(element, state)?.focus({ preventScroll: true });
  // The snackbars glide back to their place (from a sheet, with the
  // leaving panel) and stay inside it, above its scrim, until it settled.
  if (kind === 'dialog' || kind === 'sheet') hostToasts(element, 'exit');

  // 3. Only the box or panel stops taking input; the backdrop swallows clicks.
  box.inert = true;

  // 4. The exit.
  if (kind !== 'drawer') element.setAttribute('data-state', 'closed');

  // 5., 6. Hide once it settled, all in one task.
  const exit = settled(box, { transitions: true }).then(() => {
    if (state.gen !== gen) return;
    state.phase = 'closed';
    state.closing = null;
    // Back to the page before it hides; they already stand at their place.
    if (kind === 'dialog' || kind === 'sheet') hostToasts(element, 'settle');
    if (kind !== 'drawer') {
      if (isNative(element) && MODAL.has(kind)) {
        // display: none is computed while data-state still holds; the
        // hand-driven rules (no data-state) would step display late and
        // keep the finished dialog on screen, catching clicks, for one
        // more exit time.
        element.classList.remove('ds-dialog--closing', 'ds-sheet--closing');
        flushStyle(element);
      } else if (state.hiddenClass) element.classList.add(state.hiddenClass);
      else /** @type {HTMLElement} */ (element).hidden = true;
      if (kind === 'menu' || kind === 'combo') releasePopup(element, state);
      element.removeAttribute('data-state');
    }
    box.inert = false;
    element.classList.remove('ds-dialog--nested');
    giveBack(element, state);
    finishClose(element, state);
  });
  state.closing = exit;
  return exit;
}

/* ── Shared helpers of snackbars and tooltips ───────── */

const round = (value) => Math.round(value * 100) / 100;

/** A monotonic clock in ms. */
const clock = () => (typeof globalThis.performance?.now === 'function' ? globalThis.performance.now() : Date.now());

/** A length token as computed on the element, in px (`fallback` outside a theme). */
function pxOf(element, token, fallback) {
  const value = parseFloat(viewOf(element).getComputedStyle?.(element).getPropertyValue(token) ?? '');
  return Number.isFinite(value) ? value : fallback;
}

/** --ds-time-scale on the element (10 at ?speed=0.1); 1 outside a theme. */
function timeScaleOf(element) {
  if (!element?.closest?.('.ds-theme')) return 1;
  const value = parseFloat(viewOf(element).getComputedStyle?.(element).getPropertyValue('--ds-time-scale') ?? '');
  return value > 0 ? value : 1;
}

/** Runs `callback` on the next frame, or in the next task where frames do not run (a hidden tab). */
function nextFrame(doc, callback) {
  const view = doc.defaultView ?? globalThis;
  if (doc.hidden || typeof view.requestAnimationFrame !== 'function') setTimeout(callback);
  else view.requestAnimationFrame(callback);
}

/* ── Snackbars ──────────────────────────────────────── */

/** Each character past TOAST_FREE_CHARS adds this much reading time (ms), up to TOAST_MAX_MS. */
const TOAST_CHAR_MS = 50;

/** A message this long or shorter takes TOAST_MS. */
const TOAST_FREE_CHARS = 40;

/**
 * One message.
 * @typedef {{ el: HTMLElement, region: Element, stays: boolean, assertive: boolean, text: string,
 *   remaining: number, timer: any, started: number, phase: 'queued'|'shown'|'leaving'|'gone',
 *   done: () => void, closed: Promise<void> }} Toast
 */

/**
 * One region: the messages on screen (oldest first) and waiting, why its
 * timers pause, where focus came from, and its announcers.
 * @typedef {{ shown: Toast[], queue: Toast[], pointer: boolean, focus: boolean, origin: Element|null,
 *   legacy: boolean, polite: HTMLElement|null, assertive: HTMLElement|null,
 *   pending: Map<HTMLElement, string[]> }} ToastRegion
 * @type {WeakMap<Element, ToastRegion>}
 */
const toastRegions = new WeakMap();

/** The message of each .ds-toast that toast() shows. @type {WeakMap<Element, Toast>} */
const toastEntries = new WeakMap();

/** Regions with a pointer over a message (cleared by a pointerover anywhere else). */
const pointedRegions = /** @type {Set<Element>} */ (new Set());

/** Documents with the pointer watcher of pointedRegions. */
const pointerWatched = new WeakSet();

/** The live regions announcers() made: inertOutside() leaves them alone, like the snackbar regions. */
const announcerNodes = new WeakSet();

/**
 * The tooltips tooltips() made: inertOutside() leaves them alone too, so
 * the one a trigger inside a div dialog, side sheet or the modal drawer
 * shows takes the pointer (the hoverable grace) and is heard.
 */
const tooltipNodes = new WeakSet();

/**
 * Regions that open dialogs and side sheets took in: the places each one
 * left, the latest last ({ host, parent, next, left: the inline
 * --ds-toast-left, at: the computed left in px there, leaving: the host's
 * exit runs and the region glides back inside it }).
 * @type {WeakMap<Element, Array<{ host: Element, parent: Node, next: Node|null, left: string, at: number, leaving: boolean }>>}
 */
const toastHomes = new WeakMap();

/** The latest follow glide of each region (a later one supersedes it). @type {WeakMap<Element, number>} */
const followRuns = new WeakMap();

function regionState(region) {
  let state = toastRegions.get(region);
  if (!state) {
    state = {
      shown: [], queue: [], pointer: false, focus: false, origin: null,
      // The old markup announces by itself: no announcers, nothing twice.
      legacy: region.hasAttribute('role') || region.hasAttribute('aria-live'),
      polite: null, assertive: null, pending: new Map(),
    };
    toastRegions.set(region, state);
    wireRegion(region, state);
  }
  return state;
}

const paused = (region, state) => state.pointer || state.focus || Boolean(region.ownerDocument.hidden);

/** Starts (or resumes) a message's timer with the time it has left. */
function arm(entry, region, state) {
  if (entry.stays || entry.phase !== 'shown' || entry.timer || paused(region, state)) return;
  entry.started = clock();
  entry.timer = setTimeout(() => {
    entry.timer = 0;
    closeToast(entry);
  }, Math.max(0, entry.remaining));
}

/** Stops a message's timer and keeps the time it has left. */
function disarm(entry) {
  if (!entry.timer) return;
  clearTimeout(entry.timer);
  entry.timer = 0;
  entry.remaining -= clock() - entry.started;
}

function pauseToasts(state) {
  for (const entry of state.shown) disarm(entry);
}

function resumeToasts(region, state) {
  for (const entry of state.shown) arm(entry, region, state);
}

function unpoint(region, state) {
  pointedRegions.delete(region);
  if (!state.pointer) return;
  state.pointer = false;
  resumeToasts(region, state);
}

/**
 * The pauses (pointer, focus, a hidden tab), the close buttons and the
 * origin of focus, once per region. The region itself takes no pointer
 * (pointer-events: none), its messages do, and their events bubble here.
 */
function wireRegion(region, state) {
  const doc = region.ownerDocument;
  region.addEventListener('pointerover', (/** @type {PointerEvent} */ event) => {
    if (state.pointer || region.contains(/** @type {Node} */ (event.relatedTarget))) return;
    state.pointer = true;
    pointedRegions.add(region);
    pauseToasts(state);
  });
  region.addEventListener('pointerout', (/** @type {PointerEvent} */ event) => {
    if (region.contains(/** @type {Node} */ (event.relatedTarget))) return;
    unpoint(region, state);
  });
  region.addEventListener('focusin', (/** @type {FocusEvent} */ event) => {
    const from = /** @type {Element|null} */ (event.relatedTarget);
    if (!state.focus && from && !region.contains(from)) state.origin = from;
    state.focus = true;
    pauseToasts(state);
  });
  region.addEventListener('focusout', (/** @type {FocusEvent} */ event) => {
    if (region.contains(/** @type {Node} */ (event.relatedTarget))) return;
    state.focus = false;
    resumeToasts(region, state);
  });
  region.addEventListener('click', (/** @type {MouseEvent} */ event) => {
    const button = /** @type {Element} */ (event.target).closest?.('.ds-toast__close');
    const entry = button && region.contains(button) ? toastEntries.get(button.closest('.ds-toast')) : null;
    if (entry) closeToast(entry);
  });
  doc.addEventListener('visibilitychange', () => {
    if (doc.hidden) pauseToasts(state);
    else resumeToasts(region, state);
  });
  // A message that leaves from under a still pointer sends no pointerout
  // to the region; the next pointerover elsewhere tells.
  if (!pointerWatched.has(doc)) {
    pointerWatched.add(doc);
    doc.addEventListener('pointerover', (/** @type {PointerEvent} */ event) => {
      for (const pointed of [...pointedRegions]) {
        if (!pointed.contains(/** @type {Node} */ (event.target))) unpoint(pointed, toastRegions.get(pointed));
      }
    }, true);
  }
}

/** The documented message for a string: icon, text and, when it stays, a close button. */
function buildToast(doc, text, kind, closable, closeLabel) {
  const el = doc.createElement('div');
  el.className = kind === 'error' || kind === 'info' ? `ds-toast ds-toast--${kind}` : 'ds-toast';
  el.append(iconElement(kind === 'error' ? alertCircle : kind === 'info' ? info : checkCircle, 20, undefined, doc));
  const span = doc.createElement('span');
  span.className = 'ds-toast__text';
  span.textContent = text;
  el.append(span);
  if (closable) {
    const button = doc.createElement('button');
    button.className = 'ds-btn ds-btn--quiet ds-btn--icon ds-toast__close';
    button.type = 'button';
    button.setAttribute('aria-label', closeLabel || 'Close');
    button.append(iconElement(closeGlyph, 20, undefined, doc));
    el.append(button);
  }
  return el;
}

/** The two announcers next to the region (created once, moved with it). */
function announcers(region, state) {
  if (state.polite?.isConnected && state.assertive?.isConnected) return;
  const doc = region.ownerDocument;
  for (const key of /** @type {const} */ (['polite', 'assertive'])) {
    if (state[key]?.isConnected) continue;
    const node = doc.createElement('div');
    node.className = 'ds-sr';
    node.setAttribute('aria-live', key);
    node.setAttribute('aria-atomic', 'true');
    announcerNodes.add(node);
    state[key] = node;
  }
  region.after(/** @type {HTMLElement} */ (state.polite), /** @type {HTMLElement} */ (state.assertive));
}

/**
 * Says a message's text through its announcer: cleared now, written on the
 * next frame, so the same text again is announced again. Messages of one
 * frame are read together.
 */
function announce(region, state, entry) {
  if (state.legacy || !entry.text) return;
  announcers(region, state);
  const node = /** @type {HTMLElement} */ (entry.assertive ? state.assertive : state.polite);
  const texts = state.pending.get(node);
  if (texts) {
    texts.push(entry.text);
    return;
  }
  state.pending.set(node, [entry.text]);
  node.textContent = '';
  nextFrame(region.ownerDocument, () => {
    node.textContent = (state.pending.get(node) ?? []).join('\n');
    state.pending.delete(node);
  });
}

/** How long a message stays (ms): longer texts get more time, capped; --ds-time-scale stretches it. */
function toastTimeout(region, text, options) {
  const given = typeof options.timeout === 'number' && options.timeout > 0 ? options.timeout : 0;
  const base = given || Math.min(TOAST_MAX_MS, TOAST_MS + TOAST_CHAR_MS * Math.max(0, text.length - TOAST_FREE_CHARS));
  return base * timeScaleOf(region);
}

/**
 * Shows a snackbar in `region` (a .ds-toasts element inside the
 * .ds-theme). `content` is a .ds-toast element or a string, from which it
 * builds the documented message: the checkCircle icon (alertCircle for
 * kind 'error', info for 'info'), the text and, for a message that stays,
 * a close button. At most TOAST_LIMIT show at once: a further one replaces
 * the oldest that would close by itself, or waits until one closes.
 * Errors, `persistent` messages and messages with another button or a
 * link never close by themselves; the others close after `timeout` ms
 * (default 4000ms plus 50ms per character past 40, at most 10000ms; all
 * stretched by --ds-time-scale), paused while a pointer is over a message,
 * focus is in the region or the tab is hidden.
 * @param {Element} region
 * @param {Element|string} content
 * @param {{ kind?: 'success'|'error'|'info', persistent?: boolean, timeout?: number, closeLabel?: string }} [options]
 * @returns {{ el: HTMLElement|null, close: () => Promise<void>, closed: Promise<void> }}
 *   close() takes it away (a waiting one leaves the queue); closed resolves once it is gone
 */
export function toast(region, content, options = {}) {
  const doc = region?.ownerDocument;
  if (!doc || content == null) return { el: null, close: () => Promise.resolve(), closed: Promise.resolve() };
  const state = regionState(region);
  const given = typeof content === 'object' && /** @type {Element} */ (content).nodeType === 1;
  const element = /** @type {HTMLElement} */ (given ? content : null);
  const kind = options.kind ?? (element?.classList.contains('ds-toast--error') ? 'error' : element?.classList.contains('ds-toast--info') ? 'info' : 'success');
  const persistent = options.persistent === true || kind === 'error';
  const el = element ?? buildToast(doc, String(content), kind, persistent, options.closeLabel);
  const text = ((el.querySelector('.ds-toast__text') ?? el).textContent ?? '').replace(/\s+/g, ' ').trim();
  // A message with an action waits for it (WCAG 2.2.1).
  const action = [...el.querySelectorAll('button, a[href]')].some((node) => !node.classList.contains('ds-toast__close'));
  if (!state.legacy) {
    // The announcers speak; a live message would be read twice.
    if (/^(alert|status)$/.test(el.getAttribute('role') ?? '')) el.removeAttribute('role');
    el.removeAttribute('aria-live');
  }
  const remaining = toastTimeout(region, text, options);
  let done = () => {};
  const closed = new Promise((resolve) => {
    done = () => resolve(undefined);
  });
  /** @type {Toast} */
  const entry = { el, region, stays: persistent || action || !Number.isFinite(remaining), assertive: kind === 'error', text, remaining, timer: 0, started: 0, phase: 'queued', done, closed };
  toastEntries.set(el, entry);
  state.queue.push(entry);
  updateToasts(region, state, []);
  return { el, close: () => closeToast(entry), closed };
}

/** Takes a message away: a waiting one leaves the queue, a shown one leaves the stack. */
function closeToast(entry) {
  const state = toastRegions.get(entry.region);
  if (!state) return entry.closed;
  if (entry.phase === 'queued') {
    state.queue.splice(state.queue.indexOf(entry), 1);
    finishToast(entry);
  } else if (entry.phase === 'shown') updateToasts(entry.region, state, [entry]);
  return entry.closed;
}

function finishToast(entry) {
  if (entry.phase === 'gone') return;
  entry.phase = 'gone';
  disarm(entry);
  toastEntries.delete(entry.el);
  entry.done();
}

/**
 * Moves focus off a message that leaves: to the close button of the next
 * message that stays (else the one before), else to where focus came from
 * into the region, else to the view (tabindex="-1"). Never <body>.
 */
function releaseToastFocus(entry, region, state, staying) {
  const doc = region.ownerDocument;
  if (!entry.el.contains(doc.activeElement)) return;
  const others = staying.filter((other) => other.el.parentNode === region);
  const after = others.filter((other) => entry.el.compareDocumentPosition(other.el) & 4);
  const before = others.filter((other) => !after.includes(other)).reverse();
  const buttons = [...after, ...before].map((other) => other.el.querySelector('.ds-toast__close'));
  const origin = state.origin && !region.contains(state.origin) ? state.origin : null;
  const view = region.closest('[tabindex="-1"]') ?? doc.querySelector(LANDMARK);
  const target = [...buttons, origin, view].find((node) => canFocus(node) && !entry.el.contains(node));
  target?.focus({ preventScroll: true });
}

/**
 * Brings the stack in line: `closing` leaves, waiting messages fill free
 * places or replace the oldest message that would close by itself. One
 * flip() for all of it, so the messages that stay glide to their places
 * while the new ones enter and the old ones fade out in place.
 */
function updateToasts(region, state, closing) {
  const next = state.shown.filter((entry) => !closing.includes(entry));
  const added = [];
  while (state.queue.length) {
    if (next.length >= TOAST_LIMIT) {
      const oldest = next.findIndex((entry) => !entry.stays);
      if (oldest < 0) break;
      next.splice(oldest, 1);
    }
    const entry = /** @type {Toast} */ (state.queue.shift());
    next.push(entry);
    added.push(entry);
  }
  const removed = state.shown.filter((entry) => !next.includes(entry));
  const entering = added.filter((entry) => next.includes(entry));
  // Replaced before it ever showed (several entered at once): gone at once.
  for (const entry of added) if (!next.includes(entry)) finishToast(entry);
  if (!removed.length && !entering.length) return;
  for (const entry of removed) {
    disarm(entry);
    entry.phase = 'leaving';
  }
  state.shown = next;
  for (const entry of removed) releaseToastFocus(entry, region, state, next.filter((other) => !entering.includes(other)));
  flip(region, (hooks) => {
    for (const entry of removed) {
      const leaving = hooks.onRemove(entry.el);
      if (leaving) leaving.then(() => finishToast(entry));
      else {
        entry.el.remove();
        finishToast(entry);
      }
    }
    for (const entry of entering) {
      entry.phase = 'shown';
      region.append(entry.el);
    }
  });
  for (const entry of entering) {
    announce(region, state, entry);
    arm(entry, region, state);
    // Played once: a later move of the region (a side sheet) does not replay it.
    settled(entry.el).then(() => {
      if (entry.phase === 'shown') entry.el.classList.add('ds-toast--shown');
    });
  }
}

/* ── Snackbars inside an open dialog or side sheet ───── */

/** Moves the region (and its announcers) before `before` in `parent`; focus inside stays. */
function moveRegion(region, parent, before) {
  const state = toastRegions.get(region);
  const doc = region.ownerDocument;
  const active = doc.activeElement;
  const refocus = active && region.contains(active) ? active : null;
  const nodes = [region, state?.polite, state?.assertive].filter((node) => node && node.parentNode === region.parentNode);
  const anchor = before && before.parentNode === parent ? before : null;
  for (const node of nodes) {
    if (typeof parent.moveBefore === 'function') {
      try {
        parent.moveBefore(node, anchor);
        continue;
      } catch {
        // Not movable here (another document, a disconnected parent): insert.
      }
    }
    parent.insertBefore(node, anchor);
  }
  if (refocus && doc.activeElement !== refocus && canFocus(refocus)) refocus.focus({ preventScroll: true });
}

/**
 * Applies `move` (a DOM move and a new --ds-toast-left) and lets the
 * messages glide from where they are on screen to the new place, through
 * the region's own translate transition (--ds-toast-shift: set, flushed,
 * cleared) with the timing of data-follow. A region without messages, or
 * one whose place does not change (phones, a dialog), just moves.
 */
function glideRegion(region, direction, move) {
  const style = /** @type {HTMLElement} */ (region).style;
  const transition = style.transition;
  const from = region.getBoundingClientRect().left;
  const shows = [...region.children].some((child) => child.matches('.ds-toast:not([data-ds-leaving])'));
  style.transition = 'none';
  style.removeProperty('--ds-toast-shift');
  move();
  const dx = from - region.getBoundingClientRect().left;
  const run = (followRuns.get(region) ?? 0) + 1;
  followRuns.set(region, run);
  if (!shows || Math.abs(dx) < 0.5) {
    flushStyle(region);
    style.transition = transition;
    region.removeAttribute('data-follow');
    return;
  }
  style.setProperty('--ds-toast-shift', `${round(dx)}px`);
  flushStyle(region);
  region.setAttribute('data-follow', direction);
  style.transition = transition;
  style.removeProperty('--ds-toast-shift');
  settled(region, { transitions: true }).then(() => {
    if (followRuns.get(region) === run) region.removeAttribute('data-follow');
  });
}

/**
 * An opening dialog or side sheet takes in every .ds-toasts region of its
 * theme (with their announcers), so a message shown meanwhile is above its
 * scrim and usable: in the top layer of a native one, outside the inert
 * page of the div trap. In a sheet --ds-toast-left becomes the panel's
 * resting left edge plus --ds-space-6, and the messages glide there; in a
 * dialog the region keeps its place. Closing ('exit'), each region glides
 * back to its old left while it stays inside: Chromium keeps a closing
 * native dialog in the top layer, so a region already on the page would
 * fall under its leaving scrim and panel. Once the exit settled
 * ('settle'), it goes back to where it was, with its --ds-toast-left; an
 * open() during the exit glides it back to the panel. Overlays over each
 * other nest.
 * @param {Element} host
 * @param {'enter'|'exit'|'settle'} step
 */
function hostToasts(host, step) {
  const doc = host.ownerDocument;
  const theme = host.closest('.ds-theme');
  const scope = !theme || theme === doc.documentElement ? doc : theme;
  for (const region of scope.querySelectorAll('.ds-toasts')) {
    if (step === 'enter') followInto(region, host);
    else if (step === 'exit') followOut(region, host);
    else giveRegionBack(region, host);
  }
}

/** Where a region rests inside `host`, in px: a sheet's panel edge (its layout box, whatever its translate is now) plus --ds-space-6; NaN for a dialog. */
function hostedLeft(region, host) {
  const panel = host.matches('.ds-sheet') ? host.querySelector('.ds-sheet__panel') : null;
  if (!panel) return NaN;
  return host.getBoundingClientRect().left + host.clientLeft + /** @type {HTMLElement} */ (panel).offsetLeft + pxOf(region, '--ds-space-6', 24);
}

function followInto(region, host) {
  const homes = toastHomes.get(region) ?? [];
  const own = homes.find((home) => home.host === host);
  if (own) {
    // Reopened during its exit: the region is still inside, gliding back.
    if (own.leaving) {
      own.leaving = false;
      const left = hostedLeft(region, host);
      if (Number.isFinite(left)) glideRegion(region, 'enter', () => /** @type {HTMLElement} */ (region).style.setProperty('--ds-toast-left', `${round(left)}px`));
    }
    return;
  }
  if (host.contains(region)) return;
  if (host.matches('.ds-sheet') && !host.querySelector('.ds-sheet__panel')) return;
  const state = toastRegions.get(region);
  let next = region.nextSibling;
  while (next && (next === state?.polite || next === state?.assertive)) next = next.nextSibling;
  // Where the region stands: a dialog keeps it (its rule beside the drawer
  // would no longer match inside), and closing glides back to it.
  const at = parseFloat(viewOf(region).getComputedStyle?.(region).left ?? '');
  homes.push({ host, parent: /** @type {Node} */ (region.parentNode), next, left: /** @type {HTMLElement} */ (region).style.getPropertyValue('--ds-toast-left'), at, leaving: false });
  toastHomes.set(region, homes);
  const sheetLeft = hostedLeft(region, host);
  const left = Number.isFinite(sheetLeft) ? sheetLeft : at;
  glideRegion(region, 'enter', () => {
    moveRegion(region, host, null);
    if (Number.isFinite(left)) /** @type {HTMLElement} */ (region).style.setProperty('--ds-toast-left', `${round(left)}px`);
  });
}

/** A later overlay took the region from the one at `index`: its home becomes the later one's. */
function passHome(homes, index) {
  const home = homes[index];
  Object.assign(homes[index + 1], { parent: home.parent, next: home.next, left: home.left, at: home.at });
  homes.splice(index, 1);
}

function followOut(region, host) {
  const homes = toastHomes.get(region);
  const index = homes ? homes.findIndex((home) => home.host === host) : -1;
  if (!homes || index < 0) return;
  // The region sits in a later overlay, which took it from this one: it
  // goes back to where this one took it from (and glides there now if
  // that overlay is leaving too).
  if (index < homes.length - 1) {
    passHome(homes, index);
    if (homes[homes.length - 1].leaving) glideHome(region, homes[homes.length - 1]);
    return;
  }
  homes[index].leaving = true;
  glideHome(region, homes[index]);
}

/** Glides the region, still inside its host, to the left it had at `home`. */
function glideHome(region, home) {
  if (!Number.isFinite(home.at)) return;
  glideRegion(region, 'exit', () => /** @type {HTMLElement} */ (region).style.setProperty('--ds-toast-left', `${round(home.at)}px`));
}

function giveRegionBack(region, host) {
  const homes = toastHomes.get(region);
  const index = homes ? homes.findIndex((home) => home.host === host && home.leaving) : -1;
  if (!homes || index < 0) return;
  // An overlay opened during the exit took the region from this one.
  if (index < homes.length - 1) return passHome(homes, index);
  const home = homes[index];
  homes.pop();
  if (!homes.length) toastHomes.delete(region);
  const parent = home.parent.isConnected ? home.parent : host.parentNode;
  if (!parent) return;
  // It already stands at its place: nothing moves, unless that place
  // changed meanwhile (a resize past the drawer's breakpoint), then it glides.
  glideRegion(region, 'exit', () => {
    moveRegion(region, parent, home.next);
    const style = /** @type {HTMLElement} */ (region).style;
    if (home.left) style.setProperty('--ds-toast-left', home.left);
    else style.removeProperty('--ds-toast-left');
  });
}

/* ── Tooltips ───────────────────────────────────────── */

let tooltipCount = 0;
let anchorCount = 0;
let tooltipWarned = false;

/** Top layer and CSS anchor positioning, both needed for the anchored path. */
function supportsAnchoring(view) {
  const proto = view.HTMLElement?.prototype ?? {};
  return typeof proto.showPopover === 'function' && typeof view.CSS?.supports === 'function'
    && view.CSS.supports('position-area: block-end') && 'anchorName' in view.document.documentElement.style;
}

const normalText = (text) => String(text ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

/** A close enough accessible name: aria-labelledby, aria-label, else the text. */
function accessibleName(node) {
  const doc = node.ownerDocument;
  const ids = (node.getAttribute('aria-labelledby') ?? '').split(/\s+/).filter(Boolean);
  if (ids.length) return ids.map((id) => doc.getElementById(id)?.textContent ?? '').join(' ');
  return node.getAttribute('aria-label') ?? node.textContent ?? '';
}

function focusVisible(node) {
  try {
    return node.matches(':focus-visible');
  } catch {
    return true;
  }
}

/**
 * Tooltips for every [data-tip] trigger inside `root` (the attribute holds
 * the text), through one set of delegated listeners and one
 * <div class="ds-tooltip" role="tooltip"> that it creates inside the
 * .ds-theme around `root` (warns once if there is none). A pointer (mouse
 * or pen, never touch) that rests on a trigger shows it after
 * --ds-delay-tooltip; keyboard focus (:focus-visible) shows it at once.
 * While one shows, or within --ds-delay-tooltip-skip of the last hide, the
 * next trigger shows at once: a visible tooltip swaps text and place in
 * place, a hidden one only fades in (data-warm). It hides after the
 * --ds-delay-tooltip-hide grace, which the pointer may use to move onto
 * it; at once on Escape (the key is then the tooltip's: the dialog under
 * it stays open), on any pointerdown, on DS.overlay.open(), and when its
 * trigger scrolls out of view. While shown, the trigger is described by
 * it (aria-describedby), unless its accessible name says the same.
 * Placement: below the trigger, above it without room; with popover and
 * anchor positioning in the top layer, else by --ds-tooltip-x/-y.
 * @param {Document|Element} [root]
 * @returns {{ destroy: () => void }}
 */
export function tooltips(root = globalThis.document) {
  const doc = root?.nodeType === 9 ? /** @type {Document} */ (root) : root?.ownerDocument;
  if (!doc) return { destroy() {} };
  const view = doc.defaultView ?? globalThis;
  const rootElement = root.nodeType === 9 ? doc.documentElement : /** @type {Element} */ (root);
  const theme = rootElement.closest('.ds-theme') ?? (root.nodeType === 9 ? doc.querySelector('.ds-theme') : null);
  if (!theme && !tooltipWarned) {
    tooltipWarned = true;
    view.console?.warn('Dashboard-Style: DS.overlay.tooltips() on a root outside .ds-theme. The tooltip must sit inside the .ds-theme element, or it gets neither the tokens nor the motion.');
  }
  const anchored = supportsAnchoring(view);
  const home = !theme || theme === doc.documentElement ? doc.body : theme;

  const tip = doc.createElement('div');
  tip.className = 'ds-tooltip';
  tip.setAttribute('role', 'tooltip');
  tip.id = `ds-tooltip-${tooltipCount += 1}`;
  tip.hidden = true;
  tip.setAttribute('data-state', 'closed');
  if (anchored) {
    tip.setAttribute('popover', 'manual');
    tip.setAttribute('data-anchored', '');
  }
  tooltipNodes.add(tip);
  home.append(tip);

  /** @type {'hidden'|'open'|'closing'} */
  let phase = 'hidden';
  let trigger = /** @type {Element|null} */ (null);
  let hovering = false;
  let focusing = false;
  let showTimer = /** @type {any} */ (0);
  let hideTimer = /** @type {any} */ (0);
  let lastHide = -Infinity;
  let run = 0;
  let frame = 0;
  let ownAnchor = /** @type {HTMLElement|null} */ (null);
  let described = /** @type {Element|null} */ (null);

  const time = (token) => motionDuration(tip.isConnected ? tip : rootElement, token);
  const contains = (node) => (root.nodeType === 9 ? doc.contains(node) : rootElement.contains(node));

  /** Where the tooltip lives for a trigger: its overlay (in the top layer, never inert), else the theme. */
  function hostFor(node) {
    return node.closest('dialog[open], .ds-dialog:not(.ds-dialog--contained), .ds-sheet') ?? home;
  }

  function anchorTo(next) {
    if (!anchored) return;
    if (ownAnchor && ownAnchor !== next) unanchor();
    let name = ownAnchor === next ? ownAnchor.style.getPropertyValue('anchor-name') : view.getComputedStyle(next).getPropertyValue('anchor-name').trim();
    if (!name || name === 'none') {
      name = `--ds-anchor-${anchorCount += 1}`;
      /** @type {HTMLElement} */ (next).style.setProperty('anchor-name', name);
      ownAnchor = /** @type {HTMLElement} */ (next);
    }
    tip.style.setProperty('position-anchor', name.split(',')[0].trim());
  }

  function unanchor() {
    ownAnchor?.style.removeProperty('anchor-name');
    ownAnchor = null;
  }

  /** Marks the side the engine put an anchored tooltip on; true when that changed. */
  function readSide(next) {
    const box = tip.getBoundingClientRect();
    const top = box.bottom <= next.getBoundingClientRect().top + 1;
    if (top === tip.hasAttribute('data-placement')) return false;
    if (top) tip.setAttribute('data-placement', 'top');
    else tip.removeAttribute('data-placement');
    return true;
  }

  /** Below the trigger, centred and clamped to the viewport; above it when there is no room below. */
  function place(next) {
    if (anchored) {
      // The engine places it; its side sets the origin. Chromium lays a
      // swap out with what it took from the previous anchor at the last
      // rendering (the scroll offset of a box around it: from a trigger in
      // a scrolled box it read "top" for a tooltip that then sits below),
      // so the side read now is a guess, read again once two frames have
      // rendered; the origin follows a corrected side.
      readSide(next);
      const mine = run;
      nextFrame(doc, () => nextFrame(doc, () => {
        if (mine !== run || phase !== 'open' || trigger !== next || !tip.isConnected) return;
        if (readSide(next)) originFrom(next, tip);
      }));
      return;
    }
    const rect = next.getBoundingClientRect();
    const gap = pxOf(tip, '--ds-space-2', 8);
    const width = tip.offsetWidth;
    const height = tip.offsetHeight;
    const viewWidth = doc.documentElement.clientWidth || view.innerWidth;
    const viewHeight = doc.documentElement.clientHeight || view.innerHeight;
    const x = Math.max(gap, Math.min(viewWidth - width - gap, rect.left + rect.width / 2 - width / 2));
    let y = rect.bottom + gap;
    const above = y + height > viewHeight - gap && rect.top - gap - height >= gap;
    if (above) y = rect.top - gap - height;
    tip.style.setProperty('--ds-tooltip-x', `${round(x)}px`);
    tip.style.setProperty('--ds-tooltip-y', `${round(y)}px`);
    if (above) tip.setAttribute('data-placement', 'top');
    else tip.removeAttribute('data-placement');
  }

  function describe(next) {
    undescribe();
    if (normalText(tip.textContent) === normalText(accessibleName(next))) return;
    const ids = (next.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    if (!ids.includes(tip.id)) next.setAttribute('aria-describedby', [...ids, tip.id].join(' '));
    described = next;
  }

  function undescribe() {
    if (!described) return;
    const ids = (described.getAttribute('aria-describedby') ?? '').split(/\s+/).filter((id) => id && id !== tip.id);
    if (ids.length) described.setAttribute('aria-describedby', ids.join(' '));
    else described.removeAttribute('aria-describedby');
    described = null;
  }

  function cancelTimers() {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    showTimer = 0;
    hideTimer = 0;
  }

  /** Shows the tooltip of `next` now: in place when one is visible, else from its closed state. */
  function show(next) {
    cancelTimers();
    const text = next.getAttribute('data-tip') ?? '';
    if (!text.trim() || !next.isConnected) return;
    const host = hostFor(next);
    const visible = phase !== 'hidden' && tip.parentNode === host;
    const warm = !visible && clock() - lastHide < time('--ds-delay-tooltip-skip');
    run += 1;
    trigger = next;
    focusing = next === doc.activeElement && focusVisible(next);
    tip.textContent = text;
    if (visible) {
      // A swap (or a hide taken back): text and place change where it is,
      // and a fade still under way turns back from its current opacity.
      anchorTo(next);
      place(next);
      originFrom(next, tip);
      tip.setAttribute('data-state', 'open');
    } else {
      if (tip.parentNode !== host) {
        try {
          if (anchored && tip.matches(':popover-open')) tip.hidePopover();
        } catch {
          // Not open after all.
        }
        host.append(tip);
      }
      // The closed state at rest size (data-warm), so its place and the
      // origin at the anchor side are measured true.
      tip.setAttribute('data-state', 'closed');
      tip.setAttribute('data-warm', '');
      tip.hidden = false;
      anchorTo(next);
      if (anchored) {
        try {
          tip.showPopover();
        } catch {
          // Already open (a fade that just ended): it stays.
        }
      }
      place(next);
      originFrom(next, tip);
      if (!warm) {
        // Cold: from --ds-scale-tooltip at the anchor, without a transition to it.
        tip.style.transition = 'none';
        tip.removeAttribute('data-warm');
        flushStyle(tip);
        tip.style.removeProperty('transition');
      } else flushStyle(tip);
      tip.setAttribute('data-state', 'open');
    }
    phase = 'open';
    describe(next);
  }

  /** Starts the exit: a quick fade; once it settled the tooltip is hidden. */
  function hide() {
    cancelTimers();
    if (phase !== 'open') return;
    phase = 'closing';
    lastHide = clock();
    undescribe();
    const mine = ++run;
    tip.setAttribute('data-state', 'closed');
    settled(tip, { transitions: true }).then(() => {
      if (mine !== run || phase !== 'closing') return;
      phase = 'hidden';
      trigger = null;
      try {
        if (anchored && tip.matches(':popover-open')) tip.hidePopover();
      } catch {
        // Not open.
      }
      tip.hidden = true;
      unanchor();
    });
  }

  /** Hides after the grace, unless the pointer or keyboard focus still holds it. */
  function hideLater() {
    clearTimeout(showTimer);
    showTimer = 0;
    if (hovering || focusing || phase !== 'open' || hideTimer) return;
    hideTimer = setTimeout(() => {
      hideTimer = 0;
      if (!hovering && !focusing) hide();
    }, time('--ds-delay-tooltip-hide'));
  }

  const triggerOf = (node) => {
    const found = /** @type {Element|null} */ (node?.closest?.('[data-tip]') ?? null);
    return found && contains(found) ? found : null;
  };

  function onPointerOver(/** @type {PointerEvent} */ event) {
    if (event.pointerType === 'touch') return;
    const next = triggerOf(event.target);
    if (!next || next.contains(/** @type {Node} */ (event.relatedTarget))) return;
    hovering = true;
    clearTimeout(hideTimer);
    hideTimer = 0;
    if (phase === 'open' && trigger === next) return;
    if (phase !== 'hidden' || clock() - lastHide < time('--ds-delay-tooltip-skip')) {
      show(next);
      return;
    }
    clearTimeout(showTimer);
    showTimer = setTimeout(() => {
      showTimer = 0;
      show(next);
    }, time('--ds-delay-tooltip'));
  }

  function onPointerOut(/** @type {PointerEvent} */ event) {
    if (event.pointerType === 'touch') return;
    const from = triggerOf(event.target);
    const to = /** @type {Node} */ (event.relatedTarget);
    if (!from || from.contains(to) || tip.contains(to)) return;
    hovering = false;
    hideLater();
  }

  function onTipOver(/** @type {PointerEvent} */ event) {
    if (event.pointerType === 'touch' || phase !== 'open') return;
    // Hoverable: the pointer crossed onto the tooltip within the grace.
    hovering = true;
    clearTimeout(hideTimer);
    hideTimer = 0;
  }

  function onTipOut(/** @type {PointerEvent} */ event) {
    if (event.pointerType === 'touch') return;
    const to = /** @type {Node} */ (event.relatedTarget);
    if (tip.contains(to) || trigger?.contains(to)) return;
    hovering = false;
    hideLater();
  }

  function onFocusIn(/** @type {FocusEvent} */ event) {
    const next = triggerOf(event.target);
    if (!next || !focusVisible(next)) return;
    hovering = false;
    show(next);
  }

  function onFocusOut(/** @type {FocusEvent} */ event) {
    const from = triggerOf(event.target);
    if (!from || from !== trigger || from.contains(/** @type {Node} */ (event.relatedTarget))) return;
    focusing = false;
    // A focusin on another trigger right after takes over in place.
    hideLater();
  }

  function onKeyDown(/** @type {KeyboardEvent} */ event) {
    if (event.key !== 'Escape' || event.defaultPrevented || !escape()) return;
    event.preventDefault();
    event.stopPropagation();
  }

  function onPointerDown() {
    clearTimeout(showTimer);
    showTimer = 0;
    hide();
  }

  function onScroll() {
    if (phase !== 'open' || frame) return;
    const update = () => {
      frame = 0;
      if (phase !== 'open' || !trigger) return;
      const rect = trigger.getBoundingClientRect();
      const gone = !trigger.isConnected || rect.bottom <= 0 || rect.right <= 0 || rect.top >= view.innerHeight || rect.left >= view.innerWidth;
      if (gone) hide();
      else if (!anchored) place(trigger);
    };
    frame = typeof view.requestAnimationFrame === 'function' ? view.requestAnimationFrame(update) : 0;
    if (!frame) update();
  }

  /** Escape: hides a visible tooltip and reports that the key was its. */
  function escape() {
    if (phase !== 'open') return false;
    hovering = false;
    focusing = false;
    hide();
    return true;
  }

  const controller = {
    hide() {
      clearTimeout(showTimer);
      showTimer = 0;
      hide();
    },
    escape,
  };
  tooltipControllers.add(controller);

  const target = /** @type {EventTarget} */ (root);
  target.addEventListener('pointerover', onPointerOver);
  target.addEventListener('pointerout', onPointerOut);
  target.addEventListener('focusin', onFocusIn);
  target.addEventListener('focusout', onFocusOut);
  tip.addEventListener('pointerover', onTipOver);
  tip.addEventListener('pointerout', onTipOut);
  doc.addEventListener('keydown', onKeyDown, true);
  doc.addEventListener('pointerdown', onPointerDown, true);
  doc.addEventListener('scroll', onScroll, { capture: true, passive: true });
  view.addEventListener('resize', onScroll);

  return {
    destroy() {
      tooltipControllers.delete(controller);
      cancelTimers();
      if (frame && typeof view.cancelAnimationFrame === 'function') view.cancelAnimationFrame(frame);
      target.removeEventListener('pointerover', onPointerOver);
      target.removeEventListener('pointerout', onPointerOut);
      target.removeEventListener('focusin', onFocusIn);
      target.removeEventListener('focusout', onFocusOut);
      doc.removeEventListener('keydown', onKeyDown, true);
      doc.removeEventListener('pointerdown', onPointerDown, true);
      doc.removeEventListener('scroll', onScroll, { capture: true });
      view.removeEventListener('resize', onScroll);
      undescribe();
      unanchor();
      run += 1;
      phase = 'hidden';
      tip.remove();
    },
  };
}
