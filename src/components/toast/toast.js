/**
 * Snackbars (DS.toast; DS.overlay.toast and the others call them).
 *
 * Snackbars (D19): toast(region, content, options) builds or takes a
 * .ds-toast and shows at most TOAST_LIMIT at once; insertions and removals
 * run inside DS.motion.flip(), so the messages on screen glide while one
 * enters or fades out in place. A fourth replaces the oldest message that
 * would close by itself; behind three that stay it waits in a queue. The
 * timer (length-dependent, --ds-time-scale included) pauses while a pointer
 * is over a message, focus is in the region or the tab is hidden. The same
 * string message again restarts the one on screen; a `key` replaces a
 * message in place; an `action` (Undo) adds a text button and keeps the
 * message until it is used or closed; closeToasts() closes by kind or
 * key. Text is announced through two .ds-sr live regions next to the
 * region (announce() speaks through them without a message; the region
 * itself is never live: role and aria-live are taken off it); a focused
 * message that leaves hands focus to the next close button, else to where
 * focus came from, never to <body>. Messages that stay keep room at the end
 * of their layer (data-toast-reserve on the view, a hosting sheet's body
 * or dialog). An open dialog or side sheet takes the
 * regions of its theme in (with a sheet they glide to its panel's edge and
 * above its foot on the sheet's timing), so messages stay above its scrim,
 * usable and announced; the div trap and the modal drawer never make them
 * inert. Closing, they glide back while still inside it (above its leaving
 * scrim and panel in every engine) and go back to the page once it
 * settled. On the page they rise above a shown save bar and, on phones,
 * the open modal drawer's foot (--ds-toast-lift, gliding on both axes).
 *
 * Progressive:
 * - moveBefore (a snackbar region that moves into a dialog or side sheet
 *   keeps its running motion and focus): without it insertBefore, focus
 *   put back, the entrances already marked played (.ds-toast--shown).
 */
import { flip, settled } from '../../js/motion.js';
import { alertCircle, checkCircle, close as closeGlyph, iconElement, info } from '../../js/icons.js';
import { pxOf, round } from '../../js/position.js';
import { internals, TOAST_LIMIT, TOAST_MAX_MS, TOAST_MS } from '../../js/overlay.js';

const { overlays, stack, neverInert, shownSavebars, LANDMARK, activeIn, inside, own, disown, viewOf, flushStyle, canFocus, report, keepAway, keepHome, clock, normalText, timeScaleOf, nextFrame } = internals;

/* ── Snackbars ──────────────────────────────────────── */

/** Each character past TOAST_FREE_CHARS adds this much reading time (ms), up to TOAST_MAX_MS. */
const TOAST_CHAR_MS = 50;

/** A message this long or shorter takes TOAST_MS. */
const TOAST_FREE_CHARS = 40;

/** The phone width of toast.css: the region spans the width, and the open modal drawer covers its foot. */
const PHONE_QUERY = '(max-width: 600px)';

/**
 * What toast() returns for a message.
 * @typedef {{ el: HTMLElement|null, close: () => Promise<void>, closed: Promise<void> }} ToastHandle
 */

/**
 * One message. `key`: a later toast() with the same key replaces it (an
 * explicit key) or restarts it (the implicit `restart:` key of a string
 * message without an action); `reserve`: it stays and keeps room in its
 * layer; `onAction`: the onClick of its action button, until used.
 * @typedef {{ el: HTMLElement, region: Element, kind: string, key: string|null, stays: boolean, reserve: boolean,
 *   assertive: boolean, text: string, timeout: number, remaining: number, timer: any, started: number,
 *   phase: 'queued'|'shown'|'leaving'|'gone', done: () => void, closed: Promise<void>,
 *   onAction: ((event: Event, handle: ToastHandle) => void)|null, handle: ToastHandle }} Toast
 */

/**
 * One region: the messages on screen (oldest first) and waiting, why its
 * timers pause, where focus came from, its announcers, the scroller or
 * dialog that keeps room for its messages that stay (`reserved`, watched by
 * `observer` while held) and whether it owns its --ds-toast-lift.
 * @typedef {{ shown: Toast[], queue: Toast[], pointer: boolean, focus: boolean, origin: Element|null,
 *   polite: HTMLElement|null, assertive: HTMLElement|null, pending: Map<HTMLElement, string[]>,
 *   reserved: HTMLElement|null, observer: ResizeObserver|null, lifted: boolean }} ToastRegion
 * @type {WeakMap<Element, ToastRegion>}
 */
const toastRegions = new WeakMap();

/** The message of each .ds-toast that toast() shows. @type {WeakMap<Element, Toast>} */
const toastEntries = new WeakMap();

/** Regions with a pointer over a message (cleared by a pointerover anywhere else). */
const pointedRegions = /** @type {Set<Element>} */ (new Set());

/** Documents with the pointer watcher of pointedRegions. */
const pointerWatched = new WeakSet();

/**
 * Per document: the regions its one visibilitychange listener pauses and
 * resumes, held weakly, so a region the page dropped is not kept alive.
 * @type {WeakMap<Document, Set<WeakRef<Element>>>}
 */
const visibilityRegions = new WeakMap();

/**
 * Per .ds-app, the regions its one data-drawer-open observer lifts, held
 * weakly like visibilityRegions.
 * @type {WeakMap<Element, Set<WeakRef<Element>>>}
 */
const drawerRegions = new WeakMap();

/**
 * Regions that open dialogs and side sheets took in: the places each one
 * left, the latest last ({ host, parent, next, left: the inline
 * --ds-toast-left, at: the computed left in px there, leaving: the host's
 * exit runs and the region glides back inside it }).
 * @type {WeakMap<Element, Array<{ host: Element, parent: Node, next: Node|null, left: string, at: number, leaving: boolean }>>}
 */
const toastHomes = new WeakMap();

/**
 * The regions that have a toastHomes entry right now, so a close finds
 * them even when they left the document meanwhile; each with the nodes
 * that keepAway() marked (the region and its announcers).
 * @type {Map<Element, Node[]>}
 */
const hostedRegions = new Map();

/** The latest follow glide of each region (a later one supersedes it). @type {WeakMap<Element, number>} */
const followRuns = new WeakMap();

function regionState(region) {
  let state = toastRegions.get(region);
  if (!state) {
    state = {
      shown: [], queue: [], pointer: false, focus: false, origin: null,
      polite: null, assertive: null, pending: new Map(),
      reserved: null, observer: null, lifted: false,
    };
    toastRegions.set(region, state);
    // The markup removed in 2.0 (role="status" aria-live="polite" on the
    // region): the announcers speak, so a live region would read every
    // message twice. Taken off once and owned, so a re-render of the
    // page's markup (DS.dom.morphHtml) does not put it back.
    for (const name of ['role', 'aria-live']) {
      if (!region.hasAttribute(name)) continue;
      region.removeAttribute(name);
      own(region, 'attrs', name);
    }
    wireRegion(region, state);
    hostLate(region);
  }
  return state;
}

/**
 * A region first used while a dialog or side sheet of its theme is open
 * (made by toastRegion() then, or rendered by the page after the open)
 * goes into each such overlay on the stack, oldest first, as if it had
 * been there at open(): else it would stay under the modal, inert, and
 * its announcers unheard. One inside a nested .ds-theme stays, as in
 * hostToasts().
 */
function hostLate(region) {
  const theme = region.closest?.('.ds-theme') ?? null;
  for (const host of [...stack]) {
    const state = overlays.get(host);
    if (state?.phase !== 'open' || (state.kind !== 'dialog' && state.kind !== 'sheet')) continue;
    const hostTheme = host.closest('.ds-theme');
    if (hostTheme && hostTheme !== theme) continue;
    followInto(region, host);
  }
}

/** The .ds-app of a region's theme (the region sits right after it). */
function appOf(region) {
  const scope = region.closest?.('.ds-theme') ?? region.ownerDocument;
  return /** @type {HTMLElement|null} */ (scope?.querySelector?.('.ds-app') ?? null);
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
 * The pauses (pointer, focus, a hidden tab), the close and action buttons,
 * the origin of focus and the open modal drawer (its foot lifts the
 * messages on phones), once per region. The region itself takes no
 * pointer (pointer-events: none), its messages do, and their events
 * bubble here.
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
    const target = /** @type {Element} */ (event.target);
    const button = target.closest?.('.ds-toast__close, .ds-toast__action');
    const entry = button && region.contains(button) ? toastEntries.get(button.closest('.ds-toast')) : null;
    if (!entry || entry.phase !== 'shown') return;
    if (button.classList.contains('ds-toast__close')) {
      closeToast(entry);
      return;
    }
    const run = entry.onAction;
    if (!run) return;
    // Once: a double click never undoes twice.
    entry.onAction = null;
    closeToast(entry);
    try {
      run(event, entry.handle);
    } catch (error) {
      report(region, error);
    }
  });
  const regions = visibilityOf(doc);
  for (const ref of [...regions]) if (!ref.deref()) regions.delete(ref);
  regions.add(new WeakRef(region));
  watchPointer(doc);
  const app = appOf(region);
  const lifted = app ? drawerOf(app) : null;
  if (lifted) {
    for (const ref of [...lifted]) if (!ref.deref()) lifted.delete(ref);
    lifted.add(new WeakRef(region));
  }
}

/**
 * The regions that the modal drawer of `app` lifts while it opens and
 * closes (its foot on phones): one MutationObserver per .ds-app. A
 * function of its own, like visibilityOf(): an observer made inside
 * wireRegion() would keep its region alive as long as the .ds-app, also
 * after the page replaced the region. Null without MutationObserver.
 * @returns {Set<WeakRef<Element>>|null}
 */
function drawerOf(app) {
  let watched = drawerRegions.get(app);
  if (watched) return watched;
  const Observer = viewOf(app).MutationObserver;
  if (typeof Observer !== 'function') return null;
  const regions = /** @type {Set<WeakRef<Element>>} */ (new Set());
  drawerRegions.set(app, regions);
  new Observer(() => {
    for (const ref of [...regions]) {
      const region = ref.deref();
      const state = region && toastRegions.get(region);
      if (!state) regions.delete(ref);
      else if (region.isConnected && state.shown.length) liftRegion(region);
    }
  }).observe(app, { attributes: true, attributeFilter: ['data-drawer-open'] });
  return regions;
}

/**
 * A message that leaves from under a still pointer sends no pointerout to
 * the region; the next pointerover elsewhere tells. A function of its own,
 * like visibilityOf(): made inside wireRegion(), the listener would keep
 * the first region alive.
 */
function watchPointer(doc) {
  if (pointerWatched.has(doc)) return;
  pointerWatched.add(doc);
  doc.addEventListener('pointerover', (/** @type {PointerEvent} */ event) => {
    for (const pointed of [...pointedRegions]) {
      if (!inside(pointed, event)) unpoint(pointed, toastRegions.get(pointed));
    }
  }, true);
}

/**
 * The regions of `doc` that its one visibilitychange listener pauses and
 * resumes. A function of its own: a listener made inside wireRegion()
 * would share that call's scope and keep its region alive.
 * @returns {Set<WeakRef<Element>>}
 */
function visibilityOf(doc) {
  let watched = visibilityRegions.get(doc);
  if (watched) return watched;
  const regions = /** @type {Set<WeakRef<Element>>} */ (new Set());
  visibilityRegions.set(doc, regions);
  doc.addEventListener('visibilitychange', () => {
    for (const ref of [...regions]) {
      const region = ref.deref();
      const state = region && toastRegions.get(region);
      if (!state) regions.delete(ref);
      else if (doc.hidden) pauseToasts(state);
      else resumeToasts(region, state);
    }
  });
  return regions;
}

/** The documented close button of a message; its label is its tooltip too. */
function closeButton(doc, label) {
  const button = doc.createElement('button');
  button.className = 'ds-btn ds-btn--quiet ds-btn--icon ds-toast__close';
  button.type = 'button';
  button.setAttribute('aria-label', label || 'Close');
  button.setAttribute('data-tip', label || 'Close');
  button.append(iconElement(closeGlyph, 20, undefined, doc));
  return button;
}

/** The documented message for a string: icon, text, the action and, when it stays, a close button. */
function buildToast(doc, text, kind, closable, closeLabel, actionLabel) {
  const el = doc.createElement('div');
  el.className = kind === 'error' || kind === 'info' ? `ds-toast ds-toast--${kind}` : 'ds-toast';
  el.append(iconElement(kind === 'error' ? alertCircle : kind === 'info' ? info : checkCircle, 20, undefined, doc));
  const span = doc.createElement('span');
  span.className = 'ds-toast__text';
  span.textContent = text;
  el.append(span);
  if (actionLabel) {
    const action = doc.createElement('button');
    action.className = 'ds-btn ds-btn--text ds-sm ds-toast__action';
    action.type = 'button';
    action.textContent = actionLabel;
    el.append(action);
  }
  if (closable) el.append(closeButton(doc, closeLabel));
  return el;
}

/** The two announcers next to the region (created once, moved with it). */
function announcers(region, state) {
  // An announcer a re-render patched into a page element is no announcer
  // any more: a new one takes its place, and the page keeps its element.
  const live = (key) => {
    const node = state[key];
    return Boolean(node?.isConnected) && node.classList.contains('ds-sr') && node.getAttribute('aria-live') === key;
  };
  if (live('polite') && live('assertive')) return;
  const doc = region.ownerDocument;
  for (const key of /** @type {const} */ (['polite', 'assertive'])) {
    if (live(key)) continue;
    if (state[key]) neverInert.delete(state[key]);
    const node = doc.createElement('div');
    node.className = 'ds-sr';
    node.setAttribute('aria-live', key);
    node.setAttribute('aria-atomic', 'true');
    // A runtime node, like a ripple: DS.dom.morphHtml of the region's
    // parent never matches, patches or removes it.
    node.setAttribute('data-ds-keep', '');
    neverInert.add(node);
    state[key] = node;
  }
  region.after(/** @type {HTMLElement} */ (state.polite), /** @type {HTMLElement} */ (state.assertive));
}

/**
 * Says a text through the region's announcer: cleared now, written on the
 * next frame, so the same text again is announced again. Texts of one
 * frame are read together.
 * @param {{ text: string, assertive: boolean }} entry
 */
function speak(region, state, entry) {
  if (!entry.text) return;
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
 * The page's snackbar region: the .ds-toasts in the theme of the first
 * .ds-app (else the first in the document). Without one it creates
 * <div class="ds-toasts"></div> right after the .ds-app (else as the last
 * child of the .ds-theme, else of <body>; a theme on <html> puts it at the
 * end of <body>, never after it). toast(null, ...), announce() and
 * savebar() use it.
 * @param {Document} [doc]
 * @returns {HTMLElement|null}
 */
export function toastRegion(doc = globalThis.document) {
  if (!doc?.querySelector) return null;
  const app = doc.querySelector('.ds-app');
  const theme = app?.closest('.ds-theme') ?? null;
  const found = (theme && ownOf(theme, '.ds-toasts')) ?? doc.querySelector('.ds-toasts');
  if (found) return /** @type {HTMLElement} */ (found);
  return newRegion(doc, app, doc.querySelector('.ds-theme') ?? doc.body);
}

/** The first `selector` match inside `theme` that is its own (not inside a nested .ds-theme, an embedded widget's). */
function ownOf(theme, selector) {
  return [...theme.querySelectorAll(selector)].find((node) => node.closest('.ds-theme') === theme) ?? null;
}

/**
 * A new empty .ds-toasts right after `app` (else the last child of
 * `parent`, <body> for a theme on <html>, as ask() places its dialog);
 * null when it is not in the document.
 */
function newRegion(doc, app, parent) {
  const region = doc.createElement('div');
  region.className = 'ds-toasts';
  if (app) app.after(region);
  else (parent === doc.documentElement && doc.body ? doc.body : parent)?.append(region);
  return region.isConnected ? region : null;
}

/**
 * The snackbar region of a built dialog's theme (`home` is where the
 * dialog went: the theme, or <body> for a theme on <html>): its own
 * region, else a new one after its .ds-app, which regionState() then
 * moves into the open dialog.
 */
function regionOfTheme(doc, theme, home) {
  if (!theme) return toastRegion(doc);
  return /** @type {HTMLElement|null} */ (ownOf(theme, '.ds-toasts')) ?? newRegion(doc, ownOf(theme, '.ds-app'), home);
}

/**
 * Says `text` to screen readers through the announcers of a snackbar
 * region (`region`, default toastRegion()), without showing a message:
 * polite, or assertive with `assertive: true`. The same text twice is
 * spoken twice; empty text does nothing. While a dialog or side sheet is
 * open the region (and its announcers) sit inside it, so the text is heard
 * there.
 * @param {string} text
 * @param {{ assertive?: boolean, region?: Element|null }} [options]
 */
export function announce(text, options = {}) {
  const value = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!value) return;
  const region = options.region ?? toastRegion();
  if (!region?.ownerDocument) return;
  speak(region, regionState(region), { text: value, assertive: options.assertive === true });
}

/**
 * Shows a snackbar in `region` (a .ds-toasts element inside the
 * .ds-theme; null: toastRegion()). `content` is a .ds-toast element or a
 * string, from which it builds the documented message: the checkCircle
 * icon (alertCircle for kind 'error', info for 'info'), the text, the
 * `action` button and, for a message that stays, a close button (an
 * element message that stays without one gets it too). At most TOAST_LIMIT
 * show at once: a further one replaces the oldest that would close by
 * itself, or waits until one closes. Errors, `persistent` messages and
 * messages with an action, another button or a link never close by
 * themselves; the others close after `timeout` ms (default 4000ms plus
 * 50ms per character past 40, at most 10000ms; all stretched by
 * --ds-time-scale), paused while a pointer is over a message, focus is in
 * the region or the tab is hidden.
 *
 * The same message again (a string without action, same kind, same
 * `persistent`, same text) restarts the one on screen (its timer, its
 * announcement) and returns its handle; `restart: false` stacks it. A
 * message with the `key` of one on screen or waiting replaces it in place
 * (the old one's `closed` resolves). Messages that stay keep room in the
 * view, a hosting sheet's body or dialog (data-toast-reserve and
 * --ds-toast-reserve), unless `reserve: false`.
 * @param {Element|null} region
 * @param {Element|string} content
 * @param {{ kind?: 'success'|'error'|'info', persistent?: boolean, timeout?: number, closeLabel?: string,
 *   action?: { label: string, onClick?: (event: Event, handle: ToastHandle) => void },
 *   key?: string, restart?: boolean, reserve?: boolean }} [options]
 * @returns {ToastHandle}
 *   close() takes it away (a waiting one leaves the queue); closed resolves once it is gone
 */
export function toast(region, content, options = {}) {
  const target = region ?? (content == null ? null : toastRegion());
  const doc = target?.ownerDocument;
  if (!doc || content == null) return { el: null, close: () => Promise.resolve(), closed: Promise.resolve() };
  const state = regionState(target);
  const given = typeof content === 'object' && /** @type {Element} */ (content).nodeType === 1;
  const element = /** @type {HTMLElement} */ (given ? content : null);
  const kind = options.kind ?? (element?.classList.contains('ds-toast--error') ? 'error' : element?.classList.contains('ds-toast--info') ? 'info' : 'success');
  const label = !given && options.action ? String(options.action.label ?? '').trim() : '';
  const persistent = options.persistent === true || kind === 'error' || Boolean(label);
  const el = element ?? buildToast(doc, String(content), kind, persistent, options.closeLabel, label);
  // A message with an action waits for it (WCAG 2.2.1).
  const action = [...el.querySelectorAll('button, a[href]')].some((node) => !node.classList.contains('ds-toast__close'));
  // A message that stays can always be closed.
  if (given && persistent && !action && !el.querySelector('.ds-toast__close')) el.append(closeButton(doc, options.closeLabel));
  const text = ((el.querySelector('.ds-toast__text') ?? el).textContent ?? '').replace(/\s+/g, ' ').trim();
  // The announcers speak; a live message would be read twice.
  if (/^(alert|status)$/.test(el.getAttribute('role') ?? '')) el.removeAttribute('role');
  el.removeAttribute('aria-live');
  const explicit = options.key != null && options.key !== '';
  const key = explicit ? String(options.key) : !given && !label && options.restart !== false ? `restart:${kind}:${persistent}:${normalText(text)}` : null;
  const match = key ? [...state.shown, ...state.queue].find((other) => other.key === key && (other.phase === 'shown' || other.phase === 'queued')) : null;
  if (match && (!explicit || match.el === el)) {
    // The same message again: nothing moves, it starts over (or keeps its place in the queue).
    if (match.phase === 'shown') restartToast(match, target, state);
    return match.handle;
  }
  const timeout = toastTimeout(target, text, options);
  let done = () => {};
  const closed = new Promise((resolve) => {
    done = () => resolve(undefined);
  });
  const stays = persistent || action || !Number.isFinite(timeout);
  /** @type {Toast} */
  const entry = {
    el, region: target, kind, key, stays, reserve: stays && options.reserve !== false, assertive: kind === 'error', text,
    timeout, remaining: timeout, timer: 0, started: 0, phase: 'queued', done, closed,
    onAction: label && typeof options.action?.onClick === 'function' ? options.action.onClick : null,
    handle: /** @type {ToastHandle} */ (/** @type {unknown} */ (null)),
  };
  entry.handle = { el, close: () => closeToast(entry), closed };
  toastEntries.set(el, entry);
  if (match) replaceToast(target, state, match, entry);
  else {
    state.queue.push(entry);
    updateToasts(target, state, []);
  }
  return entry.handle;
}

/**
 * Closes every message of `region` (default toastRegion()) on screen or
 * waiting that matches `kind` and `key` (both optional: no filter closes
 * all), as one change of the stack. Resolves once they are gone.
 * @param {Element|null} [region]
 * @param {{ kind?: 'success'|'error'|'info', key?: string }} [filter]
 * @returns {Promise<void>}
 */
export function closeToasts(region, filter = {}) {
  const target = region ?? toastRegion();
  const state = target ? toastRegions.get(target) : null;
  if (!state) return Promise.resolve();
  const matches = (entry) => (filter.kind == null || entry.kind === filter.kind) && (filter.key == null || entry.key === String(filter.key));
  const queued = state.queue.filter(matches);
  const shown = state.shown.filter((entry) => entry.phase === 'shown' && matches(entry));
  for (const entry of queued) {
    state.queue.splice(state.queue.indexOf(entry), 1);
    finishToast(entry);
  }
  if (shown.length) updateToasts(target, state, shown);
  return Promise.all([...queued, ...shown].map((entry) => entry.closed)).then(() => undefined);
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

/** The same message on screen again: its timer starts over and its text is said again; nothing moves. */
function restartToast(entry, region, state) {
  disarm(entry);
  entry.remaining = entry.timeout;
  arm(entry, region, state);
  speak(region, state, entry);
}

/**
 * A message with the key of `old` takes its place: in the queue, its
 * slot; on screen, inside one flip() the old one fades out where it is and
 * the new one enters in its slot. Focus inside the old one moves to the
 * new one's close button.
 */
function replaceToast(region, state, old, entry) {
  if (old.phase === 'queued') {
    state.queue.splice(state.queue.indexOf(old), 1, entry);
    finishToast(old);
    return;
  }
  const focused = old.el.contains(activeIn(old.el));
  disarm(old);
  old.phase = 'leaving';
  state.shown.splice(state.shown.indexOf(old), 1, entry);
  entry.phase = 'shown';
  const moved = flip(region, (hooks) => {
    region.insertBefore(entry.el, old.el.parentNode === region ? old.el : null);
    const leaving = hooks.onRemove(old.el);
    if (leaving) leaving.then(() => finishToast(old));
    else {
      old.el.remove();
      finishToast(old);
    }
  });
  if (focused) {
    const button = entry.el.querySelector('.ds-toast__close');
    if (canFocus(button)) /** @type {HTMLElement} */ (button).focus({ preventScroll: true });
    else releaseToastFocus(old, region, state, state.shown.filter((other) => other !== entry));
  }
  shownNow(region, state, [entry], moved);
}

/**
 * Moves focus off a message that leaves: to the close button of the next
 * message that stays (else the one before), else to where focus came from
 * into the region, else to the view (tabindex="-1"). Never <body>.
 */
function releaseToastFocus(entry, region, state, staying) {
  const doc = region.ownerDocument;
  if (!entry.el.contains(activeIn(entry.el))) return;
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
  // The first message of an empty stack enters where the region rests now
  // (above a sheet's foot, the drawer's foot, a save bar): set at once.
  if (!state.shown.length && entering.length) writeLift(region, liftOf(region));
  state.shown = next;
  for (const entry of removed) releaseToastFocus(entry, region, state, next.filter((other) => !entering.includes(other)));
  const moved = flip(region, (hooks) => {
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
  shownNow(region, state, entering, moved);
}

/**
 * After a change of the stack: the new messages are said and timed, their
 * entrance is marked played, and once it all settled the room for the
 * messages that stay is measured again.
 */
function shownNow(region, state, entering, moved) {
  const landed = entering.map((entry) => {
    speak(region, state, entry);
    arm(entry, region, state);
    // Played once: a later move of the region (a side sheet) does not replay it.
    const played = settled(entry.el);
    played.then(() => {
      if (entry.phase !== 'shown') return;
      // For good: a re-render never replays the entrance.
      own(entry.el, 'classes', 'ds-toast--shown');
      entry.el.classList.add('ds-toast--shown');
    });
    return played;
  });
  Promise.all([moved, ...landed]).then(() => reserveRoom(region, state));
}

/* ── Room for messages that stay, and the lift ───────── */

/** The open dialog or side sheet a region shows in (not one that is leaving), else null: the page. */
function hostOf(region) {
  const homes = toastHomes.get(region);
  const last = homes?.[homes.length - 1];
  return last && !last.leaving ? last.host : null;
}

/**
 * Where a region keeps room for messages that stay: a hosting dialog, a
 * hosting sheet's body, else the .ds-view of its app. A layer the page
 * marked data-ds-toast-room="off" keeps none (a fixed view that must not
 * shrink); the others still do. Read at every measure, so a toggle
 * applies on the next change of the stack.
 */
function reserveTarget(region) {
  const host = hostOf(region);
  const node = /** @type {HTMLElement|null} */ (host
    ? (host.matches('.ds-dialog') ? host : host.querySelector('.ds-sheet__body'))
    : appOf(region)?.querySelector('.ds-view') ?? null);
  return node?.getAttribute('data-ds-toast-room') === 'off' ? null : node;
}

/** Gives the room back: the attribute and the property toast() wrote go. */
function releaseReserve(state) {
  state.observer?.disconnect();
  state.observer = null;
  const node = state.reserved;
  if (!node) return;
  state.reserved = null;
  node.removeAttribute('data-toast-reserve');
  node.style.removeProperty('--ds-toast-reserve');
  disown(node, 'attrs', 'data-toast-reserve');
  disown(node, 'props', '--ds-toast-reserve');
}

/**
 * While messages that stay show, the scroller of their layer keeps room
 * for them at its end: data-toast-reserve and --ds-toast-reserve = how far
 * the highest of them reaches into it, rounded up. In a hosting dialog the
 * box makes room only while it would overlap the stack: the stack, its
 * distance from the bottom edge and --ds-space-3 (the box re-centres). A
 * focused element (or where focus came from) under the stack scrolls
 * clear. Measured after every change of the stack settled, after the
 * region moved and when the region resizes (one ResizeObserver, while
 * held).
 */
function reserveRoom(region, state) {
  const staying = state.shown.filter((entry) => entry.phase === 'shown' && entry.reserve && entry.el.parentNode === region);
  const node = staying.length && region.isConnected ? reserveTarget(region) : null;
  if (state.reserved && state.reserved !== node) releaseReserve(state);
  if (!node) return;
  const top = Math.min(...staying.map((entry) => entry.el.getBoundingClientRect().top));
  let room = 0;
  if (node.matches('.ds-dialog')) {
    const box = node.querySelector('.ds-dialog__box') ?? node;
    const applied = state.reserved === node ? parseFloat(node.style.getPropertyValue('--ds-toast-reserve')) || 0 : 0;
    // Where the box would rest without the room: it re-centres by half of it.
    if (box.getBoundingClientRect().bottom + applied / 2 <= top) {
      releaseReserve(state);
      return;
    }
    const doc = region.ownerDocument;
    room = (doc.documentElement.clientHeight || viewOf(region).innerHeight) - top + pxOf(region, '--ds-space-3', 12);
  } else room = node.getBoundingClientRect().bottom - top;
  if (state.reserved !== node) {
    own(node, 'attrs', 'data-toast-reserve');
    own(node, 'props', '--ds-toast-reserve');
    state.reserved = node;
  }
  node.setAttribute('data-toast-reserve', '');
  node.style.setProperty('--ds-toast-reserve', `${Math.ceil(Math.max(0, room))}px`);
  const Observer = viewOf(region).ResizeObserver;
  if (!state.observer && typeof Observer === 'function') {
    let first = true;
    state.observer = new Observer(() => {
      // The first call only reports the size it starts with.
      if (first) first = false;
      else reserveRoom(region, state);
    });
    state.observer.observe(region);
  }
  if (node.matches('.ds-dialog')) return;
  for (const el of new Set([activeIn(node), state.origin])) {
    if (!el || el === node || !node.contains(el) || typeof el.scrollIntoView !== 'function') continue;
    if (el.getBoundingClientRect().bottom > top) el.scrollIntoView({ block: 'nearest' });
  }
}

/**
 * How far a region rises above its resting bottom (px): above a hosting
 * side sheet's foot; on the page above the open modal drawer's foot on
 * phones and above a shown save bar of its theme.
 */
function liftOf(region) {
  const gap = pxOf(region, '--ds-space-2', 8);
  const above = (node) => (node && node.offsetHeight > 0 ? node.offsetHeight + gap : 0);
  const host = hostOf(region);
  if (host) return host.matches('.ds-sheet') ? above(host.querySelector('.ds-sheet__foot')) : 0;
  let lift = 0;
  const app = appOf(region);
  if (app?.hasAttribute('data-drawer-open') && viewOf(region).matchMedia?.(PHONE_QUERY).matches) lift = above(app.querySelector('.ds-drawer .ds-drawer__foot'));
  const theme = region.closest('.ds-theme');
  for (const bar of shownSavebars) if (bar.element.closest('.ds-theme') === theme) lift = Math.max(lift, bar.lift(region));
  return lift;
}

/** Writes (or removes) a region's --ds-toast-lift, owned while set. */
function writeLift(region, px) {
  const state = regionState(region);
  const style = /** @type {HTMLElement} */ (region).style;
  if (px > 0.5) {
    style.setProperty('--ds-toast-lift', `${round(px)}px`);
    if (!state.lifted) own(region, 'props', '--ds-toast-lift');
    state.lifted = true;
  } else {
    style.removeProperty('--ds-toast-lift');
    if (state.lifted) disown(region, 'props', '--ds-toast-lift');
    state.lifted = false;
  }
}

/** The lift of a region on the page changed (a save bar, the drawer): its messages glide there. */
function liftRegion(region) {
  const next = liftOf(region);
  const now = parseFloat(/** @type {HTMLElement} */ (region).style.getPropertyValue('--ds-toast-lift')) || 0;
  if (Math.abs(next - now) < 0.5) return;
  const state = regionState(region);
  glideRegion(region, next > now ? 'enter' : 'exit', () => writeLift(region, next)).then(() => reserveRoom(region, state));
}

/* ── Snackbars inside an open dialog or side sheet ───── */

/** Moves the region (and its announcers) before `before` in `parent`; focus inside stays. */
function moveRegion(region, parent, before) {
  const state = toastRegions.get(region);
  const active = activeIn(region);
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
  if (refocus && activeIn(refocus) !== refocus && canFocus(refocus)) refocus.focus({ preventScroll: true });
}

/**
 * Applies `move` (a DOM move, a new --ds-toast-left or --ds-toast-lift)
 * and lets the messages glide from where they are on screen to the new
 * place on both axes, through the region's own translate transition
 * (--ds-toast-shift and --ds-toast-shift-y: set, flushed, cleared) with the
 * timing of data-follow. A region without messages just moves, without
 * measuring; one whose place does not change by half a pixel on either
 * axis (phones, a dialog) moves without a glide. Resolves once the glide
 * ended.
 * @returns {Promise<void>}
 */
function glideRegion(region, direction, move) {
  const style = /** @type {HTMLElement} */ (region).style;
  const run = (followRuns.get(region) ?? 0) + 1;
  followRuns.set(region, run);
  // Nothing on screen to glide: it just moves, without a measurement or a
  // style flush, so opening a div-trap overlay does not lay the page out
  // once more before its inert changes invalidate it again.
  if (![...region.children].some((child) => child.matches('.ds-toast:not([data-ds-leaving])'))) {
    style.removeProperty('--ds-toast-shift');
    style.removeProperty('--ds-toast-shift-y');
    move();
    region.removeAttribute('data-follow');
    return Promise.resolve();
  }
  const transition = style.transition;
  const from = region.getBoundingClientRect();
  style.transition = 'none';
  style.removeProperty('--ds-toast-shift');
  style.removeProperty('--ds-toast-shift-y');
  move();
  const to = region.getBoundingClientRect();
  const dx = from.left - to.left;
  const dy = from.bottom - to.bottom;
  if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
    flushStyle(region);
    style.transition = transition;
    region.removeAttribute('data-follow');
    return Promise.resolve();
  }
  style.setProperty('--ds-toast-shift', `${round(dx)}px`);
  style.setProperty('--ds-toast-shift-y', `${round(dy)}px`);
  flushStyle(region);
  region.setAttribute('data-follow', direction);
  style.transition = transition;
  style.removeProperty('--ds-toast-shift');
  style.removeProperty('--ds-toast-shift-y');
  return settled(region, { transitions: true }).then(() => {
    if (followRuns.get(region) === run) region.removeAttribute('data-follow');
  });
}

/**
 * An opening dialog or side sheet takes in every .ds-toasts region of its
 * theme (with their announcers; not one inside a nested .ds-theme, an
 * embedded widget's), so a message shown meanwhile is above its
 * scrim and usable: in the top layer of a native one, outside the inert
 * page of the div trap. In a sheet --ds-toast-left becomes the panel's
 * resting left edge plus --ds-space-6 and --ds-toast-lift the height of
 * its foot, and the messages glide there; in a dialog the region keeps its
 * place. Closing ('exit'), each region glides back to its old place while
 * it stays inside: Chromium keeps a closing native dialog in the top
 * layer, so a region already on the page would fall under its leaving
 * scrim and panel. Once the exit settled ('settle'), it goes back to where
 * it was, with its --ds-toast-left; an open() during the exit glides it
 * back to the panel. Overlays over each other nest.
 * @param {Element} host
 * @param {'enter'|'exit'|'settle'} step
 */
function hostToasts(host, step) {
  const doc = host.ownerDocument;
  const theme = host.closest('.ds-theme');
  const scope = !theme || theme === doc.documentElement ? doc : theme;
  // Only the regions of its own theme: one inside a nested .ds-theme (an
  // embedded widget's) stays in its widget, under the modal like the rest of it.
  const regions = new Set([...scope.querySelectorAll('.ds-toasts')].filter((region) => !theme || region.closest('.ds-theme') === theme));
  // A hosted region is found even if it left the document meanwhile.
  if (step !== 'enter') for (const region of hostedRegions.keys()) regions.add(region);
  for (const region of regions) {
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

/** After a move of the region: the room for its messages that stay follows it to the new layer. */
function roomAfter(region, glide) {
  const state = toastRegions.get(region);
  if (!state) return;
  reserveRoom(region, state);
  glide.then(() => reserveRoom(region, state));
}

function followInto(region, host) {
  const homes = toastHomes.get(region) ?? [];
  const own = homes.find((home) => home.host === host);
  if (own) {
    // Reopened during its exit: the region is still inside, gliding back.
    if (own.leaving) {
      own.leaving = false;
      const left = hostedLeft(region, host);
      roomAfter(region, glideRegion(region, 'enter', () => {
        if (Number.isFinite(left)) /** @type {HTMLElement} */ (region).style.setProperty('--ds-toast-left', `${round(left)}px`);
        writeLift(region, liftOf(region));
      }));
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
  // Away from home, the region and its announcers carry data-ds-keep: a
  // re-render of the open dialog (or of the view holding it) keeps them.
  if (!hostedRegions.has(region)) {
    hostedRegions.set(region, [region, state?.polite, state?.assertive].filter((node) => node && node.parentNode === region.parentNode && keepAway(node)));
  }
  const sheetLeft = hostedLeft(region, host);
  const left = Number.isFinite(sheetLeft) ? sheetLeft : at;
  roomAfter(region, glideRegion(region, 'enter', () => {
    moveRegion(region, host, null);
    if (Number.isFinite(left)) /** @type {HTMLElement} */ (region).style.setProperty('--ds-toast-left', `${round(left)}px`);
    // Above the sheet's foot (none in a dialog), measured now that it is in.
    if (state) writeLift(region, liftOf(region));
  }));
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

/** Glides the region, still inside its host, to the left and the lift it has at `home`. */
function glideHome(region, home) {
  const lift = toastRegions.has(region) ? liftOf(region) : 0;
  roomAfter(region, glideRegion(region, 'exit', () => {
    if (Number.isFinite(home.at)) /** @type {HTMLElement} */ (region).style.setProperty('--ds-toast-left', `${round(home.at)}px`);
    if (toastRegions.has(region)) writeLift(region, lift);
  }));
}

/**
 * The regions a removed dialog or sheet took in go back to their place at
 * once (nothing to glide from: the host is gone).
 */
function releaseToasts(host) {
  const doc = host.ownerDocument;
  for (const region of new Set([...host.querySelectorAll('.ds-toasts'), ...doc.querySelectorAll('.ds-toasts')])) {
    const homes = toastHomes.get(region);
    const index = homes ? homes.findIndex((home) => home.host === host) : -1;
    if (index < 0) continue;
    if (index < homes.length - 1) {
      passHome(homes, index);
      continue;
    }
    homes[index].leaving = true;
    giveRegionBack(region, host, false);
  }
}

function giveRegionBack(region, host, glide = true) {
  const homes = toastHomes.get(region);
  const index = homes ? homes.findIndex((home) => home.host === host && home.leaving) : -1;
  if (!homes || index < 0) return;
  // An overlay opened during the exit took the region from this one.
  if (index < homes.length - 1) return passHome(homes, index);
  const home = homes[index];
  homes.pop();
  if (!homes.length) {
    toastHomes.delete(region);
    for (const node of hostedRegions.get(region) ?? []) keepHome(node, true);
    hostedRegions.delete(region);
  }
  const parent = home.parent.isConnected ? home.parent : host.parentNode;
  if (!parent) return;
  const move = () => {
    moveRegion(region, parent, home.next);
    const style = /** @type {HTMLElement} */ (region).style;
    if (home.left) style.setProperty('--ds-toast-left', home.left);
    else style.removeProperty('--ds-toast-left');
    if (toastRegions.has(region)) writeLift(region, liftOf(region));
  };
  // It already stands at its place: nothing moves, unless that place
  // changed meanwhile (a resize past the drawer's breakpoint), then it
  // glides. The room it kept in the dialog or sheet goes with it.
  roomAfter(region, glide ? glideRegion(region, 'exit', move) : (move(), Promise.resolve()));
}

/* The core calls these: an opening dialog or sheet takes the regions in, a save bar lifts them. */
internals.use('toast', {
  toast,
  announce,
  closeToasts,
  toastRegion,
  regionOfTheme,
  host: hostToasts,
  release: releaseToasts,
  lift: liftRegion,
  hosted: (region) => toastHomes.has(region),
});
