/**
 * Pointer ripple (components/ripple.css): a press on an action grows a
 * circle of its content colour from the point that was pressed, and fades
 * it once the press ends. Without attach() the flat state layer stays the
 * press feedback.
 *
 *   const ripples = DS.ripple.attach(document);   // once, for every action on the page
 *   ripples.detach();
 *
 * attach(root) adds .ds-ripples to the root element (<html> for document),
 * which positions and clips the hosts (ripple.css), and listens once on
 * the root: pointerdown for the pointer, Enter and Space for a centred
 * ripple on a focused host. Hosts: .ds-btn, .ds-chip (the ripple goes into
 * .ds-chip__body), .ds-segmented__option, .ds-drawer__item,
 * :is(button, a).ds-tile, .ds-table__sort and [data-ds-ripple];
 * data-ds-ripple="off" on a host or an ancestor opts out. Disabled, busy
 * and aria-disabled hosts, switch, checkbox and radio inputs, and presses
 * other than the primary button get none.
 *
 * The ripple is <span class="ds-press-ripple" aria-hidden="true"
 * data-ds-keep> with --ds-ripple-x / --ds-ripple-y (its centre, px from the
 * host's padding box) and --ds-ripple-r (the distance to the farthest
 * corner). At most one grows per host. On release it gets
 * .ds-press-ripple--out, not before --ds-dur-instant after the press, and
 * goes once its fade settled. The host carries .ds-pressed from the press
 * to the release, also at least --ds-dur-instant, so a quick click still
 * shows the whole press.
 *
 * iOS Safari applies :active only on pages with a touchstart listener:
 * attach() adds a passive one.
 *
 * ES2022 (Safari 16.4); a module may import from an earlier module (the
 * build bundles it into dist/ds.js as DS.ripple); newer APIs only behind
 * feature detection, named under Progressive:.
 */
import { motionDuration, settled } from './motion.js';

/** The actions that get a ripple (P3, P5 and P6 add more). */
const HOSTS = '.ds-btn, .ds-chip, .ds-segmented__option, .ds-drawer__item, :is(button, a).ds-tile, .ds-table__sort, [data-ds-ripple]';

/** Controls whose press is their own halo, not a ripple. */
const OWN_PRESS = 'input[type="checkbox"], input[type="radio"], .ds-switch';

/**
 * @typedef {object} Press
 * @property {HTMLElement} span  the ripple
 * @property {number} at  when it started (performance.now())
 * @property {boolean} released
 */

/** The growing ripple of each host. @type {WeakMap<Element, Press>} */
const presses = new WeakMap();

/** The handle of each attached root. @type {WeakMap<Node, { detach: () => void }>} */
const attached = new WeakMap();

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/** The host of an event target inside `root`, or null. */
function hostOf(target, root) {
  const element = target?.nodeType === 1 ? target : target?.parentElement;
  const host = element?.closest?.(HOSTS);
  if (!host || !root.contains(host)) return null;
  if (host.closest('[data-ds-ripple="off"]')) return null;
  return host;
}

/** Where the ripple goes: the chip's body, else the host itself. */
function surfaceOf(host) {
  return host.classList.contains('ds-chip') ? host.querySelector('.ds-chip__body') : host;
}

/** Hosts that take no press: disabled, aria-disabled, busy, a chip whose input is disabled. */
function inactive(host) {
  if (host.matches(':disabled') || host.getAttribute('aria-disabled') === 'true' || host.getAttribute('aria-busy') === 'true') return true;
  if (host.classList.contains('ds-chip')) {
    const input = host.querySelector('input');
    if (input?.disabled) return true;
  }
  return false;
}

/** Fades a ripple out and removes it once the fade settled. */
function fade(span) {
  span.classList.add('ds-press-ripple--out');
  settled(span, { event: 'transitionend', property: 'opacity' }).then(() => span.remove());
}

/**
 * Releases a press: the ripple fades out (not before --ds-dur-instant after
 * the press) and the host loses .ds-pressed, unless a newer press took over.
 */
function release(host, press) {
  if (press.released) return;
  press.released = true;
  const wait = Math.max(0, motionDuration(host, '--ds-dur-instant') - (now() - press.at));
  setTimeout(() => {
    if (presses.get(host) === press) {
      presses.delete(host);
      host.classList.remove('ds-pressed');
    }
    fade(press.span);
  }, wait);
}

/**
 * Starts a ripple on `host` at (x, y) in client coordinates, or centred
 * without them; returns the press.
 */
function start(host, x, y) {
  const surface = surfaceOf(host);
  if (!surface) return null;
  const view = surface.ownerDocument?.defaultView;
  // The defensive guard: a ripple outside a positioned host would escape it.
  if (view?.getComputedStyle(surface).position === 'static') return null;
  // One growing ripple per host: a new press fades the one still held.
  const previous = presses.get(host);
  if (previous && !previous.released) {
    previous.released = true;
    fade(previous.span);
  }
  const rect = surface.getBoundingClientRect();
  // The padding box, in the host's own (untransformed) pixels.
  const scaleX = surface.offsetWidth ? rect.width / surface.offsetWidth : 1;
  const scaleY = surface.offsetHeight ? rect.height / surface.offsetHeight : 1;
  const width = surface.clientWidth;
  const height = surface.clientHeight;
  const left = x === undefined ? width / 2 : (x - rect.left) / (scaleX || 1) - surface.clientLeft;
  const top = y === undefined ? height / 2 : (y - rect.top) / (scaleY || 1) - surface.clientTop;
  const radius = Math.hypot(Math.max(left, width - left), Math.max(top, height - top));
  const span = surface.ownerDocument.createElement('span');
  span.className = 'ds-press-ripple';
  span.setAttribute('aria-hidden', 'true');
  span.setAttribute('data-ds-keep', '');
  span.style.setProperty('--ds-ripple-x', `${Math.round(left * 100) / 100}px`);
  span.style.setProperty('--ds-ripple-y', `${Math.round(top * 100) / 100}px`);
  span.style.setProperty('--ds-ripple-r', `${Math.round(radius * 100) / 100}px`);
  surface.append(span);
  host.classList.add('ds-pressed');
  /** @type {Press} */
  const press = { span, at: now(), released: false };
  presses.set(host, press);
  return press;
}

/** Ends the press of `host`, if one is growing. */
function end(host) {
  const press = presses.get(host);
  if (press) release(host, press);
}

/** Enter activates buttons and links, Space buttons and inputs (not links, not on Enter for checkboxes). */
function activates(target, key) {
  if (key === ' ') return target.tagName !== 'A';
  if (key === 'Enter') return !target.matches?.('input[type="checkbox"], input[type="radio"]');
  return false;
}

/**
 * Adds the pointer ripple to every action inside `root` (delegated, so
 * actions rendered later have it too). Idempotent per root.
 * @param {Document|Element} [root]
 * @returns {{ detach: () => void }}
 */
export function attach(root = document) {
  const existing = attached.get(root);
  if (existing) return existing;
  const element = /** @type {Element} */ (root.nodeType === 9 ? /** @type {Document} */ (root).documentElement : root);
  const doc = element.ownerDocument;

  const onPointerDown = (/** @type {PointerEvent} */ event) => {
    if (event.button !== 0 || event.isPrimary === false) return;
    const host = hostOf(event.target, element);
    if (!host || inactive(host)) return;
    const target = /** @type {Element} */ (event.target);
    if (target.closest?.(OWN_PRESS) && !host.classList.contains('ds-chip')) return;
    if (!start(host, event.clientX, event.clientY)) return;
    const up = () => {
      host.removeEventListener('pointerleave', up);
      doc.removeEventListener('pointerup', up, true);
      doc.removeEventListener('pointercancel', up, true);
      end(host);
    };
    host.addEventListener('pointerleave', up);
    doc.addEventListener('pointerup', up, true);
    doc.addEventListener('pointercancel', up, true);
  };

  const onKeyDown = (/** @type {KeyboardEvent} */ event) => {
    if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
    const target = /** @type {Element} */ (event.target);
    const host = hostOf(target, element);
    if (!host || inactive(host) || !activates(target, event.key)) return;
    // The host itself, or the input of a chip (typing in a field inside a host is no press).
    if (target !== host && !(host.classList.contains('ds-chip') && target.tagName === 'INPUT')) return;
    if (!start(host)) return;
    const leave = () => {
      target.removeEventListener('blur', leave);
      end(host);
    };
    target.addEventListener('blur', leave);
  };

  const onKeyUp = (/** @type {KeyboardEvent} */ event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const host = hostOf(event.target, element);
    if (host) end(host);
  };

  // A passive no-op: iOS Safari applies :active only with a touchstart listener.
  const onTouchStart = () => {};

  element.classList.add('ds-ripples');
  element.addEventListener('pointerdown', onPointerDown);
  element.addEventListener('keydown', onKeyDown);
  element.addEventListener('keyup', onKeyUp);
  element.addEventListener('touchstart', onTouchStart, { passive: true });

  const handle = {
    /** Removes the listeners and .ds-ripples; ripples already shown finish. */
    detach() {
      if (attached.get(root) !== handle) return;
      attached.delete(root);
      element.removeEventListener('pointerdown', onPointerDown);
      element.removeEventListener('keydown', onKeyDown);
      element.removeEventListener('keyup', onKeyUp);
      element.removeEventListener('touchstart', onTouchStart);
      element.classList.remove('ds-ripples');
    },
  };
  attached.set(root, handle);
  return handle;
}
